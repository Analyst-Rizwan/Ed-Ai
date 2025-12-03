# backend/app/api/routes_ai.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, Any, Dict, AsyncIterator
import json
import asyncio
import logging

from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.core.ai_client import ask_ai, stream_ai
from app.db.session import get_db
from app.services import tutor_service

logger = logging.getLogger("app.api.routes_ai")
router = APIRouter()

# ---------------------------
# Request/response models
# ---------------------------


class AskRequest(BaseModel):
    prompt: str
    conversation_id: Optional[int] = None


class ChatPayload(BaseModel):
    """
    Compatibility payload: older frontend might post { "message": "..." } to /api/ai/chat.
    """
    message: str
    conversation_id: Optional[int] = None


class MCQRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 5


class CodeExecRequest(BaseModel):
    language: str
    code: str
    timeout: Optional[int] = 5


# ---------------------------
# Helper utilities
# ---------------------------


async def _safe_ask_ai(prompt: str, temperature: float = 0.7, max_tokens: int = 450) -> str:
    """
    Wrapper around ask_ai that centralizes error handling.
    """
    try:
        answer = await ask_ai(prompt=prompt, temperature=temperature, max_tokens=max_tokens)
        if not isinstance(answer, str):
            answer = str(answer)
        return answer
    except Exception as e:
        logger.exception("OpenAI ask_ai failed: %s", e)
        raise HTTPException(status_code=500, detail="AI backend error")


# ---------------------------
# Diagnostic root
# ---------------------------


@router.get("/", summary="AI router root (diagnostic)")
def ai_root():
    return {"status": "ai router mounted"}


# ---------------------------
# Test endpoint (no auth required)
# ---------------------------


@router.post("/test", summary="Test AI (no auth required)")
async def test_ai(req: AskRequest):
    """
    Test endpoint for AI tutor without authentication.
    Used for debugging and testing.
    """
    try:
        if not req.prompt:
            return {"response": "Please provide a prompt"}

        answer = await _safe_ask_ai(prompt=req.prompt, temperature=0.7, max_tokens=450)
        return {"response": answer}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("test_ai error: %s", e)
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ---------------------------
# Main endpoints
# ---------------------------


@router.post("/ask", summary="Ask the AI (non-streaming)")
async def ask_question(
    req: AskRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Simple non-streaming ask endpoint. Saves to conversation memory if conversation_id provided.
    Request body: { "prompt": "...", "conversation_id": 123 (optional) }
    Returns: { "response": "...", "conversation_id": n }
    """
    try:
        conv_id = req.conversation_id
        if conv_id is None:
            conv = tutor_service.create_conversation(db, user_id=getattr(user, "id", None))
            conv_id = conv.id

        tutor_service.add_message(db, conv_id, "user", req.prompt)

        answer = await _safe_ask_ai(prompt=req.prompt, temperature=0.7, max_tokens=450)

        tutor_service.add_message(db, conv_id, "assistant", answer)

        return {"response": answer, "conversation_id": conv_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ask_question error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat", summary="Compatibility /chat endpoint (accepts { message }) - NO AUTH")
async def chat_compat(req: ChatPayload, db: Session = Depends(get_db)):
    """
    Backwards-compatible endpoint for older frontends that POST { "message": "..." } to /api/ai/chat.
    Authentication temporarily disabled for testing.
    The frontend expects: { reply: string, conversation_id: number }
    """
    try:
        conv_id = req.conversation_id
        if conv_id is None:
            conv = tutor_service.create_conversation(db, user_id=None)
            conv_id = conv.id

        tutor_service.add_message(db, conv_id, "user", req.message)

        answer = await _safe_ask_ai(prompt=req.message, temperature=0.7, max_tokens=450)

        tutor_service.add_message(db, conv_id, "assistant", answer)

        # IMPORTANT: 'reply' key matches frontend/src/lib/ai.ts expectation
        return {"reply": answer, "conversation_id": conv_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("chat_compat error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


# ---------------------------
# Streaming (SSE) endpoint
# ---------------------------


@router.get("/stream/{conv_id}", summary="Stream a model response (SSE)")
async def stream_response(
    conv_id: int,
    request: Request,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Streams a model response as server-sent events (SSE).
    Example client: use EventSource('/api/ai/stream/123') and parse events.
    """

    async def event_generator() -> AsyncIterator[str]:
        msgs = tutor_service.get_conversation_messages(db, conv_id)
        if not msgs:
            yield "data: " + json.dumps({"error": "conversation not found"}) + "\n\n"
            return

        messages = tutor_service.build_contextual_messages(db, conv_id, msgs[-1].content)

        try:
            async for evt in stream_ai(messages=messages, temperature=0.7, max_tokens=600):
                try:
                    payload = json.dumps({"event": evt})
                except Exception:
                    payload = json.dumps({"event": str(evt)})
                yield f"data: {payload}\n\n"

                if await request.is_disconnected():
                    break
        except asyncio.CancelledError:
            logger.info("SSE client disconnected (CancelledError) for conv_id=%s", conv_id)
        except Exception as e:
            logger.exception("stream_ai error: %s", e)
            yield "data: " + json.dumps({"error": "AI streaming error"}) + "\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ---------------------------
# Conversation endpoints
# ---------------------------


@router.post("/conversations", summary="Create a conversation")
def create_conversation(user=Depends(get_current_user), db: Session = Depends(get_db)):
    conv = tutor_service.create_conversation(db, user_id=getattr(user, "id", None))
    return {"conversation_id": conv.id}


@router.get("/conversations/{conv_id}", summary="Get conversation messages")
def get_conversation(conv_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    msgs = tutor_service.get_conversation_messages(db, conv_id)
    return {
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in msgs
        ]
    }


# ---------------------------
# MCQ generator
# ---------------------------


@router.post("/mcq", summary="Generate MCQs for a topic")
async def create_mcq(req: MCQRequest, user=Depends(get_current_user)):
    try:
        mcq = await tutor_service.generate_mcq(
            topic=req.topic,
            difficulty=req.difficulty,
            count=req.count,
        )
        return mcq
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("create_mcq error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate MCQ")


# ---------------------------
# Roadmap endpoint
# ---------------------------


@router.get("/roadmap/{topic}", summary="Get roadmap for a topic")
def roadmap(topic: str, user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        items = tutor_service.get_roadmap_for_topic(db, topic)
        return {
            "roadmap": [
                {
                    "id": r.id,
                    "title": r.title,
                    "content": r.content,
                    "ordering": r.ordering,
                }
                for r in items
            ]
        }
    except Exception as e:
        logger.exception("roadmap error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to fetch roadmap")


# ---------------------------
# Code execution endpoint
# ---------------------------


@router.post("/code", summary="Execute code (safe sandbox for python)")
def run_code(req: CodeExecRequest, user=Depends(get_current_user)):
    """
    Executes code with tutor_service.run_python_safely
    Returns whatever tutor_service.run_python_safely returns (stdout/stderr/result).
    NOTE: current implementation only allows Python.
    """
    if req.language.lower() != "python":
        raise HTTPException(status_code=400, detail="Only python is supported (for now).")
    try:
        out = tutor_service.run_python_safely(req.code, timeout=req.timeout or 5)
        return out
    except Exception as e:
        logger.exception("run_code error: %s", e)
        raise HTTPException(status_code=500, detail="Code execution failed")
