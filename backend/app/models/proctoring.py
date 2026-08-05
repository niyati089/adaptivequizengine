from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.time_utils import utcnow
from app.models.base import Base

class ProctoringEvent(Base):
    """Records suspicious activity during proctored quizzes.

    Tracks various proctoring violations including:
    - Browser behavior: tab switches, copy/paste, context menu, window blur
    - Face detection: no face, multiple people
    - Object detection: phones, papers/books
    - Attention: looking away from screen
    """
    __tablename__ = "proctoring_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    classroom_quiz_id = Column(Integer, ForeignKey("classroom_quizzes.id"), index=True, nullable=False)
    attempt_id = Column(Integer, ForeignKey("question_attempts.id", ondelete="SET NULL"), index=True, nullable=True)

    # Session token to group events from the same quiz attempt
    # This ensures violations are tracked per quiz attempt, not accumulated across all attempts
    session_token = Column(String, index=True, nullable=True)

    # Event type - expanded to include AI proctoring events
    # Browser: "tab_switch", "copy", "paste", "context_menu", "window_blur"
    # AI Vision: "no_face_detected", "multiple_people", "phone_detected",
    #            "paper_detected", "looking_away"
    event_type = Column(String, index=True, nullable=False)

    # Additional context about the event
    event_data = Column(Text, nullable=True)

    # Severity level: "low", "medium", "high", "critical"
    # Helps teachers prioritize which violations to review
    severity = Column(String, default="medium", nullable=False)

    # AI confidence score (0.0 - 1.0) for vision-based detections
    confidence = Column(Integer, nullable=True)  # Stored as int (0-100)

    # Whether this was a false positive (teacher can mark after review)
    is_false_positive = Column(Boolean, default=False, nullable=False)

    # Timestamp when the event occurred
    timestamp = Column(DateTime, default=utcnow, index=True, nullable=False)

    # Relationships
    user = relationship("User")
    quiz = relationship("ClassroomQuiz", back_populates="proctoring_events")
