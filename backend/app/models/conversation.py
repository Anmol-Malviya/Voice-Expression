from typing import Optional
from pydantic import BaseModel, Field

class ConversationModel(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    title: str = "Live Assistive Session"
    language: str = "en"
    mode: str = "live_conversation"
    status: str = "active"
    created_at: str
    updated_at: str
    messages_count: int = 0

    class Config:
        populate_by_name = True

