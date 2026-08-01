from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.endpoints.users import get_current_student, get_current_teacher, get_current_user
from app.core.time_utils import utcnow
from app.database.session import get_db
from app.models.attempt import QuestionAttempt
from app.models.classroom import Classroom, ClassEnrollment, ClassroomQuiz
from app.models.user import User

router = APIRouter()


class ClassroomCreate(BaseModel):
    name: str
    subject: Optional[str] = None
    description: Optional[str] = None


class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None


class QuizCreate(BaseModel):
    title: str
    topic: str
    subtopic: Optional[str] = "General"
    bloom_level: Optional[str] = "Remembering"
    starting_difficulty: Optional[float] = 0.0
    enable_anti_cheating: Optional[bool] = False
    enable_proctoring: Optional[bool] = False
    max_proctoring_warnings: Optional[int] = 3


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    subtopic: Optional[str] = None
    bloom_level: Optional[str] = None
    starting_difficulty: Optional[float] = None
    enable_anti_cheating: Optional[bool] = None
    enable_proctoring: Optional[bool] = None
    max_proctoring_warnings: Optional[int] = None


def _require_owner(classroom_id: int, teacher: User, db: Session) -> Classroom:
    classroom = (
        db.query(Classroom)
        .filter(Classroom.id == classroom_id, Classroom.teacher_id == teacher.id)
        .first()
    )
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    return classroom


def _classroom_payload(classroom: Classroom, current_user: Optional[User] = None, db: Optional[Session] = None):
    enrollment = None
    if current_user and db and current_user.role == "student":
        enrollment = (
            db.query(ClassEnrollment)
            .filter(
                ClassEnrollment.classroom_id == classroom.id,
                ClassEnrollment.student_id == current_user.id,
            )
            .first()
        )

    approved_count = sum(1 for item in classroom.enrollments if item.status == "approved")
    return {
        "id": classroom.id,
        "name": classroom.name,
        "subject": classroom.subject,
        "description": classroom.description,
        "teacher": classroom.teacher.name if classroom.teacher else "Teacher",
        "teacher_id": classroom.teacher_id,
        "approved_students": approved_count,
        "quiz_count": len(classroom.quizzes),
        "enrollment_status": enrollment.status if enrollment else None,
    }


