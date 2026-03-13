"""LinkedIn Jobs — HTML Scraper for LinkedIn public jobs endpoint. Best effort."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

SEARCH_URL = "https://www.linkedin.com/jobs/search"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

def _type(title: str) -> str:
    t = title.lower()
    if "intern" in t:
        return "internship"
    if "apprentice" in t:
        return "apprenticeship"
    return "job"

def _field(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ["design", "ux", "ui"]):
        return "design"
    if any(w in t for w in ["finance", "banking", "account"]):
        return "finance"
    return "tech"

async def fetch(query: str = "software engineer", limit: int = 15) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    
    # LinkedIn public job search parameters
    # f_E=1,2 targets Internships (1) and Entry Level (2) roles natively
    params = {
        "keywords": query,
        "location": "Worldwide",
        "f_TPR": "r604800", # Past week
        "f_E": "1,2",       # Internships & Entry level only
        "position": 1,
        "pageNum": 0
    }

    try:
        await asyncio.sleep(random.uniform(1.0, 2.5))
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            resp = await client.get(SEARCH_URL, params=params)
            if resp.status_code in (403, 429, 999):
                print(f"[linkedin] blocked ({resp.status_code}) — skipping")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        # Public jobs paginated view li elements
        job_cards = soup.select("ul.jobs-search__results-list li")

        for card in job_cards[:limit]:
            title_el = card.select_one("h3.base-search-card__title")
            company_el = card.select_one("h4.base-search-card__subtitle a") or card.select_one("h4.base-search-card__subtitle")
            location_el = card.select_one("span.job-search-card__location")
            time_el = card.select_one("time.job-search-card__listdate") or card.select_one("time.job-search-card__listdate--new")
            link_el = card.select_one("a.base-card__full-link")

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            location = location_el.get_text(strip=True) if location_el else "Unknown"
            posted_time = time_el.get_text(strip=True) if time_el else "recently"
            link = link_el.get("href", "") if link_el else ""

            # Sometimes the job card structure varies or doesn't have the main elements
            if not title or not company:
                continue

            uid = hashlib.md5(f"linkedin-{title}-{company}".encode()).hexdigest()[:10]
            is_remote = "remote" in location.lower()
            
            # Clean up tracking params from URL if present
            clean_link = link.split('?')[0] if '?' in link else link

            results.append(JobListing(
                id=f"linkedin-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else location,
                salary=None, # LinkedIn public search doesn't reliably expose salary without auth
                type=_type(title),
                field=_field(title),
                remote=is_remote,
                region="global",
                posted=posted_time,
                platform="LinkedIn",
                platform_url=clean_link if clean_link else "https://www.linkedin.com/jobs",
                tags=["LinkedIn"],
                description=f"{title} at {company}",
                emoji="💼",
                color="#0A66C2",
            ))

    except Exception as e:
        print(f"[linkedin] error: {e}")
        
    return results
