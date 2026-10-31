from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional
import uuid

from backend.app.schemas.ai import (
    AIRespondRequest,
    AIRespondResponse,
    AISuggestRequest,
    AISuggestResponse,
    CandidateReply
)
from backend.app.schemas.inference import (
    InferenceRequest, 
    InferenceResponse, 
    ConfirmationRequest, 
    ConfirmationResponse
)
from backend.app.services.ai.conversation_engine import conversation_engine
from backend.app.websockets.connection_manager import ws_manager
from backend.app.core.security import get_current_user_optional

router = APIRouter(tags=["AI Conversational Intelligence & Confirmation Gate"])

@router.post("/ai/respond", response_model=AIRespondResponse)
async def ai_respond(
    req: AIRespondRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Generate conversational reply proposals with intent classification, alternatives,
    and confidence scores based on bounded conversation context.
    Output is strictly a proposal requiring user confirmation before speech (User Autonomy Guard).
    """
    user_id = current_user.get("sub") if current_user else None
    user_text = req.user_message or req.partner_text or ""
    conv_id = req.conversation_id or req.session_id or "active_session"
    lang = req.preferred_language or req.language or "en"

    result = await conversation_engine.respond(
        user_message=user_text,
        conversation_id=conv_id,
        conversation_context=req.conversation_context,
        preferred_language=lang,
        user_id=user_id,
        gesture=req.gesture,
        lip_active=req.lip_active or False,
    )

    resp = AIRespondResponse(
        suggested_response=result["suggested_response"],
        alternative_suggestions=result["alternative_suggestions"],
        intent_classification=result["intent_classification"],
        confidence=result["confidence"],
        explanation=result.get("explanation"),
        rationale=result.get("rationale"),
        is_proposal=True,
        requires_confirmation=True,
        inference_id=result["inference_id"],
        candidates=result["candidates"],
        needs_clarification=result["needs_clarification"],
        signals_used=result["signals_used"],
        created_at=result["created_at"],
    )

    # Broadcast generated suggestions over WebSocket to the conversation room
    await ws_manager.broadcast_to_room(conv_id, "inference.completed", resp.model_dump())

    return resp

@router.post("/ai/suggest", response_model=AISuggestResponse)
async def ai_suggest(
    req: AISuggestRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Generate alternative phrasing suggestions based on rough or shorthand user input (e.g. 'I water').
    Clarifies communication into polite, natural sentences while strictly preserving user intent.
    """
    user_id = current_user.get("sub") if current_user else None
    text = req.text or req.user_message or req.partner_text or ""
    conv_id = req.conversation_id or req.session_id
    lang = req.language or "en"

    result = await conversation_engine.suggest_alternatives(
        text=text,
        conversation_id=conv_id,
        language=lang,
        user_id=user_id,
    )

    return AISuggestResponse(
        original_text=result["original_text"],
        suggested_response=result["suggested_response"],
        alternative_suggestions=result["alternative_suggestions"],
        intent=result["intent"],
        confidence=result["confidence"],
        candidates=result["candidates"],
        is_proposal=True,
        requires_confirmation=True,
        inference_id=result["inference_id"],
        explanation=result.get("explanation"),
    )

@router.post("/inference", response_model=InferenceResponse)
async def run_multimodal_inference(
    req: InferenceRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Multimodal inference endpoint fusing partner text, gesture landmarks, and lip movement."""
    user_id = current_user.get("sub") if current_user else None
    conv_id = req.conversation_id or req.session_id or "active_session"
    user_text = req.user_message or req.partner_text or ""
    lang = req.preferred_language or req.language or "en"

    result = await conversation_engine.respond(
        user_message=user_text,
        conversation_id=conv_id,
        conversation_context=req.conversation_context,
        preferred_language=lang,
        user_id=user_id,
        gesture=req.gesture,
        lip_active=req.lip_active or False,
    )

    resp = InferenceResponse(
        inference_id=result["inference_id"],
        candidates=result["candidates"],
        needs_clarification=result["needs_clarification"],
        signals_used=result["signals_used"],
        created_at=result["created_at"],
        suggested_response=result["suggested_response"],
        alternative_suggestions=result["alternative_suggestions"],
        intent_classification=result["intent_classification"],
        confidence=result["confidence"],
        explanation=result.get("explanation"),
        rationale=result.get("rationale"),
        is_proposal=True,
        requires_confirmation=True,
    )

    await ws_manager.broadcast_to_room(conv_id, "inference.completed", resp.model_dump())
    return resp

@router.post("/sessions/{session_id}/confirmations", response_model=ConfirmationResponse)
async def confirm_reply(session_id: str, req: ConfirmationRequest):
    """
    Strict confirmation gate endpoint.
    Users must confirm, edit, or reject AI proposals before any speech synthesis occurs.
    """
    confirmation_id = f"conf_{uuid.uuid4().hex[:10]}"

    if req.action in {"reject", "cancel"}:
        await ws_manager.broadcast_to_room(session_id, "confirmation.updated", {
            "confirmation_id": confirmation_id,
            "status": "rejected",
            "confirmed_text": None
        })
        return ConfirmationResponse(
            confirmation_id=confirmation_id,
            status="rejected",
            confirmed_text=None
        )

    # For confirm or edit
    confirmed_text = req.edited_text if req.action == "edit" else req.edited_text or "Confirmed response"
    
    await ws_manager.broadcast_to_room(session_id, "confirmation.updated", {
        "confirmation_id": confirmation_id,
        "status": "confirmed",
        "confirmed_text": confirmed_text
    })

    return ConfirmationResponse(
        confirmation_id=confirmation_id,
        status="confirmed",
        confirmed_text=confirmed_text
    )

@router.post("/visual-features", status_code=status.HTTP_202_ACCEPTED)
async def submit_visual_features(payload: dict):
    """Accept compact normalized landmark observations without continuous video storage (Privacy Default)."""
    feature_id = f"vf_{uuid.uuid4().hex[:8]}"
    return {"feature_id": feature_id, "accepted": True}
