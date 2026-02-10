"""
Direct PostgreSQL import bypassing Supabase REST API.
Uses SQLAlchemy with direct connection to avoid RLS issues.
"""

import asyncio
import httpx
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

# =========================
# DATABASE CONFIG
# =========================

# Supabase pooler connection (6543)
DATABASE_URL = (
    "postgresql://postgres.hcidjkbsrkygdimdfura:"
    "HgqV62%24cH%2B%2Bz%3FwG"
    "@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# =========================
# LEETCODE CONFIG
# =========================

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://leetcode.com/problemset/all/",
    "Content-Type": "application/json",
}

QUERY = """
query problemsetQuestionList(
  $categorySlug: String,
  $limit: Int,
  $skip: Int,
  $filters: QuestionListFilterInput
) {
  problemsetQuestionList: questionList(
    categorySlug: $categorySlug
    limit: $limit
    skip: $skip
    filters: $filters
  ) {
    total: totalNum
    questions: data {
      title
      titleSlug
      difficulty
      acRate
      isPaidOnly
      topicTags {
        name
        slug
      }
    }
  }
}
"""

# =========================
# HELPERS
# =========================

def normalize_difficulty(d: str | None) -> str | None:
    """
    Normalize LeetCode difficulty to DB-accepted values.
    DB constraint allows: easy | medium | hard
    """
    return d.lower() if d else None


# =========================
# FETCH LEETCODE DATA
# =========================

async def fetch_all_problems() -> list[dict]:
    problems: list[dict] = []
    skip = 0
    limit = 100

    async with httpx.AsyncClient(
        headers=HEADERS,
        timeout=30,
    ) as client:
        while True:
            res = await client.post(
                LEETCODE_GRAPHQL,
                json={
                    "query": QUERY,
                    "variables": {
                        "categorySlug": "",
                        "skip": skip,
                        "limit": limit,
                        "filters": {},
                    },
                },
            )

            if res.status_code != 200:
                raise RuntimeError(
                    f"LeetCode returned HTTP {res.status_code}"
                )

            payload = res.json()
            data = payload["data"]["problemsetQuestionList"]
            batch = data["questions"]

            if not batch:
                break

            problems.extend(batch)
            skip += limit

            print(
                f"Fetched {len(problems)} / {data['total']} problems"
            )

            await asyncio.sleep(0.3)

    return problems


# =========================
# INSERT / UPDATE
# =========================

def batch_insert_postgres(problems: list[dict]) -> None:
    session = SessionLocal()

    try:
        # Fetch existing slugs once
        result = session.execute(
            text(
                """
                SELECT leetcode_slug
                FROM problems
                WHERE leetcode_slug IS NOT NULL
                """
            )
        )
        existing_slugs = {row[0] for row in result}
        print(f"Found {len(existing_slugs)} existing problems in DB")

        inserted = 0
        updated = 0

        for p in problems:
            slug = p["titleSlug"]
            difficulty = normalize_difficulty(p.get("difficulty"))

            # Defensive check (future-proof)
            if difficulty not in ("easy", "medium", "hard"):
                continue

            tags = [t["name"] for t in p.get("topicTags", [])]

            if slug in existing_slugs:
                # UPDATE
                session.execute(
                    text(
                        """
                        UPDATE problems SET
                            title = :title,
                            description = :description,
                            difficulty = :difficulty,
                            acceptance = :acceptance,
                            tags = :tags
                        WHERE leetcode_slug = :slug
                        """
                    ),
                    {
                        "title": p["title"],
                        "description": p["title"],
                        "difficulty": difficulty,
                        "acceptance": p.get("acRate"),
                        "tags": str(tags).replace("'", '"'),
                        "slug": slug,
                    },
                )
                updated += 1
            else:
                # INSERT
                session.execute(
                    text(
                        """
                        INSERT INTO problems (
                            title,
                            description,
                            difficulty,
                            leetcode_slug,
                            acceptance,
                            tags
                        )
                        VALUES (
                            :title,
                            :description,
                            :difficulty,
                            :slug,
                            :acceptance,
                            :tags
                        )
                        """
                    ),
                    {
                        "title": p["title"],
                        "description": p["title"],
                        "difficulty": difficulty,
                        "slug": slug,
                        "acceptance": p.get("acRate"),
                        "tags": str(tags).replace("'", '"'),
                    },
                )
                inserted += 1

            if (inserted + updated) % 500 == 0:
                session.commit()
                print(
                    f"Progress → Inserted: {inserted}, Updated: {updated}"
                )

        session.commit()
        print(
            f"✅ Done! Inserted: {inserted}, Updated: {updated}"
        )

    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()


# =========================
# MAIN
# =========================

async def main():
    print("🔄 Fetching problems from LeetCode...")
    problems = await fetch_all_problems()

    print(
        f"\n📥 Inserting {len(problems)} problems into PostgreSQL..."
    )
    batch_insert_postgres(problems)


if __name__ == "__main__":
    asyncio.run(main())
