import pytest
from datetime import datetime, timezone
from app.schemas.events import normalize_plate

@pytest.fixture
def auth_headers_admin(client):
    r = client.post("/auth/login", data={"username": "testadmin", "password": "testpass"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

@pytest.fixture
def auth_headers_operator(client):
    r = client.post("/auth/login", data={"username": "testoperator", "password": "operpass"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

@pytest.fixture
def auth_headers_viewer(client):
    r = client.post("/auth/login", data={"username": "testviewer", "password": "viewpass"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

def test_normalize_plate():
    assert normalize_plate("GJ 01 XX 0001") == "GJ01XX0001"
    assert normalize_plate("gj-01-xx-0001") == "GJ01XX0001"
    assert normalize_plate("GJ01XX0001") == "GJ01XX0001"

def test_admin_can_create_watchlist(client, auth_headers_admin):
    payload = {
        "entity_type": "vehicle",
        "identifier": "MH 12 AB 1234",
        "category": "stolen",
        "severity": "high"
    }
    r = client.post("/watchlist", json=payload, headers=auth_headers_admin)
    assert r.status_code == 201
    assert r.json()["identifier"] == "MH12AB1234" # Should be normalized

def test_operator_cannot_create_watchlist(client, auth_headers_operator):
    payload = {
        "entity_type": "vehicle",
        "identifier": "DL01CD5678",
        "category": "stolen"
    }
    r = client.post("/watchlist", json=payload, headers=auth_headers_operator)
    assert r.status_code == 403

def test_viewer_can_list_watchlist(client, auth_headers_viewer):
    r = client.get("/watchlist", headers=auth_headers_viewer)
    assert r.status_code == 200

def test_admin_can_update_watchlist(client, auth_headers_admin):
    # Create
    payload = {
        "entity_type": "person",
        "identifier": "WANTED-001",
        "category": "wanted",
        "severity": "high"
    }
    r1 = client.post("/watchlist", json=payload, headers=auth_headers_admin)
    entry_id = r1.json()["id"]

    # Update
    r2 = client.patch(f"/watchlist/{entry_id}", json={"severity": "critical"}, headers=auth_headers_admin)
    assert r2.status_code == 200
    assert r2.json()["severity"] == "critical"

def test_admin_can_deactivate_watchlist(client, auth_headers_admin):
    payload = {
        "entity_type": "vehicle",
        "identifier": "KA04EF9012",
        "category": "stolen"
    }
    r1 = client.post("/watchlist", json=payload, headers=auth_headers_admin)
    entry_id = r1.json()["id"]

    r2 = client.delete(f"/watchlist/{entry_id}", headers=auth_headers_admin)
    assert r2.status_code == 200
    assert r2.json()["is_active"] is False

def test_watchlist_seed(client, auth_headers_admin):
    r = client.post("/watchlist/seed", headers=auth_headers_admin)
    assert r.status_code == 200
    assert r.json()["created"] > 0
