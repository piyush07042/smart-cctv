import pytest
from datetime import datetime, timezone, timedelta
from app.core.security import create_access_token, create_refresh_token

def test_login_brute_force_rate_limit(client):
    for _ in range(5):
        client.post("/auth/login", data={"username": "testadmin", "password": "wrong"})
    resp = client.post("/auth/login", data={"username": "testadmin", "password": "wrong"})
    assert resp.status_code == 429

def test_refresh_token_rotation(client):
    resp = client.post("/auth/login", data={"username": "testadmin", "password": "testpass"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    refresh_token = data["refresh_token"]

    # Refresh
    resp2 = client.post(f"/auth/refresh?refresh_token={refresh_token}")
    assert resp2.status_code == 200

    # Old refresh should fail
    resp3 = client.post(f"/auth/refresh?refresh_token={refresh_token}")
    assert resp3.status_code == 401

def test_logout_revokes_token(client):
    resp = client.post("/auth/login", data={"username": "testadmin", "password": "testpass"})
    token = resp.json()["access_token"]

    client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})

    resp2 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 401

def test_audit_admin_only(client):
    viewer_resp = client.post("/auth/login", data={"username": "testviewer", "password": "viewpass"})
    viewer_token = viewer_resp.json()["access_token"]
    
    admin_resp = client.post("/auth/login", data={"username": "testadmin", "password": "testpass"})
    admin_token = admin_resp.json()["access_token"]

    resp = client.get("/audit/", headers={"Authorization": f"Bearer {viewer_token}"})
    assert resp.status_code == 403

    resp2 = client.get("/audit/", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp2.status_code == 200
