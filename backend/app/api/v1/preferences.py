from fastapi import APIRouter, Depends
from typing import Optional
from backend.app.schemas.preferences import UserPreferencesSchema
from backend.app.core.database import get_preferences_collection
from backend.app.core.security import get_current_user_optional

router = APIRouter(tags=["User Preferences"])

@router.get("/preferences", response_model=UserPreferencesSchema)
async def get_preferences(current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "anonymous"
    prefs_col = get_preferences_collection()
    doc = await prefs_col.find_one({"user_id": user_id})
    if not doc:
        return UserPreferencesSchema(user_id=user_id)
    return UserPreferencesSchema(**doc)

@router.patch("/preferences", response_model=UserPreferencesSchema)
@router.put("/preferences", response_model=UserPreferencesSchema)
async def update_preferences(req: UserPreferencesSchema, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "anonymous"
    prefs_col = get_preferences_collection()
    data = req.dict(exclude_unset=True)
    data["user_id"] = user_id

    await prefs_col.update_one({"user_id": user_id}, {"$set": data})
    updated = await prefs_col.find_one({"user_id": user_id})
    if not updated:
        await prefs_col.insert_one(data)
        updated = data
    return UserPreferencesSchema(**updated)

