from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
from typing import List, Optional
from backend.app.schemas.sessions import CreateSessionRequest, SessionResponse, UpdateSessionRequest
from backend.app.core.database import get_conversations_collection, get_messages_collection
from backend.app.core.security import get_current_user_optional

router = APIRouter(tags=["Sessions & Conversations"])

@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/conversations", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(req: CreateSessionRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    conversations = get_conversations_collection()
    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()
    user_id = current_user.get("sub") if current_user else "guest_user"

    doc = {
        "_id": session_id,
        "user_id": user_id,
        "title": req.title or "Live Assist Conversation",
        "status": "active",
        "language": req.language,
        "mode": req.mode,
        "accessibility": req.accessibility or {},
        "created_at": now,
        "started_at": now,
        "ended_at": None,
        "updated_at": now,
    }
    await conversations.insert_one(doc)

    return SessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=doc["title"],
        status=doc["status"],
        language=doc["language"],
        created_at=doc["created_at"],
        started_at=doc["started_at"]
    )

@router.get("/sessions", response_model=List[SessionResponse])
@router.get("/conversations", response_model=List[SessionResponse])
async def list_sessions(current_user: Optional[dict] = Depends(get_current_user_optional)):
    conversations = get_conversations_collection()
    user_id = current_user.get("sub") if current_user else None
    query = {"user_id": user_id} if user_id else {}
    cursor = conversations.find(query).sort("created_at", -1)
    results = await cursor.to_list(length=50)

    # Provide demo sessions if none exist
    if not results:
        results = [
            {
                "_id": "sess_demo_1",
                "user_id": "demo_user",
                "title": "Consultation with Caregiver",
                "status": "completed",
                "language": "en",
                "created_at": "2026-10-31T08:00:00Z",
                "started_at": "2026-10-31T08:00:00Z"
            },
            {
                "_id": "sess_demo_2",
                "user_id": "demo_user",
                "title": "Family Discussion",
                "status": "completed",
                "language": "hi-en",
                "created_at": "2026-10-30T14:30:00Z",
                "started_at": "2026-10-30T14:30:00Z"
            }
        ]

    return [
        SessionResponse(
            session_id=str(d["_id"]),
            user_id=d.get("user_id"),
            title=d.get("title", "Conversation"),
            status=d.get("status", "active"),
            language=d.get("language", "en"),
            created_at=d.get("created_at", ""),
            started_at=d.get("started_at"),
            ended_at=d.get("ended_at")
        ) for d in results
    ]

@router.get("/sessions/{session_id}", response_model=SessionResponse)
@router.get("/conversations/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    conversations = get_conversations_collection()
    doc = await conversations.find_one({"_id": session_id})
    if not doc:
        # Fallback dynamic object
        return SessionResponse(
            session_id=session_id,
            user_id="active_user",
            title="Live Assist Session",
            status="active",
            language="en",
            created_at=datetime.utcnow().isoformat()
        )
    return SessionResponse(
        session_id=str(doc["_id"]),
        user_id=doc.get("user_id"),
        title=doc.get("title", "Conversation"),
        status=doc.get("status", "active"),
        language=doc.get("language", "en"),
        created_at=doc.get("created_at", ""),
        started_at=doc.get("started_at"),
        ended_at=doc.get("ended_at")
    )

@router.patch("/sessions/{session_id}", response_model=SessionResponse)
@router.patch("/conversations/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, req: UpdateSessionRequest):
    conversations = get_conversations_collection()
    update_data = {}
    if req.title:
        update_data["title"] = req.title
    if req.language:
        update_data["language"] = req.language
    if req.status:
        update_data["status"] = req.status
    update_data["updated_at"] = datetime.utcnow().isoformat()

    await conversations.update_one({"_id": session_id}, {"$set": update_data})
    doc = await conversations.find_one({"_id": session_id})
    return SessionResponse(
        session_id=session_id,
        user_id=doc.get("user_id") if doc else "user",
        title=doc.get("title", "Session") if doc else "Session",
        status=doc.get("status", "active") if doc else "active",
        language=doc.get("language", "en") if doc else "en",
        created_at=doc.get("created_at", "") if doc else datetime.utcnow().isoformat()
    )

@router.post("/sessions/{session_id}/end")
@router.post("/conversations/{session_id}/end")
async def end_session(session_id: str):
    conversations = get_conversations_collection()
    now = datetime.utcnow().isoformat()
    await conversations.update_one({"_id": session_id}, {"$set": {"status": "ended", "ended_at": now}})
    return {"session_id": session_id, "status": "ended", "ended_at": now}

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/conversations/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str):
    conversations = get_conversations_collection()
    messages = get_messages_collection()
    await conversations.delete_one({"_id": session_id})
    await messages.delete_many({"conversation_id": session_id})
    return None

