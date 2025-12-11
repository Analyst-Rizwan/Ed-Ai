# backend/app/api/routes_roadmaps.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import json
import re

from sqlalchemy.orm import Session
from openai import AsyncOpenAI, OpenAIError

from app.db.session import get_db
from app.core.config import settings

logger = logging.getLogger("app.api.routes_roadmaps")

router = APIRouter()

# ------------------------------------------------------
# Models & config
# ------------------------------------------------------
ROADMAP_PLANNER_MODEL = getattr(settings, "AI_ROADMAP_MODEL", None) or "gpt-4o"
CHEAP_MODEL = getattr(settings, "AI_CHEAP_MODEL", None) or (settings.OPENAI_MODEL or "gpt-4o-mini")

if not getattr(settings, "OPENAI_API_KEY", None):
    logger.warning("OPENAI_API_KEY not set in settings - roadmap endpoints will fail until configured.")

# Create a single client instance (async)
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None


class RoadmapGenerateRequest(BaseModel):
    topic: str
    level: Optional[str] = "beginner"
    duration_weeks: int = 12  # will be clamped 12..52
    hours_per_week: int = 10
    learner_background: Optional[str] = None
    target_goal: Optional[str] = None


# ------------------------------------------------------
# Utilities: extract JSON robustly from returned message
# ------------------------------------------------------
def _find_first_json(text: str) -> Optional[str]:
    """
    Return substring containing the first balanced JSON object found in `text`,
    or None if none found. Handles nested braces by tracking depth.
    """
    if not text:
        return None
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    end_idx = None
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end_idx = i
                break

    if end_idx is not None:
        return text[start : end_idx + 1]
    return None


def _sanitize_json_like(text: str) -> str:
    """
    Remove common problematic characters:
    - Remove single-line comments starting at line-start or after whitespace (avoid stripping URLs)
    - Remove trailing commas before } or ]
    - Replace stray control chars
    """
    if text is None:
        return text

    # Avoid touching http:// or https://, so only remove // comments that are at line start or preceded by whitespace and not part of URL.
    text = re.sub(r"(^|\n)\s*//.*", "", text)
    # Trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)
    # Replace unprintable control chars with spaces
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", text)
    # Replace smart quotes with regular ones
    text = text.replace("\u2018", "'").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    return text.strip()


def _extract_json_from_message(message) -> Dict[str, Any]:
    """
    Accept several shapes of message objects returned by various OpenAI SDK versions.
    Attempt to extract a JSON object robustly:
      - If message has attribute 'parsed' return that (common when response_format=json_object)
      - If message.content is str -> try to find JSON inside and parse
      - If message.content is list -> join textual parts and parse
      - If message.content is dict -> try to find keys ("parsed", "text", "content") and handle
    Raises HTTPException(502) with helpful logs on failure.
    """
    try:
        # Try direct parsed property first (if SDK provided a parsed JSON object)
        if hasattr(message, "parsed"):
            parsed = getattr(message, "parsed")
            if isinstance(parsed, dict):
                return parsed
            # if parsed is a JSON-string etc, try json.loads
            if isinstance(parsed, str):
                try:
                    return json.loads(parsed)
                except Exception:
                    pass

        content = getattr(message, "content", None)

        # If SDK returned a dict-like content
        if isinstance(content, dict):
            # try to find nested parsed / text / parts
            if "parsed" in content and isinstance(content["parsed"], dict):
                return content["parsed"]
            if "text" in content:
                text_val = content["text"]
                if isinstance(text_val, str):
                    raw = text_val.strip()
                elif isinstance(text_val, dict):
                    # sometimes text is {'text':'...'} or with 'value' key
                    raw = text_val.get("value") or text_val.get("content") or ""
                else:
                    raw = str(text_val)
            elif "content" in content:
                raw = content["content"] if isinstance(content["content"], str) else json.dumps(content["content"])
            else:
                raw = json.dumps(content)
        # If content is a list of parts/objects
        elif isinstance(content, list):
            parts = []
            for p in content:
                if isinstance(p, str):
                    parts.append(p)
                elif isinstance(p, dict):
                    # standard candidate part could be {'type':'text','text':'...'}
                    text_val = p.get("text") or p.get("content") or p.get("value")
                    if isinstance(text_val, dict):
                        parts.append(text_val.get("text") or text_val.get("value") or "")
                    elif isinstance(text_val, str):
                        parts.append(text_val)
                else:
                    # fallback to string conversion
                    try:
                        parts.append(str(p))
                    except Exception:
                        pass
            raw = "".join(parts).strip()
        # If content is direct string
        elif isinstance(content, str):
            raw = content.strip()
        else:
            # Last resort: convert message to string
            raw = str(message).strip()

        # If the raw text is already JSON-ish, try json.loads directly
        try:
            return json.loads(raw)
        except Exception:
            # Try to find first JSON object substring and sanitize
            jtxt = _find_first_json(raw)
            if not jtxt:
                logger.error("No JSON object found in message raw text. Raw (first 1000): %s", raw[:1000])
                raise HTTPException(status_code=502, detail="No JSON object found in AI model output.")

            cleaned = _sanitize_json_like(jtxt)
            try:
                return json.loads(cleaned)
            except Exception as e:
                # Log helpful debug context and raise
                logger.error(
                    "Failed to parse extracted JSON. Error: %s | Extracted (first 2000): %s | Cleaned (first 2000): %s",
                    e,
                    jtxt[:2000],
                    cleaned[:2000],
                )
                raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error when extracting JSON from message: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to parse AI message: {e}")


