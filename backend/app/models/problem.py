from sqlalchemy import Column, Integer, String, Text, Float, JSON
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)

    # Core fields
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Required by schemas + routes
    difficulty = Column(String, nullable=False)   # easy / medium / hard
    category = Column(String, nullable=True)

    # LeetCode integration
    leetcode_slug = Column(String, unique=True, index=True, nullable=True)

    # Metadata
    acceptance = Column(Float, default=0.0)
    likes = Column(Integer, default=0)

    # Content
    tags = Column(JSON, default=list)
    hints = Column(JSON, default=list)
    starter_code = Column(Text, nullable=True)
    test_cases = Column(JSON, default=list)

    # Relationships
    progress_records = relationship(
        "Progress",
        back_populates="problem",
        cascade="all, delete-orphan",
    )
