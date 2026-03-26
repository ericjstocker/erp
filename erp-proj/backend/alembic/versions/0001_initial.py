"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-03-25 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('contact', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
    )

    op.create_table(
        'materials',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('spec', sa.Text(), nullable=True),
    )

    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('customer_id', sa.Integer(), sa.ForeignKey('customers.id')),
        sa.Column('received_date', sa.Date(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
    )

    op.create_table(
        'parts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('jobs.id'), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('blueprint_path', sa.String(), nullable=True),
        sa.Column('material_id', sa.Integer(), sa.ForeignKey('materials.id'), nullable=True),
    )

    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('po_number', sa.String(), nullable=False, unique=True),
        sa.Column('vendor', sa.String(), nullable=True),
        sa.Column('order_date', sa.Date(), nullable=True),
        sa.Column('received_date', sa.Date(), nullable=True),
        sa.Column('total_amount', sa.String(), nullable=True),
        sa.Column('job_id', sa.Integer(), sa.ForeignKey('jobs.id'), nullable=True),
    )


def downgrade():
    op.drop_table('purchase_orders')
    op.drop_table('parts')
    op.drop_table('jobs')
    op.drop_table('materials')
    op.drop_table('customers')