# ------------------------------------------------------
# Helpers to call planner and week-expander models
# ------------------------------------------------------
async def _call_planner(prompt: str) -> Dict[str, Any]:
    """
    Call premium planner model (expects valid JSON in response).
    """
    if client is None:
        raise HTTPException(status_code=500, detail="OpenAI client not configured (missing API key).")

    try:
        resp = await client.chat.completions.create(
            model=ROADMAP_PLANNER_MODEL,
            # If the SDK supports response_format json_object, some SDKs will populate .parsed
            # But many older/newer SDK variations differ; we'll parse ourselves for robustness.
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an expert curriculum architect. Return a single valid JSON object only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.25,
            max_tokens=7000,
        )

        # resp.choices[0].message is the typical structure; handle unexpected shapes via helper
        message = resp.choices[0].message
        parsed = _extract_json_from_message(message)
        if not isinstance(parsed, dict):
            raise HTTPException(status_code=502, detail="Planner model returned non-object JSON.")
        return parsed

    except OpenAIError as e:
        logger.exception("OpenAI SDK error in planner call: %s", e)
        raise HTTPException(status_code=502, detail=f"Planner model OpenAI error: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error calling planner model: %s", e)
        raise HTTPException(status_code=500, detail=f"Planner model error: {e}")


async def _call_week_expander(prompt: str) -> Dict[str, Any]:
    """
    Call cheaper model to expand a single week into days + XP.
    """
    if client is None:
        raise HTTPException(status_code=500, detail="OpenAI client not configured (missing API key).")

    try:
        resp = await client.chat.completions.create(
            model=CHEAP_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "Expand the supplied week into JSON containing days, per-day items and xp. Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.35,
            max_tokens=4000,
        )

        message = resp.choices[0].message
        parsed = _extract_json_from_message(message)
        if not isinstance(parsed, dict):
            raise HTTPException(status_code=502, detail="Week expander returned non-object JSON.")
        return parsed

    except OpenAIError as e:
        logger.exception("OpenAI SDK error in week expander: %s", e)
        raise HTTPException(status_code=502, detail=f"Week expander OpenAI error: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error calling week expander: %s", e)
        raise HTTPException(status_code=500, detail=f"Week expander error: {e}")


