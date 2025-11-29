# app/core/openai_client.py
from openai import AsyncOpenAI
from typing import AsyncGenerator, Dict, Any
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = getattr(settings, "AI_SYSTEM_PROMPT", "You are EduAI, a friendly AI mentor who explains concepts simply.")
DEFAULT_MODEL = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")


async def ask_ai(prompt: str, temperature: float = 0.7, max_tokens: int = 300, model: str = DEFAULT_MODEL) -> str:
    """
    Simple non-streaming completion (for quick calls).
    """
    if not prompt or not prompt.strip():
        return "Please provide a valid question."

    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message["content"]
    except Exception as e:
        return f"(AI Error) {e}"


async def stream_ai(messages: list, model: str = DEFAULT_MODEL, temperature: float = 0.7, max_tokens: int = 300) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Streams tokens / chunks from the model. Yields dicts like {"type": "delta", "text": "..."}.
    The frontend can consume these and render them as a typing effect.
    """
    try:
        # the new SDK uses .chat.completions.stream for streaming (async iterator)
        async for event in client.chat.completions.stream(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            # event has structured pieces; adapt to what's returned
            # yield only textual deltas and final event
            yield event
    except Exception as e:
        yield {"type": "error", "error": str(e)}
        return
