from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from groq import Groq
import os
import json
import certifi
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.database.session import get_db
from app.database.connection import engine
from app.irt.theta_estimator import ThetaEstimator
from app.models.user import User
from app.api.endpoints.users import get_current_student, oauth2_scheme
from app.models.proctoring_event import ProctoringEvent
from app.models.attempt import QuestionAttempt

# Set SSL certificate path for Windows
if not os.environ.get('SSL_CERT_FILE'):
    os.environ['SSL_CERT_FILE'] = certifi.where()
    os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()

router = APIRouter()

# Must stay in sync with proctoring.py constant
_LOCKABLE_TYPES = {"TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_ATTEMPT", "PASTE_ATTEMPT"}
_MAX_VIOLATIONS = 2


class QuestionRequest(BaseModel):
    topic: str
    subtopic: str
    difficulty: float
    bloom_level: str
    previous_questions: list[str] = []
    api_key: Optional[str] = None
    enable_anti_cheating: Optional[bool] = True
    session_id: Optional[str] = None  # Required for lock enforcement when authenticated


class AnswerRequest(BaseModel):
    theta: float
    difficulty: float
    selected_option: str
    correct_answer: str
    topic: str
    subtopic: str
    question: str
    misconception: Optional[str] = None
    api_key: Optional[str] = None
    # New fields for complete question data
    question_options: Optional[dict] = None  # {A: "...", B: "...", C: "...", D: "..."}
    explanation: Optional[str] = None
    bloom_level: Optional[str] = None


def _check_session_locked(session_id: str, db: Session) -> bool:
    """
    Returns True if this session has reached the violation threshold.
    Checked server-side so client-side state manipulation cannot bypass it.
    """
    try:
        count = db.query(ProctoringEvent).filter(
            ProctoringEvent.session_id == session_id,
            ProctoringEvent.event_type.in_(list(_LOCKABLE_TYPES))
        ).count()
        return count >= _MAX_VIOLATIONS
    except Exception:
        # If DB is unavailable, fail open (allow question) — proctoring fallback handles logging
        return False


@router.post("/generate")
async def generate_question(
    req: QuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    # ── Fix 2: Server-side session lock check ──────────────────────────────────
    # Even if the client manipulates React state to set isLocked=false, the
    # backend will refuse to serve new questions if the DB shows ≥2 violations.
    if req.session_id:
        if _check_session_locked(req.session_id, db):
            raise HTTPException(
                status_code=403,
                detail="Session locked: integrity violations exceeded. No further questions will be served."
            )

    api_key = req.api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key required")

    import httpx
    # Disable SSL verification for development (Windows certificate issues)
    client = Groq(
        api_key=api_key,
        http_client=httpx.Client(verify=False)
    )
    difficulty_label = ThetaEstimator.theta_to_label(req.difficulty)
    avoid = "\n".join(f"- {q}" for q in req.previous_questions[-5:]) if req.previous_questions else "None"

    prompt = f"""Generate a single multiple-choice question for adaptive learning.

Topic: {req.topic}
Subtopic: {req.subtopic}
Difficulty level: {difficulty_label} (IRT b-parameter: {req.difficulty})
Bloom's Taxonomy level: {req.bloom_level}

Previously asked questions (DO NOT repeat these):
{avoid}

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "question": "The question text",
  "options": {{
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  }},
  "correct_answer": "A",
  "explanation": "Why this answer is correct, and what misconception each wrong answer represents",
  "difficulty": {req.difficulty},
  "bloom_level": "{req.bloom_level}",
  "misconceptions": {{
    "B": "What misunderstanding leads to choosing B",
    "C": "What misunderstanding leads to choosing C",
    "D": "What misunderstanding leads to choosing D"
  }}
}}

Calibration guide:
- Beginner (-3 to -1.5): recall definitions, identify basic concepts
- Elementary (-1.5 to -0.5): understand relationships, simple applications
- Intermediate (-0.5 to 0.5): apply concepts to new situations
- Advanced (0.5 to 1.5): analyze, compare, debug complex scenarios
- Expert (1.5 to 3): evaluate tradeoffs, synthesize, create solutions"""

    message = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    raw = message.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw, strict=False)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON parse error: {e}")

    # Optionally pass along an empty hint so frontend doesn't break
    if "hint" not in data:
        data["hint"] = "Think critically about the options presented."

    if req.enable_anti_cheating:
        from app.agents.question_gen import QuestionGenerationAgent
        from groq import AsyncGroq
        agent = QuestionGenerationAgent()
        if api_key:
            agent.client = AsyncGroq(
                api_key=api_key,
                http_client=httpx.AsyncClient(verify=False)
            )
        variant_data = await agent.generate_variant(data)
        return variant_data

    # For base questions, set is_variant to False
    data["is_variant"] = False
    return data



