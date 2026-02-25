"""Reed.co.uk — official free REST API for UK jobs.
Requires REED_API_KEY env var (free at reed.co.uk/developers).
Falls back gracefully if key is not set.
"""
import hashlib
import os
import httpx
from app.services.job_scraper.models import JobListing

REED_API_KEY = os.getenv("REED_API_KEY", "")
API_URL = "https://www.reed.co.uk/api/1.0/search"


def _type(title: str) -> str:
    t = title.lower()
    if "intern" in t:
        return "internship"
    if "apprentice" in t:
        return "apprenticeship"
    return "job"


def _field(title: str, keywords: str) -> str:
    text = f"{title} {keywords}".lower()
    if any(w in text for w in ["design", "ux", "ui"]):
        return "design"
    if any(w in text for w in ["finance", "banking", "account"]):
        return "finance"
    return "tech"


def _posted(date_str: str) -> str:
    if not date_str:
        return "recently"
    try:
        from datetime import datetime, timezone
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        diff = (datetime.now(timezone.utc) - dt).total_seconds()
        if diff < 86400:
            return "today"
        return f"{int(diff/86400)}d ago"
    except Exception:
        return "recently"


async def fetch(query: str = "software developer", limit: int = 15) -> list[JobListing]:
    if not REED_API_KEY:
        return []

    results: list[JobListing] = []
    params = {
        "keywords": query,
        "resultsToTake": limit,
        "resultsToSkip": 0,
    }

    try:
        async with httpx.AsyncClient(timeout=10, auth=(REED_API_KEY, "")) as client:
            resp = await client.get(API_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        for j in data.get("results", []):
            uid = hashlib.md5(str(j.get("jobId", "")).encode()).hexdigest()[:10]
            location = j.get("locationName", "UK")
            salary_min = j.get("minimumSalary")
            salary_max = j.get("maximumSalary")
            salary = None
            if salary_min and salary_max:
                salary = f"£{int(salary_min):,} – £{int(salary_max):,}"
            elif salary_min:
                salary = f"£{int(salary_min):,}+"
            is_remote = "remote" in (j.get("jobDescription", "") or "").lower()

            results.append(JobListing(
                id=f"reed-{uid}",
                title=j.get("jobTitle", ""),
                company=j.get("employerName", ""),
                location="Remote" if is_remote else location,
                salary=salary,
                type=_type(j.get("jobTitle", "")),
                field=_field(j.get("jobTitle", ""), j.get("jobDescription", "")),
                remote=is_remote,
                region="global",
                posted=_posted(j.get("date", "")),
                platform="Reed.co.uk",
                platform_url=j.get("jobUrl", "https://www.reed.co.uk"),
                tags=[j.get("employerName", "")],
                description=(j.get("jobDescription", "") or "")[:400],
                emoji="🇬🇧",
                color="#CC0000",
            ))

    except Exception as e:
        print(f"[reed] error: {e}")
    return results
