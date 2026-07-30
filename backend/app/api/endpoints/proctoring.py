from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from collections import deque
import threading
from app.database.session import get_db
from app.models.proctoring_event import ProctoringEvent
from app.api.endpoints.users import get_current_user, get_current_teacher
from app.models.user import User

router = APIRouter()

# Max warnings before session is considered locked
MAX_VIOLATIONS_BEFORE_LOCK = 2

# Violation event types that count toward the lock threshold
LOCKABLE_VIOLATION_TYPES = {"TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_ATTEMPT", "PASTE_ATTEMPT"}


class ProctoringEventRequest(BaseModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = "default_session"
    event_type: str  # e.g., NO_FACE_DETECTED, TAB_SWITCH
    timestamp: Optional[str] = None
    details: Optional[str] = None


# ─── Thread-safe fallback log (Fix 4) ────────────────────────────────────────
# Replaced List[dict] with a bounded deque — thread-safe for append, auto-evicts
# old entries at maxlen=500, no memory leak.
_fallback_lock = threading.Lock()
_in_memory_logs: deque = deque(maxlen=500)


def _count_lockable_violations(events) -> int:
    """Count events that contribute toward session lock threshold."""
    return sum(1 for ev in events if ev.get("event_type") in LOCKABLE_VIOLATION_TYPES)


@router.post("/log")
async def log_proctoring_event(req: ProctoringEventRequest, db: Session = Depends(get_db)):
    """
    Log a proctoring violation or activity event.
    """
    try:
        db_event = ProctoringEvent(
            user_id=req.user_id,
            session_id=req.session_id,
            event_type=req.event_type,
            timestamp=req.timestamp,
            details=req.details
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return {"status": "success", "event_id": db_event.id, "event_type": req.event_type}
    except Exception:
        # Fallback to bounded in-memory deque — thread-safe append, no memory leak
        log_entry = {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "event_type": req.event_type,
            "timestamp": req.timestamp,
            "details": req.details
        }
        _in_memory_logs.append(log_entry)
        return {"status": "success (fallback)", "event_type": req.event_type}


@router.get("/summary/{session_id}")
async def get_session_proctoring_summary(session_id: str, db: Session = Depends(get_db)):
    """
    Retrieve proctoring violation summary for educator review.
    """
    try:
        events = db.query(ProctoringEvent).filter(ProctoringEvent.session_id == session_id).all()
        summary = {}
        for ev in events:
            summary[ev.event_type] = summary.get(ev.event_type, 0) + 1
        event_dicts = [
            {"event_type": ev.event_type, "timestamp": ev.timestamp, "details": ev.details}
            for ev in events
        ]
        lockable_count = sum(1 for ev in events if ev.event_type in LOCKABLE_VIOLATION_TYPES)
        return {
            "session_id": session_id,
            "total_violations": len(events),
            "lockable_violation_count": lockable_count,
            "is_locked": lockable_count >= MAX_VIOLATIONS_BEFORE_LOCK,
            "breakdown": summary,
            "events": event_dicts
        }
    except Exception:
        with _fallback_lock:
            filtered = [e for e in _in_memory_logs if e["session_id"] == session_id]
        summary = {}
        for ev in filtered:
            summary[ev["event_type"]] = summary.get(ev["event_type"], 0) + 1
        lockable_count = _count_lockable_violations(filtered)
        return {
            "session_id": session_id,
            "total_violations": len(filtered),
            "lockable_violation_count": lockable_count,
            "is_locked": lockable_count >= MAX_VIOLATIONS_BEFORE_LOCK,
            "breakdown": summary,
            "events": filtered
        }


@router.get("/is-locked/{session_id}")
async def get_session_lock_status(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fast check: is this session locked due to integrity violations?
    Used by the quiz/generate endpoint before serving new questions.
    Returns: { is_locked: bool, violation_count: int }
    """
    try:
        events = db.query(ProctoringEvent).filter(
            ProctoringEvent.session_id == session_id,
            ProctoringEvent.event_type.in_(list(LOCKABLE_VIOLATION_TYPES))
        ).all()
        lockable_count = len(events)
        return {
            "session_id": session_id,
            "violation_count": lockable_count,
            "is_locked": lockable_count >= MAX_VIOLATIONS_BEFORE_LOCK
        }
    except Exception:
        with _fallback_lock:
            filtered = [
                e for e in _in_memory_logs
                if e["session_id"] == session_id and e["event_type"] in LOCKABLE_VIOLATION_TYPES
            ]
        lockable_count = len(filtered)
        return {
            "session_id": session_id,
            "violation_count": lockable_count,
            "is_locked": lockable_count >= MAX_VIOLATIONS_BEFORE_LOCK
        }


@router.delete("/reset/{session_id}")
async def reset_session_proctoring(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    """
    Clear all proctoring events for a student's session to unlock their quiz.
    Teacher/Educator permission required.
    """
    db_cleared = False
    in_memory_cleared = 0

    # 1. Clear database events
    try:
        deleted_count = db.query(ProctoringEvent).filter(
            ProctoringEvent.session_id == session_id
        ).delete(synchronize_session=False)
        db.commit()
        db_cleared = True
        print(f"[Proctoring Reset] Deleted {deleted_count} events from DB for {session_id}")
    except Exception as e:
        print(f"[Proctoring Reset] DB delete failed: {e}")

    # 2. Clear fallback in-memory logs (thread-safe)
    with _fallback_lock:
        initial_len = len(_in_memory_logs)
        # Keep logs that do NOT match this session_id
        filtered_logs = [e for e in _in_memory_logs if e["session_id"] != session_id]
        _in_memory_logs.clear()
        _in_memory_logs.extend(filtered_logs)
        in_memory_cleared = initial_len - len(_in_memory_logs)
        if in_memory_cleared > 0:
            print(f"[Proctoring Reset] Cleared {in_memory_cleared} in-memory fallback events")

    if not db_cleared and in_memory_cleared == 0:
        raise HTTPException(
            status_code=500,
            detail="Failed to clear session proctoring events."
        )

    return {
        "status": "success",
        "message": f"Successfully unlocked and reset proctoring for session {session_id}",
        "session_id": session_id
    }
