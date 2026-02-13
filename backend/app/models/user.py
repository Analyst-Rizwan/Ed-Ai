from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    # ============================================================
    # CORE FIELDS
    # ============================================================
    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String, default="user")  # Added for RBAC

    created_at = Column(DateTime, default=datetime.utcnow)

    # ============================================================
    # GAMIFICATION
    # ============================================================
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)

    # ============================================================
    # PROFILE FIELDS
    # ============================================================
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    location = Column(String, nullable=True)

    # ============================================================
    # RELATIONSHIPS
    # ============================================================

    # Per-problem progress (used by Practice page & LeetCode sync)
    progress_records = relationship(
        "Progress",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Aggregated progress (roadmaps, completed problem IDs, etc.)
    progress = relationship(
        "UserProgress",
        uselist=False,
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Optional: LeetCode sync history
    leetcode_syncs = relationship(
        "LeetCodeSync",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # ============================================================
    # HELPERS
    # ============================================================
    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username}>"
