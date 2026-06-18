from pydantic import BaseModel

class RevisionMetricsResponse(BaseModel):
    due_today: int
    overdue: int
    upcoming_reviews: int
    retention_score: float
    mastered_topics: int
