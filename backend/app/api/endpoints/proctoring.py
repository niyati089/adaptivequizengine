from typing import Optional, Literal
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.endpoints.users import get_current_student, get_current_teacher
from app.database.session import get_db
from app.models.attempt import QuestionAttempt
from app.models.classroom import Classroom, ClassroomQuiz
from app.models.proctoring import ProctoringEvent
from app.models.user import User

router = APIRouter()

class ProctoringEventCreate(BaseModel):
    classroom_quiz_id: int
    event_type: Literal[
        "tab_switch", "copy", "paste", "context_menu", "window_blur",
        "no_face_detected", "multiple_people", "phone_detected",
        "paper_detected", "looking_away"
    ]
    event_data: Optional[str] = None
    attempt_id: Optional[int] = None
    severity: Literal["low", "medium", "high", "critical"] = "medium"
    confidence: Optional[int] = Field(None, ge=0, le=100, description="AI confidence (0-100)")
    session_token: Optional[str] = None  # Token to group events from same quiz attempt

class ProctoringEventResponse(BaseModel):
    event_id: int
    warning_count: int
    max_warnings: int
    exceeded: bool
    severity: str
    confidence: Optional[int]
    session_token: str  # Return token for client to include in future events

class ProctoringSessionStartResponse(BaseModel):
    session_token: str
    quiz_id: int
    max_warnings: int

