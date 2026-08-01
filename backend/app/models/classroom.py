from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from app.core.time_utils import utcnow
from app.models.base import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    subject = Column(String, index=True, nullable=True)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    teacher = relationship("User")
    enrollments = relationship("ClassEnrollment", cascade="all, delete-orphan", back_populates="classroom")
    quizzes = relationship("ClassroomQuiz", cascade="all, delete-orphan", back_populates="classroom")


class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"
    __table_args__ = (
        UniqueConstraint("classroom_id", "student_id", name="uq_classroom_student"),
    )

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), index=True, nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    status = Column(String, default="pending", index=True)
    requested_at = Column(DateTime, default=utcnow)
    decided_at = Column(DateTime, nullable=True)

    classroom = relationship("Classroom", back_populates="enrollments")
    student = relationship("User")


class ClassroomQuiz(Base):
    __tablename__ = "classroom_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), index=True, nullable=False)
    title = Column(String, nullable=False)
    topic = Column(String, index=True, nullable=False)
    subtopic = Column(String, nullable=True)
    bloom_level = Column(String, default="Remembering")
    starting_difficulty = Column(Float, default=0.0)
    enable_anti_cheating = Column(Boolean, default=False, nullable=False)
    enable_proctoring = Column(Boolean, default=False, nullable=False)
    max_proctoring_warnings = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    classroom = relationship("Classroom", back_populates="quizzes")
    proctoring_events = relationship("ProctoringEvent", back_populates="quiz")
