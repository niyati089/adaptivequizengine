from sqlalchemy.orm import Session
from app.models.attempt import QuestionAttempt
from app.database.connection import SessionLocal
from sqlalchemy import func

class MisconceptionAnalyzer:
    """
    Analyzes wrong answers to identify conceptual gaps.
    """
    
    def analyze(self, user_id: int, question_id: int, selected_wrong_option: str, db: Session = None) -> str:
        """
        Identify specific misconception from wrong option.
        """
        created_session = False
        if db is None:
            db = SessionLocal()
            created_session = True
            
        try:
            # Query attempts for this user and question to find the misconception text
            attempt = (
                db.query(QuestionAttempt)
                .filter(
                    QuestionAttempt.user_id == user_id,
                    QuestionAttempt.selected_option == selected_wrong_option
                )
                .order_by(QuestionAttempt.timestamp.desc())
                .first()
            )
            return attempt.misconception if attempt and attempt.misconception else "Concept misunderstanding"
        finally:
            if created_session:
                db.close()

    def analyze_class_misconceptions(self, topic: str, db: Session = None) -> list[dict]:
        """
        Aggregates all incorrect attempts on a topic across all students,
        counting unique misconceptions and calculating percentages.
        """
        created_session = False
        if db is None:
            db = SessionLocal()
            created_session = True
            
        try:
            # Get total incorrect attempts for the topic that triggered a misconception
            total_incorrect = (
                db.query(QuestionAttempt)
                .filter(
                    QuestionAttempt.topic == topic,
                    QuestionAttempt.is_correct == False,
                    QuestionAttempt.misconception.isnot(None),
                    QuestionAttempt.misconception != ""
                )
                .count()
            )
            
            if total_incorrect == 0:
                return []
                
            # Group by misconception and count
            results = (
                db.query(QuestionAttempt.misconception, func.count(QuestionAttempt.id).label("count"))
                .filter(
                    QuestionAttempt.topic == topic,
                    QuestionAttempt.is_correct == False,
                    QuestionAttempt.misconception.isnot(None),
                    QuestionAttempt.misconception != ""
                )
                .group_by(QuestionAttempt.misconception)
                .order_by(func.count(QuestionAttempt.id).desc())
                .all()
            )
            
            misconceptions_list = []
            for misc_text, count in results:
                pct = int(round((count / total_incorrect) * 100))
                
                # Classify severity based on percentage impact
                if pct >= 35:
                    severity = "high"
                elif pct >= 20:
                    severity = "medium"
                else:
                    severity = "low"
                    
                misconceptions_list.append({
                    "issue": misc_text,
                    "pct": pct,
                    "severity": severity
                })
                
            return misconceptions_list
        finally:
            if created_session:
                db.close()
