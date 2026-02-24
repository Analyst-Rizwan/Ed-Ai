# Deployment Guide

This guide covers two methods to deploy Ed-AI to production:
1. **Render.com** (Recommended, Easiest)
2. **Docker on VPS** (DigitalOcean, Hetzner, AWS)

---

## Option 1: Render.com (Automated)

We have a `render.yaml` blueprint that automates everything.

### Steps:
1. **Push your code** to a GitHub repository.
2. Log in to [Render.com](https://render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will detect `render.yaml` and ask you to approve the resources:
   - `eduai-backend` (Web Service)
   - `eduai-db` (PostgreSQL Database)
6. **Environment Variables**:
   You will be prompted to enter the following. Most are auto-filled, but you MUST provide:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `SECRET_KEY`: A long random string (Render might auto-generate this, if not, generate one).
   - `AI_PROVIDER`: Set to `gemini` (default) or `openai`.

7. Click **Apply**. Render will:
   - Provision the database.
   - Build the React frontend.
   - Build the Python backend.
   - Run database migrations (`alembic upgrade head`).
   - Start the server with Gunicorn (4 workers).

### Verification
Once deployed, Render gives you a URL (e.g., `https://eduai-backend.onrender.com`).
- Visit the URL to see the app.
- Check Logs in the Render dashboard to see server output.

---

## Option 2: Docker on VPS (Manual)

For DigitalOcean App Platform, Hetzner, or EC2.

### Prerequisites
- A server with **Docker** and **Docker Compose** installed.
- Access to your codebase (via git clone).

### Steps:

1. **Clone the repo** on your server:
   ```bash
   git clone <your-repo-url>
   cd Ed-AI
   ```

2. **Configure Environment**:
   Create `backend/.env` with production values:
   ```bash
   nano backend/.env
   ```
   
   **Required Content:**
   ```ini
   APP_ENV=production
   DATABASE_URL=postgresql://eduai:eduai_secret@db:5432/eduai
   SECRET_KEY=<generate-a-secure-random-key>
   AI_PROVIDER=gemini
   GEMINI_API_KEY=<your-gemini-key>
   ```

3. **Production Build & Run**:
   ```bash
   docker-compose -f docker-compose.yml up --build -d
   ```
   `-d` runs it in the background (detached mode).

4. **setup Nginx (Optional but Recommended)**:
   If using a VPS, run Nginx as a reverse proxy to handle SSL (Let's Encrypt) and forward port 80/443 to port 8000.

---

## 🔒 Production Checklist

- [x] **Database**: Use PostgreSQL (Render handles this).
- [x] **Secret Key**: Ensure `SECRET_KEY` is long and random.
- [x] **Debug Mode**: Ensure `DEBUG=False` (set in `render.yaml` / Dockerfile).
- [x] **Workers**: Gunicorn is configured for 4 workers.
- [x] **HTTPS**: Render provides managed HTTPS automatically.
