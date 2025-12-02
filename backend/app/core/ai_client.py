# app/core/ai_client.py
from typing import AsyncGenerator, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = settings.AI_SYSTEM_PROMPT


async def ask_ai(prompt: str, temperature: float = 0.7, max_tokens: int = 300) -> str:
    """
    Unified AI interface - automatically uses the provider specified in settings.AI_PROVIDER
    Supports: openai, gemini
    """
    if not prompt or not prompt.strip():
        return "Please provide a valid question."

    provider = settings.AI_PROVIDER.lower()
    
    try:
        if provider == "openai":
            return await _ask_openai(prompt, temperature, max_tokens)
        elif provider == "gemini":
            return await _ask_gemini(prompt, temperature, max_tokens)
        else:
            raise ValueError(f"Unknown AI provider: {provider}. Use 'openai' or 'gemini'")
    except Exception as e:
        logger.error(f"AI Provider ({provider}) error: {str(e)}")
        raise Exception(f"AI service error: {str(e)}")


# ============================================================
#                    OPENAI IMPLEMENTATION
# ============================================================

async def _ask_openai(prompt: str, temperature: float, max_tokens: int) -> str:
    from openai import AsyncOpenAI
    
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set in environment")
    
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
    
    return resp.choices[0].message.content


# ============================================================
#                    GEMINI IMPLEMENTATION
# ============================================================

async def _ask_gemini(prompt: str, temperature: float, max_tokens: int) -> str:
    import google.generativeai as genai
    
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in environment")
    
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
    full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {prompt}\nAssistant:"
    
    response = model.generate_content(
        full_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
    )
    
    return response.text


# ============================================================
#                    STREAMING (Optional - for later)
# ============================================================

async def stream_ai(messages: list, model: str = None, temperature: float = 0.7, max_tokens: int = 300) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Streaming support - can be implemented per provider later
    For now, just yields the full response
    """
    # Get the last user message
    last_message = messages[-1]["content"] if messages else ""
    
    # For now, just return the full response as one chunk
    response = await ask_ai(last_message, temperature, max_tokens)
    
    yield {"type": "delta", "text": response}
    yield {"type": "done"}