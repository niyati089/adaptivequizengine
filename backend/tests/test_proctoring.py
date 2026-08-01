"""Tests for proctoring event recording and retrieval."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.classroom import Classroom, ClassroomQuiz
from app.models.proctoring import ProctoringEvent
from app.models.user import User


class TestProctoringEventRecording:
    """Tests for POST /api/proctoring/event endpoint."""
    
    def test_record_proctoring_event_success(
        self, client: TestClient, test_student_token: str, test_classroom_quiz: ClassroomQuiz, db: Session
    ):
        """Student can record a proctoring event for an active quiz."""
        # Enable proctoring on the quiz
        test_classroom_quiz.enable_proctoring = True
        test_classroom_quiz.max_proctoring_warnings = 3
        db.commit()
        
        response = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "tab_switch",
                "event_data": "User switched to another tab"
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "event_id" in data
        assert data["warning_count"] == 1
        assert data["max_warnings"] == 3
        assert data["exceeded"] is False
        
        # Verify event was stored in database
        event = db.query(ProctoringEvent).filter(
            ProctoringEvent.id == data["event_id"]
        ).first()
        assert event is not None
        assert event.event_type == "tab_switch"
        assert event.event_data == "User switched to another tab"
    
    def test_record_multiple_events_tracks_count(
        self, client: TestClient, test_student_token: str, test_classroom_quiz: ClassroomQuiz, db: Session
    ):
        """Multiple events increment the warning count correctly."""
        test_classroom_quiz.enable_proctoring = True
        test_classroom_quiz.max_proctoring_warnings = 3
        db.commit()
        
        # Record first event
        response1 = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "tab_switch",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        assert response1.json()["warning_count"] == 1
        assert response1.json()["exceeded"] is False
        
        # Record second event
        response2 = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "copy",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        assert response2.json()["warning_count"] == 2
        assert response2.json()["exceeded"] is False
        
        # Record third event
        response3 = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "paste",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        assert response3.json()["warning_count"] == 3
        assert response3.json()["exceeded"] is False
        
        # Record fourth event - should exceed threshold
        response4 = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "window_blur",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        assert response4.json()["warning_count"] == 4
        assert response4.json()["exceeded"] is True
    
    def test_proctoring_disabled_returns_error(
        self, client: TestClient, test_student_token: str, test_classroom_quiz: ClassroomQuiz, db: Session
    ):
        """Cannot record events when proctoring is disabled."""
        test_classroom_quiz.enable_proctoring = False
        db.commit()
        
        response = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "tab_switch",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        
        assert response.status_code == 400
        assert "not enabled" in response.json()["detail"].lower()
    
    def test_invalid_event_type_returns_error(
        self, client: TestClient, test_student_token: str, test_classroom_quiz: ClassroomQuiz, db: Session
    ):
        """Invalid event types are rejected."""
        test_classroom_quiz.enable_proctoring = True
        db.commit()
        
        response = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "invalid_event",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        
        assert response.status_code == 422
        assert "Input should be" in response.json()["detail"][0]["msg"]
    
    def test_nonexistent_quiz_returns_error(
        self, client: TestClient, test_student_token: str
    ):
        """Recording event for non-existent quiz returns 404."""
        response = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": 99999,
                "event_type": "tab_switch",
            },
            headers={"Authorization": f"Bearer {test_student_token}"}
        )
        
        assert response.status_code == 404
    
    def test_teacher_cannot_record_events(
        self, client: TestClient, test_teacher_token: str, test_classroom_quiz: ClassroomQuiz, db: Session
    ):
        """Teachers cannot record proctoring events (students only)."""
        test_classroom_quiz.enable_proctoring = True
        db.commit()
        
        response = client.post(
            "/api/proctoring/event",
            json={
                "classroom_quiz_id": test_classroom_quiz.id,
                "event_type": "tab_switch",
            },
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        
        assert response.status_code == 403


class TestProctoringDashboard:
    """Tests for proctoring dashboard endpoints."""
    
    def test_teacher_can_view_quiz_events(
        self, client: TestClient, test_teacher_token: str, test_classroom_quiz: ClassroomQuiz,
        test_student: User, db: Session
    ):
        """Teacher can view all proctoring events for their quiz."""
        test_classroom_quiz.enable_proctoring = True
        db.commit()
        
        # Create some events
        event1 = ProctoringEvent(
            user_id=test_student.id,
            classroom_quiz_id=test_classroom_quiz.id,
            event_type="tab_switch",
            event_data="Switched tabs"
        )
        event2 = ProctoringEvent(
            user_id=test_student.id,
            classroom_quiz_id=test_classroom_quiz.id,
            event_type="copy",
            event_data="Copied text"
        )
        db.add_all([event1, event2])
        db.commit()
        
        response = client.get(
            f"/api/proctoring/quiz/{test_classroom_quiz.id}/events",
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quiz_id"] == test_classroom_quiz.id
        assert data["max_warnings"] == test_classroom_quiz.max_proctoring_warnings
        assert len(data["students"]) == 1
        
        student_data = data["students"][0]
        assert student_data["student_id"] == test_student.id
        assert student_data["total_events"] == 2
        assert "tab_switch" in student_data["events_by_type"]
        assert "copy" in student_data["events_by_type"]
    
    def test_teacher_cannot_view_other_teacher_quiz_events(
        self, client: TestClient, test_teacher_token: str, db: Session
    ):
        """Teacher cannot view proctoring events for another teacher's quiz."""
        # Create another teacher and their quiz
        from app.core.security import security_utils
        other_teacher = User(
            name="Other Teacher",
            email="other@teacher.com",
            hashed_password=security_utils.hash_password("password"),
            role="teacher"
        )
        db.add(other_teacher)
        db.commit()
        
        other_classroom = Classroom(
            name="Other Class",
            teacher_id=other_teacher.id
        )
        db.add(other_classroom)
        db.commit()
        
        other_quiz = ClassroomQuiz(
            classroom_id=other_classroom.id,
            title="Other Quiz",
            topic="Test",
            enable_proctoring=True
        )
        db.add(other_quiz)
        db.commit()
        
        response = client.get(
            f"/api/proctoring/quiz/{other_quiz.id}/events",
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        
        assert response.status_code == 403
    
    def test_filter_events_by_student(
        self, client: TestClient, test_teacher_token: str, test_classroom_quiz: ClassroomQuiz,
        test_student: User, db: Session
    ):
        """Teacher can filter proctoring events by specific student."""
        test_classroom_quiz.enable_proctoring = True
        db.commit()
        
        # Create events for the student
        event = ProctoringEvent(
            user_id=test_student.id,
            classroom_quiz_id=test_classroom_quiz.id,
            event_type="tab_switch"
        )
        db.add(event)
        db.commit()
        
        response = client.get(
            f"/api/proctoring/quiz/{test_classroom_quiz.id}/events?student_id={test_student.id}",
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["students"]) == 1
        assert data["students"][0]["student_id"] == test_student.id
    
    def test_get_flagged_students(
        self, client: TestClient, test_teacher_token: str, test_classroom_quiz: ClassroomQuiz,
        test_student: User, test_enrollment, db: Session
    ):
        """Teacher can retrieve students who exceeded warning threshold."""
        test_classroom_quiz.enable_proctoring = True
        test_classroom_quiz.max_proctoring_warnings = 2
        db.commit()
        
        # Create events that exceed threshold
        for i in range(3):
            event = ProctoringEvent(
                user_id=test_student.id,
                classroom_quiz_id=test_classroom_quiz.id,
                event_type="tab_switch"
            )
            db.add(event)
        db.commit()
        
        response = client.get(
            f"/api/proctoring/student/{test_student.id}/flagged",
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["student_id"] == test_student.id
        assert data["total_flagged"] == 1
        assert len(data["flagged_quizzes"]) == 1
        
        flagged_quiz = data["flagged_quizzes"][0]
        assert flagged_quiz["quiz_id"] == test_classroom_quiz.id
        assert flagged_quiz["event_count"] == 3
        assert flagged_quiz["exceeded"] is True


class TestProctoringIntegration:
    """Integration tests for complete proctoring workflow."""
    
    def test_complete_proctoring_workflow(
        self, client: TestClient, test_student_token: str, test_teacher_token: str,
        test_classroom_quiz: ClassroomQuiz, test_student: User, test_enrollment, db: Session
    ):
        """End-to-end test of proctoring feature."""
        # 1. Enable proctoring on quiz
        test_classroom_quiz.enable_proctoring = True
        test_classroom_quiz.max_proctoring_warnings = 2
        db.commit()
        
        # 2. Student takes quiz and triggers events
        for event_type in ["tab_switch", "copy", "paste"]:
            response = client.post(
                "/api/proctoring/event",
                json={
                    "classroom_quiz_id": test_classroom_quiz.id,
                    "event_type": event_type,
                },
                headers={"Authorization": f"Bearer {test_student_token}"}
            )
            assert response.status_code == 200
        
        # 3. Teacher views quiz proctoring dashboard
        response = client.get(
            f"/api/proctoring/quiz/{test_classroom_quiz.id}/events",
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["students"]) == 1
        assert data["students"][0]["total_events"] == 3
        
        # 4. Teacher checks flagged students
        response = client.get(
            f"/api/proctoring/student/{test_student.id}/flagged",
            headers={"Authorization": f"Bearer {test_teacher_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_flagged"] == 1  # Exceeded 2-warning threshold
