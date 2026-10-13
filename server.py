"""
server.py — FastAPI Backend for ReForm E-Waste Identification System
===================================================================
Run locally with:
    uvicorn server:app --host 0.0.0.0 --port 7860 --reload
"""

import base64
import json
import os
from pathlib import Path
from typing import Optional

# Ensure headless matplotlib before any other imports
import matplotlib
matplotlib.use("Agg")

import cv2
import numpy as np
from PIL import Image
import io
from thefuzz import process as fuzz_process

# Silence TF logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mnv2_preprocess

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from gradcam import get_gradcam_heatmap, overlay_heatmap

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_ROOT   = Path(__file__).parent.resolve()
MODELS_DIR     = PROJECT_ROOT / "models"
STATIC_DIR     = PROJECT_ROOT / "static"
KB_PATH        = PROJECT_ROOT / "knowledge_base.json"
NP_ROUTES_PATH = PROJECT_ROOT / "nonplastic_routes.json"

IMG_SIZE       = 224
CONF_THRESHOLD = 0.70
PLASTIC_CLASS  = "plastic"

RESIN_CODES = [
    ">ABS<", ">PC+ABS<", ">PC<", ">PS<", ">HIPS<",
    ">PP<", ">PVC<", ">PE<", ">HDPE<", ">LDPE<",
    ">PET<", ">ABS+PC<"
]

LAST_CONV_LAYER = "out_relu"

# ── Cross-Platform Keras 2.15 Model Store Compatibility Patch ─────────────────
try:
    from keras.src.saving import saving_lib
    _orig_h5_get = saving_lib.H5IOStore.get
    def _safe_h5_get(self, path):
        res = _orig_h5_get(self, path)
        if not res and path:
            alt_path = path.replace("/", "\\") if "/" in path else path.replace("\\", "/")
            res = _orig_h5_get(self, alt_path)
        return res
    saving_lib.H5IOStore.get = _safe_h5_get
except Exception:
    pass

# ─────────────────────────────────────────────────────────────────────────────
# MODEL & RESOURCE SINGLETONS
# ─────────────────────────────────────────────────────────────────────────────

stage0_model = None
stage0_classes = []
stage1_model = None
stage1_classes = []
ocr_reader = None
kb_data = {}
np_routes_data = {}


def init_resources():
    global stage0_model, stage0_classes, stage1_model, stage1_classes
    global kb_data, np_routes_data

    # Load Knowledge Base
    if KB_PATH.exists():
        with open(KB_PATH, "r", encoding="utf-8") as f:
            kb_data = json.load(f)

    # Load Non-Plastic Routes
    if NP_ROUTES_PATH.exists():
        with open(NP_ROUTES_PATH, "r", encoding="utf-8") as f:
            np_routes_data = json.load(f)

    # Load Stage 0 Model
    s0_model_path = MODELS_DIR / "stage0_model.keras"
    s0_classes_path = MODELS_DIR / "stage0_classes.json"
    if s0_model_path.exists() and s0_classes_path.exists():
        try:
            stage0_model = tf.keras.models.load_model(str(s0_model_path), compile=False)
            with open(s0_classes_path, "r", encoding="utf-8") as f:
                stage0_classes = json.load(f)
            print("[INFO] Stage 0 model loaded successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to load Stage 0 model: {e}")

    # Load Stage 1 Model
    s1_model_path = MODELS_DIR / "stage1_model.keras"
    s1_classes_path = MODELS_DIR / "stage1_classes.json"
    if s1_model_path.exists() and s1_classes_path.exists():
        try:
            stage1_model = tf.keras.models.load_model(str(s1_model_path), compile=False)
            with open(s1_classes_path, "r", encoding="utf-8") as f:
                stage1_classes = json.load(f)
            print("[INFO] Stage 1 model loaded successfully.")
        except Exception as e:
            print(f"[ERROR] Failed to load Stage 1 model: {e}")


