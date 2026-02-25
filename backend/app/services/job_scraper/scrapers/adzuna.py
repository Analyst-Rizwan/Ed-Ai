"""Adzuna — official free REST API. Supports India, UK, US regions.
Requires ADZUNA_APP_ID and ADZUNA_APP_KEY env vars (free at developer.adzuna.com).
Falls back gracefully if keys are not set.
"""
import hashlib
import os
import httpx
from app.services.job_scraper.models import JobListing

APP_ID = os.getenv("ADZUNA_APP_ID", "")
APP_KEY = os.getenv("ADZUNA_APP_KEY", "")

COUNTRY_ENDPOINTS = {
    "india": "in",
    "uk": "gb",
    "us": "us",
    "global": "us",
}

FIELD_MAP = {
    "it jobs": "tech", "engineering jobs": "tech", "science & qa jobs": "tech",
    "finance jobs": "finance", "accounting jobs": "finance",
    "design jobs": "design", "creative & design jobs": "design",
}


def _field(category: str) -> str:
    cat = (category or "").lower()
    for k, v in FIELD_MAP.items():
        if k in cat:
            return v
    return "tech"


def _type(title: str, contract_type: str) -> str:
    t = title.lower()
    if "intern" in t:
        return "internship"
    if "apprentice" in t or "apprentice" in (contract_type or "").lower():
        return "apprenticeship"
    return "job"


def _posted(created: str) -> str:
    if not created:
        return "recently"
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        diff = (datetime.now(timezone.utc) - dt).total_seconds()
        if diff < 3600:
            return f"{int(diff/60)}m ago"
        if diff < 86400:
            return f"{int(diff/3600)}h ago"
        return f"{int(diff/86400)}d ago"
    except Exception:
        return "recently"


async def fetch(query: str = "software", country: str = "in", limit: int = 15) -> list[JobListing]:
    if not APP_ID or not APP_KEY:
        return []

    results: list[JobListing] = []
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    params = {
        "app_id": APP_ID,
        "app_key": APP_KEY,
        "what": query,
        "results_per_page": limit,
        "sort_by": "date",
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        for j in data.get("results", []):
            uid = hashlib.md5(str(j.get("id", "")).encode()).hexdigest()[:10]
            loc = j.get("location", {}).get("display_name", "")
            salary_min = j.get("salary_min")
            salary_max = j.get("salary_max")
            salary = None
            if salary_min and salary_max:
                salary = f"₹{int(salary_min):,} – ₹{int(salary_max):,}" if country == "in" else f"£{int(salary_min):,} – £{int(salary_max):,}"
            cat = j.get("category", {}).get("label", "")
            is_remote = "remote" in loc.lower() or "remote" in (j.get("description", "") or "").lower()

            results.append(JobListing(
                id=f"adzuna-{uid}",
                title=j.get("title", ""),
                company=j.get("company", {}).get("display_name", ""),
                location=loc or ("India" if country == "in" else "UK"),
                salary=salary,
                type=_type(j.get("title", ""), j.get("contract_type", "")),
                field=_field(cat),
                remote=is_remote,
                region="india" if country == "in" else "global",
                posted=_posted(j.get("created", "")),
                platform="Adzuna",
                platform_url=j.get("redirect_url", "https://adzuna.com"),
                tags=[cat] if cat else [],
                description=(j.get("description", "") or "")[:400],
                emoji="📋",
                color="#d72b3f",
            ))

    except Exception as e:
        print(f"[adzuna:{country}] error: {e}")
    return results
