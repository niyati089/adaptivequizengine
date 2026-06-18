from fastapi import APIRouter

router = APIRouter()

@router.get("/{user_id}")
def get_user(user_id: int):
    """
    TODO: Implement user fetching.
    """
    pass
