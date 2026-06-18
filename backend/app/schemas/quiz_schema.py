from pydantic import BaseModel

class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: str
    time_taken_ms: int

class QuestionResponse(BaseModel):
    id: int
    content: str
    options: list[str]
