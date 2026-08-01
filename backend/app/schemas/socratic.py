from pydantic import BaseModel

class SocraticRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    confidence: int
    hint_level: int = 1

class SocraticResponse(BaseModel):
    mode: str
    hint: str
