"""Add encrypted credentials and update camera schema

Revision ID: 0002_camera_phase3
Revises: 0001_initial
Create Date: 2026-09-24

Changes:
- Add encrypted_stream_credentials column to cameras
- Update status default to OFFLINE (uppercase)
- Add indexes: department, zone, source_protocol, is_enabled
- Update camera_audit_logs to add camera_id column directly
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_camera_phase3"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Add encrypted_stream_credentials to cameras ---
    op.add_column(
        "cameras",
        sa.Column("encrypted_stream_credentials", sa.Text(), nullable=True),
    )

    # --- Add camera_id to camera_audit_logs for direct lookup ---
    op.add_column(
        "camera_audit_logs",
        sa.Column("camera_id", sa.String(64), nullable=True),
    )

    # --- New indexes ---
    op.create_index("ix_cameras_department", "cameras", ["department"])
    op.create_index("ix_cameras_zone", "cameras", ["zone"])
    op.create_index("ix_cameras_is_enabled", "cameras", ["is_enabled"])
    op.create_index("ix_camera_audit_logs_camera_id", "camera_audit_logs", ["camera_id"])
    op.create_index("ix_camera_audit_logs_timestamp", "camera_audit_logs", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_camera_audit_logs_timestamp", table_name="camera_audit_logs")
    op.drop_index("ix_camera_audit_logs_camera_id", table_name="camera_audit_logs")
    op.drop_index("ix_cameras_is_enabled", table_name="cameras")
    op.drop_index("ix_cameras_zone", table_name="cameras")
    op.drop_index("ix_cameras_department", table_name="cameras")
    op.drop_column("camera_audit_logs", "camera_id")
    op.drop_column("cameras", "encrypted_stream_credentials")
