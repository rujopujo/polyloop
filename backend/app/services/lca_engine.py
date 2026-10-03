"""ISO 14040/14044 Life Cycle Assessment (LCA) Carbon Avoidance Engine."""

from typing import Any, Dict, List

from app.core.constants import (
    COAL_EQUIVALENT_FACTOR,
    EF_LANDFILL_CREDIT,
    EF_RECYCLING,
    EF_TRANSPORT,
    KM_DRIVEN_FACTOR,
    VIRGIN_RESIN_GWP,
)
from app.services.polymer_kb import normalize_polymer_code


def calculate_item_impact(polymer: str, mass_kg: float) -> Dict[str, float]:
    """Calculate net carbon avoidance and petroleum displacement for a single polymer item."""
    canonical = normalize_polymer_code(polymer)
    gwp_data = VIRGIN_RESIN_GWP.get(canonical, VIRGIN_RESIN_GWP["ABS"])

    # Formula:
    # Delta E = M * (EF_virgin - EF_recycling) + M * EF_landfill_credit - M * EF_transp
    # Delta E = M * (EF_virgin - (EF_recycling + EF_transp - EF_landfill_credit))
    # For ABS: 3.80 - 0.78 = 3.02 kg CO2e / kg
    net_factor = gwp_data["net_avoided"]
    co2_avoided = mass_kg * net_factor
    oil_saved = mass_kg * gwp_data["crude_oil_liters_per_kg"]
    coal_offset = co2_avoided * COAL_EQUIVALENT_FACTOR
    km_offset = co2_avoided * KM_DRIVEN_FACTOR

    virgin_carbon = mass_kg * gwp_data["virgin_ef"]
    process_carbon = mass_kg * (EF_RECYCLING + EF_TRANSPORT - EF_LANDFILL_CREDIT)

    return {
        "polymer": canonical,
        "mass_kg": round(mass_kg, 2),
        "co2_avoided_kg": round(co2_avoided, 2),
        "oil_saved_liters": round(oil_saved, 2),
        "coal_offset_kg": round(coal_offset, 2),
        "km_driven_offset": round(km_offset, 2),
        "virgin_resin_carbon_kg": round(virgin_carbon, 2),
        "polyloop_process_carbon_kg": round(process_carbon, 2)
    }


def calculate_batch_impact(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregate lifecycle impacts across an entire mixed or segregated batch."""
    total_mass = sum(item.get("mass_kg", 0.0) for item in items)
    usable_mass = sum(item.get("mass_kg", 0.0) for item in items if item.get("status", "APPROVED") == "APPROVED")
    rejected_mass = total_mass - usable_mass

    total_co2_avoided = 0.0
    total_oil_saved = 0.0
    total_virgin_carbon = 0.0
    total_process_carbon = 0.0

    polymer_totals: Dict[str, float] = {}

    for item in items:
        poly = normalize_polymer_code(item.get("polymer", "ABS"))
        mass = float(item.get("mass_kg", 0.0))
        status = item.get("status", "APPROVED")

        polymer_totals[poly] = polymer_totals.get(poly, 0.0) + mass

        if status == "APPROVED":
            impact = calculate_item_impact(poly, mass)
            total_co2_avoided += impact["co2_avoided_kg"]
            total_oil_saved += impact["oil_saved_liters"]
            total_virgin_carbon += impact["virgin_resin_carbon_kg"]
            total_process_carbon += impact["polyloop_process_carbon_kg"]

    # Calculate composition breakdown
    composition = []
    for poly, p_mass in polymer_totals.items():
        pct = (p_mass / total_mass * 100.0) if total_mass > 0 else 0.0
        composition.append({
            "polymer": poly,
            "mass_kg": round(p_mass, 2),
            "percentage": round(pct, 1)
        })

    circularity_yield = (usable_mass / total_mass * 100.0) if total_mass > 0 else 0.0

    return {
        "total_inflow_mass_kg": round(total_mass, 2),
        "usable_mass_kg": round(usable_mass, 2),
        "rejected_mass_kg": round(rejected_mass, 2),
        "circularity_yield_percent": round(circularity_yield, 1),
        "net_co2_avoided_kg": round(total_co2_avoided, 2),
        "crude_oil_saved_liters": round(total_oil_saved, 2),
        "coal_offset_kg": round(total_co2_avoided * COAL_EQUIVALENT_FACTOR, 2),
        "km_driven_offset": round(total_co2_avoided * KM_DRIVEN_FACTOR, 2),
        "virgin_resin_carbon_kg": round(total_virgin_carbon, 2),
        "polyloop_process_carbon_kg": round(total_process_carbon, 2),
        "composition_breakdown": composition
    }
