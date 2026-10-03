"""Scan endpoints for electronic casing classification and ISO resin mold stamp OCR."""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.models import ScanRecord
from app.database.session import get_db
from app.schemas.scan import CasingScanResponse, ScanRecordResponse, StampScanResponse
from app.services.bfr_engine import evaluate_bfr_hazard
from app.services.ocr_service import scan_stamp_image
from app.services.polymer_kb import normalize_polymer_code
from app.services.thermal_calculator import get_thermal_and_extrusion_specs
from app.services.vision_service import classify_casing_image

router = APIRouter(prefix="/scan", tags=["Scan"])


@router.post("/casing", response_model=CasingScanResponse)
async def scan_casing_endpoint(file: UploadFile = File(...)):
    """Classify e-waste component type (monitor backing, printer panel, CRT, etc.) using YOLOv8."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    try:
        result = classify_casing_image(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Casing classification failed: {str(e)}")


@router.post("/stamp", response_model=StampScanResponse)
async def scan_stamp_endpoint(
    file: UploadFile = File(...),
    casing_type: str = Form("desktop_chassis"),
    vintage_era: Optional[str] = Form("2000-2015"),
    db: Session = Depends(get_db)
):
    """Enhance ROI with OpenCV 5-step pipeline, run EasyOCR for ISO marks, evaluate BFR risk, and log scan."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    try:
        ocr_result = scan_stamp_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    polymer = normalize_polymer_code(ocr_result["polymer_detected"])
    if polymer == "UNKNOWN":
        polymer = "ABS" if ocr_result["iso_stamp_found"] else "UNKNOWN"

    # Evaluate BFR Risk
    hazard_info = evaluate_bfr_hazard(
        casing_type=casing_type,
        vintage_era=vintage_era,
        ocr_raw_text=ocr_result["raw_ocr_text"]
    )

    # If polymer is unknown, status cannot be approved until diagnosed
    final_status = hazard_info["status"]
    if polymer == "UNKNOWN":
        final_status = "PENDING_DIAGNOSIS"

    # Save to SQLite
    record_id = str(uuid.uuid4())
    scan_record = ScanRecord(
        id=record_id,
        casing_type=casing_type,
        vintage_era=vintage_era or "Unknown",
        identification_method="OCR_STAMP",
        detected_polymer=polymer,
        confidence=ocr_result["confidence"],
        iso_stamp_text=ocr_result["iso_stamp_text"],
        bfr_risk_score=hazard_info["bfr_risk_score"],
        rohs_compliant=hazard_info["rohs_compliant"],
        status=final_status,
        recommended_action=hazard_info["recommended_action"]
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)

    thermal_specs = get_thermal_and_extrusion_specs(polymer) if final_status == "APPROVED" else None

    return StampScanResponse(
        scan_id=record_id,
        polymer_detected=polymer,
        confidence=ocr_result["confidence"],
        raw_ocr_text=ocr_result["raw_ocr_text"],
        iso_stamp_found=ocr_result["iso_stamp_found"],
        iso_stamp_text=ocr_result["iso_stamp_text"],
        flame_retardant_code=ocr_result["flame_retardant_code"],
        bfr_risk_score=hazard_info["bfr_risk_score"],
        hazard_tier=hazard_info["hazard_tier"],
        rohs_compliant=hazard_info["rohs_compliant"],
        status=final_status,
        recommended_action=hazard_info["recommended_action"],
        thermal_specs=thermal_specs,
        preprocessed_image_base64=ocr_result["preprocessed_image_base64"]
    )


@router.get("/recent", response_model=List[ScanRecordResponse])
def get_recent_scans(limit: int = 20, db: Session = Depends(get_db)):
    """Retrieve recent scans log."""
    scans = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).limit(limit).all()
    return scans
