"""JobAggregator — fans out to all scrapers concurrently with caching."""
import asyncio
import logging
import time
from typing import Optional
from app.services.job_scraper.models import JobListing
from app.services.job_scraper.scrapers import (
    himalayas, remoteok, weworkremotely,
    naukri, internshala, yc_jobs,
    indeed, glassdoor, greenhouse,
    adzuna, reed,
)

logger = logging.getLogger(__name__)

_CACHE: dict = {"jobs": [], "cached_at": 0.0}
CACHE_TTL = 30 * 60  # 30 minutes


def _is_cache_valid() -> bool:
    return bool(_CACHE["jobs"]) and (time.time() - _CACHE["cached_at"]) < CACHE_TTL


def _dedup(jobs: list[JobListing]) -> list[JobListing]:
    """Remove near-duplicate jobs by (normalised title, company)."""
    seen: set = set()
    result = []
    for j in jobs:
        key = (j.title.lower()[:40], j.company.lower()[:30])
        if key not in seen:
            seen.add(key)
            result.append(j)
    return result


async def _run_all(query: str = "software") -> list[JobListing]:
    """Fan out to all scrapers concurrently, each with a generous timeout."""
    async def safe(name: str, coro, timeout: int = 20):
        try:
            result = await asyncio.wait_for(coro, timeout=timeout)
            count = len(result) if isinstance(result, list) else 0
            logger.info(f"[aggregator] ✓ {name}: {count} jobs")
            return result
        except asyncio.TimeoutError:
            logger.warning(f"[aggregator] ✗ {name}: timed out after {timeout}s")
            return []
        except Exception as e:
            logger.warning(f"[aggregator] ✗ {name}: {e}")
            return []

    tasks = [
        # ── Tier 1: Free APIs / RSS — most reliable ──────────
        safe("himalayas",      himalayas.fetch(query=query, limit=50)),
        safe("remoteok",       remoteok.fetch(query=query, limit=60)),
        safe("weworkremotely", weworkremotely.fetch(query=query, limit=40)),

        # ── Tier 1: Greenhouse JSON boards (40 companies) ────
        safe("greenhouse",     greenhouse.fetch(query=query, limit=100), timeout=25),

        # ── Tier 2: HTML scrapers (best-effort, may get blocked)
        safe("yc_jobs",        yc_jobs.fetch(query=query, limit=20)),
        safe("naukri",         naukri.fetch(query=query, limit=20)),
        safe("internshala",    internshala.fetch(query=query, limit=15)),
        safe("indeed_india",   indeed.fetch(query=query, location="India", limit=15)),
        safe("indeed_remote",  indeed.fetch(query=query, location="Remote", limit=15)),
        safe("glassdoor",      glassdoor.fetch(query=query, limit=15)),
        safe("wellfound",      glassdoor.fetch_wellfound(query=query, limit=15)),

        # ── Tier 3: Optional API-keyed scrapers ──────────────
        safe("adzuna_in",      adzuna.fetch(query=query, country="in", limit=20)),
        safe("adzuna_gb",      adzuna.fetch(query=query, country="gb", limit=15)),
        safe("adzuna_us",      adzuna.fetch(query=query, country="us", limit=15)),
        safe("reed",           reed.fetch(query=query, limit=15)),
    ]

    batches = await asyncio.gather(*tasks)
    all_jobs: list[JobListing] = []
    for batch in batches:
        if isinstance(batch, list):
            all_jobs.extend(batch)

    deduped = _dedup(all_jobs)
    logger.info(f"[aggregator] Total: {len(all_jobs)} raw → {len(deduped)} after dedup")
    return deduped


async def get_jobs(query: str = "software", force_refresh: bool = False) -> list[JobListing]:
    """Return cached jobs or fetch fresh ones."""
    if not force_refresh and _is_cache_valid():
        return _CACHE["jobs"]

    jobs = await _run_all(query)
    _CACHE["jobs"] = jobs
    _CACHE["cached_at"] = time.time()
    return jobs


def get_cached_at() -> Optional[str]:
    """ISO timestamp of the last cache fill."""
    if not _CACHE["cached_at"]:
        return None
    import datetime
    return datetime.datetime.fromtimestamp(
        _CACHE["cached_at"], tz=datetime.timezone.utc
    ).isoformat()
