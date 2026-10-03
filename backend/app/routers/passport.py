"""Passport download and Polymer Knowledge Base reference endpoints."""

import os
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import TEST_STAMPS_DIR
from app.database.models import BatchItem, BatchRecord, ScanRecord
from app.database.session import get_db
from app.services.passport_pdf import generate_material_passport_pdf
from app.services.polymer_kb import POLYMER_DATABASE, get_polymer_profile

router = APIRouter(tags=["Passport & KB"])


@router.get("/passport/{batch_id}/pdf")
def download_batch_passport(batch_id: str, db: Session = Depends(get_db)):
    """Generate and stream the official ReportLab Digital Material Passport PDF."""
    batch = db.query(BatchRecord).filter(BatchRecord.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch session not found.")

    # Find associated scans
    items = db.query(BatchItem).filter(BatchItem.batch_id == batch_id).all()
    scans_data = []
    for bi in items:
        scan = db.query(ScanRecord).filter(ScanRecord.id == bi.scan_id).first()
        if scan:
            scans_data.append({
                "casing_type": scan.casing_type,
                "vintage_era": scan.vintage_era,
                "identification_method": scan.identification_method,
                "iso_stamp_text": scan.iso_stamp_text,
                "bfr_risk_score": scan.bfr_risk_score,
                "status": scan.status
            })

    # Generate fresh PDF
    pdf_path_str = generate_material_passport_pdf(
        batch_data={
            "id": batch.id,
            "name": batch.name,
            "polymer_type": batch.polymer_type,
            "total_mass_kg": batch.total_mass_kg,
            "usable_mass_kg": batch.usable_mass_kg,
            "rejected_mass_kg": batch.rejected_mass_kg,
            "co2_avoided_kg": batch.co2_avoided_kg,
            "oil_saved_liters": batch.oil_saved_liters
        },
        scans_data=scans_data
    )

    if not os.path.exists(pdf_path_str):
        raise HTTPException(status_code=500, detail="Failed to locate compiled PDF document.")

    return FileResponse(
        path=pdf_path_str,
        media_type="application/pdf",
        filename=f"PolyLoop_Passport_{batch.id}.pdf"
    )


@router.get("/kb/polymers")
def get_all_polymer_profiles() -> Dict[str, Any]:
    """Return all polymer reference profiles and thermal boundaries."""
    return POLYMER_DATABASE


@router.get("/kb/polymers/{code}")
def get_single_polymer_profile(code: str) -> Dict[str, Any]:
    """Return reference profile and thermal specs for a specific polymer."""
    profile = get_polymer_profile(code)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Polymer code '{code}' not recognized in knowledge base.")
    return profile


@router.get("/samples/test-stamps")
def list_synthetic_stamp_samples() -> List[Dict[str, str]]:
    """List pre-generated synthetic stamp images for quick frontend testing."""
    if not TEST_STAMPS_DIR.exists():
        return []

    samples = []
    for file in TEST_STAMPS_DIR.glob("*.png"):
        samples.append({
            "filename": file.name,
            "name": file.stem.replace("_", " ").title(),
            "url": f"/api/samples/test-stamps/{file.name}"
        })
    return samples


@router.get("/samples/test-stamps/{filename}")
def get_sample_stamp_file(filename: str):
    """Serve a synthetic sample image."""
    file_path = TEST_STAMPS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample image not found.")
    return FileResponse(path=str(file_path), media_type="image/png")
