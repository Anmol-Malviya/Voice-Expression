from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import uuid
from backend.app.schemas.inference import (
    InferenceRequest, 
    InferenceResponse, 
    ConfirmationRequest, 
    ConfirmationResponse
)
from backend.app.services.llm.context_assistant import assistant_service
from backend.app.websockets.connection_manager import ws_manager

router = APIRouter(tags=["AI Multimodal Inference & Confirmation Gate"])

@router.post("/inference", response_model=InferenceResponse)
@router.post("/ai/respond", response_model=InferenceResponse)
@router.post("/ai/suggest", response_model=InferenceResponse)
async def run_multimodal_inference(req: InferenceRequest):
    result = await assistant_service.generate_reply_candidates(
        partner_text=req.partner_text,
        gesture=req.gesture,
        lip_active=req.lip_active or False,
        language=req.language or "en"
    )

    resp = InferenceResponse(
        inference_id=result["inference_id"],
        candidates=result["candidates"],
        needs_clarification=result["needs_clarification"],
        signals_used=result["signals_used"],
        created_at=datetime.utcnow().isoformat()
    )

    # Broadcast generated suggestions over WebSocket to the conversation room
    await ws_manager.broadcast_to_room(req.session_id, "inference.completed", resp.model_dump())

    return resp

@router.post("/sessions/{session_id}/confirmations", response_model=ConfirmationResponse)
async def confirm_reply(session_id: str, req: ConfirmationRequest):
    confirmation_id = f"conf_{uuid.uuid4().hex[:10]}"

    if req.action == "reject" or req.action == "cancel":
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
    # Accept compact normalized landmark observations without continuous video storage
    feature_id = f"vf_{uuid.uuid4().hex[:8]}"
    return {"feature_id": feature_id, "accepted": True}
