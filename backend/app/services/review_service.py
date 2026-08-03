from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.time_utils import utcnow
from app.repetition.adaptive_sm2_scheduler import AdaptiveSM2Scheduler
from app.schemas.review import ReviewRequest, ReviewResponse, PendingReviewsResponse, PendingReviewItem
from app.models.review import ReviewSchedule
from app.models.attempt import QuestionAttempt
from app.mastery.mastery_calculator import MasteryCalculator


class ReviewService:
    def __init__(self):
        self.scheduler = AdaptiveSM2Scheduler()
        self.mastery_calculator = MasteryCalculator()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_learner_theta(self, db: Session, user_id: int, topic_id: str) -> float:
        """Return the most recent theta_after for the user on this topic, or 0.0."""
        row = (
            db.query(QuestionAttempt.theta_after)
            .filter(
                QuestionAttempt.user_id == user_id,
                QuestionAttempt.topic == topic_id,
                QuestionAttempt.theta_after.isnot(None),
            )
            .order_by(QuestionAttempt.timestamp.desc())
            .first()
        )
        return float(row[0]) if row else 0.0

    def _get_avg_difficulty(self, db: Session, user_id: int, topic_id: str) -> float:
        """Return the average difficulty of attempts on this topic, or 0.0."""
        row = (
            db.query(func.avg(QuestionAttempt.difficulty))
            .filter(
                QuestionAttempt.user_id == user_id,
                QuestionAttempt.topic == topic_id,
                QuestionAttempt.difficulty.isnot(None),
            )
            .first()
        )
        return float(row[0]) if row and row[0] is not None else 0.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def schedule_review(self, db: Session, user_id: int, request: ReviewRequest) -> ReviewResponse:
        """
        Updates (or creates) the persisted review schedule for a topic.

        Uses Adaptive SM-2: base SM-2 algorithm enhanced with:
        - IRT theta  (learner ability)
        - Average question difficulty on this topic
        - Ebbinghaus forgetting-curve target-retention adjustment
        """
        schedule = (
            db.query(ReviewSchedule)
            .filter(
                ReviewSchedule.user_id == user_id,
                ReviewSchedule.topic_id == request.topic_id,
            )
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

        # 1. Update mastery score
        new_mastery = self.mastery_calculator.calculate_mastery(
            user_id=user_id,
            topic_id=request.topic_id,
            db=db,
        )
        if new_mastery is not None:
            schedule.mastery_score = new_mastery

        # 2. Fetch IRT signals from DB
        theta = self._get_learner_theta(db, user_id, request.topic_id)
        difficulty = self._get_avg_difficulty(db, user_id, request.topic_id)

        # 3. Adaptive SM-2
        new_params = self.scheduler.calculate_next_review_adaptive(
            rating=request.quality,
            ease_factor=schedule.ease_factor,
            interval_days=schedule.interval_days,
            repetition_count=schedule.repetition_count,
            theta=theta,
            difficulty=difficulty,
            target_retention=0.85,
        )

        # 4. Persist
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
        """Retrieve due-or-overdue review schedules, most overdue first."""
        now = utcnow()
        schedules = (
            db.query(ReviewSchedule)
            .filter(
                ReviewSchedule.user_id == user_id,
                ReviewSchedule.next_review_date <= now,
            )
            .order_by(ReviewSchedule.next_review_date.asc())
            .all()
        )
        return PendingReviewsResponse(
            reviews=[
                PendingReviewItem(
                    topic=s.topic_id,
                    next_review_date=s.next_review_date,
                )
                for s in schedules
            ]
        )
