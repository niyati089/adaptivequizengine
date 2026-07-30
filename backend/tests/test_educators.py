import pytest
from app.models.attempt import QuestionAttempt
from app.models.user import User
from app.database.connection import SessionLocal

def test_educator_dashboard_mock_fallback(client):
    response = client.get("/api/educators/dashboard?topic=NonexistentTopic")
    assert response.status_code == 200
    data = response.json()
    assert data["is_mock"] is True
    assert "kpis" in data
    assert "students" in data
    assert len(data["students"]) > 0

def test_educator_dashboard_real_data(client):
    db = SessionLocal()
    try:
        # Seed a student user
        student = User(
            name="Test Student",
            email="test_student@example.com",
            hashed_password="somepassword",
            role="student"
        )
        db.add(student)
        db.commit()
        db.refresh(student)

        # Seed some attempts
        attempt1 = QuestionAttempt(
            user_id=student.id,
            topic="Maths",
            subtopic="Fractions",
            question_text="What is 1/2 + 1/4?",
            selected_option="A",
            correct_option="A",
            is_correct=True,
            misconception=None,
            theta_before=0.0,
            theta_after=0.3
        )
        attempt2 = QuestionAttempt(
            user_id=student.id,
            topic="Maths",
            subtopic="Fractions",
            question_text="What is 1/2 - 1/4?",
            selected_option="B",
            correct_option="A",
            is_correct=False,
            misconception="Subtracting unlike denominators",
            theta_before=0.3,
            theta_after=0.1
        )
        db.add(attempt1)
        db.add(attempt2)
        db.commit()

        response = client.get("/api/educators/dashboard?topic=Maths")
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_mock"] is False
        assert data["kpis"]["active_students"] == "1"
        assert data["kpis"]["active_misconceptions"] == "1"
        assert len(data["students"]) == 1
        assert data["students"][0]["name"] == "Test Student"
        assert data["students"][0]["topics"] == 1  # 1 subtopic mastered (Fractions, because attempt1 is correct)

        # Clean up seeded objects
        db.delete(attempt1)
        db.delete(attempt2)
        db.delete(student)
        db.commit()
    finally:
        db.close()

def test_get_re_teaching_recommendations(client):
    response = client.get("/api/educators/re-teaching?topic=Maths")
    assert response.status_code == 200
    data = response.json()
    assert "recommendation" in data
    assert "re-teaching" in data["recommendation"].lower() or "recommendations" in data["recommendation"].lower()
