"""
Camera service — business logic layer.

Handles:
- Camera CRUD with audit trail
- Credential encryption (never returns plaintext)
- Pagination and filtering
- enable / disable

Routes call this layer; they don't embed business logic directly.
"""
import json
import math
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.core.credentials import credential_service
from app.core.url_validator import validate_stream_url
from app.models.cameras import Camera, CameraAuditLog
from app.models.enums import CameraStatus
from app.schemas.cameras import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    CameraListResponse,
)

# ──────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────────

def _safe_dict(camera: Camera) -> dict[str, Any]:
    """
    Build a safe audit-friendly dict from a Camera.
    Credentials are never included.
    """
    return {
        "camera_id": camera.camera_id,
        "name": camera.name,
        "department": camera.department,
        "latitude": camera.latitude,
        "longitude": camera.longitude,
        "camera_type": camera.camera_type,
        "source_protocol": camera.source_protocol,
        "stream_endpoint_ref": camera.stream_endpoint_ref,
        "status": camera.status,
        "zone": camera.zone,
        "storage_metadata": camera.storage_metadata,
        "is_enabled": camera.is_enabled,
    }


def _to_response(camera: Camera) -> CameraResponse:
    return CameraResponse(
        id=camera.id,
        camera_id=camera.camera_id,
        name=camera.name,
        department=camera.department,
        latitude=camera.latitude,
        longitude=camera.longitude,
        camera_type=camera.camera_type,
        source_protocol=camera.source_protocol,
        stream_endpoint_ref=camera.stream_endpoint_ref,
        has_credentials=credential_service.has_credentials(camera.encrypted_stream_credentials),
        status=camera.status,
        last_heartbeat=camera.last_heartbeat,
        zone=camera.zone,
        storage_metadata=camera.storage_metadata,
        is_enabled=camera.is_enabled,
        created_at=camera.created_at,
        updated_at=camera.updated_at,
    )


