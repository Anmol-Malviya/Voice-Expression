from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
import uuid
from backend.app.schemas.preferences import QuickPhraseCreate, QuickPhraseResponse
from backend.app.core.database import get_phrases_collection
from backend.app.core.security import get_current_user_optional

router = APIRouter(tags=["Quick Phrases"])

STANDARD_PHRASES = [
    {"phrase": "I need help.", "category": "Urgent", "language": "en"},
    {"phrase": "Please wait.", "category": "General", "language": "en"},
    {"phrase": "I need water.", "category": "General", "language": "en"},
    {"phrase": "I am not feeling well.", "category": "Health", "language": "en"},
    {"phrase": "Thank you.", "category": "Social", "language": "en"},
    {"phrase": "Please repeat.", "category": "Clarify", "language": "en"},
    {"phrase": "Yes.", "category": "Response", "language": "en"},
    {"phrase": "No.", "category": "Response", "language": "en"},
    {"phrase": "I want to go home.", "category": "General", "language": "en"},
    {"phrase": "I need to go outside.", "category": "General", "language": "en"},
    {"phrase": "I want to talk.", "category": "Social", "language": "en"},
]

@router.get("/phrases", response_model=List[QuickPhraseResponse])
@router.get("/quick-phrases", response_model=List[QuickPhraseResponse])
async def list_quick_phrases(current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else None
    col = get_phrases_collection()
    query = {"user_id": user_id} if user_id else {}
    cursor = col.find(query)
    custom = await cursor.to_list(length=50)

    all_items = []
    # Include standard presets
    for idx, p in enumerate(STANDARD_PHRASES):
        all_items.append(QuickPhraseResponse(
            phrase_id=f"std_{idx + 1}",
            user_id="system",
            phrase=p["phrase"],
            language=p["language"],
            category=p["category"],
            created_at="2026-10-31T08:00:00Z"
        ))

    # Include user's custom phrases
    for c in custom:
        all_items.append(QuickPhraseResponse(
            phrase_id=str(c["_id"]),
            user_id=c.get("user_id"),
            phrase=c["phrase"],
            language=c.get("language", "en"),
            category=c.get("category", "Custom"),
            created_at=c.get("created_at", "")
        ))

    return all_items

@router.post("/phrases", response_model=QuickPhraseResponse, status_code=status.HTTP_201_CREATED)
@router.post("/quick-phrases", response_model=QuickPhraseResponse, status_code=status.HTTP_201_CREATED)
async def create_quick_phrase(req: QuickPhraseCreate, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "user"
    col = get_phrases_collection()
    phrase_id = f"cp_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()
    doc = {
        "_id": phrase_id,
        "user_id": user_id,
        "phrase": req.phrase,
        "language": req.language,
        "category": req.category,
        "created_at": now
    }
    await col.insert_one(doc)
    return QuickPhraseResponse(
        phrase_id=phrase_id,
        user_id=user_id,
        phrase=req.phrase,
        language=req.language,
        category=req.category,
        created_at=now
    )

@router.delete("/phrases/{phrase_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/quick-phrases/{phrase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quick_phrase(phrase_id: str):
    col = get_phrases_collection()
    await col.delete_one({"_id": phrase_id})
    return None

