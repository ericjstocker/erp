#!/bin/bash
set -e

PROJECT_DIR="/mnt/jane/docker/erp-proj/erp-proj"

echo "==> Navigating to project directory..."
cd "$PROJECT_DIR"

echo "==> Pulling latest changes from git..."
git pull

echo "==> Bringing containers down..."
docker compose down

echo "==> Rebuilding and starting containers..."
docker compose up --build -d

echo "==> Waiting for backend to be ready..."
MAX_WAIT=60
WAITED=0
until docker compose exec backend alembic --version > /dev/null 2>&1; do
  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "ERROR: Backend did not become ready within ${MAX_WAIT}s. Check logs with: docker compose logs backend"
    exit 1
  fi
  echo "   ...waiting for backend (${WAITED}s elapsed)"
  sleep 3
  WAITED=$((WAITED + 3))
done

echo "==> Running database migrations..."
docker compose exec backend alembic upgrade head

echo ""
echo "✓ Update complete! The app is running at http://localhost:3000"
