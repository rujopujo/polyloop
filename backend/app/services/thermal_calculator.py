"""Thermal and extrusion parameters calculator for closed-loop 3D printing filament production."""

from typing import Any, Dict, Optional

from app.services.polymer_kb import get_polymer_profile, normalize_polymer_code


def get_thermal_and_extrusion_specs(polymer_code: str) -> Optional[Dict[str, Any]]:
    """Retrieve full thermal extrusion and FDM printing specifications for a verified polymer."""
    profile = get_polymer_profile(polymer_code)
    if not profile:
        canonical = normalize_polymer_code(polymer_code)
        profile = get_polymer_profile(canonical)

    if not profile:
        # Fallback to ABS-like safe conservative defaults
        return {
            "pre_drying_temp_c": 80,
            "pre_drying_hours": "3 to 4 hours",
            "max_moisture_ppm": 500,
            "extruder_feed_zone1_c": "180°C – 190°C",
            "extruder_transition_zone2_c": "210°C – 220°C",
            "extruder_die_zone3_c": "220°C – 230°C",
            "cooling_water_bath_c": "50°C – 60°C",
            "fdm_nozzle_temp_c": "230°C – 245°C",
            "fdm_bed_temp_c": "90°C – 105°C",
            "build_plate_interface": "PEI build sheet with adhesion promoter",
            "chamber_temp_c": "Enclosed chamber (40°C – 50°C)",
            "part_cooling_fan": "10% – 20%",
            "volumetric_shrinkage": "0.4% – 0.7%",
            "extrusion_failure_mode_if_undried": "Steam bubbling, surface voiding, and weak layer shear resistance"
        }

    return profile["thermal_specs"]
