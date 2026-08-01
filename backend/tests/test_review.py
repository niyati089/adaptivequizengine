from datetime import timedelta

from app.core.time_utils import utcnow
from app.database.connection import SessionLocal
from app.models.review import ReviewSchedule
from app.models.user import User
from app.services.review_service import ReviewService


def test_schedule_review_persists_to_db(client):
    response = client.post(
        "/api/review/schedule",
        json={
            "user_id": 1,
            "topic_id": "101",
            "quality": 4
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "next_review_date" in data
    assert data["ease_factor"] >= 2.5
    assert data["interval_days"] > 0

    db = SessionLocal()
    try:
        schedule = (
            db.query(ReviewSchedule)
            .filter(ReviewSchedule.user_id == 1, ReviewSchedule.topic_id == "101")
            .first()
        )
        assert schedule is not None
        assert schedule.repetition_count == 1
    finally:
        db.query(ReviewSchedule).filter(ReviewSchedule.user_id == 1, ReviewSchedule.topic_id == "101").delete()
        db.commit()
        db.close()


def test_schedule_review_updates_existing_schedule(client):
    # First call creates the schedule; second call should update the same row
    # rather than creating a duplicate.
    client.post("/api/review/schedule", json={"user_id": 2, "topic_id": "Fractions", "quality": 4})
    response = client.post("/api/review/schedule", json={"user_id": 2, "topic_id": "Fractions", "quality": 5})
    assert response.status_code == 200

    db = SessionLocal()
    try:
        schedules = (
            db.query(ReviewSchedule)
            .filter(ReviewSchedule.user_id == 2, ReviewSchedule.topic_id == "Fractions")
            .all()
        )
        assert len(schedules) == 1
        assert schedules[0].repetition_count == 2
    finally:
        db.query(ReviewSchedule).filter(ReviewSchedule.user_id == 2, ReviewSchedule.topic_id == "Fractions").delete()
        db.commit()
        db.close()


def test_get_pending_reviews_returns_only_overdue_schedules():
    db = SessionLocal()
    user = None
    try:
        user = User(
            name="Review Test Student",
            email="review_test_student@example.com",
            hashed_password="test",
            role="student",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        db.add(ReviewSchedule(
            user_id=user.id,
            topic_id="Fractions",
            ease_factor=2.5,
            interval_days=1,
            repetition_count=1,
            mastery_score=40.0,
            next_review_date=utcnow() - timedelta(days=1),
        ))
        db.add(ReviewSchedule(
            user_id=user.id,
            topic_id="Algebra",
            ease_factor=2.5,
            interval_days=6,
            repetition_count=2,
            mastery_score=70.0,
            next_review_date=utcnow() + timedelta(days=5),
        ))
        db.commit()

        result = ReviewService().get_pending_reviews(db, user.id)

        assert len(result.reviews) == 1
        assert result.reviews[0].topic == "Fractions"
    finally:
        if user is not None:
            db.query(ReviewSchedule).filter(ReviewSchedule.user_id == user.id).delete()
            db.query(User).filter(User.id == user.id).delete()
            db.commit()
        db.close()
