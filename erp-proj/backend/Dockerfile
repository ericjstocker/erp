FROM python:3.11-slim
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD bash -c "echo 'Waiting for database...' && while ! nc -z db 5432; do sleep 1; done && echo 'Database ready!' && alembic upgrade head && python app/seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
