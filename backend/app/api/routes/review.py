from fastapi import APIRouter
from app.schemas.review import ReviewRequest, ReviewResponse, PendingReviewsResponse
from app.services.review_service import ReviewService

router = APIRouter()
service = ReviewService()

@router.post("/schedule", response_model=ReviewResponse)
def schedule_topic_review(request: ReviewRequest):
    """
    Submit a review rating (0-5) to calculate and schedule the next review time for a topic.
    TODO: Add proper authorization and request validation.
    """
    return service.schedule_review(request)

@router.get("/pending", response_model=PendingReviewsResponse)
def get_pending_reviews():
    """
    Retrieve pending reviews for the current user.
    TODO: Extract actual user_id from authorization context.
    """
    # MOCK user_id
    user_id = 1
    return service.get_pending_reviews(user_id)
