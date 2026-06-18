from app.repetition.sm2_scheduler import SM2Scheduler
from app.schemas.review import ReviewRequest, ReviewResponse, PendingReviewsResponse, PendingReviewItem
from app.models.review import ReviewSchedule
from app.mastery.mastery_calculator import MasteryCalculator

class ReviewService:
    def __init__(self):
        self.scheduler = SM2Scheduler()
        self.mastery_calculator = MasteryCalculator()

    def schedule_review(self, request: ReviewRequest) -> ReviewResponse:
        """
        Updates or creates a review schedule for a topic based on user performance.
        Integrates mastery score calculation.
        """
        # MOCK initialization representing what we might get from or save to the DB
        current_schedule = ReviewSchedule(
            user_id=request.user_id,
            topic_id=request.topic_id,
            ease_factor=2.5,
            interval_days=0,
            repetition_count=0,
            mastery_score=0.0
        )
        
        # 1. Update mastery score
        new_mastery_score = self.mastery_calculator.calculate_mastery(
            user_id=request.user_id, 
            topic_id=request.topic_id
        )
        current_schedule.mastery_score = new_mastery_score if new_mastery_score is not None else current_schedule.mastery_score

        # 2. Invoke scheduler
        new_params = self.scheduler.calculate_next_review(
            rating=request.rating,
            ease_factor=current_schedule.ease_factor,
            interval_days=current_schedule.interval_days,
            repetition_count=current_schedule.repetition_count
        )

        # 3. Update review schedule
        current_schedule.ease_factor = new_params["ease_factor"]
        current_schedule.interval_days = new_params["interval_days"]
        current_schedule.repetition_count = new_params["repetition_count"]
        current_schedule.next_review_date = new_params["next_review_date"]
        
        # TODO: db.commit() to persist the updated record
        
        return ReviewResponse(
            user_id=current_schedule.user_id,
            topic_id=current_schedule.topic_id,
            ease_factor=current_schedule.ease_factor,
            interval_days=current_schedule.interval_days,
            repetition_count=current_schedule.repetition_count,
            next_review_date=current_schedule.next_review_date,
            mastery_score=current_schedule.mastery_score
        )

    def get_pending_reviews(self, user_id: int) -> PendingReviewsResponse:
        """
        Retrieves a list of pending reviews for the user.
        """
        # MOCK data. In a real scenario, query the DB where next_review_date <= now()
        from datetime import datetime
        mock_date = datetime.utcnow()
        return PendingReviewsResponse(
            reviews=[
                PendingReviewItem(topic="Fractions", next_review_date=mock_date)
            ]
        )
