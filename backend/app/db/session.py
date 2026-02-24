from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base_class import Base

DATABASE_URL = settings.DATABASE_URL

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Connection pool tuning for 2000+ concurrent users.
# pool_size=20 base + max_overflow=30 = 50 connections per worker.
# With 4 Gunicorn workers → up to 200 total DB connections.
# pool_recycle=1800 prevents stale connections (30-min recycle).
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
    **({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    } if not DATABASE_URL.startswith("sqlite") else {}),
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base moved to app.db.base_class


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
