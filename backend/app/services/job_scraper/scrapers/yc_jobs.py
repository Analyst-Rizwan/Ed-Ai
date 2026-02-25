"""YC Work at a Startup — HTML scraper for startup jobs."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

BASE_URL = "https://www.workatastartup.com"
JOBS_URL = "https://www.workatastartup.com/jobs"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
]

ROLE_FIELDS = {
    "design": "design", "product": "tech", "engineer": "tech",
    "data": "tech", "ml": "tech", "finance": "finance", "marketing": "other",
}


def _field(role: str) -> str:
    for k, v in ROLE_FIELDS.items():
        if k in role.lower():
            return v
    return "tech"


async def fetch(query: str = "", limit: int = 15) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.ycombinator.com/",
    }
    params: dict = {}
    if query:
        params["q"] = query

    try:
        await asyncio.sleep(random.uniform(0.5, 1.5))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            resp = await client.get(JOBS_URL, params=params)
            if resp.status_code in (403, 429):
                print(f"[yc_jobs] blocked ({resp.status_code})")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        # YC job cards have various selectors depending on their current HTML
        cards = soup.select("div.job, li.job, div[class*='job-card'], div[class*='JobCard']")
        if not cards:
            cards = soup.select("div[class*='job']")

        for card in cards[:limit]:
            title_el = card.select_one("a[class*='title'], h2, h3, a[href*='/jobs/']")
            company_el = card.select_one("a[class*='company'], span[class*='company'], h4")
            location_el = card.select_one("span[class*='location'], div[class*='location']")
            link_el = card.select_one("a[href*='/jobs/']")

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            location = location_el.get_text(strip=True) if location_el else "Remote"
            link = link_el.get("href", "") if link_el else ""

            if not title:
                continue

            uid = hashlib.md5(f"yc-{title}-{company}".encode()).hexdigest()[:10]
            is_remote = "remote" in location.lower() or not location

            results.append(JobListing(
                id=f"yc-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else location,
                salary=None,
                type="job",
                field=_field(title),
                remote=is_remote,
                region="global",
                posted="recently",
                platform="YC Work at a Startup",
                platform_url=f"{BASE_URL}{link}" if link.startswith("/") else (link or JOBS_URL),
                tags=["YC-backed", "Startup"],
                description=f"{title} at a Y Combinator-backed startup.",
                emoji="🚀",
                color="#FF6600",
            ))

    except Exception as e:
        print(f"[yc_jobs] error: {e}")
    return results
