from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    contact = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    jobs = relationship('Job', back_populates='customer')

class Job(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    received_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String, default='queued')

    customer = relationship('Customer', back_populates='jobs')
    parts = relationship('Part', back_populates='job')
    purchase_orders = relationship('PurchaseOrder', back_populates='job')

class Part(Base):
    __tablename__ = 'parts'
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=True)
    name = Column(String, nullable=False)
    blueprint_path = Column(String, nullable=True)
    material_id = Column(Integer, ForeignKey('materials.id'), nullable=True)

    job = relationship('Job', back_populates='parts')
    material = relationship('Material', back_populates='parts')

class Material(Base):
    __tablename__ = 'materials'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    spec = Column(Text, nullable=True)

    parts = relationship('Part', back_populates='material')

class PurchaseOrder(Base):
    __tablename__ = 'purchase_orders'
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, nullable=False)
    vendor = Column(String, nullable=True)
    order_date = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)
    total_amount = Column(String, nullable=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=True)

    job = relationship('Job', back_populates='purchase_orders')
