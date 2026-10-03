"""Batch aggregation and lifecycle telemetry endpoints."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.models import BatchItem, BatchRecord, ScanRecord
from app.database.session import get_db
from app.schemas.batch import BatchCreateRequest, BatchMetricsResponse, BatchRecordResponse, PolymerCompositionMetric
from app.services.lca_engine import calculate_batch_impact
from app.services.passport_pdf import generate_material_passport_pdf

router = APIRouter(prefix="/batches", tags=["Batches"])


@router.post("", response_model=BatchRecordResponse)
def create_batch(payload: BatchCreateRequest, db: Session = Depends(get_db)):
    """Create a new recycling batch session, associate verified scans, compute LCA impact, and generate passport."""

    # Fetch scan items
    scan_ids = [item.scan_id for item in payload.items]
    scans = db.query(ScanRecord).filter(ScanRecord.id.in_(scan_ids)).all()
    scan_map = {s.id: s for s in scans}

    impact_items = []
    total_mass = 0.0

    for item in payload.items:
        s = scan_map.get(item.scan_id)
        poly = s.detected_polymer if s else payload.polymer_type
        status = s.status if s else "APPROVED"
        impact_items.append({
            "polymer": poly,
            "mass_kg": item.mass_kg,
            "status": status
        })
        total_mass += item.mass_kg

    # Calculate batch metrics
    lca_summary = calculate_batch_impact(impact_items)

    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"
    batch = BatchRecord(
        id=batch_id,
        name=payload.name,
        polymer_type=payload.polymer_type,
        total_mass_kg=lca_summary["total_inflow_mass_kg"],
        usable_mass_kg=lca_summary["usable_mass_kg"],
        rejected_mass_kg=lca_summary["rejected_mass_kg"],
        co2_avoided_kg=lca_summary["net_co2_avoided_kg"],
        oil_saved_liters=lca_summary["crude_oil_saved_liters"],
        passport_pdf_path=None
    )
    db.add(batch)
    db.flush()

    # Add items
    for item in payload.items:
        batch_item = BatchItem(
            id=str(uuid.uuid4()),
            batch_id=batch_id,
            scan_id=item.scan_id,
            item_mass_kg=item.mass_kg
        )
        db.add(batch_item)

    db.commit()
    db.refresh(batch)

    # Automatically generate Digital Material Passport PDF
    try:
        scans_info = [
            {
                "casing_type": scan_map[item.scan_id].casing_type if item.scan_id in scan_map else "Casing",
                "vintage_era": scan_map[item.scan_id].vintage_era if item.scan_id in scan_map else "Unknown",
                "identification_method": scan_map[item.scan_id].identification_method if item.scan_id in scan_map else "MANUAL",
                "iso_stamp_text": scan_map[item.scan_id].iso_stamp_text if item.scan_id in scan_map else None,
                "bfr_risk_score": scan_map[item.scan_id].bfr_risk_score if item.scan_id in scan_map else 0.05,
                "status": scan_map[item.scan_id].status if item.scan_id in scan_map else "APPROVED"
            }
            for item in payload.items
        ]
        pdf_path = generate_material_passport_pdf(
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
            scans_data=scans_info
        )
        batch.passport_pdf_path = pdf_path
        db.commit()
        db.refresh(batch)
    except Exception:
        # Don't fail batch creation if PDF has an issue
        pass

    return batch


@router.get("", response_model=List[BatchRecordResponse])
def get_all_batches(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve all logged batch sessions."""
    return db.query(BatchRecord).order_by(BatchRecord.created_at.desc()).limit(limit).all()


@router.get("/{batch_id}", response_model=BatchRecordResponse)
def get_batch_detail(batch_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a single batch."""
    batch = db.query(BatchRecord).filter(BatchRecord.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch session not found.")
    return batch


@router.get("/{batch_id}/metrics", response_model=BatchMetricsResponse)
def get_batch_metrics(batch_id: str, db: Session = Depends(get_db)):
    """Return live LCA and circularity charts data for Recharts."""
    batch = db.query(BatchRecord).filter(BatchRecord.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch session not found.")

    items = db.query(BatchItem).filter(BatchItem.batch_id == batch_id).all()
    impact_items = []
    rejection_count = 0

    for bi in items:
        scan = db.query(ScanRecord).filter(ScanRecord.id == bi.scan_id).first()
        status = scan.status if scan else "APPROVED"
        poly = scan.detected_polymer if scan else batch.polymer_type
        if status == "REJECTED":
            rejection_count += 1
        impact_items.append({
            "polymer": poly,
            "mass_kg": bi.item_mass_kg,
            "status": status
        })

    if not impact_items:
        impact_items = [{
            "polymer": batch.polymer_type,
            "mass_kg": batch.total_mass_kg or 10.0,
            "status": "APPROVED"
        }]

    lca = calculate_batch_impact(impact_items)

    composition_breakdown = [
        PolymerCompositionMetric(**c) for c in lca["composition_breakdown"]
    ]

    return BatchMetricsResponse(
        batch_id=batch.id,
        batch_name=batch.name,
        target_polymer=batch.polymer_type,
        created_at=batch.created_at,
        total_inflow_mass_kg=lca["total_inflow_mass_kg"],
        usable_mass_kg=lca["usable_mass_kg"],
        rejected_mass_kg=lca["rejected_mass_kg"],
        net_co2_avoided_kg=lca["net_co2_avoided_kg"],
        crude_oil_saved_liters=lca["crude_oil_saved_liters"],
        coal_offset_kg=lca["coal_offset_kg"],
        km_driven_offset=lca["km_driven_offset"],
        circularity_yield_percent=lca["circularity_yield_percent"],
        virgin_resin_carbon_kg=lca["virgin_resin_carbon_kg"],
        polyloop_process_carbon_kg=lca["polyloop_process_carbon_kg"],
        composition_breakdown=composition_breakdown,
        rohs_rejection_count=rejection_count
    )
