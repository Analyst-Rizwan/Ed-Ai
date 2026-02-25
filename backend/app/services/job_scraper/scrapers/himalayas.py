"""Himalayas.app — free public JSON API for remote jobs. No auth required."""
import hashlib
import httpx
from app.services.job_scraper.models import JobListing

API_URL = "https://himalayas.app/jobs/api"
FIELD_MAP = {
    "engineering": "tech", "design": "design", "product": "tech",
    "data": "tech", "marketing": "other", "finance": "finance",
    "sales": "other", "operations": "other", "hr": "other",
}


def _field(category: str) -> str:
    cat = (category or "").lower()
    for k, v in FIELD_MAP.items():
        if k in cat:
            return v
    return "tech"


def _posted(pub_date: str) -> str:
    if not pub_date:
        return "recently"
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
        diff = (datetime.now(timezone.utc) - dt).total_seconds()
        if diff < 3600:
            return f"{int(diff/60)}m ago"
        if diff < 86400:
            return f"{int(diff/3600)}h ago"
        return f"{int(diff/86400)}d ago"
    except Exception:
        return "recently"


async def fetch(query: str = "software", limit: int = 50) -> list[JobListing]:
    results: list[JobListing] = []
    params = {"limit": limit, "offset": 0}
    if query:
        params["q"] = query  # type: ignore[assignment]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            jobs = data.get("jobs", []) if isinstance(data, dict) else data

            for j in jobs:
                uid = hashlib.md5(
                    f"himalayas-{j.get('title','')}-{j.get('companyName','')}".encode()
                ).hexdigest()[:10]
                salary = None
                lo, hi = j.get("minSalary"), j.get("maxSalary")
                if lo and hi:
                    currency = j.get("currency", "USD")
                    salary = f"{currency} {int(lo)//1000}k–{int(hi)//1000}k"
                elif lo:
                    salary = f"{j.get('currency','USD')} {int(lo)//1000}k+"

                results.append(JobListing(
                    id=f"himalayas-{uid}",
                    title=j.get("title", ""),
                    company=j.get("companyName", ""),
                    location="Remote",
                    salary=salary,
                    type="job",
                    field=_field(j.get("category", "")),
                    remote=True,
                    region="global",
                    posted=_posted(j.get("pubDate", "")),
                    platform="Himalayas",
                    platform_url=j.get("applicationLink", "https://himalayas.app/jobs"),
                    tags=[j.get("category", "Remote")] if j.get("category") else ["Remote"],
                    description=j.get("excerpt", ""),
                    emoji="🏔",
                    color="#7c5cfc",
                ))
    except Exception as e:
        print(f"[himalayas] error: {e}")
    return results
