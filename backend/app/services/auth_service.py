from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from fastapi import HTTPException, status
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.database.mongodb import (
    get_users_collection,
    get_preferences_collection,
    get_utc_now_iso,
)

class AuthService:
    async def register(
        self,
        name: str,
        email: str,
        password: str,
        preferred_language: str = "en",
        accessibility_settings: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        users_coll = get_users_collection()
        email_clean = email.lower().strip()
        
        # Check if email is already registered
        existing = await users_coll.find_one({"email": email_clean})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        user_id = "usr_" + uuid.uuid4().hex[:12]
        now = get_utc_now_iso()
        pwd_hash = hash_password(password)

        default_accessibility = {
            "font_size": "large",
            "high_contrast": False,
            "theme": "light",
            "reduced_motion": False,
            "large_buttons": True,
        }
        if accessibility_settings:
            default_accessibility.update(accessibility_settings)

        user_doc = {
            "_id": user_id,
            "id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "password_hash": pwd_hash,
            "preferred_language": preferred_language,
            "accessibility_settings": default_accessibility,
            "voice_consent": True,
            "created_at": now,
            "updated_at": now,
        }
        await users_coll.insert_one(user_doc)

        # Initialize default preferences document
        prefs_coll = get_preferences_collection()
        await prefs_coll.insert_one({
            "_id": "pref_" + user_id,
            "user_id": user_id,
            "preferred_language": preferred_language,
            "preferred_voice": None,
            "speech_speed": 1.0,
            "volume": 1.0,
            "text_size": default_accessibility.get("font_size", "large"),
            "high_contrast": default_accessibility.get("high_contrast", False),
            "reduced_motion": default_accessibility.get("reduced_motion", False),
            "voice_cloning_consent": True,
            "updated_at": now,
        })

        token = create_access_token({
            "sub": user_id,
            "user_id": user_id,
            "id": user_id,
            "email": email_clean,
            "name": name.strip(),
        })

        user_public = {
            "id": user_id,
            "_id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "preferred_language": preferred_language,
            "accessibility_settings": default_accessibility,
            "voice_consent": True,
            "created_at": now,
            "updated_at": now,
        }

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_public,
        }

    async def login(self, email: str, password: str) -> Dict[str, Any]:
        users_coll = get_users_collection()
        email_clean = email.lower().strip()
        user = await users_coll.find_one({"email": email_clean})

        if not user or not verify_password(password, user.get("password_hash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = str(user.get("_id", user.get("id")))
        token = create_access_token({
            "sub": user_id,
            "user_id": user_id,
            "id": user_id,
            "email": email_clean,
            "name": user.get("name"),
        })

        user_public = {
            "id": user_id,
            "_id": user_id,
            "name": user.get("name"),
            "email": email_clean,
            "preferred_language": user.get("preferred_language", "en"),
            "accessibility_settings": user.get("accessibility_settings", {}),
            "voice_consent": user.get("voice_consent", True),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
        }

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user_public,
        }

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        users_coll = get_users_collection()
        user = await users_coll.find_one({"$or": [{"_id": user_id}, {"id": user_id}]})
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
        return {
            "id": str(user.get("_id", user_id)),
            "_id": str(user.get("_id", user_id)),
            "name": user.get("name"),
            "email": user.get("email"),
            "preferred_language": user.get("preferred_language", "en"),
            "accessibility_settings": user.get("accessibility_settings", {}),
            "voice_consent": user.get("voice_consent", True),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
        }

    async def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        users_coll = get_users_collection()
        now = get_utc_now_iso()
        
        clean_updates = {}
        if "name" in updates and updates["name"] is not None:
            clean_updates["name"] = updates["name"].strip()
        if "preferred_language" in updates and updates["preferred_language"] is not None:
            clean_updates["preferred_language"] = updates["preferred_language"]
        if "accessibility_settings" in updates and updates["accessibility_settings"] is not None:
            clean_updates["accessibility_settings"] = updates["accessibility_settings"]
        if "voice_consent" in updates and updates["voice_consent"] is not None:
            clean_updates["voice_consent"] = updates["voice_consent"]

        clean_updates["updated_at"] = now

        await users_coll.update_one(
            {"$or": [{"_id": user_id}, {"id": user_id}]},
            {"$set": clean_updates}
        )

        return await self.get_profile(user_id)

auth_service = AuthService()

