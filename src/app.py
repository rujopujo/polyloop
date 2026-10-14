"""
app.py — E-Waste Plastic Identification and Reuse System
=========================================================
Run with:
    conda activate reform
    streamlit run app.py

Workflow:
    Step 1  →  Capture item photo
               Stage 0: material sorter (plastic / metal / PCB / ...)
               Stage 1: item classifier (keyboard / mouse / ...) — only if plastic
               Grad-CAM heatmap overlay shown for both stages

    Step 2  →  Capture resin-code photo (close-up of the moulded marking)
               OpenCV preprocessing → EasyOCR → fuzzy match → polymer identified

    Result  →  Material, item, plastic type, hazards, handling rules,
               reuse options, regulation note
"""

import json
import os
from pathlib import Path

import cv2
import numpy as np
import streamlit as st
from PIL import Image
from thefuzz import process as fuzz_process

import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mnv2_preprocess

try:
    from .gradcam import get_gradcam_heatmap, overlay_heatmap
except (ImportError, ValueError):
    try:
        from src.gradcam import get_gradcam_heatmap, overlay_heatmap
    except (ImportError, ModuleNotFoundError):
        from gradcam import get_gradcam_heatmap, overlay_heatmap

# ── Silence TF logs ──────────────────────────────────────────────────────────
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_ROOT   = Path(__file__).resolve().parent.parent if Path(__file__).resolve().parent.name == "src" else Path(__file__).resolve().parent
MODELS_DIR     = PROJECT_ROOT / "models"
DATA_DIR       = PROJECT_ROOT / "data"

KB_PATH        = DATA_DIR / "knowledge_base.json"
if not KB_PATH.exists():
    KB_PATH = PROJECT_ROOT / "knowledge_base.json"

NP_ROUTES_PATH = DATA_DIR / "nonplastic_routes.json"
if not NP_ROUTES_PATH.exists():
    NP_ROUTES_PATH = PROJECT_ROOT / "nonplastic_routes.json"

IMG_SIZE        = 224
CONF_THRESHOLD  = 0.70   # below this → ask for retake
PLASTIC_CLASS   = "plastic"   # must match Stage 0 folder name

# ISO 11469 resin codes we can recognise
RESIN_CODES = [">ABS<", ">PC+ABS<", ">PC<", ">PS<", ">HIPS<",
               ">PP<", ">PVC<", ">PE<", ">HDPE<", ">LDPE<",
               ">PET<", ">ABS+PC<"]

# Last conv layer name for Grad-CAM (MobileNetV2)
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
# LOAD RESOURCES  (cached so they load once, not on every Streamlit rerun)
# ─────────────────────────────────────────────────────────────────────────────

@st.cache_resource(show_spinner="Loading Stage 0 model…")
def load_stage0():
    model_path = MODELS_DIR / "stage0_model.keras"
    classes_path = MODELS_DIR / "stage0_classes.json"
    if not model_path.exists():
        return None, []
    model = tf.keras.models.load_model(str(model_path), compile=False)
    with open(classes_path) as f:
        classes = json.load(f)
    return model, classes


@st.cache_resource(show_spinner="Loading Stage 1 model…")
def load_stage1():
    model_path = MODELS_DIR / "stage1_model.keras"
    classes_path = MODELS_DIR / "stage1_classes.json"
    if not model_path.exists():
        return None, []
    model = tf.keras.models.load_model(str(model_path), compile=False)
    with open(classes_path) as f:
        classes = json.load(f)
    return model, classes


@st.cache_resource(show_spinner="Loading EasyOCR…")
def load_ocr():
    import easyocr
    return easyocr.Reader(["en"], gpu=False, verbose=False)


@st.cache_data
def load_knowledge_base():
    with open(KB_PATH, encoding="utf-8") as f:
        return json.load(f)


