from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class UserPreferencesSchema(BaseModel):
    preferred_language: str = "en"
    preferred_voice: Optional[str] = None
    speech_speed: float = 1.0
    volume: float = 1.0
    text_size: str = "large"
    high_contrast: bool = False
    reduced_motion: bool = False
    voice_cloning_consent: bool = True
    accessibility: Optional[Dict[str, Any]] = None
    speech: Optional[Dict[str, Any]] = None
    privacy: Optional[Dict[str, Any]] = None
