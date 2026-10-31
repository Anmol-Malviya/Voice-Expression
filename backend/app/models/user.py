from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone

class UserAccessibilitySettings(BaseModel):
    font_size: str = "large"
    high_contrast: bool = False
    theme: str = "light"
    reduced_motion: bool = False
    large_buttons: bool = True

class UserModel(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    password_hash: str
    preferred_language: str = "en"
    accessibility_settings: UserAccessibilitySettings = Field(default_factory=UserAccessibilitySettings)
    voice_consent: bool = True
    created_at: str
    updated_at: str

    class Config:
        populate_by_name = True

