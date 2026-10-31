from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any

class CandidateReply(BaseModel):
    candidate_id: str
    text: str
    reason: str
    confidence: float

class AIRespondRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, description="Conversation or session ID")
    session_id: Optional[str] = Field(None, description="Alias for conversation_id")
    user_message: Optional[str] = Field(None, description="User or partner text message")
    partner_text: Optional[str] = Field(None, description="Alias for user_message")
    conversation_context: Optional[List[Dict[str, Any]]] = Field(None, description="Recent conversation messages")
    preferred_language: Optional[str] = Field("en", description="Preferred language, e.g. 'en', 'hi', 'hi-en'")
    language: Optional[str] = Field(None, description="Alias for preferred_language")
    gesture: Optional[str] = Field(None, description="Observed physical gesture cue")
    lip_active: Optional[bool] = Field(False, description="Lip motion activity detected")
    context_window_seconds: Optional[int] = Field(20, description="Temporal context window")

    @model_validator(mode="after")
    def sync_aliases(self) -> "AIRespondRequest":
        if not self.conversation_id and self.session_id:
            self.conversation_id = self.session_id
        if not self.session_id and self.conversation_id:
            self.session_id = self.conversation_id
            
        if not self.user_message and self.partner_text:
            self.user_message = self.partner_text
        if not self.partner_text and self.user_message:
            self.partner_text = self.user_message
            
        if self.language and not self.preferred_language:
            self.preferred_language = self.language
        elif self.preferred_language and not self.language:
            self.language = self.preferred_language
            
        return self

class AIRespondResponse(BaseModel):
    suggested_response: str
    alternative_suggestions: List[str]
    intent_classification: str
    confidence: float
    explanation: Optional[str] = None
    rationale: Optional[str] = None
    is_proposal: bool = Field(True, description="Always a proposal for user agency; never auto-spoken")
    requires_confirmation: bool = Field(True, description="Strict agency guard requiring user confirmation")
    inference_id: str
    candidates: List[CandidateReply]
    needs_clarification: bool = False
    signals_used: List[str] = []
    created_at: str

    @model_validator(mode="after")
    def sync_rationale(self) -> "AIRespondResponse":
        if self.rationale is None and self.explanation is not None:
            self.rationale = self.explanation
        elif self.explanation is None and self.rationale is not None:
            self.explanation = self.rationale
        return self

class AISuggestRequest(BaseModel):
    text: Optional[str] = Field(None, description="Draft text or shorthand, e.g. 'I water'")
    user_message: Optional[str] = Field(None, description="Alias for text")
    conversation_id: Optional[str] = Field(None, description="Conversation or session ID")
    session_id: Optional[str] = Field(None, description="Alias for conversation_id")
    language: Optional[str] = Field("en", description="Target language")
    partner_text: Optional[str] = None
    gesture: Optional[str] = None
    lip_active: Optional[bool] = False

    @model_validator(mode="after")
    def sync_aliases(self) -> "AISuggestRequest":
        if not self.text and self.user_message:
            self.text = self.user_message
        if not self.text and self.partner_text:
            self.text = self.partner_text
        if not self.user_message and self.text:
            self.user_message = self.text
        if not self.conversation_id and self.session_id:
            self.conversation_id = self.session_id
        return self

class AISuggestResponse(BaseModel):
    original_text: str
    suggested_response: str
    alternative_suggestions: List[str]
    intent: str
    confidence: float
    candidates: List[CandidateReply]
    is_proposal: bool = True
    requires_confirmation: bool = True
    inference_id: str
    explanation: Optional[str] = None

