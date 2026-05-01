"""Profile routes — user profile CRUD + avatar upload via Supabase Storage."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.progress import Progress
from app.services import supabase_storage
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/profile", tags=["Profile"])


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None
    location: Optional[str] = None


def _user_dict(user: User) -> dict:
    """Standard user response dict."""
    return {
        "id": user.id,
        "email": user.email,
        "username": getattr(user, "username", user.email),
        "full_name": user.full_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "github_url": user.github_url,
        "linkedin_url": user.linkedin_url,
        "website_url": user.website_url,
        "location": user.location,
        "xp": user.xp,
        "level": user.level,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "role": getattr(user, "role", "user"),
        "created_at": str(user.created_at) if user.created_at else None,
    }


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.put("/update")
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name

    if data.bio is not None:
        current_user.bio = data.bio

    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    
    if data.github_url is not None:
        current_user.github_url = data.github_url
        
    if data.linkedin_url is not None:
        current_user.linkedin_url = data.linkedin_url

    if data.website_url is not None:
        current_user.website_url = data.website_url

    if data.location is not None:
        current_user.location = data.location

    db.commit()
    db.refresh(current_user)

    return {"message": "Profile updated successfully"}


# ============================================================
# AVATAR UPLOAD / DELETE (Supabase Storage)
# ============================================================

EXTENSION_MAP = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a profile picture to Supabase Storage."""
    if not supabase_storage.is_configured():
        raise HTTPException(status_code=503, detail="Avatar upload is not available (storage not configured)")

    content_type = file.content_type or ""
    if content_type not in EXTENSION_MAP:
        raise HTTPException(status_code=400, detail="Invalid file type. Use JPEG, PNG, WebP, or GIF.")

    file_bytes = await file.read()
    if len(file_bytes) > supabase_storage.MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB.")

    extension = EXTENSION_MAP[content_type]

    try:
        # Delete old avatar if it's a Supabase URL
        if current_user.avatar_url:
            await supabase_storage.delete_avatar(current_user.avatar_url)

        # Upload new avatar
        public_url = await supabase_storage.upload_avatar(
            user_id=current_user.id,
            file_bytes=file_bytes,
            content_type=content_type,
            extension=extension,
        )

        # Update user record
        current_user.avatar_url = public_url
        db.commit()
        db.refresh(current_user)

        return _user_dict(current_user)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/avatar")
async def delete_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove the user's profile picture."""
    if current_user.avatar_url:
        await supabase_storage.delete_avatar(current_user.avatar_url)

    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)

    return _user_dict(current_user)


# ============================================================
# PROFILE STATS
# ============================================================

@router.get("/stats")
def get_profile_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_problems = db.query(Problem).count()

    solved = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.solved == True
    ).count()

    percentage = (solved / total_problems * 100) if total_problems > 0 else 0

    return {
        "total_problems": total_problems,
        "solved": solved,
        "completion_percentage": round(percentage, 2)
    }
