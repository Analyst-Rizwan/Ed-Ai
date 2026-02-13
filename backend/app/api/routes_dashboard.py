from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.progress import Progress, UserProgress
from app.models.roadmap import Roadmap

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_problems = db.query(Problem).count()

    solved = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.completed == True
    ).count()

    # Fixing the roadmap count query to use UserProgress
    user_progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    roadmap_count = len(user_progress.completed_roadmaps) if user_progress and user_progress.completed_roadmaps else 0

    recent_activity = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).order_by(Progress.updated_at.desc()).limit(5).all()

    activity_list = [
        {
            "problem_id": act.problem_id,
            "completed": act.completed,
            "updated_at": act.updated_at
        }
        for act in recent_activity
    ]

    return {
        "total_problems": total_problems,
        "solved": solved,
        "roadmaps": roadmap_count,
        "recent_activity": activity_list,
        "xp": current_user.xp,
        "level": current_user.level
    }
