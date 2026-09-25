import pytest
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
def seed_camera_and_watchlist(client, auth_headers_admin):
    # Ensure camera exists
    c = client.post("/cameras", json={
        "camera_id": "C998",
        "name": "Test Cam 998",
        "camera_type": "FIXED",
        "source_protocol": "FILE"
    }, headers=auth_headers_admin)
    
    # Create watchlist entry
    w = client.post("/watchlist", json={
        "entity_type": "vehicle",
        "identifier": "GJ01XX0001",
        "category": "blacklisted",
        "severity": "critical"
    }, headers=auth_headers_admin)
    
    return "C998", "GJ01XX0001"

from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_redis():
    with patch("app.services.events._get_redis") as mock_events_redis, \
         patch("app.services.alerts._publish_alert") as mock_alerts_publish:
        r = MagicMock()
        r.set.return_value = True # Not a duplicate
        
        mock_events_redis.return_value = r
        yield r

def test_alert_creation_on_watchlist_match(client, analytics_headers, seed_camera_and_watchlist, mock_redis, auth_headers_admin):
    cam_id, plate = seed_camera_and_watchlist
    
    # 1. Post event matching watchlist
    payload = {
        "event_id": "test-alert-event-1",
        "camera_id": cam_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "anpr",
        "vehicle_number": plate,
        "confidence": 0.98
    }
    r = client.post("/events", json=payload, headers=analytics_headers)
    assert r.status_code == 202
    data = r.json()
    assert data["alert_created"] is True
    alert_id = data["alert_id"]
    
    # 2. Get the alert
    r_alert = client.get(f"/alerts/{alert_id}", headers=auth_headers_admin)
    assert r_alert.status_code == 200
    alert_data = r_alert.json()
    assert alert_data["status"] == "new"
    assert alert_data["matched_identifier"] == plate
    assert alert_data["severity"] == "critical"

def test_alert_lifecycle_transitions(client, auth_headers_admin, auth_headers_operator, analytics_headers, seed_camera_and_watchlist, mock_redis):
    cam_id, plate = seed_camera_and_watchlist
    
    # Post event to create alert
    payload = {
        "event_id": "test-alert-event-2",
        "camera_id": cam_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "anpr",
        "vehicle_number": plate,
        "confidence": 0.98
    }
    r = client.post("/events", json=payload, headers=analytics_headers)
    alert_id = r.json()["alert_id"]
    
    # Operator acknowledges
    r_ack = client.post(f"/alerts/{alert_id}/acknowledge", headers=auth_headers_operator)
    assert r_ack.status_code == 200
    assert r_ack.json()["status"] == "acknowledged"
    
    # Admin resolves
    r_res = client.post(f"/alerts/{alert_id}/resolve", json={"notes": "Resolved by admin"}, headers=auth_headers_admin)
    assert r_res.status_code == 200
    assert r_res.json()["status"] == "resolved"
    
    # Verify actions
    r_actions = client.get(f"/alerts/{alert_id}/actions", headers=auth_headers_admin)
    assert r_actions.status_code == 200
    actions = r_actions.json()
    assert len(actions) == 2
    assert actions[0]["action"] == "acknowledged"
    assert actions[1]["action"] == "resolved"
    assert actions[1]["notes"] == "Resolved by admin"

def test_invalid_alert_transition(client, auth_headers_operator, analytics_headers, seed_camera_and_watchlist, mock_redis):
    cam_id, plate = seed_camera_and_watchlist
    
    # Post event
    payload = {
        "event_id": "test-alert-event-3",
        "camera_id": cam_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "anpr",
        "vehicle_number": plate
    }
    r = client.post("/events", json=payload, headers=analytics_headers)
    alert_id = r.json()["alert_id"]
    
    # Cannot resolve directly from new
    r_res = client.post(f"/alerts/{alert_id}/resolve", headers=auth_headers_operator)
    assert r_res.status_code == 409
    
    # Operator acknowledges
    client.post(f"/alerts/{alert_id}/acknowledge", headers=auth_headers_operator)
    
    # False positive works from acknowledged
    r_fp = client.post(f"/alerts/{alert_id}/false-positive", headers=auth_headers_operator)
    assert r_fp.status_code == 200
    
    # Cannot acknowledge a false positive
    r_ack2 = client.post(f"/alerts/{alert_id}/acknowledge", headers=auth_headers_operator)
    assert r_ack2.status_code == 409
