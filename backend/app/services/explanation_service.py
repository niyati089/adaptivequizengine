from app.agents.explanation_agent import ExplanationAgent
from app.schemas.explanation import ExplanationRequest, ExplanationResponse

class ExplanationService:
    def __init__(self):
        self.agent = ExplanationAgent()

    async def get_explanation(self, request: ExplanationRequest) -> ExplanationResponse:
        # TODO: Add additional business logic if needed (e.g., fetching learner profile to adjust difficulty dynamically)
        result = await self.agent.generate_explanation(
            question=request.question,
            correct_answer=request.correct_answer,
            difficulty=request.difficulty
        )
        
        return ExplanationResponse(
            explanation=result.get("explanation", "No explanation available."),
            key_takeaway=result.get("key_takeaway", "No takeaway available.")
        )
