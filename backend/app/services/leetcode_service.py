import httpx
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.leetcode_sync import LeetCodeSync
from app.models.problem import Problem
from app.models.progress import Progress

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

PROFILE_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    profile {
      ranking
      reputation
    }
  }
}
"""

RECENT_SOLVED_QUERY = """
query recentAcSubmissions($username: String!) {
  recentAcSubmissionList(username: $username, limit: 2000) {
    titleSlug
  }
}
"""


async def sync_leetcode(db: Session, user_id: int, username: str):
    sync = LeetCodeSync(
        user_id=user_id,
        sync_status="pending",
        sync_started_at=datetime.utcnow(),
    )
    db.add(sync)
    db.commit()
    db.refresh(sync)

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            profile_res = await client.post(
                LEETCODE_GRAPHQL,
                json={"query": PROFILE_QUERY, "variables": {"username": username}},
            )
            solved_res = await client.post(
                LEETCODE_GRAPHQL,
                json={"query": RECENT_SOLVED_QUERY, "variables": {"username": username}},
            )

        profile_data = profile_res.json()["data"]["matchedUser"]
        solved_list = solved_res.json()["data"]["recentAcSubmissionList"]

        solved_slugs = {item["titleSlug"] for item in solved_list}

        # Store raw data for debugging / future re-sync
        sync.sync_data = {
            "username": username,
            "recent_solved_count": len(solved_slugs),
            "profile": profile_data,
        }

        problems = (
            db.query(Problem)
            .filter(Problem.leetcode_slug.in_(solved_slugs))
            .all()
        )

        solved_count = 0
        for problem in problems:
            progress = (
                db.query(Progress)
                .filter(
                    Progress.user_id == user_id,
                    Progress.problem_id == problem.id,
                )
                .first()
            )

            if not progress:
                progress = Progress(
                    user_id=user_id,
                    problem_id=problem.id,
                    solved=True,
                    attempted=True,
                )
                db.add(progress)
            else:
                progress.solved = True
                progress.attempted = True

            solved_count += 1

        sync.sync_status = "success"
        sync.problems_synced = solved_count
        sync.sync_completed_at = datetime.utcnow()

        db.commit()

        return {
            "status": "success",
            "problems_synced": solved_count,
            "synced_at": sync.sync_completed_at,
        }

    except Exception as e:
        sync.sync_status = "failed"
        sync.error_message = str(e)
        db.commit()
        raise
