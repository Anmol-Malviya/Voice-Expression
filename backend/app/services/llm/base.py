from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMService(ABC):
    @abstractmethod
    async def generate_response(
        self,
        user_message: str,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        preferred_language: str = "en",
    ) -> Dict[str, Any]:
        """Generate conversational response proposals with intent classification and alternatives."""
        pass

    @abstractmethod
    async def generate_suggestions(
        self,
        text: str,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Generate alternative phrasing suggestions for user's rough/short draft."""
        pass

    @abstractmethod
    async def generate_reply_candidates(
        self,
        partner_text: Optional[str],
        gesture: Optional[str],
        lip_active: bool,
        history: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generate rank-ordered response candidates with confidence and clarification flag."""
        pass