def _write_audit(
    db: Session,
    *,
    camera_id: str,
    user_id: UUID | None,
    action: str,
    old_value: dict | None,
    new_value: dict | None,
) -> None:
    log = CameraAuditLog(
        camera_id=camera_id,
        user_id=user_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(log)


def _encrypt_credentials(payload) -> str | None:
    """Serialize and encrypt StreamCredentials payload."""
    if payload is None:
        return None
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not data:
        return None
    return credential_service.encrypt(json.dumps(data))


# ──────────────────────────────────────────────────────────────────────────────
# Public service functions
# ──────────────────────────────────────────────────────────────────────────────

def create_camera(db: Session, payload: CameraCreate, user_id: UUID | None) -> CameraResponse:
    # Duplicate check
    existing = db.query(Camera).filter(Camera.camera_id == payload.camera_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Camera '{payload.camera_id}' already exists")

    # URL validation (SSRF + protocol alignment)
    if payload.stream_endpoint_ref and payload.source_protocol:
        validate_stream_url(payload.stream_endpoint_ref, payload.source_protocol.value)

    encrypted_creds = _encrypt_credentials(payload.stream_credentials)

    camera = Camera(
        camera_id=payload.camera_id,
        name=payload.name,
        department=payload.department,
        latitude=payload.latitude,
        longitude=payload.longitude,
        camera_type=payload.camera_type.value if payload.camera_type else None,
        source_protocol=payload.source_protocol.value if payload.source_protocol else None,
        stream_endpoint_ref=payload.stream_endpoint_ref,
        encrypted_stream_credentials=encrypted_creds,
        status=payload.status.value,
        zone=payload.zone,
        storage_metadata=payload.storage_metadata,
        is_enabled=payload.is_enabled,
    )
    db.add(camera)
    db.flush()  # get the ID without committing

    new_val = _safe_dict(camera)
    if encrypted_creds:
        new_val["credentials_changed"] = True

    _write_audit(db, camera_id=camera.camera_id, user_id=user_id,
                 action="CREATE", old_value=None, new_value=new_val)
    db.commit()
    db.refresh(camera)
    return _to_response(camera)


def list_cameras(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status: str | None = None,
    department: str | None = None,
    zone: str | None = None,
    source_protocol: str | None = None,
    is_enabled: bool | None = None,
) -> CameraListResponse:
    q = db.query(Camera)

    if search:
        pattern = f"%{search}%"
        q = q.filter(or_(Camera.camera_id.ilike(pattern), Camera.name.ilike(pattern)))
    if status:
        q = q.filter(Camera.status == status.upper())
    if department:
        q = q.filter(Camera.department.ilike(f"%{department}%"))
    if zone:
        q = q.filter(Camera.zone.ilike(f"%{zone}%"))
    if source_protocol:
        q = q.filter(Camera.source_protocol == source_protocol.upper())
    if is_enabled is not None:
        q = q.filter(Camera.is_enabled == is_enabled)

    total = q.count()
    pages = max(1, math.ceil(total / page_size))
    items = q.order_by(Camera.camera_id).offset((page - 1) * page_size).limit(page_size).all()

    return CameraListResponse(
        items=[_to_response(c) for c in items],
        page=page,
        page_size=page_size,
        total=total,
        pages=pages,
    )


def get_camera(db: Session, camera_id: str) -> CameraResponse:
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found")
    return _to_response(camera)


def update_camera(db: Session, camera_id: str, payload: CameraUpdate, user_id: UUID | None) -> CameraResponse:
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found")

    old_val = _safe_dict(camera)
    changes: dict[str, Any] = {}

    # Apply only provided (non-None) fields
    update_data = payload.model_dump(exclude_none=True, exclude={"stream_credentials"})
    for field, value in update_data.items():
        model_field = field
        if hasattr(value, "value"):  # Enum → string
            value = value.value
        if getattr(camera, model_field) != value:
            changes[field] = value
            setattr(camera, model_field, value)

    # Handle credential update separately
    if payload.stream_credentials is not None:
        encrypted_creds = _encrypt_credentials(payload.stream_credentials)
        camera.encrypted_stream_credentials = encrypted_creds
        changes["credentials_changed"] = True

    # URL re-validate if endpoint or protocol changed
    protocol = camera.source_protocol
    endpoint = camera.stream_endpoint_ref
    if endpoint and protocol:
        validate_stream_url(endpoint, protocol)

    if not changes:
        return _to_response(camera)

    new_val = _safe_dict(camera)

    _write_audit(db, camera_id=camera_id, user_id=user_id,
                 action="UPDATE", old_value=old_val, new_value=new_val)
    db.commit()
    db.refresh(camera)
    return _to_response(camera)


def set_enabled(db: Session, camera_id: str, enabled: bool, user_id: UUID | None) -> CameraResponse:
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found")

    action = "ENABLE" if enabled else "DISABLE"
    old_val = {"is_enabled": camera.is_enabled}
    camera.is_enabled = enabled
    new_val = {"is_enabled": camera.is_enabled}

    _write_audit(db, camera_id=camera_id, user_id=user_id,
                 action=action, old_value=old_val, new_value=new_val)
    db.commit()
    db.refresh(camera)
    return _to_response(camera)


def get_camera_audit(db: Session, camera_id: str) -> list[CameraAuditLog]:
    # Confirm camera exists
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found")
    return (
        db.query(CameraAuditLog)
        .filter(CameraAuditLog.camera_id == camera_id)
        .order_by(CameraAuditLog.timestamp.desc())
        .all()
    )


def get_playback(db: Session, camera_id: str, client_ip: str) -> dict:
    from app.adapters.registry import get_adapter
    from datetime import datetime, timedelta, timezone
    
    camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera '{camera_id}' not found")
        
    if not camera.is_enabled:
        raise HTTPException(status_code=400, detail=f"Camera '{camera_id}' is disabled")
        
    protocol = camera.source_protocol
    if not protocol:
        raise HTTPException(status_code=400, detail="Camera has no source protocol configured")
        
    credentials = None
    if camera.encrypted_stream_credentials:
        decrypted = credential_service.decrypt(camera.encrypted_stream_credentials)
        if decrypted:
            credentials = json.loads(decrypted)
            
    adapter = get_adapter(
        protocol=protocol,
        camera_id=camera.camera_id,
        stream_endpoint_ref=camera.stream_endpoint_ref,
        credentials=credentials
    )
    
    playback_url = adapter.get_playback_url(client_ip)
    
    return {
        "camera_id": camera.camera_id,
        "protocol": protocol,
        "playback_url": playback_url,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=60)
    }
