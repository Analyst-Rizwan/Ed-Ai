from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import json

from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from app.db.session import get_db
from app.core.config import settings

logger = logging.getLogger("app.api.routes_roadmaps")

router = APIRouter()

# ------------------------------------------------------
#          MODELS & CONFIG
# ------------------------------------------------------

# Expensive / high-quality model just for roadmap structure
# You can set AI_ROADMAP_MODEL in your env / settings if you want to override.
ROADMAP_PLANNER_MODEL = getattr(settings, "AI_ROADMAP_MODEL", None) or "gpt-4o"

# Cheaper model for expanding weeks into daily tasks (uses your existing default)
CHEAP_MODEL = settings.OPENAI_MODEL or "gpt-4o-mini"

# Single OpenAI async client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


class RoadmapGenerateRequest(BaseModel):
    topic: str
    level: Optional[str] = "beginner"
    duration_weeks: int = 12  # we'll clamp between 12 and 52
    hours_per_week: int = 10
    learner_background: Optional[str] = None
    target_goal: Optional[str] = None


# ------------------------------------------------------
#          STATIC DASHBOARD ROADMAPS
# ------------------------------------------------------

@router.get("/", summary="List example roadmaps (static)")
def get_roadmaps():
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


# ------------------------------------------------------
#          HELPER: PARSE JSON FROM MESSAGE
# ------------------------------------------------------

def _extract_json_from_message(message) -> Dict[str, Any]:
    """
    Compatible with older OpenAI Python SDK versions:
    - message.content may be a string
    - or a list of content parts with 'text' fields
    """
    content = getattr(message, "content", None)

    if isinstance(content, str):
        raw = content
    elif isinstance(content, list):
        # Newer SDK sometimes gives list of content parts
        parts = []
        for part in content:
            # part is usually {'type': 'text', 'text': {...}} or similar
            text = None
            if isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, dict):
                    text = text.get("value") or text.get("content")
            else:
                text = getattr(part, "text", None)
                if isinstance(text, dict):
                    text = text.get("value") or text.get("content")
            if isinstance(text, str):
                parts.append(text)
        raw = "".join(parts)
    else:
        raise ValueError(f"Unsupported message.content type: {type(content)}")

    raw = raw.strip()
    try:
        return json.loads(raw)
    except Exception as e:
        logger.error("Failed to json.loads OpenAI content. Error: %s | Raw (first 800): %s", e, raw[:800])
        raise


# ------------------------------------------------------
#          HELPERS: GPT CALLS
# ------------------------------------------------------

async def _call_planner(prompt: str) -> Dict[str, Any]:
    """
    Call the premium model (GPT-4o or similar) to get the
    high-level roadmap skeleton (phases + weeks).
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured for roadmap planner.",
        )

    try:
        resp = await client.chat.completions.create(
            model=ROADMAP_PLANNER_MODEL,
            # response_format is fine even if SDK is older; we just parse content ourselves
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert curriculum architect. Always return valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
            max_tokens=7000,
        )
        msg = resp.choices[0].message
        parsed = _extract_json_from_message(msg)

        if not isinstance(parsed, dict):
            raise HTTPException(
                status_code=502,
                detail="Planner model returned non-object JSON.",
            )
        return parsed
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in roadmap planner model: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Planner model error: {e}",
        )


async def _call_week_expander(prompt: str) -> Dict[str, Any]:
    """
    Call the cheaper model (gpt-4o-mini or whatever OPENAI_MODEL is)
    to expand a single week into days + XP.
    Returns JSON like: { "days": [...], "week_xp": 0 }
    """
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured for week expansion.",
        )

    try:
        resp = await client.chat.completions.create(
            model=CHEAP_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": "You expand roadmap weeks into daily tasks with XP. Always return valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.35,
            max_tokens=4000,
        )
        msg = resp.choices[0].message
        parsed = _extract_json_from_message(msg)

        if not isinstance(parsed, dict):
            raise HTTPException(
                status_code=502,
                detail="Week expander returned non-object JSON.",
            )
        return parsed
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in week expander model: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Week expander error: {e}",
        )


# ------------------------------------------------------
#          MAIN ENDPOINT: HYBRID GENERATION
# ------------------------------------------------------

@router.post(
    "/generate",
    summary="Generate a detailed AI/ML roadmap using hybrid models (planner + expander)",
)
async def generate_roadmap(
    payload: RoadmapGenerateRequest,
    db: Session = Depends(get_db),  # reserved for future persistence
) -> Dict[str, Any]:
    """
    Multi-phase generation:
    1) Planner model (e.g. GPT-4o) creates high-level roadmap skeleton
       with phases and weeks (no days).
    2) Cheaper model expands each week into detailed days with XP.
    3) We compute week_xp, phase_xp, total_xp and return the full roadmap.
    """

    topic = payload.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic must not be empty.")

    level = (payload.level or "beginner").strip().lower()
    # Clamp between 12 and 52 weeks
    duration_weeks = max(12, min(payload.duration_weeks, 52))
    hours_per_week = max(1, payload.hours_per_week)

    # ------------------------------------------------------
    # 1) High-level skeleton via planner model
    # ------------------------------------------------------
    planner_prompt = f"""
