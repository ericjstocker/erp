"""add quantity to parts

Revision ID: 0011
Revises: 0010
Create Date: 2026-03-31 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0011'
down_revision = '0010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('parts', sa.Column('quantity', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('parts', 'quantity')
