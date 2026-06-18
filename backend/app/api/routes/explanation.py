from fastapi import APIRouter
from app.schemas.explanation import ExplanationRequest, ExplanationResponse
from app.services.explanation_service import ExplanationService

router = APIRouter()
service = ExplanationService()

@router.post("/", response_model=ExplanationResponse)
async def generate_explanation(request: ExplanationRequest):
    """
    TODO: Add appropriate validation, error handling, and authentication.
    """
    return await service.get_explanation(request)
