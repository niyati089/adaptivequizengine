from app.agents.explanation_agent import ExplanationAgent
from app.agents.mermaid_utils import compile_mermaid_to_url
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
        
        # Compile Mermaid diagram to URL if diagram syntax exists
        diagram_url = None
        mermaid_diagram = result.get("mermaid_diagram")
        if mermaid_diagram:
            diagram_url = await compile_mermaid_to_url(mermaid_diagram)
        
        return ExplanationResponse(
            explanation=result.get("explanation", "No explanation available."),
            key_takeaway=result.get("key_takeaway", "No takeaway available."),
            example=result.get("example"),
            common_mistake=result.get("common_mistake"),
            mermaid_diagram=mermaid_diagram,
            diagram_url=diagram_url
        )
