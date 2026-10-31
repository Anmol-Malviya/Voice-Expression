from typing import Optional
from pydantic import BaseModel, Field

class QuickPhraseModel(BaseModel):
    id: str = Field(alias="_id")
    user_id: Optional[str] = None  # None for default global phrases
    phrase: str
    language: str = "en"
    category: str = "Basic"  # Basic, Needs, Emergency, Feelings, Social, Personal
    created_at: str

    class Config:
        populate_by_name = True

