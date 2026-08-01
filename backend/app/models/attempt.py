from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from app.core.time_utils import utcnow
from app.models.base import Base

class QuestionAttempt(Base):
    __tablename__ = "question_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="SET NULL"), index=True, nullable=True)
    classroom_quiz_id = Column(Integer, ForeignKey("classroom_quizzes.id", ondelete="SET NULL"), index=True, nullable=True)
    topic = Column(String, index=True)
    subtopic = Column(String, index=True)
    question_text = Column(String)
    selected_option = Column(String)
    correct_option = Column(String)
    is_correct = Column(Boolean)
    misconception = Column(String, nullable=True)
    theta_before = Column(Float)
    theta_after = Column(Float)
    timestamp = Column(DateTime, default=utcnow)
    
    # New fields for comprehensive quiz history
    answer_options = Column(Text, nullable=True)  # JSON string of all answer options
    explanation = Column(Text, nullable=True)  # Explanation for the correct answer
    bloom_level = Column(String, nullable=True)  # Bloom's taxonomy level
    difficulty = Column(Float, nullable=True)  # IRT difficulty parameter
