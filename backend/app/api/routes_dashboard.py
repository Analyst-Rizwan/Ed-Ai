"""
Enhanced Dashboard summary — returns everything the frontend dashboard needs in one call.
Fixed to use correct Progress field names: solved (not completed), last_attempt (not updated_at).
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.progress import Progress, UserProgress

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _compute_streak(progress_records: list) -> int:
    """Compute current daily-solve streak from Progress records (uses last_attempt field)."""
    if not progress_records:
        return 0

    # Collect unique dates where user solved a problem
    solved_dates = sorted(
        {
            p.last_attempt.date()
            for p in progress_records
            if p.solved and p.last_attempt
        },
        reverse=True,
    )
    if not solved_dates:
        return 0

    today = datetime.now(timezone.utc).date()
    streak = 0
    expected = today

    for d in solved_dates:
        if d == expected or d == today:
            if streak == 0:
                streak = 1
            elif d == expected:
                streak += 1
            expected = d - timedelta(days=1)
        elif d == expected + timedelta(days=1):
            streak += 1
            expected = d - timedelta(days=1)
        elif d < expected:
            break

    return streak


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── Per-problem Progress records ─────────────────────────────────
    progress_records = (
        db.query(Progress)
        .filter(Progress.user_id == current_user.id)
        .all()
    )
    problems_solved = sum(1 for p in progress_records if p.solved)

    # ── Streak ───────────────────────────────────────────────────────
    streak = _compute_streak(progress_records)

    # ── Completed roadmaps (UserProgress JSON list) ──────────────────
    user_progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == current_user.id)
        .first()
    )
    completed_roadmaps = (
        user_progress.completed_roadmaps
        if user_progress and user_progress.completed_roadmaps
        else []
    )

    # ── Recent activity (last 5 solved problems with titles) ─────────
    solved_records = [p for p in progress_records if p.solved]
    solved_records.sort(key=lambda p: p.last_attempt or datetime.min, reverse=True)
    recent_solved = solved_records[:5]

    # Bulk-fetch the problem titles  
    problem_ids = [p.problem_id for p in recent_solved]
    problems_map: dict[int, str] = {}
    if problem_ids:
        probs = db.query(Problem.id, Problem.title).filter(Problem.id.in_(problem_ids)).all()
        problems_map = {row.id: row.title for row in probs}

    activity_list = []
    for prog in recent_solved:
        ts = prog.last_attempt
        if ts and ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        title = problems_map.get(prog.problem_id, f"Problem #{prog.problem_id}")
        activity_list.append(
            {
                "id": prog.id,
                "type": "problem_solved",
                "title": f"Solved {title}",
                "timestamp": ts.isoformat() if ts else None,
            }
        )

    return {
        "xp": current_user.xp or 0,
        "level": current_user.level or 1,
        "streak": streak,
        "problems_solved": problems_solved,
        "completed_roadmaps": len(completed_roadmaps),
        "recent_activity": activity_list,
    }
