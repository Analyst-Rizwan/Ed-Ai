"""Indeed — HTML scraper. Uses rotating user-agents and rate limiting."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

BASE_URL = "https://www.indeed.com"
INDIA_URL = "https://in.indeed.com"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
]

TYPE_MAP = {"intern": "internship", "apprentice": "apprenticeship"}


def _job_type(title: str) -> str:
    t = title.lower()
    for k, v in TYPE_MAP.items():
        if k in t:
            return v
    return "job"


def _field(title: str, tags: list) -> str:
    text = f"{title} {' '.join(tags)}".lower()
    if any(w in text for w in ["design", "ui", "ux"]):
        return "design"
    if any(w in text for w in ["finance", "banking", "account"]):
        return "finance"
    return "tech"


async def fetch(query: str = "software developer", location: str = "India", limit: int = 15) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    base = INDIA_URL if "india" in location.lower() else BASE_URL
    params = {"q": query, "l": location, "sort": "date"}
    is_india = "india" in location.lower()

    try:
        await asyncio.sleep(random.uniform(1.0, 2.0))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            resp = await client.get(f"{base}/jobs", params=params)
            if resp.status_code in (403, 429):
                print(f"[indeed] blocked ({resp.status_code})")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select("div.job_seen_beacon, div[class*='jobCard'], td.resultContent")

        for card in cards[:limit]:
            title_el = card.select_one("h2.jobTitle a, a[data-jk]")
            company_el = card.select_one("span[class*='companyName'], a[data-tn-element='companyName']")
            location_el = card.select_one("div[class*='companyLocation']")
            salary_el = card.select_one("div[class*='metadata salary-snippet'], div[class*='salary']")
            link_el = card.select_one("a[href*='/rc/clk']") or card.select_one("a[id*='job_']") or title_el

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            location_text = location_el.get_text(strip=True) if location_el else location
            salary = salary_el.get_text(strip=True) if salary_el else None
            link = link_el.get("href", "") if link_el else ""

            if not title:
                continue

            uid = hashlib.md5(f"indeed-{title}-{company}".encode()).hexdigest()[:10]
            is_remote = "remote" in location_text.lower()

            results.append(JobListing(
                id=f"indeed-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else location_text,
                salary=salary,
                type=_job_type(title),
                field=_field(title, []),
                remote=is_remote,
                region="india" if is_india else "global",
                posted="recently",
                platform="Indeed",
                platform_url=f"{base}{link}" if link.startswith("/") else (link or base),
                tags=["Indeed"],
                description=f"{title} at {company}",
                emoji="🔍",
                color="#2164f3",
            ))

    except Exception as e:
        print(f"[indeed] error: {e}")
    return results
