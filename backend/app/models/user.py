from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    # Optional fields
    full_name = Column(String, nullable=True)

    # Admin flag
    is_admin = Column(Boolean, default=False)

    # Activity tracking
    is_active = Column(Boolean, default=True)

    # Subscription type: "free" or "premium"
    subscription = Column(String, default="free")

    # Relationship
    progress = relationship("UserProgress", back_populates="user", uselist=False)
