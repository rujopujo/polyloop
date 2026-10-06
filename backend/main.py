"""
PolyLoop: FastAPI Backend Application
Serves REST API for Computer Vision, OpenCV pipeline, BFR hazard screening,
Physical Diagnostic Wizard, Thermal specs, LCA calculations, and ReportLab PDF passport.
Also serves the Frontend Web Application with static sample images.
"""
import os
import io
import re
import uuid
import base64
import time
from typing import Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, JSONResponse, FileResponse
from pydantic import BaseModel
import cv2
import numpy as np
from PIL import Image

# Import existing core domain engines
from core.polymer_kb import POLYMERS, APPLIANCE_PROFILES
from core.vision_engine import run_opencv_pipeline, parse_iso_tokens, detect_sample_casing_metadata
from core.bfr_engine import evaluate_bfr_hazard
from core.thermal_calculator import get_thermal_specs
from core.lca_engine import calculate_item_lca, calculate_batch_lca
from core.passport_generator import generate_passport_pdf

app = FastAPI(
    title="PolyLoop API Engine",
    description="Zero-Cost E-Waste Polymer Identification & Circular Upcycling REST Service",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_images"))
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

os.makedirs(SAMPLE_DIR, exist_ok=True)
os.makedirs(FRONTEND_DIR, exist_ok=True)

# Mount Sample Images static endpoint
app.mount("/sample_images", StaticFiles(directory=SAMPLE_DIR), name="sample_images")

# Helper to encode numpy/cv2 image as base64 JPEG
def np_to_base64_jpeg(np_arr: np.ndarray) -> str:
    # Ensure RGB
    if len(np_arr.shape) == 2:
        rgb = cv2.cvtColor(np_arr, cv2.COLOR_GRAY2RGB)
    else:
        rgb = np_arr
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    _, buffer = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
    b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

# --- Pydantic Request Models ---
class DiagnosticRequest(BaseModel):
    water_test: str
    saline_test: str
    dense_brine_test: str
    acetone_test: str
    limonene_test: str
    beilstein_test: str

class LCABatchRequest(BaseModel):
    composition: Dict[str, float]
    rejected_bfr_kg: float = 0.0

class PassportRequest(BaseModel):
    batch_id: str
    casing_type: str
    detected_polymer: str
    iso_stamp: str
    bfr_risk: float
    rohs_compliant: bool
    mass_kg: float = 1.0

# --- API Endpoints ---

@app.get("/api/samples")
def get_sample_images():
    """Returns all available sample images with metadata."""
    files = [f for f in os.listdir(SAMPLE_DIR) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    samples = []
    for f in sorted(files):
        meta = detect_sample_casing_metadata(f)
        samples.append({
            "filename": f,
            "url": f"/sample_images/{f}",
            "casing_name": meta["casing_name"],
            "appliance_type": meta["appliance_type"],
            "expected_polymer": meta["detected_polymer_heuristic"],
            "expected_stamp": meta["iso_stamp_expected"],
            "is_ifixit": f.startswith("ifixit_")
        })
    return {"samples": samples}

@app.post("/api/scan/stamp")
async def scan_stamp_image(
    file: Optional[UploadFile] = File(None),
    sample_filename: Optional[str] = Form(None),
    vintage_year: Optional[int] = Form(2012)
):
    """
    Executes the 5-stage OpenCV contrast enhancement pipeline on an e-waste casing image.
    Returns base64 data URLs for all 5 stages, detected ISO tokens, and BFR hazard scores.
    """
    img_pil = None
    source_name = "custom_upload.jpg"

    if file and file.filename:
        content = await file.read()
        img_pil = Image.open(io.BytesIO(content)).convert("RGB")
        source_name = file.filename
    elif sample_filename:
        fp = os.path.join(SAMPLE_DIR, sample_filename)
        if os.path.exists(fp):
            img_pil = Image.open(fp).convert("RGB")
            source_name = sample_filename
        else:
            raise HTTPException(status_code=404, detail="Sample image not found")
    else:
        # Default fallback to first sample
        samples = [f for f in os.listdir(SAMPLE_DIR) if f.endswith(".jpg")]
        if samples:
            fp = os.path.join(SAMPLE_DIR, samples[0])
            img_pil = Image.open(fp).convert("RGB")
            source_name = samples[0]
        else:
            raise HTTPException(status_code=400, detail="No image provided")

    # Run OpenCV pipeline
    cv_res = run_opencv_pipeline(img_pil)
    meta = detect_sample_casing_metadata(source_name)

    # BFR evaluation
    bfr_res = evaluate_bfr_hazard(
        appliance_type=meta["appliance_type"],
        vintage_year=vintage_year,
        has_fr40=meta["has_fr40"],
        iso_token=meta["iso_stamp_expected"]
    )

    # Thermal specs
    thermal_res = get_thermal_specs(meta["detected_polymer_heuristic"])

    # Base64 encoded stages for UI display
    stages_b64 = {
        "stage_1_original": np_to_base64_jpeg(cv_res["stage_1_original"]),
        "stage_2_clahe": np_to_base64_jpeg(cv_res["stage_2_clahe"]),
        "stage_3_bilateral": np_to_base64_jpeg(cv_res["stage_3_bilateral"]),
        "stage_4_gradient": np_to_base64_jpeg(cv_res["stage_4_gradient"]),
        "stage_5_otsu": np_to_base64_jpeg(cv_res["stage_5_otsu"])
    }

    return {
        "source_name": source_name,
        "metadata": meta,
        "bfr_evaluation": bfr_res,
        "thermal_specs": thermal_res,
        "stages": stages_b64
    }

@app.post("/api/diagnostic/wizard")
def evaluate_diagnostic_tree(req: DiagnosticRequest):
    """Processes stepwise sink-float and chemical solvent answers."""
    predicted = "ABS"
    confidence = 0.85
    notes = []
    is_hazard = False

    if "POSITIVE" in req.beilstein_test.upper():
        predicted = "BFR_CONTAMINATED"
        confidence = 0.98
        is_hazard = True
        notes.append("Positive Beilstein flame confirms volatile halogenated flame retardants or PVC.")
    elif "FLOAT" in req.water_test.upper():
        predicted = "PP"
        confidence = 0.95
        notes.append("Floating in pure water proves density < 1.00 g/cm³ (Aliphatic polyolefin).")
    elif "FLOAT" in req.saline_test.upper() or "GEL" in req.limonene_test.upper():
        predicted = "HIPS"
        confidence = 0.94 if "GEL" in req.limonene_test.upper() else 0.88
        notes.append("Buoyancy in 10% saline (ρ = 1.07) and dissolution in d-limonene confirm HIPS.")
    elif "SINK" in req.dense_brine_test.upper() and ("RESISTANT" in req.acetone_test.upper() or "HAZE" in req.acetone_test.upper()):
        predicted = "PC"
        confidence = 0.93
        notes.append("Rapid sinking in dense brine (ρ = 1.15) and chemical resistance to acetone confirm aromatic Polycarbonate.")
    elif "NEUTRAL" in req.dense_brine_test.upper():
        predicted = "PC-ABS"
        confidence = 0.90
        notes.append("Neutral density boundary in 1.15 brine and cloudy softening indicate PC-ABS alloy.")
    else:
        predicted = "ABS"
        confidence = 0.92
        notes.append("Floats in dense brine (ρ < 1.15) and forms instant tacky paste in acetone.")

    thermal = get_thermal_specs(predicted)

    return {
        "predicted_polymer": predicted,
        "confidence": confidence,
        "is_hazard": is_hazard,
        "notes": notes,
        "thermal_specs": thermal
    }

@app.get("/api/polymers")
def get_all_polymers():
    return {"polymers": POLYMERS, "appliances": APPLIANCE_PROFILES}

@app.post("/api/lca/batch")
def calculate_batch_metrics(req: LCABatchRequest):
    return calculate_batch_lca(req.composition, rejected_bfr_kg=req.rejected_bfr_kg)

@app.post("/api/passport/pdf")
def generate_passport(req: PassportRequest):
    specs = get_thermal_specs(req.detected_polymer)
    lca_item = calculate_item_lca(req.detected_polymer, req.mass_kg)
    pdf_bytes = generate_passport_pdf(
        batch_id=req.batch_id,
        casing_type=req.casing_type,
        detected_polymer=req.detected_polymer,
        iso_stamp=req.iso_stamp,
        bfr_risk=req.bfr_risk,
        rohs_compliant=req.rohs_compliant,
        thermal_specs=specs,
        lca_metrics=lca_item,
        mass_kg=req.mass_kg
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=PolyLoop_Passport_{req.batch_id}.pdf"}
    )

@app.post("/api/upload_image")
async def upload_custom_image(file: UploadFile = File(...)):
    """Allows uploading new user-provided e-waste images directly into the local site."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Empty filename")
    
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file.filename)
    dest_path = os.path.join(SAMPLE_DIR, clean_name)
    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)
        
    return {
        "status": "success",
        "filename": clean_name,
        "url": f"/sample_images/{clean_name}",
        "size": len(content)
    }

# Root index route to serve standalone white-mode web application
@app.get("/")
async def serve_root():
    standalone_path = os.path.join(FRONTEND_DIR, "index_standalone.html")
    if os.path.exists(standalone_path):
        return FileResponse(standalone_path)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# Mount Frontend static files
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

