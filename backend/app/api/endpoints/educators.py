from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from groq import Groq

from app.core.config import resolve_groq_api_key
from app.database.session import get_db
from app.api.endpoints.users import get_current_teacher
from app.models.classroom import Classroom, ClassEnrollment
from app.models.user import User
from app.models.attempt import QuestionAttempt
from app.mastery.mastery_calculator import MasteryCalculator
from app.misconceptions.analyzer import MisconceptionAnalyzer

router = APIRouter()

@router.get("/dashboard")
def get_educator_dashboard(
    topic: str = Query("Computer Science", description="The learning topic to analyze"),
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Retrieves class-level and student-level educator analytics.
    If no student attempt data exists in the database, returns a populated mock fallback.
    """
    teacher_class_ids = [
        item.id
        for item in db.query(Classroom.id).filter(Classroom.teacher_id == teacher.id).all()
    ]

    # Find approved students enrolled in teacher's classes
    approved_student_ids = [
        item.student_id
        for item in db.query(ClassEnrollment.student_id)
        .filter(
            ClassEnrollment.classroom_id.in_(teacher_class_ids),
            ClassEnrollment.status == "approved",
        )
        .distinct()
        .all()
    ] if teacher_class_ids else []

    students_in_db = (
        db.query(User)
        .filter(User.id.in_(approved_student_ids), User.role == "student")
        .all()
    ) if approved_student_ids else []

    # Demo Fallback: if teacher has no enrolled students, get all student users in DB
    if not students_in_db:
        students_in_db = db.query(User).filter(User.role == "student").all()

    student_ids = [s.id for s in students_in_db]

    # Fetch attempts for these students on this topic (regardless of classroom link)
    attempts = []
    if student_ids:
        attempts = (
            db.query(QuestionAttempt)
            .filter(
                QuestionAttempt.user_id.in_(student_ids),
                QuestionAttempt.topic == topic,
            )
            .all()
        )

    # 2. Check if we should fall back to mock data metrics, but referencing REAL student users
    if len(attempts) == 0:
        import random
        # Seed generator using teacher ID + topic hash for visual stability per session
        random.seed(teacher.id + hash(topic))
        
        mock_students = []
        for student in students_in_db:
            mastery = random.randint(35, 88)
            theta_val = random.uniform(-0.5, 1.2)
            theta_str = f"+{theta_val:.2f}" if theta_val >= 0 else f"{theta_val:.2f}"
            mock_students.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "mastery": mastery,
                "theta": theta_str,
                "velocity": random.choice(["Fast", "Medium", "Slow"]),
                "trend": random.choice(["up", "down", "stable"]),
                "topics": random.randint(2, 9)
            })

        # Fallback if DB is completely empty of student users
        if not mock_students:
            mock_students = [
                {"id": 999, "name": "Aisha Kumar", "mastery": 82, "theta": "+0.91", "velocity": "Fast", "trend": "up", "topics": 8},
                {"id": 998, "name": "Marcus Tee", "mastery": 74, "theta": "+0.62", "velocity": "Fast", "trend": "up", "topics": 7}
            ]

        avg_mastery = int(sum(s["mastery"] for s in mock_students) / len(mock_students))
        return {
            "is_mock": True,
            "kpis": {
                "active_students": str(len(mock_students)),
                "avg_class_mastery": f"{avg_mastery}%",
                "active_misconceptions": "4",
                "avg_theta_velocity": "+0.18"
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
            "students": mock_students
        }
    
    mastery_calc = MasteryCalculator()
    misc_analyzer = MisconceptionAnalyzer(db=db)
    
    student_records = []
    total_mastery = 0.0
    
    for student in students_in_db:
        student_attempts = [a for a in attempts if a.user_id == student.id]
        if not student_attempts:
            continue
            
        mastery = mastery_calc.calculate_mastery(student.id, topic, db=db)
        total_mastery += mastery
        
        # Latest theta
        latest_attempt = sorted(student_attempts, key=lambda x: x.timestamp or 0, reverse=True)[0]
        theta_val = latest_attempt.theta_after if latest_attempt.theta_after is not None else 0.0
        theta_str = f"+{theta_val:.2f}" if theta_val >= 0 else f"{theta_val:.2f}"
        
        # Velocity and Trend
        valid_diffs = [
            (a.theta_after if a.theta_after is not None else 0.0) - 
            (a.theta_before if a.theta_before is not None else 0.0) 
            for a in student_attempts
        ]
        avg_diff = sum(valid_diffs) / len(valid_diffs) if valid_diffs else 0.0
        if avg_diff > 0.05:
            velocity = "Fast"
        elif avg_diff < -0.05:
            velocity = "Slow"
        else:
            velocity = "Medium"
            
        trend = "stable"
        if len(student_attempts) > 1:
            sorted_attempts = sorted(student_attempts, key=lambda x: x.timestamp or 0)
            t_last = sorted_attempts[-1].theta_after if sorted_attempts[-1].theta_after is not None else 0.0
            t_prev = sorted_attempts[-2].theta_after if sorted_attempts[-2].theta_after is not None else 0.0
            if t_last > t_prev + 0.01:
                trend = "up"
            elif t_last < t_prev - 0.01:
                trend = "down"
                
        # Count mastered subtopics (subtopics where they have a correct attempt)
        mastered_subtopics = len(set(a.subtopic for a in student_attempts if a.is_correct))
        
        student_records.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "mastery": int(round(mastery)),
            "theta": theta_str,
            "velocity": velocity,
            "trend": trend,
            "topics": mastered_subtopics
        })
        
    avg_class_mastery_val = int(round(total_mastery / len(student_records))) if student_records else 0
    
    # Active misconceptions list & count
    active_misc_list = misc_analyzer.analyze_class_misconceptions(topic, db=db)
    active_misc_count = len(active_misc_list)
    
    # Avg theta velocity
    all_velocities = [
        (a.theta_after if a.theta_after is not None else 0.0) - 
        (a.theta_before if a.theta_before is not None else 0.0) 
        for a in attempts
    ]
    avg_theta_velocity_val = sum(all_velocities) / len(all_velocities) if all_velocities else 0.0
    avg_theta_velocity_str = f"+{avg_theta_velocity_val:.2f}" if avg_theta_velocity_val >= 0 else f"{avg_theta_velocity_val:.2f}"
    
    # Topic Mastery Distribution (Group by subtopic)
    subtopic_attempts = {}
    for a in attempts:
        subtopic_attempts.setdefault(a.subtopic, []).append(a)
        
    topic_perf = []
    for sub, atts in subtopic_attempts.items():
        sub_correct = sum(1 for a in atts if a.is_correct)
        sub_pct = int(round((sub_correct / len(atts)) * 100))
        topic_perf.append({
            "topic": sub,
            "score": sub_pct
        })
        
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
    api_key: Optional[str] = Query(None, description="Optional per-request Groq API key override"),
    db: Session = Depends(get_db)
):
    """
    Queries Groq LLM to generate a customized re-teaching plan based on class misconceptions.
    """
    api_key = resolve_groq_api_key(api_key)
    if not api_key:
        return {
            "recommendation": f"### AI Re-Teaching Recommendations for **{topic}**\n\n"
                              f"*(Note: `GROQ_API_KEY` is not configured in the backend `.env` file.)*\n\n"
                              f"**Standard Recommendations for {topic}:**\n"
                              f"1. **Break down complex subtopics**: Break instruction into step-by-step modular segments.\n"
                              f"2. **Use Scaffolded Hints**: Direct students to check foundations when errors occur.\n"
                              f"3. **Address Common Gaps**: Reinforce connections between theory and hands-on exercises."
        }
        
    misc_analyzer = MisconceptionAnalyzer(db=db)
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
