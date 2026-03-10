# backend/app/core/ai_client.py
"""
Unified AI client with support for both blocking and streaming responses.

Streaming is implemented natively for Gemini (generate_content with stream=True).
The model instance is cached at module level to avoid re-initialization overhead.
"""

from typing import AsyncGenerator, Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = settings.AI_SYSTEM_PROMPT

# ============================================================
#  Cached Gemini model — initialized ONCE, reused on every call
# ============================================================
_gemini_model = None


def _get_gemini_model():
    """Return a cached GenerativeModel instance (lazy-init on first call)."""
    global _gemini_model
    if _gemini_model is None:
        import google.generativeai as genai

        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY missing.")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info("Gemini model '%s' initialized (cached)", settings.GEMINI_MODEL)

    return _gemini_model


# ============================================================
#                      UNIFIED ask_ai
# ============================================================

async def ask_ai(
    prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    json_mode: bool = False,
) -> Any:
    """
    Unified interface for chat + structured output (non-streaming).

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

        kwargs = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        resp = await client.chat.completions.create(**kwargs)

        if json_mode:
            return resp.choices[0].message.parsed

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

    try:
        model = _get_gemini_model()
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"

        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )

        if hasattr(response, "text") and response.text:
            return response.text.strip()

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
#             TRUE STREAMING — yields tokens as they arrive
# ============================================================

async def stream_ai(
    messages: list,
    model: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Stream AI response token-by-token using Gemini's native streaming.

    Yields dicts: { "type": "delta", "text": "..." } for each chunk,
    then { "type": "done" } at the end.
    """
    provider = (settings.AI_PROVIDER or "").lower().strip()

    if provider == "gemini":
        async for evt in _stream_gemini(messages, temperature, max_tokens):
            yield evt
    else:
        # Fallback: non-streaming (OpenAI or unknown provider)
        last_message = messages[-1]["content"] if messages else ""
        response = await ask_ai(last_message, temperature, max_tokens)
        yield {"type": "delta", "text": response}
        yield {"type": "done"}


async def _stream_gemini(
    messages: list,
    temperature: float,
    max_tokens: int,
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    True Gemini streaming using generate_content(stream=True).
    Each chunk yields as soon as Gemini produces it.
    """
    import asyncio
    import google.generativeai as genai

    try:
        model = _get_gemini_model()

        # Build prompt from conversation messages
        parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                parts.append(f"{content}\n")
            elif role == "user":
                parts.append(f"User: {content}\n")
            elif role == "assistant":
                parts.append(f"Assistant: {content}\n")
        parts.append("Assistant:")
        full_prompt = "\n".join(parts)

        # Gemini's generate_content with stream=True is synchronous,
        # so we run it in a thread to avoid blocking the event loop.
        response = await asyncio.to_thread(
            model.generate_content,
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
            stream=True,
        )

        # response is an iterator of GenerateContentResponse chunks
        for chunk in response:
            text = getattr(chunk, "text", None)
            if text:
                yield {"type": "delta", "text": text}

        yield {"type": "done"}

    except Exception as e:
        logger.exception("Gemini streaming error: %s", e)
        yield {"type": "delta", "text": "AI streaming error. Try again."}
        yield {"type": "done"}
