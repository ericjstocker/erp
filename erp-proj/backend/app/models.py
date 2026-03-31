from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    point_of_contact = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    jobs = relationship('Job', back_populates='customer')

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    po_number = Column(String, nullable=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    received_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String, default='queued')
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship('Customer', back_populates='jobs')
    parts = relationship('Part', back_populates='job')
    purchase_orders = relationship('PurchaseOrder', back_populates='job')
    documents = relationship('JobDocument', back_populates='job', cascade='all, delete-orphan')

class Part(Base):
    __tablename__ = 'parts'
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=True)
    name = Column(String, nullable=False)
    blueprint_path = Column(String, nullable=True)
    material_type = Column(String, nullable=True)
    material_size = Column(String, nullable=True)
    status = Column(String, default='pending')
    quantity = Column(Integer, nullable=True)
    material_id = Column(Integer, ForeignKey('materials.id'), nullable=True)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship('Job', back_populates='parts')
    material = relationship('Material', back_populates='parts')
    blueprints = relationship('PartBlueprint', back_populates='part', cascade='all, delete-orphan')

class PartBlueprint(Base):
    __tablename__ = 'part_blueprints'
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey('parts.id'), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    part = relationship('Part', back_populates='blueprints')

class JobDocument(Base):
    __tablename__ = 'job_documents'
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    job = relationship('Job', back_populates='documents')

class Material(Base):
    __tablename__ = 'materials'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    material_type = Column(String, nullable=True)
    shape = Column(String, nullable=True)
    diameter = Column(String, nullable=True)
    length = Column(String, nullable=True)
    width = Column(String, nullable=True)
    height = Column(String, nullable=True)
    purchase_location = Column(String, nullable=True)
    provider_info = Column(String, nullable=True)
    po_number = Column(String, nullable=True)
    quantity = Column(Integer, nullable=True)
    doc_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parts = relationship('Part', back_populates='material')
    documents = relationship('MaterialDocument', back_populates='material', cascade='all, delete-orphan')
    po_files = relationship('MaterialPOFile', back_populates='material', cascade='all, delete-orphan')

class MaterialDocument(Base):
    __tablename__ = 'material_documents'
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey('materials.id'), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    material = relationship('Material', back_populates='documents')

class MaterialPOFile(Base):
    __tablename__ = 'material_po_files'
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey('materials.id'), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    material = relationship('Material', back_populates='po_files')

class ItemPO(Base):
    __tablename__ = 'item_po_files'
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    description = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class PurchaseOrder(Base):
    __tablename__ = 'purchase_orders'
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, nullable=False)
    vendor = Column(String, nullable=True)
    order_date = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)
    total_amount = Column(String, nullable=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship('Job', back_populates='purchase_orders')

class SystemSetting(Base):
    __tablename__ = 'system_settings'
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
