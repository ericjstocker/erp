"""add part_blueprints table for multiple blueprints per part

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-30 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'part_blueprints',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('part_id', sa.Integer(), sa.ForeignKey('parts.id'), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
    )
    # Migrate existing single blueprint_path entries into the new table
    op.execute("""
        INSERT INTO part_blueprints (part_id, filename, file_path, uploaded_at)
        SELECT id,
               SUBSTRING(blueprint_path FROM '[^/]+$'),
               blueprint_path,
               NOW()
        FROM parts
        WHERE blueprint_path IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_table('part_blueprints')
