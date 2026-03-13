"""Instahyre Jobs — Scraper for Instahyre job listings."""
import asyncio
import hashlib
import random
import httpx
from bs4 import BeautifulSoup
from app.services.job_scraper.models import JobListing

SEARCH_URL = "https://www.instahyre.com/search-jobs/"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
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

async def fetch(query: str = "software engineer", limit: int = 20) -> list[JobListing]:
    results: list[JobListing] = []
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }
    
    # Note: Instahyre's search URL structure uses path variables e.g., /search-jobs/skills/reactjs/
    # For a general query, we hit the base search and then parse. 
    # To properly implement filtering by query we would use their query structure,
    # Here we perform a general skills search if a query is provided
    # Fallback to main search-jobs for a generalized set of jobs.
    clean_query = query.replace(" ", "-").lower()
    url = f"https://www.instahyre.com/search-jobs/skills/{clean_query}/" if query else SEARCH_URL

    try:
        await asyncio.sleep(random.uniform(1.0, 2.0))
        async with httpx.AsyncClient(timeout=12, headers=headers, follow_redirects=True) as client:
            # First try the skills specific URL
            resp = await client.get(url)
            
            # If 404 (skill not found in their DB), fallback to general jobs
            if resp.status_code == 404:
                resp = await client.get(SEARCH_URL)
                
            if resp.status_code in (403, 429):
                print(f"[instahyre] blocked ({resp.status_code}) — skipping")
                return []
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        
        # Instahyre job cards
        job_cards = soup.select("div.opportunity-box, div.employer-block")

        for card in job_cards[:limit]:
            title_el = card.select_one("div.job-title, span.job-title")
            company_el = card.select_one("div.employer-details-company-name, div.employer-name")
            location_el = card.select_one("span.job-locations, div.job-locations")
            link_el = card.select_one("a[href*='/job-']")

            title = title_el.get_text(strip=True) if title_el else ""
            company = company_el.get_text(strip=True) if company_el else ""
            location = location_el.get_text(strip=True) if location_el else "India"
            link = link_el.get("href", "") if link_el else ""

            if not title or not company:
                continue

            # Check if tags contain "work from home"
            tags_els = card.select("div.job-tags span")
            tags = [t.get_text(strip=True) for t in tags_els]
            is_remote = "remote" in location.lower() or any("work from home" in t.lower() for t in tags)

            uid = hashlib.md5(f"instahyre-{title}-{company}".encode()).hexdigest()[:10]
            
            full_link = f"https://www.instahyre.com{link}" if link.startswith("/") else link

            results.append(JobListing(
                id=f"instahyre-{uid}",
                title=title,
                company=company,
                location="Remote" if is_remote else location,
                salary=None,
                type=_type(title),
                field=_field(title),
                remote=is_remote,
                region="india",
                posted="recently",
                platform="Instahyre",
                platform_url=full_link if full_link else "https://www.instahyre.com/",
                tags=tags[:3] + ["Instahyre"],
                description=f"{title} at {company}",
                emoji="🚀",
                color="#1DA1F2",
            ))

    except Exception as e:
        print(f"[instahyre] error: {e}")
        
    return results
