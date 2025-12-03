# app/main.py

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
    redoc_url="/api/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # ⬅ dev: allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
#               CORS CONFIGURATION
# ============================================================
if settings.ALLOWED_ORIGINS:
    origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


print("CORS Allowed Origins:", origins)

# ============================================================
#               INITIALIZE DATABASE
# ============================================================
init_db()

# ============================================================
#               API ROUTERS
# ============================================================
app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(routes_ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(routes_progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(routes_roadmaps.router, prefix="/api/roadmaps", tags=["Roadmaps"])

# ============================================================
#              HEALTH CHECKS
# ============================================================
@app.get("/health")
def health_root():
    return {"status": "ok", "service": settings.APP_NAME}

@app.get("/api/health")
def health_api():
    return {"status": "ok", "service": settings.APP_NAME}

# ============================================================
#              FRONTEND BUILD SERVING
# ============================================================
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "static" / "dist"
INDEX_HTML = FRONTEND_DIST / "index.html"

assets = FRONTEND_DIST / "assets"
if assets.exists():
    app.mount("/assets", StaticFiles(directory=assets), name="assets")


@app.get("/")
def serve_root():
    if INDEX_HTML.exists():
        return FileResponse(INDEX_HTML)
    return {"error": "Frontend build missing. Run `npm run build`."}


@app.get("/{full_path:path}")
def spa_fallback(request: Request, full_path: str):
    path = request.url.path

    if (
        path.startswith("/api")
        or path.startswith("/docs")
        or path.startswith("/redoc")
        or path.startswith("/openapi.json")
    ):
        return JSONResponse(status_code=404, content={"error": "API endpoint not found"})

    if INDEX_HTML.exists():
        return FileResponse(INDEX_HTML)

    return JSONResponse(status_code=500, content={"error": "Frontend build missing"})
