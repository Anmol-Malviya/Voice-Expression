from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

class AccessibilitySettingsSchema(BaseModel):
    font_size: str = "large"
    high_contrast: bool = False
    theme: str = "light"
    reduced_motion: bool = False
    large_buttons: bool = True

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    preferred_language: str = "en"
    accessibility_settings: Dict[str, Any] = Field(default_factory=dict)
    voice_consent: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferred_language: Optional[str] = None
    accessibility_settings: Optional[Dict[str, Any]] = None
    voice_consent: Optional[bool] = None

