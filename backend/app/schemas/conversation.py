from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "Live Assistive Session"
    language: Optional[str] = "en"
    mode: Optional[str] = "live_conversation"

class UpdateConversationRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    language: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: str
    language: str = "en"
    mode: str = "live_conversation"
    status: str = "active"
    messages_count: int = 0
    last_message_preview: Optional[str] = None
    created_at: str
    updated_at: str

class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int
    skip: int = 0
    limit: int = 50

