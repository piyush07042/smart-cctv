"""Add CameraHealthEvent

Revision ID: 0003
Revises: 0002_camera_phase3
Create Date: 2026-09-24 17:32:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002_camera_phase3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('camera_health_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('camera_id', sa.String(length=64), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False),
        sa.Column('previous_status', sa.String(length=16), nullable=True),
        sa.Column('fps', sa.Float(), nullable=True),
        sa.Column('bitrate', sa.Float(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('packet_loss', sa.Float(), nullable=True),
        sa.Column('failure_count', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(length=64), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['camera_id'], ['cameras.camera_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_camera_health_events_camera_id'), 'camera_health_events', ['camera_id'], unique=False)
    op.create_index(op.f('ix_camera_health_events_timestamp'), 'camera_health_events', ['timestamp'], unique=False)
    op.create_index('ix_camera_health_events_camera_timestamp', 'camera_health_events', ['camera_id', 'timestamp'], unique=False)
    
    # Drop old camera_heartbeats table if it existed from Phase 2
    try:
        op.drop_table('camera_heartbeats')
    except Exception:
        pass


def downgrade() -> None:
    op.drop_index('ix_camera_health_events_camera_timestamp', table_name='camera_health_events')
    op.drop_index(op.f('ix_camera_health_events_timestamp'), table_name='camera_health_events')
    op.drop_index(op.f('ix_camera_health_events_camera_id'), table_name='camera_health_events')
    op.drop_table('camera_health_events')