@st.cache_data
def load_nonplastic_routes():
    with open(NP_ROUTES_PATH, encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def pil_to_bgr(pil_img: Image.Image) -> np.ndarray:
    """Convert a PIL image to a uint8 BGR numpy array (OpenCV format)."""
    rgb = np.array(pil_img.convert("RGB"), dtype=np.uint8)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def preprocess_image(bgr_img: np.ndarray) -> tuple:
    """
    Resize, convert BGR→RGB, apply MobileNetV2 preprocessing.

    Returns:
        tensor       : float32 (1, IMG_SIZE, IMG_SIZE, 3) ready for model.predict
        rgb_uint8    : uint8  (IMG_SIZE, IMG_SIZE, 3) for display and Grad-CAM overlay
    """
    resized   = cv2.resize(bgr_img, (IMG_SIZE, IMG_SIZE))
    rgb       = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    rgb_uint8 = rgb.copy()
    tensor    = mnv2_preprocess(rgb.astype("float32"))
    tensor    = np.expand_dims(tensor, axis=0)
    return tensor, rgb_uint8


def run_inference(model, tensor: np.ndarray, class_names: list) -> tuple:
    """
    Run model.predict and return (label, confidence, all_probs).

    Returns:
        label      : str — predicted class name
        confidence : float in [0, 1]
        probs      : dict {class_name: probability}
    """
    preds      = model.predict(tensor, verbose=0)[0]
    idx        = int(np.argmax(preds))
    label      = class_names[idx]
    confidence = float(preds[idx])
    probs      = {class_names[i]: float(preds[i]) for i in range(len(class_names))}
    return label, confidence, probs


def make_gradcam_overlay(model, tensor, rgb_uint8, class_idx):
    """
    Return Grad-CAM overlay as a uint8 RGB image.
    Falls back gracefully if Grad-CAM fails (wrong layer name, shape issue).
    """
    try:
        heatmap = get_gradcam_heatmap(model, tensor, class_idx, LAST_CONV_LAYER)
        return overlay_heatmap(rgb_uint8, heatmap, alpha=0.4)
    except Exception as e:
        st.warning(f"Grad-CAM unavailable: {e}")
        return rgb_uint8


# ─────────────────────────────────────────────────────────────────────────────
# OCR HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def preprocess_for_ocr(bgr_img: np.ndarray) -> np.ndarray:
    """
    OpenCV pipeline to make resin codes easier to read:
      1. Crop centre 60% (resin codes are usually near the centre of the casing)
      2. Grayscale
      3. CLAHE contrast enhancement
      4. Adaptive thresholding
      5. Upscale 2× (EasyOCR prefers larger text)

    Returns a grayscale uint8 image ready for EasyOCR.
    """
    h, w = bgr_img.shape[:2]

    # Crop to centre 60%
    y1, y2 = int(h * 0.20), int(h * 0.80)
    x1, x2 = int(w * 0.20), int(w * 0.80)
    cropped = bgr_img[y1:y2, x1:x2]

    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)

    # CLAHE — improves contrast in low-light shots
    clahe    = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Adaptive threshold — handles uneven lighting across the plastic surface
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11, C=2,
    )

    # Upscale 2× — EasyOCR reads small text better at higher resolution
    upscaled = cv2.resize(binary, (binary.shape[1] * 2, binary.shape[0] * 2),
                          interpolation=cv2.INTER_CUBIC)
    return upscaled


def run_ocr(reader, bgr_img: np.ndarray) -> list:
    """
    Run EasyOCR on the preprocessed image.
    Returns a list of (text, confidence) tuples, sorted by confidence descending.
    """
    processed = preprocess_for_ocr(bgr_img)
    results   = reader.readtext(processed, detail=1)
    # results: list of ([bbox], text, confidence)
    texts = [(r[1].strip(), float(r[2])) for r in results if r[2] > 0.1]
    return sorted(texts, key=lambda x: x[1], reverse=True)


