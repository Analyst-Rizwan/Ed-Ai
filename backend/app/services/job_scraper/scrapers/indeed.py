import asyncio
import hashlib
import random
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from app.services.job_scraper.models import JobListing

BASE_URL = "https://www.indeed.com"
INDIA_URL = "https://in.indeed.com"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
    
    base = INDIA_URL if "india" in location.lower() else BASE_URL
    
    # Strip junior prefix for Indeed since it does exact match on the string
    cleaned_query = query.replace("junior software", "software")
    qs = f"?q={cleaned_query.replace(' ', '+')}&l={location}&sc=0kf%3Aexplvl%28ENTRY_LEVEL%29%3B&sort=date"
    url = f"{base}/jobs{qs}"
    is_india = "india" in location.lower()
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3000) # Wait for CF challenge or React loads
            except Exception as e:
                print(f"[indeed] timeout or nav error: {e}")
                
            content = await page.content()
            await browser.close()

        soup = BeautifulSoup(content, "lxml")
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
