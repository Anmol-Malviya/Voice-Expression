from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text string to synthesize into speech")
    voice_id: Optional[str] = Field(None, description="ElevenLabs voice ID or approved voice")
    voice_mode: str = Field("standard", description="'standard' or 'cloned'")
    language: Optional[str] = Field("en", description="Target language code (e.g., 'en', 'hi')")
    speech_speed: Optional[float] = Field(None, ge=0.5, le=2.0, description="Speech rate between 0.5 and 2.0")
    speed: float = Field(1.0, ge=0.5, le=2.0, description="Speech rate between 0.5 and 2.0")
    model_id: Optional[str] = Field(None, description="ElevenLabs model ID, e.g. eleven_multilingual_v2")

    @model_validator(mode="after")
    def sync_speed(self) -> "TTSRequest":
        if self.speech_speed is not None:
            self.speed = self.speech_speed
        else:
            self.speech_speed = self.speed
        return self

class TTSSynthesizeRequest(TTSRequest):
    """Schema for POST /api/v1/speech/synthesize."""
    pass

class STTResponse(BaseModel):
    transcript_id: str
    text: str
    language: str
    confidence: float = 0.95
    status: str = "completed"
    transcribed_text: Optional[str] = None
    detected_language: Optional[str] = None
    processing_status: Optional[str] = None
    provider: Optional[str] = "elevenlabs"

    @model_validator(mode="after")
    def sync_fields(self) -> "STTResponse":
        if self.transcribed_text is None:
            self.transcribed_text = self.text
        if self.detected_language is None:
            self.detected_language = self.language
        if self.processing_status is None:
            self.processing_status = self.status
        return self

class STTTranscribeResponse(STTResponse):
    """Schema for POST /api/v1/speech/transcribe."""
    pass

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
