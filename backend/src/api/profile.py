from fastapi import APIRouter, Depends
from src.core.user_detail import get_current_user

router_profile = APIRouter()


@router_profile.get("/")
def get_profile(
    current_user=Depends(get_current_user)
):

    return {
        "success": True,
        "user": {
            "id": current_user["id"],
            "name": current_user.get("name"),
            "email": current_user.get("email"),
            # "picture": current_user.get("picture")
        }
    }