"""Phase 9 - entity search and trace indexes

Revision ID: 0005_phase9_indexes
Revises: 0004_phase7_analytics
Create Date: 2026-09-25
"""
from alembic import op
import sqlalchemy as sa

revision = '0005_phase9_indexes'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Composite index for vehicle trace queries: vehicle_number + timestamp (already exists via model)
    # The model already has ix_detection_events_vehicle_timestamp — verify and skip if exists
    # Add partial index for active alerts (status = 'new') — useful for dashboard active count
    # SQLite doesn't support partial indexes so we use a regular index here
    op.create_index(
        "ix_alerts_severity_status",
        "alerts",
        ["severity", "status"],
        if_not_exists=True,
    )
    # Index for alert matched identifier queries
    op.create_index(
        "ix_alerts_matched_created",
        "alerts",
        ["matched_identifier", "created_at"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("ix_alerts_matched_created", table_name="alerts")
    op.drop_index("ix_alerts_severity_status", table_name="alerts")
