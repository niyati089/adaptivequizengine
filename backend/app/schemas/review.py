from pydantic import BaseModel
from datetime import datetime

class ReviewRequest(BaseModel):
    user_id: int
    topic_id: int
    rating: int  # 0 to 5 based on SM-2

class ReviewResponse(BaseModel):
    user_id: int
    topic_id: int
    ease_factor: float
    interval_days: int
    repetition_count: int
    next_review_date: datetime
    mastery_score: float

class PendingReviewItem(BaseModel):
    topic: str
    next_review_date: datetime

class PendingReviewsResponse(BaseModel):
    reviews: list[PendingReviewItem]
