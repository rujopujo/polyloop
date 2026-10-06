"""
PolyLoop: Brominated Flame Retardant (BFR) & RoHS Hazard Scoring Engine
Deterministic regulatory compliance and hazard evaluation under EU RoHS 2011/65/EU,
EU POPs Regulation 2019/1021, and WEEE Directive 2012/19/EU Annex VII.
"""
from core.polymer_kb import APPLIANCE_PROFILES


def evaluate_bfr_hazard(appliance_type, vintage_year=None, has_fr40=False, iso_token=""):
    """
    Computes quantitative risk score (0.0 to 1.0) and regulatory status.
    
    Parameters:
    - appliance_type: str key in APPLIANCE_PROFILES
    - vintage_year: int or str (e.g. 1998, 2012, 2021)
    - has_fr40: bool flag if FR(40) halogen code was found in OCR
    - iso_token: raw extracted string token
    """
    profile = APPLIANCE_PROFILES.get(appliance_type, APPLIANCE_PROFILES["desktop_chassis"])
    base_risk = profile["base_bfr_risk"]
    
    # 1. Direct ISO Code Override
    if has_fr40 or "FR(40)" in iso_token.upper() or "FR40" in iso_token.upper():
        final_risk = 0.99
        risk_tier = "CRITICAL HAZARD"
        rohs_compliant = False
        pops_compliant = False
        status = "REJECTED (WEEE HAZARDOUS QUARANTINE)"
        recommendation = (
            "HALOGENATED FLAME RETARDANT DETECTED (ISO 1043-4 FR(40) = Brominated Flame Retardant + Sb2O3). "
            "Exceeds EU RoHS 1,000 ppm threshold (>120,000 ppm typical load). Thermal extrusion strictly prohibited! "
            "Route to high-temperature WEEE hazardous waste incineration."
        )
        return {
            "risk_score": final_risk,
            "risk_tier": risk_tier,
            "rohs_compliant": rohs_compliant,
            "pops_compliant": pops_compliant,
            "status": status,
            "recommendation": recommendation,
            "estimated_pbde_ppm": "> 15,000 ppm (BFR Compound)",
            "primary_flame_retardants": "DecaBDE / OctaBDE + Antimony Trioxide (Sb2O3)"
        }
    
    # 2. Vintage Year Adjustment
    risk = base_risk
    if vintage_year is not None:
        try:
            year = int(vintage_year)
            if year < 2004:
                # Pre-RoHS legacy era (heavy DecaBDE/OctaBDE usage)
                risk = min(0.95, risk + 0.20)
            elif 2004 <= year <= 2011:
                # Early RoHS transition era
                risk = min(0.80, risk + 0.05)
            elif year > 2015:
                # Modern phase-out era (organophosphorus or halogen-free)
                risk = max(0.04, risk - 0.15)
        except (ValueError, TypeError):
            pass
            
    # Risk Tier assignment
    if risk >= 0.70:
        risk_tier = "CRITICAL HAZARD"
        rohs_compliant = False
        pops_compliant = False
        status = "REJECTED (WEEE HAZARDOUS QUARANTINE)"
        recommendation = (
            "CRITICAL BFR CONTAMINATION PROBABILITY. Vintage and casing class correlate with high DecaBDE loads. "
            "Do not melt-extrude into 3D filament. Divert to certified WEEE hazardous reclamation stream."
        )
        pbde_ppm = "2,000 - 15,000 ppm (Exceeds RoHS/POPs limit)"
    elif risk >= 0.40:
        risk_tier = "HIGH RISK"
        rohs_compliant = False
        pops_compliant = False
        status = "CONDITIONAL HOLD (REQUIRE BEILSTEIN TEST)"
        recommendation = (
            "ELEVATED FLAME RETARDANT RISK. Internal fuser/power zones frequently contain TBBPA. "
            "Mandatory dense brine sink-float and copper-wire Beilstein flame test required prior to shredding."
        )
        pbde_ppm = "800 - 2,500 ppm (Threshold risk)"
    elif risk >= 0.20:
        risk_tier = "MODERATE RISK"
        rohs_compliant = True
        pops_compliant = True
        status = "APPROVED (VERIFY MOLD MARKING)"
        recommendation = (
            "MODERATE HAZARD PROFILE. Check ISO 11469 stamp. If devoid of FR markings, cleared for washing and pre-drying."
        )
        pbde_ppm = "< 300 ppm (Within safe margin)"
    else:
        risk_tier = "MINIMAL RISK"
        rohs_compliant = True
        pops_compliant = True
        status = "APPROVED FOR MECHANICAL UPCYCLING"
        recommendation = (
            "EXCELLENT FEEDSTOCK CANDIDATE. Compliant with EU RoHS (2011/65/EU) and EU POPs (2019/1021). "
            "Proceed with granulation, moisture extraction, and single-screw extrusion."
        )
        pbde_ppm = "< 50 ppm (Undetectable / Halogen-Free)"

    return {
        "risk_score": round(risk, 2),
        "risk_tier": risk_tier,
        "rohs_compliant": rohs_compliant,
        "pops_compliant": pops_compliant,
        "status": status,
        "recommendation": recommendation,
        "estimated_pbde_ppm": pbde_ppm,
        "primary_flame_retardants": profile["common_flame_retardants"]
    }
