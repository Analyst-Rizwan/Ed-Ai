# app/api/routes_code.py
# Judge0-backed code execution proxy

import httpx
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.auth.dependencies import get_current_user
from fastapi import Request

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── In-memory language cache ──────────────────────────────────────────────
_cached_languages: list | None = None

# ─── Pydantic Models ────────────────────────────────────────────────────────
class ExecuteRequest(BaseModel):
    source_code: str
    language_id: int
    stdin: Optional[str] = ""

class ExecuteResponse(BaseModel):
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    status: dict
    time: Optional[str] = None
    memory: Optional[int] = None
    token: Optional[str] = None


# ─── Helpers ────────────────────────────────────────────────────────────────
DIRECT_HOST = "ce.judge0.com"  # Public free instance — no API key needed

def _is_rapidapi() -> bool:
    """True when routing through RapidAPI proxy."""
    return "rapidapi" in settings.JUDGE0_API_HOST.lower()


def _judge0_headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if _is_rapidapi():
        # RapidAPI mode — key is required
        if not settings.JUDGE0_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Code execution is not configured. Please add JUDGE0_API_KEY to the server environment."
            )
        headers["X-RapidAPI-Key"] = settings.JUDGE0_API_KEY
        headers["X-RapidAPI-Host"] = settings.JUDGE0_API_HOST
    # Direct mode (ce.judge0.com) — no extra headers needed
    return headers


def _judge0_base() -> str:
    host = settings.JUDGE0_API_HOST if settings.JUDGE0_API_HOST else DIRECT_HOST
    return f"https://{host}"


# ─── Routes ─────────────────────────────────────────────────────────────────
@router.post("/execute", response_model=ExecuteResponse)
@limiter.limit("20/minute")
async def execute_code(
    request: Request,
    body: ExecuteRequest,
    current_user=Depends(get_current_user),
):
    """
    Submit code to Judge0 CE and return execution results.
    Uses wait=true for synchronous single-request execution.
    """
    import base64

    headers = _judge0_headers()
    base_url = _judge0_base()

    payload = {
        "source_code": base64.b64encode(body.source_code.encode()).decode(),
        "language_id": body.language_id,
        "stdin": base64.b64encode((body.stdin or "").encode()).decode(),
        "base64_encoded": True,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Submit and wait for result in one shot
            response = await client.post(
                f"{base_url}/submissions",
                json=payload,
                headers=headers,
                params={"wait": "true", "base64_encoded": "true", "fields": "*"},
            )

        if response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Judge0 rate limit reached. Please wait a moment before running again."
            )

        if not response.is_success:
            logger.error(f"Judge0 error {response.status_code}: {response.text}")
            raise HTTPException(
                status_code=502,
                detail=f"Code execution service error: {response.status_code}"
            )

        data = response.json()

        # Decode base64 outputs
        def _decode(val: Optional[str]) -> Optional[str]:
            if not val:
                return None
            try:
                return base64.b64decode(val).decode("utf-8", errors="replace")
            except Exception:
                return val

        return ExecuteResponse(
            stdout=_decode(data.get("stdout")),
            stderr=_decode(data.get("stderr")),
            compile_output=_decode(data.get("compile_output")),
            status=data.get("status", {"id": 0, "description": "Unknown"}),
            time=data.get("time"),
            memory=data.get("memory"),
            token=data.get("token"),
        )

    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Code execution timed out after 30 seconds.")
    except Exception as e:
        logger.exception("Unexpected error during code execution")
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")


@router.get("/languages")
async def get_languages(current_user=Depends(get_current_user)):
    """
    Return supported Judge0 language list.
    Result is cached in memory after first fetch.
    """
    global _cached_languages

    if _cached_languages is not None:
        return _cached_languages

    try:
        headers = _judge0_headers()
        base_url = _judge0_base()
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{base_url}/languages", headers=headers)
        if response.is_success:
            _cached_languages = response.json()
            return _cached_languages
    except Exception as e:
        logger.warning(f"Could not fetch Judge0 language list: {e}")

    # Fallback: curated popular languages
    return _FALLBACK_LANGUAGES


# ─── Fallback language list (popular subset) ────────────────────────────────
_FALLBACK_LANGUAGES = [
    {"id": 71,  "name": "Python (3.8.1)"},
    {"id": 54,  "name": "C++ (GCC 9.2.0)"},
    {"id": 50,  "name": "C (GCC 9.2.0)"},
    {"id": 62,  "name": "Java (OpenJDK 13.0.1)"},
    {"id": 63,  "name": "JavaScript (Node.js 12.14.0)"},
    {"id": 74,  "name": "TypeScript (3.7.4)"},
    {"id": 60,  "name": "Go (1.13.5)"},
    {"id": 73,  "name": "Rust (1.40.0)"},
    {"id": 51,  "name": "C# (Mono 6.6.0.161)"},
    {"id": 78,  "name": "Kotlin (1.3.70)"},
    {"id": 72,  "name": "Ruby (2.7.0)"},
    {"id": 83,  "name": "Swift (5.2.3)"},
    {"id": 68,  "name": "PHP (7.4.1)"},
    {"id": 90,  "name": "Dart (2.19.2)"},
    {"id": 81,  "name": "Scala (2.13.2)"},
    {"id": 80,  "name": "R (4.0.0)"},
    {"id": 46,  "name": "Bash (5.0.0)"},
    {"id": 82,  "name": "SQL (SQLite 3.27.2)"},
]
