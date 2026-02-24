# ============================================================
# Ed-AI — Multi-stage Dockerfile
# Build context must be the PROJECT ROOT (not backend/)
# Stage 1: Build the React frontend
# Stage 2: Run the FastAPI backend (serves frontend as SPA)
# ============================================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --ignore-scripts
COPY frontend/ .
RUN npm run build


# --- Stage 2: Python Runtime ---
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install gunicorn for multi-worker production server
RUN pip install --no-cache-dir gunicorn

# Copy backend source
COPY backend/ .

# Copy built frontend from Stage 1 into the backend's static dir
COPY --from=frontend-builder /frontend/dist ./app/static/dist

# Run Alembic migrations then start gunicorn with uvicorn workers
EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120 --graceful-timeout 30 --access-logfile -"]
