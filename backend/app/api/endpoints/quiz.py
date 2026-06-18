from fastapi import APIRouter
from app.schemas.quiz_schema import AnswerSubmit, AnswerResponse
from app.services.quiz_service import QuizService

router = APIRouter()
quiz_service = QuizService()

@router.post("/start")
def start_quiz(current_user: User = Depends(get_current_student)):
    """
    TODO: Implement start quiz endpoint.
    """
    pass

@router.post("/submit", response_model=AnswerResponse)
async def submit_answer(answer: AnswerSubmit):
    """
    Submit an answer and get evaluation feedback, potentially including a Socratic hint.
    """
    # TODO: Retrieve actual user_id from auth context
    user_id = 1
    return await quiz_service.evaluate_answer(user_id, answer)
