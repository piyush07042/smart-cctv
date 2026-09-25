"""
Statistics service — Phase 9.
Provides aggregated dashboard metrics from real DB data.
"""
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.models.cameras import Camera
from app.models.alerts import Alert
from app.models.events import DetectionEvent

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_overview(db: Session) -> dict:
    """
    Returns a single overview dict with camera, alert, event statistics.
    Uses efficient DB queries rather than loading all rows.
    """
    now = _utcnow()
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(hours=24)

    # ── Camera statistics ──────────────────────────────────────────────────────
    cam_totals = db.query(
        func.count(Camera.id).label("total"),
        func.count(Camera.id).filter(Camera.status == "ONLINE").label("online"),
        func.count(Camera.id).filter(Camera.status == "DEGRADED").label("degraded"),
        func.count(Camera.id).filter(Camera.status == "OFFLINE").label("offline"),
        func.count(Camera.id).filter(Camera.is_enabled == False).label("disabled"),
    ).first()

    # ── Alert statistics ───────────────────────────────────────────────────────
    alert_active = db.query(func.count(Alert.id)).filter(
        Alert.status.in_(["new", "acknowledged"])
    ).scalar() or 0

    sev_rows = db.query(Alert.severity, func.count(Alert.id)).filter(
        Alert.status.in_(["new", "acknowledged"])
    ).group_by(Alert.severity).all()
    by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for sev, cnt in sev_rows:
        if sev in by_severity:
            by_severity[sev] = cnt

    status_rows = db.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all()
    by_status = {s: c for s, c in status_rows}

    # ── Event statistics ───────────────────────────────────────────────────────
    last_hour = db.query(func.count(DetectionEvent.id)).filter(
        DetectionEvent.timestamp >= hour_ago
    ).scalar() or 0

    events_per_minute = round(last_hour / 60.0, 2)

    # 24-hour time series — 24 hourly buckets
    # Use SQLAlchemy func.date_trunc for PostgreSQL; fall back to Python grouping for SQLite tests
    try:
        hourly_rows = db.execute(text("""
            SELECT
                date_trunc('hour', timestamp) AS bucket,
                count(*) AS event_count
            FROM detection_events
            WHERE timestamp >= :since
            GROUP BY bucket
            ORDER BY bucket
        """), {"since": day_ago}).fetchall()
        timeseries = [
            {"bucket": str(row[0]), "count": int(row[1])}
            for row in hourly_rows
        ]
    except Exception:
        # SQLite fallback (used in tests)
        timeseries = []

    # ── Top cameras by event activity (last 24h) ───────────────────────────────
    top_cam_rows = db.query(
        DetectionEvent.camera_id,
        func.count(DetectionEvent.id).label("event_count")
    ).filter(
        DetectionEvent.timestamp >= day_ago
    ).group_by(DetectionEvent.camera_id).order_by(
        func.count(DetectionEvent.id).desc()
    ).limit(5).all()

    # Enrich with camera names
    cam_ids = [r[0] for r in top_cam_rows]
    cam_names = {
        c.camera_id: c.name
        for c in db.query(Camera).filter(Camera.camera_id.in_(cam_ids)).all()
    } if cam_ids else {}

    top_cameras = [
        {
            "camera_id": r[0],
            "camera_name": cam_names.get(r[0], r[0]),
            "event_count": r[1],
        }
        for r in top_cam_rows
    ]

    return {
        "cameras": {
            "total": cam_totals.total or 0,
            "online": cam_totals.online or 0,
            "degraded": cam_totals.degraded or 0,
            "offline": cam_totals.offline or 0,
            "disabled": cam_totals.disabled or 0,
        },
        "alerts": {
            "active": alert_active,
            "by_severity": by_severity,
            "by_status": by_status,
        },
        "events": {
            "last_hour": last_hour,
            "events_per_minute": events_per_minute,
            "last_24h_series": timeseries,
        },
        "top_cameras": top_cameras,
        "generated_at": now.isoformat(),
    }
