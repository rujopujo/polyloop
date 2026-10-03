"""Unit tests for OCR token parsing and ISO 11469 regex extraction."""

import pytest

from app.services.ocr_service import extract_iso_tokens
from app.services.polymer_kb import normalize_polymer_code


def test_standard_bracketed_tokens():
    cases = [
        (">ABS<", "ABS", None),
        (">PS-HI<", "PS-HI", None),
        (">PC+ABS<", "PC+ABS", None),
        (">PC<", "PC", None),
        ("> PP <", "PP", None),
    ]
    for text, expected_poly, expected_fr in cases:
        res = extract_iso_tokens(text)
        assert res["iso_stamp_found"] is True
        assert res["polymer"] == expected_poly
        assert res["fr_code"] == expected_fr


def test_flame_retardant_token_extraction():
    text = ">ABS-FR(40)<"
    res = extract_iso_tokens(text)
    assert res["iso_stamp_found"] is True
    assert "ABS" in res["polymer"]
    assert res["fr_code"] == "FR(40)"


def test_noisy_ocr_text():
    noisy_strings = [
        "MADE IN TAIWAN >ABS< REV 3.2 94V-0",
        "CAUTION: HOUSING >PC+ABS< MOLD #4",
        "CASING: >PS-HI< CAVITY B2",
        "STAMP: >ABS-FR(40)< RoHS NON-COMPLIANT"
    ]
    for text in noisy_strings:
        res = extract_iso_tokens(text)
        assert res["iso_stamp_found"] is True
        assert res["polymer"] is not None


def test_unbracketed_fallback():
    res = extract_iso_tokens("RECYCLE CODE ABS PLASTIC RESIN")
    assert res["iso_stamp_found"] is True
    assert res["polymer"] == "ABS"


def test_polymer_normalization():
    assert normalize_polymer_code(">ABS<") == "ABS"
    assert normalize_polymer_code(">PS-HI<") == "HIPS"
    assert normalize_polymer_code("PSHI") == "HIPS"
    assert normalize_polymer_code(">PC+ABS<") == "PC-ABS"
    assert normalize_polymer_code("PC/ABS") == "PC-ABS"
