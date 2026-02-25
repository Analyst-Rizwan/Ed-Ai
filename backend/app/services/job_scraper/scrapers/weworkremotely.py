"""We Work Remotely — public RSS feed parser. Attribution required."""
import hashlib
import httpx
import xml.etree.ElementTree as ET
from app.services.job_scraper.models import JobListing

RSS_URL = "https://weworkremotely.com/remote-jobs.rss"
HEADERS = {"User-Agent": "EduAI Job Aggregator (github.com/eduai)"}

FIELD_MAP = {
    "design": "design", "finance": "finance", "marketing": "other",
    "devops": "tech", "programming": "tech", "product": "tech",
    "management": "other", "sales": "other",
}


def _field(category: str) -> str:
    cat = (category or "").lower()
    for k, v in FIELD_MAP.items():
        if k in cat:
            return v
    return "tech"


def _posted(pub_date: str) -> str:
    if not pub_date:
        return "recently"
    try:
        from email.utils import parsedate_to_datetime
        from datetime import datetime, timezone
        dt = parsedate_to_datetime(pub_date).astimezone(timezone.utc)
        diff = (datetime.now(timezone.utc) - dt).total_seconds()
        if diff < 3600:
            return f"{int(diff/60)}m ago"
        if diff < 86400:
            return f"{int(diff/3600)}h ago"
        return f"{int(diff/86400)}d ago"
    except Exception:
        return "recently"


async def fetch(query: str = "", limit: int = 40) -> list[JobListing]:
    results: list[JobListing] = []
    try:
        async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
            resp = await client.get(RSS_URL)
            resp.raise_for_status()
            root = ET.fromstring(resp.text)

        q_lower = query.lower()
        for item in root.findall(".//item"):
            def tag(name: str) -> str:
                el = item.find(name)
                return el.text.strip() if el is not None and el.text else ""

            title_full = tag("title")
            # We Work Remotely titles are: "Category: Company - Job Title"
            parts = title_full.split(":")
            category = parts[0].strip() if len(parts) > 1 else ""
            rest = parts[-1].strip() if parts else title_full

            company, _, job_title = rest.partition(" - ")
            if not job_title:
                job_title = company
                company = ""

            link = tag("link")
            pub_date = tag("pubDate")
            description = tag("description")[:500].replace("<![CDATA[", "").replace("]]>", "").strip()

            if q_lower and q_lower not in ("software", "developer", "engineer"):
                text = f"{job_title} {company} {description}".lower()
                if q_lower not in text:
                    continue

            uid = hashlib.md5(f"wwr-{link}".encode()).hexdigest()[:10]

            results.append(JobListing(
                id=f"wwr-{uid}",
                title=job_title.strip(),
                company=company.strip(),
                location="Remote",
                salary=None,
                type="job",
                field=_field(category),
                remote=True,
                region="global",
                posted=_posted(pub_date),
                platform="We Work Remotely",
                platform_url=link or "https://weworkremotely.com",
                tags=[category] if category else ["Remote"],
                description=description,
                emoji="💻",
                color="#4DB6AC",
            ))

            if len(results) >= limit:
                break

    except Exception as e:
        print(f"[weworkremotely] error: {e}")
    return results
