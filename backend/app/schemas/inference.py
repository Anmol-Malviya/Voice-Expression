from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any
from backend.app.schemas.ai import (
    CandidateReply,
    AIRespondRequest,
    AIRespondResponse,
    AISuggestRequest,
    AISuggestResponse
)

class InferenceRequest(AIRespondRequest):
    session_id: Optional[str] = "active_session"

class InferenceResponse(BaseModel):
    inference_id: str
    candidates: List[CandidateReply]
    needs_clarification: bool = False
    signals_used: List[str] = []
    created_at: str
    suggested_response: Optional[str] = None
    alternative_suggestions: Optional[List[str]] = None
    intent_classification: Optional[str] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None
    rationale: Optional[str] = None
    is_proposal: bool = True
    requires_confirmation: bool = True

    @model_validator(mode="after")
    def sync_inference_fields(self) -> "InferenceResponse":
        if self.suggested_response is None and self.candidates:
            self.suggested_response = self.candidates[0].text
        if self.alternative_suggestions is None and self.candidates:
            self.alternative_suggestions = [c.text for c in self.candidates[1:]]
        if self.confidence is None and self.candidates:
            self.confidence = self.candidates[0].confidence
        if self.rationale is None and self.candidates:
            self.rationale = self.candidates[0].reason
        if self.explanation is None:
            self.explanation = self.rationale
        return self

class ConfirmationRequest(BaseModel):
    inference_id: Optional[str] = None
    candidate_id: Optional[str] = None
    action: str = Field(..., description="'confirm', 'edit', 'reject', 'cancel'")
    edited_text: Optional[str] = None

class ConfirmationResponse(BaseModel):
    confirmation_id: str
    status: str
    confirmed_text: Optional[str] = None
