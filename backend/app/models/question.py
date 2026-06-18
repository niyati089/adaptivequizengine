from sqlalchemy import Column, Integer, String, Float
from app.models.base import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, index=True)
    content = Column(String)
    difficulty = Column(Float)