def get_ocr_reader():
    """Lazy-load EasyOCR to save memory until requested."""
    global ocr_reader
    if ocr_reader is None:
        print("[INFO] Lazy-loading EasyOCR reader…")
        import easyocr
        ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return ocr_reader


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE PROCESSING HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    """Decode raw bytes into uint8 BGR OpenCV image."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr_img is None:
        raise ValueError("Could not decode image from provided data.")
    return bgr_img


def parse_data_url(data_url: str) -> np.ndarray:
    """Parse base64 data URL (e.g. data:image/jpeg;base64,...) into BGR OpenCV image."""
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    image_bytes = base64.b64decode(data_url)
    return decode_image_bytes(image_bytes)


def preprocess_image(bgr_img: np.ndarray) -> tuple:
    resized = cv2.resize(bgr_img, (IMG_SIZE, IMG_SIZE))
    rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    rgb_uint8 = rgb.copy()
    tensor = mnv2_preprocess(rgb.astype("float32"))
    tensor = np.expand_dims(tensor, axis=0)
    return tensor, rgb_uint8


def run_inference(model, tensor: np.ndarray, class_names: list) -> tuple:
    preds = model.predict(tensor, verbose=0)[0]
    idx = int(np.argmax(preds))
    label = class_names[idx]
    confidence = float(preds[idx])
    probs = {class_names[i]: float(preds[i]) for i in range(len(class_names))}
    return label, confidence, probs, idx


def make_gradcam_overlay(model, tensor, rgb_uint8, class_idx):
    try:
        heatmap = get_gradcam_heatmap(model, tensor, class_idx, LAST_CONV_LAYER)
        return overlay_heatmap(rgb_uint8, heatmap, alpha=0.4)
    except Exception as e:
        print(f"[WARN] Grad-CAM error: {e}")
        return rgb_uint8


def img_to_base64_data_url(rgb_or_bgr_img: np.ndarray, is_rgb: bool = True, format: str = "jpeg") -> str:
    """Convert an image to a base64 Data URL string."""
    if is_rgb:
        bgr = cv2.cvtColor(rgb_or_bgr_img, cv2.COLOR_RGB2BGR)
    else:
        bgr = rgb_or_bgr_img
    _, buffer = cv2.imencode(f".{format}", bgr)
    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/{format};base64,{b64}"


def preprocess_for_ocr(bgr_img: np.ndarray) -> np.ndarray:
    h, w = bgr_img.shape[:2]
    y1, y2 = int(h * 0.15), int(h * 0.85)
    x1, x2 = int(w * 0.15), int(w * 0.85)
    cropped = bgr_img[y1:y2, x1:x2]

    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11, C=2
    )

    upscaled = cv2.resize(
        binary, (binary.shape[1] * 2, binary.shape[0] * 2),
        interpolation=cv2.INTER_CUBIC
    )
    return upscaled


def match_resin_code(ocr_texts: list) -> tuple:
    if not ocr_texts:
        return None, 0, ""

    def normalise(s):
        return s.upper().replace(">", "").replace("<", "").replace("+", "").replace("/", "").replace(" ", "").replace("-", "")

    normalised_codes = {normalise(c): c for c in RESIN_CODES}

    best_match_code = None
    best_score = 0
    best_raw = ""

    for raw_text, ocr_conf in ocr_texts:
        norm_text = normalise(raw_text)
        if not norm_text or len(norm_text) < 2:
            continue
        match, score = fuzz_process.extractOne(norm_text, list(normalised_codes.keys()))
        if score > best_score:
            best_score = score
            best_match_code = normalised_codes[match]
            best_raw = raw_text

    if best_score >= 68:
        return best_match_code, best_score, best_raw
    return None, best_score, best_raw


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ReForm E-Waste Identification API",
    description="Full-stack AI assistant for e-waste polymer identification, hazard evaluation & reuse routing",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup lifecycle
@app.on_event("startup")
def on_startup():
    init_resources()


# Static file serving
if not STATIC_DIR.exists():
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "ReForm API is active. Static UI files initializing…"}


@app.get("/manifest.webmanifest")
def serve_manifest():
    manifest_file = STATIC_DIR / "manifest.webmanifest"
    if manifest_file.exists():
        return FileResponse(
            manifest_file,
            media_type="application/manifest+json",
            headers={"Cache-Control": "public, max-age=3600"}
        )
    return JSONResponse(status_code=404, content={"error": "Manifest not found"})


@app.get("/sw.js")
def serve_sw():
    sw_file = STATIC_DIR / "sw.js"
    if sw_file.exists():
        return FileResponse(
            sw_file,
            media_type="application/javascript",
            headers={
                "Service-Worker-Allowed": "/",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    return JSONResponse(status_code=404, content={"error": "Service worker not found"})


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "stage0_loaded": stage0_model is not None,
        "stage1_loaded": stage1_model is not None,
        "stage0_classes": stage0_classes,
        "stage1_classes": stage1_classes,
        "resin_codes_count": len(RESIN_CODES)
    }


@app.post("/api/step1-classify")
async def step1_classify(
    file: Optional[UploadFile] = File(None),
    image_data: Optional[str] = Form(None)
):
    """
    Step 1: Material sorter (Stage 0) and Item Classifier (Stage 1).
    Accepts either multipart file upload OR base64 data URL.
    """
    if stage0_model is None:
        raise HTTPException(
            status_code=500,
            detail="Stage 0 model is not loaded. Verify models/stage0_model.keras exists."
        )

    try:
        if file is not None:
            content = await file.read()
            bgr_img = decode_image_bytes(content)
        elif image_data:
            bgr_img = parse_data_url(image_data)
        else:
            raise HTTPException(status_code=400, detail="No image provided.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    tensor, rgb_uint8 = preprocess_image(bgr_img)
    original_b64 = img_to_base64_data_url(rgb_uint8, is_rgb=True)

    # 1. Run Stage 0 (Material)
    s0_label, s0_conf, s0_probs, s0_idx = run_inference(stage0_model, tensor, stage0_classes)
    s0_overlay = make_gradcam_overlay(stage0_model, tensor, rgb_uint8, s0_idx)
    s0_overlay_b64 = img_to_base64_data_url(s0_overlay, is_rgb=True)

    is_plastic = (s0_label == PLASTIC_CLASS)
    below_threshold = (s0_conf < CONF_THRESHOLD)

    response = {
        "is_plastic": is_plastic,
        "below_threshold": below_threshold,
        "threshold": CONF_THRESHOLD,
        "original_preview": original_b64,
        "stage0": {
            "label": s0_label,
            "confidence": round(s0_conf, 4),
            "probabilities": {k: round(v, 4) for k, v in s0_probs.items()},
            "gradcam_overlay": s0_overlay_b64,
        }
    }

    # If Non-Plastic: lookup routing info
    if not is_plastic:
        route = np_routes_data.get(s0_label, np_routes_data.get("unknown", {}))
        response["nonplastic_route"] = {
            "label": route.get("label", s0_label.title()),
            "recovery_route": route.get("recovery_route", "E-waste processing"),
            "recovery_detail": route.get("recovery_detail", ""),
            "recyclable_note": route.get("recyclable_note", "Check with authorized recycler"),
            "hazards": route.get("hazards", []),
            "handling_rules": route.get("handling_rules", []),
            "reuse_options": route.get("reuse_options", []),
            "regulation_note": route.get("regulation_note", "Follow E-Waste (Management) Rules 2022."),
            "safety_warning": route.get("safety_warning", "") if s0_label == "battery" else None,
        }
        return response

    # If Plastic: run Stage 1 (Item Classifier)
    if stage1_model is not None and not below_threshold:
        s1_label, s1_conf, s1_probs, s1_idx = run_inference(stage1_model, tensor, stage1_classes)
        s1_overlay = make_gradcam_overlay(stage1_model, tensor, rgb_uint8, s1_idx)
        s1_overlay_b64 = img_to_base64_data_url(s1_overlay, is_rgb=True)

        # Fallback to other_plastic if low confidence or unknown
        effective_item = s1_label
        if s1_conf < CONF_THRESHOLD or s1_label == "unknown":
            effective_item = "other_plastic"

        item_data = kb_data.get(effective_item, kb_data.get("other_plastic", {}))
        typical_plastic = item_data.get("typical_plastic", "Unknown")

        response["stage1"] = {
            "label": s1_label,
            "effective_item": effective_item,
            "confidence": round(s1_conf, 4),
            "probabilities": {k: round(v, 4) for k, v in s1_probs.items()},
            "gradcam_overlay": s1_overlay_b64,
            "typical_plastic": typical_plastic,
            "bfr_risk": item_data.get("bfr_risk", "unknown"),
            "hazards": item_data.get("hazards", []),
            "handling_rules": item_data.get("handling_rules", []),
            "reuse_options": item_data.get("reuse_options", []),
            "recyclable_note": item_data.get("recyclable_note", ""),
            "regulation_note": item_data.get("regulation_note", ""),
        }

    return response


@app.post("/api/step2-ocr")
async def step2_ocr(
    file: Optional[UploadFile] = File(None),
    image_data: Optional[str] = Form(None)
):
    """
    Step 2: ISO 11469 Resin Code Reader.
    Applies computer vision filters (CLAHE, Adaptive Threshold), runs EasyOCR,
    and performs fuzzy matching against standard polymer codes.
    """
    try:
        if file is not None:
            content = await file.read()
            bgr_img = decode_image_bytes(content)
        elif image_data:
            bgr_img = parse_data_url(image_data)
        else:
            raise HTTPException(status_code=400, detail="No image provided.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    reader = get_ocr_reader()

    # Preprocess with CLAHE & threshold
    preprocessed = preprocess_for_ocr(bgr_img)
    preprocessed_b64 = img_to_base64_data_url(preprocessed, is_rgb=False)

    # Run EasyOCR
    raw_results = reader.readtext(preprocessed, detail=1)
    ocr_texts = [(r[1].strip(), float(r[2])) for r in raw_results if r[2] > 0.08]
    ocr_texts = sorted(ocr_texts, key=lambda x: x[1], reverse=True)

    matched_code, fuzz_score, raw_matched = match_resin_code(ocr_texts)

    # Polymer lookup in knowledge base
    plastic_data = {}
    if matched_code:
        clean_key = matched_code.replace(">", "").replace("<", "").split("+")[0]
        plastic_data = kb_data.get("_plastic_types", {}).get(clean_key, {})

    return {
        "success": matched_code is not None,
        "matched_code": matched_code,
        "fuzzy_score": fuzz_score,
        "raw_text_matched": raw_matched,
        "preprocessed_preview": preprocessed_b64,
        "ocr_findings": [{"text": t, "confidence": round(c, 3)} for t, c in ocr_texts],
        "plastic_info": plastic_data
    }
