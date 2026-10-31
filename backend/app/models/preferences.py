from typing import Optional
from pydantic import BaseModel, Field

class UserPreferencesModel(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    preferred_voice: Optional[str] = None
    speech_speed: float = 1.0
    volume: float = 1.0
    text_size: str = "large"
    high_contrast: bool = False
    reduced_motion: bool = False
    preferred_language: str = "en"
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True

