# backend/app/core/ai_client.py
from typing import AsyncGenerator, Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = settings.AI_SYSTEM_PROMPT


async def ask_ai(prompt: str, temperature: float = 0.7, max_tokens: int = 300) -> str:
    """
    Unified AI interface - automatically uses the provider specified in settings.AI_PROVIDER
    Supports: openai, gemini
    Always returns a string (never None).
    """
    if not prompt or not prompt.strip():
        return "Please provide a valid question."

    provider = (settings.AI_PROVIDER or "").lower().strip()

    if provider == "openai":
        return await _ask_openai(prompt, temperature, max_tokens)
    elif provider == "gemini":
        return await _ask_gemini(prompt, temperature, max_tokens)
    else:
        msg = f"Unknown AI provider: {provider!r}. Use 'openai' or 'gemini'."
        logger.error(msg)
        return msg


# ============================================================
#                    OPENAI IMPLEMENTATION
# ============================================================

async def _ask_openai(prompt: str, temperature: float, max_tokens: int) -> str:
    from openai import AsyncOpenAI

    if not settings.OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY not set in environment")
        return "AI is not configured correctly (missing OpenAI API key)."

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )

        content = resp.choices[0].message.content
        return content.strip() if isinstance(content, str) else str(content)
    except Exception as e:
        logger.exception("OpenAI error: %s", e)
        return "AI is temporarily unavailable (OpenAI error). Please try again later."


# ============================================================
#                    GEMINI IMPLEMENTATION
# ============================================================

async def _ask_gemini(prompt: str, temperature: float, max_tokens: int) -> str:
    import google.generativeai as genai

    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not set in environment")
        return "AI is not configured correctly (missing Gemini API key)."

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

        # 1) Try quick accessor
        try:
            text = getattr(response, "text", None)
            if text:
                return text.strip()
        except Exception:
            text = None

        # 2) Try to manually extract from candidates/parts
        candidates = getattr(response, "candidates", None)
        if candidates:
            pieces: list[str] = []
            for cand in candidates:
                content = getattr(cand, "content", None)
                parts = getattr(content, "parts", None) if content else None
                if parts:
                    for p in parts:
                        t = getattr(p, "text", None)
                        if t:
                            pieces.append(t)
            if pieces:
                return "".join(pieces).strip()

            first = candidates[0]
            finish_reason = getattr(first, "finish_reason", "UNKNOWN")
            logger.warning("Gemini returned no text. finish_reason=%s", finish_reason)
            return (
                "I couldn't generate a response right now "
                f"(Gemini finish_reason={finish_reason}). Please try rephrasing your question."
            )

        # 3) No candidates at all
        logger.warning("Gemini returned no candidates for the request.")
        return "I couldn't generate any response. Please try again with a different question."
    except Exception as e:
        logger.exception("Gemini error: %s", e)
        return "AI is temporarily unavailable (Gemini error). Please try again later."


# ============================================================
#                    STREAMING (Optional - for later)
# ============================================================

async def stream_ai(
    messages: list,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 300,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Streaming support - can be implemented per provider later.
    For now, just yields the full response as one chunk.
    """
    last_message = messages[-1]["content"] if messages else ""
    response = await ask_ai(last_message, temperature, max_tokens)

    yield {"type": "delta", "text": response}
    yield {"type": "done"}
