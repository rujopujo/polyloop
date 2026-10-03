"""BFR (Brominated Flame Retardants) & RoHS Hazard Scoring Engine."""

from typing import Any, Dict, Optional

from app.core.constants import APPLIANCE_BASELINE_RISK, FLAME_RETARDANT_CODES, POPS_PBDE_LIMIT_PPM, ROHS_PBDE_LIMIT_PPM


def evaluate_bfr_hazard(
    casing_type: str,
    vintage_era: Optional[str] = None,
    color: Optional[str] = "dark_gray",
    ocr_raw_text: Optional[str] = "",
    beilstein_green: bool = False
) -> Dict[str, Any]:
    """Calculate quantitative BFR contamination risk score and regulatory compliance status."""

    # 1. Baseline appliance risk
    appliance_data = APPLIANCE_BASELINE_RISK.get(casing_type, {
        "label": "Generic Electronic Housing",
        "era": vintage_era or "Unknown",
        "base_risk": 0.25,
        "hazard_tier": "MODERATE",
        "primary_polymers": ["ABS", "HIPS"],
        "recommended_action": "Standard density screening and thermal drying required."
    })

    risk = appliance_data["base_risk"]
    notes = [f"Baseline appliance typology risk for '{casing_type}': {risk:.2f}"]

    # 2. Manufacturing era heuristics
    era_str = (vintage_era or appliance_data.get("era", "")).lower()
    if "pre-2006" in era_str or "199" in era_str or "2000" in era_str or "2005" in era_str:
        if risk < 0.85 and casing_type in ["crt_housing", "laser_printer"]:
            risk = max(risk, 0.85)
            notes.append("Legacy manufacturing era (pre-RoHS DecaBDE era) elevates base risk to critical tier.")
    elif "2016" in era_str or "present" in era_str:
        risk = min(risk, 0.10)
        notes.append("Modern manufacturing era (post-POPs ban) adheres to organophosphorus/halogen-free standards.")

    # 3. Color heuristic: Dark gray and black flame-retarded bezels frequently harbor additive BFRs
    if color and any(c in color.lower() for c in ["black", "dark", "gray", "charcoal"]):
        if casing_type in ["crt_housing", "laser_printer", "desktop_chassis"]:
            risk = min(1.0, risk + 0.05)
            notes.append("Dark pigmented enclosure indicates potential carbon black / brominated flame retardant masterbatch.")

    # 4. Check for ISO 1043-4 Flame Retardant stamps
    detected_fr_code = None
    if ocr_raw_text:
        text_upper = ocr_raw_text.upper()
        for code, details in FLAME_RETARDANT_CODES.items():
            if code in text_upper:
                detected_fr_code = code
                if code == "FR(40)":
                    risk = 0.99
                    notes.append("ISO 1043-4 FR(40) stamp detected: Halogenated compounds with Antimony Trioxide (Sb2O3). Mandatory regulatory rejection.")
                else:
                    risk = max(risk, details["hazard_score"])
                    notes.append(f"ISO 1043-4 {code} stamp detected: {details['description']}")
                break

    # 5. Beilstein flame test check
    if beilstein_green:
        risk = 0.99
        notes.append("Beilstein copper wire flame test yielded bright emerald green: Copper halide formation confirms hazardous chlorine or bromine presence.")

    # Determine hazard tier and status
    if risk >= 0.70:
        hazard_tier = "CRITICAL"
        rohs_compliant = False
        status = "REJECTED"
        recommended_action = "CRITICAL HAZARD: Reject for mechanical upcycling; route to specialized high-temperature WEEE hazardous waste disposal."
    elif risk >= 0.40:
        hazard_tier = "HIGH"
        rohs_compliant = False
        status = "REJECTED"
        recommended_action = "HIGH RISK: Commingling prohibited under RoHS. Require density stratification and laboratory XRF/Beilstein verification before recycling."
    elif risk >= 0.20:
        hazard_tier = "MODERATE"
        rohs_compliant = True
        status = "APPROVED"
        recommended_action = "MODERATE RISK: Verify absence of FR(40) markings; clean thoroughly and extrude with active local exhaust ventilation."
    elif risk >= 0.06:
        hazard_tier = "LOW"
        rohs_compliant = True
        status = "APPROVED"
        recommended_action = "LOW RISK: Approved for direct mechanical granulation, convective drying, and single-screw 3D filament extrusion."
    else:
        hazard_tier = "MINIMAL"
        rohs_compliant = True
        status = "APPROVED"
        recommended_action = "MINIMAL RISK: Clean, high-purity polymer casing. Ideal closed-loop feedstock for 1.75mm FDM filament."

    return {
        "bfr_risk_score": round(min(1.0, max(0.0, risk)), 2),
        "hazard_tier": hazard_tier,
        "rohs_compliant": rohs_compliant,
        "status": status,
        "detected_fr_code": detected_fr_code,
        "recommended_action": recommended_action,
        "audit_notes": notes,
        "regulatory_limits": {
            "rohs_pbde_limit_ppm": ROHS_PBDE_LIMIT_PPM,
            "pops_pbde_limit_ppm": POPS_PBDE_LIMIT_PPM
        }
    }
