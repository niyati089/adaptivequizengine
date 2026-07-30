from sqlalchemy import Column, Integer, String
from datetime import datetime
from app.models.base import Base

class ProctoringEvent(Base):
    __tablename__ = "proctoring_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    session_id = Column(String, index=True, nullable=True)
    event_type = Column(String, nullable=False) # e.g. NO_FACE_DETECTED, AUDIO_SPIKE, TAB_SWITCH
    timestamp = Column(String, default=lambda: datetime.utcnow().isoformat())
    details = Column(String, nullable=True)
