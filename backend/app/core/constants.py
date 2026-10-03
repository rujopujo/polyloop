"""Scientific, regulatory, and mechanical constants for PolyLoop."""

# Regulatory Limits (ppm)
ROHS_PBDE_LIMIT_PPM = 1000.0  # EU RoHS 2011/65/EU (< 0.1% / 1000 ppm)
POPS_PBDE_LIMIT_PPM = 500.0   # EU POPs Regulation 2019/1021 (< 500 ppm)
WEEE_ANNEX_VII = "Mandatory selective extraction of brominated plastics prior to recycling"

# Appliance Baseline Hazard Risk Indices (0.0 to 1.0)
APPLIANCE_BASELINE_RISK = {
    "crt_housing": {
        "label": "CRT Monitor / TV Housing",
        "era": "Pre-2006",
        "base_risk": 0.85,
        "hazard_tier": "CRITICAL",
        "primary_polymers": ["HIPS", "ABS"],
        "recommended_action": "REJECT for mechanical upcycling; route to certified WEEE hazardous high-temperature thermal disposal."
    },
    "laser_printer": {
        "label": "Laser Printer / Copier Casing",
        "era": "1998-2012",
        "base_risk": 0.50,
        "hazard_tier": "HIGH",
        "primary_polymers": ["ABS", "PC-ABS"],
        "recommended_action": "Require mandatory density bath stratification and Beilstein flame verification prior to batch approval."
    },
    "desktop_chassis": {
        "label": "Desktop PC Chassis / Bezel",
        "era": "2000-2015",
        "base_risk": 0.35,
        "hazard_tier": "MODERATE",
        "primary_polymers": ["ABS", "PC-ABS", "HIPS"],
        "recommended_action": "Inspect ISO 11469 mold markings for FR codes; run density validation tests."
    },
    "flat_display": {
        "label": "Modern Flat Display / Laptop Casing",
        "era": "2016-Present",
        "base_risk": 0.08,
        "hazard_tier": "LOW",
        "primary_polymers": ["PC-ABS", "PC"],
        "recommended_action": "Qualified for closed-loop upcycling and additive manufacturing filament extrusion."
    },
    "keyboard_mouse_router": {
        "label": "Keyboard / Mouse / Router Housing",
        "era": "2010-Present",
        "base_risk": 0.04,
        "hazard_tier": "MINIMAL",
        "primary_polymers": ["ABS", "HIPS"],
        "recommended_action": "Highly suitable for direct desktop granulation, drying, and 1.75mm filament extrusion."
    }
}

# ISO 1043-4 Flame Retardant Codes
FLAME_RETARDANT_CODES = {
    "FR(40)": {
        "description": "Halogenated organic compounds in combination with antimony trioxide (Sb2O3)",
        "hazard_score": 0.99,
        "tier": "CRITICAL",
        "compliant": False,
        "action": "Immediate Regulatory Rejection (RoHS/POPs Violation)"
    },
    "FR(14)": {
        "description": "Aliphatic phosphorus compound",
        "hazard_score": 0.20,
        "tier": "LOW",
        "compliant": True,
        "action": "Permitted with thermal ventilation"
    },
    "FR(52)": {
        "description": "Red phosphorus additive",
        "hazard_score": 0.30,
        "tier": "MODERATE",
        "compliant": True,
        "action": "Process in dedicated exhaust hood"
    }
}

# Life Cycle Assessment (LCA) Constants (ISO 14040 / 14044)
# Values in kg CO2e / kg resin
EF_RECYCLING = 0.75         # Cumulative energy for sorting, grinding, washing, drying, extrusion
EF_LANDFILL_CREDIT = 0.05   # Fugitive emissions avoided by landfill diversion
EF_TRANSPORT = 0.08         # Reverse logistics within 50km radius
NET_PROCESS_BURDEN = EF_RECYCLING + EF_TRANSPORT - EF_LANDFILL_CREDIT  # 0.78 kg CO2e / kg

# Virgin Resin Cradle-to-Gate GWP (kg CO2e / kg) & Net Avoided
VIRGIN_RESIN_GWP = {
    "ABS": {
        "virgin_ef": 3.80,
        "net_avoided": 3.02,
        "crude_oil_liters_per_kg": 2.1
    },
    "HIPS": {
        "virgin_ef": 3.35,
        "net_avoided": 2.57,
        "crude_oil_liters_per_kg": 1.8
    },
    "PC": {
        "virgin_ef": 6.80,
        "net_avoided": 6.02,
        "crude_oil_liters_per_kg": 3.9
    },
    "PC-ABS": {
        "virgin_ef": 5.10,
        "net_avoided": 4.32,
        "crude_oil_liters_per_kg": 2.9
    }
}

COAL_EQUIVALENT_FACTOR = 0.49  # 1 kg CO2e avoided ~ 0.49 kg coal combustion avoided
KM_DRIVEN_FACTOR = 4.07        # ~4.07 km passenger car travel per kg CO2e avoided
