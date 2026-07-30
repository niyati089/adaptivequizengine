from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.endpoints.users import get_current_teacher
from app.models.user import User
from app.models.proctoring_event import ProctoringEvent
from app.database.session import get_db
from app.api.endpoints.proctoring import LOCKABLE_VIOLATION_TYPES, MAX_VIOLATIONS_BEFORE_LOCK

router = APIRouter()

@router.get("/dashboard")
def get_educator_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_teacher)
):
    students = db.query(User).filter(User.role == "student").all()
    
    student_list = []
    for student in students:
        events = db.query(ProctoringEvent).filter(
            (ProctoringEvent.user_id == student.id) | 
            (ProctoringEvent.session_id.like(f"session_{student.id}_%"))
        ).all()
        
        sessions_map = {}
        for event in events:
            sess_id = event.session_id
            if sess_id not in sessions_map:
                sessions_map[sess_id] = {
                    "session_id": sess_id,
                    "violations_count": 0,
                    "is_locked": False,
                    "events": []
                }
            
            sessions_map[sess_id]["events"].append({
                "id": event.id,
                "event_type": event.event_type,
                "timestamp": event.timestamp,
                "details": event.details
            })
            
            if event.event_type in LOCKABLE_VIOLATION_TYPES:
                sessions_map[sess_id]["violations_count"] += 1
                if sessions_map[sess_id]["violations_count"] >= MAX_VIOLATIONS_BEFORE_LOCK:
                    sessions_map[sess_id]["is_locked"] = True
                    
        student_list.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "sessions": list(sessions_map.values())
        })
        
    return {
        "students": student_list
    }
