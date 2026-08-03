from uuid import uuid4

from app.database.connection import SessionLocal
from app.misconceptions.analyzer import MisconceptionAnalyzer
from app.models.misconception import MisconceptionEvent
from app.models.user import User


def create_test_user(db):
    user = User(
        name="Misconception Test Student",
        email=f"misconception-{uuid4()}@example.com",
        hashed_password="test",
        role="student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_classify_uses_keyword_rules():
    db = SessionLocal()
    try:
        analyzer = MisconceptionAnalyzer(db=db)

        assert analyzer.classify("Confuses negative and positive direction.", "Math", "Integers") == "sign_error"
        assert analyzer.classify("This is an inclusive boundary mistake.", "CS", "Arrays") == "off_by_one"
        assert analyzer.classify("The response shows an unknown conceptual mismatch.", "Science", "Forces") == "concept_confusion"
    finally:
        db.close()


def test_record_and_watchlist_aggregates_canonical_tags():
    db = SessionLocal()
    try:
        user = create_test_user(db)
        analyzer = MisconceptionAnalyzer(db=db)

        first_tag = analyzer.classify("Missed the negative direction.", "Math", "Integers")
        second_tag = analyzer.classify("Chose the opposite sign.", "Physics", "Velocity")
        third_tag = analyzer.classify("Arithmetic calculation was incorrect.", "Math", "Fractions")

        analyzer.record(user.id, "Math", "Integers", first_tag, "Missed the negative direction.", "Question one", "B")
        analyzer.record(user.id, "Physics", "Velocity", second_tag, "Chose the opposite sign.", "Question two", "C")
        analyzer.record(user.id, "Math", "Fractions", third_tag, "Arithmetic calculation was incorrect.", "Question three", "D")

        watchlist = analyzer.watchlist(user.id)

        assert watchlist[0]["tag"] == "sign_error"
        assert watchlist[0]["label"] == "Sign / Direction Error"
        assert watchlist[0]["count"] == 2
        assert set(watchlist[0]["topics"]) == {"Math", "Physics"}
        assert watchlist[1]["tag"] == "calculation_error"
        assert watchlist[1]["count"] == 1
    finally:
        if "user" in locals():
            db.query(MisconceptionEvent).filter(MisconceptionEvent.user_id == user.id).delete()
            db.query(User).filter(User.id == user.id).delete()
            db.commit()
        db.close()
