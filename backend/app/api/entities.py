"""
Entities API — Phase 9.
Entity/vehicle search and trace endpoints.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import User
from app.services import entities as entities_svc
from app.services import export as export_svc

router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("/search")
def search_entities(
    q: str = Query(..., description="Plate/identifier to search. Use * for wildcard (e.g. GJ01*)"),
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search for entity sightings by vehicle plate or partial identifier."""
    return entities_svc.search_entities(
        db, q=q, from_ts=from_ts, to_ts=to_ts,
        camera_id=camera_id, event_type=event_type,
        page=page, page_size=page_size,
    )


@router.get("/vehicles/{plate}/trace")
def vehicle_trace(
    plate: str,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return chronological vehicle sightings with camera coordinates and hop analysis.
    Route is a reconstructed straight-line geographic approximation.
    """
    return entities_svc.get_vehicle_trace(
        db, plate=plate, from_ts=from_ts, to_ts=to_ts
    )


@router.get("/export/events.csv")
def export_events(
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    vehicle_number: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    min_confidence: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"])),
):
    """Export filtered events as CSV. Viewer role is blocked. Audit logged."""
    csv_content = export_svc.export_events_csv(
        db,
        user_id=current_user.id,
        actor=current_user.username,
        camera_id=camera_id,
        event_type=event_type,
        vehicle_number=vehicle_number,
        from_ts=from_ts,
        to_ts=to_ts,
        min_confidence=min_confidence,
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events_export.csv"},
    )


@router.get("/export/alerts.csv")
def export_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    camera_id: Optional[str] = None,
    matched_identifier: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"])),
):
    """Export filtered alerts as CSV. Viewer role is blocked. Audit logged."""
    csv_content = export_svc.export_alerts_csv(
        db,
        user_id=current_user.id,
        actor=current_user.username,
        status=status,
        severity=severity,
        camera_id=camera_id,
        matched_identifier=matched_identifier,
        from_ts=from_ts,
        to_ts=to_ts,
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts_export.csv"},
    )
