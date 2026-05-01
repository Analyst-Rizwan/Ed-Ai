# app/main.py

from pathlib import Path
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import (
    routes_ai,
    routes_progress,
    routes_roadmaps,
    routes_leetcode,
    routes_problems,
    routes_dashboard,
    routes_opportunities,
    routes_github,
    routes_interview,
    routes_school,
    routes_code,
    routes_profile,
    routes_settings,
)
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.logging_config import setup_logging, RequestLoggingMiddleware
from app.auth import routes as routes_auth

# ============================================================
# STRUCTURED LOGGING
# ============================================================
setup_logging()
logger = logging.getLogger(__name__)


# ============================================================
# FASTAPI INITIALIZATION
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    # SECURITY: Disable API docs in production (VULN-13)
    docs_url="/api/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/api/redoc" if settings.APP_ENV == "development" else None,
)

# ============================================================
# RATE LIMITING
# ============================================================
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ============================================================
# STARTUP SCHEMA VALIDATION
# ============================================================
@app.on_event("startup")
def check_schema():
    """
    Validate critical DB tables/columns exist at startup.
    Logs CRITICAL errors immediately rather than waiting for user-triggered 500s.
    """
    from sqlalchemy import text
    from app.db.session import engine

    checks = [
        ("playground_settings", "SELECT 1 FROM playground_settings LIMIT 1"),
        ("progress.solved", "SELECT solved FROM progress LIMIT 1"),
        ("tutor_conversations", "SELECT 1 FROM tutor_conversations LIMIT 1"),
    ]
    with engine.connect() as conn:
        for name, sql in checks:
            try:
                conn.execute(text(sql))
                logger.info("Schema check OK: %s", name)
            except Exception as e:
                logger.critical("Schema check FAILED for '%s': %s", name, e)

        # Ensure critical indexes exist (idempotent CREATE INDEX IF NOT EXISTS)
        index_statements = [
            "CREATE INDEX IF NOT EXISTS idx_tutor_conversations_user_id ON tutor_conversations(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation_id ON tutor_messages(conversation_id)",
        ]
        for idx_sql in index_statements:
            try:
                conn.execute(text(idx_sql))
                conn.commit()
            except Exception as e:
                logger.warning("Index creation skipped: %s", e)

# ============================================================
# CORS CONFIGURATION
# ============================================================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://www.eduaiajk.in",
    "https://eduaiajk.in",
    "https://ed-ai-frontend.vercel.app",
    "https://ed-ai-gules.vercel.app",   # Production Vercel deployment
    # SECURITY: Removed backend URL — it should never be a browser CORS origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://(.*\.)?eduaiajk\.in", # Robust subdomain matching
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure CORS headers are added to 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
    # Add CORS headers manually to the error response
    origin = request.headers.get("origin")
    if origin in origins or (origin and "eduaiajk.in" in origin) or (origin and "vercel.app" in origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# ============================================================
# GZIP COMPRESSION (compresses responses >= 1KB by ~70%)
# SSE (text/event-stream) is excluded — GZip would buffer chunks
# and defeat streaming entirely.
# ============================================================
class SelectiveGZipMiddleware:
    """
    Wrapper that applies GZip compression to all responses *except*
    Server-Sent Event streams, which must not be buffered.
    """
    def __init__(self, app: ASGIApp, minimum_size: int = 1000) -> None:
        self.app = app
        self.gzip_app = GZipMiddleware(app, minimum_size=minimum_size)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            # Check Accept header to detect SSE requests early
            headers = dict(scope.get("headers", []))
            accept = headers.get(b"accept", b"").decode("utf-8", errors="ignore")
            if "text/event-stream" in accept:
                await self.app(scope, receive, send)
                return
        await self.gzip_app(scope, receive, send)

app.add_middleware(SelectiveGZipMiddleware, minimum_size=1000)

# ============================================================
# REQUEST LOGGING MIDDLEWARE
# ============================================================
app.add_middleware(RequestLoggingMiddleware)


# ============================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # SECURITY: Content-Security-Policy (VULN-10)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://*.supabase.co; "
            "frame-ancestors 'none';"
        )
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ============================================================
# API ROUTERS
# ============================================================

app.include_router(routes_auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(routes_ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(routes_interview.router, prefix="/api/interview", tags=["Interview"])
app.include_router(routes_progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(routes_roadmaps.router, prefix="/api/roadmaps", tags=["Roadmaps"])
app.include_router(routes_problems.router, prefix="/api/problems", tags=["Problems"])
app.include_router(routes_leetcode.router, prefix="/api/leetcode", tags=["LeetCode"])
app.include_router(routes_dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(routes_opportunities.router, prefix="/api", tags=["Opportunities"])
app.include_router(routes_github.router, prefix="/api/github", tags=["GitHub"])
app.include_router(routes_code.router, prefix="/api/code", tags=["Code"])
app.include_router(routes_profile.router, prefix="/api", tags=["Profile"])
app.include_router(routes_settings.router, prefix="/api/settings", tags=["Settings"])

# ============================================================
# HEALTH CHECKS
# ============================================================
@app.get("/health")
def health_root():
    return {"status": "ok"}

@app.get("/api/health")
def health_api():
    return {"status": "ok"}

@app.api_route("/api/ping", methods=["GET", "HEAD"])
def ping():
    """Lightweight warm-up endpoint for UptimeRobot keep-alive pings.
    Validates DB connectivity so the connection pool stays warm.
    Set UptimeRobot to hit this every 10 minutes to prevent Render cold starts.
    """
    import sqlalchemy
    from app.db.session import SessionLocal
    try:
        session = SessionLocal()
        session.execute(sqlalchemy.text("SELECT 1"))
        session.close()
        return {"status": "ok", "db": "ok"}
    except Exception:
        return {"status": "ok", "db": "unavailable"}

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
