from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class CreateSessionRequest(BaseModel):
    title: Optional[str] = "Live Assist Conversation"
    language: str = "en"
    mode: str = "live_conversation"
    accessibility: Optional[Dict[str, Any]] = None

class SessionResponse(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    title: str
    status: str
    language: str
    created_at: str
    started_at: Optional[str] = None
    ended_at: Optional[str] = None

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None

