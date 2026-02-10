from sqlalchemy.exc import SQLAlchemyError

from app.db.session import engine, Base

# ⚠️ IMPORTANT: import all models so SQLAlchemy registers them
from app.models.user import User  # noqa: F401
from app.models.progress import UserProgress, Progress  # noqa: F401
from app.models.roadmap import Roadmap  # noqa: F401
from app.models.problem import Problem  # noqa: F401
from app.models.leetcode_sync import LeetCodeSync  # noqa: F401
from app.db.models_tutor import Conversation, TutorMessage, Roadmap as TutorRoadmap  # noqa: F401


def init_db() -> None:
    """
    Initializes the database schema.
    """
    try:
        print("🔍 Initializing database tables...")
        # Get all table names registered with Base.metadata
        registered_tables = list(Base.metadata.tables.keys())
        print(f"📋 Registered models for table creation: {registered_tables}")
        
        Base.metadata.create_all(bind=engine)
        print("✔ Database initialized successfully.")
    except SQLAlchemyError as e:
        print(f"❌ Database initialization failed: {e}")
        raise
