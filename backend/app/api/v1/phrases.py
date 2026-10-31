from typing import Optional
from fastapi import APIRouter, Depends, Query, status, Response
from fastapi.responses import JSONResponse
from backend.app.schemas.phrases import (
    CreatePhraseRequest,
    UpdatePhraseRequest,
)
from backend.app.services.phrase_service import phrase_service
from backend.app.core.dependencies import get_current_user, get_current_user_optional
from backend.app.utils.responses import success_response

router = APIRouter(tags=["Quick Phrases"])

@router.get("/phrases")
@router.get("/quick-phrases")
async def list_phrases(
    category: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Retrieve default system quick phrases combined with user's custom phrases."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    items = await phrase_service.get_phrases(user_id=user_id, category=category)
    return items

@router.post("/phrases", status_code=status.HTTP_201_CREATED)
@router.post("/quick-phrases", status_code=status.HTTP_201_CREATED)
async def create_phrase(
    req: CreatePhraseRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Create a new custom quick phrase."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    created = await phrase_service.create_phrase(
        user_id=user_id,
        phrase=req.get_phrase(),
        category=req.category,
        language=req.language,
    )
    return success_response(
        data=created,
        message="Quick phrase created successfully",
        status_code=status.HTTP_201_CREATED,
        extra_fields={
            "phrase_id": created["id"],
            "id": created["id"],
            "phrase": created["phrase"],
            "category": created["category"],
        }
    )

@router.patch("/phrases/{phrase_id}")
@router.put("/phrases/{phrase_id}")
@router.patch("/quick-phrases/{phrase_id}")
@router.put("/quick-phrases/{phrase_id}")
async def update_phrase(
    phrase_id: str,
    req: UpdatePhraseRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Update custom phrase text or category."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    updates = req.model_dump(exclude_unset=True)
    updated = await phrase_service.update_phrase(phrase_id, user_id, updates)
    return success_response(
        data=updated,
        message="Quick phrase updated successfully",
        extra_fields={
            "phrase_id": updated["id"],
            "id": updated["id"],
            "phrase": updated["phrase"],
        }
    )

@router.delete("/phrases/{phrase_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/quick-phrases/{phrase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phrase(
    phrase_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Delete a user-created quick phrase."""
    user_id = current_user["id"] if current_user else "usr_demo_alex"
    await phrase_service.delete_phrase(phrase_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
