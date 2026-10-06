"""
PolyLoop: Polymer Knowledge Base (PKB)
Comprehensive chemical, physical, thermal, rheological, and LCA properties
for post-consumer e-waste plastics.
"""

POLYMERS = {
    "ABS": {
        "full_name": "Acrylonitrile Butadiene Styrene",
        "iso_codes": [">ABS<", "ABS"],
        "category": "Styrenic Terpolymer",
        "density_range": "1.05 - 1.08 g/cm³",
        "density_nominal": 1.06,
        "tg_celsius": 105,
        "sink_float": {
            "tap_water": "Sinks",
            "saline_10pct": "Sinks",
            "dense_brine_1_15": "Floats"
        },
        "solvents": {
            "acetone": "Dissolves rapidly into a tacky paste",
            "d_limonene": "Chemically inert (no reaction)"
        },
        "flame_test": {
            "flame": "Luminous yellow flame with blue base",
            "soot": "Dark soot, burns steadily",
            "scent": "Pungent, acrid burnt rubber / styrene scent",
            "beilstein": "Negative (normal orange/yellow, unless BFR added)"
        },
        "drying": {
            "temp_c": 80,
            "time_hours": "3 - 4 hrs",
            "max_moisture_ppm": 500,
            "max_moisture_pct": 0.05,
            "failure_mode": "Steam bubbles at melt die, rough matte finish, severe layer shear weakness"
        },
        "extrusion": {
            "zone_1_feed": "185°C - 195°C",
            "zone_2_transition": "215°C - 225°C",
            "zone_3_die": "225°C - 235°C",
            "water_bath": "50°C - 60°C (Warm bath)"
        },
        "fdm_3d_print": {
            "nozzle_temp": "230°C - 245°C",
            "bed_temp": "95°C - 110°C",
            "bed_surface": "Smooth PEI sheet + Dimafix / Magigoo",
            "chamber_temp": "Passive enclosure (40°C - 50°C)",
            "part_fan": "0% - 15% (Preserves layer adhesion)",
            "shrinkage_pct": "0.4% - 0.7% (High warp risk)"
        },
        "lca": {
            "virgin_gwp": 3.80,       # kg CO2e / kg
            "recycling_burden": 0.83, # 0.75 process + 0.08 transport
            "net_avoided_gwp": 3.02,  # kg CO2e / kg
            "oil_saved_liters": 2.1   # Liters crude oil / kg
        },
        "common_sources": "Keyboards, desktop PC bezels, monitor frames, gaming consoles, routers",
        "miscibility_note": "Incompatible with HIPS (Flory-Huggins χ > 0). Commingling causes severe micro-phase separation and >70% loss of impact strength."
    },
    "HIPS": {
        "full_name": "High-Impact Polystyrene",
        "iso_codes": [">PS-HI<", ">HIPS<", "HIPS", "PS-HI"],
        "category": "Rubber-Modified Polystyrene",
        "density_range": "1.03 - 1.05 g/cm³",
        "density_nominal": 1.04,
        "tg_celsius": 100,
        "sink_float": {
            "tap_water": "Sinks slowly",
            "saline_10pct": "Floats",
            "dense_brine_1_15": "Floats"
        },
        "solvents": {
            "acetone": "Swells slowly and softens; rubbery surface",
            "d_limonene": "Dissolves completely into a clear, viscous gel"
        },
        "flame_test": {
            "flame": "Orange luminous flame, flares quickly",
            "soot": "Copious soot webs floating in air",
            "scent": "Sweet, floral marzipan / styrene monomer scent",
            "beilstein": "Negative (orange/yellow flame)"
        },
        "drying": {
            "temp_c": 70,
            "time_hours": "2 - 3 hrs",
            "max_moisture_ppm": 500,
            "max_moisture_pct": 0.05,
            "failure_mode": "Micro-voiding, nozzle spitting, and erratic filament diameter"
        },
        "extrusion": {
            "zone_1_feed": "170°C - 180°C",
            "zone_2_transition": "195°C - 210°C",
            "zone_3_die": "210°C - 225°C",
            "water_bath": "40°C - 50°C"
        },
        "fdm_3d_print": {
            "nozzle_temp": "220°C - 240°C",
            "bed_temp": "85°C - 100°C",
            "bed_surface": "PEI sheet or Kapton tape",
            "chamber_temp": "Passive enclosure (35°C - 45°C)",
            "part_fan": "20% - 35%",
            "shrinkage_pct": "0.3% - 0.6% (Moderate warp risk)"
        },
        "lca": {
            "virgin_gwp": 3.35,
            "recycling_burden": 0.83,
            "net_avoided_gwp": 2.57,
            "oil_saved_liters": 1.8
        },
        "common_sources": "CRT TV back covers (often legacy BFR), printer paper trays, audio chassis, refrigerator liners",
        "miscibility_note": "Non-polar aromatic matrix; totally immiscible with polar ABS and PC. Frequently compounded with DecaBDE in vintage electronics."
    },
    "PC": {
        "full_name": "Polycarbonate",
        "iso_codes": [">PC<", "PC"],
        "category": "Aromatic Engineering Polyester",
        "density_range": "1.20 - 1.22 g/cm³",
        "density_nominal": 1.21,
        "tg_celsius": 147,
        "sink_float": {
            "tap_water": "Sinks rapidly",
            "saline_10pct": "Sinks rapidly",
            "dense_brine_1_15": "Sinks rapidly"
        },
        "solvents": {
            "acetone": "Highly resistant; faint micro-crazing after 2+ minutes",
            "d_limonene": "Chemically insoluble and inert"
        },
        "flame_test": {
            "flame": "Self-extinguishes upon removal of ignition flame",
            "soot": "Moderate soot, bubbles and chars during combustion",
            "scent": "Faint sweet phenolic / coal odor",
            "beilstein": "Negative"
        },
        "drying": {
            "temp_c": 120,
            "time_hours": "4 - 6 hrs",
            "max_moisture_ppm": 200,
            "max_moisture_pct": 0.02,
            "failure_mode": "Catastrophic hydrolytic chain scission! Moisture cleaves ester backbone, permanently reducing molecular weight and destroying toughness."
        },
        "extrusion": {
            "zone_1_feed": "230°C - 245°C",
            "zone_2_transition": "265°C - 275°C",
            "zone_3_die": "280°C - 295°C",
            "water_bath": "70°C - 80°C"
        },
        "fdm_3d_print": {
            "nozzle_temp": "280°C - 305°C (All-metal hotend required)",
            "bed_temp": "115°C - 130°C",
            "bed_surface": "PEI sheet + layered PVA glue stick or Magigoo PC",
            "chamber_temp": "Actively heated enclosure (65°C - 80°C)",
            "part_fan": "0% (Zero draft to prevent severe thermal shear stress)",
            "shrinkage_pct": "0.6% - 0.9% (Severe warp risk)"
        },
        "lca": {
            "virgin_gwp": 6.80,
            "recycling_burden": 0.83,
            "net_avoided_gwp": 6.02,
            "oil_saved_liters": 3.9
        },
        "common_sources": "Server fan shrouds, high-temp power supply cases, optical discs, transparent equipment shields",
        "miscibility_note": "Extremely sensitive to moisture during melt processing. Fully miscible with ABS in controlled blends."
    },
    "PC-ABS": {
        "full_name": "Polycarbonate / ABS Engineering Blend",
        "iso_codes": [">PC+ABS<", ">PC-ABS<", "PC+ABS", "PC-ABS"],
        "category": "Miscible Engineering Alloy",
        "density_range": "1.10 - 1.15 g/cm³",
        "density_nominal": 1.13,
        "tg_celsius": 118,
        "sink_float": {
            "tap_water": "Sinks rapidly",
            "saline_10pct": "Sinks rapidly",
            "dense_brine_1_15": "Neutral buoyancy boundary (marginal float/sink)"
        },
        "solvents": {
            "acetone": "Slow surface softening; cloudy localized haze",
            "d_limonene": "Chemically inert; zero dissolution"
        },
        "flame_test": {
            "flame": "Yellow-orange flame, partial self-extinguishing behavior",
            "soot": "Moderate soot",
            "scent": "Faint aromatic styrene / phenolic blend",
            "beilstein": "Negative"
        },
        "drying": {
            "temp_c": 100,
            "time_hours": "3 - 4 hrs",
            "max_moisture_ppm": 300,
            "max_moisture_pct": 0.03,
            "failure_mode": "Internal foaming, poor interlayer bonding, delamination under minimal flexure"
        },
        "extrusion": {
            "zone_1_feed": "210°C - 220°C",
            "zone_2_transition": "235°C - 245°C",
            "zone_3_die": "250°C - 265°C",
            "water_bath": "60°C - 70°C"
        },
        "fdm_3d_print": {
            "nozzle_temp": "255°C - 275°C",
            "bed_temp": "100°C - 115°C",
            "bed_surface": "Textured PEI sheet + Vision Miner adhesive",
            "chamber_temp": "Enclosed chamber (45°C - 60°C)",
            "part_fan": "10% - 20%",
            "shrinkage_pct": "0.5% - 0.7% (Moderate warp risk)"
        },
        "lca": {
            "virgin_gwp": 5.10,
            "recycling_burden": 0.83,
            "net_avoided_gwp": 4.32,
            "oil_saved_liters": 2.9
        },
        "common_sources": "Modern laptop bottom covers, enterprise server chassis, smartphone frames, tablet housings",
        "miscibility_note": "Industry gold standard engineering blend combining PC heat resistance with ABS processability."
    },
    "PP": {
        "full_name": "Polypropylene",
        "iso_codes": [">PP<", "PP"],
        "category": "Aliphatic Polyolefin",
        "density_range": "0.90 - 0.92 g/cm³",
        "density_nominal": 0.91,
        "tg_celsius": -10,
        "sink_float": {
            "tap_water": "Floats cleanly",
            "saline_10pct": "Floats cleanly",
            "dense_brine_1_15": "Floats cleanly"
        },
        "solvents": {
            "acetone": "Completely resistant / inert",
            "d_limonene": "Completely resistant / inert"
        },
        "flame_test": {
            "flame": "Blue flame with yellow tip, drips burning drops",
            "soot": "Minimal soot",
            "scent": "Paraffin candle / burning wax odor",
            "beilstein": "Negative"
        },
        "drying": {
            "temp_c": 70,
            "time_hours": "1 - 2 hrs",
            "max_moisture_ppm": 800,
            "max_moisture_pct": 0.08,
            "failure_mode": "Non-hygroscopic; surface moisture causes minor nozzle spitting"
        },
        "extrusion": {
            "zone_1_feed": "170°C - 180°C",
            "zone_2_transition": "190°C - 205°C",
            "zone_3_die": "205°C - 220°C",
            "water_bath": "25°C - 35°C"
        },
        "fdm_3d_print": {
            "nozzle_temp": "210°C - 230°C",
            "bed_temp": "85°C - 100°C",
            "bed_surface": "Polypropylene packaging tape or Magigoo PP",
            "chamber_temp": "Enclosed chamber (40°C - 50°C)",
            "part_fan": "50% - 100%",
            "shrinkage_pct": "1.5% - 2.5% (Extreme warp risk)"
        },
        "lca": {
            "virgin_gwp": 1.95,
            "recycling_burden": 0.70,
            "net_avoided_gwp": 1.30,
            "oil_saved_liters": 1.4
        },
        "common_sources": "Internal cable clips, battery cases, washing machine drums, power tool casings",
        "miscibility_note": "Completely immiscible with styrenics and engineering polymers. Will cause severe laminar peeling."
    },
    "BFR_CONTAMINATED": {
        "full_name": "Brominated Flame Retardant Plastic (Regulated WEEE Fraction)",
        "iso_codes": [">ABS-FR(40)<", ">PS-FR(40)<", ">HIPS-FR(17)<", "FR(40)"],
        "category": "Hazardous Halogenated Polymer Fraction",
        "density_range": "1.18 - 1.35 g/cm³",
        "density_nominal": 1.25,
        "tg_celsius": 108,
        "sink_float": {
            "tap_water": "Sinks rapidly",
            "saline_10pct": "Sinks rapidly",
            "dense_brine_1_15": "Sinks rapidly"
        },
        "solvents": {
            "acetone": "Softens or dissolves depending on base resin matrix",
            "d_limonene": "Dissolves if HIPS base; inert if ABS base"
        },
        "flame_test": {
            "flame": "Self-extinguishes instantly upon flame removal",
            "soot": "Extremely dense, black, choking acid soot",
            "scent": "Pungent chemical acid scent (hydrogen bromide release)",
            "beilstein": "Bright emerald green flame (Copper Halide confirmation!)"
        },
        "drying": {
            "temp_c": 0,
            "time_hours": "N/A",
            "max_moisture_ppm": 0,
            "max_moisture_pct": 0.0,
            "failure_mode": "DO NOT EXTRUDE! Thermal processing >210°C triggers dehydrohalogenation and toxic polybrominated dioxin/furan (PBDD/F) emissions."
        },
        "extrusion": {
            "zone_1_feed": "REJECTED",
            "zone_2_transition": "REJECTED",
            "zone_3_die": "REJECTED",
            "water_bath": "N/A"
        },
        "fdm_3d_print": {
            "nozzle_temp": "PROHIBITED",
            "bed_temp": "PROHIBITED",
            "bed_surface": "PROHIBITED",
            "chamber_temp": "PROHIBITED",
            "part_fan": "PROHIBITED",
            "shrinkage_pct": "N/A"
        },
        "lca": {
            "virgin_gwp": 0.0,
            "recycling_burden": 0.0,
            "net_avoided_gwp": 0.0,
            "oil_saved_liters": 0.0
        },
        "common_sources": "CRT televisions & monitors (pre-2006), office copiers/printers (fuser assemblies), old power supplies",
        "miscibility_note": "Banned from mechanical recycling under EU RoHS 2011/65/EU (<1,000 ppm) and EU POPs Regulation (<500 ppm). Must be quarantined for specialized WEEE disposal."
    }
}

