from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine, Base

# ⚠️ IMPORTANT: import all models so SQLAlchemy registers them
import app.models  # noqa: F401


def init_db() -> None:
    """
    Initializes the database schema.

    - Development: auto-create tables
    - Production (Supabase): first-time bootstrap only
    """

    try:
        Base.metadata.create_all(bind=engine)
        print("✔ Database initialized successfully.")
    except SQLAlchemyError as e:
        print("❌ Database initialization failed:", str(e))
        raise
