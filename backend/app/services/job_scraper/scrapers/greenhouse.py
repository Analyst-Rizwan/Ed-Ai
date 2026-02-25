"""Greenhouse job boards — direct JSON endpoints for popular tech companies."""
import asyncio
import hashlib
import httpx
from app.services.job_scraper.models import JobListing

BASE = "https://boards.greenhouse.io/embed/job_board/jobs"

# Mix of global tech + India-present companies
COMPANIES: list[tuple[str, str, str, str]] = [
    # (slug, display_name, emoji, color)
    ("spotify",          "Spotify",         "🎵", "#1DB954"),
    ("monzo",            "Monzo",           "🏧", "#FF4970"),
    ("figma",            "Figma",           "🎨", "#F24E1E"),
    ("canva",            "Canva",           "✏️", "#7D2AE8"),
    ("razorpay",         "Razorpay",        "💳", "#3395FF"),
    ("swiggy",           "Swiggy",          "🍔", "#FC8019"),
    ("coinbase",         "Coinbase",        "₿",  "#0052FF"),
    ("stripe",           "Stripe",          "💳", "#635BFF"),
    ("notion",           "Notion",          "📝", "#000000"),
    ("discord",          "Discord",         "💬", "#5865F2"),
    ("shopify",          "Shopify",         "🛍", "#96BF48"),
    ("squarespace",      "Squarespace",     "⬛", "#222222"),
    ("brex",             "Brex",            "💼", "#EF4444"),
    ("airbnb",           "Airbnb",          "🏠", "#FF5A5F"),
    ("doordash",         "DoorDash",        "🚗", "#FF3008"),
    ("twitch",           "Twitch",          "🎮", "#9146FF"),
    ("cloudflare",       "Cloudflare",      "☁️", "#F38020"),
    ("databricks",       "Databricks",      "🧱", "#FF3621"),
    ("hashicorp",        "HashiCorp",       "⬡",  "#000000"),
    ("duolingo",         "Duolingo",        "🦉", "#58CC02"),
    ("instacart",        "Instacart",       "🛒", "#43B02A"),
    ("airtable",         "Airtable",        "📊", "#2D7FF9"),
    ("plaid",            "Plaid",           "🔗", "#0A85EA"),
    ("gusto",            "Gusto",           "💰", "#F45D48"),
    ("benchling",        "Benchling",       "🧬", "#0066FF"),
    ("relativity",       "Relativity",      "🚀", "#3B82F6"),
    ("niantic",          "Niantic",         "🌍", "#00B0FF"),
    ("dropbox",          "Dropbox",         "📦", "#0061FF"),
    ("hubspot",          "HubSpot",         "🔶", "#FF7A59"),
    ("gitlab",           "GitLab",          "🦊", "#FC6D26"),
    ("flexport",         "Flexport",        "📦", "#0C2340"),
    ("coda",             "Coda",            "📄", "#F46A54"),
    ("ro",               "Ro",              "🏥", "#2D3DE1"),
    ("ziprecruiter",     "ZipRecruiter",    "💼", "#6ACA25"),
    ("postman",          "Postman",         "📮", "#FF6C37"),
    ("chainalysis",      "Chainalysis",     "🔗", "#FF5722"),
    ("webflow",          "Webflow",         "🌊", "#4353FF"),
    ("anduril",          "Anduril",         "🛡", "#000000"),
    ("ramp",             "Ramp",            "💳", "#FFC107"),
    ("verkada",          "Verkada",         "📹", "#000000"),
]

FIELD_MAP = {
    "design": "design", "product": "tech", "engineering": "tech",
    "data": "tech", "finance": "finance", "marketing": "other",
    "operations": "other", "sales": "other", "legal": "other",
    "hr": "other", "people": "other", "security": "tech",
}


def _field(department: str) -> str:
    dept = (department or "").lower()
    for k, v in FIELD_MAP.items():
        if k in dept:
            return v
    return "tech"


def _type(title: str) -> str:
    t = title.lower()
    if "intern" in t:
        return "internship"
    if "apprentice" in t:
        return "apprenticeship"
    return "job"


def _region(location: str) -> str:
    loc = location.lower()
    india_cities = ["india", "bengaluru", "bangalore", "mumbai", "delhi", "hyderabad", "pune", "chennai", "gurgaon", "noida"]
    for city in india_cities:
        if city in loc:
            return "india"
    return "global"


async def _fetch_one(
    client: httpx.AsyncClient,
    slug: str, name: str, emoji: str, color: str, max_per_company: int
) -> list[JobListing]:
    results = []
    try:
        resp = await client.get(BASE, params={"for": slug}, timeout=12)
        if resp.status_code != 200:
            return []
        data = resp.json()
        jobs = data.get("jobs", [])
        for j in jobs[:max_per_company]:
            uid = hashlib.md5(f"gh-{slug}-{j.get('id','')}".encode()).hexdigest()[:10]
            location = j.get("location", {}).get("name", "Unknown")
            is_remote = "remote" in location.lower()
            dept = j.get("departments", [{}])[0].get("name", "") if j.get("departments") else ""
            region = _region(location)
            results.append(JobListing(
                id=f"greenhouse-{uid}",
                title=j.get("title", ""),
                company=name,
                location=location,
                salary=None,
                type=_type(j.get("title", "")),
                field=_field(dept),
                remote=is_remote,
                region=region,
                posted="recently",
                platform=f"{name} (Greenhouse)",
                platform_url=j.get("absolute_url", f"https://boards.greenhouse.io/{slug}"),
                tags=[dept] if dept else ["Tech"],
                description=f"{j.get('title','')} at {name}",
                emoji=emoji,
                color=color,
            ))
    except Exception as e:
        print(f"[greenhouse:{slug}] error: {e}")
    return results


async def fetch(query: str = "", limit: int = 100) -> list[JobListing]:
    results: list[JobListing] = []
    # Fetch 8 jobs per company (40 companies × 8 = up to 320 jobs before dedup)
    max_per_company = 8

    async with httpx.AsyncClient(timeout=15) as client:
        # Fire all requests concurrently
        tasks = [_fetch_one(client, slug, name, emoji, color, max_per_company) for slug, name, emoji, color in COMPANIES]
        batches = await asyncio.gather(*tasks, return_exceptions=True)
        for batch in batches:
            if isinstance(batch, list):
                results.extend(batch)

    # Soft query filter: only apply for very specific searches
    if query and query.lower() not in ("software", "developer", "engineer", ""):
        q = query.lower()
        results = [j for j in results if q in j.title.lower() or q in j.company.lower() or q in " ".join(j.tags).lower()]

    return results[:limit]
