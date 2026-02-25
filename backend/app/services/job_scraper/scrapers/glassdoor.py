"""Glassdoor — HTML scraper. Best-effort, gracefully falls back to [] if blocked."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

SEARCH_URL = "https://www.glassdoor.com/Job/jobs.htm"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
]


def _field(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ["design", "ux", "ui"]):
        return "design"
    if any(w in t for w in ["finance", "banking", "account"]):
        return "finance"
    return "tech"


def _type(title: str) -> str:
    t = title.lower()
    if "intern" in t:
        return "internship"
    if "apprentice" in t:
        return "apprenticeship"
    return "job"


async def fetch(query: str = "software developer", location: str = "", limit: int = 10) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    params = {"sc.keyword": query, "locT": "N", "locId": 0}
    if location:
        params["locId"] = location  # type: ignore[assignment]

    try:
        await asyncio.sleep(random.uniform(1.0, 2.0))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            resp = await client.get(SEARCH_URL, params=params)
            if resp.status_code in (403, 429, 401):
                print(f"[glassdoor] blocked ({resp.status_code}) — skipping")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select("li[data-test='jobListing'], div[class*='JobCard'], article[class*='job']")

        for card in cards[:limit]:
            title_el = card.select_one("a[data-test='job-title'], a[class*='jobTitle']")
            company_el = card.select_one("span[data-test='emp-name'], a[class*='empName']")
            location_el = card.select_one("div[data-test='emp-location'], span[class*='location']")
            salary_el = card.select_one("span[data-test='detailSalary'], span[class*='salary']")

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            loc = location_el.get_text(strip=True) if location_el else ""
            salary = salary_el.get_text(strip=True) if salary_el else None
            link = title_el.get("href", "") if title_el else ""

            if not title:
                continue

            uid = hashlib.md5(f"glassdoor-{title}-{company}".encode()).hexdigest()[:10]
            is_remote = "remote" in loc.lower()

            results.append(JobListing(
                id=f"glassdoor-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else (loc or "Unknown"),
                salary=salary,
                type=_type(title),
                field=_field(title),
                remote=is_remote,
                region="global",
                posted="recently",
                platform="Glassdoor",
                platform_url=f"https://www.glassdoor.com{link}" if link.startswith("/") else (link or "https://www.glassdoor.com/Job"),
                tags=["Glassdoor"],
                description=f"{title} at {company}",
                emoji="🔮",
                color="#0CAA41",
            ))

    except Exception as e:
        print(f"[glassdoor] error: {e}")
    return results


async def fetch_wellfound(query: str = "", limit: int = 12) -> list[JobListing]:
    """Wellfound (AngelList Talent) HTML scraper."""
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.google.com/",
    }
    url = "https://wellfound.com/jobs"
    if query:
        url = f"https://wellfound.com/role/l/{query.lower().replace(' ', '-')}"

    try:
        await asyncio.sleep(random.uniform(0.5, 1.5))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code in (403, 429):
                print(f"[wellfound] blocked ({resp.status_code})")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select("div[class*='JobListing'], div[class*='job-listing'], li[class*='job']")

        for card in cards[:limit]:
            title_el = card.select_one("h2 a, span[class*='title']")
            company_el = card.select_one("a[class*='startup'], span[class*='company']")
            location_el = card.select_one("span[class*='location']")
            salary_el = card.select_one("span[class*='salary'], span[class*='compensation']")
            link_el = card.select_one("a[href*='/jobs/']") or title_el

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            loc = location_el.get_text(strip=True) if location_el else "Remote"
            salary = salary_el.get_text(strip=True) if salary_el else None
            link = link_el.get("href", "") if link_el else ""

            if not title:
                continue

            uid = hashlib.md5(f"wellfound-{title}-{company}".encode()).hexdigest()[:10]
            is_remote = "remote" in loc.lower() or not loc

            results.append(JobListing(
                id=f"wellfound-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else loc,
                salary=salary,
                type=_type(title),
                field=_field(title),
                remote=is_remote,
                region="global",
                posted="recently",
                platform="Wellfound",
                platform_url=f"https://wellfound.com{link}" if link.startswith("/") else (link or "https://wellfound.com/jobs"),
                tags=["Startup", "Wellfound"],
                description=f"{title} at {company} (startup).",
                emoji="🦅",
                color="#6B3FA0",
            ))

    except Exception as e:
        print(f"[wellfound] error: {e}")
    return results
