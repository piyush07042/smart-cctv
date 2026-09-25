"""
Events API router — Phase 7.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.users import User
from app.schemas.events import EventIngestRequest, EventIngestResponse, BatchEventIngestRequest, BatchEventIngestResponse, EventResponse, EventListResponse
from app.services import events as events_svc

router = APIRouter(prefix="/events", tags=["events"])
api_key_header = APIKeyHeader(name="X-Analytics-Key", auto_error=False)


def verify_analytics_key(api_key: str = Security(api_key_header)):
    if api_key != settings.ANALYTICS_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing analytics API key")
    return api_key


@router.post("", response_model=EventIngestResponse, status_code=202)
def ingest_event(
    payload: EventIngestRequest,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_analytics_key)
):
    """Analytics service only: Ingest a detection event."""
    return events_svc.ingest_event(db, payload, api_key)


@router.post("/batch", response_model=BatchEventIngestResponse, status_code=202)
def ingest_batch(
    payload: BatchEventIngestRequest,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_analytics_key)
):
    """Analytics service only: Ingest multiple detection events."""
    return events_svc.ingest_batch(db, payload.events, api_key)


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    vehicle_number: Optional[str] = None,
    from_ts: Optional[datetime] = None,
    to_ts: Optional[datetime] = None,
    min_confidence: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List detection events (requires auth)."""
    items, total, pages = events_svc.list_events(
        db, page, page_size, camera_id, event_type, vehicle_number, from_ts, to_ts, min_confidence
    )
    return EventListResponse(
        items=items, page=page, page_size=page_size, total=total, pages=pages
    )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific detection event."""
    return events_svc.get_event(db, event_id)
