# app/core/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "EduAI Backend"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eduai.db")

    # AI Provider Selection
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")  # openai or gemini

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # System Prompt
    AI_SYSTEM_PROMPT: str = os.getenv(
        "AI_SYSTEM_PROMPT",
        "You are EduAI, a friendly, adaptive AI mentor who simplifies complex topics.",
    )

    # ✅ pydantic-settings v2 style config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # <-- this fixes the extra_forbidden errors
    )


settings = Settings()
