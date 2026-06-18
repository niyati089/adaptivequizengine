from fastapi import APIRouter
from app.schemas.socratic import SocraticRequest, SocraticResponse
from app.services.socratic_service import SocraticService

router = APIRouter()
service = SocraticService()

@router.post("/", response_model=SocraticResponse)
async def get_socratic_feedback(request: SocraticRequest):
    # TODO: Validate request, handle exceptions, add user authentication
    return await service.get_socratic_feedback(request)
