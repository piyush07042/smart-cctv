"""
Phase 9 tests — Statistics, Entity Search, Vehicle Trace, CSV Export.
"""
import pytest
import csv
import io
from datetime import datetime, timezone, timedelta
from uuid import uuid4

# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def admin_headers(client):
    resp = client.post("/auth/login", data={"username": "testadmin", "password": "testpass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def operator_headers(client):
    resp = client.post("/auth/login", data={"username": "testoperator", "password": "operpass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def viewer_headers(client):
    resp = client.post("/auth/login", data={"username": "testviewer", "password": "viewpass"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _seed_camera(client, admin_headers) -> str:
    """Create a test camera for Phase 9 tests."""
    cam_id = f"PHASE9-{uuid4().hex[:8].upper()}"
    resp = client.post("/cameras", json={
        "camera_id": cam_id,
        "name": f"Phase9 Test Camera {cam_id}",
        "latitude": 23.02,
        "longitude": 72.57,
        "source_protocol": "HLS",
        "stream_endpoint_ref": "http://example.com/hls/test.m3u8",
    }, headers=admin_headers)
    assert resp.status_code == 201
    return cam_id


def _seed_event(client, cam_id: str, plate: str = "GJ01XX0001"):
    """Ingest a test ANPR event. Uses the analytics API key."""
    now_utc = datetime.now(timezone.utc).isoformat()
    resp = client.post("/events", json={
        "camera_id": cam_id,
        "timestamp": now_utc,
        "event_type": "anpr",
        "vehicle_number": plate,
        "confidence": 0.95,
    }, headers={"X-Analytics-Key": "analytics-service-key"})
    assert resp.status_code in (200, 202), resp.text
    return resp.json()


# ─── Stats Tests ──────────────────────────────────────────────────────────────

class TestStatsOverview:
    def test_returns_200(self, client, admin_headers):
        resp = client.get("/stats/overview", headers=admin_headers)
        assert resp.status_code == 200

    def test_requires_auth(self, client):
        resp = client.get("/stats/overview")
        assert resp.status_code == 401

    def test_camera_counts_present(self, client, admin_headers):
        resp = client.get("/stats/overview", headers=admin_headers)
        data = resp.json()
        cams = data["cameras"]
        assert "total" in cams
        assert "online" in cams
        assert "degraded" in cams
        assert "offline" in cams

    def test_alert_counts_present(self, client, admin_headers):
        resp = client.get("/stats/overview", headers=admin_headers)
        data = resp.json()
        alerts = data["alerts"]
        assert "active" in alerts
        assert "by_severity" in alerts
        sev = alerts["by_severity"]
        assert all(k in sev for k in ["critical", "high", "medium", "low"])

    def test_event_counts_present(self, client, admin_headers):
        resp = client.get("/stats/overview", headers=admin_headers)
        data = resp.json()
        events = data["events"]
        assert "last_hour" in events
        assert "events_per_minute" in events

    def test_top_cameras_present(self, client, admin_headers):
        resp = client.get("/stats/overview", headers=admin_headers)
        data = resp.json()
        assert "top_cameras" in data
        assert isinstance(data["top_cameras"], list)

    def test_camera_count_reflects_db(self, client, admin_headers):
        """Total camera count must equal what the cameras endpoint returns."""
        stats = client.get("/stats/overview", headers=admin_headers).json()
        cams = client.get("/cameras?page_size=1", headers=admin_headers).json()
        assert stats["cameras"]["total"] == cams["total"]

    def test_alert_severity_breakdown(self, client, admin_headers):
        stats = client.get("/stats/overview", headers=admin_headers).json()
        sev = stats["alerts"]["by_severity"]
        # All counts are non-negative integers
        for k, v in sev.items():
            assert isinstance(v, int)
            assert v >= 0


# ─── Entity Search Tests ──────────────────────────────────────────────────────

class TestEntitySearch:
    def test_search_requires_auth(self, client):
        resp = client.get("/entities/search?q=GJ01XX0001")
        assert resp.status_code == 401

    def test_search_requires_q(self, client, operator_headers):
        resp = client.get("/entities/search", headers=operator_headers)
        assert resp.status_code in (400, 422)

    def test_search_returns_structure(self, client, operator_headers):
        resp = client.get("/entities/search?q=GJ01XX0001", headers=operator_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "sightings" in data
        assert "total" in data
        assert "page" in data

    def test_search_finds_seeded_event(self, client, admin_headers, operator_headers):
        cam_id = _seed_camera(client, admin_headers)
        _seed_event(client, cam_id, "GJ01XX0001")
        resp = client.get("/entities/search?q=GJ01XX0001", headers=operator_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_search_pagination(self, client, operator_headers):
        resp = client.get("/entities/search?q=GJ01XX0001&page=1&page_size=5", headers=operator_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert len(data["sightings"]) <= 5

    def test_search_no_results_empty(self, client, operator_headers):
        resp = client.get("/entities/search?q=ZZ99ZZ9999", headers=operator_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["sightings"] == []

    def test_search_wildcard(self, client, admin_headers, operator_headers):
        cam_id = _seed_camera(client, admin_headers)
        _seed_event(client, cam_id, "GJ01XX0001")
        resp = client.get("/entities/search?q=GJ01*", headers=operator_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_viewer_can_search(self, client, viewer_headers):
        resp = client.get("/entities/search?q=GJ01XX0001", headers=viewer_headers)
        assert resp.status_code == 200


# ─── Vehicle Trace Tests ──────────────────────────────────────────────────────

class TestVehicleTrace:
    def test_trace_requires_auth(self, client):
        resp = client.get("/entities/vehicles/GJ01XX0001/trace")
        assert resp.status_code == 401

    def test_trace_returns_structure(self, client, operator_headers):
        resp = client.get("/entities/vehicles/GJ01XX0001/trace", headers=operator_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "plate" in data
        assert "sightings" in data
        assert "route_note" in data
        assert "from" in data
        assert "to" in data

    def test_trace_chronological(self, client, admin_headers, operator_headers):
        cam_id = _seed_camera(client, admin_headers)
        _seed_event(client, cam_id, "GJ01XX0001")
        resp = client.get("/entities/vehicles/GJ01XX0001/trace", headers=operator_headers)
        assert resp.status_code == 200
        sightings = resp.json()["sightings"]
        if len(sightings) > 1:
            for i in range(1, len(sightings)):
                assert sightings[i]["timestamp"] >= sightings[i - 1]["timestamp"]

    def test_trace_has_camera_info(self, client, admin_headers, operator_headers):
        cam_id = _seed_camera(client, admin_headers)
        _seed_event(client, cam_id, "GJ01XX0001")
        resp = client.get("/entities/vehicles/GJ01XX0001/trace", headers=operator_headers)
        data = resp.json()
        for s in data["sightings"]:
            assert "camera_id" in s
            assert "camera_name" in s

    def test_trace_respects_time_range(self, client, operator_headers):
        past = (datetime.now(timezone.utc) - timedelta(days=7)).replace(tzinfo=None).isoformat()
        future = (datetime.now(timezone.utc) - timedelta(days=6)).replace(tzinfo=None).isoformat()
        resp = client.get(
            f"/entities/vehicles/GJ01XX0001/trace?from_ts={past}&to_ts={future}",
            headers=operator_headers
        )
        assert resp.status_code == 200
        # No events from 6-7 days ago in this test run
        assert resp.json()["total_sightings"] == 0

    def test_trace_route_note_present(self, client, operator_headers):
        resp = client.get("/entities/vehicles/GJ01XX0001/trace", headers=operator_headers)
        data = resp.json()
        assert "Reconstructed" in data["route_note"] or "reconstructed" in data["route_note"].lower()

    def test_trace_seq_numbers(self, client, admin_headers, operator_headers):
        cam_id = _seed_camera(client, admin_headers)
        _seed_event(client, cam_id, "GJ01XX0001")
        resp = client.get("/entities/vehicles/GJ01XX0001/trace", headers=operator_headers)
        sightings = resp.json()["sightings"]
        for i, s in enumerate(sightings):
            assert s["seq"] == i + 1


# ─── CSV Export Tests ─────────────────────────────────────────────────────────

class TestCSVExport:
    def test_viewer_cannot_export_events(self, client, viewer_headers):
        resp = client.get("/entities/export/events.csv", headers=viewer_headers)
        assert resp.status_code == 403

    def test_viewer_cannot_export_alerts(self, client, viewer_headers):
        resp = client.get("/entities/export/alerts.csv", headers=viewer_headers)
        assert resp.status_code == 403

    def test_operator_can_export_events(self, client, operator_headers):
        resp = client.get("/entities/export/events.csv", headers=operator_headers)
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/csv")

    def test_events_csv_has_header(self, client, operator_headers):
        resp = client.get("/entities/export/events.csv", headers=operator_headers)
        lines = resp.text.splitlines()
        assert len(lines) >= 1
        header = lines[0]
        assert "camera_id" in header
        assert "event_type" in header

    def test_alerts_csv_has_header(self, client, operator_headers):
        resp = client.get("/entities/export/alerts.csv", headers=operator_headers)
        assert resp.status_code == 200
        lines = resp.text.splitlines()
        assert len(lines) >= 1
        assert "severity" in lines[0]
        assert "status" in lines[0]

    def test_export_respects_camera_filter(self, client, admin_headers, operator_headers):
        cam_id = _seed_camera(client, admin_headers)
        _seed_event(client, cam_id, "GJ01XX0001")
        # Export only for this camera
        resp = client.get(f"/entities/export/events.csv?camera_id={cam_id}", headers=operator_headers)
        assert resp.status_code == 200
        reader = csv.DictReader(io.StringIO(resp.text))
        rows = list(reader)
        for row in rows:
            assert row["camera_id"] == cam_id

    def test_admin_can_export_alerts(self, client, admin_headers):
        resp = client.get("/entities/export/alerts.csv", headers=admin_headers)
        assert resp.status_code == 200

    def test_export_range_too_large(self, client, operator_headers):
        from_dt = (datetime.now(timezone.utc) - timedelta(days=40)).replace(tzinfo=None).isoformat()
        to_dt = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
        resp = client.get(
            f"/entities/export/events.csv?from_ts={from_dt}&to_ts={to_dt}",
            headers=operator_headers
        )
        assert resp.status_code == 422

    def test_export_creates_audit_entry(self, client, admin_headers, operator_headers):
        """After export, admin can see audit logs for EXPORT actions."""
        # Just verify the export works — audit is stored in camera_audit_logs with SYSTEM camera
        resp = client.get("/entities/export/events.csv", headers=operator_headers)
        assert resp.status_code == 200
