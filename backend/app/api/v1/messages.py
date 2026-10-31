from fastapi import APIRouter, HTTPException, status
from datetime import datetime
import uuid
from typing import List
from backend.app.schemas.messages import CreateMessageRequest, MessageResponse
from backend.app.core.database import get_messages_collection
from backend.app.websockets.connection_manager import ws_manager

router = APIRouter(tags=["Messages"])

@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(req: CreateMessageRequest):
    messages = get_messages_collection()
    message_id = f"msg_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()

    doc = {
        "_id": message_id,
        "conversation_id": req.conversation_id,
        "sender": req.sender,
        "message_type": req.message_type,
        "content": req.content,
        "audio_url": req.audio_url,
        "metadata": req.metadata or {},
        "created_at": now
    }
    await messages.insert_one(doc)

    resp = MessageResponse(
        id=message_id,
        conversation_id=req.conversation_id,
        sender=req.sender,
        message_type=req.message_type,
        content=req.content,
        audio_url=req.audio_url,
        metadata=req.metadata,
        created_at=now
    )

    # Broadcast event to active live WebSocket listeners
    await ws_manager.broadcast_to_room(
        req.conversation_id,
        "transcript.committed" if req.sender == "partner" else "speech.status",
        resp.model_dump()
    )

    return resp

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
@router.get("/messages/{conversation_id}", response_model=List[MessageResponse])
async def list_messages(conversation_id: str):
    messages = get_messages_collection()
    cursor = messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
    results = await cursor.to_list(length=100)
    return [
        MessageResponse(
            id=str(m["_id"]),
            conversation_id=m["conversation_id"],
            sender=m["sender"],
            message_type=m.get("message_type", "text"),
            content=m["content"],
            audio_url=m.get("audio_url"),
            metadata=m.get("metadata"),
            created_at=m.get("created_at", "")
        ) for m in results
    ]

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(message_id: str):
    messages = get_messages_collection()
    await messages.delete_one({"_id": message_id})
    return None
