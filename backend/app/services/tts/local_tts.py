from typing import Optional, Tuple, Dict, Any
from backend.app.services.tts.base import BaseTTSService

class LocalFallbackTTSService(BaseTTSService):
    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        speed: float = 1.0,
        model_id: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Tuple[bytes, str, Dict[str, Any]]:
        # Minimal valid 1-second 8kHz mono WAV header with silence
        wav_header = (
            b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00'
            b'@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00'
        )
        metadata = {
            "voice_id": voice_id or "local_default",
            "model_id": model_id or "local_fallback_wav",
            "speed": speed,
            "language": language or "en",
            "provider": "local_fallback",
            "character_count": len(text),
        }
        return wav_header, "audio/wav", metadata
