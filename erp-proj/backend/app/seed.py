from datetime import date
from .database import SessionLocal
from . import models


def seed():
    db = SessionLocal()
    try:
        if db.query(models.Customer).first():
            print('Seed data already exists, skipping')
            return

        # Customers
        cust = models.Customer(name='Acme Corp', contact='acme@example.com', notes='Priority customer')
        db.add(cust)

        # Materials
        mat1 = models.Material(name='Aluminum 6061', spec='6061-T6 sheet 0.125"')
        mat2 = models.Material(name='Stainless 304', spec='304 annealed')
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
