"""add is_archived to customers/jobs/parts and po_number to jobs

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-31 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0010'
down_revision = '0009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('customers', sa.Column('is_archived', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('jobs', sa.Column('is_archived', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('jobs', sa.Column('po_number', sa.String(), nullable=True))
    op.add_column('parts', sa.Column('is_archived', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('parts', 'is_archived')
    op.drop_column('jobs', 'po_number')
    op.drop_column('jobs', 'is_archived')
    op.drop_column('customers', 'is_archived')
