from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.progress import Progress
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


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "bio": current_user.bio,
        "avatar_url": current_user.avatar_url,
        "github_url": current_user.github_url,
        "linkedin_url": current_user.linkedin_url,
        "website_url": current_user.website_url,
        "location": current_user.location,
        "xp": current_user.xp,
        "level": current_user.level,
        "created_at": current_user.created_at
    }


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


@router.get("/stats")
def get_profile_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_problems = db.query(Problem).count()

    solved = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.completed == True
    ).count()

    percentage = (solved / total_problems * 100) if total_problems > 0 else 0

    return {
        "total_problems": total_problems,
        "solved": solved,
        "completion_percentage": round(percentage, 2)
    }
