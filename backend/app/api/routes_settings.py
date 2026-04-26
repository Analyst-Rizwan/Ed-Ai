# app/api/routes_settings.py
# GET / PUT per-user playground settings (synced from frontend).

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.playground_settings import PlaygroundSettings

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pydantic schemas ──────────────────────────────────────────────────────

class PlaygroundSettingsSchema(BaseModel):
    layout_mode: str = "stacked"
    editor_panel_size: int = Field(62, ge=20, le=80)
    output_panel_size: int = Field(38, ge=20, le=80)
    font_size: int = Field(14, ge=10, le=24)
    font_family: str = "JetBrains Mono"
    tab_size: int = Field(4, ge=2, le=8)
    show_minimap: bool = False
    show_line_numbers: bool = True
    word_wrap: str = "off"
    show_whitespace: str = "selection"
    last_language_id: int = 71

    class Config:
        from_attributes = True


class PlaygroundSettingsUpdate(BaseModel):
    layout_mode: Optional[str] = None
    editor_panel_size: Optional[int] = Field(None, ge=20, le=80)
    output_panel_size: Optional[int] = Field(None, ge=20, le=80)
    font_size: Optional[int] = Field(None, ge=10, le=24)
    font_family: Optional[str] = None
    tab_size: Optional[int] = Field(None, ge=2, le=8)
    show_minimap: Optional[bool] = None
    show_line_numbers: Optional[bool] = None
    word_wrap: Optional[str] = None
    show_whitespace: Optional[str] = None
    last_language_id: Optional[int] = None


# ─── Routes ────────────────────────────────────────────────────────────────

@router.get("/playground", response_model=PlaygroundSettingsSchema)
def get_playground_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's playground settings (creates defaults if none exist)."""
    settings = db.query(PlaygroundSettings).filter(
        PlaygroundSettings.user_id == current_user.id
    ).first()

    if not settings:
        # First visit — create with defaults
        settings = PlaygroundSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.put("/playground", response_model=PlaygroundSettingsSchema)
def update_playground_settings(
    body: PlaygroundSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the current user's playground settings (partial update)."""
    settings = db.query(PlaygroundSettings).filter(
        PlaygroundSettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = PlaygroundSettings(user_id=current_user.id)
        db.add(settings)

    # Apply only the fields that were explicitly sent
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)

    db.commit()
    db.refresh(settings)
    return settings
