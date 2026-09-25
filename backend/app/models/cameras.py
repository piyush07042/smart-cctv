"""
Camera SQLAlchemy models — Phase 3.

Changes from Phase 2:
- Added encrypted_stream_credentials column to Camera
- CameraAuditLog now carries camera_id directly (resource_id alias)
- Extra indexes for department, zone, source_protocol, is_enabled
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Integer, JSON, Text, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from .base import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    department = Column(String(128), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    camera_type = Column(String(32), nullable=True)
    source_protocol = Column(String(32), nullable=True, index=True)
    stream_endpoint_ref = Column(String(512), nullable=True)
    # Fernet-encrypted credential blob — never returned in API responses
    encrypted_stream_credentials = Column(Text, nullable=True)
    status = Column(String(16), nullable=False, default="OFFLINE", index=True)
    last_heartbeat = Column(DateTime, nullable=True)
    zone = Column(String(128), nullable=True, index=True)
    storage_metadata = Column(JSON, nullable=True)
    is_enabled = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)

    __table_args__ = (
        Index("ix_cameras_department_status", "department", "status"),
    )


class CameraHealthEvent(Base):
    __tablename__ = "camera_health_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(String(64), ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    status = Column(String(16), nullable=False)
    previous_status = Column(String(16), nullable=True)
    fps = Column(Float, nullable=True)
    bitrate = Column(Float, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    packet_loss = Column(Float, nullable=True)
    failure_count = Column(Integer, nullable=False, default=0)
    source = Column(String(64), nullable=True)
    extra_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    __table_args__ = (
        Index("ix_camera_health_events_camera_timestamp", "camera_id", "timestamp"),
    )


class CameraAuditLog(Base):
    """
    Immutable audit trail for camera changes.

    SECURITY: never store plaintext credentials in old_value/new_value.
    Only store {'credentials_changed': True} when credentials are updated.
    """
    __tablename__ = "camera_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    camera_id = Column(String(64), nullable=False, index=True)   # denormalized for fast per-camera lookups
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(32), nullable=False)          # CREATE | UPDATE | ENABLE | DISABLE
    resource_type = Column(String(32), nullable=True, default="camera")
    resource_id = Column(String(64), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)