from pydantic import BaseModel

class SocraticRequest(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    confidence: int

class SocraticResponse(BaseModel):
    mode: str
    hint: str
