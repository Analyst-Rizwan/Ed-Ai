"""Shared data models for the job scraper service."""
from pydantic import BaseModel


class JobListing(BaseModel):
    id: str                  # "{source}-{hash}"
    title: str
    company: str
    location: str
    salary: str | None = None
    type: str                # "job" | "internship" | "apprenticeship"
    field: str               # "tech" | "finance" | "design" | "other"
    remote: bool = False
    region: str = "global"   # "india" | "global"
    posted: str = ""         # "2h ago" normalised
    platform: str            # display name shown to user
    platform_url: str        # direct apply / listing URL
    tags: list[str] = []
    description: str = ""
    emoji: str = "💼"
    color: str = "#7c5cfc"  # brand colour hex
