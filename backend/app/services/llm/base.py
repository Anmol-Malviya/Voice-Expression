from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMService(ABC):
    @abstractmethod
    async def generate_reply_candidates(
        self,
        partner_text: Optional[str],
        gesture: Optional[str],
        lip_active: bool,
        history: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generate rank-ordered response candidates with confidence and clarification flag."""
        pass

