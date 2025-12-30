from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base


class LeetCodeSync(Base):
    __tablename__ = "leetcode_syncs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    sync_status = Column(String, default="pending")  # pending, success, failed
    problems_synced = Column(Integer, default=0)

    sync_started_at = Column(DateTime, default=datetime.utcnow)
    sync_completed_at = Column(DateTime, nullable=True)

    error_message = Column(String, nullable=True)
    sync_data = Column(JSON, default=dict)

    user = relationship("User")
