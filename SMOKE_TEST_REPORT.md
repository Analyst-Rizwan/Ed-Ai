# EduAI Smoke Test Report
**Date:** 2026-03-11 | **Tester:** Automated browser agent + pytest  
**Branch:** `main` | **Backend:** FastAPI + Supabase PostgreSQL | **Frontend:** React + Vite

---

## ✅ Backend Tests
**32/32 passed** — 14.74s  
No failing tests. 4 deprecation warnings (Pydantic V1 style APIs, non-blocking).

---

## Page-by-Page Status

| Page | URL | Status | Notes |
|------|-----|--------|-------|
| Login | `/login` | ⚠️ | Smoke test account `smoketest1@example.com` login failing with 400 `Incorrect email or password` |
| Dashboard | `/` | ✅ | Loads correctly. Shows Level 1, XP 0, streak counter visible |
| Roadmaps | `/roadmaps` | ✅ | Python Beginner, Machine Learning roadmaps displayed |
| Practice | `/practice` | ✅ | Problem list loads (Two Sum, Add Two Numbers, etc.) |
| Opportunities | `/opportunities` | ⚠️ | Shows 0 results on first load. Requires clicking "Refresh Feed" to get 125 results |
| Portfolio Builder | `/portfolio` | ✅ | Loads Identity tab, editable fields visible |
| Profile | `/profile` | ✅ | Email, level, and recent activity show correctly |
| AI Tutor (drawer) | sidebar | ✅ | Opens, streaming works — text appears word-by-word via SSE |

---

## Issues Found

### 🔴 P1 — Critical

*(None found this run)*

---

### 🟠 P2 — High

**#1 — Smoke test account broken**  
- **Where:** `/login`  
- **What:** `smoketest1@example.com` / `password` returns `400 Incorrect email or password`. The test account may have been deleted or its password changed in the DB.  
- **Impact:** Cannot run automated login smoke tests without creating a new account each time.

---

### 🟡 P3 — Medium

**#2 — Opportunities page shows "0 results" on initial load**  
- **Where:** `/opportunities`  
- **What:** The page renders but job list is empty. Only populated after manually clicking "Refresh Feed".  
- **Impact:** Users land on a blank jobs page with no explanation. Feels broken on first visit.  
- **Expected:** Show cached jobs (or at least a hint to click Refresh) on arrival.

**#3 — Practice "Solve" button redirects to LeetCode (new tab)**  
- **Where:** `/practice` → clicking "Solve" on a problem  
- **What:** Opens `https://leetcode.com/...` in a new browser tab instead of an in-app code editor or problem view.  
- **Impact:** Users are taken out of the app. The in-app code editor (if it exists) is not being used.

**#4 — `/dashboard` route returns 404 console error**  
- **Where:** Browser console on navigation  
- **What:** `404 Error: User attempted to access non-exist route: /dashboard`. The root path is `/` not `/dashboard`, but something in the app tries to navigate to `/dashboard`.  
- **Impact:** Non-breaking (redirects work) but noisy in the console and may confuse monitoring.

---

### 🔵 P4 — Low / Info

**#5 — Pydantic V1 deprecation warnings in backend tests**  
- **Where:** `app/schemas/leetcode.py:10`, `app/schemas/user.py:74`, `app/auth/routes.py:211`  
- **What:** Using deprecated `@validator`, class-based `config`, `.dict()` instead of Pydantic V2 equivalents.  
- **Impact:** Non-breaking now. Will break when Pydantic V3 is released.  
- **Files:**
  - `backend/app/schemas/leetcode.py` — `@validator('username')` → `@field_validator`
  - `backend/app/schemas/user.py` — `class Config` → `model_config = ConfigDict(...)`
  - `backend/app/auth/routes.py:211` — `.dict()` → `.model_dump()`

**#6 — Initial page load spinner (several seconds)**  
- **Where:** `/practice`, `/portfolio`, `/profile`  
- **What:** Pages show a loading spinner for 2-4 seconds before content renders.  
- **Impact:** Feels slow on first navigation. Likely API call latency to Supabase.

**#7 — New user gets XP = 0 and empty activity feed on Dashboard**  
- **Where:** `/`  
- **What:** Fresh accounts show completely empty dashboard with no onboarding or call-to-action.  
- **Impact:** UX — new users don't know what to do next.

---

## What's Working Well ✅

- **AI Tutor streaming** — full SSE streaming confirmed. Text appears token-by-token.
- **Auth system** — register, login token flow working for new accounts.
- **Practice problems** — list rendering with correct data from Supabase.
- **Roadmaps** — Python, Machine Learning cards visible and interactive.
- **Portfolio Builder** — multi-tab form loads without errors.
- **Profile page** — user data correctly surfaced.
- **All 32 backend tests pass** — auth, problems, progress, security suites all green.

---

## Test Recording

![Smoke test recording — all pages navigated, AI Tutor streaming demonstrated](C:/Users/rizwa/.gemini/antigravity/brain/906eb3ed-bea3-4de1-9163-b9f65559060f/smoke_test_all_pages_1773236835399.webp)

![Final state — AI Tutor open with streaming response visible](C:/Users/rizwa/.gemini/antigravity/brain/906eb3ed-bea3-4de1-9163-b9f65559060f/final_smoke_test_state_1773237460518.png)
