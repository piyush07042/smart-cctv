"""
Event ingestion service — Phase 7.
Handles validation, deduplication, persistence, watchlist matching and alert creation.
"""
import json
import logging
import uuid as _uuid
from datetime import datetime, timezone
from math import ceil
from typing import Optional, Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cameras import Camera
from app.models.events import DetectionEvent
from app.schemas.events import EventIngestRequest, EventIngestResponse, normalize_plate
from app.services import watchlist as watchlist_svc
from app.services import alerts as alerts_svc

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _get_redis():
    try:
        from app.core.redis import get_redis
        return get_redis()
    except Exception:
        return None


def _dedup_key(camera_id: str, identifier: str, bucket: int) -> str:
    return f"event:dedup:{camera_id}:{identifier}:{bucket}"


def _suppression_key(camera_id: str, identifier: str) -> str:
    return f"event:suppress:{camera_id}:{identifier}"


def _rate_key(api_key: str) -> str:
    import time
    minute_bucket = int(time.time() // 60)
    return f"event:rate:{api_key}:{minute_bucket}"


def check_rate_limit(api_key: str) -> bool:
    """Returns True if rate limit exceeded."""
    r = _get_redis()
    if not r:
        return False
    try:
        key = _rate_key(api_key)
        count = r.incr(key)
        if count == 1:
            r.expire(key, 90)  # 90s TTL, covers the 60s minute bucket
        return count > settings.EVENT_RATE_LIMIT_PER_MINUTE
    except Exception as e:
        logger.warning(f"Rate limit check failed: {e}")
        return False


def ingest_event(
    db: Session,
    payload: EventIngestRequest,
    api_key: str = "",
) -> EventIngestResponse:
    """
    Full ingestion pipeline:
    1. Rate limit check
    2. Camera existence + enabled check
    3. Redis idempotency (event_id dedup)
    4. Redis ANPR suppression
    5. Persist event
    6. Watchlist match
    7. Alert creation with cooldown
    """
    r = _get_redis()

    # 1. Rate limit
    if check_rate_limit(api_key):
        raise HTTPException(status_code=429, detail="Event ingestion rate limit exceeded")

    # 2. Camera validation
    ts_naive = payload.timestamp.replace(tzinfo=None) if payload.timestamp.tzinfo else payload.timestamp
    camera = db.query(Camera).filter(Camera.camera_id == payload.camera_id).first()
    if not camera:
        raise HTTPException(status_code=422, detail=f"Camera '{payload.camera_id}' not found")
    if not camera.is_enabled:
        raise HTTPException(status_code=422, detail=f"Camera '{payload.camera_id}' is disabled")

    # 3. Event ID idempotency (external_event_id dedup via Redis SET NX + DB)
    external_event_id = payload.event_id
    if external_event_id:
        dedup_redis_key = f"event:id:{external_event_id}"
        if r:
            try:
                set_result = r.set(dedup_redis_key, "1", nx=True, ex=settings.EVENT_DEDUP_WINDOW_SECONDS)
                if set_result is None:
                    # Already exists in Redis — definitely a duplicate
                    existing = db.query(DetectionEvent).filter(DetectionEvent.event_id == external_event_id).first()
                    return EventIngestResponse(
                        event_id=external_event_id,
                        internal_id=str(existing.id) if existing else None,
                        status="duplicate",
                        duplicate=True,
                    )
            except Exception as e:
                logger.warning(f"Redis event-id dedup failed: {e}")
        # DB-level check as fallback
        existing = db.query(DetectionEvent).filter(DetectionEvent.event_id == external_event_id).first()
        if existing:
            return EventIngestResponse(
                event_id=external_event_id,
                internal_id=str(existing.id),
                status="duplicate",
                duplicate=True,
            )

    # 4. ANPR suppression (same plate + camera within window)
    if payload.event_type == "anpr" and payload.vehicle_number:
        sup_key = _suppression_key(payload.camera_id, payload.vehicle_number)
        if r:
            try:
                sup_result = r.set(sup_key, "1", nx=True, ex=settings.ANPR_SUPPRESSION_WINDOW_SECONDS)
                if sup_result is None:
                    return EventIngestResponse(
                        event_id=external_event_id,
                        internal_id=None,
                        status="duplicate",
                        duplicate=True,
                    )
            except Exception as e:
                logger.warning(f"ANPR suppression Redis failed: {e}")

    # 5. Persist event (within a transaction)
    event = DetectionEvent(
        event_id=external_event_id,
        camera_id=payload.camera_id,
        timestamp=ts_naive,
        event_type=payload.event_type,
        vehicle_number=payload.vehicle_number,
        vehicle_type=payload.vehicle_type,
        confidence=payload.confidence,
        bounding_box=payload.bounding_box.model_dump() if payload.bounding_box else None,
        image_ref=payload.image_ref,
        extra_metadata=payload.metadata,
    )
    db.add(event)
    db.flush()  # get event.id before matching

    # 6. Watchlist match
    alert_created = False
    alert_id = None
    if payload.vehicle_number:
        match = watchlist_svc.match_identifier(db, payload.vehicle_number)
        if match:
            # 7. Alert creation with cooldown
            alert, created = alerts_svc.get_or_create_alert(db, event, match, camera, r)
            alert_created = created
            alert_id = str(alert.id)
            if created:
                logger.info(
                    f"Alert created: {alert.id} for {payload.vehicle_number} at {payload.camera_id}"
                )
                alerts_svc._publish_alert(
                    camera.camera_id, str(alert.id), payload.vehicle_number,
                    match.severity or "medium", "new", _utcnow()
                )

    db.commit()
    
    # Publish to events.new
    try:
        from app.realtime.publisher import publish_realtime
        payload = {
            "event_id": external_event_id,
            "internal_id": str(event.id),
            "camera_id": payload.camera_id,
            "timestamp": ts_naive.isoformat(),
            "event_type": payload.event_type,
            "vehicle_number": payload.vehicle_number,
            "vehicle_type": payload.vehicle_type,
            "confidence": payload.confidence,
        }
        publish_realtime("events.new", "event.created", payload)
    except Exception as e:
        logger.warning(f"Failed to publish event.created: {e}")

    return EventIngestResponse(
        event_id=external_event_id,
        internal_id=str(event.id),
        status="accepted",
        duplicate=False,
        alert_created=alert_created,
        alert_id=alert_id,
    )


def ingest_batch(db: Session, events: list[EventIngestRequest], api_key: str = "") -> dict:
    results = []
    accepted = duplicates = errors = 0
    for ev in events:
        try:
            result = ingest_event(db, ev, api_key)
            results.append(result)
            if result.duplicate:
                duplicates += 1
            else:
                accepted += 1
        except HTTPException as e:
            errors += 1
            results.append(EventIngestResponse(
                event_id=ev.event_id,
                internal_id=None,
                status=f"error:{e.detail}",
                duplicate=False,
            ))
        except Exception as e:
            errors += 1
            results.append(EventIngestResponse(
                event_id=ev.event_id,
                internal_id=None,
                status=f"error:{str(e)}",
                duplicate=False,
            ))
    return {"accepted": accepted, "duplicates": duplicates, "errors": errors, "results": results}


def list_events(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    vehicle_number: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    min_confidence: Optional[float] = None,
):
    q = db.query(DetectionEvent)
    if camera_id:
        q = q.filter(DetectionEvent.camera_id == camera_id)
    if event_type:
        q = q.filter(DetectionEvent.event_type == event_type)
    if vehicle_number:
        norm = normalize_plate(vehicle_number)
        q = q.filter(DetectionEvent.vehicle_number == norm)
    if from_ts:
        q = q.filter(DetectionEvent.timestamp >= from_ts.replace(tzinfo=None))
    if to_ts:
        q = q.filter(DetectionEvent.timestamp <= to_ts.replace(tzinfo=None))
    if min_confidence is not None:
        q = q.filter(DetectionEvent.confidence >= min_confidence)
    total = q.count()
    items = q.order_by(DetectionEvent.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total, ceil(total / page_size) if total else 1


import uuid

def get_event(db: Session, event_id: str) -> DetectionEvent:
    if isinstance(event_id, str):
        event_id = uuid.UUID(event_id)
    event = db.query(DetectionEvent).filter(DetectionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
