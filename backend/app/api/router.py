from fastapi import APIRouter
from app.api.endpoints import quiz, users, educators, analytics
from app.api.routes import socratic, explanation, review, dashboard

api_router = APIRouter()
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(educators.router, prefix="/educators", tags=["educators"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(socratic.router, prefix="/socratic", tags=["socratic"])
api_router.include_router(explanation.router, prefix="/explanation", tags=["explanation"])
api_router.include_router(review.router, prefix="/review", tags=["review"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
