from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql.sqltypes import JSON

from app.db.base_class import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Store completed IDs in an array/JSON list
    completed_roadmaps = Column(JSON, default=[])
    completed_problems = Column(JSON, default=[])

    user = relationship("User", back_populates="progress")

    def to_dict(self):
        return {
            "completed_roadmaps": self.completed_roadmaps or [],
            "completed_problems": self.completed_problems or [],
        }
