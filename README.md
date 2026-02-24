# Ed-AI: Intelligent Programming Tutor

Ed-AI is an adaptive learning platform that provides personalized programming roadmaps, interactive coding practice, and AI-powered tutoring using Google Gemini.

## 🚀 Tech Stack

- **Frontend**: React (Vite), TypeScript, TailwindCSS, ShadCN UI
- **Backend**: FastAPI (Python 3.12), SQLAlchemy, Pydantic V2
- **Database**: PostgreSQL (Production), SQLite (Development/Test)
- **AI**: Google Gemini 2.5 Flash / OpenAI GPT-4o-mini
- **Infrastructure**: Docker, Gunicorn, GitHub Actions

## 📦 Prerequisites

- **Docker & Docker Compose** (Recommended)
- **Node.js** v18+ (for manual frontend)
- **Python** 3.12+ (for manual backend)

---

## ⚡ Quick Start (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Ed-AI
   ```

2. **Create environment variables**:
   Create a `.env` file in `backend/` (see `backend/.env.example` if available, or use defaults):
   ```ini
   # backend/.env
   DATABASE_URL=postgresql://eduai:eduai_secret@db:5432/eduai
   SECRET_KEY=your-super-secret-key
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   # Optional: OPENAI_API_KEY=...
   ```

3. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
   
   - **Frontend**: http://localhost:8000
   - **Backend API**: http://localhost:8000/api
   - **API Docs**: http://localhost:8000/docs

---

## 🛠 Manual Development Setup

If you prefer running services individually without Docker:

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt

# Run migrations (uses SQLite by default if DATABASE_URL not set)
alembic upgrade head

# Start server (Uses uvicorn for dev)
uvicorn app.main:app --reload
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

Run backend tests with `pytest`:

```bash
cd backend
# With venv activated
pytest -v
```

This uses an in-memory SQLite database and disables rate limiting for tests.

---

## 🔒 Production Hardening

This application is configured for production scale (2,000+ concurrent users):

- **Gunicorn**: Runs with 4 workers.
- **Connection Pooling**: Optimized SQLAlchemy pool size (50/worker).
- **Rate Limiting**: AI endpoints (10/min), Auth (5/min).
- **Security Headers**: HSTS, XSS protection, anti-clickjacking.
- **Caching**: In-memory TTL cache for read-heavy data.

## 🚀 Deployment

### Render (Automated)
This repo includes a `render.yaml` blueprint. Connect it to Render.com to auto-deploy the backend (Python) and frontend (Static Site) with a managed PostgreSQL database.

### Docker
The `Dockerfile` is multi-stage:
1. Builds the React frontend.
2. Serves it via FastAPI static files.
3. Runs Gunicorn with Uvicorn workers.

```bash
docker build -t ed-ai .
docker run -p 8000:8000 --env-file backend/.env ed-ai
```
