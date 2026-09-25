from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
import json

from app.models.cameras import Camera, CameraHealthEvent
from app.schemas.cameras import CameraHeartbeatRequest, CameraHeartbeatResponse
from app.models.enums import CameraStatus
from app.core.config import settings

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

def _publish_status_change(db: Session, camera_id: str, old_status: str, new_status: str, timestamp: datetime):
    # This uses redis logic, we'll try to import our redis client.
    # In Phase 2, redis was configured but maybe not wrapped in a global. Let's check how redis is used.
    # For now, we'll construct the payload and try to publish it via redis if we can.
    try:
        from app.core.redis import redis_client
        if redis_client:
            payload = {
                "type": "camera.health",
                "version": 1,
                "timestamp": timestamp.isoformat(),
                "payload": {
                    "camera_id": camera_id,
                    "old": old_status,
                    "new": new_status,
                    "at": timestamp.isoformat()
                }
            }
            redis_client.publish("camera.health", json.dumps(payload))
    except Exception as e:
        import logging
        logging.warning(f"Failed to publish health change to Redis for {camera_id}: {e}")

def process_heartbeat(db: Session, camera_id: str, payload: CameraHeartbeatRequest) -> CameraHeartbeatResponse:
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    if not camera.is_enabled:
        raise HTTPException(status_code=400, detail="Camera is disabled")
        
    # Validation: timestamp must not be from the future
    now = _utcnow()
    # Allowing small clock skew
    if payload.timestamp > now + timedelta(minutes=5):
        raise HTTPException(status_code=400, detail="Timestamp is too far in the future")

    # Evaluate Degraded vs Online
    new_status = CameraStatus.ONLINE
    
    if payload.fps is not None and payload.fps < settings.DEGRADED_FPS_THRESHOLD:
        new_status = CameraStatus.DEGRADED
    if payload.latency_ms is not None and payload.latency_ms > settings.DEGRADED_LATENCY_MS:
        new_status = CameraStatus.DEGRADED
    if payload.packet_loss is not None and payload.packet_loss > settings.DEGRADED_PACKET_LOSS_PERCENT:
        new_status = CameraStatus.DEGRADED

    # If the camera was offline and we got a heartbeat, it immediately becomes ONLINE/DEGRADED (no hysteresis for recovery).
    # Update camera row
    old_status = camera.status
    camera.last_heartbeat = payload.timestamp.replace(tzinfo=None) # store naive internally if needed, or aware.
    
    if old_status != new_status.value:
        camera.status = new_status.value
        
        # Write health history event
        health_event = CameraHealthEvent(
            camera_id=camera_id,
            timestamp=payload.timestamp.replace(tzinfo=None),
            status=new_status.value,
            previous_status=old_status,
            fps=payload.fps,
            bitrate=payload.bitrate,
            latency_ms=payload.latency_ms,
            packet_loss=payload.packet_loss,
            failure_count=0,
            source="push"
        )
        db.add(health_event)
        
        # Publish — failure must NOT propagate
        try:
            _publish_status_change(camera_id, old_status, new_status.value, payload.timestamp)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Redis publish skipped for {camera_id}: {e}")

    db.commit()
    
    return CameraHeartbeatResponse(
        camera_id=camera_id,
        accepted=True,
        status=new_status,
        received_at=now,
        next_expected_before=now + timedelta(seconds=settings.HEARTBEAT_OFFLINE_SECONDS)
    )

def get_health_history(db: Session, camera_id: str, limit: int = 50) -> List[CameraHealthEvent]:
    # Ensure camera exists
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    return db.query(CameraHealthEvent)\
             .filter(CameraHealthEvent.camera_id == camera_id)\
             .order_by(CameraHealthEvent.timestamp.desc())\
             .limit(limit)\
             .all()