Design a high-level learning roadmap SKELETON for:

- Topic/Skill: {topic}
- Level: {level}
- Duration: {duration_weeks} weeks
- Hours per week: {hours_per_week}
- Learner background: {payload.learner_background or "not specified"}
- Target goal: {payload.target_goal or "not specified"}

Return ONLY a JSON OBJECT with:

{{
  "id": "kebab-case-identifier",
  "title": "string",
  "skill": "short skill slug like 'ai-ml' or derived from topic",
  "level": "beginner | intermediate | advanced",
  "description": "2-4 sentence overview of the roadmap",
  "duration_weeks": {duration_weeks},
  "hours_per_week": {hours_per_week},
  "target_outcome": "what learner can do at the end",
  "prerequisites": "what they should ideally know before starting",
  "total_xp": 0,
  "phases": [
    {{
      "id": "phase-1-foundations",
      "name": "Phase 1: ...",
      "order": 1,
      "goal": "high-level goal of this phase",
      "start_week": 1,
      "end_week": 3,
      "milestone_summary": "short milestone for this phase",
      "phase_xp": 0,
      "weeks": [
        {{
          "week_number": 1,
          "theme": "short theme like 'Python & Data Basics'",
          "outcome": "short description of what the learner achieves this week",
          "summary": "1-3 sentences describing the week",
          "week_xp": 0
        }}
      ]
    }}
  ]
}}

Rules:
- Cover ALL weeks from 1 to {duration_weeks} exactly once across all phases.
- Make phase boundaries sensible (e.g. 3-6 weeks per phase).
- DO NOT include any "days" or sub-daily structure yet.
- NO markdown, NO comments, JSON only.
    """.strip()

    skeleton = await _call_planner(planner_prompt)

    # Basic sanity & defaults
    skeleton.setdefault("id", f"{topic.lower().replace(' ', '-')}-{duration_weeks}w")
    skeleton.setdefault("title", f"{topic} Roadmap")
    skeleton.setdefault("skill", topic.lower().replace(" ", "-"))
    skeleton.setdefault("level", level)
    skeleton.setdefault("duration_weeks", duration_weeks)
    skeleton.setdefault("hours_per_week", hours_per_week)
    skeleton.setdefault("total_xp", 0)
    skeleton.setdefault("phases", [])

    phases = skeleton.get("phases") or []
    if not isinstance(phases, list) or not phases:
        raise HTTPException(
            status_code=502,
            detail="Planner model returned no phases in roadmap.",
        )

    # ------------------------------------------------------
    # 2) Expand each week with cheaper model
    # ------------------------------------------------------
    total_xp = 0

    for phase in phases:
        phase_weeks = phase.get("weeks") or []
        if not isinstance(phase_weeks, list):
            continue

        phase_xp = 0

        for week in phase_weeks:
            week_number = week.get("week_number")
            theme = week.get("theme", "")
            outcome = week.get("outcome", "")
            summary = week.get("summary", "")

            week_prompt = f"""
You are expanding a roadmap WEEK into detailed daily tasks with XP.

Roadmap context:
- Topic: {topic}
- Level: {level}
- Week number: {week_number}
- Theme: {theme}
- Weekly outcome: {outcome}
- Weekly summary: {summary}
- Hours per week: {hours_per_week}

Return ONLY JSON with this shape:

{{
  "week_xp": 0,
  "days": [
    {{
      "day_number": 1,
      "title": "short title",
      "time_estimate_hours": 2.0,
      "xp_reward": 50,
      "completed": false,
      "learn_items": [
        {{
          "description": "string",
          "xp": 10,
          "completed": false,
          "resource": {{
            "title": "string",
            "url": "string",
            "provider": "string",
            "type": "video | article | ebook | docs | dataset"
          }}
        }}
      ],
      "practice_items": [
        {{
          "description": "string",
          "xp": 15,
          "completed": false
        }}
      ],
      "project_items": [
        {{
          "description": "string",
          "xp": 25,
          "completed": false
        }}
      ],
      "reflection_items": [
        {{
          "description": "string",
          "xp": 5,
          "completed": false
        }}
      ]
    }}
  ]
}}

Rules:
- Typically create 5 days (1–5) for this week.
- Each day's xp_reward MUST equal the sum of its items' xp.
- week_xp MUST equal the sum of all days' xp_reward.
- All completed fields must be false.
- Focus all content on the given theme and on AI/ML/data/ML engineering context.
- NO markdown, NO comments, JSON only.
            """.strip()

            expanded = await _call_week_expander(week_prompt)

            days = expanded.get("days") or []
            week_xp = expanded.get("week_xp") or 0

            week["days"] = days
            week["week_xp"] = week_xp

            if isinstance(week_xp, (int, float)):
                phase_xp += week_xp

        phase["phase_xp"] = phase_xp
        total_xp += phase_xp

    skeleton["total_xp"] = total_xp
    skeleton["phases"] = phases

    return {"roadmap": skeleton}
