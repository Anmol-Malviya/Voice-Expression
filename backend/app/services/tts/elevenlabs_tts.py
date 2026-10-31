import httpx
from typing import Optional, Tuple
from backend.app.services.tts.base import BaseTTSService
from backend.app.core.config import settings

class ElevenLabsTTSService(BaseTTSService):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.ELEVENLABS_API_KEY
        self.default_voice_id = settings.ELEVENLABS_DEFAULT_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"

    async def synthesize(self, text: str, voice_id: Optional[str] = None, speed: float = 1.0) -> Tuple[bytes, str]:
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not configured.")
        
        target_voice = voice_id or self.default_voice_id
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "speed": speed
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.content, "audio/mpeg"

class LocalFallbackTTSService(BaseTTSService):
    async def synthesize(self, text: str, voice_id: Optional[str] = None, speed: float = 1.0) -> Tuple[bytes, str]:
        # Return lightweight silent / sample wav header or cue
        # Minimal 1-second 8kHz mono WAV header with silence
        wav_header = (
            b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00'
            b'@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00'
        )
        return wav_header, "audio/wav"

def get_tts_service() -> BaseTTSService:
    if settings.ELEVENLABS_API_KEY:
        return ElevenLabsTTSService()
    return LocalFallbackTTSService()

