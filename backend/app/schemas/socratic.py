from pydantic import BaseModel
from typing import Optional


class SocraticRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    confidence: int  # 0-5 scale
    hint_level: int = 1  # Legacy field for the basic /socratic route
    theta: Optional[float] = 0.0  # Learner ability from IRT
    user_id: Optional[int] = None
    session_id: Optional[str] = None  # Track hint session for multi-level hints
    question_options: Optional[dict] = None  # Multiple choice options {A: "...", B: "...", etc}


class SocraticResponse(BaseModel):
    mode: str  # "socratic_adaptive", "hint_maxed", "error"
    hint: str
    hint_id: Optional[str] = None
    hint_level: Optional[int] = None  # 1-5 scale
    hint_level_label: Optional[str] = None  # "minimal", "probing", etc
    hint_type: Optional[str] = None  # "nudge", "probe", "guidance", etc
    misconception: Optional[str] = None  # Identified misconception
    next_level_available: Optional[bool] = None  # Can escalate to next level
    dialogue_turn: Optional[int] = None  # Which turn in the dialogue
    learner_theta: Optional[float] = None
    confidence: Optional[int] = None