def match_resin_code(ocr_texts: list) -> tuple:
    """
    Fuzzy-match OCR output against known ISO 11469 resin codes.

    EasyOCR may read ">ABS<" as "ABS", ">PC+ABS<" as "PCABS" etc.
    We normalise both sides before matching.

    Returns:
        (matched_code, score, raw_text) or (None, 0, '') if no match above threshold.
    """
    if not ocr_texts:
        return None, 0, ""

    # Normalise: remove > < / + whitespace for fuzzy comparison
    def normalise(s):
        return s.upper().replace(">", "").replace("<", "").replace("+", "").replace("/", "").replace(" ", "")

    normalised_codes = {normalise(c): c for c in RESIN_CODES}

    best_match_code = None
    best_score      = 0
    best_raw        = ""

    for raw_text, ocr_conf in ocr_texts:
        norm_text = normalise(raw_text)
        if not norm_text:
            continue
        match, score = fuzz_process.extractOne(norm_text, list(normalised_codes.keys()))
        if score > best_score:
            best_score      = score
            best_match_code = normalised_codes[match]
            best_raw        = raw_text

    # Require fuzzy score ≥ 70 to accept the match
    if best_score >= 70:
        return best_match_code, best_score, best_raw
    return None, best_score, best_raw


# ─────────────────────────────────────────────────────────────────────────────
# RESULT DISPLAY
# ─────────────────────────────────────────────────────────────────────────────

def show_nonplastic_result(material_class: str, routes: dict, confidence: float):
    """Display routing information for non-plastic materials."""
    route = routes.get(material_class, routes.get("unknown"))

    st.success(f"**Material detected:** {route['label']}  \n"
               f"Confidence: {confidence*100:.0f}%")

    if material_class == "battery":
        st.error("⚠️ **HAZARDOUS ITEM** — " + route.get("safety_warning", ""))

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Recovery route**")
        st.info(route["recovery_route"])
        st.markdown(route.get("recovery_detail", ""))

        st.markdown("**Recyclable?**")
        st.write(route["recyclable_note"])

    with col2:
        st.markdown("**⚠️ Hazards**")
        for h in route["hazards"]:
            st.markdown(f"- {h}")

        st.markdown("**Handling rules**")
        for r in route["handling_rules"]:
            st.markdown(f"- {r}")

    if route.get("reuse_options"):
        with st.expander("Reuse options"):
            for opt in route["reuse_options"]:
                st.markdown(f"- {opt}")

    st.markdown("---")
    st.caption("📋 **Regulation note:** " + route["regulation_note"])


def show_plastic_result(item_class: str, plastic_type: str,
                        item_confidence: float, kb: dict,
                        ocr_source: str = "stage1_guess"):
    """Display full result for a plastic item."""
    item_data    = kb.get(item_class, kb.get("other_plastic"))
    plastic_data = kb.get("_plastic_types", {}).get(
        plastic_type.replace(">", "").replace("<", "").split("+")[0],
        {}
    )

    # ── Header ───────────────────────────────────────────────────────────────
    st.success(
        f"**Item identified:** {item_class.replace('_', ' ').title()}  \n"
        f"Confidence: {item_confidence*100:.0f}%"
    )

    # Polymer identification banner
    if ocr_source == "ocr_confirmed":
        st.info(f"🔬 **Plastic type (OCR confirmed):** {plastic_type}")
    else:
        st.warning(
            f"🔬 **Plastic type (estimated):** {item_data.get('typical_plastic', 'Unknown')}  \n"
            "_Polymer type is estimated from the item type — not confirmed from a photo alone. "
            "Use Step 2 to scan the resin code for a confirmed identification._"
        )
        plastic_type = item_data.get("typical_plastic", "Unknown")

    # BFR warning banner
    bfr_risk = item_data.get("bfr_risk", "unknown")
    if bfr_risk in ("high", "very high"):
        st.error(
            f"🔥 **Brominated Flame Retardant (BFR) risk: {bfr_risk.upper()}**  \n"
            "Do not burn or incinerate. Wear gloves and a mask. "
            "Send to an authorised e-waste recycler."
        )
    elif bfr_risk == "medium":
        st.warning(f"⚠️ **BFR risk: medium** — Handle with gloves. Do not burn.")

    st.markdown("---")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**⚠️ Hazards**")
        for h in item_data.get("hazards", []):
            st.markdown(f"- {h}")

        st.markdown("**Handling & safety rules**")
        for r in item_data.get("handling_rules", []):
            st.markdown(f"- {r}")

    with col2:
        st.markdown("**♻️ Reuse options**")
        for opt in item_data.get("reuse_options", []):
            st.markdown(f"- {opt}")

        st.markdown("**Recyclable?**")
        st.write(item_data.get("recyclable_note", "—"))

        if plastic_data:
            st.markdown("**Plastic properties**")
            st.write(plastic_data.get("notes", "—"))

    st.markdown("---")
    st.caption("📋 **Regulation note:** " + item_data.get("regulation_note", "—"))


