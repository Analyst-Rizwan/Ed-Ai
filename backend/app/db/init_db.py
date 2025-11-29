from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine
from app.db.base import Base


def init_db() -> None:
    """
    Initializes the database schema.

    - For development: creates all tables automatically.
    - For production: tables should be created via Alembic migrations.
    """

    try:
        # Create tables if they don't exist (safe for dev)
        Base.metadata.create_all(bind=engine)
        print("✔ Database initialized successfully.")
    except SQLAlchemyError as e:
        print("❌ Database initialization failed:", str(e))
