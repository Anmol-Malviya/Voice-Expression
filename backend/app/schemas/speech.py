from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1)
    voice_id: Optional[str] = None
    voice_mode: str = "standard" # "standard" or "cloned"
    language: str = "en"
    speed: float = 1.0

class STTResponse(BaseModel):
    transcript_id: str
    text: str
    language: str
    confidence: float = 0.95
    status: str = "completed"

class VoiceOptionResponse(BaseModel):
    voice_id: str
    name: str
    category: str
    language: str
    gender: Optional[str] = None

class VoiceConsentRequest(BaseModel):
    voice_id: str
    purpose: str = "Speak user-confirmed conversation replies"
    scope: str = "voice_cloning_and_generation"
    consent_version: str = "v1.0"

class VoiceConsentResponse(BaseModel):
    consent_id: str
    status: str
    granted_at: str
    revoked_at: Optional[str] = None

