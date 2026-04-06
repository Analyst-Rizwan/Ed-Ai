# app/core/config.py

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # === App meta ===
    APP_NAME: str = "EduAi"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))

    # === Database ===
    # REQUIRED: Must be set in .env — no SQLite fallback.
    # Local dev should use the same Supabase PostgreSQL as production.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # === Security ===
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")  # Was 43200 (30 days!) — now 30 min
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )
    # === Cookie domain ===
    # Auto-derived: production → ".eduaiajk.in" so cookies work across Vercel↔Render
    # Override via COOKIE_DOMAIN env var if using a different domain
    COOKIE_DOMAIN: str | None = os.getenv(
        "COOKIE_DOMAIN",
        ".eduaiajk.in" if os.getenv("APP_ENV") == "production" else None
    )

    # === AI provider selection ===
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # "gemini" or "openai"

    # === OpenAI ===
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    # Higher model for STAR polish and salary negotiation
    INTERVIEW_OPENAI_MODEL: str = os.getenv("INTERVIEW_OPENAI_MODEL", "gpt-4o")
    # GPT-4o for the Mock Interview tab (highest available model)
    MOCK_INTERVIEW_OPENAI_MODEL: str = os.getenv("MOCK_INTERVIEW_OPENAI_MODEL", "gpt-4o")

    # === Gemini ===
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    # Higher Gemini model for STAR polish and salary negotiation
    INTERVIEW_GEMINI_MODEL: str = os.getenv("INTERVIEW_GEMINI_MODEL", "gemini-2.5-pro")
    # Gemini counterpart for Mock Interview (if using Gemini provider)
    MOCK_INTERVIEW_GEMINI_MODEL: str = os.getenv("MOCK_INTERVIEW_GEMINI_MODEL", "gemini-2.5-pro")

    # === System prompt ===
    AI_SYSTEM_PROMPT: str = os.getenv(
        "AI_SYSTEM_PROMPT",
        "You are EduAi, a friendly, adaptive AI mentor who simplifies complex topics.",
    )

    # === CORS origins (comma-separated) ===
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:8080,http://127.0.0.1:8080",
    )

    # === Server runtime hints (from your .env) ===
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    WORKERS: int = int(os.getenv("WORKERS", "4"))

    # === SMTP (for OTP emails) ===
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "")

    # === Debug / logging ===
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"  # Was True — now defaults off
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # === GitHub OAuth ===
    GITHUB_CLIENT_ID: str | None = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: str | None = os.getenv("GITHUB_CLIENT_SECRET")

    # === Judge0 (Code Execution) ===
    JUDGE0_API_KEY: str | None = os.getenv("JUDGE0_API_KEY")
    # Default to free public Judge0 CE instance (no API key needed)
    JUDGE0_API_HOST: str = os.getenv("JUDGE0_API_HOST", "ce.judge0.com")

    # === Supabase Storage ===
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "avatars")

    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # <-- ignore unexpected env vars instead of crashing
    )


settings = Settings()
