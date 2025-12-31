# app/main.py

from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.api import (
    routes_auth,
    routes_ai,
    routes_progress,
    routes_roadmaps,
    routes_leetcode,
    routes_problems,
)
from app.db.init_db import init_db
from app.core.config import settings


# ============================================================
# FASTAPI INITIALIZATION
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev - consider restricting in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# DATABASE INIT
# ============================================================
init_db()

# ============================================================
# API ROUTERS
# ============================================================
app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(routes_ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(routes_progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(routes_roadmaps.router, prefix="/api/roadmaps", tags=["Roadmaps"])
app.include_router(routes_problems.router, prefix="/api/problems", tags=["Problems"])
app.include_router(routes_leetcode.router, prefix="/api/leetcode", tags=["LeetCode"])

# ============================================================
# HEALTH CHECKS
# ============================================================
@app.get("/health")
def health_root():
    return {"status": "ok"}

@app.get("/api/health")
def health_api():
    return {"status": "ok"}

# ============================================================
# FRONTEND SERVING (SPA FALLBACK) - ONLY IF FILES EXIST
# ============================================================
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "static" / "dist"
INDEX_HTML = FRONTEND_DIST / "index.html"

# Only mount assets if they exist
assets = FRONTEND_DIST / "assets"
if assets.exists():
    app.mount("/assets", StaticFiles(directory=assets), name="assets")

@app.get("/")
def serve_root():
    """Root endpoint - returns API info if no frontend build exists"""
    if INDEX_HTML.exists():
        return FileResponse(INDEX_HTML)
    return {
        "message": "API Server Running",
        "docs": "/api/docs",
        "health": "/health"
    }

# ============================================================
# SPA FALLBACK - ONLY FOR NON-API ROUTES IF FRONTEND EXISTS
# ============================================================
@app.get("/{full_path:path}")
def spa_fallback(request: Request, full_path: str):
    """Catch-all route for SPA, but only if frontend exists"""
    # Always return 404 for API routes
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    
    # If frontend exists, serve it
    if INDEX_HTML.exists():
        return FileResponse(INDEX_HTML)
    
    # Otherwise return 404
    return JSONResponse(
        status_code=404,
        content={"detail": "Route not found. This is an API-only server."}
    )