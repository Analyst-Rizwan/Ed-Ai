from sqlalchemy import Column, Integer, String, Text

from app.db.base_class import Base


class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    difficulty = Column(String, default="easy")  # easy/medium/hard
    description = Column(Text)
    example_input = Column(Text)
    example_output = Column(Text)
