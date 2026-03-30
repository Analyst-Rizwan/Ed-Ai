# backend/app/api/routes_school.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, AsyncIterator
import json
import asyncio
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth.dependencies import get_current_user
from app.core.ai_client import stream_ai
from app.db.session import get_db
from app.services import tutor_service
from app.core.rate_limit import limiter
from app.db.models_tutor import Conversation, TutorMessage
# In future, import SchoolProgress to fetch dashboard stats

logger = logging.getLogger("app.api.routes_school")
router = APIRouter()

class ChatPayload(BaseModel):
    message: str
    conversation_id: Optional[int] = None

SCHOOL_SYSTEM_PROMPT = """You are EduAI, a friendly and clear tutor for Class 9-10 students in India.
Follow these rules strictly:
1. Speak at a Class 9-10 reading level. No complex technical jargon unless you're explaining that exact term.
2. Use the Socratic method: ask guiding questions ('What do you think happens if...') rather than just giving the final answer.
3. Use simple, concrete, relatable examples using Indian context (like autos, local shops, cricket, tiffin).
4. Never say 'that's wrong'. Instead say 'Almost! Let's think about it differently...'
5. If the student is stuck, break the problem into the smallest possible step.
Keep your responses very concise (1-3 short paragraphs max)."""


@router.post("/chat/stream", summary="Streaming AI chat tailored for school students (SSE)")
@limiter.limit("15/minute") # Slightly higher limit for pilot testing
async def school_chat_stream(
    request: Request,
    req: ChatPayload,
    db: Session = Depends(get_db),
):
    """
    Real-time streaming chat endpoint using Server-Sent Events (SSE).
    Injects the specialized Class 9-10 system prompt.
    NOTE: Open access for pilot batch users.
    """
    try:
        conv_id = req.conversation_id
        if conv_id is None:
            # Create anon conversation for pilot
            conv = tutor_service.create_conversation(db, user_id=None, topic="school_module_1")
            conv_id = conv.id

        # Save user message immediately
        tutor_service.add_message(db, conv_id, "user", req.message)

        # Build contextual messages with custom system prompt
        messages = tutor_service.build_contextual_messages(
            db, 
            conv_id, 
            req.message,
            extra_system=SCHOOL_SYSTEM_PROMPT
        )

    except Exception as e:
        logger.exception("school_chat_stream setup error: %s", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    async def event_generator() -> AsyncIterator[str]:
        # Send conversation ID first so frontend can track it
        yield f"data: {json.dumps({'type': 'conv', 'conversation_id': conv_id})}\n\n"

        full_text_parts = []
        try:
            # Note: We use Haiku (via stream_ai defaults usually) or just the default model
            async for evt in stream_ai(messages=messages, temperature=0.6, max_tokens=1024):
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
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/dashboard", summary="Coordinator Dashboard Metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics for the NGO coordinator dashboard for Sprint 3.
    """
    # For Sprint 3 pilot, we just fetch all students in the PILOT1 batch 
    # and their progress records from the database.
    
    # Ideally, we query `school_students` and `school_progress` tables.
    # Since those models may not be in models/__init__.py for SQLAlchemy yet,
    # we'll execute a raw SQL query or use the existing mapping if it's there.
    
    from sqlalchemy import text
    
    try:
        # Get total enrolled in PILOT1
        enrolled_query = text("SELECT COUNT(*) FROM school_students ss JOIN school_batches sb ON ss.batch_id = sb.id WHERE sb.code = 'PILOT1'")
        enrolled_count = db.execute(enrolled_query).scalar() or 0
        
        # Get progress details
        progress_query = text('''
            SELECT 
                u.id as user_id, 
                ARRAY_LENGTH(sp.stage_completed, 1) as stages_done,
                sp.quiz_score,
                sp.completed_at
            FROM school_progress sp
            JOIN school_students ss ON sp.student_id = ss.user_id
            JOIN school_batches sb ON ss.batch_id = sb.id
            JOIN users u ON ss.user_id = u.id
            WHERE sb.code = 'PILOT1'
        ''')
        progress_records = db.execute(progress_query).mappings().fetchall()
        
        # Calculate derived metrics
        active_count = len(progress_records)
        completed_count = sum(1 for r in progress_records if r.completed_at is not None)
        
        scores = [r.quiz_score for r in progress_records if r.quiz_score is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0
        
        students_data = []
        for i, r in enumerate(progress_records):
            students_data.append({
                "id": str(r.user_id),
                "name": f"Student {i+1}", # Anonymized for pilot demo
                "stages_completed": r.stages_done or 0,
                "quiz_score": r.quiz_score,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None
            })
            
        return {
            "batch_code": "PILOT1",
            "enrolled": enrolled_count,
            "active": active_count,
            "completed": completed_count,
            "average_score": avg_score,
            "students": students_data
        }
    except Exception as e:
        logger.exception("Dashboard error: %s", e)
        # Fallback dummy data if tables don't exist yet
        return {
             "batch_code": "PILOT1",
             "enrolled": 0,
             "active": 0,
             "completed": 0,
             "average_score": 0,
             "students": []
        }
