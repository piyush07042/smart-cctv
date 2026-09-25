"""
Pydantic schemas for Detection Events — Phase 7.
"""
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

# ── Supported event types ──
VALID_EVENT_TYPES = {"anpr", "vehicle_detection", "person_detection", "object_detection"}

# Indian vehicle registration plate regex.
# Accepts GJ01XX0001, MH12CD5678 etc. (State-code 2 chars, district 2 digits, series 1-3 letters, number 1-4 digits)
# Must accept the demo plate GJ01XX0001
_PLATE_RE = re.compile(r'^[A-Z]{2}\d{2}[A-Z]{1,3}\d{1,4}$')


def normalize_plate(raw: str) -> str:
    """Uppercase, strip spaces and hyphens."""
    return re.sub(r'[\s\-]', '', raw).upper()


class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float


class EventIngestRequest(BaseModel):
    """Body sent by the analytics service."""
    event_id: Optional[str] = Field(None, description="External idempotency key (optional)")
    camera_id: str = Field(..., max_length=64)
    timestamp: datetime = Field(..., description="UTC ISO-8601 timestamp")
    event_type: str = Field(..., description="anpr | vehicle_detection | person_detection | object_detection")
    vehicle_number: Optional[str] = Field(None, max_length=32)
    vehicle_type: Optional[str] = Field(None, max_length=32)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    bounding_box: Optional[BoundingBox] = None
    image_ref: Optional[str] = Field(None, max_length=512)
    metadata: Optional[dict[str, Any]] = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        v = v.lower()
        if v not in VALID_EVENT_TYPES:
            raise ValueError(f"event_type must be one of: {', '.join(VALID_EVENT_TYPES)}")
        return v

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v > now + timedelta(minutes=5):
            raise ValueError("timestamp must not be more than 5 minutes in the future")
        return v

    @field_validator("vehicle_number")
    @classmethod
    def validate_plate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        normalized = normalize_plate(v)
        if not _PLATE_RE.match(normalized):
            raise ValueError(
                f"vehicle_number '{v}' does not match Indian registration format (e.g. GJ01XX0001)"
            )
        return normalized  # store normalized form

    @model_validator(mode="after")
    def anpr_requires_plate(self) -> "EventIngestRequest":
        if self.event_type == "anpr" and not self.vehicle_number:
            raise ValueError("vehicle_number is required for ANPR events")
        return self


class BatchEventIngestRequest(BaseModel):
    events: list[EventIngestRequest] = Field(..., min_length=1, max_length=100)


class EventIngestResponse(BaseModel):
    event_id: Optional[str]          # the external event_id
    internal_id: Optional[str]       # the DB UUID
    status: str                      # "accepted" | "duplicate"
    duplicate: bool
    alert_created: bool = False
    alert_id: Optional[str] = None


class BatchEventIngestResponse(BaseModel):
    accepted: int
    duplicates: int
    errors: int
    results: list[EventIngestResponse]


class EventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    event_id: Optional[str]
    camera_id: str
    timestamp: datetime
    event_type: str
    vehicle_number: Optional[str]
    vehicle_type: Optional[str]
    confidence: Optional[float]
    bounding_box: Optional[dict[str, Any]]
    image_ref: Optional[str]
    created_at: datetime


class EventListResponse(BaseModel):
    items: list[EventResponse]
    page: int
    page_size: int
    total: int
    pages: int
