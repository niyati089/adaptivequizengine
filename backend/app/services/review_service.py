from sqlalchemy.orm import Session

from app.core.time_utils import utcnow

from app.repetition.sm2_scheduler import SM2Scheduler
from app.schemas.review import ReviewRequest, ReviewResponse, PendingReviewsResponse, PendingReviewItem
from app.models.review import ReviewSchedule
from app.mastery.mastery_calculator import MasteryCalculator

class ReviewService:
    def __init__(self):
        self.scheduler = SM2Scheduler()
        self.mastery_calculator = MasteryCalculator()

    def schedule_review(self, db: Session, user_id: int, request: ReviewRequest) -> ReviewResponse:
        """
        Updates (or creates) the persisted review schedule for a topic based on
        the learner's performance, using SM-2 spaced repetition and the current
        mastery score for that topic.
        """
        schedule = (
            db.query(ReviewSchedule)
            .filter(ReviewSchedule.user_id == user_id, ReviewSchedule.topic_id == request.topic_id)
            .first()
        )
        if schedule is None:
            schedule = ReviewSchedule(
                user_id=user_id,
                topic_id=request.topic_id,
                ease_factor=2.5,
                interval_days=0,
                repetition_count=0,
                mastery_score=0.0,
            )
            db.add(schedule)

        # 1. Update mastery score for this topic
        new_mastery_score = self.mastery_calculator.calculate_mastery(
            user_id=user_id,
            topic_id=request.topic_id,
            db=db,
        )
        if new_mastery_score is not None:
            schedule.mastery_score = new_mastery_score

        # 2. Invoke SM-2 scheduler
        new_params = self.scheduler.calculate_next_review(
            rating=request.quality,
            ease_factor=schedule.ease_factor,
            interval_days=schedule.interval_days,
            repetition_count=schedule.repetition_count,
        )

        # 3. Persist the updated review schedule
        schedule.ease_factor = new_params["ease_factor"]
        schedule.interval_days = new_params["interval_days"]
        schedule.repetition_count = new_params["repetition_count"]
        schedule.next_review_date = new_params["next_review_date"]

        db.commit()
        db.refresh(schedule)

        return ReviewResponse(
            user_id=schedule.user_id,
            topic_id=schedule.topic_id,
            ease_factor=schedule.ease_factor,
            interval_days=schedule.interval_days,
            repetition_count=schedule.repetition_count,
            next_review_date=schedule.next_review_date,
            mastery_score=schedule.mastery_score,
        )

    def get_pending_reviews(self, db: Session, user_id: int) -> PendingReviewsResponse:
        """
        Retrieves due-or-overdue review schedules for the user, most overdue first.
        """
        now = utcnow()
        schedules = (
            db.query(ReviewSchedule)
            .filter(ReviewSchedule.user_id == user_id, ReviewSchedule.next_review_date <= now)
            .order_by(ReviewSchedule.next_review_date.asc())
            .all()
        )
        return PendingReviewsResponse(
            reviews=[
                PendingReviewItem(topic=schedule.topic_id, next_review_date=schedule.next_review_date)
                for schedule in schedules
            ]
        )
