from sqlalchemy.orm import Session
from app.models.attempt import QuestionAttempt
from app.database.connection import SessionLocal

class MasteryCalculator:
    """
    Calculates overall mastery for topics.
    """
    
    def calculate_mastery(self, user_id: int, topic_id: str, db: Session = None) -> float:
        """
        Calculates mastery for a given topic as a percentage based on the learner's theta score.
        Translates theta in [-3, 3] to a percentage [0, 100].
        """
        created_session = False
        if db is None:
            db = SessionLocal()
            created_session = True
            
        try:
            # Fetch the most recent attempt for the user on this topic
            latest_attempt = (
                db.query(QuestionAttempt)
                .filter(QuestionAttempt.user_id == user_id, QuestionAttempt.topic == str(topic_id))
                .order_by(QuestionAttempt.timestamp.desc())
                .first()
            )
            
            if latest_attempt:
                # Scale theta from [-3.0, 3.0] to [0.0, 100.0]
                theta = latest_attempt.theta_after
                mastery = ((theta + 3.0) / 6.0) * 100.0
                return max(0.0, min(100.0, round(mastery, 1)))
                
            # Fallback to historical correctness if no theta history
            attempts = (
                db.query(QuestionAttempt)
                .filter(QuestionAttempt.user_id == user_id, QuestionAttempt.topic == str(topic_id))
                .all()
            )
            if not attempts:
                return 0.0
                
            correct_count = sum(1 for a in attempts if a.is_correct)
            return round((correct_count / len(attempts)) * 100.0, 1)
        finally:
            if created_session:
                db.close()
