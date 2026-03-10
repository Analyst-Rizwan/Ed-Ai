"""
Single source of truth for database engine, session, and dependency injection.

All routes should import `get_db` from this module:
    from app.db.session import get_db
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base_class import Base  # noqa: F401 – re-exported for Alembic

DATABASE_URL = settings.DATABASE_URL

# Connection pool tuning for 2000+ concurrent users.
# pool_size=20 base + max_overflow=30 = 50 connections per worker.
# With 4 Gunicorn workers → up to 200 total DB connections.
# pool_recycle=1800 prevents stale connections (30-min recycle).
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """FastAPI dependency that yields a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
