"""
Alerts API router — Phase 7.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.users import User
from app.schemas.alerts import AlertResponse, AlertListResponse, AlertActionRequest, AlertActionResponse
from app.services import alerts as alerts_svc

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=AlertListResponse)
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    camera_id: Optional[str] = None,
    matched_identifier: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List alerts (requires auth)."""
    items, total, pages = alerts_svc.list_alerts(
        db, page, page_size, status, severity, camera_id, matched_identifier, from_ts, to_ts
    )
    return AlertListResponse(
        items=items, page=page, page_size=page_size, total=total, pages=pages
    )


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific alert."""
    return alerts_svc.get_alert(db, alert_id)


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    data: AlertActionRequest = AlertActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"]))
):
    """Acknowledge an alert."""
    return alerts_svc.acknowledge_alert(db, alert_id, current_user.username, current_user.id, data.notes)


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: str,
    data: AlertActionRequest = AlertActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"]))
):
    """Resolve an alert."""
    return alerts_svc.resolve_alert(db, alert_id, current_user.username, current_user.id, data.notes)


@router.post("/{alert_id}/false-positive", response_model=AlertResponse)
def false_positive_alert(
    alert_id: str,
    data: AlertActionRequest = AlertActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "OPERATOR"]))
):
    """Mark an alert as false positive."""
    return alerts_svc.false_positive_alert(db, alert_id, current_user.username, current_user.id, data.notes)


@router.get("/{alert_id}/actions", response_model=list[AlertActionResponse])
def get_alert_actions(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the history of actions on an alert."""
    return alerts_svc.get_alert_actions(db, alert_id)
