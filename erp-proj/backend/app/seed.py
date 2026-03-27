import sys
import os
from datetime import date

# Allow absolute imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app import models


def seed():
    db = SessionLocal()
    try:
        if db.query(models.Customer).first():
            print('Seed data already exists, skipping')
            return

        # Customers
        cust = models.Customer(name='Acme Corp', point_of_contact='Jane Smith', phone_number='555-1234', email='acme@example.com', notes='Priority customer')
        db.add(cust)

        # Materials
        mat1 = models.Material(name='Aluminum 6061', material_type='6061-T6', material_size='0.125" sheet', purchase_location='Local Metal Supply')
        mat2 = models.Material(name='Stainless 304', material_type='304 annealed', material_size='0.5" plate', purchase_location='Steel Warehouse')
        db.add_all([mat1, mat2])

        db.commit()

        # Jobs
        job = models.Job(name='Widget Batch 001', description='Prototype widgets', customer_id=cust.id,
                         received_date=date.today(), due_date=None, status='queued')
        db.add(job)
        db.commit()

        # Parts
        part = models.Part(name='Widget Base', job_id=job.id, material_id=mat1.id)
        db.add(part)
        db.commit()

        # PO
        po = models.PurchaseOrder(po_number='PO-1001', vendor='MetalSupply', order_date=date.today(),
                                 received_date=None, total_amount='1500', job_id=job.id)
        db.add(po)
        db.commit()

        print('Seed complete')
    finally:
        db.close()


if __name__ == '__main__':
    seed()
