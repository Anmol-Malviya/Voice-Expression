from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from backend.app.schemas.conversation import (
    CreateConversationRequest,
    UpdateConversationRequest,
)
from backend.app.schemas.message import CreateMessageRequest
from backend.app.services.conversation_service import conversation_service
from backend.app.services.message_service import message_service
from backend.app.core.dependencies import get_current_user, get_current_user_optional
from backend.app.utils.responses import success_response

router = APIRouter(tags=["Conversations"])

@router.post("/conversations", status_code=status.HTTP_201_CREATED)
@router.post("/sessions", status_code=status.HTTP_201_CREATED)
async def create_conversation(
    req: CreateConversationRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Create a new assistive conversation session."""
    user_id = current_user["id"] if current_user else "guest_user"
    conv = await conversation_service.create_conversation(
        user_id=user_id,
        title=req.title,
        language=req.language or "en",
        mode=req.mode or "live_conversation",
    )
    return success_response(
        data=conv,
        message="Conversation created successfully",
        status_code=status.HTTP_201_CREATED,
        extra_fields={
            "session_id": conv["id"],
            "id": conv["id"],
            "title": conv["title"],
            "language": conv["language"],
            "status": conv.get("status", "active"),
        }
    )

@router.get("/conversations")
@router.get("/sessions")
async def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """List conversations for current user with fallback for guest session."""
    user_id = current_user["id"] if current_user else "guest_user"
    items = await conversation_service.list_conversations(
        user_id=user_id,
        skip=skip,
        limit=limit,
    )
    # If no items found for guest, provide sample demo session
    if not items and user_id == "guest_user":
        items = [{
            "_id": "sess_demo_default",
            "id": "sess_demo_default",
            "user_id": "guest_user",
            "title": "Therapy Session",
            "language": "en",
            "mode": "live_conversation",
            "status": "active",
            "messages_count": 2,
            "created_at": "2026-10-31T10:00:00Z",
            "updated_at": "2026-10-31T10:00:00Z",
        }]

    return success_response(
        data=items,
        message="Conversations retrieved successfully",
        extra_fields={"items": items, "total": len(items)},
    )

@router.get("/conversations/{conversation_id}")
@router.get("/sessions/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get single conversation by ID with ownership verification."""
    user_id = current_user["id"] if current_user else "guest_user"
    conv = await conversation_service.get_conversation(conversation_id, user_id)
    return success_response(
        data=conv,
        message="Conversation retrieved successfully",
        extra_fields=conv,
    )

@router.patch("/conversations/{conversation_id}")
@router.put("/conversations/{conversation_id}")
@router.patch("/sessions/{conversation_id}")
@router.put("/sessions/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    req: UpdateConversationRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Update conversation title or status."""
    user_id = current_user["id"] if current_user else "guest_user"
    updates = req.model_dump(exclude_unset=True)
    conv = await conversation_service.update_conversation(conversation_id, user_id, updates)
    return success_response(
        data=conv,
        message="Conversation updated successfully",
        extra_fields=conv,
    )

@router.post("/conversations/{conversation_id}/end")
@router.post("/sessions/{conversation_id}/end")
async def end_conversation(
    conversation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Mark conversation session as ended."""
    user_id = current_user["id"] if current_user else "guest_user"
    conv = await conversation_service.update_conversation(conversation_id, user_id, {"status": "ended"})
    return success_response(
        data=conv,
        message="Conversation session ended successfully",
        extra_fields={"status": "ended", "id": conversation_id, "session_id": conversation_id},
    )

@router.delete("/conversations/{conversation_id}")
@router.delete("/sessions/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Delete conversation and permanently purge all associated messages (FR-016)."""
    user_id = current_user["id"] if current_user else "guest_user"
    await conversation_service.delete_conversation(conversation_id, user_id)
    return success_response(
        data={"deleted": True, "conversation_id": conversation_id},
        message="Conversation and ephemeral messages permanently deleted"
    )

@router.get("/conversations/{conversation_id}/messages")
@router.get("/sessions/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Retrieve messages for a specific conversation with ownership check."""
    user_id = current_user["id"] if current_user else "guest_user"
    msgs = await message_service.get_messages(
        conversation_id=conversation_id,
        user_id=user_id,
        skip=skip,
        limit=limit,
    )
    return success_response(
        data=msgs,
        message="Messages retrieved successfully",
        extra_fields={"items": msgs, "total": len(msgs)},
    )
