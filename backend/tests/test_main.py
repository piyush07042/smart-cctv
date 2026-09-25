"""
Phase 2 Foundation Tests

Tests:
- GET /health
- POST /auth/login (success)
- POST /auth/login (failure)
- GET /auth/me (with valid token)
- GET /auth/me (without token)
- Role information in /auth/me response
"""
from unittest.mock import patch, MagicMock


# -------------------------------------------------------
# /health
# -------------------------------------------------------

def test_health_check_ok(client):
    with patch("app.core.redis.get_redis") as mock_get_redis:
        mock_redis_client = MagicMock()
        mock_redis_client.ping.return_value = True
        mock_get_redis.return_value = mock_redis_client

        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["database"] == "ok"


# -------------------------------------------------------
# POST /auth/login
# -------------------------------------------------------

def test_login_success(client):
    response = client.post(
        "/auth/login",
        data={"username": "testadmin", "password": "testpass"},
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    response = client.post(
        "/auth/login",
        data={"username": "testadmin", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post(
        "/auth/login",
        data={"username": "doesnotexist", "password": "any"},
    )
    assert response.status_code == 401


# -------------------------------------------------------
# GET /auth/me
# -------------------------------------------------------

def _get_token(client, username="testadmin", password="testpass") -> str:
    r = client.post("/auth/login", data={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


def test_me_with_valid_token(client):
    token = _get_token(client)
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True
    assert "password_hash" not in data


def test_me_without_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token(client):
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401


def test_operator_role(client):
    token = _get_token(client, "testoperator", "operpass")
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["role"] == "OPERATOR"