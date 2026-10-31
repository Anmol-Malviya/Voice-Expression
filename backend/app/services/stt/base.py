from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseSTTService(ABC):
    @abstractmethod
    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        language: str = "en",
        filename: Optional[str] = "audio.mp3",
        content_type: Optional[str] = "audio/mpeg",
        model_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transcribe raw audio bytes into text with confidence metadata."""
        pass
