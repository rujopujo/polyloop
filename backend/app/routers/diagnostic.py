"""Diagnostic decision wizard endpoints for degraded or un-stamped plastics."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.models import ScanRecord
from app.database.session import get_db
from app.schemas.scan import DiagnosticWizardRequest, DiagnosticWizardResponse
from app.services.bfr_engine import evaluate_bfr_hazard
from app.services.polymer_kb import normalize_polymer_code
from app.services.thermal_calculator import get_thermal_and_extrusion_specs

router = APIRouter(prefix="/diagnostic", tags=["Diagnostic"])


@router.post("/wizard", response_model=DiagnosticWizardResponse)
def execute_diagnostic_wizard(payload: DiagnosticWizardRequest, db: Session = Depends(get_db)):
    """Evaluate stepwise density, solvent, and flame tests to deduce polymer type deterministically."""

    reasoning = []
    polymer = "UNKNOWN"
    confidence = 0.50

    # 1. Tap Water Density Stratification (rho = 1.00 g/cm3)
    if payload.water_test == "floats":
        polymer = "PP"
        confidence = 0.95
        reasoning.append("Floats in pure tap water (density < 0.96 g/cm³): Characteristic of neat Polyolefins (PP / PE).")
    else:
        reasoning.append("Sinks in pure tap water (density > 1.00 g/cm³): Confirms engineering styrenic or polycarbonate matrix.")

        # 2. 10% NaCl Saline Solution Test (rho = 1.07 g/cm3)
        if payload.nacl_test == "floats":
            reasoning.append("Floats in 10% NaCl saline bath (1.03 <= density <= 1.05 g/cm³): High probability candidate for HIPS.")
            # 3. Chemical Solvent Spot Confirmation
            if payload.limonene_reaction == "dissolves_gel":
                polymer = "HIPS"
                confidence = 0.98
                reasoning.append("d-Limonene terpene dissolved plastic into clear viscous gel: 100% pathognomonic confirmation of High-Impact Polystyrene (HIPS).")
            elif payload.acetone_reaction == "slow_swell":
                polymer = "HIPS"
                confidence = 0.92
                reasoning.append("Acetone resulted in surface swelling without instantaneous tackiness: Consistent with HIPS matrix.")
            else:
                polymer = "HIPS"
                confidence = 0.85
        elif payload.nacl_test == "sinks":
            reasoning.append("Sinks in 10% NaCl saline bath (density > 1.07 g/cm³): Rules out HIPS; specimen is ABS, PC-ABS, or pure PC.")

            # Dense Brine Test (rho = 1.15 g/cm3)
            if payload.brine_test == "floats":
                reasoning.append("Floats in dense brine (1.05 <= density <= 1.08 g/cm³): Typical virgin ABS boundary.")
                if payload.acetone_reaction == "tacky_paste":
                    polymer = "ABS"
                    confidence = 0.98
                    reasoning.append("Acetone spot reaction produced immediate sticky, tacky paste: Nitrile group solvation confirms Acrylonitrile Butadiene Styrene (ABS).")
                else:
                    polymer = "ABS"
                    confidence = 0.88
            elif payload.brine_test == "neutral":
                polymer = "PC-ABS"
                confidence = 0.90
                reasoning.append("Specimen exhibited neutral buoyancy in dense brine (rho ~ 1.12–1.15 g/cm³): Characteristic of PC-ABS alloy.")
            elif payload.brine_test == "sinks":
                reasoning.append("Sinks rapidly in dense brine (density > 1.18 g/cm³): High density indicates either Pure Polycarbonate (PC) or heavy Brominated Flame Retardants.")
                if payload.acetone_reaction in ["minor_haze", "resistant"]:
                    polymer = "PC"
                    confidence = 0.94
                    reasoning.append("Specimen is highly resistant to acetone (faint surface haze only): Confirms Polycarbonate (PC).")
                else:
                    polymer = "PC-ABS"
                    confidence = 0.80

    # 4. Beilstein Flame Test Evaluation
    beilstein_green = (payload.beilstein_flame == "green")
    if beilstein_green:
        reasoning.append("CRITICAL HAZARD: Copper wire flame test produced bright emerald green flame: Confirms presence of toxic halogens (Brominated Flame Retardants).")

    # Evaluate BFR hazard & RoHS compliance
    hazard_info = evaluate_bfr_hazard(
        casing_type=payload.casing_type or "unknown_housing",
        vintage_era=payload.vintage_era,
        beilstein_green=beilstein_green
    )

    final_status = hazard_info["status"]
    if polymer == "UNKNOWN":
        final_status = "REJECTED"
        reasoning.append("Uncertain polymer classification: Commingling risks structural delamination under Flory-Huggins thermodynamic criteria.")

    # Save to database
    record_id = str(uuid.uuid4())
    scan_record = ScanRecord(
        id=record_id,
        casing_type=payload.casing_type or "diagnostic_chip",
        vintage_era=payload.vintage_era or "Unknown",
        identification_method="SINK_FLOAT_WIZARD",
        detected_polymer=polymer,
        confidence=confidence,
        iso_stamp_text=None,
        bfr_risk_score=hazard_info["bfr_risk_score"],
        rohs_compliant=hazard_info["rohs_compliant"],
        status=final_status,
        recommended_action=hazard_info["recommended_action"]
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)

    thermal_specs = get_thermal_and_extrusion_specs(polymer) if final_status == "APPROVED" else None

    return DiagnosticWizardResponse(
        scan_id=record_id,
        polymer_detected=polymer,
        confidence=confidence,
        bfr_risk_score=hazard_info["bfr_risk_score"],
        hazard_tier=hazard_info["hazard_tier"],
        rohs_compliant=hazard_info["rohs_compliant"],
        status=final_status,
        reasoning=reasoning,
        recommended_action=hazard_info["recommended_action"],
        thermal_specs=thermal_specs
    )
