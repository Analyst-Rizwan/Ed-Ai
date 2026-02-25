"""RemoteOK — free public JSON API for remote tech jobs. No auth required."""
import hashlib
import re
import httpx
from app.services.job_scraper.models import JobListing

API_URL = "https://remoteok.com/api"
HEADERS = {"User-Agent": "EduAI Job Aggregator (github.com/eduai)"}

FIELD_MAP = {
    "design": "design", "finance": "finance", "marketing": "other",
    "sales": "other", "devops": "tech", "backend": "tech",
    "frontend": "tech", "fullstack": "tech", "data": "tech",
    "python": "tech", "javascript": "tech", "react": "tech",
    "machine learning": "tech", "ml": "tech", "ai": "tech",
    "cloud": "tech", "security": "tech", "mobile": "tech",
    "ios": "tech", "android": "tech", "ruby": "tech",
    "java": "tech", "go": "tech", "rust": "tech",
    "accounting": "finance", "legal": "other", "hr": "other",
}


def _field(tags: list) -> str:
    for t in tags:
        tl = t.lower()
        for k, v in FIELD_MAP.items():
            if k in tl:
                return v
    return "tech"


def _posted(epoch: int | None) -> str:
    if not epoch:
        return "recently"
    try:
        from datetime import datetime, timezone
        diff = (datetime.now(timezone.utc).timestamp() - int(epoch))
        if diff < 3600:
            return f"{int(diff/60)}m ago"
        if diff < 86400:
            return f"{int(diff/3600)}h ago"
        return f"{int(diff/86400)}d ago"
    except Exception:
        return "recently"


async def fetch(query: str = "", limit: int = 60) -> list[JobListing]:
    results: list[JobListing] = []
    try:
        async with httpx.AsyncClient(timeout=15, headers=HEADERS) as client:
            resp = await client.get(API_URL)
            resp.raise_for_status()
            data = resp.json()
            # First element is metadata object, rest are jobs
            jobs = [j for j in data if isinstance(j, dict) and j.get("id")]

            q_lower = query.lower() if query else ""
            for j in jobs:
                tags: list = j.get("tags") or []
                # Soft filtering: only skip if query is very specific AND doesn't match
                if q_lower and q_lower not in "software developer engineer":
                    text = f"{j.get('position','')} {j.get('company','')} {' '.join(tags)}".lower()
                    if q_lower not in text:
                        continue

                uid = hashlib.md5(str(j.get("id", "")).encode()).hexdigest()[:10]
                salary_raw = j.get("salary")
                salary = salary_raw if salary_raw and salary_raw.strip() else None

                results.append(JobListing(
                    id=f"remoteok-{uid}",
                    title=j.get("position", ""),
                    company=j.get("company", ""),
                    location=j.get("location", "Remote") or "Remote",
                    salary=salary,
                    type="job",
                    field=_field(tags),
                    remote=True,
                    region="global",
                    posted=_posted(j.get("epoch")),
                    platform="RemoteOK",
                    platform_url=j.get("url") or "https://remoteok.com",
                    tags=tags[:5],
                    description=re.sub(r'<[^>]+>', '', (j.get("description", "") or ""))[:500],
                    emoji="🌐",
                    color="#459b4c",
                ))

                if len(results) >= limit:
                    break
    except Exception as e:
        print(f"[remoteok] error: {e}")
    return results
