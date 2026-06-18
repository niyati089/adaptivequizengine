from fastapi import APIRouter, Depends
from app.api.endpoints.users import get_current_student
from app.models.user import User

router = APIRouter()

@router.post("/start")
def start_quiz(current_user: User = Depends(get_current_student)):
    """
    TODO: Implement start quiz endpoint.
    """
    pass

@router.post("/submit")
def submit_answer(current_user: User = Depends(get_current_student)):
    """
    TODO: Implement submit answer and get next question.
    """
    pass

