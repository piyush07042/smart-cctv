"""phase10_audit

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0006'
down_revision = '0005_phase9_indexes'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('audit_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('actor', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('action', sa.String(), nullable=True),
        sa.Column('resource_type', sa.String(), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('before', sa.JSON(), nullable=True),
        sa.Column('after', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_actor'), 'audit_logs', ['actor'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_type'), 'audit_logs', ['resource_type'], unique=False)
    op.create_index(op.f('ix_audit_logs_resource_id'), 'audit_logs', ['resource_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)

def downgrade() -> None:
    op.drop_table('audit_logs')
