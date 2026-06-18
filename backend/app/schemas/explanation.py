from pydantic import BaseModel

class ExplanationRequest(BaseModel):
    question: str
    correct_answer: str
    difficulty: str  # e.g., "easy", "medium", "hard"

class ExplanationResponse(BaseModel):
    explanation: str
    key_takeaway: str
