Small Shop ERP - Prototype

This repository contains a minimal FastAPI backend and React frontend for a small manufacturing shop ERP.

Quick start (requires Docker and Docker Compose):

```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** at `localhost:5432` (user: erp, password: erp)
- **Backend API** at `http://localhost:8000` (OpenAPI docs at `/docs`)
- **Frontend** at `http://localhost:5173`

The backend will automatically:
1. Wait for the database to be ready
2. Run migrations (`alembic upgrade head`)
3. Seed initial data
4. Start the server with hot-reload enabled

Login credentials: `admin` / `admin123`

Data storage:
- Blueprints stored in `./data/blueprints` (mounted into backend container)
- Database persists in Docker volume `db_data`

Development notes:
- Backend auto-reloads on file changes (via uvicorn --reload)
- Frontend hot-reloads on file changes
- All API endpoints require JWT Bearer token (obtained via `/login`)
- Single-user auth (hardcoded admin credentials for simplicity)
