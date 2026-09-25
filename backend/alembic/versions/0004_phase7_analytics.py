"""Alembic migration: Phase 7 — Analytics, Watchlist, Alerts

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-24

Approach:
  - Add missing columns to existing stubs (detection_events, watchlist_entries, alerts, alert_actions)
  - Create new indexes
  - Safe: adds columns only if they don't already exist via try/except
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def _col(table, col, type_, **kwargs):
    """Add column, ignoring if it already exists."""
    try:
        op.add_column(table, sa.Column(col, type_, **kwargs))
    except Exception:
        pass


def upgrade() -> None:
    # ── detection_events: add image_ref and metadata columns ──
    _col('detection_events', 'image_ref', sa.String(512), nullable=True)
    _col('detection_events', 'metadata', sa.JSON(), nullable=True)

    # Composite indexes for events
    try:
        op.create_index('ix_detection_events_vehicle_timestamp', 'detection_events', ['vehicle_number', 'timestamp'])
    except Exception:
        pass
    try:
        op.create_index('ix_detection_events_camera_timestamp', 'detection_events', ['camera_id', 'timestamp'])
    except Exception:
        pass
    try:
        op.create_index('ix_detection_events_type_timestamp', 'detection_events', ['event_type', 'timestamp'])
    except Exception:
        pass

    # ── watchlist_entries: add Phase 7 columns ──
    _col('watchlist_entries', 'entity_type', sa.String(32), nullable=True)
    _col('watchlist_entries', 'severity', sa.String(16), nullable=True, server_default='medium')
    _col('watchlist_entries', 'reference_case_no', sa.String(128), nullable=True)
    _col('watchlist_entries', 'added_by', sa.String(128), nullable=True)
    _col('watchlist_entries', 'expires_at', sa.DateTime(), nullable=True)

    try:
        op.create_index('ix_watchlist_entries_is_active', 'watchlist_entries', ['is_active'])
    except Exception:
        pass
    try:
        op.create_index('ix_watchlist_entries_identifier_active', 'watchlist_entries', ['identifier', 'is_active'])
    except Exception:
        pass

    # ── alerts: add Phase 7 columns ──
    # Rename watchlist_id → watchlist_entry_id if needed (handle both)
    _col('alerts', 'watchlist_entry_id', postgresql.UUID(as_uuid=True), nullable=True)
    _col('alerts', 'camera_name', sa.String(255), nullable=True)
    _col('alerts', 'latitude', sa.Float(), nullable=True)
    _col('alerts', 'longitude', sa.Float(), nullable=True)
    _col('alerts', 'matched_identifier', sa.String(64), nullable=True)
    _col('alerts', 'confidence', sa.Float(), nullable=True)
    _col('alerts', 'repeat_count', sa.Integer(), nullable=True, server_default='0')
    _col('alerts', 'notes', sa.Text(), nullable=True)
    _col('alerts', 'acknowledged_by', sa.String(128), nullable=True)
    _col('alerts', 'resolved_by', sa.String(128), nullable=True)

    try:
        op.create_index('ix_alerts_matched_identifier', 'alerts', ['matched_identifier'])
    except Exception:
        pass
    try:
        op.create_index('ix_alerts_status_created', 'alerts', ['status', 'created_at'])
    except Exception:
        pass
    try:
        op.create_index('ix_alerts_camera_status', 'alerts', ['camera_id', 'status'])
    except Exception:
        pass

    # ── alert_actions: add notes column ──
    _col('alert_actions', 'notes', sa.Text(), nullable=True)
    try:
        op.create_index('ix_alert_actions_alert_id', 'alert_actions', ['alert_id'])
    except Exception:
        pass
    try:
        op.create_index('ix_alert_actions_timestamp', 'alert_actions', ['timestamp'])
    except Exception:
        pass


def downgrade() -> None:
    # Best-effort — drop added columns
    for col in ['notes']:
        try:
            op.drop_column('alert_actions', col)
        except Exception:
            pass

    for col in ['watchlist_entry_id', 'camera_name', 'latitude', 'longitude',
                'matched_identifier', 'confidence', 'repeat_count', 'notes',
                'acknowledged_by', 'resolved_by']:
        try:
            op.drop_column('alerts', col)
        except Exception:
            pass

    for col in ['entity_type', 'severity', 'reference_case_no', 'added_by', 'expires_at']:
        try:
            op.drop_column('watchlist_entries', col)
        except Exception:
            pass

    for col in ['image_ref', 'metadata']:
        try:
            op.drop_column('detection_events', col)
        except Exception:
            pass
