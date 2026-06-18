from fastapi import APIRouter
from app.schemas.dashboard import RevisionMetricsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()
service = DashboardService()

@router.get("/revision", response_model=RevisionMetricsResponse)
def get_revision_dashboard():
    """
    Retrieve revision analytics metrics for the dashboard.
    TODO: Add appropriate authorization to extract actual user_id from token.
    """
    # MOCK user_id
    user_id = 1
    return service.get_revision_metrics(user_id)
