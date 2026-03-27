from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class CustomerBase(BaseModel):
    name: str
    point_of_contact: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class JobBase(BaseModel):
    name: str
    description: Optional[str] = None
    customer_id: Optional[int] = None
    received_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class PartBase(BaseModel):
    name: str
    job_id: Optional[int] = None
    material_id: Optional[int] = None
    material_type: Optional[str] = None
    material_size: Optional[str] = None
    status: Optional[str] = None

class PartCreate(PartBase):
    pass

class Part(PartBase):
    id: int
    blueprint_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class MaterialBase(BaseModel):
    name: str
    material_type: Optional[str] = None
    material_size: Optional[str] = None
    purchase_location: Optional[str] = None
    provider_info: Optional[str] = None
    po_number: Optional[str] = None

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    doc_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class POBase(BaseModel):
    po_number: str
    vendor: Optional[str] = None
    order_date: Optional[date] = None
    received_date: Optional[date] = None
    total_amount: Optional[str] = None
    job_id: Optional[int] = None

class POCreate(POBase):
    pass

class PO(POBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True
