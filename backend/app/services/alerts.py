"""
Alert service — Phase 7.
Handles creation, cooldown, lifecycle transitions, and alert actions.
"""
import json
import logging
from datetime import datetime, timezone
from math import ceil
from typing import Any, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.alerts import Alert, AlertAction, WatchlistEntry
from app.models.events import DetectionEvent
from app.models.cameras import Camera, CameraAuditLog
from app.schemas.alerts import VALID_TRANSITIONS

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _audit(db: Session, user_id: Any, action: str, resource_id: str, old: Any = None, new: Any = None):
    try:
        log = CameraAuditLog(
            camera_id="SYSTEM",
            user_id=user_id, action=action, resource_type="alert",
            resource_id=resource_id, old_value=old, new_value=new, timestamp=_utcnow(),
        )
        db.add(log)
    except Exception as e:
        logger.warning(f"Alert audit failed: {e}")


def _publish_alert(camera_id: str, alert_id: str, matched_id: str, severity: str, status: str, timestamp: datetime):
    """Publish to Redis alert.new channel (Phase 8 will consume this)."""
    from app.realtime.publisher import publish_realtime
    
    payload = {
        "alert_id": alert_id,
        "camera_id": camera_id,
        "matched_identifier": matched_id,
        "severity": severity,
        "status": status,
    }
    
    msg_type = "alert.updated" if status in ["acknowledged", "resolved", "false_positive"] else "alert.created"
    channel = "alerts.updated" if msg_type == "alert.updated" else "alerts.new"
    
    publish_realtime(channel, msg_type, payload)


def get_or_create_alert(
    db: Session,
    event: DetectionEvent,
    watchlist_entry: WatchlistEntry,
    camera: Camera,
    redis_client=None,
) -> tuple[Alert, bool]:
    """
    Returns (alert, created).
    Enforces cooldown: same watchlist entry + camera → at most 1 new alert per ALERT_COOLDOWN_SECONDS.
    """
    from app.core.config import settings

    # Check cooldown via Redis
    cooldown_key = f"alert:cooldown:{watchlist_entry.id}:{camera.camera_id}"
    if redis_client:
        try:
            existing_key = redis_client.get(cooldown_key)
            if existing_key:
                # Within cooldown — increment repeat_count on existing alert
                existing_alert = db.query(Alert).filter(
                    Alert.id == existing_key,
                    Alert.status.in_(["new", "acknowledged"]),
                ).first()
                if existing_alert:
                    existing_alert.repeat_count += 1
                    return existing_alert, False
        except Exception as e:
            logger.warning(f"Redis cooldown check failed: {e}")

    # Create new alert
    alert = Alert(
        detection_id=event.id,
        watchlist_entry_id=watchlist_entry.id,
        camera_id=camera.camera_id,
        camera_name=camera.name,
        latitude=camera.latitude,
        longitude=camera.longitude,
        matched_identifier=event.vehicle_number,
        confidence=event.confidence,
        severity=watchlist_entry.severity or "medium",
        status="new",
        repeat_count=0,
    )
    db.add(alert)
    db.flush()  # get id before setting Redis

    # Set cooldown
    if redis_client:
        try:
            redis_client.setex(cooldown_key, settings.ALERT_COOLDOWN_SECONDS, str(alert.id))
        except Exception as e:
            logger.warning(f"Redis cooldown set failed: {e}")

    return alert, True


def list_alerts(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    camera_id: Optional[str] = None,
    matched_identifier: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
):
    q = db.query(Alert)
    if status:
        q = q.filter(Alert.status == status)
    if severity:
        q = q.filter(Alert.severity == severity)
    if camera_id:
        q = q.filter(Alert.camera_id == camera_id)
    if matched_identifier:
        q = q.filter(Alert.matched_identifier == matched_identifier)
    if from_ts:
        q = q.filter(Alert.created_at >= from_ts.replace(tzinfo=None))
    if to_ts:
        q = q.filter(Alert.created_at <= to_ts.replace(tzinfo=None))
    total = q.count()
    items = q.order_by(Alert.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, ceil(total / page_size) if total else 1


import uuid

def get_alert(db: Session, alert_id: str) -> Alert:
    if isinstance(alert_id, str):
        alert_id = uuid.UUID(alert_id)
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


def _transition(db: Session, alert_id: str, action: str, actor: str, user_id: Any = None, notes: str = None) -> Alert:
    alert = get_alert(db, alert_id)
    allowed = VALID_TRANSITIONS.get(alert.status, set())
    target_status_map = {
        "acknowledge": "acknowledged",
        "resolve": "resolved",
        "false_positive": "false_positive",
    }
    new_status = target_status_map[action]
    if new_status not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot transition from '{alert.status}' to '{new_status}'"
        )
    old_status = alert.status
    alert.status = new_status
    now = _utcnow()
    if new_status == "acknowledged":
        alert.acknowledged_by = actor
        alert.acknowledged_at = now
    elif new_status == "resolved":
        alert.resolved_by = actor
        alert.resolved_at = now

    action_record = AlertAction(
        alert_id=alert.id,
        user_id=user_id,
        action=new_status,
        notes=notes,
        timestamp=now,
    )
    db.add(action_record)
    _audit(db, user_id, f"ALERT_{action.upper()}", str(alert.id), old={"status": old_status}, new={"status": new_status})
    db.commit()
    db.refresh(alert)
    
    _publish_alert(
        alert.camera_id, str(alert.id), alert.matched_identifier, 
        alert.severity, alert.status, now
    )
    
    return alert


def acknowledge_alert(db: Session, alert_id: str, actor: str, user_id: Any = None, notes: str = None) -> Alert:
    return _transition(db, alert_id, "acknowledge", actor, user_id, notes)


def resolve_alert(db: Session, alert_id: str, actor: str, user_id: Any = None, notes: str = None) -> Alert:
    return _transition(db, alert_id, "resolve", actor, user_id, notes)


def false_positive_alert(db: Session, alert_id: str, actor: str, user_id: Any = None, notes: str = None) -> Alert:
    return _transition(db, alert_id, "false_positive", actor, user_id, notes)


def get_alert_actions(db: Session, alert_id: str) -> list[AlertAction]:
    if isinstance(alert_id, str):
        alert_id = uuid.UUID(alert_id)
    get_alert(db, str(alert_id))  # 404 check, stringify because get_alert handles it
    return db.query(AlertAction).filter(AlertAction.alert_id == alert_id).order_by(AlertAction.timestamp).all()
