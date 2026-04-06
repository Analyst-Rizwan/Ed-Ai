# 🎮 Code Playground — Full Implementation Guide

> **Purpose:** Drop this into any FastAPI + React/Vite project to get a LeetCode-style, full-screen code execution playground backed by Judge0 CE.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dependencies](#dependencies)
3. [Backend — Judge0 Proxy](#backend--judge0-proxy)
   - [Environment Variables](#environment-variables)
   - [Config (`config.py`)](#config-configpy)
   - [Routes (`routes_code.py`)](#routes-routes_codepy)
   - [Wiring into `main.py`](#wiring-into-mainpy)
4. [Frontend — React Components](#frontend--react-components)
   - [API Client (`api.ts`)](#api-client-apits)
   - [Page Component (`CodePlayground.tsx`)](#page-component-codeplaygroundtsx)
   - [Styles (`CodePlayground.css`)](#styles-codeplaygroundcss)
   - [Routing (`App.tsx`)](#routing-apptsx)
   - [Navigation (`Sidebar / BottomNav`)](#navigation-sidebar--bottomnav)
5. [Judge0 Language ID Reference](#judge0-language-id-reference)
6. [Switching Between Free & RapidAPI Mode](#switching-between-free--rapidapi-mode)
7. [Rate-Limit Notes](#rate-limit-notes)
8. [Deployment Checklist](#deployment-checklist)

---

## Architecture Overview

```
Browser (React + Monaco Editor)
    │
    │  POST /api/code/execute  { source_code, language_id, stdin }
    ▼
FastAPI Backend  (routes_code.py)
    │  Base64-encodes source & stdin
    │  Sets appropriate headers (RapidAPI key, OR nothing for direct mode)
    ▼
Judge0 CE  (ce.judge0.com  OR  judge0-ce.p.rapidapi.com)
    │  ?wait=true  →  synchronous single-request execution
    ▼
FastAPI decodes base64 outputs (stdout / stderr / compile_output)
    ▼
Browser renders result in terminal-style output panel
```

**Key design decisions:**
- `wait=true` → single round-trip, no polling needed
- All I/O is base64-encoded to safely handle binary/unicode
- The backend auto-detects which Judge0 mode to use based on `JUDGE0_API_HOST`
- Language list is fetched once and cached in memory (in-process)
- A hardcoded fallback language list is used if Judge0 `/languages` is unreachable

---

## Dependencies

### Backend (pip)

```
httpx           # async HTTP client for Judge0 calls
fastapi
pydantic
pydantic-settings
sqlalchemy
slowapi         # rate limiting
```

### Frontend (npm)

```bash
npm install @monaco-editor/react react-resizable-panels lucide-react
```

| Package                  | Purpose                                       |
|--------------------------|-----------------------------------------------|
| `@monaco-editor/react`   | VS Code's editor (IntelliSense, syntax, etc.) |
| `react-resizable-panels` | Drag-to-resize editor/output split view       |
| `lucide-react`           | Icon set (Play, Terminal, Copy, etc.)         |

---

## Backend — Judge0 Proxy

### Environment Variables

Add to your `.env`:

```dotenv
# ── Option A: Free direct instance (no key, public, rate-limited) ──────────
JUDGE0_API_HOST=ce.judge0.com
# JUDGE0_API_KEY is not needed in this mode

# ── Option B: RapidAPI proxy (higher limits, requires active subscription) ─
# JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
# JUDGE0_API_KEY=b70156edd3mshcb4aebae990f1624fp1f7570jsn959807739cc8
```

> **Current active config in Ed-AI:** `ce.judge0.com` (free, no key)  
> **RapidAPI key on file (deactivated):** `b70156edd3mshcb4aebae990f1624fp1f7570jsn959807739cc8`

The backend detects the mode automatically:
- If `JUDGE0_API_HOST` contains `"rapidapi"` → attaches `X-RapidAPI-Key` + `X-RapidAPI-Host` headers
- Otherwise → hits the host directly with no auth headers

---

### Config (`config.py`)

Add these two fields to your `Settings` class:

```python
# === Judge0 (Code Execution) ===
JUDGE0_API_KEY: str | None = os.getenv("JUDGE0_API_KEY")
JUDGE0_API_HOST: str = os.getenv("JUDGE0_API_HOST", "judge0-ce.p.rapidapi.com")
```

Full context — this lives inside a `pydantic_settings.BaseSettings` subclass:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ... other fields ...
    JUDGE0_API_KEY: str | None = os.getenv("JUDGE0_API_KEY")
    JUDGE0_API_HOST: str = os.getenv("JUDGE0_API_HOST", "judge0-ce.p.rapidapi.com")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
```

---

### Routes (`routes_code.py`)

Create `app/api/routes_code.py`:

```python
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
```

---

### Wiring into `main.py`

```python
# In your imports block:
from app.api import routes_code

# In your router registration block:
app.include_router(routes_code.router, prefix="/api/code", tags=["Code"])
```

Exposed endpoints:
| Method | Path                    | Description                                  |
|--------|-------------------------|----------------------------------------------|
| POST   | `/api/code/execute`     | Execute code; returns stdout/stderr/status   |
| GET    | `/api/code/languages`   | List of supported Judge0 languages           |

Both endpoints require an authenticated user (`get_current_user` dependency). Remove that dependency if you don't use auth.

---

## Frontend — React Components

### API Client (`api.ts`)

Add these types and the `codeApi` export to your `lib/api.ts` (or equivalent):

```typescript
// ============================================================
// CODE EXECUTION TYPES & API (Judge0 proxy)
// ============================================================
export interface ExecuteRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
}

export interface ExecuteResponse {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
  token: string | null;
}

export const codeApi = {
  execute: async (data: ExecuteRequest): Promise<ExecuteResponse> => {
    return fetchWithAuth("/code/execute", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getLanguages: async (): Promise<{ id: number; name: string }[]> => {
    return fetchWithAuth("/code/languages");
  },
};
```

> **Note:** `fetchWithAuth` is a thin wrapper around `fetch` that prepends `VITE_API_URL` and injects the Bearer token. Adapt to whatever HTTP client pattern your project uses (axios, etc.).

---

### Page Component (`CodePlayground.tsx`)

Full source: [`frontend/src/pages/CodePlayground.tsx`](frontend/src/pages/CodePlayground.tsx)

**Key features implemented:**
- Monaco Editor with full IntelliSense per language
- 17 languages with boilerplate starter code
- Resizable split panel (editor top, terminal bottom) via `react-resizable-panels`
- `Ctrl+Enter` hotkey to run code
- Stdin tab (pass input to programs)
- Live status badge: Ready / Running / Accepted / Error / TLE / MLE
- Execution metadata chips: runtime (seconds) + memory (MB)
- Animated loading bar while executing
- Copy code + Reset to boilerplate buttons
- Keyboard shortcut cheatsheet modal
- Fully dark/light theme aware via CSS variables

**State shape:**
```typescript
selectedLang: Language        // currently selected language
code: string                  // editor content
stdin: string                 // stdin textarea content
result: ExecuteResponse|null  // last execution result
runStatus: "idle"|"running"|"accepted"|"error"|"tle"|"mle"
activeOutputTab: "output"|"stdin"
```

**Judge0 status ID → UI status mapping:**
```typescript
3  → Accepted
4  → Wrong Answer (error)
5  → Time Limit Exceeded
6  → Memory Limit Exceeded
7–12 → Error (various runtime errors)
11 → Runtime Error
13 → Internal Error
```

---

### Styles (`CodePlayground.css`)

Full source: [`frontend/src/pages/CodePlayground.css`](frontend/src/pages/CodePlayground.css)

The CSS uses CSS custom properties (variables). Required variables from your design system:

```css
--bg             /* page background */
--surface        /* header/panel background */
--surface2       /* input/chip backgrounds */
--text           /* primary text */
--muted          /* secondary/dim text */
--border         /* subtle borders */
--border2        /* stronger borders */
--accent         /* brand color (purple #7C5CFC in Ed-AI) */
--accent-soft    /* accent at ~10% opacity */
--accent-glow    /* accent glow for box-shadow */
--green          /* accepted status */
--red            /* error status */
--orange         /* TLE/MLE warning */
--purple         /* loading bar gradient */
--shadow-md      /* card shadow */
--scrollbar-thumb
```

---

### Routing (`App.tsx`)

Register the playground as a **lazy-loaded fullscreen route** (no app shell/sidebar):

```tsx
import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom"; // or your router

const CodePlayground = lazy(() => import("./pages/CodePlayground"));

// Inside your router config — outside the layout wrapper
// so it renders fullscreen without sidebar/header:
{
  path: "playground",
  element: (
    <Suspense fallback={<div />}>
      <CodePlayground />
    </Suspense>
  ),
}
```

Accessible at: `http://localhost:5173/playground`

---

### Navigation (`Sidebar / BottomNav`)

Add a nav link anywhere you want:

```tsx
import { Terminal } from "lucide-react";

// In sidebar links array:
{ icon: Terminal, label: "Playground", path: "/playground" }
```

---

## Judge0 Language ID Reference

Most commonly used IDs (confirmed working on `ce.judge0.com`):

| ID  | Language                      | Monaco Lang  |
|-----|-------------------------------|--------------|
| 46  | Bash (5.0.0)                  | `shell`      |
| 50  | C (GCC 9.2.0)                 | `c`          |
| 51  | C# (Mono 6.6.0)               | `csharp`     |
| 54  | C++ (GCC 9.2.0)               | `cpp`        |
| 60  | Go (1.13.5)                   | `go`         |
| 62  | Java (OpenJDK 13.0.1)         | `java`       |
| 63  | JavaScript (Node.js 12.14.0)  | `javascript` |
| 68  | PHP (7.4.1)                   | `php`        |
| 71  | Python (3.8.1)                | `python`     |
| 72  | Ruby (2.7.0)                  | `ruby`       |
| 73  | Rust (1.40.0)                 | `rust`       |
| 74  | TypeScript (3.7.4)            | `typescript` |
| 78  | Kotlin (1.3.70)               | `kotlin`     |
| 80  | R (4.0.0)                     | `r`          |
| 81  | Scala (2.13.2)                | `scala`      |
| 82  | SQL (SQLite 3.27.2)           | `sql`        |
| 83  | Swift (5.2.3)                 | `swift`      |
| 90  | Dart (2.19.2)                 | `dart`       |

> Full list: `GET https://ce.judge0.com/languages` (no auth required)

---

## Switching Between Free & RapidAPI Mode

### Free mode (`ce.judge0.com`) — current setup

```dotenv
JUDGE0_API_HOST=ce.judge0.com
# No JUDGE0_API_KEY needed
```

- **Limits:** ~50–100 submissions/day (unenforced, honour system)
- **Latency:** ~1–3s, public queue may be slower during peaks
- **Auth:** None

### RapidAPI mode (paid/subscribed)

```dotenv
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=b70156edd3mshcb4aebae990f1624fp1f7570jsn959807739cc8
```

- **Limits:** Depends on your RapidAPI subscription tier
- **Auth:** `X-RapidAPI-Key` header (injected by backend automatically)
- **Key:** The key above was the Ed-AI RapidAPI key — **check its quota** at [rapidapi.com](https://rapidapi.com/judge0-official/api/judge0-ce) before using

No code change needed — just swap the `.env` values.

---

## Rate-Limit Notes

The backend applies `slowapi` rate limiting:
```python
@limiter.limit("20/minute")
async def execute_code(...):
```

This means **20 execution requests per user per minute** at the backend level, well before Judge0 even gets involved. Tune this in `routes_code.py` to match your Judge0 plan's limits.

---

## Deployment Checklist

- [ ] Add `JUDGE0_API_HOST=ce.judge0.com` to your production environment (Render / Railway / etc.)
- [ ] Skip `JUDGE0_API_KEY` if using free direct mode
- [ ] `httpx` is in your `requirements.txt`
- [ ] `@monaco-editor/react` and `react-resizable-panels` are in `package.json`
- [ ] The `/playground` route is registered outside your authenticated layout guard (or inside it if you want auth protection)
- [ ] CSS variables (`--accent`, `--bg`, etc.) are defined globally in your design system
- [ ] CORS in `main.py` includes your production frontend URL
