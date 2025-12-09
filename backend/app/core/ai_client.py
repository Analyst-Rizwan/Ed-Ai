# backend/app/core/ai_client.py
from typing import AsyncGenerator, Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = settings.AI_SYSTEM_PROMPT


async def ask_ai(
    prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 300,
    json_mode: bool = False,   # NEW
) -> Any:
    """
    Unified interface for chat + structured output.

    json_mode=True → forces STRICT JSON output (OpenAI only).
    Returns:
        - dict when json_mode=True
        - str when json_mode=False
    """
    if not prompt or not prompt.strip():
        return "Please provide a valid question."

    provider = (settings.AI_PROVIDER or "").lower().strip()

    if provider == "openai":
        return await _ask_openai(prompt, temperature, max_tokens, json_mode)
    elif provider == "gemini":
        return await _ask_gemini(prompt, temperature, max_tokens)
    else:
        msg = f"Unknown AI provider: {provider!r}. Expected 'openai' or 'gemini'."
        logger.error(msg)
        return msg


# ============================================================
#                     OPENAI IMPLEMENTATION  
# ============================================================

async def _ask_openai(
    prompt: str,
    temperature: float,
    max_tokens: int,
    json_mode: bool
) -> Any:
    from openai import AsyncOpenAI

    if not settings.OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY missing.")
        return "AI is not configured correctly (no API key)."

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # Common request arguments
        kwargs = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # 🔥 JSON MODE (strict enforced JSON)
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        resp = await client.chat.completions.create(**kwargs)

        # When json_mode=True, OpenAI gives parsed JSON INSTANTLY:
        if json_mode:
            return resp.choices[0].message.parsed  # ← already a Python dict

        # Normal chat mode:
        content = resp.choices[0].message.content
        return content.strip() if isinstance(content, str) else str(content)

    except Exception as e:
        logger.exception("OpenAI error: %s", e)
        return (
            {"error": "openai_error", "message": str(e)}
            if json_mode
            else "AI error. Try again later."
        )


# ============================================================
#                    GEMINI IMPLEMENTATION
# ============================================================

async def _ask_gemini(prompt: str, temperature: float, max_tokens: int) -> str:
    import google.generativeai as genai

    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY missing.")
        return "AI is not configured correctly (Gemini key missing)."

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)

        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"

        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )

        # Quick extract
        if hasattr(response, "text") and response.text:
            return response.text.strip()

        # Manual fallback
        candidates = getattr(response, "candidates", None)
        if candidates:
            parts = getattr(candidates[0].content, "parts", [])
            text_pieces = [p.text for p in parts if hasattr(p, "text")]
            if text_pieces:
                return "".join(text_pieces).strip()

        return "Gemini returned no usable response."

    except Exception as e:
        logger.exception("Gemini error: %s", e)
        return "AI unavailable (Gemini error)."


# ============================================================
#                    STREAMING (unchanged)
# ============================================================

async def stream_ai(
    messages: list,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 300,
) -> AsyncGenerator[Dict[str, Any], None]:
    last_message = messages[-1]["content"] if messages else ""
    response = await ask_ai(last_message, temperature, max_tokens)
    yield {"type": "delta", "text": response}
    yield {"type": "done"}
