from abc import ABC, abstractmethod
from typing import Optional, Tuple

class BaseTTSService(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice_id: Optional[str] = None, speed: float = 1.0) -> Tuple[bytes, str]:
        """
        Synthesize text into speech audio.
        Returns: (audio_bytes, mime_type)
        """
        pass

