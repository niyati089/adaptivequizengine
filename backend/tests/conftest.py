import os

# Force tests to use an isolated local SQLite database instead of whatever
# DATABASE_URL is configured in backend/.env (e.g. a shared/live Postgres
# instance). This must run before `app.main` (and therefore app.core.config)
# is imported for the first time.
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_sql_app.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.database.connection import engine
from app.database.session import get_db
from app.misconceptions.seed_tags import seed_misconception_tags
from app.models import Base


@pytest.fixture(scope="function", autouse=True)
def _setup_test_database():
    """Create tables + seed misconception tags per test for complete isolation."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_misconception_tags(db)
    finally:
        db.close()
    yield


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def client():
    # Must be entered as a context manager so FastAPI's startup event (table
    # creation + misconception tag seeding) actually runs.
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def teacher_auth_headers(client):
    """Registers (or logs into) a teacher account and returns bearer auth headers."""
    email = "teacher_fixture@example.com"
    password = "teacherpassword"
    client.post("/api/users/register", json={
        "name": "Fixture Teacher",
        "email": email,
        "password": password,
        "role": "teacher",
    })
    response = client.post("/api/users/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(autouse=True)
def mock_groq_client():
    with patch("app.agents.socratic_agent.SocraticAgent.generate_hint", new_callable=AsyncMock) as mock_socratic, \
         patch("app.agents.explanation_agent.ExplanationAgent.generate_explanation", new_callable=AsyncMock) as mock_explanation:

        mock_socratic.return_value = "Mocked Hint or True"
        mock_explanation.return_value = {
            "explanation": "Mocked explanation",
            "key_takeaway": "Mocked takeaway"
        }

        yield


from app.models.user import User
from app.models.classroom import Classroom, ClassEnrollment, ClassroomQuiz
from app.core.security import security_utils


@pytest.fixture
def test_teacher(db):
    """Create a test teacher user with a unique email per test."""
    import uuid
    email = f"teacher_{uuid.uuid4()}@example.com"
    teacher = User(
        name="Test Teacher",
        email=email,
        hashed_password=security_utils.hash_password("password"),
        role="teacher"
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@pytest.fixture
def test_student(db):
    """Create a test student user with a unique email per test."""
    import uuid
    email = f"student_{uuid.uuid4()}@example.com"
    student = User(
        name="Test Student",
        email=email,
        hashed_password=security_utils.hash_password("password"),
        role="student"
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@pytest.fixture
def test_teacher_token(client, test_teacher):
    """Get auth token for test teacher."""
    response = client.post(
        "/api/users/login",
        json={"email": test_teacher.email, "password": "password"}
    )
    return response.json()["access_token"]


@pytest.fixture
def test_student_token(client, test_student):
    """Get auth token for test student."""
    response = client.post(
        "/api/users/login",
        json={"email": test_student.email, "password": "password"}
    )
    return response.json()["access_token"]


@pytest.fixture
def test_classroom(db, test_teacher):
    """Create a test classroom."""
    classroom = db.query(Classroom).filter(Classroom.name == "Test Classroom").first()
    if not classroom:
        classroom = Classroom(
            name="Test Classroom",
            subject="Computer Science",
            description="Test classroom for testing",
            teacher_id=test_teacher.id
        )
        db.add(classroom)
        db.commit()
        db.refresh(classroom)
    return classroom


@pytest.fixture
def test_classroom_quiz(db, test_classroom):
    """Create a test classroom quiz. Creates a fresh one every time to ensure event isolation."""
    import uuid
    quiz = ClassroomQuiz(
        classroom_id=test_classroom.id,
        title=f"Test Quiz {uuid.uuid4()}",
        topic="Testing",
        subtopic="Unit Tests",
        bloom_level="Apply",
        starting_difficulty=0.0,
        enable_anti_cheating=False,
        enable_proctoring=False,
        max_proctoring_warnings=3
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@pytest.fixture
def test_enrollment(db, test_classroom, test_student):
    """Create an approved enrollment for test student in test classroom."""
    enrollment = db.query(ClassEnrollment).filter(
        ClassEnrollment.classroom_id == test_classroom.id,
        ClassEnrollment.student_id == test_student.id
    ).first()
    if not enrollment:
        enrollment = ClassEnrollment(
            classroom_id=test_classroom.id,
            student_id=test_student.id,
            status="approved"
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
    return enrollment


@pytest.fixture
def db():
    """Provide a clean database session for each test."""
    from app.database.session import SessionLocal
    session = SessionLocal()
    yield session
    session.close()