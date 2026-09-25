import pytest
import json
from datetime import datetime, timezone

from app.core.config import settings

@pytest.fixture
def auth_headers_admin(client):
    r = client.post("/auth/login", data={"username": "testadmin", "password": "testpass"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

@pytest.fixture
def auth_headers_operator(client):
    r = client.post("/auth/login", data={"username": "testoperator", "password": "operpass"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

@pytest.fixture
def analytics_headers():
    return {"X-Analytics-Key": settings.ANALYTICS_API_KEY}

@pytest.fixture
def seed_camera(client, auth_headers_admin):
    # Ensure camera exists
    c = client.post("/cameras", json={
        "camera_id": "C999",
        "name": "Test Cam 999",
        "camera_type": "FIXED",
        "source_protocol": "FILE"
    }, headers=auth_headers_admin)
    return "C999"

from unittest.mock import patch

@pytest.fixture
def mock_redis():
    with patch("app.services.events._get_redis") as mock:
        r = mock.return_value
        r.set.return_value = True # Not a duplicate
        yield r

def test_ingest_event_unauthorized(client):
    r = client.post("/events", json={"camera_id": "C999", "timestamp": "2026-09-24T10:00:00Z", "event_type": "anpr"})
    assert r.status_code == 403

def test_ingest_anpr_missing_plate(client, analytics_headers, seed_camera):
    payload = {
        "camera_id": seed_camera,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "anpr",
    }
    r = client.post("/events", json=payload, headers=analytics_headers)
    assert r.status_code == 422
    assert "vehicle_number is required" in r.text

def test_ingest_valid_anpr(client, analytics_headers, seed_camera, mock_redis):
    payload = {
        "event_id": "test-event-1",
        "camera_id": seed_camera,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "anpr",
        "vehicle_number": "GJ 01 XX 0001",
        "confidence": 0.95
    }
    r = client.post("/events", json=payload, headers=analytics_headers)
    assert r.status_code == 202
    data = r.json()
    assert data["status"] == "accepted"
    assert not data["duplicate"]

def test_ingest_duplicate_event_id(client, analytics_headers, seed_camera, mock_redis):
    payload = {
        "event_id": "test-event-duplicate",
        "camera_id": seed_camera,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "anpr",
        "vehicle_number": "GJ01XX0001"
    }
    # First ingest
    r1 = client.post("/events", json=payload, headers=analytics_headers)
    assert r1.status_code == 202

    # Second ingest
    r2 = client.post("/events", json=payload, headers=analytics_headers)
    assert r2.status_code == 202
    assert r2.json()["duplicate"] is True

def test_list_events(client, auth_headers_admin):
    r = client.get("/events?page_size=10", headers=auth_headers_admin)
    assert r.status_code == 200
    assert "items" in r.json()
