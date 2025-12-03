# app/core/config.py

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # === App meta ===
    APP_NAME: str = "EduAi"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))

    # === Database ===
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eduai.db")

    # === Security ===
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # === AI provider selection ===
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # "gemini" or "openai"

    # === OpenAI ===
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # === Gemini ===
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

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

    # === Debug / logging ===
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # <-- ignore unexpected env vars instead of crashing
    )


settings = Settings()
