"""
Camera Registry API router — Phase 3.

Endpoints:
  POST   /cameras               Admin only — create camera
  POST   /cameras/bulk          Admin only — bulk create cameras
  GET    /cameras               Authenticated — list with pagination/filters
  GET    /cameras/{camera_id}   Authenticated — single camera
  PATCH  /cameras/{camera_id}   Admin only — partial update
  POST   /cameras/{camera_id}/enable   Admin only
  POST   /cameras/{camera_id}/disable  Admin only
  GET    /cameras/{camera_id}/audit    Admin/Operator — audit history
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import User
from app.schemas.cameras import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    CameraListResponse,
    CameraBulkCreate,
    CameraBulkResult,
    CameraAuditResponse,
    CameraPlaybackResponse,
    CameraHeartbeatRequest,
    CameraHeartbeatResponse,
    CameraHealthHistoryResponse,
)
import app.services.cameras as camera_svc
import app.services.health as health_svc

router = APIRouter(prefix="/cameras", tags=["cameras"])

ADMIN_ONLY = require_role(["ADMIN"])
ANY_USER = get_current_user  # ADMIN | OPERATOR | VIEWER


# ──────────────────────────────────────────────────────────────────────────────
# POST /cameras
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CameraResponse,
    status_code=201,
    summary="Register a new camera (Admin only)",
    responses={
        201: {"description": "Camera created"},
        409: {"description": "Duplicate camera_id"},
        422: {"description": "Validation error"},
    },
)
def create_camera(
    payload: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    return camera_svc.create_camera(db, payload, user_id=current_user.id)


# ──────────────────────────────────────────────────────────────────────────────
# POST /cameras/bulk
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/bulk",
    response_model=CameraBulkResult,
    summary="Bulk-create cameras (Admin only)",
)
def bulk_create_cameras(
    payload: CameraBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    created = 0
    errors = []
    for i, cam in enumerate(payload.cameras):
        try:
            camera_svc.create_camera(db, cam, user_id=current_user.id)
            created += 1
        except Exception as exc:
            # Roll back the partial transaction for this item only
            db.rollback()
            errors.append({"index": i, "camera_id": cam.camera_id, "error": str(exc)})
    return CameraBulkResult(created=created, errors=errors)


# ──────────────────────────────────────────────────────────────────────────────
# GET /cameras
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=CameraListResponse,
    summary="List cameras with pagination and filtering",
)
def list_cameras(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    search: str | None = Query(None, description="Search camera_id or name"),
    status: str | None = Query(None, description="ONLINE | OFFLINE | DEGRADED"),
    department: str | None = Query(None),
    zone: str | None = Query(None),
    source_protocol: str | None = Query(None),
    is_enabled: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_USER),
):
    return camera_svc.list_cameras(
        db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        department=department,
        zone=zone,
        source_protocol=source_protocol,
        is_enabled=is_enabled,
    )


# ──────────────────────────────────────────────────────────────────────────────
# GET /cameras/{camera_id}
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{camera_id}",
    response_model=CameraResponse,
    summary="Get single camera details",
    responses={404: {"description": "Camera not found"}},
)
def get_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_USER),
):
    return camera_svc.get_camera(db, camera_id)


# ──────────────────────────────────────────────────────────────────────────────
# PATCH /cameras/{camera_id}
# ──────────────────────────────────────────────────────────────────────────────

@router.patch(
    "/{camera_id}",
    response_model=CameraResponse,
    summary="Partial update of camera (Admin only)",
)
def update_camera(
    camera_id: str,
    payload: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    return camera_svc.update_camera(db, camera_id, payload, user_id=current_user.id)


# ──────────────────────────────────────────────────────────────────────────────
# POST /cameras/{camera_id}/enable
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/{camera_id}/enable",
    response_model=CameraResponse,
    summary="Enable a camera (Admin only)",
)
def enable_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    return camera_svc.set_enabled(db, camera_id, enabled=True, user_id=current_user.id)


# ──────────────────────────────────────────────────────────────────────────────
# POST /cameras/{camera_id}/disable
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/{camera_id}/disable",
    response_model=CameraResponse,
    summary="Disable a camera (Admin only)",
)
def disable_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    return camera_svc.set_enabled(db, camera_id, enabled=False, user_id=current_user.id)


# ──────────────────────────────────────────────────────────────────────────────
# GET /cameras/{camera_id}/audit
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{camera_id}/audit",
    response_model=list[CameraAuditResponse],
    summary="Get camera audit history (Admin/Operator)",
)
def get_camera_audit(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"])),
):
    return camera_svc.get_camera_audit(db, camera_id)


# ──────────────────────────────────────────────────────────────────────────────
# GET /cameras/{camera_id}/playback
# ──────────────────────────────────────────────────────────────────────────────

from fastapi import Request

@router.get(
    "/{camera_id}/playback",
    response_model=CameraPlaybackResponse,
    summary="Get secure playback URL for a camera",
)
def get_playback(
    camera_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_USER),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    return camera_svc.get_playback(db, camera_id, client_ip)


# ──────────────────────────────────────────────────────────────────────────────
# POST /cameras/{camera_id}/heartbeat
# ──────────────────────────────────────────────────────────────────────────────

from fastapi import Header

@router.post(
    "/{camera_id}/heartbeat",
    response_model=CameraHeartbeatResponse,
    summary="Push heartbeat metrics for a camera",
)
def post_heartbeat(
    camera_id: str,
    payload: CameraHeartbeatRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    from app.core.config import settings
    # Very simple service authentication.
    if authorization != f"Bearer {settings.HEARTBEAT_API_KEY}":
        raise HTTPException(status_code=401, detail="Invalid or missing heartbeat API key")
        
    return health_svc.process_heartbeat(db, camera_id, payload)


# ──────────────────────────────────────────────────────────────────────────────
# GET /cameras/{camera_id}/health
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{camera_id}/health",
    response_model=list[CameraHealthHistoryResponse],
    summary="Get health history for a camera",
)
def get_health_history(
    camera_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"])),
):
    return health_svc.get_health_history(db, camera_id, limit)
