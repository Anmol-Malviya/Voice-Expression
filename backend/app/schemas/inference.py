from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CandidateReply(BaseModel):
    candidate_id: str
    text: str
    reason: str
    confidence: float

class InferenceRequest(BaseModel):
    session_id: str
    partner_text: Optional[str] = None
    gesture: Optional[str] = None
    lip_active: Optional[bool] = False
    language: str = "en"
    context_window_seconds: int = 20

class InferenceResponse(BaseModel):
    inference_id: str
    candidates: List[CandidateReply]
    needs_clarification: bool = False
    signals_used: List[str] = []
    created_at: str

class ConfirmationRequest(BaseModel):
    inference_id: Optional[str] = None
    candidate_id: Optional[str] = None
    action: str = Field(..., description="'confirm', 'edit', 'reject', 'cancel'")
    edited_text: Optional[str] = None

class ConfirmationResponse(BaseModel):
    confirmation_id: str
    status: str
    confirmed_text: Optional[str] = None

