from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class CreateMessageRequest(BaseModel):
    conversation_id: str
    sender: str = Field(..., description="'user' or 'partner'")
    message_type: str = Field("text", description="'text', 'transcript', 'ai_confirmed', 'quick_phrase'")
    content: str
    audio_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender: str
    message_type: str
    content: str
    audio_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: str

