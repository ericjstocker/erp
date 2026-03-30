import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import shutil

from . import models, schemas, auth
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Carter Components - Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv('UPLOAD_DIR', '/data/blueprints')
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Auth schemas and login endpoint
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def verify_auth(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing authorization header')
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Invalid authorization format')
    token = parts[1]
    username = auth.verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    return username


def get_admin_password_hash(db: Session) -> str:
    setting = db.query(models.SystemSetting).filter_by(key='admin_password_hash').first()
    if setting:
        return setting.value
    return auth.hash_password(auth.ADMIN_PASSWORD)


@app.post('/login', response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    if req.username != auth.ADMIN_USER:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    stored_hash = get_admin_password_hash(db)
    if not auth.verify_password(req.password, stored_hash):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = auth.create_access_token(req.username)
    return TokenResponse(access_token=token)

@app.post('/auth/change-password')
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    stored_hash = get_admin_password_hash(db)
    if not auth.verify_password(req.current_password, stored_hash):
        raise HTTPException(status_code=400, detail='Current password is incorrect')
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail='New password must be at least 8 characters')
    new_hash = auth.hash_password(req.new_password)
    setting = db.query(models.SystemSetting).filter_by(key='admin_password_hash').first()
    if setting:
        setting.value = new_hash
    else:
        setting = models.SystemSetting(key='admin_password_hash', value=new_hash)
        db.add(setting)
    db.commit()
    return {'message': 'Password changed successfully'}


# Customers (protected)
@app.post('/customers', response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_customer = models.Customer(
        name=customer.name,
        point_of_contact=customer.point_of_contact,
        phone_number=customer.phone_number,
        email=customer.email,
        notes=customer.notes
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@app.get('/customers', response_model=List[schemas.Customer])
def list_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    return db.query(models.Customer).offset(skip).limit(limit).all()

@app.put('/customers/{customer_id}', response_model=schemas.Customer)
def update_customer(customer_id: int, customer: schemas.CustomerCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_customer = db.query(models.Customer).filter_by(id=customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    for k, v in customer.dict(exclude_unset=True).items():
        setattr(db_customer, k, v)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get('/customers/{customer_id}', response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    customer = db.query(models.Customer).filter_by(id=customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    return customer

@app.get('/customers/{customer_id}/jobs', response_model=List[schemas.Job])
def get_customer_jobs(customer_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    customer = db.query(models.Customer).filter_by(id=customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    return db.query(models.Job).filter_by(customer_id=customer_id).all()

# Jobs (protected)
@app.post('/jobs', response_model=schemas.Job)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_job = models.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.get('/jobs', response_model=List[schemas.Job])
def list_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    return db.query(models.Job).offset(skip).limit(limit).all()

@app.get('/jobs/{job_id}', response_model=schemas.Job)
def get_job(job_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    job = db.query(models.Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job

@app.get('/jobs/{job_id}/parts', response_model=List[schemas.Part])
def get_job_parts(job_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    job = db.query(models.Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return db.query(models.Part).filter_by(job_id=job_id).all()


@app.put('/jobs/{job_id}', response_model=schemas.Job)
def update_job(job_id: int, job: schemas.JobCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_job = db.query(models.Job).filter_by(id=job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail='Job not found')
    for k, v in job.dict(exclude_unset=True).items():
        setattr(db_job, k, v)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

# Parts (protected)
@app.post('/parts', response_model=schemas.Part)
def create_part(part: schemas.PartCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_part = models.Part(**part.dict())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

@app.get('/parts', response_model=List[schemas.Part])
def list_parts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    return db.query(models.Part).offset(skip).limit(limit).all()

@app.get('/parts/{part_id}', response_model=schemas.Part)
def get_part(part_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    part = db.query(models.Part).filter_by(id=part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail='Part not found')
    return part


@app.put('/parts/{part_id}', response_model=schemas.Part)
def update_part(part_id: int, part: schemas.PartCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_part = db.query(models.Part).filter_by(id=part_id).first()
    if not db_part:
        raise HTTPException(status_code=404, detail='Part not found')
    for k, v in part.dict(exclude_unset=True).items():
        setattr(db_part, k, v)
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

# Materials (protected)
@app.post('/materials', response_model=schemas.Material)
def create_material(mat: schemas.MaterialCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_mat = models.Material(**mat.dict())
    db.add(db_mat)
    db.commit()
    db.refresh(db_mat)
    return db_mat

@app.get('/materials', response_model=List[schemas.Material])
def list_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    return db.query(models.Material).offset(skip).limit(limit).all()

@app.get('/materials/{material_id}', response_model=schemas.Material)
def get_material(material_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    material = db.query(models.Material).filter_by(id=material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail='Material not found')
    return material

@app.put('/materials/{material_id}', response_model=schemas.Material)
def update_material(material_id: int, mat: schemas.MaterialCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_mat = db.query(models.Material).filter_by(id=material_id).first()
    if not db_mat:
        raise HTTPException(status_code=404, detail='Material not found')
    for k, v in mat.dict(exclude_unset=True).items():
        setattr(db_mat, k, v)
    db.add(db_mat)
    db.commit()
    db.refresh(db_mat)
    return db_mat

@app.delete('/materials/{material_id}', status_code=204)
def delete_material(material_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_mat = db.query(models.Material).filter_by(id=material_id).first()
    if not db_mat:
        raise HTTPException(status_code=404, detail='Material not found')
    db.delete(db_mat)
    db.commit()
    return None

@app.post('/pos', response_model=schemas.PO)
def create_po(po: schemas.POCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    # simple uniqueness check for po_number
    existing = db.query(models.PurchaseOrder).filter_by(po_number=po.po_number).first()
    if existing:
        raise HTTPException(status_code=400, detail='PO number already exists')
    db_po = models.PurchaseOrder(**po.dict())
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    return db_po

@app.get('/pos', response_model=List[schemas.PO])
def list_pos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    return db.query(models.PurchaseOrder).offset(skip).limit(limit).all()


@app.put('/pos/{po_id}', response_model=schemas.PO)
def update_po(po_id: int, po: schemas.POCreate, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    db_po = db.query(models.PurchaseOrder).filter_by(id=po_id).first()
    if not db_po:
        raise HTTPException(status_code=404, detail='PO not found')
    for k, v in po.dict(exclude_unset=True).items():
        setattr(db_po, k, v)
    db.add(db_po)
    db.commit()
    db.refresh(db_po)
    return db_po

# Blueprint upload (protected)
@app.post('/blueprints/upload')
def upload_blueprint(part_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    part = db.query(models.Part).filter_by(id=part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail='Part not found')
    filename = f"part_{part_id}_{file.filename}"
    dest_path = os.path.join(UPLOAD_DIR, filename)
    with open(dest_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    part.blueprint_path = dest_path
    db.add(part)
    db.commit()
    db.refresh(part)
    return {"part_id": part_id, "path": dest_path}

@app.get('/blueprints/download/{part_id}')
def download_blueprint(part_id: int, db: Session = Depends(get_db), user: str = Depends(verify_auth)):
    part = db.query(models.Part).filter_by(id=part_id).first()
    if not part or not part.blueprint_path:
        raise HTTPException(status_code=404, detail='Blueprint not found')
    if not os.path.exists(part.blueprint_path):
        raise HTTPException(status_code=404, detail='Blueprint file not found on disk')
    return FileResponse(part.blueprint_path, filename=os.path.basename(part.blueprint_path))
