# backend/app/api/routes_ai.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, Any, Dict, AsyncIterator
import json
import asyncio
import logging

from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.ai_client import ask_ai, stream_ai
from app.db.session import get_db
from app.services import tutor_service
from app.core.rate_limit import limiter

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


class ContextualChatPayload(BaseModel):
    """
    Extended chat payload that includes workspace context (code, language, system design state)
    for the inline AI tutor embedded in the Playground and System Design Simulator.
    """
    message: str
    conversation_id: Optional[int] = None
    context_type: Optional[str] = None  # "playground" or "system_design"
    code: Optional[str] = None
    language: Optional[str] = None
    system_design_state: Optional[Dict[str, Any]] = None


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
# [REMOVED] /test endpoint — was unauthenticated (VULN-02)
# Use /ask with auth instead.
# ------------------------------------------------------
# Main endpoints
# ---------------------------


@router.post("/ask", summary="Ask the AI (non-streaming)")
@limiter.limit("10/minute")
async def ask_question(
    request: Request,
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


@router.post("/chat", summary="Compatibility /chat endpoint (accepts { message })")
@limiter.limit("10/minute")
async def chat_compat(request: Request, req: ChatPayload, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Backwards-compatible endpoint for older frontends that POST { "message": "..." } to /api/ai/chat.
    The frontend expects: { reply: string, conversation_id: number }
    """
    try:
        conv_id = req.conversation_id
        if conv_id is None:
            conv = tutor_service.create_conversation(db, user_id=getattr(user, "id", None))
            conv_id = conv.id

        tutor_service.add_message(db, conv_id, "user", req.message)

        answer = await _safe_ask_ai(prompt=req.message, temperature=0.7, max_tokens=1024)

        tutor_service.add_message(db, conv_id, "assistant", answer)

        # IMPORTANT: 'reply' key matches frontend/src/lib/ai.ts expectation
        return {"reply": answer, "conversation_id": conv_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("chat_compat error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat/stream", summary="Streaming chat (SSE) — tokens appear as generated")
@limiter.limit("10/minute")
async def chat_stream(
    request: Request,
    req: ChatPayload,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Real-time streaming chat endpoint using Server-Sent Events (SSE).

    Streams tokens as they're generated by the AI model, then saves
    the complete response to the conversation history.

    SSE events:
      data: {"type":"conv","conversation_id":123}   ← sent first
      data: {"type":"delta","text":"Hello"}          ← token chunks
      data: {"type":"done","full_text":"Hello ..."}  ← final event
    """
    try:
        conv_id = req.conversation_id
        if conv_id is None:
            conv = tutor_service.create_conversation(db, user_id=getattr(user, "id", None))
            conv_id = conv.id

        # Save user message immediately
        tutor_service.add_message(db, conv_id, "user", req.message)

        # Build contextual messages with conversation history
        messages = tutor_service.build_contextual_messages(db, conv_id, req.message)

    except Exception as e:
        logger.exception("chat_stream setup error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    async def event_generator() -> AsyncIterator[str]:
        # Send conversation ID first so frontend can track it
        yield f"data: {json.dumps({'type': 'conv', 'conversation_id': conv_id})}\n\n"

        full_text_parts = []
        try:
            async for evt in stream_ai(messages=messages, temperature=0.7, max_tokens=1024):
                if await request.is_disconnected():
                    break

                if evt.get("type") == "delta":
                    text = evt.get("text", "")
                    full_text_parts.append(text)
                    yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"

                elif evt.get("type") == "done":
                    full_text = "".join(full_text_parts).strip()
                    # Save complete assistant response to DB
                    if full_text:
                        tutor_service.add_message(db, conv_id, "assistant", full_text)
                    yield f"data: {json.dumps({'type': 'done', 'full_text': full_text})}\n\n"

        except asyncio.CancelledError:
            logger.info("SSE client disconnected for conv_id=%s", conv_id)
            # Still save what we have
            partial = "".join(full_text_parts).strip()
            if partial:
                tutor_service.add_message(db, conv_id, "assistant", partial)
        except Exception as e:
            logger.exception("stream_ai error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'message': 'AI streaming error'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx/Render proxy buffering
            "Connection": "keep-alive",
        },
    )


# ---------------------------
# Context-aware streaming (for inline AI tutor in Playground & System Design)
# ---------------------------


def _build_contextual_system_prompt(req: ContextualChatPayload) -> str:
    """Build a rich system prompt that includes workspace context."""
    base = (
        "You are EduAI, an expert coding tutor embedded directly in the student's workspace. "
        "You can see their current code or system design. Be concise, helpful, and educational. "
        "Use markdown formatting. When showing code, use fenced code blocks with the correct language tag. "
        "If the student's code has errors, explain them clearly and suggest fixes."
    )

    if req.context_type == "playground" and req.code:
        lang = req.language or "unknown"
        code_snippet = req.code[:4000]  # limit context size
        base += (
            f"\n\n--- STUDENT'S CURRENT CODE ({lang}) ---\n"
            f"```{lang}\n{code_snippet}\n```\n"
            "--- END CODE ---\n"
            "Reference this code when answering. If they ask to debug, analyze the code above."
        )

    elif req.context_type == "system_design" and req.system_design_state:
        state = req.system_design_state
        nodes = state.get("nodes", [])
        connections = state.get("connections", [])
        node_summary = ", ".join(
            f"{n.get('label', n.get('type', '?'))} ({n.get('type', '?')})"
            for n in nodes[:20]
        )
        conn_summary = f"{len(connections)} connections"
        base += (
            f"\n\n--- STUDENT'S SYSTEM DESIGN ---\n"
            f"Components ({len(nodes)}): {node_summary}\n"
            f"Connections: {conn_summary}\n"
        )
        # Include metrics if simulation is running
        if any(n.get("metrics", {}).get("rps", 0) > 0 for n in nodes):
            metrics_lines = []
            for n in nodes[:15]:
                m = n.get("metrics", {})
                metrics_lines.append(
                    f"  {n.get('label','?')}: {m.get('rps',0)} rps, {m.get('latency',0)}ms latency, "
                    f"{m.get('cpu',0)}% CPU, {m.get('errorRate',0)}% errors"
                )
            base += "Live Metrics:\n" + "\n".join(metrics_lines) + "\n"
        base += (
            "--- END DESIGN ---\n"
            "Reference this design when answering. Help with architecture decisions, "
            "bottleneck analysis, scaling strategies, and system design interview concepts."
        )

    return base


@router.post("/chat/stream/contextual", summary="Context-aware streaming chat for inline AI tutor")
@limiter.limit("10/minute")
async def chat_stream_contextual(
    request: Request,
    req: ContextualChatPayload,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Context-aware streaming chat endpoint for the inline AI tutor.
    Accepts additional context (code, language, system design state) and injects
    it into the system prompt so the AI can give contextual assistance.
    """
    try:
        conv_id = req.conversation_id
        if conv_id is None:
            conv = tutor_service.create_conversation(db, user_id=getattr(user, "id", None))
            conv_id = conv.id

        tutor_service.add_message(db, conv_id, "user", req.message)

        # Build contextual system prompt
        system_prompt = _build_contextual_system_prompt(req)
        messages = tutor_service.build_contextual_messages(
            db, conv_id, req.message, extra_system=system_prompt
        )

    except Exception as e:
        logger.exception("chat_stream_contextual setup error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    async def event_generator() -> AsyncIterator[str]:
        yield f"data: {json.dumps({'type': 'conv', 'conversation_id': conv_id})}\n\n"

        full_text_parts = []
        try:
            async for evt in stream_ai(messages=messages, temperature=0.7, max_tokens=2048):
                if await request.is_disconnected():
                    break

                if evt.get("type") == "delta":
                    text = evt.get("text", "")
                    full_text_parts.append(text)
                    yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"

                elif evt.get("type") == "done":
                    full_text = "".join(full_text_parts).strip()
                    if full_text:
                        tutor_service.add_message(db, conv_id, "assistant", full_text)
                    yield f"data: {json.dumps({'type': 'done', 'full_text': full_text})}\n\n"

        except asyncio.CancelledError:
            logger.info("SSE client disconnected for contextual conv_id=%s", conv_id)
            partial = "".join(full_text_parts).strip()
            if partial:
                tutor_service.add_message(db, conv_id, "assistant", partial)
        except Exception as e:
            logger.exception("contextual stream_ai error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'message': 'AI streaming error'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


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
    # SECURITY: Verify conversation ownership (VULN-05 IDOR fix)
    from app.db.models_tutor import Conversation
    conv = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == getattr(user, "id", None),
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

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

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx/Render proxy buffering
            "Connection": "keep-alive",
        },
    )


# ---------------------------
# Conversation endpoints
# ---------------------------


@router.post("/conversations", summary="Create a conversation")
def create_conversation(user=Depends(get_current_user), db: Session = Depends(get_db)):
    conv = tutor_service.create_conversation(db, user_id=getattr(user, "id", None))
    return {"conversation_id": conv.id}


@router.get("/conversations", summary="List user conversations")
def list_conversations(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns all conversations for the current user, ordered by most recent first.
    Each includes a preview snippet and message count.
    """
    from app.db.models_tutor import Conversation, TutorMessage
    from sqlalchemy import func

    user_id = getattr(user, "id", None)
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )

    result = []
    for c in convs:
        msg_count = db.query(func.count(TutorMessage.id)).filter(TutorMessage.conversation_id == c.id).scalar()
        # Get the first user message as preview
        first_msg = (
            db.query(TutorMessage)
            .filter(TutorMessage.conversation_id == c.id, TutorMessage.role == "user")
            .order_by(TutorMessage.created_at.asc())
            .first()
        )
        preview = (first_msg.content[:80] + "...") if first_msg and len(first_msg.content) > 80 else (first_msg.content if first_msg else "")
        result.append({
            "id": c.id,
            "topic": c.topic,
            "preview": preview,
            "message_count": msg_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {"conversations": result}


@router.get("/conversations/{conv_id}", summary="Get conversation messages")
def get_conversation(conv_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # SECURITY: Verify conversation ownership (IDOR fix)
    from app.db.models_tutor import Conversation
    conv = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == getattr(user, "id", None),
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

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


@router.delete("/conversations/{conv_id}", summary="Delete a conversation")
def delete_conversation(conv_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a conversation and all its messages."""
    from app.db.models_tutor import Conversation

    conv = db.query(Conversation).filter(
        Conversation.id == conv_id,
        Conversation.user_id == getattr(user, "id", None),
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "deleted"}


# ---------------------------
# MCQ generator
# ---------------------------


@router.post("/mcq", summary="Generate MCQs for a topic")
@limiter.limit("5/minute")
async def create_mcq(request: Request, req: MCQRequest, user=Depends(get_current_user)):
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
@limiter.limit("5/minute")
def run_code(request: Request, req: CodeExecRequest, user=Depends(get_current_user)):
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
