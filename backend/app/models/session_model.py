from sqlalchemy import Column, Integer, Float, ForeignKey
from app.models.base import Base

class LearningSession(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    current_theta = Column(Float, default=0.0)
