"""FastAPI route for job opportunities. Serves aggregated job listings."""
from typing import Optional
from fastapi import APIRouter, Query, Depends, Request
from app.services.job_scraper import aggregator
from app.services.job_scraper.models import JobListing
from app.auth.dependencies import get_current_user
from app.core.rate_limit import limiter

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

TYPE_VALS = {"job", "internship", "apprenticeship"}
FIELD_VALS = {"tech", "finance", "design", "other"}


def _matches(j: JobListing, q: str, jtype: str, field: str, remote: Optional[bool], region: str) -> bool:
    if q:
        text = f"{j.title} {j.company} {' '.join(j.tags)} {j.description}".lower()
        if q.lower() not in text:
            return False
    if jtype != "all" and jtype in TYPE_VALS and j.type != jtype:
        return False
    if field != "all" and field in FIELD_VALS and j.field != field:
        return False
    if remote is True and not j.remote:
        return False
    if region == "india" and j.region != "india":
        return False
    if region == "global" and j.remote is False and j.region != "global":
        return False
    return True


@router.get("/jobs")
async def get_jobs(
    q: str = Query(default="", description="Keyword search"),
    type: str = Query(default="all", description="all|job|internship|apprenticeship"),
    field: str = Query(default="all", description="all|tech|finance|design|other"),
    remote: Optional[bool] = Query(default=None),
    region: str = Query(default="all", description="all|india|global"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, le=500),
    user=Depends(get_current_user),  # SECURITY: require auth (VULN-04)
):
    """Return aggregated job listings with filtering and pagination."""
    query_term = q if q else "software"
    jobs = await aggregator.get_jobs(query=query_term)

    filtered = [j for j in jobs if _matches(j, q, type, field, remote, region)]

    total = len(filtered)
    start = (page - 1) * limit
    paginated = filtered[start: start + limit]

    # Count how many platforms contributed
    platforms = len({j.platform for j in filtered})

    return {
        "jobs": [j.model_dump() for j in paginated],
        "total": total,
        "platforms": platforms,
        "page": page,
        "limit": limit,
        "cached_at": aggregator.get_cached_at(),
    }


@router.get("/refresh")
@limiter.limit("1/minute")  # SECURITY: prevent scraper abuse (VULN-04)
async def refresh_jobs(
    request: Request,
    q: str = Query(default="software"),
    user=Depends(get_current_user),  # SECURITY: require auth (VULN-04)
):
    """Force-refresh the job cache and return fresh listings."""
    jobs = await aggregator.get_jobs(query=q, force_refresh=True)
    return {
        "jobs": [j.model_dump() for j in jobs],
        "total": len(jobs),
        "platforms": len({j.platform for j in jobs}),
        "cached_at": aggregator.get_cached_at(),
    }

