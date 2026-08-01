from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq
import json
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.config import resolve_groq_api_key
from app.database.session import get_db
from app.irt.theta_estimator import ThetaEstimator
from app.models.user import User
from app.models.attempt import QuestionAttempt
from app.models.classroom import ClassroomQuiz
from app.misconceptions.analyzer import MisconceptionAnalyzer
from app.agents.question_gen import generate_variant
from app.api.endpoints.users import get_current_student, oauth2_scheme, resolve_user_id_from_token

router = APIRouter()

class QuestionRequest(BaseModel):
    topic: str
    subtopic: str
    difficulty: float
    bloom_level: str
    previous_questions: list[str] = []
    classroom_quiz_id: Optional[int] = None
    api_key: Optional[str] = None

class AnswerRequest(BaseModel):
    user_id: Optional[int] = None
    classroom_id: Optional[int] = None
    classroom_quiz_id: Optional[int] = None
    theta: float
    difficulty: float
    selected_option: str
    correct_answer: str
    topic: str
    subtopic: str
    question: str
    misconception: Optional[str] = None
    misconceptions: Optional[dict[str, str]] = None
    question_index: int = 1
    api_key: Optional[str] = None
    answer_options: Optional[dict[str, str]] = None
    explanation: Optional[str] = None
    bloom_level: Optional[str] = None

@router.post("/generate")
async def generate_question(req: QuestionRequest, db: Session = Depends(get_db)):
    api_key = resolve_groq_api_key(req.api_key)
    if not api_key:
        raise HTTPException(status_code=400, detail="API key required")

    client = Groq(api_key=api_key)
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
  "concept": "The specific concept this question tests (e.g. 'TensorFlow', 'Backpropagation', 'Gradient Descent') — be specific, not the subtopic name itself",
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

    # ── Anti-cheat variant generation (classroom quizzes only) ──────────
    # Only fires when the teacher has explicitly enabled anti-cheating on
    # this specific classroom quiz.  Free-practice requests never pay the
    # extra LLM call.
    if req.classroom_quiz_id:
        quiz = db.query(ClassroomQuiz).filter(
            ClassroomQuiz.id == req.classroom_quiz_id
        ).first()
        if quiz and quiz.enable_anti_cheating:
            data = generate_variant(data, api_key)

    return data


