"""rename material_size to shape and add dimension fields

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-30 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('materials', sa.Column('shape', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('diameter', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('length', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('width', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('height', sa.String(), nullable=True))
    # copy existing size data into shape, then drop old column
    op.execute("UPDATE materials SET shape = material_size WHERE material_size IS NOT NULL")
    op.drop_column('materials', 'material_size')


def downgrade() -> None:
    op.add_column('materials', sa.Column('material_size', sa.String(), nullable=True))
    op.execute("UPDATE materials SET material_size = shape WHERE shape IS NOT NULL")
    op.drop_column('materials', 'shape')
    op.drop_column('materials', 'height')
    op.drop_column('materials', 'width')
    op.drop_column('materials', 'length')
    op.drop_column('materials', 'diameter')
