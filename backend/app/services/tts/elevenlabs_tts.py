import httpx
from typing import Optional, Tuple, Dict, Any
from fastapi import HTTPException, status
from backend.app.services.tts.base import BaseTTSService
from backend.app.services.tts.local_tts import LocalFallbackTTSService
from backend.app.core.config import settings

class ElevenLabsTTSService(BaseTTSService):
    def __init__(
        self,
        api_key: Optional[str] = None,
        default_voice_id: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout_seconds: float = 15.0,
    ):
        self.api_key = api_key if api_key is not None else settings.ELEVENLABS_API_KEY
        self.default_voice_id = default_voice_id or settings.ELEVENLABS_DEFAULT_VOICE_ID or "21m00Tcm4TlvDq8ikWAM"
        self.default_model = default_model or settings.ELEVENLABS_TTS_MODEL or "eleven_multilingual_v2"
        self.timeout_seconds = timeout_seconds
        self.base_url = "https://api.elevenlabs.io/v1/text-to-speech"

    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        speed: float = 1.0,
        model_id: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Tuple[bytes, str, Dict[str, Any]]:
        clean_text = (text or "").strip()
        if not clean_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text to synthesize cannot be empty."
            )

        # Resilient Local Fallback when unconfigured
        if not self.api_key:
            fallback = LocalFallbackTTSService()
            return await fallback.synthesize(
                text=clean_text,
                voice_id=voice_id or self.default_voice_id,
                speed=speed,
                model_id=model_id or self.default_model,
                language=language or "en"
            )

        target_voice = voice_id or self.default_voice_id
        target_model = model_id or self.default_model
        safe_speed = max(0.5, min(2.0, float(speed or 1.0)))

        url = f"{self.base_url}/{target_voice}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": clean_text,
            "model_id": target_model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "speed": safe_speed,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="ElevenLabs authentication failed. Please verify your ELEVENLABS_API_KEY."
                    )
                elif response.status_code == 429:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="ElevenLabs rate limit exceeded. Please retry shortly."
                    )
                elif response.status_code >= 400:
                    raise HTTPException(
                        status_code=response.status_code if response.status_code < 500 else status.HTTP_502_BAD_GATEWAY,
                        detail=f"ElevenLabs TTS service error: {response.text[:250]}"
                    )
                
                audio_bytes = response.content
                metadata = {
                    "voice_id": target_voice,
                    "model_id": target_model,
                    "speed": safe_speed,
                    "language": language or "en",
                    "provider": "elevenlabs",
                    "character_count": len(clean_text),
                }
                return audio_bytes, "audio/mpeg", metadata

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"ElevenLabs TTS synthesis timed out after {self.timeout_seconds} seconds."
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Network error connecting to ElevenLabs TTS: {str(exc)}"
            )

def get_tts_service() -> BaseTTSService:
    if settings.ELEVENLABS_API_KEY:
        return ElevenLabsTTSService()
    return LocalFallbackTTSService()
