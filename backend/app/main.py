import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.api import routes_auth, routes_ai, routes_progress, routes_roadmaps
from app.db.init_db import init_db
from app.core.config import settings


# ============================================================
#               FASTAPI INITIALIZATION
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS CONFIG
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# INIT DATABASE
init_db()

# ============================================================
#               API ROUTERS
# ============================================================
app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(routes_ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(routes_progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(routes_roadmaps.router, prefix="/api/roadmaps", tags=["Roadmaps"])

# ============================================================
#               HEALTH CHECKS
# ============================================================
@app.get("/health")
def health_root():
    return {"status": "ok", "service": settings.APP_NAME}

# also keep the /api health path (frontend expects /api/health)
@app.get("/api/health")
def health_api():
    return {"status": "ok", "service": settings.APP_NAME}

# ============================================================
#               FRONTEND (VITE REACT BUILD)
# ============================================================
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "static" / "dist"
INDEX_HTML = FRONTEND_DIST / "index.html"

# Mount static assets (JS/CSS) if present
assets_dir = FRONTEND_DIST / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Serve root index if available
@app.get("/")
async def serve_frontend_root():
    if INDEX_HTML.exists():
        return FileResponse(INDEX_HTML)
    return JSONResponse(status_code=404, content={"error": "Frontend build not found. Run npm run build."})

# SPA fallback for client-side routes.
# DO NOT swallow API, docs or OpenAPI routes.
@app.get("/{full_path:path}")
async def serve_frontend_fallback(request: Request, full_path: str):
    path = request.url.path or ""

    # If the request is for API or OpenAPI/docs, let FastAPI handle or return a 404 JSON.
    # This avoids serving index.html for /api/* and /openapi.json /api/docs etc.
    if (
        path.startswith("/api")
        or path.startswith("/openapi.json")
        or path.startswith("/docs")
        or path.startswith("/redoc")
        or path.startswith("/api/docs")
        or path.startswith("/api/redoc")
    ):
        return JSONResponse(status_code=404, content={"error": "API endpoint not found"})

    # Otherwise serve the frontend index.html for client-side routing
    if INDEX_HTML.exists():
        return FileResponse(INDEX_HTML)

    return JSONResponse(status_code=500, content={"error": "Frontend build missing. Build again."})
