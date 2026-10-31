from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    preferred_language: str = "en"
    accessibility_settings: Optional[Dict[str, Any]] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    preferred_language: str
    accessibility_settings: Dict[str, Any]
    created_at: str

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None
    accessibility_settings: Optional[Dict[str, Any]] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

