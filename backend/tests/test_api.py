"""Unit tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.database.session import Base, engine
from app.main import app, seed_demo_data


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    with TestClient(app) as c:
        yield c


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "PolyLoop"
    assert data["status"] == "OPERATIONAL"


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_kb_polymers_endpoint(client):
    response = client.get("/api/kb/polymers")
    assert response.status_code == 200
    data = response.json()
    assert "ABS" in data
    assert "HIPS" in data
    assert "PC" in data
    assert "PC-ABS" in data


def test_diagnostic_wizard_abs(client):
    payload = {
        "casing_type": "keyboard_mouse_router",
        "vintage_era": "2018",
        "water_test": "sinks",
        "nacl_test": "sinks",
        "brine_test": "floats",
        "acetone_reaction": "tacky_paste",
        "limonene_reaction": "inert"
    }
    response = client.post("/api/diagnostic/wizard", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["polymer_detected"] == "ABS"
    assert data["status"] == "APPROVED"
    assert data["rohs_compliant"] is True
    assert data["thermal_specs"] is not None


def test_diagnostic_wizard_beilstein_rejection(client):
    payload = {
        "casing_type": "crt_housing",
        "vintage_era": "2002",
        "water_test": "sinks",
        "nacl_test": "sinks",
        "brine_test": "sinks",
        "beilstein_flame": "green"
    }
    response = client.post("/api/diagnostic/wizard", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED"
    assert data["rohs_compliant"] is False
    assert data["bfr_risk_score"] == 0.99


def test_get_batches(client):
    response = client.get("/api/batches")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # seeded demo batch exists
