"""
CSV export service — Phase 9.
Server-side generation with RBAC, audit logging, and size limits.
"""
import csv
import io
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.alerts import Alert
from app.models.cameras import CameraAuditLog
from app.models.events import DetectionEvent
from app.services.entities import MAX_EXPORT_ROWS, MAX_EXPORT_DAYS

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _write_audit(db: Session, user_id, actor: str, export_type: str, filters: dict) -> None:
    try:
        log = CameraAuditLog(
            camera_id="SYSTEM",
            user_id=user_id,
            action=f"EXPORT_{export_type.upper()}",
            resource_type="export",
            resource_id=export_type,
            old_value=None,
            new_value={"actor": actor, "filters": filters, "at": _utcnow().isoformat()},
            timestamp=_utcnow(),
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.warning(f"Export audit log failed: {e}")


def export_events_csv(
    db: Session,
    *,
    user_id,
    actor: str,
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    vehicle_number: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    min_confidence: Optional[float] = None,
) -> str:
    """
    Export detection events as CSV string.
    Max rows = MAX_EXPORT_ROWS, max range = MAX_EXPORT_DAYS.
    """
    if not to_ts:
        to_ts = _utcnow()
    if not from_ts:
        from_ts = to_ts - timedelta(hours=24)

    from_ts = from_ts.replace(tzinfo=None)
    to_ts = to_ts.replace(tzinfo=None)

    if (to_ts - from_ts).days > MAX_EXPORT_DAYS:
        raise HTTPException(
            status_code=422,
            detail=f"Export range must not exceed {MAX_EXPORT_DAYS} days. Narrow your filters."
        )

    q = db.query(DetectionEvent)
    if camera_id:
        q = q.filter(DetectionEvent.camera_id == camera_id)
    if event_type:
        q = q.filter(DetectionEvent.event_type == event_type.lower())
    if vehicle_number:
        from app.schemas.events import normalize_plate
        q = q.filter(DetectionEvent.vehicle_number == normalize_plate(vehicle_number))
    if min_confidence is not None:
        q = q.filter(DetectionEvent.confidence >= min_confidence)
    q = q.filter(DetectionEvent.timestamp >= from_ts, DetectionEvent.timestamp <= to_ts)

    total = q.count()
    if total > MAX_EXPORT_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"Export would return {total} rows (max {MAX_EXPORT_ROWS}). Narrow your filters."
        )

    items = q.order_by(DetectionEvent.timestamp.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "event_id", "camera_id", "timestamp", "event_type",
        "vehicle_number", "vehicle_type", "confidence", "image_ref", "created_at"
    ])
    for e in items:
        writer.writerow([
            str(e.id), e.event_id or "", e.camera_id,
            e.timestamp.isoformat(), e.event_type,
            e.vehicle_number or "", e.vehicle_type or "",
            e.confidence if e.confidence is not None else "",
            e.image_ref or "", e.created_at.isoformat()
        ])

    _write_audit(db, user_id, actor, "events", {
        "camera_id": camera_id, "event_type": event_type,
        "vehicle_number": vehicle_number, "from": from_ts.isoformat(),
        "to": to_ts.isoformat(), "rows": len(items)
    })

    return output.getvalue()


def export_alerts_csv(
    db: Session,
    *,
    user_id,
    actor: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    camera_id: Optional[str] = None,
    matched_identifier: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
) -> str:
    """Export alerts as CSV string."""
    if not to_ts:
        to_ts = _utcnow()
    if not from_ts:
        from_ts = to_ts - timedelta(hours=24)

    from_ts = from_ts.replace(tzinfo=None)
    to_ts = to_ts.replace(tzinfo=None)

    if (to_ts - from_ts).days > MAX_EXPORT_DAYS:
        raise HTTPException(
            status_code=422,
            detail=f"Export range must not exceed {MAX_EXPORT_DAYS} days. Narrow your filters."
        )

    q = db.query(Alert)
    if status:
        q = q.filter(Alert.status == status)
    if severity:
        q = q.filter(Alert.severity == severity)
    if camera_id:
        q = q.filter(Alert.camera_id == camera_id)
    if matched_identifier:
        q = q.filter(Alert.matched_identifier == matched_identifier)
    q = q.filter(Alert.created_at >= from_ts, Alert.created_at <= to_ts)

    total = q.count()
    if total > MAX_EXPORT_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"Export would return {total} rows (max {MAX_EXPORT_ROWS}). Narrow your filters."
        )

    items = q.order_by(Alert.created_at.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "camera_id", "camera_name", "matched_identifier", "severity",
        "status", "confidence", "repeat_count", "created_at",
        "acknowledged_by", "acknowledged_at", "resolved_by", "resolved_at"
    ])
    for a in items:
        writer.writerow([
            str(a.id), a.camera_id or "", a.camera_name or "",
            a.matched_identifier or "", a.severity, a.status,
            a.confidence if a.confidence is not None else "",
            a.repeat_count, a.created_at.isoformat(),
            a.acknowledged_by or "", a.acknowledged_at.isoformat() if a.acknowledged_at else "",
            a.resolved_by or "", a.resolved_at.isoformat() if a.resolved_at else "",
        ])

    _write_audit(db, user_id, actor, "alerts", {
        "status": status, "severity": severity, "camera_id": camera_id,
        "matched_identifier": matched_identifier,
        "from": from_ts.isoformat(), "to": to_ts.isoformat(), "rows": len(items)
    })

    return output.getvalue()
