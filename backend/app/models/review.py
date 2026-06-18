from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

# TODO: Import the actual Base from your database configuration (e.g., app.database)
Base = declarative_base()

class ReviewSchedule(Base):
    __tablename__ = "review_schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    topic_id = Column(Integer, index=True)
    mastery_score = Column(Float, default=0.0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    repetition_count = Column(Integer, default=0)
    next_review_date = Column(DateTime, default=datetime.utcnow)

    # TODO: Add foreign key constraints to User and Topic tables when appropriate
