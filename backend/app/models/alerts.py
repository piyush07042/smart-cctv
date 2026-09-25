"""
Watchlist, Alert, and AlertAction models — Phase 7.
Extends Phase 2 stubs with all required fields.
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Float, Integer, JSON, Index, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from .base import Base


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class WatchlistEntry(Base):
    __tablename__ = "watchlist_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(32), nullable=False, default="vehicle")  # vehicle | person | other
    identifier = Column(String(64), nullable=False, index=True)           # normalized plate or person ID
    category = Column(String(32), nullable=False)                         # stolen | blacklisted | wanted | missing
    severity = Column(String(16), nullable=False, default="medium")       # low | medium | high | critical
    description = Column(Text, nullable=True)
    reference_case_no = Column(String(128), nullable=True)
    added_by = Column(String(128), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow)
    updated_at = Column(DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)

    __table_args__ = (
        Index("ix_watchlist_entries_identifier_active", "identifier", "is_active"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    detection_id = Column(UUID(as_uuid=True), ForeignKey("detection_events.id", ondelete="CASCADE"), nullable=True, index=True)
    watchlist_entry_id = Column(UUID(as_uuid=True), ForeignKey("watchlist_entries.id", ondelete="SET NULL"), nullable=True)
    camera_id = Column(String(64), nullable=True)
    camera_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    matched_identifier = Column(String(64), nullable=True, index=True)
    confidence = Column(Float, nullable=True)
    severity = Column(String(16), nullable=False, default="medium")
    status = Column(String(32), nullable=False, default="new", index=True)
    repeat_count = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utcnow, index=True)
    acknowledged_by = Column(String(128), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(128), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_alerts_status_created", "status", "created_at"),
        Index("ix_alerts_camera_status", "camera_id", "status"),
    )


class AlertAction(Base):
    __tablename__ = "alert_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(32), nullable=False)    # acknowledged | resolved | false_positive
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=_utcnow, index=True)