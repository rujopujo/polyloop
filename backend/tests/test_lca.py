"""Unit tests for ISO 14040/14044 Life Cycle Assessment (LCA) carbon avoidance engine."""

import pytest

from app.services.lca_engine import calculate_batch_impact, calculate_item_impact


def test_single_abs_carbon_offset():
    # 50 kg of ABS should yield exactly 50 * 3.02 = 151.0 kg CO2e avoided
    impact = calculate_item_impact(polymer="ABS", mass_kg=50.0)
    assert impact["co2_avoided_kg"] == 151.0
    assert impact["oil_saved_liters"] == 105.0  # 50 * 2.1 = 105.0


def test_single_hips_carbon_offset():
    impact = calculate_item_impact(polymer="HIPS", mass_kg=10.0)
    assert impact["co2_avoided_kg"] == 25.7  # 10 * 2.57


def test_single_pcabs_carbon_offset():
    impact = calculate_item_impact(polymer="PC-ABS", mass_kg=25.0)
    assert impact["co2_avoided_kg"] == 108.0  # 25 * 4.32


def test_single_pc_carbon_offset():
    impact = calculate_item_impact(polymer="PC", mass_kg=10.0)
    assert impact["co2_avoided_kg"] == 60.2  # 10 * 6.02


def test_mixed_pilot_batch_simulation():
    # 100 kg batch simulation from empirical research:
    # 50 kg ABS, 25 kg PC-ABS, 10 kg HIPS (Approved)
    # 15 kg CRT Monitor (Rejected due to BFR)
    items = [
        {"polymer": "ABS", "mass_kg": 50.0, "status": "APPROVED"},
        {"polymer": "PC-ABS", "mass_kg": 25.0, "status": "APPROVED"},
        {"polymer": "HIPS", "mass_kg": 10.0, "status": "APPROVED"},
        {"polymer": "HIPS", "mass_kg": 15.0, "status": "REJECTED"}
    ]

    res = calculate_batch_impact(items)
    assert res["total_inflow_mass_kg"] == 100.0
    assert res["usable_mass_kg"] == 85.0
    assert res["rejected_mass_kg"] == 15.0
    assert res["circularity_yield_percent"] == 85.0

    # Net carbon avoided: 151.0 + 108.0 + 25.7 = 284.7 kg CO2e
    assert res["net_co2_avoided_kg"] == 284.7
