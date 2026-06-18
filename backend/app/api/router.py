from fastapi import APIRouter
from app.api.endpoints import quiz, users, educators, analytics

api_router = APIRouter()
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(educators.router, prefix="/educators", tags=["educators"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
