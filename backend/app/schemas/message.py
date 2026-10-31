from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CreateMessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    session_id: Optional[str] = None  # Backward compatibility
    sender: str = "user"  # user, partner, system
    message_type: Optional[str] = None
    type: Optional[str] = None  # Backward compatibility
    text: Optional[str] = None
    content: Optional[str] = None  # Frontend sends content or text
    audio_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    fusedSignals: Optional[List[str]] = None

    def get_text(self) -> str:
        return self.text or self.content or ""

    def get_type(self) -> str:
        return self.message_type or self.type or "text"

    def get_conversation_id(self) -> str:
        return self.conversation_id or self.session_id or ""

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    user_id: Optional[str] = None
    sender: str
    message_type: str
    type: str  # Alias for frontend
    text: str
    content: str  # Alias for frontend
    audio_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    fusedSignals: Optional[List[str]] = None
    timestamp: str
    created_at: str

class MessageListResponse(BaseModel):
    items: List[MessageResponse]
    total: int

