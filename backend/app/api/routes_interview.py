# backend/app/api/routes_interview.py
"""
Interview Prep AI endpoints — powered by a higher model (gpt-4o / gemini-2.5-pro).

Endpoints:
  POST /api/interview/polish   — STAR story AI polish
  POST /api/interview/mock     — Mock interview (AI interviewer with feedback)
  POST /api/interview/salary   — Salary negotiation (AI hiring manager)
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from app.auth.dependencies import get_current_user
from app.core.ai_client import ask_ai_interview, ask_ai_mock_interview
from app.core.rate_limit import limiter

logger = logging.getLogger("app.api.routes_interview")
router = APIRouter()


# ── Request models ────────────────────────────────────────────

class StarPolishRequest(BaseModel):
    title: str
    situation: str
    task: str
    action: str
    result: str


class MockInterviewMessage(BaseModel):
    role: str   # "user" | "assistant"
    text: str


class MockInterviewRequest(BaseModel):
    question: str
    question_category: Optional[str] = "behavioural"
    history: list[MockInterviewMessage] = []
    user_answer: str


class SalaryMessage(BaseModel):
    role: str   # "user" | "interviewer"
    text: str


class SalaryNegotiateRequest(BaseModel):
    role_title: str = "Software Engineer"
    experience_level: str = "Graduate / Entry Level"
    their_offer: Optional[str] = None
    target_salary: Optional[str] = None
    history: list[SalaryMessage] = []
    user_response: str


# ── POST /polish ──────────────────────────────────────────────

@router.post("/polish", summary="AI-polish a STAR story")
@limiter.limit("10/minute")
async def polish_star(
    request: Request,
    req: StarPolishRequest,
    user=Depends(get_current_user),
):
    """
    Takes raw STAR fields and returns a polished, interview-ready response.
    Uses a premium model for high-quality output.
    """
    if not req.situation.strip() or not req.action.strip():
        raise HTTPException(
            status_code=400,
            detail="Situation and Action fields are required."
        )

    system_prompt = (
        "You are an expert interview coach who helps candidates craft compelling, concise "
        "STAR-method answers. Your goal is to produce a polished, first-person narrative that "
        "is 90–120 seconds to deliver when spoken aloud (~200–250 words). "
        "Use specific, active language. Quantify outcomes where possible. "
        "Do NOT use bullet points — only flowing prose. Do NOT add any preamble or label the sections."
    )

    user_prompt = f"""Polish the following STAR story into a single, interview-ready answer:

Story title: {req.title}

Situation: {req.situation}

Task: {req.task}

Action: {req.action}

Result: {req.result}

Return ONLY the polished answer text, nothing else."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        answer = await ask_ai_interview(messages, temperature=0.6, max_tokens=500)
        return {"polished": answer}
    except Exception as e:
        logger.exception("polish_star error: %s", e)
        raise HTTPException(status_code=500, detail="AI backend error")


# ── POST /mock ────────────────────────────────────────────────