@router.post("/submit")
async def submit_answer(
    req: AnswerRequest,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    correct = req.selected_option == req.correct_answer
    new_theta = ThetaEstimator.update_theta(req.theta, correct, req.difficulty)
    next_difficulty = ThetaEstimator.select_next_difficulty(new_theta)

    bloom_order = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
    current_bloom_idx = bloom_order.index(req.subtopic.lower()) if req.subtopic.lower() in bloom_order else 1

    if correct and new_theta > req.theta + 0.1:
        next_bloom_idx = min(current_bloom_idx + 1, len(bloom_order) - 1)
    elif not correct and new_theta < req.theta - 0.1:
        next_bloom_idx = max(current_bloom_idx - 1, 0)
    else:
        next_bloom_idx = current_bloom_idx

    # Resolve user_id dynamically
    user_id = None
    if token:
        try:
            from jose import jwt
            from app.core.config import settings
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if email:
                user = db.query(User).filter(User.email == email).first()
                if user:
                    user_id = user.id
        except Exception:
            pass

    if not user_id:
        # Fallback/Autoseed student user for testing & local run compatibility
        first_student = db.query(User).filter(User.role == "student").first()
        if not first_student:
            from app.core.security import security_utils
            first_student = User(
                name="Default Student",
                email="student@example.com",
                hashed_password=security_utils.hash_password("studentpassword"),
                role="student"
            )
            db.add(first_student)
            db.commit()
            db.refresh(first_student)
        user_id = first_student.id

    # Log the incoming data for debugging
    print("=" * 70)
    print("📝 QUIZ SUBMISSION RECEIVED")
    print("=" * 70)
    print(f"User ID: {user_id}")
    print(f"Topic: {req.topic}")
    print(f"Subtopic: {req.subtopic}")
    print(f"Question: {req.question[:80]}...")
    print(f"Selected: {req.selected_option} | Correct: {req.correct_answer}")
    print(f"Theta: {req.theta} → {new_theta}")
    print("\n📦 QUIZ HISTORY FIELDS:")
    print(f"  • question_options: {type(req.question_options)} - {req.question_options is not None}")
    if req.question_options:
        print(f"    Keys: {list(req.question_options.keys())}")
    print(f"  • explanation: {type(req.explanation)} - {req.explanation is not None}")
    if req.explanation:
        print(f"    Length: {len(req.explanation)} chars")
    print(f"  • bloom_level: {type(req.bloom_level)} - {req.bloom_level}")
    print("=" * 70)

    # Record the attempt in the database
    attempt = QuestionAttempt(
        user_id=user_id,
        topic=req.topic,
        subtopic=req.subtopic,
        question_text=req.question,
        selected_option=req.selected_option,
        correct_option=req.correct_answer,
        is_correct=correct,
        misconception=req.misconception if not correct else None,
        theta_before=req.theta,
        theta_after=new_theta,
        question_options=req.question_options,  # Store options for history display
        explanation=req.explanation,  # Store explanation for review
        bloom_level=req.bloom_level  # Store Bloom's level for analysis
    )
    db.add(attempt)
    db.commit()
    
    print(f"✓ Saved attempt #{attempt.id} to database")

    return {
        "correct": correct,
        "new_theta": new_theta,
        "theta_label": ThetaEstimator.theta_to_label(new_theta),
        "next_difficulty": next_difficulty,
        "next_bloom": bloom_order[next_bloom_idx],
        "probability_correct": round(ThetaEstimator.irt_probability(req.theta, req.difficulty), 3),
    }


@router.get("/history")
async def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """
    Retrieves complete quiz history for the current user, organized by topic and subtopic.
    """
    print("\n" + "=" * 70)
    print("📊 QUIZ HISTORY REQUEST")
    print("=" * 70)
    print(f"User ID: {current_user.id}")
    print(f"User: {current_user.name} ({current_user.email})")
    
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.user_id == current_user.id
    ).order_by(QuestionAttempt.timestamp.desc()).all()
    
    print(f"Found {len(attempts)} attempts")
    
    if not attempts:
        print("⚠ No quiz attempts found for this user")
        return {
            "user_id": current_user.id,
            "user_name": current_user.name,
            "total_attempts": 0,
            "history": {}
        }
    
    # Organize by topic -> subtopic
    history_dict = {}
    
    for attempt in attempts:
        if attempt.topic not in history_dict:
            history_dict[attempt.topic] = {
                "subtopics": {},
                "stats": {
                    "total_questions": 0,
                    "correct": 0,
                    "accuracy": 0.0
                }
            }
        
        if attempt.subtopic not in history_dict[attempt.topic]["subtopics"]:
            history_dict[attempt.topic]["subtopics"][attempt.subtopic] = {
                "questions": [],
                "stats": {
                    "total": 0,
                    "correct": 0,
                    "accuracy": 0.0
                }
            }
        
        # Add attempt details
        question_data = {
            "id": attempt.id,
            "question_text": attempt.question_text,
            "options": attempt.question_options or {},
            "selected_option": attempt.selected_option,
            "correct_option": attempt.correct_option,
            "is_correct": attempt.is_correct,
            "explanation": attempt.explanation,
            "misconception": attempt.misconception,
            "theta_before": attempt.theta_before,
            "theta_after": attempt.theta_after,
            "bloom_level": attempt.bloom_level,
            "timestamp": attempt.timestamp.isoformat() if attempt.timestamp else None
        }
        
        history_dict[attempt.topic]["subtopics"][attempt.subtopic]["questions"].append(question_data)
    
    # Calculate statistics for each subtopic and topic
    for topic, topic_data in history_dict.items():
        total_q = 0
        correct_q = 0
        
        for subtopic, subtopic_data in topic_data["subtopics"].items():
            total = len(subtopic_data["questions"])
            correct = sum(1 for q in subtopic_data["questions"] if q["is_correct"])
            
            subtopic_data["stats"]["total"] = total
            subtopic_data["stats"]["correct"] = correct
            subtopic_data["stats"]["accuracy"] = (correct / total * 100) if total > 0 else 0.0
            
            total_q += total
            correct_q += correct
        
        topic_data["stats"]["total_questions"] = total_q
        topic_data["stats"]["correct"] = correct_q
        topic_data["stats"]["accuracy"] = (correct_q / total_q * 100) if total_q > 0 else 0.0
    
    # Log summary
    print("\n📈 HISTORY SUMMARY:")
    print(f"  Topics: {len(history_dict)}")
    for topic, data in history_dict.items():
        print(f"    • {topic}: {data['stats']['total_questions']} questions, {data['stats']['accuracy']:.1f}% accuracy")
    
    response = {
        "user_id": current_user.id,
        "user_name": current_user.name,
        "total_attempts": len(attempts),
        "history": history_dict
    }
    
    print("✓ Returning quiz history")
    print("=" * 70 + "\n")
    
    return response


@router.post("/init-schema")
async def initialize_schema(db: Session = Depends(get_db)):
    """
    Initialize database schema for quiz history if needed.
    Adds missing columns to question_attempts table.
    """
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns('question_attempts')
        existing_columns = {col['name'] for col in columns}
        
        result = {
            "status": "ok",
            "existing_columns": list(existing_columns),
            "added_columns": []
        }
        
        # Check and add missing columns
        migrations = [
            ('question_options', 'ALTER TABLE question_attempts ADD COLUMN question_options JSONB'),
            ('explanation', 'ALTER TABLE question_attempts ADD COLUMN explanation TEXT'),
            ('bloom_level', 'ALTER TABLE question_attempts ADD COLUMN bloom_level VARCHAR(50)')
        ]
        
        with engine.begin() as connection:
            for col_name, sql in migrations:
                if col_name not in existing_columns:
                    try:
                        connection.execute(text(sql))
                        result["added_columns"].append(col_name)
                    except Exception as e:
                        if 'already exists' not in str(e).lower():
                            result["warning"] = f"Error adding {col_name}: {str(e)}"
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema initialization failed: {str(e)}")
