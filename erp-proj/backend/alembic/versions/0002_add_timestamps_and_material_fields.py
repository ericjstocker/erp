"""add timestamps and material fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add timestamps to customers
    op.add_column('customers', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('customers', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add timestamps to jobs
    op.add_column('jobs', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('jobs', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add fields to parts
    op.add_column('parts', sa.Column('material_type', sa.String(), nullable=True))
    op.add_column('parts', sa.Column('material_size', sa.String(), nullable=True))
    op.add_column('parts', sa.Column('status', sa.String(), nullable=True, server_default='pending'))
    op.add_column('parts', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('parts', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Expand material table
    op.add_column('materials', sa.Column('material_type', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('material_size', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('purchase_location', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('provider_info', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('po_number', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('doc_path', sa.String(), nullable=True))
    op.add_column('materials', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('materials', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Add timestamps to purchase_orders
    op.add_column('purchase_orders', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('purchase_orders', sa.Column('updated_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remove from purchase_orders
    op.drop_column('purchase_orders', 'updated_at')
    op.drop_column('purchase_orders', 'created_at')
    
    # Remove from materials
    op.drop_column('materials', 'updated_at')
    op.drop_column('materials', 'created_at')
    op.drop_column('materials', 'doc_path')
    op.drop_column('materials', 'po_number')
    op.drop_column('materials', 'provider_info')
    op.drop_column('materials', 'purchase_location')
    op.drop_column('materials', 'material_size')
    op.drop_column('materials', 'material_type')
    
    # Remove from parts
    op.drop_column('parts', 'updated_at')
    op.drop_column('parts', 'created_at')
    op.drop_column('parts', 'status')
    op.drop_column('parts', 'material_size')
    op.drop_column('parts', 'material_type')
    
    # Remove from jobs
    op.drop_column('jobs', 'updated_at')
    op.drop_column('jobs', 'created_at')
    
    # Remove from customers
    op.drop_column('customers', 'updated_at')
    op.drop_column('customers', 'created_at')
