from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import os
from typing import Optional
from groq import Groq

from app.database.session import get_db
from app.models.user import User
from app.models.proctoring_event import ProctoringEvent
from app.models.attempt import QuestionAttempt
from app.mastery.mastery_calculator import MasteryCalculator
from app.misconceptions.analyzer import MisconceptionAnalyzer
from app.api.endpoints.users import get_current_teacher
from app.api.endpoints.proctoring import LOCKABLE_VIOLATION_TYPES, MAX_VIOLATIONS_BEFORE_LOCK

router = APIRouter()

@router.get("/dashboard")
def get_educator_dashboard(
    topic: str = Query("Computer Science", description="The learning topic to analyze"),
    db: Session = Depends(get_db)
):
    """
    Retrieves class-level and student-level educator analytics.
    Also includes proctoring integrity data per student session.
    If no student attempt data exists in the database, returns a populated mock fallback.
    """
    # 1. Fetch attempts on this topic
    attempts = db.query(QuestionAttempt).filter(QuestionAttempt.topic == topic).all()

    # 2. Fetch proctoring data for all students
    students_in_db = db.query(User).filter(User.role == "student").all()

    def get_student_proctoring(student_id: int):
        events = db.query(ProctoringEvent).filter(
            (ProctoringEvent.user_id == student_id) |
            (ProctoringEvent.session_id.like(f"session_{student_id}_%"))
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
        return list(sessions_map.values())

    # 3. Check if we should fall back to mock data
    if len(attempts) == 0:
        student_list = []
        for student in students_in_db:
            student_list.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "mastery": 0,
                "theta": "0.00",
                "velocity": "N/A",
                "trend": "stable",
                "topics": 0,
                "sessions": get_student_proctoring(student.id)
            })
        mock_students = [
            {"name": "Aisha Kumar", "mastery": 82, "theta": "+0.91", "velocity": "Fast", "trend": "up", "topics": 8, "sessions": []},
            {"name": "Marcus Tee", "mastery": 74, "theta": "+0.62", "velocity": "Fast", "trend": "up", "topics": 7, "sessions": []},
            {"name": "Priya Sharma", "mastery": 61, "theta": "+0.38", "velocity": "Medium", "trend": "up", "topics": 5, "sessions": []},
            {"name": "Leon Baxter", "mastery": 48, "theta": "+0.11", "velocity": "Slow", "trend": "down", "topics": 4, "sessions": []},
            {"name": "Sofia Reyes", "mastery": 55, "theta": "+0.28", "velocity": "Medium", "trend": "stable", "topics": 5, "sessions": []},
            {"name": "James Wu", "mastery": 38, "theta": "-0.14", "velocity": "Slow", "trend": "down", "topics": 3, "sessions": []}
        ]
        return {
            "is_mock": True,
            "kpis": {
                "active_students": str(len(students_in_db)),
                "avg_class_mastery": "61%",
                "active_misconceptions": "12",
                "avg_theta_velocity": "+0.15"
            },
            "topic_perf": [
                {"topic": "Fractions", "score": 85},
                {"topic": "Equations", "score": 62},
                {"topic": "Ratios", "score": 71},
                {"topic": "Geometry", "score": 45},
                {"topic": "Statistics", "score": 58},
                {"topic": "Algebra", "score": 39}
            ],
            "misconceptions": [
                {"issue": "Adding unlike denominators", "pct": 42, "severity": "high"},
                {"issue": "Area vs. Perimeter confusion", "pct": 28, "severity": "medium"},
                {"issue": "Sign errors in algebra", "pct": 35, "severity": "high"},
                {"issue": "Decimal place value", "pct": 19, "severity": "low"}
            ],
            "students": student_list + mock_students
        }

    # 4. Calculate actual metrics
    mastery_calc = MasteryCalculator()
    misc_analyzer = MisconceptionAnalyzer()

    student_records = []
    total_mastery = 0.0
    students_with_attempts_count = 0

    for student in students_in_db:
        student_attempts = [a for a in attempts if a.user_id == student.id]
        if not student_attempts:
            student_records.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "mastery": 0,
                "theta": "0.00",
                "velocity": "N/A",
                "trend": "stable",
                "topics": 0,
                "sessions": get_student_proctoring(student.id)
            })
            continue

        students_with_attempts_count += 1
        mastery = mastery_calc.calculate_mastery(student.id, topic, db=db)
        total_mastery += mastery

        # Latest theta
        latest_attempt = sorted(student_attempts, key=lambda x: x.timestamp, reverse=True)[0]
        theta_val = latest_attempt.theta_after
        theta_str = f"+{theta_val:.2f}" if theta_val >= 0 else f"{theta_val:.2f}"

        # Velocity and Trend
        avg_diff = sum(a.theta_after - a.theta_before for a in student_attempts) / len(student_attempts)
        if avg_diff > 0.05:
            velocity = "Fast"
        elif avg_diff < -0.05:
            velocity = "Slow"
        else:
            velocity = "Medium"

        trend = "stable"
        if len(student_attempts) > 1:
            sorted_attempts = sorted(student_attempts, key=lambda x: x.timestamp)
            if sorted_attempts[-1].theta_after > sorted_attempts[-2].theta_after + 0.01:
                trend = "up"
            elif sorted_attempts[-1].theta_after < sorted_attempts[-2].theta_after - 0.01:
                trend = "down"

        # Count mastered subtopics
        mastered_subtopics = len(set(a.subtopic for a in student_attempts if a.is_correct))

        student_records.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "mastery": int(round(mastery)),
            "theta": theta_str,
            "velocity": velocity,
            "trend": trend,
            "topics": mastered_subtopics,
            "sessions": get_student_proctoring(student.id)
        })

    avg_class_mastery_val = int(round(total_mastery / students_with_attempts_count)) if students_with_attempts_count > 0 else 0

    # Active misconceptions list & count
    active_misc_list = misc_analyzer.analyze_class_misconceptions(topic, db=db)
    active_misc_count = len(active_misc_list)

    # Avg theta velocity
    all_velocities = [a.theta_after - a.theta_before for a in attempts]
    avg_theta_velocity_val = sum(all_velocities) / len(all_velocities) if all_velocities else 0.0
    avg_theta_velocity_str = f"+{avg_theta_velocity_val:.2f}" if avg_theta_velocity_val >= 0 else f"{avg_theta_velocity_val:.2f}"

    # Topic Mastery Distribution
    subtopic_attempts = {}
    for a in attempts:
        subtopic_attempts.setdefault(a.subtopic, []).append(a)

    topic_perf = []
    for sub, atts in subtopic_attempts.items():
        sub_correct = sum(1 for a in atts if a.is_correct)
        sub_pct = int(round((sub_correct / len(atts)) * 100))
        topic_perf.append({"topic": sub, "score": sub_pct})

    return {
        "is_mock": False,
        "kpis": {
            "active_students": str(len(student_records)),
            "avg_class_mastery": f"{avg_class_mastery_val}%",
            "active_misconceptions": str(active_misc_count),
            "avg_theta_velocity": avg_theta_velocity_str
        },
        "topic_perf": topic_perf,
        "misconceptions": active_misc_list,
        "students": student_records
    }

