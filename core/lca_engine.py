"""
PolyLoop: ISO 14040/14044 Life Cycle Assessment (LCA) Carbon Avoidance Engine
Quantifies net greenhouse gas (GHG) emission reduction, crude fossil oil displacement,
and landfill diversion achieved by mechanical recycling of post-consumer e-waste plastics.
"""
from core.polymer_kb import POLYMERS

# Standard LCA Constants (kg CO2e / kg resin)
EF_RECYCLING = 0.75         # Mechanical grinding, washing, convective air drying, single-screw extrusion
EF_TRANSPORT = 0.08         # 50 km reverse logistics radius collection emissions
EF_LANDFILL_CREDIT = 0.05   # Baseline avoidance of fugitive emissions & leachate treatment
COAL_EQUIV_RATIO = 0.49     # 1 kg CO2e avoided ~ 0.49 kg coal combustion offset
KM_DRIVEN_PER_KG_CO2 = 4.07 # 1 kg CO2e ~ 4.07 km driven in average passenger car

def calculate_item_lca(polymer_key, mass_kg=1.0):
    """
    Computes LCA carbon avoidance and fossil fuel offsets for a single mass unit of polymer.
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
    else:
        clean_key = "ABS"

    p_data = POLYMERS.get(clean_key, POLYMERS["ABS"])
    virgin_ef = p_data["lca"]["virgin_gwp"]
    process_burden = EF_RECYCLING + EF_TRANSPORT  # 0.83 kg CO2e / kg
    
    # Net avoided equation: M * (EF_virgin - (EF_rec + EF_transp)) + M * EF_landfill
    net_avoided_unit = (virgin_ef - process_burden) + EF_LANDFILL_CREDIT
    net_avoided_total = round(mass_kg * net_avoided_unit, 2)
    oil_saved_liters = round(mass_kg * p_data["lca"]["oil_saved_liters"], 2)
    coal_offset_kg = round(net_avoided_total * COAL_EQUIV_RATIO, 2)
    km_offset = round(net_avoided_total * KM_DRIVEN_PER_KG_CO2, 1)

    return {
        "polymer": clean_key,
        "mass_kg": mass_kg,
        "virgin_gwp_total": round(mass_kg * virgin_ef, 2),
        "polyloop_burden_total": round(mass_kg * process_burden, 2),
        "net_co2e_avoided_kg": net_avoided_total,
        "crude_oil_saved_liters": oil_saved_liters,
        "coal_offset_kg": coal_offset_kg,
        "km_car_offset": km_offset,
        "net_avoided_per_kg": round(net_avoided_unit, 2)
    }

def calculate_batch_lca(composition_dict, rejected_bfr_kg=0.0):
    """
    Computes aggregated LCA impact across a multi-component batch.
    composition_dict: {"ABS": 50.0, "PC-ABS": 25.0, "HIPS": 10.0, ...} in kg.
    rejected_bfr_kg: float mass of isolated hazardous casings diverted to safe disposal.
    """
    total_usable_kg = 0.0
    total_co2e_avoided = 0.0
    total_oil_saved = 0.0
    total_virgin_gwp = 0.0
    total_process_burden = 0.0
    breakdown = []

    for poly, mass in composition_dict.items():
        if mass > 0:
            item_res = calculate_item_lca(poly, mass)
            total_usable_kg += mass
            total_co2e_avoided += item_res["net_co2e_avoided_kg"]
            total_oil_saved += item_res["crude_oil_saved_liters"]
            total_virgin_gwp += item_res["virgin_gwp_total"]
            total_process_burden += item_res["polyloop_burden_total"]
            breakdown.append(item_res)

    # Landfill credit from diverting hazardous BFR scrap to controlled quarantine
    bfr_landfill_avoided = round(rejected_bfr_kg * EF_LANDFILL_CREDIT, 2)
    grand_total_co2e = round(total_co2e_avoided + bfr_landfill_avoided, 2)
    total_coal_offset = round(grand_total_co2e * COAL_EQUIV_RATIO, 2)
    total_km_offset = round(grand_total_co2e * KM_DRIVEN_PER_KG_CO2, 1)

    return {
        "total_mass_inflow_kg": round(total_usable_kg + rejected_bfr_kg, 2),
        "usable_recycled_kg": round(total_usable_kg, 2),
        "isolated_bfr_hazard_kg": round(rejected_bfr_kg, 2),
        "recovery_yield_pct": round((total_usable_kg / (total_usable_kg + rejected_bfr_kg) * 100) if (total_usable_kg + rejected_bfr_kg) > 0 else 0, 1),
        "grand_total_co2e_avoided_kg": grand_total_co2e,
        "total_crude_oil_saved_liters": round(total_oil_saved, 2),
        "total_coal_offset_kg": total_coal_offset,
        "total_car_km_offset": total_km_offset,
        "virgin_baseline_co2e_kg": round(total_virgin_gwp, 2),
        "polyloop_footprint_kg": round(total_process_burden, 2),
        "breakdown": breakdown
    }