@router.post("/session/start")
def start_proctoring_session(
    classroom_quiz_id: int,
    student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Start a new proctoring session for a quiz attempt.
    
    Returns a session token that should be included in all proctoring events
    for this quiz. This ensures violations are tracked per quiz attempt,
    not accumulated across all attempts.
    """
    quiz = db.query(ClassroomQuiz).filter(
        ClassroomQuiz.id == classroom_quiz_id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not quiz.enable_proctoring:
        raise HTTPException(
            status_code=400,
            detail="Proctoring is not enabled for this quiz"
        )

    session_token = str(uuid.uuid4())
    
    return ProctoringSessionStartResponse(
        session_token=session_token,
        quiz_id=classroom_quiz_id,
        max_warnings=quiz.max_proctoring_warnings or 3
    )

@router.post("/event", response_model=ProctoringEventResponse)
def record_proctoring_event(
    event: ProctoringEventCreate,
    student: User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Record a proctoring event during a quiz attempt.

    Supports both browser-based events (tab switch, copy/paste) and
    AI vision-based events (face detection, object detection, gaze tracking).

    Returns the current warning count and whether the threshold has been exceeded.
    The session_token ensures violations are isolated per quiz attempt.
    """
    # Verify the quiz exists and has proctoring enabled
    quiz = db.query(ClassroomQuiz).filter(
        ClassroomQuiz.id == event.classroom_quiz_id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not quiz.enable_proctoring:
        raise HTTPException(
            status_code=400,
            detail="Proctoring is not enabled for this quiz"
        )

    # Use session token if provided, otherwise generate one (for backward compatibility)
    session_token = event.session_token or str(uuid.uuid4())

    # Auto-assign severity based on event type if not provided
    severity_map = {
        "tab_switch": "low",
        "window_blur": "low",
        "looking_away": "low",
        "copy": "medium",
        "paste": "medium",
        "context_menu": "medium",
        "no_face_detected": "high",
        "phone_detected": "high",
        "paper_detected": "high",
        "multiple_people": "critical"
    }

    final_severity = severity_map.get(event.event_type, event.severity)

    # Create the proctoring event
    proctoring_event = ProctoringEvent(
        user_id=student.id,
        classroom_quiz_id=event.classroom_quiz_id,
        attempt_id=event.attempt_id,
        event_type=event.event_type,
        event_data=event.event_data,
        severity=final_severity,
        confidence=event.confidence,
        is_false_positive=False,
        session_token=session_token
    )
    db.add(proctoring_event)
    db.commit()
    db.refresh(proctoring_event)

    # Count events ONLY from the current session
    # This ensures violations are per quiz attempt, not accumulated
    # We filter by session_token to isolate events within this quiz session
    
    # For new session-based tracking: only count events with the same session token
    # This prevents accumulation from previous quiz attempts
    try:
        warning_count = db.query(func.count(ProctoringEvent.id)).filter(
            ProctoringEvent.user_id == student.id,
            ProctoringEvent.classroom_quiz_id == event.classroom_quiz_id,
            ProctoringEvent.session_token == session_token,  # Same session only
            ProctoringEvent.is_false_positive == False,  # Don't count false positives
        ).scalar() or 0
    except Exception as e:
        # Fallback if session_token column doesn't exist yet (migration not run)
        # This will be removed after migration is confirmed to have run
        print(f"[Proctoring] Warning: session_token query failed, using fallback: {e}")
        # Count all violations for this user+quiz (pre-session-based tracking)
        warning_count = db.query(func.count(ProctoringEvent.id)).filter(
            ProctoringEvent.user_id == student.id,
            ProctoringEvent.classroom_quiz_id == event.classroom_quiz_id,
            ProctoringEvent.is_false_positive == False
        ).scalar() or 0

    max_warnings = quiz.max_proctoring_warnings or 3
    exceeded = warning_count >= max_warnings

    return ProctoringEventResponse(
        event_id=proctoring_event.id,
        warning_count=warning_count,
        max_warnings=max_warnings,
        exceeded=exceeded,
        severity=final_severity,
        confidence=event.confidence,
        session_token=session_token
    )

@router.patch("/event/{event_id}/mark-false-positive")
def mark_false_positive(
    event_id: int,
    is_false_positive: bool,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Allow teachers to mark proctoring events as false positives."""
    event = db.query(ProctoringEvent).options(
        joinedload(ProctoringEvent.quiz).joinedload(ClassroomQuiz.classroom)
    ).filter(
        ProctoringEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Verify teacher owns this quiz
    quiz = event.quiz
    if not quiz or not quiz.classroom:
        raise HTTPException(
            status_code=404,
            detail="Quiz or classroom not found for this event"
        )
    if quiz.classroom.teacher_id != teacher.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to modify this event"
        )

    event.is_false_positive = is_false_positive
    db.commit()

    return {"success": True, "event_id": event_id, "is_false_positive": is_false_positive}

@router.get("/quiz/{quiz_id}/events")
def get_quiz_proctoring_events(
    quiz_id: int,
    student_id: Optional[int] = None,
    include_false_positives: bool = True,
    severity_filter: Optional[str] = None,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Get all proctoring events for a specific quiz with filtering options."""
    # Verify the teacher owns this quiz
    quiz = db.query(ClassroomQuiz).options(
        joinedload(ClassroomQuiz.classroom)
    ).filter(
        ClassroomQuiz.id == quiz_id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not quiz.classroom or quiz.classroom.teacher_id != teacher.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this quiz's proctoring data"
        )

    # Build query with filters
    query = db.query(ProctoringEvent).options(
        joinedload(ProctoringEvent.user)
    ).filter(
        ProctoringEvent.classroom_quiz_id == quiz_id
    )

    if student_id:
        query = query.filter(ProctoringEvent.user_id == student_id)

    if not include_false_positives:
        query = query.filter(ProctoringEvent.is_false_positive == False)

    if severity_filter:
        query = query.filter(ProctoringEvent.severity == severity_filter)

    events = query.order_by(ProctoringEvent.timestamp.desc()).all()

    # Group events by student
    students_data = {}
    for event in events:
        if event.user_id not in students_data:
            student_name = "Unknown"
            student_email = "unknown@example.com"
            
            if event.user:
                student_name = event.user.name
                student_email = event.user.email
            
            students_data[event.user_id] = {
                "student_id": event.user_id,
                "student_name": student_name,
                "student_email": student_email,
                "total_events": 0,
                "events_by_type": {},
                "events_by_severity": {"low": 0, "medium": 0, "high": 0, "critical": 0},
                "events": []
            }

        students_data[event.user_id]["total_events"] += 1

        event_type = event.event_type
        if event_type not in students_data[event.user_id]["events_by_type"]:
            students_data[event.user_id]["events_by_type"][event_type] = 0
        students_data[event.user_id]["events_by_type"][event_type] += 1

        students_data[event.user_id]["events_by_severity"][event.severity] += 1

        students_data[event.user_id]["events"].append({
            "id": event.id,
            "event_type": event.event_type,
            "event_data": event.event_data,
            "severity": event.severity,
            "confidence": event.confidence,
            "is_false_positive": event.is_false_positive,
            "timestamp": event.timestamp.isoformat() if hasattr(event.timestamp, 'isoformat') else str(event.timestamp),
            "attempt_id": event.attempt_id
        })

    return {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "max_warnings": quiz.max_proctoring_warnings,
        "students": list(students_data.values())
    }

@router.get("/student/{student_id}/flagged")
def get_student_flagged_attempts(
    student_id: int,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Get all quiz attempts where a student exceeded the proctoring warning threshold."""
    # Verify teacher has access to this student
    from app.models.classroom import ClassEnrollment

    enrollment = (
        db.query(ClassEnrollment)
        .join(Classroom, ClassEnrollment.classroom_id == Classroom.id)
        .filter(
            ClassEnrollment.student_id == student_id,
            ClassEnrollment.status == "approved",
            Classroom.teacher_id == teacher.id
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view this student's data"
        )

    # Get all proctoring events for this student (excluding false positives)
    events = db.query(ProctoringEvent).options(
        joinedload(ProctoringEvent.quiz).joinedload(ClassroomQuiz.classroom)
    ).filter(
        ProctoringEvent.user_id == student_id,
        ProctoringEvent.is_false_positive == False
    ).all()

    # Group by quiz and check if exceeded threshold
    quiz_data = {}
    for event in events:
        quiz_id = event.classroom_quiz_id
        
        # Skip events without a classroom_quiz_id (legacy data)
        if quiz_id is None:
            continue
            
        if quiz_id not in quiz_data:
            quiz = event.quiz
            quiz_title = "Unknown Quiz"
            classroom_id = None
            classroom_name = "Unknown Classroom"
            max_warnings = 3
            
            if quiz:
                quiz_title = quiz.title
                classroom_id = quiz.classroom_id
                max_warnings = quiz.max_proctoring_warnings
                if quiz.classroom:
                    classroom_name = quiz.classroom.name
            
            quiz_data[quiz_id] = {
                "quiz_id": quiz_id,
                "quiz_title": quiz_title,
                "classroom_id": classroom_id,
                "classroom_name": classroom_name,
                "max_warnings": max_warnings,
                "event_count": 0,
                "critical_count": 0,
                "high_count": 0,
                "exceeded": False,
                "events": []
            }

        quiz_data[quiz_id]["event_count"] += 1
        if event.severity == "critical":
            quiz_data[quiz_id]["critical_count"] += 1
        elif event.severity == "high":
            quiz_data[quiz_id]["high_count"] += 1

        quiz_data[quiz_id]["events"].append({
            "id": event.id,
            "event_type": event.event_type,
            "event_data": event.event_data,
            "severity": event.severity,
            "confidence": event.confidence,
            "timestamp": event.timestamp.isoformat()
        })

    # Filter to only flagged quizzes
    flagged = []
    for quiz_id, data in quiz_data.items():
        if data["event_count"] > data["max_warnings"]:
            data["exceeded"] = True
            flagged.append(data)

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "student_id": student_id,
        "student_name": student.name,
        "student_email": student.email,
        "flagged_quizzes": flagged,
        "total_flagged": len(flagged)
    }
