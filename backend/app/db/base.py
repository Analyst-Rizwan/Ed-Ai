"""
Backward-compatible re-exports from app.db.session.

New code should import directly from app.db.session.
This file exists so old imports don't break.
"""

import logging
from app.db.session import engine, SessionLocal, get_db, Base  # noqa: F401

logger = logging.getLogger(__name__)


def init_db():
    """Create all tables (only used for development bootstrapping)."""
    import app.models  # noqa: F401 — registers all models with Base.metadata
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully")
