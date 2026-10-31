from typing import Optional, Tuple
from backend.app.services.tts.base import BaseTTSService

class LocalFallbackTTSService(BaseTTSService):
    async def synthesize(self, text: str, voice_id: Optional[str] = None, speed: float = 1.0) -> Tuple[bytes, str]:
        # Minimal valid 1-second 8kHz mono WAV header with silence
        wav_header = (
            b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00'
            b'@\x1f\x00\x00@\x1f\x00\x00\x01\x00\x08\x00data\x00\x00\x00\x00'
        )
        return wav_header, "audio/wav"

