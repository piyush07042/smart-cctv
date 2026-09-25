"""
Detection event model — Phase 7.
Extends Phase 2 stub with image_ref and metadata columns.
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Index, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from .base import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class DetectionEvent(Base):
    __tablename__ = "detection_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(String(255), unique=True, index=True, nullable=True)  # external idempotency key
    camera_id = Column(String(64), ForeignKey("cameras.camera_id", ondelete="RESTRICT"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    event_type = Column(String(32), nullable=False, index=True)
    vehicle_number = Column(String(32), nullable=True, index=True)   # normalized plate
    vehicle_type = Column(String(32), nullable=True)
    confidence = Column(Float, nullable=True)
    bounding_box = Column(JSON, nullable=True)
    image_ref = Column(String(512), nullable=True)
    extra_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)

    __table_args__ = (
        Index("ix_detection_events_vehicle_timestamp", "vehicle_number", "timestamp"),
        Index("ix_detection_events_camera_timestamp", "camera_id", "timestamp"),
        Index("ix_detection_events_type_timestamp", "event_type", "timestamp"),
    )