# ─────────────────────────────────────────────────────────────────────────────
# CONFIDENCE BAR
# ─────────────────────────────────────────────────────────────────────────────

def confidence_bar(label: str, confidence: float, threshold: float = CONF_THRESHOLD):
    """Render a labelled confidence bar with a threshold marker."""
    color = "green" if confidence >= threshold else "orange"
    bar_html = f"""
    <div style="margin-bottom:8px;">
      <span style="font-size:0.9em;">{label}: <b>{confidence*100:.1f}%</b></span>
      <div style="background:#e0e0e0;border-radius:4px;height:12px;width:100%;">
        <div style="background:{color};width:{confidence*100:.1f}%;height:12px;
                    border-radius:4px;"></div>
      </div>
      <span style="font-size:0.75em;color:#888;">threshold: {threshold*100:.0f}%</span>
    </div>
    """
    st.markdown(bar_html, unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN APP
# ─────────────────────────────────────────────────────────────────────────────

def main():
    # ── Page config ──────────────────────────────────────────────────────────
    st.set_page_config(
        page_title="ReForm — E-Waste Identifier",
        page_icon="♻️",
        layout="wide",
    )

    st.title("♻️ ReForm — E-Waste Plastic Identification")
    st.caption(
        "Take a photo of an e-waste item to identify its material, item type, "
        "plastic polymer, hazards, and best reuse or recycling route."
    )

    # ── Load resources ────────────────────────────────────────────────────────
    s0_model, s0_classes = load_stage0()
    s1_model, s1_classes = load_stage1()
    ocr_reader           = load_ocr()
    kb                   = load_knowledge_base()
    np_routes            = load_nonplastic_routes()

    # Check models are present
    if s0_model is None:
        st.error(
            "**Stage 0 model not found.**  \n"
            f"Expected: `{MODELS_DIR / 'stage0_model.keras'}`  \n"
            "Train the model in Colab and extract `reform_models.zip` to the `models/` folder."
        )
        st.stop()

    if s1_model is None:
        st.warning(
            "Stage 1 model not found — item classification within plastic will be skipped.  \n"
            f"Expected: `{MODELS_DIR / 'stage1_model.keras'}`"
        )

    # ── Session state — persists across Streamlit reruns ─────────────────────
    # We store results so Step 2 can display Step 1 results alongside OCR output.
    if "s0_result" not in st.session_state:
        st.session_state.s0_result    = None   # (label, confidence, overlay_img)
    if "s1_result" not in st.session_state:
        st.session_state.s1_result    = None   # (label, confidence, overlay_img)
    if "plastic_type" not in st.session_state:
        st.session_state.plastic_type = None   # confirmed via OCR or estimated
    if "ocr_source" not in st.session_state:
        st.session_state.ocr_source   = "stage1_guess"

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 1 — Item photo
    # ══════════════════════════════════════════════════════════════════════════
    st.markdown("## Step 1 — Photograph the e-waste item")
    st.markdown(
        "Point the camera at the item. Make sure the item fills most of the frame "
        "and the background is plain if possible."
    )

    img_source_1 = st.radio(
        "Image source", ["Camera", "Upload file"], key="src1", horizontal=True
    )

    uploaded_1 = None
    if img_source_1 == "Camera":
        uploaded_1 = st.camera_input("Take a photo of the item", key="cam1")
    else:
        uploaded_1 = st.file_uploader(
            "Upload item photo", type=["jpg", "jpeg", "png", "bmp"], key="up1"
        )

    if uploaded_1 is not None:
        pil_img = Image.open(uploaded_1)
        bgr_img = pil_to_bgr(pil_img)
        tensor, rgb_uint8 = preprocess_image(bgr_img)

        # ── Stage 0: material classification ─────────────────────────────────
        with st.spinner("Analysing material…"):
            s0_label, s0_conf, s0_probs = run_inference(s0_model, tensor, s0_classes)

        col_img, col_result = st.columns([1, 1])

        with col_img:
            # Grad-CAM overlay
            s0_idx     = s0_classes.index(s0_label)
            s0_overlay = make_gradcam_overlay(s0_model, tensor, rgb_uint8, s0_idx)
            st.image(s0_overlay, caption="Stage 0 — Grad-CAM (what the model focused on)",
                     use_column_width=True)

        with col_result:
            st.markdown("**Stage 0 — Material classification**")
            confidence_bar(s0_label, s0_conf)

            # Low confidence → request retake
            if s0_conf < CONF_THRESHOLD:
                st.warning(
                    f"⚠️ **Not sure** (confidence {s0_conf*100:.0f}% < {CONF_THRESHOLD*100:.0f}%)  \n"
                    "Please retake the photo with better lighting and the item "
                    "filling most of the frame."
                )
                # Reset downstream state
                st.session_state.s0_result    = None
                st.session_state.s1_result    = None
                st.session_state.plastic_type = None

            else:
                st.session_state.s0_result = (s0_label, s0_conf, s0_overlay)

                # Probability breakdown
                with st.expander("All class probabilities"):
                    for cls, prob in sorted(s0_probs.items(), key=lambda x: -x[1]):
                        st.markdown(f"- **{cls}**: {prob*100:.1f}%")

                # ── Route non-plastic materials ───────────────────────────────
                if s0_label != PLASTIC_CLASS:
                    st.info(
                        f"**This item is not plastic** — detected as **{s0_label}**.  \n"
                        "See the recovery route below. Stage 1 and Step 2 do not apply."
                    )
                    show_nonplastic_result(s0_label, np_routes, s0_conf)
                    # Clear any plastic state from a previous run
                    st.session_state.s1_result    = None
                    st.session_state.plastic_type = None

                # ── Plastic → Stage 1 ─────────────────────────────────────────
                else:
                    st.success("✅ Plastic detected — running item classifier…")

                    if s1_model is None:
                        st.warning("Stage 1 model not loaded — skipping item classification.")
                        st.session_state.s1_result = None
                    else:
                        with st.spinner("Classifying item…"):
                            s1_label, s1_conf, s1_probs = run_inference(
                                s1_model, tensor, s1_classes
                            )

                        st.markdown("**Stage 1 — Item classification**")
                        confidence_bar(s1_label, s1_conf)

                        if s1_conf < CONF_THRESHOLD or s1_label == "unknown":
                            st.warning(
                                f"⚠️ **Item not recognised** (confidence {s1_conf*100:.0f}%)  \n"
                                "The item was classified as plastic but the specific type "
                                "could not be identified. Results will use generic plastic guidance. "
                                "Try a clearer photo."
                            )
                            # Use 'other_plastic' as fallback
                            s1_label = "other_plastic"
                            s1_conf  = s1_conf

                        # Grad-CAM for Stage 1
                        s1_idx     = s1_classes.index(s1_label) if s1_label in s1_classes else 0
                        s1_overlay = make_gradcam_overlay(s1_model, tensor, rgb_uint8, s1_idx)
                        st.image(s1_overlay,
                                 caption="Stage 1 — Grad-CAM",
                                 use_column_width=True)

                        with st.expander("All Stage 1 probabilities"):
                            for cls, prob in sorted(s1_probs.items(), key=lambda x: -x[1]):
                                st.markdown(f"- **{cls}**: {prob*100:.1f}%")

                        st.session_state.s1_result = (s1_label, s1_conf, s1_overlay)

                        # Set estimated plastic type from knowledge base
                        item_data = kb.get(s1_label, kb.get("other_plastic", {}))
                        st.session_state.plastic_type = item_data.get(
                            "typical_plastic", "Unknown"
                        )
                        st.session_state.ocr_source = "stage1_guess"

                        # Show preliminary result (may be updated by Step 2)
                        st.markdown("---")
                        st.markdown("### Preliminary result")
                        st.caption(
                            "_Polymer type below is estimated. Complete Step 2 to confirm "
                            "it from the resin code._"
                        )
                        show_plastic_result(
                            s1_label,
                            st.session_state.plastic_type,
                            s1_conf,
                            kb,
                            ocr_source="stage1_guess",
                        )

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 2 — Resin code OCR
    # ══════════════════════════════════════════════════════════════════════════
    st.markdown("---")
    st.markdown("## Step 2 — Scan the resin code (optional but recommended)")
    st.markdown(
        "Look for a small triangle symbol with a number and letters moulded into the plastic "
        "(usually on the underside or inside the casing). Take a close-up photo of it.  \n"
        "_Example markings: `>ABS<`, `>PC+ABS<`, `>PP<`, `>PVC<`_"
    )

    # Only show Step 2 if Step 1 detected plastic
    s1_result = st.session_state.get("s1_result")
    s0_result = st.session_state.get("s0_result")

    if s0_result is None:
        st.info("Complete Step 1 first.")
    elif s0_result[0] != PLASTIC_CLASS:
        st.info("Step 2 applies to plastic items only. This item was identified as non-plastic.")
    else:
        img_source_2 = st.radio(
            "Image source", ["Camera", "Upload file"], key="src2", horizontal=True
        )

        uploaded_2 = None
        if img_source_2 == "Camera":
            uploaded_2 = st.camera_input(
                "Take a close-up of the resin marking", key="cam2"
            )
        else:
            uploaded_2 = st.file_uploader(
                "Upload resin code photo", type=["jpg", "jpeg", "png", "bmp"], key="up2"
            )

        if uploaded_2 is not None:
            pil_img2 = Image.open(uploaded_2)
            bgr_img2 = pil_to_bgr(pil_img2)

            with st.spinner("Running OCR…"):
                ocr_texts = run_ocr(ocr_reader, bgr_img2)

            col_ocr1, col_ocr2 = st.columns([1, 1])

            with col_ocr1:
                # Show preprocessed image so the user can see what OCR saw
                processed_preview = preprocess_for_ocr(bgr_img2)
                st.image(processed_preview,
                         caption="Preprocessed image sent to OCR",
                         use_column_width=True, clamp=True)

            with col_ocr2:
                st.markdown("**OCR raw output**")
                if ocr_texts:
                    for text, conf in ocr_texts:
                        st.markdown(f"- `{text}` — {conf*100:.0f}%")
                else:
                    st.warning("No text detected.")

                matched_code, fuzz_score, raw_text = match_resin_code(ocr_texts)

                if matched_code:
                    st.success(
                        f"✅ **Resin code matched:** `{matched_code}`  \n"
                        f"Raw OCR text: `{raw_text}` — fuzzy match score: {fuzz_score}%"
                    )
                    st.session_state.plastic_type = matched_code
                    st.session_state.ocr_source   = "ocr_confirmed"
                else:
                    st.warning(
                        "⚠️ **No resin code matched.**  \n"
                        f"Best OCR text: `{raw_text or 'none'}` — fuzzy score: {fuzz_score}%  \n"
                        "Tips: move closer, improve lighting, try a different angle. "
                        "The estimated polymer type from Step 1 will be used instead."
                    )

            # ── Final result with OCR-confirmed polymer ───────────────────────
            if s1_result is not None:
                s1_label, s1_conf, _ = s1_result
                st.markdown("---")
                st.markdown("### Final result")
                show_plastic_result(
                    s1_label,
                    st.session_state.plastic_type,
                    s1_conf,
                    kb,
                    ocr_source=st.session_state.ocr_source,
                )

    # ── Footer ────────────────────────────────────────────────────────────────
    st.markdown("---")
    st.caption(
        "**ReForm** — E-Waste Plastic Identification and Reuse System  \n"
        "This tool provides guidance only. Regulation notes are indicative — "
        "verify against current local rules before acting. "
        "Fields marked VERIFY/CITE in the knowledge base need a real source."
    )


if __name__ == "__main__":
    main()
