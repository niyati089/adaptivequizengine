from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.models.base import Base

class QuestionAttempt(Base):
    __tablename__ = "question_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    topic = Column(String, index=True)
    subtopic = Column(String, index=True)
    question_text = Column(String)
    selected_option = Column(String)
    correct_option = Column(String)
    is_correct = Column(Boolean)
    misconception = Column(String, nullable=True)
    theta_before = Column(Float)
    theta_after = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
