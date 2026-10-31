from fastapi import APIRouter, status, Depends
from datetime import datetime
import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.core.database import get_feedback_collection
from backend.app.core.security import get_current_user_optional

router = APIRouter(tags=["Feedback"])

class FeedbackCreate(BaseModel):
    session_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    category: str = "general" # "accuracy", "latency", "accessibility", "voice_quality"
    comment: Optional[str] = None

@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def submit_feedback(req: FeedbackCreate, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "anonymous"
    col = get_feedback_collection()
    fb_id = f"fb_{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": fb_id,
        "user_id": user_id,
        "session_id": req.session_id,
        "rating": req.rating,
        "category": req.category,
        "comment": req.comment,
        "created_at": datetime.utcnow().isoformat()
    }
    await col.insert_one(doc)
    return {"feedback_id": fb_id, "status": "submitted"}

@router.get("/feedback")
async def list_feedback():
    col = get_feedback_collection()
    cursor = col.find().sort("created_at", -1)
    results = await cursor.to_list(length=50)
    return results

