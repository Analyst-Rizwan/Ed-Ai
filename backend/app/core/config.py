# app/core/config.py
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # === App Info ===
    APP_NAME: str = os.getenv("APP_NAME", "EduAi")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_PORT: int = int(os.getenv("APP_PORT", 8000))

    # === Database ===
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eduai.db")

    # === Security ===
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

    # === OpenAI / AI Config ===
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    AI_SYSTEM_PROMPT: str = os.getenv(
        "AI_SYSTEM_PROMPT",
        "You are EduAi, a friendly, adaptive AI mentor who simplifies complex topics."
    )

    # === CORS ===
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

    # === Debug & Logging ===
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # === Deployment ===
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    WORKERS: int = int(os.getenv("WORKERS", 4))

settings = Settings()
