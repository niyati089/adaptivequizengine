from app.schemas.quiz_schema import AnswerSubmit, AnswerResponse
from app.services.socratic_service import SocraticService
from app.schemas.socratic import SocraticRequest

class QuizService:
    """
    Business logic for managing quiz flow.
    """
    def __init__(self):
        self.socratic_service = SocraticService()
        
    async def evaluate_answer(self, user_id: int, answer: AnswerSubmit) -> AnswerResponse:
        """
        Evaluate answer and return either normal or socratic feedback.
        """
        # MOCK logic: assuming we fetch the question from the database
        mock_question_text = "What is the capital of France?"
        mock_correct_answer = "Paris"
        
        # MOCK evaluation
        is_correct = (answer.selected_option.lower() == mock_correct_answer.lower())
        
        if not is_correct and answer.confidence >= 4:
            socratic_req = SocraticRequest(
                question=mock_question_text,
                user_answer=answer.selected_option,
                correct_answer=mock_correct_answer,
                confidence=answer.confidence
            )
            socratic_res = await self.socratic_service.get_socratic_feedback(socratic_req)
            
            return AnswerResponse(
                correct=False,
                feedback_mode="socratic",
                hint=socratic_res.hint
            )
            
        return AnswerResponse(
            correct=is_correct,
            feedback_mode="normal",
            hint=None
        )
