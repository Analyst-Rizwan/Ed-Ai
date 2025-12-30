from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import JSON
from datetime import datetime

from app.db.base_class import Base


# ============================================================
# AGGREGATED USER PROGRESS (ROADMAPS / LISTS)
# ============================================================
class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Store completed IDs in JSON lists
    completed_roadmaps = Column(JSON, default=list)
    completed_problems = Column(JSON, default=list)

    user = relationship("User", back_populates="progress")

    def to_dict(self):
        return {
            "completed_roadmaps": self.completed_roadmaps or [],
            "completed_problems": self.completed_problems or [],
        }


# ============================================================
# PER-PROBLEM PROGRESS (USED BY PRACTICE + LEETCODE)
# ============================================================
class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    problem_id = Column(
        Integer,
        ForeignKey("problems.id"),
        nullable=False,
        index=True,
    )

    solved = Column(Boolean, default=False)
    attempted = Column(Boolean, default=False)
    last_attempt = Column(DateTime, default=datetime.utcnow)

    solution_code = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    time_spent = Column(Integer, default=0)  # seconds

    # Relationships
    user = relationship("User", back_populates="progress_records")
    problem = relationship("Problem", back_populates="progress_records")
