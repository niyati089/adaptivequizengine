from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.endpoints.users import get_current_user
from app.database.session import get_db
from app.misconceptions.analyzer import MisconceptionAnalyzer
from app.models.user import User

router = APIRouter()


@router.get("/watchlist")
def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analyzer = MisconceptionAnalyzer(db=db)
    return {"watchlist": analyzer.watchlist(current_user.id)}
