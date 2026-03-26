import os

class Settings:
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'postgresql+psycopg2://erp:erp@db:5432/erpdb')
    UPLOAD_DIR: str = os.getenv('UPLOAD_DIR', '/data/blueprints')

settings = Settings()