APPLIANCE_PROFILES = {
    "crt_housing": {
        "label": "CRT Television / CRT Monitor Backing",
        "typical_era": "Pre-2006",
        "primary_resins": ["HIPS (63%)", "ABS (22%)"],
        "base_bfr_risk": 0.85,
        "risk_tier": "CRITICAL HAZARD",
        "rohs_likely": False,
        "common_flame_retardants": "DecaBDE, OctaBDE (>2,000 ppm), Antimony Trioxide Sb2O3",
        "protocol": "Reject from mechanical extrusion. Route to certified WEEE hazardous incineration."
    },
    "laser_printer": {
        "label": "Laser Printer / Commercial Photocopier Panel",
        "typical_era": "1998 - 2012",
        "primary_resins": ["ABS (80%)", "PC-ABS (13%)", "HIPS (7%)"],
        "base_bfr_risk": 0.50,
        "risk_tier": "HIGH RISK",
        "rohs_likely": False,
        "common_flame_retardants": "TBBPA in internal fuser zones, phosphorus in modern units",
        "protocol": "Require mandatory density stratification (dense brine) and Beilstein copper flame test."
    },
    "desktop_chassis": {
        "label": "Desktop PC Tower Chassis / Front Bezel",
        "typical_era": "2000 - 2015",
        "primary_resins": ["ABS (50%)", "PC-ABS (35%)", "HIPS (15%)"],
        "base_bfr_risk": 0.35,
        "risk_tier": "MODERATE RISK",
        "rohs_likely": True,
        "common_flame_retardants": "Low-level TBBPA or organophosphates in bezels",
        "protocol": "Verify ISO 11469 mold stamp. If clean >ABS< or >PC+ABS<, cleared for pre-drying."
    },
    "flat_display": {
        "label": "Flat Panel LCD/LED Monitor & Laptop Casing",
        "typical_era": "2016 - Present",
        "primary_resins": ["PC-ABS (90%)", "PC (10%)"],
        "base_bfr_risk": 0.08,
        "risk_tier": "LOW RISK",
        "rohs_likely": True,
        "common_flame_retardants": "Halogen-free organophosphorus esters (BDP, RDP)",
        "protocol": "Approved for closed-loop upcycling and 1.75 mm FDM filament extrusion."
    },
    "keyboard_casing": {
        "label": "Keyboard Shell, Mouse Casing & Home Router",
        "typical_era": "2010 - Present",
        "primary_resins": ["ABS (>80%)", "HIPS (<15%)"],
        "base_bfr_risk": 0.04,
        "risk_tier": "MINIMAL RISK",
        "rohs_likely": True,
        "common_flame_retardants": "Unfilled / Non-flame retarded (UL 94 HB standard)",
        "protocol": "Prime candidate for direct mechanical granulation, washing, and filament re-extrusion."
    }
}
