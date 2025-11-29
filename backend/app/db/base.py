from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base_class import Base


DATABASE_URL = settings.DATABASE_URL  # must be in .env

engine = create_engine(DATABASE_URL, echo=False, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    from app.models.user import User
    from app.models.progress import UserProgress
    from app.models.roadmap import Roadmap
    from app.models.problem import Problem

    Base.metadata.create_all(bind=engine)
    print("✔ Database initialized successfully.")
