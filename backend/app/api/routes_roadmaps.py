# backend/app/api/routes_roadmaps.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import logging
import re

from app.core.ai_client import ask_ai

logger = logging.getLogger("app.api.routes_roadmaps")

router = APIRouter()


# ---------- Existing simple list (for dashboard cards) ----------

@router.get("/", summary="List example roadmaps (static)")
def get_roadmaps():
    """
    Basic static roadmaps for the dashboard cards.
    """
    return [
        {
            "id": 1,
            "title": "React Developer Roadmap",
            "progress": 65,
            "xp": 1200,
            "color": "from-teal-500 to-green-500",
        },
        {
            "id": 2,
            "title": "Data Structures & Algorithms",
            "progress": 45,
            "xp": 900,
            "color": "from-orange-400 to-yellow-500",
        },
        {
            "id": 3,
            "title": "System Design Fundamentals",
            "progress": 30,
            "xp": 600,
            "color": "from-blue-400 to-indigo-500",
        },
    ]


# ---------- AI-powered roadmap generator (PUBLIC for now) ----------

class RoadmapGenerateRequest(BaseModel):
    topic: str
    level: Optional[str] = "beginner"
    duration_weeks: int = 16
    hours_per_week: int = 10
    learner_background: Optional[str] = None
    target_goal: Optional[str] = None


def _sanitize_ai_json(raw: str) -> str:
    """
    Try to turn messy LLM output into clean JSON string:
    - strip ```json / ``` fences
    - drop any text before the first '{'
    - drop any text after the last '}'
    """
    if not isinstance(raw, str):
        raw = str(raw)

    s = raw.strip()

    # Remove markdown fences like ```json ... ```
    s = re.sub(r"^```json", "", s, flags=re.IGNORECASE).strip()
    s = re.sub(r"^```", "", s).strip()
    s = re.sub(r"```$", "", s).strip()

    # Keep only from first '{' to last '}'
    if "{" in s and "}" in s:
        s = s[s.index("{") : s.rindex("}") + 1]

    return s


@router.post(
    "/generate",
    summary="Generate a detailed roadmap for a topic using AI",
)
async def generate_roadmap(
    payload: RoadmapGenerateRequest,
) -> Dict[str, Any]:
    """
    Public endpoint (no auth yet).
    Uses ask_ai (OpenAI key from backend env) to generate a structured roadmap.
    """
    prompt = f"""
You are an expert curriculum designer.

Create a learning roadmap for this learner:

- Topic/Skill: {payload.topic}
- Level: {payload.level}
- Total duration: {payload.duration_weeks} weeks
- Time per week: {payload.hours_per_week} hours
- Learner background: {payload.learner_background or "not specified"}
- Target goal: {payload.target_goal or "not specified"}

Return a SINGLE JSON OBJECT with these fields:

- id: kebab-case identifier for the roadmap (e.g. "web-dev-complete-beginner")
- title: human readable roadmap title
- skill: short skill slug (e.g. "web-development")
- level: "beginner" | "intermediate" | "advanced"
- description: short overview of the roadmap
- duration_weeks: integer
- hours_per_week: integer
- target_outcome: what the learner will be able to do at the end
- prerequisites: what they should know before starting
- phases: array of objects. Each phase has:
    - id: string
    - name: string
    - order: integer starting at 0 or 1
    - goal: what this phase focuses on
    - duration_weeks: integer
    - timeline: object with {{"start_week": number, "end_week": number}}
    - milestone_summary: one-sentence milestone text
    - tasks: array of objects. Each task has:
        - id: string
        - title: string
        - order: integer
        - type: "learn" | "practice" | "project" | "deploy" | "assessment" | "reflection"
        - description: 1–3 sentence description
        - estimated_time_minutes: integer
        - deliverable: string
        - success_criteria: array of strings
        - tags: array of short tags (strings)

IMPORTANT:
- Respond ONLY with a JSON object.
- Do NOT add explanations, markdown, code fences, or commentary.
- The response must START with '{{' and END with '}}'.
    """.strip()

    try:
        raw = await ask_ai(prompt=prompt, temperature=0.35, max_tokens=1800)

        sanitized = _sanitize_ai_json(raw)

        try:
            data = json.loads(sanitized)
        except Exception as e:
            logger.error(
                "Failed to parse AI roadmap JSON.\nRaw: %s\nSanitized: %s\nError: %s",
                raw[:1000],
                sanitized[:1000],
                repr(e),
            )
            raise HTTPException(
                status_code=502,
                detail="AI returned invalid JSON for roadmap.",
            )

        if not isinstance(data, dict):
            raise HTTPException(
                status_code=502,
                detail="AI returned an unexpected structure (expected object).",
            )

        if "id" not in data:
            title = str(data.get("title") or payload.topic).strip().lower()
            slug = "-".join(title.split())
            data["id"] = slug[:80] or "roadmap"

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("generate_roadmap error: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate roadmap",
        )
