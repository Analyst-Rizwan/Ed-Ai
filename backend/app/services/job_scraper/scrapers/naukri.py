"""Naukri.com — HTML scraper for India jobs. Best-effort, may be blocked."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

BASE_URL = "https://www.naukri.com"
SEARCH_URL = "https://www.naukri.com/jobs-in-india"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

TYPE_MAP = {"intern": "internship", "apprentice": "apprenticeship"}


def _job_type(title: str, tags: list) -> str:
    text = f"{title} {' '.join(tags)}".lower()
    for k, v in TYPE_MAP.items():
        if k in text:
            return v
    return "job"


def _field(tags: list, title: str) -> str:
    text = f"{title} {' '.join(tags)}".lower()
    if any(w in text for w in ["design", "ui", "ux"]):
        return "design"
    if any(w in text for w in ["finance", "banking", "account", "ca ", "cfa"]):
        return "finance"
    return "tech"


async def fetch(query: str = "software developer", limit: int = 15) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    params = {"keyword": query, "jobAge": 7}

    try:
        await asyncio.sleep(random.uniform(0.5, 1.5))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            resp = await client.get(SEARCH_URL, params=params)
            if resp.status_code in (403, 429):
                print(f"[naukri] blocked ({resp.status_code})")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        articles = soup.select("article.jobTuple, div.jobTuple, div[class*='srp-jobtuple']")

        for art in articles[:limit]:
            title_el = art.select_one("a.title, a[class*='title']")
            company_el = art.select_one("a.subTitle, a[class*='comp-name']")
            location_el = art.select_one("li.location, span[class*='locWdth']")
            exp_el = art.select_one("li.experience, span[class*='expwdth']")
            salary_el = art.select_one("li.salary, span[class*='salary']")
            link_el = art.select_one("a.title, a[class*='title']")
            tag_els = art.select("ul.tags li, span[class*='tag']")

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            location = location_el.get_text(strip=True) if location_el else "India"
            salary = salary_el.get_text(strip=True) if salary_el else None
            link = link_el.get("href", "") if link_el else ""
            tags = [t.get_text(strip=True) for t in tag_els]

            if not title:
                continue

            uid = hashlib.md5(f"naukri-{title}-{company}".encode()).hexdigest()[:10]
            jtype = _job_type(title, tags)

            results.append(JobListing(
                id=f"naukri-{uid}",
                title=title,
                company=company,
                location=location or "India",
                salary=salary,
                type=jtype,
                field=_field(tags, title),
                remote="remote" in location.lower(),
                region="india",
                posted="recently",
                platform="Naukri",
                platform_url=link if link.startswith("http") else f"{BASE_URL}{link}",
                tags=tags[:5],
                description=f"{title} at {company}",
                emoji="🇮🇳",
                color="#FF7555",
            ))

    except Exception as e:
        print(f"[naukri] error: {e}")
    return results
