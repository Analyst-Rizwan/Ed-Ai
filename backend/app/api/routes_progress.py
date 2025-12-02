from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.user import User
from app.models.progress import UserProgress
from app.models.roadmap import Roadmap
from app.models.problem import Problem

router = APIRouter()


# ============================================================
#  ADMIN DASHBOARD STATS (Used by Admin.tsx)
# ============================================================

@router.get("/admin-stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """Return system-wide analytics for Admin Dashboard."""

    total_users = db.query(User).count()
    active_users = (
        db.query(User).filter(User.is_active == True).count()
        if hasattr(User, "is_active")
        else 0
    )

    total_roadmaps = db.query(Roadmap).count()
    total_problems = db.query(Problem).count()

    # Subscription breakdown (fallback-safe)
    def count_sub(type_value):
        if hasattr(User, "subscription"):
            return db.query(User).filter(User.subscription == type_value).count()
        return 0

    subscriptions = {
        "free": count_sub("free"),
        "premium": count_sub("premium"),
    }

    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalRoadmaps": total_roadmaps,
        "totalProblems": total_problems,
        "subscriptions": subscriptions,
    }


# ============================================================
#  USER PROGRESS APIs
# ============================================================

@router.get("/user/{user_id}")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get full learning progress for a user."""
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id)
        .first()
    )

    if not progress:
        return {"message": "No progress found", "progress": {}}

    return progress.to_dict()


@router.post("/user/{user_id}/roadmap/{roadmap_id}/complete")
def complete_roadmap(user_id: int, roadmap_id: int, db: Session = Depends(get_db)):
    """Mark a roadmap as completed for a user."""
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    progress = (
        db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    )

    if not progress:
        progress = UserProgress(user_id=user_id, completed_roadmaps=[])
        db.add(progress)

    if roadmap_id not in progress.completed_roadmaps:
        progress.completed_roadmaps.append(roadmap_id)

    db.commit()
    db.refresh(progress)

    return {"message": "Roadmap marked completed", "progress": progress.to_dict()}


@router.post("/user/{user_id}/problem/{problem_id}/complete")
def complete_problem(user_id: int, problem_id: int, db: Session = Depends(get_db)):
    """Mark a coding problem as completed."""
    problem = db.query(Problem).filter(Problem.id == problem_id).first()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    progress = (
        db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    )

    if not progress:
        progress = UserProgress(user_id=user_id, completed_problems=[])
        db.add(progress)

    if problem_id not in progress.completed_problems:
        progress.completed_problems.append(problem_id)

    db.commit()
    db.refresh(progress)

    return {"message": "Problem marked completed", "progress": progress.to_dict()}


# ============================================================
#  RESET USER PROGRESS (Admin)
# ============================================================

@router.post("/user/{user_id}/reset")
def reset_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Reset all progress for a user (Admin privilege)."""
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id)
        .first()
    )

    if not progress:
        return {"message": "User has no progress to reset"}

    progress.completed_roadmaps = []
    progress.completed_problems = []

    db.commit()
    return {"message": "Progress reset successfully"}
