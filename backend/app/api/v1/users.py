from fastapi import APIRouter, Depends, status
from backend.app.schemas.user import UserUpdateRequest
from backend.app.services.auth_service import auth_service
from backend.app.core.dependencies import get_current_user
from backend.app.utils.responses import success_response

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve current user profile and accessibility settings."""
    profile = await auth_service.get_profile(current_user["id"])
    return success_response(
        data=profile,
        message="User profile retrieved successfully",
        extra_fields=profile,
    )

@router.patch("/me")
@router.put("/me")
async def update_current_user_profile(
    req: UserUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile (name, language, accessibility preferences)."""
    updates = req.model_dump(exclude_unset=True)
    updated = await auth_service.update_profile(current_user["id"], updates)
    return success_response(
        data=updated,
        message="User profile updated successfully",
        extra_fields=updated,
    )