# ------------------------------------------------------
# Main endpoint: hybrid planner -> expander approach
# ------------------------------------------------------
@router.post("/generate", summary="Generate a detailed AI/ML roadmap using hybrid models (planner + expander)")
async def generate_roadmap(payload: RoadmapGenerateRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    topic = (payload.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required.")

    level = (payload.level or "beginner").strip().lower()
    # clamp duration
    duration_weeks = max(12, min(52, int(payload.duration_weeks or 12)))
    hours_per_week = max(1, int(payload.hours_per_week or 10))

    # Build planner prompt (skeleton only - no days)
    planner_prompt = f"""
Design a high-level learning roadmap SKELETON for:

- Topic/Skill: {topic}
- Level: {level}
- Duration: {duration_weeks} weeks
- Hours per week: {hours_per_week}
- Learner background: {payload.learner_background or 'not specified'}
- Target goal: {payload.target_goal or 'not specified'}

Return ONLY a JSON OBJECT describing phases and weeks (NO daily breakdown yet).
The JSON must include a 'phases' array covering all weeks 1..{duration_weeks}, with sensible phase boundaries.
Example minimal structure:

{{
  "id": "kebab-case-id",
  "title": "string",
  "skill": "slug",
  "level": "beginner|intermediate|advanced",
  "description": "2-4 sentence overview",
  "duration_weeks": {duration_weeks},
  "hours_per_week": {hours_per_week},
  "target_outcome": "string",
  "prerequisites": "string",
  "total_xp": 0,
  "phases":[
    {{
      "id":"phase-1-foundations",
      "name":"Phase 1: ...",
      "order":1,
      "goal":"string",
      "start_week":1,
      "end_week":3,
      "milestone_summary":"string",
      "phase_xp":0,
      "weeks":[
        {{
          "week_number":1,
          "theme":"string",
          "outcome":"string",
          "summary":"string",
          "week_xp":0
        }}
      ]
    }}
  ]
}}

Do not include any 'days' arrays in the planner output.
"""
    # 1) Planner skeleton
    skeleton = await _call_planner(planner_prompt)

    # Ensure required skeleton fields & defaults
    skeleton.setdefault("id", f"{topic.lower().replace(' ', '-')}-{duration_weeks}w")
    skeleton.setdefault("title", f"{topic} Roadmap")
    skeleton.setdefault("skill", (skeleton.get("skill") or topic.lower().replace(" ", "-")))
    skeleton.setdefault("level", level)
    skeleton.setdefault("duration_weeks", duration_weeks)
    skeleton.setdefault("hours_per_week", hours_per_week)
    skeleton.setdefault("total_xp", 0)
    skeleton.setdefault("phases", [])

    phases = skeleton.get("phases") or []
    if not isinstance(phases, list) or len(phases) == 0:
        raise HTTPException(status_code=502, detail="Planner returned no phases. Check model output and logs.")

    # 2) Expand each week (cheaper model)
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
Expand this week into daily tasks (5 days OK). Context:
- Topic: {topic}
- Level: {level}
- Week number: {week_number}
- Theme: {theme}
- Weekly outcome: {outcome}
- Hours per week: {hours_per_week}

Return ONLY JSON with shape:
{{
 "week_xp": 0,
 "days": [
   {{
     "day_number": 1,
     "title": "string",
     "time_estimate_hours": 2.0,
     "xp_reward": 50,
     "completed": false,
     "learn_items": [{{ "description":"", "xp":10, "completed":false, "resource":{{"title":"","url":"","provider":"","type":""}} }}],
     "practice_items": [{{ "description":"", "xp":15, "completed":false }}],
     "project_items": [{{ "description":"", "xp":25, "completed":false }}],
     "reflection_items": [{{ "description":"", "xp":5, "completed":false }}]
   }}
 ]
}}

Rules:
- Typically 5 days (1..5) per week.
- day.xp_reward must equal sum of its items;
- week_xp must equal sum of day.xp_reward.
- All completed flags false.
- Return valid JSON only.
"""
            expanded = await _call_week_expander(week_prompt)

            days = expanded.get("days") or []
            week_xp = expanded.get("week_xp") or 0

            # attach the expanded week data
            week["days"] = days
            week["week_xp"] = week_xp

            if isinstance(week_xp, (int, float)):
                phase_xp += week_xp

        phase["phase_xp"] = phase_xp
        total_xp += phase_xp

    skeleton["total_xp"] = total_xp
    skeleton["phases"] = phases

    return {"roadmap": skeleton}
