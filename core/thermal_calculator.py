"""
PolyLoop: Thermal Rheology & 3D Printing Extrusion Calculator
Computes pre-drying parameters, 3-zone single-screw extruder profiles,
and FDM 3D printer slicer configurations for post-consumer recycled e-waste resins.
"""
from core.polymer_kb import POLYMERS

def get_thermal_specs(polymer_key):
    """
    Returns complete thermodynamic and extrusion profile for the given polymer.
    """
    key = polymer_key.upper().strip()
    if "PC+ABS" in key or "PC-ABS" in key:
        clean_key = "PC-ABS"
    elif "HIPS" in key or "PS-HI" in key:
        clean_key = "HIPS"
    elif "ABS" in key and "FR" not in key:
        clean_key = "ABS"
    elif "PC" in key and "ABS" not in key:
        clean_key = "PC"
    elif "PP" in key:
        clean_key = "PP"
    elif "FR" in key or "BFR" in key:
        clean_key = "BFR_CONTAMINATED"
    else:
        clean_key = "ABS"

    p_data = POLYMERS.get(clean_key, POLYMERS["ABS"])
    
    return {
        "polymer_key": clean_key,
        "full_name": p_data["full_name"],
        "category": p_data["category"],
        "tg_celsius": p_data["tg_celsius"],
        "drying": p_data["drying"],
        "extrusion": p_data["extrusion"],
        "fdm_3d_print": p_data["fdm_3d_print"],
        "miscibility_note": p_data["miscibility_note"]
    }
