import sys
from pathlib import Path

# ✅ Ensure backend root is on PYTHONPATH
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

import asyncio
import httpx
from sqlalchemy.orm import Session

from app.db.session import SessionLocal

# Import all models to ensure SQLAlchemy relationships are configured
# This must happen before using any models to avoid relationship errors
import glob
import importlib
from pathlib import Path

# Dynamically import all model files
models_dir = BASE_DIR / "app" / "models"
if models_dir.exists():
    for model_file in models_dir.glob("*.py"):
        if model_file.name != "__init__.py":
            module_name = f"app.models.{model_file.stem}"
            try:
                importlib.import_module(module_name)
            except Exception as e:
                print(f"Warning: Could not import {module_name}: {e}")

# Now import Problem for use
from app.models.problem import Problem


LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://leetcode.com/problemset/all/",
    "Content-Type": "application/json",
}

# ✅ Updated query with correct field names
QUERY = """
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      acRate
      difficulty
      frontendQuestionId: questionFrontendId
      paidOnly: isPaidOnly
      title
      titleSlug
      topicTags {
        name
        id
        slug
      }
    }
  }
}
"""


async def fetch_all_problems():
    problems = []
    skip = 0
    limit = 100

    async with httpx.AsyncClient(headers=HEADERS, timeout=30) as client:
        while True:
            res = await client.post(
                LEETCODE_GRAPHQL,
                json={
                    "query": QUERY,
                    "variables": {
                        "categorySlug": "",
                        "skip": skip,
                        "limit": limit,
                        "filters": {}
                    },
                },
            )

            if res.status_code != 200:
                raise RuntimeError(
                    f"LeetCode returned HTTP {res.status_code}: {res.text[:200]}"
                )

            payload = res.json()

            if "data" not in payload or not payload["data"]:
                raise RuntimeError(f"Unexpected response: {payload}")

            data = payload["data"]["problemsetQuestionList"]
            batch = data["questions"]

            if not batch:
                break

            problems.extend(batch)
            skip += limit

            print(f"Fetched {len(problems)} / {data['total']} problems")

            # Avoid hitting rate limits
            await asyncio.sleep(0.5)

    return problems


def upsert_problems(db: Session, problems: list[dict]):
    inserted = 0
    updated = 0

    for p in problems:
        slug = p["titleSlug"]

        existing = (
            db.query(Problem)
            .filter(Problem.leetcode_slug == slug)
            .first()
        )

        payload = {
            "title": p["title"],
            "description": p["title"],  # placeholder
            "difficulty": p["difficulty"],
            "leetcode_slug": slug,
            "acceptance": p.get("acRate"),
            "likes": None,  # likes field not available in this endpoint
            "tags": [t["name"] for t in p.get("topicTags", [])],
        }

        if existing:
            for k, v in payload.items():
                setattr(existing, k, v)
            updated += 1
        else:
            db.add(Problem(**payload))
            inserted += 1

    db.commit()
    print(f"Inserted: {inserted}, Updated: {updated}")


async def main():
    problems = await fetch_all_problems()

    db = SessionLocal()
    try:
        upsert_problems(db, problems)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())