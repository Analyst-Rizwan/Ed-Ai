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

    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

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
