"""Unit tests for BFR hazard scoring and RoHS/POPs compliance engine."""

import pytest

from app.services.bfr_engine import evaluate_bfr_hazard


def test_crt_housing_critical_hazard():
    res = evaluate_bfr_hazard(casing_type="crt_housing", vintage_era="Pre-2006")
    assert res["bfr_risk_score"] >= 0.85
    assert res["hazard_tier"] == "CRITICAL"
    assert res["rohs_compliant"] is False
    assert res["status"] == "REJECTED"


def test_iso_fr40_override_rejection():
    # Modern housing with FR(40) stamp must still be rejected
    res = evaluate_bfr_hazard(
        casing_type="keyboard_mouse_router",
        vintage_era="2020",
        ocr_raw_text=">ABS-FR(40)<"
    )
    assert res["bfr_risk_score"] == 0.99
    assert res["hazard_tier"] == "CRITICAL"
    assert res["rohs_compliant"] is False
    assert res["status"] == "REJECTED"
    assert res["detected_fr_code"] == "FR(40)"


def test_beilstein_green_flame_rejection():
    res = evaluate_bfr_hazard(
        casing_type="desktop_chassis",
        beilstein_green=True
    )
    assert res["bfr_risk_score"] == 0.99
    assert res["status"] == "REJECTED"


def test_modern_laptop_approval():
    res = evaluate_bfr_hazard(
        casing_type="flat_display",
        vintage_era="2021-Present",
        color="silver"
    )
    assert res["bfr_risk_score"] <= 0.10
    assert res["rohs_compliant"] is True
    assert res["status"] == "APPROVED"
