from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.security import decode_access_token
from backend.app.database.mongodb import get_users_collection

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """Verify JWT bearer token and retrieve authenticated user profile."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub") or payload.get("user_id") or payload.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
        )
    
    users_coll = get_users_collection()
    user = await users_coll.find_one({"$or": [{"_id": user_id}, {"id": user_id}, {"email": payload.get("email")}]})
    
    if not user:
        # Fallback to payload representation if user document is in transient demo session
        return {
            "_id": user_id,
            "id": user_id,
            "name": payload.get("name", "Alex Mercer"),
            "email": payload.get("email", "alex@example.com"),
            "preferred_language": payload.get("preferred_language", "en"),
            "accessibility_settings": payload.get("accessibility_settings", {
                "font_size": "large",
                "high_contrast": False,
                "theme": "light",
                "reduced_motion": False,
            })
        }
    
    # Normalize ID
    user["id"] = str(user.get("_id", user.get("id", user_id)))
    return user

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[Dict[str, Any]]:
    """Optional user dependency for public endpoints with personalized context."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

