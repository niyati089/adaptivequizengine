from pydantic import BaseModel
from typing import Optional

class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: str
    time_taken_ms: int
    confidence: int

class QuestionResponse(BaseModel):
    id: int
    content: str
    options: list[str]

class AnswerResponse(BaseModel):
    correct: bool
    feedback_mode: str
    hint: Optional[str] = None
