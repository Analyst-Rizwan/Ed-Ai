# Ed-AI Production Plan — Week of Feb 18–25, 2026

A day-by-day execution plan to take the project from ~40% to ~90% production-ready.

---

## Day 1 (Tue Feb 18) — Kill the Mock Security

**Goal:** Every API route uses real JWT authentication.

- [ ] Rewrite `backend/app/core/security.py` with real `bcrypt` hashing and JWT token creation (or delete it entirely and redirect all imports)
- [ ] Replace `from app.core.security import get_current_user` → `from app.auth.dependencies import get_current_user` in:
  - [ ] `routes_ai.py`
  - [ ] `routes_profile.py`
  - [ ] `routes_dashboard.py`
- [ ] Replace all `user_id = 1` with `current_user.id` in:
  - [ ] `routes_problems.py` (lines 36, 135, 201, 252)
  - [ ] `routes_leetcode.py` (line 18)
- [ ] Add `Depends(get_current_user)` parameter to these route functions
- [ ] Verify: Start server → register a user → login → hit each route with the real token

**Estimated time:** 3–4 hours

---

## Day 2 (Wed Feb 19) — Lock Down Admin & Progress Routes

**Goal:** Only authorized users can access sensitive endpoints.

- [ ] Protect `GET /api/progress/admin-stats` with `Depends(require_role("admin"))`
- [ ] Protect `POST /api/progress/user/{id}/reset` with admin role check
- [ ] Refactor `POST /api/progress/user/{id}/roadmap/{id}/complete` and `problem/{id}/complete` — use `current_user.id` instead of URL param `user_id`
- [ ] Add auth to `POST /api/ai/chat` endpoint (currently labeled "NO AUTH")
- [ ] Generate a strong `SECRET_KEY` and set it in `.env`
- [ ] Create `.env.example` with all required env vars documented
- [ ] Fix `updateProfile` in `frontend/src/lib/api.ts` to call real `PUT /api/auth/me` endpoint
- [ ] Verify: Try accessing admin routes without token → expect 401. Try with non-admin token → expect 403.

**Estimated time:** 3–4 hours

---

## Day 3 (Thu Feb 20) — Database & Migrations

**Goal:** Production-ready database with versioned migrations.

- [ ] Install and initialize Alembic: `pip install alembic && alembic init migrations`
- [ ] Configure `alembic.ini` and `env.py` to use `DATABASE_URL` from settings
- [ ] Generate initial migration from existing models: `alembic revision --autogenerate -m "initial"`
- [ ] Test migration: `alembic upgrade head` on a fresh SQLite DB
- [ ] Set up PostgreSQL connection (Supabase or local Docker)
- [ ] Test migration against PostgreSQL
- [ ] Update `config.py` to default to PostgreSQL in production, SQLite in dev
- [ ] Verify: Drop DB → run `alembic upgrade head` → seed a user → login works

**Estimated time:** 4–5 hours

---

## Day 4 (Fri Feb 21) — Deployment Infrastructure

**Goal:** One command to build and deploy the whole stack.

- [ ] Create `backend/Dockerfile`
  ```dockerfile
  FROM python:3.12-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- [ ] Create `docker-compose.yml` (backend + postgres + optional frontend)
- [ ] Create `render.yaml` or `Procfile` if deploying to Render
- [ ] Build frontend for production: `cd frontend && npm run build`
- [ ] Copy `frontend/dist/` → `backend/app/static/dist/` (SPA serving already configured)
- [ ] Test: `docker-compose up` → app works end-to-end at `localhost:8000`
- [ ] Create `DEPLOYMENT.md` with step-by-step deploy instructions

**Estimated time:** 4–5 hours

---

## Day 5 (Sat Feb 22) — Backend Testing

**Goal:** Core API endpoints have automated test coverage.

- [ ] Install test deps: `pip install pytest pytest-asyncio httpx`
- [ ] Create `backend/tests/conftest.py` with:
  - Test database (SQLite in-memory)
  - Test client fixture
  - User creation helper
- [ ] Write auth tests (`tests/test_auth.py`):
  - Register → success + duplicate email rejection
  - Login → correct + wrong credentials
  - Get `/auth/me` with valid/invalid token
  - Refresh token flow
  - Logout
- [ ] Write problem route tests (`tests/test_problems.py`):
  - List problems (authenticated)
  - Get problem stats
- [ ] Write progress route tests (`tests/test_progress.py`):
  - Complete a problem → XP awarded
  - Admin stats (admin-only access)
- [ ] Verify: `cd backend && pytest -v` → all green

**Estimated time:** 5–6 hours

---

## Day 6 (Sun Feb 23) — Code Quality & CI

**Goal:** Clean codebase + automated checks on every push.

- [ ] Remove all `console.log` from frontend:
  - `Practice.tsx` (lines 150, 154)
  - `roadmaps.ts` (lines 438, 462)
  - `api.ts` (line 285 — part of mock removal)
- [ ] Fix deprecated `datetime.utcnow()` → `datetime.now(timezone.utc)` in:
  - `auth/routes.py`
  - `models/user.py`
  - Any other files
- [ ] Add React Error Boundary component wrapping `<App />`
- [ ] Create `.github/workflows/ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    backend-test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-python@v5
          with: { python-version: '3.12' }
        - run: pip install -r backend/requirements.txt
        - run: pip install pytest httpx
        - run: cd backend && pytest -v
    frontend-build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - run: cd frontend && npm ci && npm run build
  ```
- [ ] Verify: Push to GitHub → CI passes

**Estimated time:** 3–4 hours

---

## Day 7 (Mon Feb 24) — Rate Limiting, Logging & Final Polish

**Goal:** Hardened, observable, production-ready application.

- [ ] Add rate limiting to auth endpoints:
  ```
  pip install slowapi
  ```
  - `/auth/login` → 5 attempts/minute per IP
  - `/auth/register` → 3 attempts/minute per IP
- [ ] Add structured logging:
  - Configure Python `logging` module with JSON formatter
  - Add request logging middleware (method, path, status, duration)
  - Remove any remaining `print()` statements
- [ ] Add `credentials: "include"` to frontend fetch calls for cookie-based refresh tokens
- [ ] Final checklist review:
  - [ ] All routes authenticated ✓
  - [ ] Admin routes role-protected ✓
  - [ ] No hardcoded user IDs ✓
  - [ ] No console.logs ✓
  - [ ] Tests passing ✓
  - [ ] Docker build works ✓
  - [ ] CI pipeline green ✓
- [ ] Update `PRODUCTION_READINESS.md` with final score

**Estimated time:** 4–5 hours

---

## Summary

| Day | Focus | Time |
|-----|-------|------|
| **Day 1** Tue | Kill mock security, wire real auth | 3–4h |
| **Day 2** Wed | Admin protection, env setup | 3–4h |
| **Day 3** Thu | Alembic + PostgreSQL | 4–5h |
| **Day 4** Fri | Dockerfile, docker-compose, deploy | 4–5h |
| **Day 5** Sat | Backend tests (pytest) | 5–6h |
| **Day 6** Sun | Code cleanup + CI pipeline | 3–4h |
| **Day 7** Mon | Rate limiting, logging, final review | 4–5h |
| | **Total** | **~28–33h** |

> **After this week:** Score goes from **~40%** → **~90%** production-ready. Remaining 10% is production monitoring (Sentry, uptime checks), email verification, and 2FA — these are nice-to-haves for V1.
