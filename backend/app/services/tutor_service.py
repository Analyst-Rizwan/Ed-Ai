# backend/app/services/tutor_service.py
import tempfile
import os
import subprocess
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session

from app.core.ai_client import ask_ai, stream_ai
from app.db.models_tutor import Conversation, TutorMessage, Roadmap


# -------------------------
# Conversation memory utils
# -------------------------


def create_conversation(
    db: Session,
    user_id: Optional[int] = None,
    topic: Optional[str] = None,
) -> Conversation:
    conv = Conversation(user_id=user_id, topic=topic)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def add_message(db: Session, conv_id: int, role: str, content: str) -> TutorMessage:
    msg = TutorMessage(conversation_id=conv_id, role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_conversation_messages(db: Session, conv_id: int) -> List[TutorMessage]:
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    return conv.messages if conv else []


# -------------------------
# Topic detection (simple)
# -------------------------


async def detect_topic(prompt: str) -> str:
    p = (
        'Extract a short topic phrase (2-4 words) that best describes the user\'s '
        f'question: "{prompt}". Reply with ONLY the phrase.'
    )
    out = await ask_ai(p, max_tokens=20, temperature=0.0)
    return out.strip().strip('"').strip("'")[:150]


# -------------------------
# Prompt builders
# -------------------------


def build_contextual_messages(
    db: Session,
    conv_id: int,
    user_prompt: str,
    extra_system: Optional[str] = None,
) -> List[Dict[str, str]]:
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": extra_system or "You are EduAI, a friendly and clear tutor."}
    ]
    msgs = get_conversation_messages(db, conv_id)
    for m in msgs[-10:]:
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": user_prompt})
    return messages


# -------------------------
# MCQ generator
# -------------------------


async def generate_mcq(topic: str, difficulty: str = "medium", count: int = 5) -> Dict[str, Any]:
    """
    Returns a dict: {topic, questions: [{question, choices: [...], answer_index, explanation}]}
    """
    prompt = (
        f"Create {count} multiple-choice questions for topic '{topic}' "
        f"at {difficulty} difficulty. For each question give 4 choices, mark correct answer index (0-3), "
        "and a 1-2 sentence explanation. Return JSON ONLY in this format: "
        '{"questions": [{"question":"...","choices":["a","b","c","d"],"answer_index":0,"explanation":"..."}]}'
    )
    out = await ask_ai(prompt, max_tokens=800, temperature=0.2)

    import json

    try:
        return json.loads(out)
    except Exception:
        return {"raw": out}


# -------------------------
# Roadmap helpers
# -------------------------


def get_roadmap_for_topic(db: Session, topic: str):
    q = (
        db.query(Roadmap)
        .filter(Roadmap.topic.ilike(f"%{topic}%"))
        .order_by(Roadmap.ordering)
        .all()
    )
    return q


# -------------------------
# Code execution (sandboxed)
# -------------------------


def run_python_safely(code: str, timeout: int = 5) -> Dict[str, Any]:
    """
    Execute python code in a temporary directory, with timeouts.
    WARNING: This is a limited sandbox using subprocess with timeout.
    It restricts CPU time via timeout and uses a fresh temp dir.
    Do NOT allow untrusted users without stronger sandboxing (containers).
    """
    tmpdir = tempfile.mkdtemp(prefix="exec_")
    fname = os.path.join(tmpdir, "main.py")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(code)

    try:
        proc = subprocess.run(
            ["python", fname],
            cwd=tmpdir,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Timeout after {timeout}s", "returncode": -1}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -2}
    finally:
        try:
            import shutil

            shutil.rmtree(tmpdir)
        except Exception:
            pass
