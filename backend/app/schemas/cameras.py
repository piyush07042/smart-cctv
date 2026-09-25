"""
Pydantic schemas for the Camera Registry API.

Design principles:
- CameraCreate / CameraUpdate are input schemas (what the client sends).
- CameraResponse is the output schema (what the API returns).
- Credentials are NEVER in CameraResponse — only has_credentials: bool.
- All enum fields are strongly typed via the shared CameraType / SourceProtocol / CameraStatus enums.
"""
import re
from typing import Any
from pydantic import BaseModel, Field, field_validator, model_validator
import uuid
from datetime import datetime

from app.models.enums import CameraType, SourceProtocol, CameraStatus

# Allowed camera_id pattern:  letters, digits, hyphen only.  No spaces, no underscores.
_CAMERA_ID_RE = re.compile(r"^[A-Za-z0-9\-]{1,64}$")


class StreamCredentials(BaseModel):
    """
    Ephemeral schema for credential submission.
    Never stored as-is — always encrypted before persistence.
    """
    username: str | None = None
    password: str | None = None
    token: str | None = None
    raw: str | None = None          # For single-string credentials (API key, URI with embedded creds)


class CameraCreate(BaseModel):
    camera_id: str = Field(..., description="Business identifier: letters, digits, hyphen only. E.g. C001, GJ-TRAFFIC-001")
    name: str = Field(..., min_length=1, max_length=255)
    department: str | None = Field(None, max_length=128)
    latitude: float | None = Field(None, ge=-90.0, le=90.0)
    longitude: float | None = Field(None, ge=-180.0, le=180.0)
    camera_type: CameraType | None = None
    source_protocol: SourceProtocol | None = None
    stream_endpoint_ref: str | None = Field(None, max_length=512)
    stream_credentials: StreamCredentials | None = Field(
        None,
        description="Optional stream credentials. Encrypted before storage. Never returned in responses.",
    )
    status: CameraStatus = CameraStatus.OFFLINE
    zone: str | None = Field(None, max_length=128)
    storage_metadata: dict[str, Any] | None = None
    is_enabled: bool = True

    @field_validator("camera_id")
    @classmethod
    def validate_camera_id(cls, v: str) -> str:
        if not _CAMERA_ID_RE.match(v):
            raise ValueError(
                "camera_id must contain only letters, digits, and hyphens (no spaces, underscores, or special characters). "
                "Examples: C001, CAM-001, GJ-TRAFFIC-001"
            )
        return v.upper()


class CameraUpdate(BaseModel):
    """All fields are optional — supports partial PATCH."""
    name: str | None = Field(None, min_length=1, max_length=255)
    department: str | None = Field(None, max_length=128)
    latitude: float | None = Field(None, ge=-90.0, le=90.0)
    longitude: float | None = Field(None, ge=-180.0, le=180.0)
    camera_type: CameraType | None = None
    source_protocol: SourceProtocol | None = None
    stream_endpoint_ref: str | None = Field(None, max_length=512)
    stream_credentials: StreamCredentials | None = None
    status: CameraStatus | None = None
    zone: str | None = Field(None, max_length=128)
    storage_metadata: dict[str, Any] | None = None
    is_enabled: bool | None = None


class CameraResponse(BaseModel):
    """
    Public camera representation.

    SECURITY:
    - encrypted_stream_credentials is NEVER included.
    - has_credentials is a boolean proxy.
    - stream_endpoint_ref is included (it is the URL template, not a credential).
    """
    model_config = {"from_attributes": True}

    id: uuid.UUID
    camera_id: str
    name: str
    department: str | None
    latitude: float | None
    longitude: float | None
    camera_type: CameraType | None
    source_protocol: SourceProtocol | None
    stream_endpoint_ref: str | None
    has_credentials: bool
    status: CameraStatus
    last_heartbeat: datetime | None
    zone: str | None
    storage_metadata: dict[str, Any] | None
    is_enabled: bool
    created_at: datetime
    updated_at: datetime


class CameraListResponse(BaseModel):
    items: list[CameraResponse]
    page: int
    page_size: int
    total: int
    pages: int


class CameraBulkCreate(BaseModel):
    cameras: list[CameraCreate] = Field(..., min_length=1, max_length=100)


class CameraBulkResult(BaseModel):
    created: int
    errors: list[dict[str, Any]]


class CameraAuditResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    camera_id: str
    user_id: uuid.UUID | None
    action: str
    old_value: dict[str, Any] | None
    new_value: dict[str, Any] | None
    timestamp: datetime


class CameraPlaybackResponse(BaseModel):
    camera_id: str
    protocol: str
    playback_url: str
    expires_at: datetime | None = None


class CameraHeartbeatRequest(BaseModel):
    timestamp: datetime = Field(..., description="UTC timestamp of the heartbeat")
    fps: float | None = Field(None, ge=0)
    bitrate: float | None = Field(None, ge=0)
    latency_ms: int | None = Field(None, ge=0)
    packet_loss: float | None = Field(None, ge=0.0, le=100.0)


class CameraHeartbeatResponse(BaseModel):
    camera_id: str
    accepted: bool
    status: CameraStatus
    received_at: datetime
    next_expected_before: datetime


class CameraHealthHistoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    camera_id: str
    timestamp: datetime
    status: CameraStatus
    previous_status: CameraStatus | None
    fps: float | None
    bitrate: float | None
    latency_ms: int | None
    packet_loss: float | None
    failure_count: int
    source: str | None
    created_at: datetime
