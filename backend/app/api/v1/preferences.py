from typing import Optional
from fastapi import APIRouter, Depends, status, Response
from backend.app.schemas.preferences import UserPreferencesSchema
from backend.app.services.preferences_service import preferences_service
from backend.app.core.dependencies import get_current_user, get_current_user_optional
from backend.app.utils.responses import success_response

router = APIRouter(tags=["Preferences"])

@router.get("/preferences")
async def get_preferences(current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Retrieve accessibility, voice, and language preferences for authenticated user."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    prefs = await preferences_service.get_preferences(user_id)
    return success_response(
        data=prefs,
        message="Preferences retrieved successfully",
        extra_fields=prefs,
    )

@router.put("/preferences")
@router.patch("/preferences")
async def update_preferences(
    req: UserPreferencesSchema,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Update accessibility, speech rate, volume, and language preferences."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    updates = req.model_dump(exclude_unset=True)
    updated = await preferences_service.update_preferences(user_id, updates)
    return success_response(
        data=updated,
        message="Preferences updated successfully",
        extra_fields=updated,
    )

# Voice Cloning Consent Endpoints (SRC-07 / FR-013)
@router.post("/voice-consents", status_code=status.HTTP_201_CREATED)
async def grant_voice_consent(
    payload: dict,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Grant informed consent for cloned voice model generation."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    await preferences_service.update_preferences(user_id, {"voice_cloning_consent": True})
    return success_response(
        data={"consent_id": "vc_" + user_id[:8], "status": "active"},
        message="Voice cloning consent granted and recorded",
        status_code=status.HTTP_201_CREATED,
        extra_fields={"consent_id": "vc_" + user_id[:8], "status": "active"},
    )

@router.delete("/voice-consents/{consent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_voice_consent(
    consent_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Revoke consent for voice cloning models."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    await preferences_service.update_preferences(user_id, {"voice_cloning_consent": False})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