@router.get("/re-teaching")
def get_re_teaching_recommendations(
    topic: str = Query("Computer Science", description="The learning topic to generate tips for"),
    db: Session = Depends(get_db)
):
    """
    Queries Groq LLM to generate a customized re-teaching plan based on class misconceptions.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "recommendation": f"### AI Re-Teaching Recommendations for **{topic}**\n\n"
                              f"*(Note: `GROQ_API_KEY` is not configured in the backend `.env` file.)*\n\n"
                              f"**Standard Recommendations for {topic}:**\n"
                              f"1. **Break down complex subtopics**: Break instruction into step-by-step modular segments.\n"
                              f"2. **Use Scaffolded Hints**: Direct students to check foundations when errors occur.\n"
                              f"3. **Address Common Gaps**: Reinforce connections between theory and hands-on exercises."
        }

    misc_analyzer = MisconceptionAnalyzer()
    misconceptions = misc_analyzer.analyze_class_misconceptions(topic, db=db)

    if not misconceptions:
        misconceptions = [
            {"issue": "Conceptual gaps in foundational subtopics", "pct": 40, "severity": "high"},
            {"issue": "Procedural confusion or sign errors", "pct": 25, "severity": "medium"}
        ]

    misconceptions_str = "\n".join(
        f"- {m['issue']} (Impacts {m['pct']}% of incorrect answers, Severity: {m['severity']})"
        for m in misconceptions
    )

    prompt = f"""You are an expert tutor and educational psychologist.
The teacher requires an AI-driven re-teaching recommendation plan for their class.

Topic: {topic}
Detected Class Misconceptions:
{misconceptions_str}

Please generate a detailed, structured, and pedagogical re-teaching recommendation plan in Markdown.
You MUST cover:
1. **Misconception Deep-Dive**: Why are students making these specific errors? What are the root cognitive gaps?
2. **10-Minute Remedial Lesson Plan**: Provide a structured classroom warm-up or direct instruction block to address the issues.
3. **Analogy/Explanation Guide**: A memorable analogy or conceptual explanation to resolve the confusion.
4. **Targeted Check-for-Understanding Questions**: Write 2 multiple-choice check questions with explanation paths for incorrect choices.

Format the output clearly and professionally for a classroom teacher."""

    try:
        client = Groq(api_key=api_key)
        message = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        recommendation = message.choices[0].message.content.strip()
        return {"recommendation": recommendation}
    except Exception as e:
        return {
            "recommendation": f"### AI Re-Teaching Recommendations for **{topic}**\n\n"
                              f"Failed to generate custom recommendations due to API exception: {str(e)}"
        }
