from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.endpoints.users import oauth2_scheme, resolve_user_id_from_token
from app.database.session import get_db
from app.schemas.review import ReviewRequest, ReviewResponse, PendingReviewsResponse
from app.services.review_service import ReviewService

router = APIRouter()
service = ReviewService()


@router.post("/schedule", response_model=ReviewResponse)
def schedule_topic_review(
    request: ReviewRequest,
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
):
    """
    Submit a review rating (0-5) to calculate and persist the next review time for a topic.
    """
    user_id = resolve_user_id_from_token(db, token, request.user_id) or 1
    return service.schedule_review(db, user_id, request)


@router.get("/pending", response_model=PendingReviewsResponse)
def get_pending_reviews(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
):
    """
    Retrieve due-or-overdue reviews for the current authenticated user.
    """
    user_id = resolve_user_id_from_token(db, token) or 1
    return service.get_pending_reviews(db, user_id)
