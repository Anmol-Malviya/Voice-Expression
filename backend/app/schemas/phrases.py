from typing import Optional, List
from pydantic import BaseModel, Field

class CreatePhraseRequest(BaseModel):
    phrase: Optional[str] = None
    text: Optional[str] = None  # Frontend alias
    language: str = "en"
    category: str = "Basic"  # Basic, Needs, Emergency, Feelings, Social, Personal

    def get_phrase(self) -> str:
        return self.phrase or self.text or ""

class UpdatePhraseRequest(BaseModel):
    phrase: Optional[str] = None
    text: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None

    def get_phrase(self) -> Optional[str]:
        return self.phrase or self.text

class PhraseResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    phrase: str
    text: str  # Alias for frontend
    category: str
    language: str = "en"
    created_at: str

class PhraseListResponse(BaseModel):
    items: List[PhraseResponse]
    total: int

