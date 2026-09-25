"""
Pydantic schemas for Alerts — Phase 7.
"""
import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

VALID_ALERT_STATUSES = {"new", "acknowledged", "resolved", "false_positive"}
VALID_TRANSITIONS = {
    "new": {"acknowledged", "false_positive"},
    "acknowledged": {"resolved", "false_positive"},
    "resolved": set(),
    "false_positive": set(),
}


class AlertResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    detection_id: Optional[uuid.UUID]
    watchlist_entry_id: Optional[uuid.UUID]
    camera_id: Optional[str]
    camera_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    matched_identifier: Optional[str]
    confidence: Optional[float]
    severity: str
    status: str
    repeat_count: int
    notes: Optional[str]
    created_at: datetime
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[datetime]
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]


class AlertListResponse(BaseModel):
    items: list[AlertResponse]
    page: int
    page_size: int
    total: int
    pages: int


class AlertActionRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=1024)


class AlertActionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    alert_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    action: str
    notes: Optional[str]
    timestamp: datetime
