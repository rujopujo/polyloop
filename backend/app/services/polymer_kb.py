"""Polymer Knowledge Base (PKB) containing physical constants, solubility, and thermal properties."""

from typing import Any, Dict, Optional

POLYMER_DATABASE: Dict[str, Dict[str, Any]] = {
    "ABS": {
        "name": "Acrylonitrile Butadiene Styrene",
        "code": "ABS",
        "iso_marking": ">ABS<",
        "density_range": "1.05 – 1.08 g/cm³",
        "density_min": 1.05,
        "density_max": 1.08,
        "glass_transition_tg_c": 105,
        "melting_point_c": "Amorphous (Processing 220–240°C)",
        "flory_huggins_miscibility_note": (
            "Polar SAN copolymer continuous phase with grafted polybutadiene rubber. "
            "Severely incompatible with non-polar HIPS (chi > 0, >70% impact strength drop at 3-5% cross-contamination). "
            "Partially miscible with Polycarbonate to form engineering alloys."
        ),
        "tap_water_test": "Sinks (rho = 1.00 g/cm³)",
        "nacl_10pct_test": "Sinks (rho = 1.07 g/cm³)",
        "dense_brine_test": "Floats cleanly (rho = 1.15 g/cm³)",
        "acetone_reaction": "Dissolves rapidly into a sticky, tacky paste within 10–30 seconds",
        "d_limonene_reaction": "Chemically inert; zero swelling or dissolution",
        "flame_behavior": "Burns with luminous yellow flame, blue base, produces black smoke and acrid burnt rubber scent",
        "thermal_specs": {
            "pre_drying_temp_c": 80,
            "pre_drying_hours": "3 to 4 hours",
            "max_moisture_ppm": 500,  # < 0.05%
            "extruder_feed_zone1_c": "185°C – 195°C",
            "extruder_transition_zone2_c": "215°C – 225°C",
            "extruder_die_zone3_c": "225°C – 235°C",
            "cooling_water_bath_c": "50°C – 60°C (warm bath)",
            "fdm_nozzle_temp_c": "230°C – 245°C",
            "fdm_bed_temp_c": "95°C – 110°C",
            "build_plate_interface": "Smooth PEI with Dimafix or ABS slurry",
            "chamber_temp_c": "Passive enclosure (40°C – 50°C)",
            "part_cooling_fan": "0% – 15% (preserves layer adhesion)",
            "volumetric_shrinkage": "0.4% – 0.7% (high warp risk)",
            "extrusion_failure_mode_if_undried": "Steam bubbling at melt die orifice, rough matte finish, severe layer shear weakness"
        },
        "carbon_avoidance_kg_per_kg": 3.02,
        "crude_oil_saved_liters_per_kg": 2.1
    },
    "HIPS": {
        "name": "High-Impact Polystyrene",
        "code": "HIPS",
        "iso_marking": ">PS-HI<",
        "density_range": "1.03 – 1.05 g/cm³",
        "density_min": 1.03,
        "density_max": 1.05,
        "glass_transition_tg_c": 100,
        "melting_point_c": "Amorphous (Processing 195–225°C)",
        "flory_huggins_miscibility_note": (
            "Non-polar polystyrene continuous matrix containing dispersed polybutadiene spheres. "
            "Nitrile dipoles in ABS actively repel HIPS aromatic rings, leading to zero macromolecular interdiffusion."
        ),
        "tap_water_test": "Sinks slowly (rho = 1.00 g/cm³)",
        "nacl_10pct_test": "Floats cleanly (rho = 1.07 g/cm³)",
        "dense_brine_test": "Floats (rho = 1.15 g/cm³)",
        "acetone_reaction": "Rapidly swells and softens, but does not form instant tacky paste",
        "d_limonene_reaction": "Dissolves completely into a clear, viscous gel",
        "flame_behavior": "Rapid yellow-orange flame, produces copious soot webs and sweet marzipan/styrene odor",
        "thermal_specs": {
            "pre_drying_temp_c": 70,
            "pre_drying_hours": "2 to 3 hours",
            "max_moisture_ppm": 500,  # < 0.05%
            "extruder_feed_zone1_c": "170°C – 180°C",
            "extruder_transition_zone2_c": "195°C – 210°C",
            "extruder_die_zone3_c": "210°C – 225°C",
            "cooling_water_bath_c": "40°C – 50°C",
            "fdm_nozzle_temp_c": "220°C – 240°C",
            "fdm_bed_temp_c": "85°C – 100°C",
            "build_plate_interface": "PEI sheet or Kapton tape",
            "chamber_temp_c": "Passive enclosure (35°C – 45°C)",
            "part_cooling_fan": "20% – 35%",
            "volumetric_shrinkage": "0.3% – 0.6% (moderate warp risk)",
            "extrusion_failure_mode_if_undried": "Micro-voiding, nozzle spitting, and erratic filament diameter fluctuation"
        },
        "carbon_avoidance_kg_per_kg": 2.57,
        "crude_oil_saved_liters_per_kg": 1.8
    },
    "PC": {
        "name": "Polycarbonate",
        "code": "PC",
        "iso_marking": ">PC<",
        "density_range": "1.20 – 1.22 g/cm³",
        "density_min": 1.20,
        "density_max": 1.22,
        "glass_transition_tg_c": 147,
        "melting_point_c": "Amorphous (Processing 265–295°C)",
        "flory_huggins_miscibility_note": (
            "Polar aromatic carbonate backbone. Miscible with ABS under shear. "
            "High susceptibility to hydrolytic chain scission: water cleaves carbonate linkages at melt temps."
        ),
        "tap_water_test": "Sinks rapidly (rho = 1.00 g/cm³)",
        "nacl_10pct_test": "Sinks rapidly (rho = 1.07 g/cm³)",
        "dense_brine_test": "Sinks rapidly (rho = 1.15 g/cm³)",
        "acetone_reaction": "Highly resistant; slight surface haze / micro-crazing only after several minutes",
        "d_limonene_reaction": "Totally insoluble and chemically unaffected",
        "flame_behavior": "Burns with difficulty, self-extinguishes upon flame removal, faint phenolic odor",
        "thermal_specs": {
            "pre_drying_temp_c": 120,
            "pre_drying_hours": "4 to 6 hours",
            "max_moisture_ppm": 200,  # < 0.02% strictly enforced
            "extruder_feed_zone1_c": "230°C – 245°C",
            "extruder_transition_zone2_c": "265°C – 275°C",
            "extruder_die_zone3_c": "280°C – 295°C",
            "cooling_water_bath_c": "70°C – 80°C (hot bath)",
            "fdm_nozzle_temp_c": "280°C – 305°C (All-Metal Hotend Required)",
            "fdm_bed_temp_c": "115°C – 130°C",
            "build_plate_interface": "PEI + layered PVA glue stick or specialized adhesive",
            "chamber_temp_c": "Actively heated chamber (65°C – 80°C)",
            "part_cooling_fan": "0% (zero draft to prevent stress cracking)",
            "volumetric_shrinkage": "0.6% – 0.9% (severe warp risk)",
            "extrusion_failure_mode_if_undried": "Catastrophic hydrolytic chain scission, permanent embrittlement, structural fracture"
        },
        "carbon_avoidance_kg_per_kg": 6.02,
        "crude_oil_saved_liters_per_kg": 3.9
    },
    "PC-ABS": {
        "name": "Polycarbonate + Acrylonitrile Butadiene Styrene Blend",
        "code": "PC-ABS",
        "iso_marking": ">PC+ABS<",
        "density_range": "1.10 – 1.15 g/cm³",
        "density_min": 1.10,
        "density_max": 1.15,
        "glass_transition_tg_c": 120,  # Broad 110-125
        "melting_point_c": "Amorphous alloy (Processing 235–265°C)",
        "flory_huggins_miscibility_note": (
            "Engineered polymer alloy combining the high heat and impact resistance of PC "
            "with the processability and melt stability of ABS."
        ),
        "tap_water_test": "Sinks rapidly (rho = 1.00 g/cm³)",
        "nacl_10pct_test": "Sinks rapidly (rho = 1.07 g/cm³)",
        "dense_brine_test": "Neutral buoyancy boundary (rho ~ 1.12–1.15 g/cm³)",
        "acetone_reaction": "Slow surface softening with cloudy localized haze",
        "d_limonene_reaction": "Chemically inert; zero dissolution",
        "flame_behavior": "Yellow-orange flame, slight self-extinguishing behavior, moderate soot",
        "thermal_specs": {
            "pre_drying_temp_c": 100,
            "pre_drying_hours": "3 to 4 hours",
            "max_moisture_ppm": 300,  # < 0.03%
            "extruder_feed_zone1_c": "210°C – 220°C",
            "extruder_transition_zone2_c": "235°C – 245°C",
            "extruder_die_zone3_c": "250°C – 265°C",
            "cooling_water_bath_c": "60°C – 70°C",
            "fdm_nozzle_temp_c": "255°C – 275°C",
            "fdm_bed_temp_c": "100°C – 115°C",
            "build_plate_interface": "Textured PEI sheet",
            "chamber_temp_c": "Enclosed chamber (45°C – 60°C)",
            "part_cooling_fan": "10% – 20%",
            "volumetric_shrinkage": "0.5% – 0.7% (moderate warp risk)",
            "extrusion_failure_mode_if_undried": "Internal foaming, poor interlayer bonding, delamination under minimal flexure"
        },
        "carbon_avoidance_kg_per_kg": 4.32,
        "crude_oil_saved_liters_per_kg": 2.9
    }
}


def normalize_polymer_code(code_str: str) -> str:
    """Normalize raw OCR or user string to canonical polymer key."""
    if not code_str:
        return "UNKNOWN"
    cleaned = code_str.upper().strip().replace(">", "").replace("<", "").replace(" ", "")
    if "PC+ABS" in cleaned or "PC-ABS" in cleaned or "PC/ABS" in cleaned or "ABS+PC" in cleaned:
        return "PC-ABS"
    if "PS-HI" in cleaned or "HIPS" in cleaned or "PSHI" in cleaned:
        return "HIPS"
    if "ABS" in cleaned:
        return "ABS"
    if "PC" in cleaned:
        return "PC"
    if "PP" in cleaned or "POLYPROPYLENE" in cleaned:
        return "PP"
    if "HDPE" in cleaned or "PE-HD" in cleaned:
        return "HDPE"
    if "PVC" in cleaned:
        return "PVC"
    return cleaned


def get_polymer_profile(polymer_code: str) -> Optional[Dict[str, Any]]:
    """Retrieve full physical profile and thermal specs."""
    key = normalize_polymer_code(polymer_code)
    return POLYMER_DATABASE.get(key)
