# Ed-AI Full Codebase Audit

> Audited on **2026-03-26** — covers `backend/` (FastAPI/Python) and `frontend/` (Vite/React/TypeScript).

---

## Severity Legend

| Tag | Meaning |
|-----|---------|
| 🔴 **CRITICAL** | Security risk or data-loss potential — fix immediately |
| 🟠 **HIGH** | Significant tech debt or production impact |
| 🟡 **MEDIUM** | Maintainability / scalability concern |
| 🟢 **LOW** | Nice-to-have improvement |

---

## 1. Security Issues

### 🔴 S-1: Insecure Default `SECRET_KEY`

[config.py](file:///d:/Ed-!/backend/app/core/config.py#L19)

```python
SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
```

A hardcoded fallback means **any deployment that forgets `.env` uses a publicly-known secret for JWT signing**. A startup guard should fail-fast if `SECRET_KEY` is the default.

---

### 🔴 S-2: GitHub Access Token Stored in Plaintext

[user.py](file:///d:/Ed-!/backend/app/models/user.py#L46)

```python
github_access_token = Column(String, nullable=True)
```

An encryption module exists in [encryption.py](file:///d:/Ed-!/backend/app/core/encryption.py), but the token is stored **raw** in the `users` table. If the database is compromised, all linked GitHub accounts are exposed.

**Fix**: Encrypt on write, decrypt on read, using `encrypt_value()`/`decrypt_value()`.

---

### 🔴 S-3: OTP Code Stored in Plaintext

[otp_code.py](file:///d:/Ed-!/backend/app/models/otp_code.py) stores the raw 6-digit OTP. If the DB is breached, an attacker can reset any user's password.

**Fix**: Hash the OTP at creation (like passwords), and compare via `verify_password()` on check.

---

### 🟠 S-4: No Password Strength Validation

[routes.py](file:///d:/Ed-!/backend/app/auth/routes.py#L230-L263) — the `/register` and `/reset-password` endpoints accept any password string with no minimum length or complexity check.

---

### 🟠 S-5: CORS Origin Check in Exception Handler is Fragile

[main.py](file:///d:/Ed-!/backend/app/main.py#L87)

```python
if origin in origins or (origin and "eduaiajk.in" in origin) or (origin and "vercel.app" in origin):
```

This substring check (`"vercel.app" in origin`) would match **any** `*.vercel.app` origin, not just yours. An attacker's `evil.vercel.app` passes.

---

### 🟠 S-6: `X-XSS-Protection: 1; mode=block` is Deprecated

[main.py](file:///d:/Ed-!/backend/app/main.py#L134) — Modern browsers have removed XSS Auditor. This header is a no-op (and can introduce issues in legacy browsers). Remove it and rely on CSP.

---

### 🟡 S-7: Encryption Key Derived From JWT Signing Key

[encryption.py](file:///d:/Ed-!/backend/app/core/encryption.py#L14) derives the Fernet key from `SECRET_KEY`. If `SECRET_KEY` rotates for JWT reasons, all encrypted DB values break silently. Use a **separate** `ENCRYPTION_KEY` env var.

---

## 2. Architecture & Code Quality

### 🔴 A-1: Two Competing AI Client Modules

| File | Purpose |
|------|---------|
| [ai_client.py](file:///d:/Ed-!/backend/app/core/ai_client.py) | Unified Gemini+OpenAI (441 lines) |
| [openai_client.py](file:///d:/Ed-!/backend/app/core/openai_client.py) | OpenAI-only duplicate (64 lines) |

Both export `ask_ai` and `stream_ai` with different signatures. It's unclear which routes use which. **Delete `openai_client.py`** and use `ai_client.py` exclusively.

---

### 🟠 A-2: Massive Code Duplication in `ai_client.py`

The file has **3 nearly-identical pairs** of OpenAI/Gemini functions:

| Function Pair | Lines |
|---------------|-------|
| `_ask_openai` / `_ask_gemini` | 77-155 |
| `_ask_openai_interview` / `_ask_gemini_interview` | 276-344 |
| `_ask_openai_mock_interview` / `_ask_gemini_mock_interview` | 373-441 |

The only difference is the **model name**. Refactor into a single `_call_provider(model, messages, ...)` factory.

---

### 🟠 A-3: Monolithic Page Components

| File | Size | Concern |
|------|------|---------|
| [InterviewPrep.tsx](file:///d:/Ed-!/frontend/src/pages/InterviewPrep.tsx) | **53 KB** | |
| [InterviewPrepMobile.tsx](file:///d:/Ed-!/frontend/src/pages/InterviewPrepMobile.tsx) | **52 KB** | Near-duplicate of above |
| [Learn.tsx](file:///d:/Ed-!/frontend/src/pages/Learn.tsx) | **52 KB** | |
| [Roadmaps.tsx](file:///d:/Ed-!/frontend/src/pages/Roadmaps.tsx) | **42 KB** | |
| [LandingPage.tsx](file:///d:/Ed-!/frontend/src/pages/LandingPage.tsx) | **38 KB** | |
| [Opportunities.tsx](file:///d:/Ed-!/frontend/src/pages/Opportunities.tsx) | **35 KB** | |

These files are 1000+ lines each. **Break them into sub-components** (e.g., `InterviewPrep/MockTab.tsx`, `InterviewPrep/StarTab.tsx`).

`InterviewPrepMobile.tsx` **(52KB)** is a near-complete copy of `InterviewPrep.tsx` — use **responsive design** instead of a separate mobile file.

---

### 🟠 A-4: Hardcoded CORS Origins

[main.py](file:///d:/Ed-!/backend/app/main.py#L57-L67) — origins are hardcoded. The config already has `ALLOWED_ORIGINS` but it's **never used** in `main.py`. Parse it and use it.

---

### 🟡 A-5: `os.getenv` Bypasses pydantic-settings

[config.py](file:///d:/Ed-!/backend/app/core/config.py) wraps every field in `os.getenv(...)` as the default, which runs **before** pydantic-settings reads `.env`. This defeats the purpose of `SettingsConfigDict(env_file=".env")`. Remove the `os.getenv()` wrappers and let pydantic handle it.

---

### 🟡 A-6: Backward-Compat Shim `security.py` Should Be Removed

[security.py](file:///d:/Ed-!/backend/app/core/security.py) is a thin re-export layer kept "for backward compat." Grep consumers and update them directly to import from `app.auth.*`.

---

### 🟡 A-7: Inline Schemas in Route Files

[routes.py](file:///d:/Ed-!/backend/app/auth/routes.py#L271-L283) defines `ForgotPasswordRequest`, `VerifyOTPRequest`, `ResetPasswordRequest` inline. Move to [schemas.py](file:///d:/Ed-!/backend/app/auth/schemas.py).

---

### 🟡 A-8: Two `get_db` Paths

Routes import `get_db` from both `app.db.base` and `app.db.session`. Consolidate to **one** canonical import path.

---

### 🟢 A-9: `useAuth` Hook Duplicated

[useAuth.ts](file:///d:/Ed-!/frontend/src/hooks/useAuth.ts) re-exports `useAuth` from `AuthContext.tsx`, which already exports `useAuth`. Pick one source of truth.

---

## 3. Backend Tech Debt

### 🟠 B-1: No Async Database Support

[session.py](file:///d:/Ed-!/backend/app/db/session.py) uses `create_engine` (synchronous). All routes using `Depends(get_db)` block the event loop during DB queries. With 4 Gunicorn/Uvicorn workers and async AI streaming calls, this is a bottleneck.

**Fix**: Migrate to `create_async_engine` + `async_sessionmaker` from SQLAlchemy 2.0.

---

### 🟠 B-2: Debug & Scratch Scripts Committed

| File | Purpose |
|------|---------|
| `debug_gemini_models.py` | One-off debugging |
| `debug_html.py`, `debug_html_2.py`, `debug_html_3.py` | Ad-hoc HTML debugging |
| `debug_naukri.py` | Job scraper debug |
| `script_scrapers.py`, `script_specific.py` | Misc scripts |
| `test_user_create.py` | Ad-hoc test |
| `run_migration.py` | Should be replaced by `alembic` CLI |

These should be `.gitignore`d, deleted, or moved under `scripts/`.

---

### 🟠 B-3: SQLite Database Committed to Repo

[eduai.db](file:///d:/Ed-!/backend/eduai.db) (1.3 MB) is checked in. This is a data leak risk and bloats the repo. Add `*.db` to `.gitignore`.

---

### 🟡 B-4: Duplicate `requirements.txt`

Both `d:\Ed-!\requirements.txt` and `d:\Ed-!\backend\requirements.txt` exist with different content. Only the backend one is used. Delete the root-level duplicate.

---

### 🟡 B-5: Stale `__pycache__` Directories

`__pycache__` folders exist under `app/`, `app/api/`, `app/core/`, etc. Add to `.gitignore` and run `git rm -r --cached`.

---

### 🟡 B-6: `ping` Endpoint Creates Unclosed Sessions on Failure

[main.py](file:///d:/Ed-!/backend/app/main.py#L185-L193)

```python
session = SessionLocal()
session.execute(sqlalchemy.text("SELECT 1"))
session.close()
```

If `execute` throws, `session.close()` never runs. Use a `try/finally` or context manager.

---

### 🟢 B-7: `OpenAI` Client Instantiated Globally on Import

[openai_client.py](file:///d:/Ed-!/backend/app/core/openai_client.py#L9)

```python
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
```

If `OPENAI_API_KEY` is `None` (Gemini-only deployments), this may raise or create a broken client at import time.

---

### 🟢 B-8: In-Memory Cache Not Shared Across Workers

[cache.py](file:///d:/Ed-!/backend/app/core/cache.py) uses a per-process dict. With 4 Gunicorn workers, each has its own cache — 4× the API calls. Add Redis when scaling, or document this limitation.

---

## 4. Frontend Tech Debt

### 🟠 F-1: `any` Types Sprinkled Throughout

[api.ts](file:///d:/Ed-!/frontend/src/lib/api.ts#L269) — `register: async (userData: any)`. Several other places use `(headers as any)`. Define proper TypeScript interfaces.

---

### 🟠 F-2: Inconsistent Import Strategy

[App.tsx](file:///d:/Ed-!/frontend/src/App.tsx) — `Admin`, `Opportunities`, `Learn`, `DSAVisualizer`, `PortfolioBuilder` are lazy-loaded, but **`Dashboard` (23KB), `Roadmaps` (42KB), `InterviewPrep` (53KB)** are eagerly imported. These 3 add ~120KB to the initial bundle. Lazy-load them too.

---

### 🟠 F-3: Duplicate Suspense Fallback

The same spinner JSX is copy-pasted **5 times** in `App.tsx` lines 82-88. Extract a `<LoadingSpinner />` component.

---

### 🟡 F-4: Two Toaster Components Rendered

[App.tsx](file:///d:/Ed-!/frontend/src/App.tsx#L1-L2) renders both `<Toaster />` (Radix) and `<Sonner />`. Pick one toast system to avoid confusion and duplicate UI.

---

### 🟡 F-5: Stale Build Artifacts Committed

```
vite.config.ts.timestamp-1770964499616-d49948493ec008.mjs
vite.config.ts.timestamp-1772493609032-98bf683c650a68.mjs
vite.config.ts.timestamp-1774289062428-5e00c84f669a48.mjs
```

These Vite temp files and the `dist/` directory should be in `.gitignore`.

---

### 🟡 F-6: Hard Redirect on Logout

[AuthContext.tsx](file:///d:/Ed-!/frontend/src/context/AuthContext.tsx#L62) uses `window.location.href = "/"` (full page reload). Use `navigate("/")` from react-router for a smoother SPA experience.

---

### 🟡 F-7: `learnData.ts` is 37KB of Hardcoded Content

[learnData.ts](file:///d:/Ed-!/frontend/src/data/learnData.ts) — 37KB of lesson content baked into the JS bundle. Consider serving from the API or lazy-loading per-topic.

---

### 🟢 F-8: `lint_output.txt` Committed

A 31KB lint output file is checked in. Add to `.gitignore`.

---

## 5. Testing

### 🔴 T-1: Zero Frontend Tests

No test framework configured. No `*.test.tsx`, no `vitest.config.ts`, no Playwright/Cypress e2e. For a production app, this is a significant risk.

**Recommendation**: Add Vitest for unit tests + Playwright for critical user flows (login, register, problem solving).

---

### 🟠 T-2: Minimal Backend Test Coverage

Only **4 test files** exist:

| File | Coverage |
|------|----------|
| `test_auth.py` | Login, register |
| `test_problems.py` | Problem CRUD |
| `test_progress.py` | Progress tracking |
| `test_security.py` | JWT, password |

**Missing coverage**: AI endpoints, roadmaps, interview, opportunities, GitHub OAuth, OTP flow, dashboard, school routes, rate limiting, streaming.

---

### 🟡 T-3: No CI Test Pipeline

`.github/` exists but no workflow running tests on PR. Add a GitHub Actions workflow for pytest + eslint.

---

## 6. DevOps & Deployment

### 🟠 D-1: Hardcoded DB Credentials in `docker-compose.yml`

[docker-compose.yml](file:///d:/Ed-!/docker-compose.yml#L9-L11)

```yaml
POSTGRES_USER: eduai
POSTGRES_PASSWORD: eduai_secret
```

Use environment variables or Docker secrets.

---

### 🟠 D-2: `gunicorn` Installed at Runtime in `render.yaml`

[render.yaml](file:///d:/Ed-!/render.yaml#L19) — `pip install gunicorn` runs on **every cold start**. Add `gunicorn` to `requirements.txt`.

---

### 🟡 D-3: `playwright install chromium` in Build Command

[render.yaml](file:///d:/Ed-!/render.yaml#L15) installs Chromium on every build (~200MB). If the job scraper isn't used in production, remove it to speed up deploys by 2-3 minutes.

---

### 🟡 D-4: No Health Check in Docker Compose for Backend

The `db` service has a healthcheck, but `backend` does not. Add one hitting `/health`.

---

### 🟡 D-5: `.env` File Committed in Backend

[backend/.env](file:///d:/Ed-!/backend/.env) (3.4KB) is tracked. This likely contains real API keys and secrets. **Remove from git history** and add to `.gitignore`.

---

## 7. Performance & Scalability

### 🟠 P-1: Synchronous Gemini Streaming Uses Thread Pool

[ai_client.py](file:///d:/Ed-!/backend/app/core/ai_client.py#L218-L236) — `asyncio.to_thread` is used to iterate Gemini's sync streaming. This consumes threadpool workers (default 40) under load. Migrate to `google.genai` async API when available.

---

### 🟡 P-2: Refresh Token Verification Iterates All User Tokens

[routes.py](file:///d:/Ed-!/backend/app/auth/routes.py#L119-L129) — verifying a refresh token fetches **all** non-expired tokens and bcrypt-verifies each. With many sessions, this is O(n × bcrypt_cost). Store a JTI in the DB for O(1) lookup.

---

### 🟡 P-3: No Database Indexes on Frequently Queried Columns

The `OTPCode` model likely queries by `(email, used, expires_at)`, `RefreshToken` by `(user_id, revoked)`. Ensure composite indexes exist.

---

### 🟢 P-4: Bundle Size Could Be Reduced

15+ Radix UI packages are dependencies. Audit which are actually used. Unused packages increase install and build time.

---

## Summary: Priority Action Items

| Priority | Count | Top Actions |
|----------|-------|-------------|
| 🔴 Critical | **4** | Fix secret key guard, encrypt GitHub tokens, hash OTPs, add frontend tests |
| 🟠 High | **14** | Delete duplicate AI client, refactor giant pages, add async DB, test coverage, secure docker creds, git-clean secrets |
| 🟡 Medium | **14** | Consolidate imports, remove debug scripts, CI pipeline, password validation |
| 🟢 Low | **5** | Bundle audit, cache docs, minor refactors |

> **Total findings: 37**
