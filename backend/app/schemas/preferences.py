from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class UserPreferencesSchema(BaseModel):
    user_id: Optional[str] = None
    preferred_voice: str = "21m00Tcm4TlvDq8ikWAM"
    speech_speed: float = 1.0
    volume: float = 1.0
    text_size: str = "large"
    high_contrast: bool = False
    reduced_motion: bool = False
    preferred_language: str = "en"

class QuickPhraseCreate(BaseModel):
    phrase: str = Field(..., min_length=1, max_length=200)
    language: str = "en"
    category: str = "General"

class QuickPhraseResponse(BaseModel):
    phrase_id: str
    user_id: Optional[str] = None
    phrase: str
    language: str
    category: str
    created_at: str

