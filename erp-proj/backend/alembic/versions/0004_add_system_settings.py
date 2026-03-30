"""add system settings table

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_settings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('key', sa.String(), unique=True, nullable=False),
        sa.Column('value', sa.String(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('system_settings')
