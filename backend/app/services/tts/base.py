from abc import ABC, abstractmethod
from typing import Optional, Tuple, Dict, Any

class BaseTTSService(ABC):
    @abstractmethod
    async def synthesize(
        self,
        text: str,
        voice_id: Optional[str] = None,
        speed: float = 1.0,
        model_id: Optional[str] = None,
        language: Optional[str] = None,
    ) -> Tuple[bytes, str, Dict[str, Any]]:
        """
        Synthesize text into speech audio.
        Returns: (audio_bytes, mime_type, metadata)
        """
        pass