@router.post("/mock", summary="AI mock interview — question, follow-up, and feedback")
@limiter.limit("10/minute")
async def mock_interview(
    request: Request,
    req: MockInterviewRequest,
    user=Depends(get_current_user),
):
    """
    Multi-turn mock interview. The AI acts as a professional interviewer.
    On first call (empty history), the AI acknowledges the answer and asks a follow-up.
    After >= 2 exchanges, the AI provides structured feedback with scores.
    """
    is_first_response = len(req.history) == 0
    is_final_feedback = len(req.history) >= 4  # After ~2 back-and-forth exchanges

    system_prompt = (
        "You are a professional interviewer at a top tech company conducting a structured interview. "
        "Your tone is professional, slightly challenging, but constructive and encouraging. "
        f"The candidate is answering a {req.question_category} interview question. "
        "Keep your responses concise and focused."
    )

    if is_final_feedback:
        # Ask AI to give final structured feedback
        feedback_instruction = f"""The candidate has finished answering the interview question: "{req.question}"

Here is the full conversation so far:
{_build_mock_history_text(req.history)}

Candidate's final message: {req.user_answer}

Now provide your final feedback in this EXACT JSON format (no markdown, no explanation, just the JSON):
{{
  "type": "feedback",
  "clarity": <score 0-100>,
  "relevance": <score 0-100>,
  "structure": <score 0-100>,
  "text": "<2-3 sentence feedback with specific praise and one improvement tip>",
  "closing": "<1 sentence encouraging close, e.g. Good luck!>"
}}"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": feedback_instruction},
        ]
    else:
        # Build the conversation so far
        history_messages = [{"role": "system", "content": system_prompt}]

        if is_first_response:
            history_messages.append({
                "role": "user",
                "content": (
                    f"Ask the candidate this interview question to start the mock interview: \"{req.question}\"\n"
                    "Then immediately tell me you are ready to hear their answer. Keep it to 2 sentences."
                )
            })
            # Get the AI to open the interview
            messages = history_messages
        else:
            # Reconstruct the conversation
            history_messages.append({
                "role": "assistant",
                "content": f"Let's begin. Here is your question: {req.question}"
            })
            for msg in req.history:
                role = "user" if msg.role == "user" else "assistant"
                history_messages.append({"role": role, "content": msg.text})
            history_messages.append({"role": "user", "content": req.user_answer})
            history_messages.append({
                "role": "user",
                "content": (
                    "Acknowledge what was good about their answer in 1 sentence, then ask ONE probing "
                    "follow-up question to dig deeper. Keep the total response under 60 words."
                )
            })
            messages = history_messages

    try:
        answer = await ask_ai_mock_interview(messages, temperature=0.7, max_tokens=600)

        # Try to parse JSON feedback response
        if is_final_feedback:
            import json, re
            # Strip markdown code fences if present
            clean = re.sub(r"```(?:json)?|```", "", answer).strip()
            try:
                data = json.loads(clean)
                return data
            except Exception:
                # Fallback: return raw text as feedback
                return {
                    "type": "feedback",
                    "clarity": 75,
                    "relevance": 75,
                    "structure": 75,
                    "text": answer,
                    "closing": "Good luck with your interviews!"
                }

        return {"type": "message", "text": answer}
    except Exception as e:
        logger.exception("mock_interview error: %s", e)
        raise HTTPException(status_code=500, detail="AI backend error")


def _build_mock_history_text(history: list[MockInterviewMessage]) -> str:
    lines = []
    for msg in history:
        label = "Candidate" if msg.role == "user" else "Interviewer"
        lines.append(f"{label}: {msg.text}")
    return "\n".join(lines)


# ── POST /salary ──────────────────────────────────────────────

@router.post("/salary", summary="AI salary negotiation simulator")
@limiter.limit("10/minute")
async def salary_negotiate(
    request: Request,
    req: SalaryNegotiateRequest,
    user=Depends(get_current_user),
):
    """
    Multi-turn salary negotiation with an AI Hiring Manager.
    The AI maintains conversation context, pushes back realistically,
    and tests the candidate's negotiation skills.
    """
    context_parts = [
        f"Role: {req.role_title}",
        f"Candidate experience: {req.experience_level}",
    ]
    if req.their_offer:
        context_parts.append(f"Company's initial offer: £{req.their_offer}")
    if req.target_salary:
        context_parts.append(f"Candidate's target salary: £{req.target_salary}")

    system_prompt = (
        "You are a realistic Hiring Manager at a well-funded tech company conducting a salary negotiation. "
        "Context: " + ", ".join(context_parts) + ". "
        "Your personality: professional, slightly firm, but fair. You have some budget flexibility but won't give it away easily. "
        "You can discuss base salary, equity, signing bonus, remote work, and start date. "
        "Keep each response to 2-4 sentences. Be specific with numbers where relevant. "
        "Do NOT be a pushover — push back naturally on high requests, ask clarifying questions, "
        "and make counter-offers. This is a realistic negotiation practice."
    )

    is_first_message = len(req.history) == 0

    if is_first_message:
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    "Start the salary negotiation conversation. Open with a warm greeting, "
                    "mention the role, and then ask the candidate about their salary expectations. "
                    "Be natural and conversational."
                )
            }
        ]
    else:
        messages = [{"role": "system", "content": system_prompt}]
        # Reconstruct conversation history
        for msg in req.history:
            role = "user" if msg.role == "user" else "assistant"
            messages.append({"role": role, "content": msg.text})
        # Add the new candidate response
        messages.append({"role": "user", "content": req.user_response})

    try:
        answer = await ask_ai_interview(messages, temperature=0.75, max_tokens=300)
        return {"text": answer, "role": "interviewer"}
    except Exception as e:
        logger.exception("salary_negotiate error: %s", e)
        raise HTTPException(status_code=500, detail="AI backend error")
