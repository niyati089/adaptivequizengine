from app.agents.socratic_agent import SocraticAgent
from app.schemas.socratic import SocraticRequest, SocraticResponse

class SocraticService:
    def __init__(self):
        self.agent = SocraticAgent()

    async def get_socratic_feedback(self, request: SocraticRequest) -> SocraticResponse:
        # TODO: Add logic to check if user_answer is actually incorrect, 
        # assuming the caller has already determined this for now.
        hint = await self.agent.generate_hint(
            question=request.question,
            user_answer=request.user_answer,
            correct_answer=request.correct_answer
        )
        return SocraticResponse(mode="socratic", hint=hint)
