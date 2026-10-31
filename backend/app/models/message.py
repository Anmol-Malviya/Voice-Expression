from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class MessageModel(BaseModel):
    id: str = Field(alias="_id")
    conversation_id: str
    user_id: Optional[str] = None
    sender: str  # user, partner, system
    message_type: str = "text"  # text, speech_transcription, ai_suggestion, gesture_generated, speech_output
    text: str
    audio_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str

    class Config:
        populate_by_name = True

