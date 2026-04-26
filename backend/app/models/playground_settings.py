# app/models/playground_settings.py
# Stores per-user playground layout & editor preferences (synced from frontend).

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.base_class import Base


class PlaygroundSettings(Base):
    __tablename__ = "playground_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # ── Layout ──────────────────────────────────────────────────
    layout_mode = Column(String, default="stacked")        # stacked | side-by-side | editor-only
    editor_panel_size = Column(Integer, default=62)         # percentage 20–80
    output_panel_size = Column(Integer, default=38)         # percentage 20–80

    # ── Editor ──────────────────────────────────────────────────
    font_size = Column(Integer, default=14)                 # 10–24
    font_family = Column(String, default="JetBrains Mono")
    tab_size = Column(Integer, default=4)                   # 2 or 4
    show_minimap = Column(Boolean, default=False)
    show_line_numbers = Column(Boolean, default=True)
    word_wrap = Column(String, default="off")               # off | on
    show_whitespace = Column(String, default="selection")   # none | selection | all

    # ── Misc ────────────────────────────────────────────────────
    last_language_id = Column(Integer, default=71)           # Judge0 language ID (default: Python)

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
