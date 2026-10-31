from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseSTTService(ABC):
    @abstractmethod
    async def transcribe_audio(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        """Transcribe raw audio bytes into text with confidence metadata."""
        pass

