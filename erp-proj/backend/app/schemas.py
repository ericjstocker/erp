from datetime import date
from typing import Optional, List
from pydantic import BaseModel

class CustomerBase(BaseModel):
    name: str
    contact: Optional[str]
    notes: Optional[str]

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    class Config:
        orm_mode = True

class JobBase(BaseModel):
    name: str
    description: Optional[str]
    customer_id: Optional[int]
    received_date: Optional[date]
    due_date: Optional[date]
    status: Optional[str]

class JobCreate(JobBase):
    pass

class Job(JobBase):
    id: int
    class Config:
        orm_mode = True

class PartBase(BaseModel):
    name: str
    job_id: Optional[int]
    material_id: Optional[int]

class PartCreate(PartBase):
    pass

class Part(PartBase):
    id: int
    blueprint_path: Optional[str]
    class Config:
        orm_mode = True

class MaterialBase(BaseModel):
    name: str
    spec: Optional[str]

class MaterialCreate(MaterialBase):
    pass

class Material(MaterialBase):
    id: int
    class Config:
        orm_mode = True

class POBase(BaseModel):
    po_number: str
    vendor: Optional[str]
    order_date: Optional[date]
    received_date: Optional[date]
    total_amount: Optional[str]
    job_id: Optional[int]

class POCreate(POBase):
    pass

class PO(POBase):
    id: int
    class Config:
        orm_mode = True
