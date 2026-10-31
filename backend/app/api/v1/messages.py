from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, HTTPException
from backend.app.schemas.message import CreateMessageRequest
from backend.app.services.message_service import message_service
from backend.app.core.dependencies import get_current_user, get_current_user_optional
from backend.app.utils.responses import success_response

router = APIRouter(tags=["Messages"])

@router.post("/messages", status_code=status.HTTP_201_CREATED)
async def create_message(
    req: CreateMessageRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Post a new message to a conversation with ownership validation."""
    conv_id = req.get_conversation_id()
    if not conv_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="conversation_id or session_id is required."
        )

    text_content = req.get_text()
    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    user_id = current_user["id"] if current_user else "guest_user"

    msg = await message_service.create_message(
        user_id=user_id,
        conversation_id=conv_id,
        sender=req.sender or "user",
        message_type=req.get_type(),
        text=text_content,
        audio_url=req.audio_url,
        metadata=req.metadata,
        fused_signals=req.fusedSignals,
    )

    return success_response(
        data=msg,
        message="Message created successfully",
        status_code=status.HTTP_201_CREATED,
        extra_fields=msg,
    )

@router.post("/sessions/{session_id}/messages", status_code=status.HTTP_201_CREATED)
@router.post("/conversations/{session_id}/messages", status_code=status.HTTP_201_CREATED)
async def create_message_nested(
    session_id: str,
    req: CreateMessageRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Nested route for posting message to specific session/conversation."""
    text_content = req.get_text()
    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty."
        )

    user_id = current_user["id"] if current_user else "guest_user"

    msg = await message_service.create_message(
        user_id=user_id,
        conversation_id=session_id,
        sender=req.sender or "user",
        message_type=req.get_type(),
        text=text_content,
        audio_url=req.audio_url,
        metadata=req.metadata,
        fused_signals=req.fusedSignals,
    )

    return success_response(
        data=msg,
        message="Message created successfully",
        status_code=status.HTTP_201_CREATED,
        extra_fields=msg,
    )
