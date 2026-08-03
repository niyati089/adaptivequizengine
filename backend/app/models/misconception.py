from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.core.time_utils import utcnow
from app.models.base import Base


class MisconceptionTag(Base):
    """Canonical, reusable misconception categories."""

    __tablename__ = "misconception_tags"

    id = Column(Integer, primary_key=True, index=True)
    tag = Column(String, unique=True, index=True, nullable=False)
    label = Column(String, nullable=False)
    description = Column(String, nullable=False)


class MisconceptionEvent(Base):
    """One record per wrong answer tagged with a canonical misconception."""

    __tablename__ = "misconception_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    topic = Column(String, index=True, nullable=False)
    subtopic = Column(String, index=True, nullable=False)
    tag_id = Column(Integer, ForeignKey("misconception_tags.id"), index=True)
    raw_misconception_text = Column(String)
    question_snippet = Column(String)
    selected_option = Column(String)
    created_at = Column(DateTime, default=utcnow)
