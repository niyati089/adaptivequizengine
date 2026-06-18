from fastapi import APIRouter

router = APIRouter()

@router.post("/start")
def start_quiz():
    """
    TODO: Implement start quiz endpoint.
    """
    pass

@router.post("/submit")
def submit_answer():
    """
    TODO: Implement submit answer and get next question.
    """
    pass