@router.post("/submit")
async def submit_answer(
    req: AnswerRequest,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    correct = req.selected_option == req.correct_answer
    new_theta = ThetaEstimator.update_theta(req.theta, correct, req.difficulty, req.question_index)
    next_difficulty = ThetaEstimator.select_next_difficulty(new_theta)

    bloom_order = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
    current_bloom_idx = bloom_order.index(req.subtopic.lower()) if req.subtopic.lower() in bloom_order else 1

    if correct and new_theta > req.theta + 0.1:
        next_bloom_idx = min(current_bloom_idx + 1, len(bloom_order) - 1)
    elif not correct and new_theta < req.theta - 0.1:
        next_bloom_idx = max(current_bloom_idx - 1, 0)
    else:
        next_bloom_idx = current_bloom_idx

    # Resolve user_id dynamically, while accepting explicit user_id for local clients/tests.
    user_id = resolve_user_id_from_token(db, token, req.user_id)

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

    raw_misconception = None
    misconception_tag = None
    if not correct:
        raw_misconception = (
            req.misconceptions.get(req.selected_option)
            if req.misconceptions
            else req.misconception
        )

        if raw_misconception:
            groq_client = None
            api_key = resolve_groq_api_key(req.api_key)
            if api_key:
                try:
                    groq_client = Groq(api_key=api_key)
                except Exception:
                    groq_client = None

            analyzer = MisconceptionAnalyzer(db=db, groq_client=groq_client)
            misconception_tag = analyzer.classify(raw_misconception, req.topic, req.subtopic)
            analyzer.record(
                user_id=user_id,
                topic=req.topic,
                subtopic=req.subtopic,
                tag=misconception_tag,
                raw_text=raw_misconception,
                question_snippet=req.question,
                selected_option=req.selected_option,
            )

    # Record the attempt in the database
    import json
    attempt = QuestionAttempt(
        user_id=user_id,
        classroom_id=req.classroom_id,
        classroom_quiz_id=req.classroom_quiz_id,
        topic=req.topic,
        subtopic=req.subtopic,
        question_text=req.question,
        selected_option=req.selected_option,
        correct_option=req.correct_answer,
        is_correct=correct,
        misconception=raw_misconception if not correct else None,
        theta_before=req.theta,
        theta_after=new_theta,
        answer_options=json.dumps(req.answer_options) if req.answer_options else None,
        explanation=req.explanation,
        bloom_level=req.bloom_level,
        difficulty=req.difficulty
    )
    db.add(attempt)
    db.commit()

    return {
        "correct": correct,
        "new_theta": new_theta,
        "next_theta": new_theta,
        "theta_label": ThetaEstimator.theta_to_label(new_theta),
        "next_difficulty": next_difficulty,
        "next_bloom": bloom_order[next_bloom_idx],
        "probability_correct": round(ThetaEstimator.irt_probability(req.theta, req.difficulty), 3),
        "misconception_tag": misconception_tag,
        "misconception": raw_misconception,
    }


@router.get("/history")
async def get_quiz_history(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
):
    """Get quiz attempt history grouped by topic and subtopic with accuracy statistics."""
    user_id = resolve_user_id_from_token(db, token, None)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Get all attempts for the user
    attempts = db.query(QuestionAttempt).filter(
        QuestionAttempt.user_id == user_id
    ).order_by(desc(QuestionAttempt.timestamp)).all()
    
    # Group by topic and subtopic
    grouped_data = {}
    
    for attempt in attempts:
        topic = attempt.topic or "Unknown"
        subtopic = attempt.subtopic or "General"
        
        key = f"{topic}|{subtopic}"
        
        if key not in grouped_data:
            grouped_data[key] = {
                "topic": topic,
                "subtopic": subtopic,
                "total_attempts": 0,
                "correct_attempts": 0,
                "attempts": []
            }
        
        grouped_data[key]["total_attempts"] += 1
        if attempt.is_correct:
            grouped_data[key]["correct_attempts"] += 1
        
        # Parse answer options if stored as JSON
        answer_options = None
        if attempt.answer_options:
            try:
                answer_options = json.loads(attempt.answer_options)
            except:
                pass
        
        grouped_data[key]["attempts"].append({
            "id": attempt.id,
            "question_text": attempt.question_text,
            "selected_option": attempt.selected_option,
            "correct_option": attempt.correct_option,
            "is_correct": attempt.is_correct,
            "answer_options": answer_options,
            "explanation": attempt.explanation,
            "bloom_level": attempt.bloom_level,
            "difficulty": attempt.difficulty,
            "theta_before": attempt.theta_before,
            "theta_after": attempt.theta_after,
            "misconception": attempt.misconception,
            "timestamp": attempt.timestamp.isoformat() if attempt.timestamp else None
        })
    
    # Calculate accuracy for each group
    result = []
    for key, data in grouped_data.items():
        accuracy = (data["correct_attempts"] / data["total_attempts"] * 100) if data["total_attempts"] > 0 else 0
        result.append({
            "topic": data["topic"],
            "subtopic": data["subtopic"],
            "total_attempts": data["total_attempts"],
            "correct_attempts": data["correct_attempts"],
            "accuracy": round(accuracy, 1),
            "attempts": data["attempts"]
        })
    
    # Sort by most recent attempt
    result.sort(key=lambda x: max(
        (a["timestamp"] for a in x["attempts"] if a["timestamp"]), 
        default=""
    ), reverse=True)
    
    return {
        "grouped_history": result,
        "total_attempts": len(attempts),
        "overall_accuracy": round(
            (sum(1 for a in attempts if a.is_correct) / len(attempts) * 100) if attempts else 0, 
            1
        )
    }
