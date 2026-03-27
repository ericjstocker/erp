"""add customer contact fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-27 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('customers', sa.Column('point_of_contact', sa.String(), nullable=True))
    op.add_column('customers', sa.Column('phone_number', sa.String(), nullable=True))
    op.add_column('customers', sa.Column('email', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('customers', 'email')
    op.drop_column('customers', 'phone_number')
    op.drop_column('customers', 'point_of_contact')
