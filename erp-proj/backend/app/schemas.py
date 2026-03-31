from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class CustomerBase(BaseModel):
    name: str
    point_of_contact: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    is_archived: Optional[bool] = False

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
    po_number: Optional[str] = None
    customer_id: Optional[int] = None
    received_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    is_archived: Optional[bool] = False

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
    quantity: Optional[int] = None
    is_archived: Optional[bool] = False

class PartCreate(PartBase):
    pass

class PartBlueprint(BaseModel):
    id: int
    part_id: int
    filename: str
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class JobDocument(BaseModel):
    id: int
    job_id: int
    filename: str
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class JobDocumentWithJobName(BaseModel):
    id: int
    job_id: int
    job_name: str
    filename: str
    uploaded_at: Optional[datetime] = None

class MaterialDocument(BaseModel):
    id: int
    material_id: int
    filename: str
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class MaterialPOFile(BaseModel):
    id: int
    material_id: int
    filename: str
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class MaterialPOWithMaterialName(BaseModel):
    id: int
    material_id: int
    material_name: str
    filename: str
    uploaded_at: Optional[datetime] = None

class ItemPO(BaseModel):
    id: int
    filename: str
    description: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    class Config:
        from_attributes = True

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
    shape: Optional[str] = None
    diameter: Optional[str] = None
    length: Optional[str] = None
    width: Optional[str] = None
    height: Optional[str] = None
    purchase_location: Optional[str] = None
    provider_info: Optional[str] = None
    po_number: Optional[str] = None
    quantity: Optional[int] = None

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
