"""Internshala — HTML scraper for India internships & fresher jobs."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

BASE_URL = "https://internshala.com"
SEARCH_URL = "https://internshala.com/internships/"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
]


def _field(tags: list, title: str) -> str:
    text = f"{title} {' '.join(tags)}".lower()
    if any(w in text for w in ["design", "ui", "ux", "graphic"]):
        return "design"
    if any(w in text for w in ["finance", "banking", "account", "ca "]):
        return "finance"
    return "tech"


async def fetch(query: str = "", limit: int = 15) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    url = SEARCH_URL
    if query:
        slug = query.lower().replace(" ", "-")
        url = f"{BASE_URL}/internships/keywords-{slug}/"

    try:
        await asyncio.sleep(random.uniform(0.5, 1.5))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code in (403, 429):
                print(f"[internshala] blocked ({resp.status_code})")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        cards = soup.select("div.internship_meta, div[id*='internship_']")

        for card in cards[:limit]:
            title_el = card.select_one("h3.heading_4_5 a, a.job-title-href, h3 a")
            company_el = card.select_one("p.company-name, a[class*='company']")
            location_el = card.select_one("a[class*='location'], p.locations")
            stipend_el = card.select_one("span.stipend, div[class*='stipend']")
            link_el = title_el
            tag_els = card.select("div.round_tabs a, span[class*='tag']")

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            location = location_el.get_text(strip=True) if location_el else "India"
            stipend = stipend_el.get_text(strip=True) if stipend_el else None
            link = link_el.get("href", "") if link_el else ""
            tags = [t.get_text(strip=True) for t in tag_els]

            if not title:
                continue

            uid = hashlib.md5(f"internshala-{title}-{company}".encode()).hexdigest()[:10]
            is_remote = "work from home" in location.lower() or "remote" in location.lower()

            results.append(JobListing(
                id=f"internshala-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else (location or "India"),
                salary=stipend,
                type="internship",
                field=_field(tags, title),
                remote=is_remote,
                region="india",
                posted="recently",
                platform="Internshala",
                platform_url=f"{BASE_URL}{link}" if link.startswith("/") else (link or BASE_URL),
                tags=tags[:5],
                description=f"{title} internship at {company}",
                emoji="🎓",
                color="#0073e6",
            ))

    except Exception as e:
        print(f"[internshala] error: {e}")
    return results