@router.get("")
def list_classes(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    classes = db.query(Classroom).order_by(Classroom.created_at.desc()).all()
    return [_classroom_payload(item, current_user, db) for item in classes]


@router.post("")
def create_classroom(
    payload: ClassroomCreate,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    classroom = Classroom(
        name=payload.name,
        subject=payload.subject,
        description=payload.description,
        teacher_id=teacher.id,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return _classroom_payload(classroom)


@router.get("/mine")
def my_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "teacher":
        classes = (
            db.query(Classroom)
            .filter(Classroom.teacher_id == current_user.id)
            .order_by(Classroom.created_at.desc())
            .all()
        )
        return [_teacher_class_payload(item, db) for item in classes]

    enrollments = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.student_id == current_user.id, ClassEnrollment.status == "approved")
        .all()
    )
    return [_student_class_payload(enrollment.classroom) for enrollment in enrollments]


@router.get("/quizzes/{quiz_id}")
def get_class_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(ClassroomQuiz).filter(ClassroomQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if current_user.role == "teacher":
        if quiz.classroom.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your class quiz")
    else:
        enrollment = (
            db.query(ClassEnrollment)
            .filter(
                ClassEnrollment.classroom_id == quiz.classroom_id,
                ClassEnrollment.student_id == current_user.id,
                ClassEnrollment.status == "approved",
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(status_code=403, detail="You are not enrolled in this class")

    return _quiz_payload(quiz)


@router.put("/{classroom_id}")
def update_classroom(
    classroom_id: int,
    payload: ClassroomUpdate,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    classroom = _require_owner(classroom_id, teacher, db)
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(classroom, field, value)
    db.commit()
    db.refresh(classroom)
    return _teacher_class_payload(classroom, db)


@router.delete("/{classroom_id}")
def delete_classroom(
    classroom_id: int,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    classroom = _require_owner(classroom_id, teacher, db)
    db.query(QuestionAttempt).filter(QuestionAttempt.classroom_id == classroom.id).update({
        QuestionAttempt.classroom_id: None,
        QuestionAttempt.classroom_quiz_id: None,
    })
    db.delete(classroom)
    db.commit()
    return {"ok": True}


@router.post("/{classroom_id}/request")
def request_to_join(
    classroom_id: int,
    student: User = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")

    enrollment = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.classroom_id == classroom_id, ClassEnrollment.student_id == student.id)
        .first()
    )
    if enrollment:
        if enrollment.status == "rejected":
            enrollment.status = "pending"
            enrollment.requested_at = utcnow()
            enrollment.decided_at = None
            db.commit()
            return {"status": enrollment.status}
        return {"status": enrollment.status}

    enrollment = ClassEnrollment(classroom_id=classroom_id, student_id=student.id, status="pending")
    db.add(enrollment)
    db.commit()
    return {"status": "pending"}


@router.post("/{classroom_id}/requests/{enrollment_id}/{decision}")
def decide_request(
    classroom_id: int,
    enrollment_id: int,
    decision: str,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    _require_owner(classroom_id, teacher, db)
    if decision not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Decision must be approve or reject")

    enrollment = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.id == enrollment_id, ClassEnrollment.classroom_id == classroom_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment request not found")

    enrollment.status = "approved" if decision == "approve" else "rejected"
    enrollment.decided_at = utcnow()
    db.commit()
    return {"status": enrollment.status}


@router.delete("/{classroom_id}/students/{enrollment_id}")
def remove_student(
    classroom_id: int,
    enrollment_id: int,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    _require_owner(classroom_id, teacher, db)
    enrollment = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.id == enrollment_id, ClassEnrollment.classroom_id == classroom_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return {"ok": True}


@router.post("/{classroom_id}/quizzes")
def create_quiz(
    classroom_id: int,
    payload: QuizCreate,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    _require_owner(classroom_id, teacher, db)
    quiz = ClassroomQuiz(
        classroom_id=classroom_id,
        title=payload.title,
        topic=payload.topic,
        subtopic=payload.subtopic,
        bloom_level=payload.bloom_level,
        starting_difficulty=payload.starting_difficulty,
        enable_anti_cheating=payload.enable_anti_cheating or False,
        enable_proctoring=payload.enable_proctoring or False,
        max_proctoring_warnings=payload.max_proctoring_warnings or 3,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return _quiz_payload(quiz)


@router.put("/{classroom_id}/quizzes/{quiz_id}")
def update_quiz(
    classroom_id: int,
    quiz_id: int,
    payload: QuizUpdate,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    _require_owner(classroom_id, teacher, db)
    quiz = (
        db.query(ClassroomQuiz)
        .filter(ClassroomQuiz.id == quiz_id, ClassroomQuiz.classroom_id == classroom_id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(quiz, field, value)
    db.commit()
    db.refresh(quiz)
    return _quiz_payload(quiz)


@router.delete("/{classroom_id}/quizzes/{quiz_id}")
def delete_quiz(
    classroom_id: int,
    quiz_id: int,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    _require_owner(classroom_id, teacher, db)
    quiz = (
        db.query(ClassroomQuiz)
        .filter(ClassroomQuiz.id == quiz_id, ClassroomQuiz.classroom_id == classroom_id)
        .first()
    )
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.query(QuestionAttempt).filter(QuestionAttempt.classroom_quiz_id == quiz.id).update({
        QuestionAttempt.classroom_quiz_id: None,
    })
    db.delete(quiz)
    db.commit()
    return {"ok": True}


@router.get("/{classroom_id}/dashboard")
def classroom_dashboard(
    classroom_id: int,
    teacher: User = Depends(get_current_teacher),
    db: Session = Depends(get_db),
):
    classroom = _require_owner(classroom_id, teacher, db)
    return _teacher_class_payload(classroom, db)


def _quiz_payload(quiz: ClassroomQuiz):
    return {
        "id": quiz.id,
        "classroom_id": quiz.classroom_id,
        "title": quiz.title,
        "topic": quiz.topic,
        "subtopic": quiz.subtopic or "General",
        "bloom_level": quiz.bloom_level or "Remembering",
        "starting_difficulty": quiz.starting_difficulty or 0.0,
        "enable_anti_cheating": bool(quiz.enable_anti_cheating),
        "enable_proctoring": bool(quiz.enable_proctoring),
        "max_proctoring_warnings": quiz.max_proctoring_warnings or 3,
    }


def _student_payload(enrollment: ClassEnrollment, db: Session):
    attempts = (
        db.query(QuestionAttempt)
        .filter(
            QuestionAttempt.classroom_id == enrollment.classroom_id,
            QuestionAttempt.user_id == enrollment.student_id,
        )
        .all()
    )
    total = len(attempts)
    correct = sum(1 for item in attempts if item.is_correct)
    return {
        "enrollment_id": enrollment.id,
        "id": enrollment.student.id,
        "name": enrollment.student.name,
        "email": enrollment.student.email,
        "status": enrollment.status,
        "attempts": total,
        "accuracy": round((correct / total) * 100) if total else 0,
        "theta": round(attempts[-1].theta_after, 2) if attempts else 0,
    }


def _teacher_class_payload(classroom: Classroom, db: Session):
    attempts = db.query(QuestionAttempt).filter(QuestionAttempt.classroom_id == classroom.id).all()
    total = len(attempts)
    correct = sum(1 for item in attempts if item.is_correct)
    pending = [item for item in classroom.enrollments if item.status == "pending"]
    approved = [item for item in classroom.enrollments if item.status == "approved"]

    quiz_stats = []
    for quiz in classroom.quizzes:
        quiz_attempts = [item for item in attempts if item.classroom_quiz_id == quiz.id]
        quiz_correct = sum(1 for item in quiz_attempts if item.is_correct)
        quiz_stats.append({
            **_quiz_payload(quiz),
            "attempts": len(quiz_attempts),
            "accuracy": round((quiz_correct / len(quiz_attempts)) * 100) if quiz_attempts else 0,
        })

    return {
        **_classroom_payload(classroom),
        "students": [_student_payload(item, db) for item in approved],
        "requests": [_student_payload(item, db) for item in pending],
        "quizzes": quiz_stats,
        "dashboard": {
            "students": len(approved),
            "pending_requests": len(pending),
            "attempts": total,
            "accuracy": round((correct / total) * 100) if total else 0,
        },
    }


def _student_class_payload(classroom: Classroom):
    return {
        **_classroom_payload(classroom),
        "quizzes": [_quiz_payload(quiz) for quiz in classroom.quizzes],
    }
