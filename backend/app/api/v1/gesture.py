import logging
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List

from backend.app.schemas.gestures import (
    GestureRecognizeRequest,
    GestureRecognizeResponse,
    GestureClassifyRequest,
    GestureVocabularyResponse,
    GestureDefinition,
    GestureHistoryResponse,
    GestureHistoryItem,
    GestureMappingUpdateRequest,
)
from backend.app.services.gesture.recognizer import gesture_service

logger = logging.getLogger("voice_expression.api.gesture")

router = APIRouter(tags=["Gestures & Multimodal Vision"])

@router.post("/gesture/recognize", response_model=GestureRecognizeResponse)
async def recognize_gesture(req: GestureRecognizeRequest):
    """
    Multimodal gesture recognition pipeline.
    Processes live frame (base64) or landmark coordinates or legacy gesture_name.
    Performs landmark detection, geometric classification, confidence gating,
    and returns suggested sentence expansions.
    """
    try:
        # Support both image_data and image alias
        image_input = req.image_data or req.image

        result = gesture_service.recognize_gesture(
            gesture_name=req.gesture_name,
            image_data=image_input,
            landmarks=req.landmarks,
            req_type=req.type,
            generate_suggestions=req.generate_suggestions,
            context=req.context
        )
        return GestureRecognizeResponse(**result)
    except Exception as e:
        logger.error(f"Error in gesture recognition endpoint: {e}")
        # Resilient Local Fallback: never raise unhandled 500
        return GestureRecognizeResponse(
            gesture_id="error",
            label="Service Error",
            confidence=0.0,
            suggested_text="",
            ai_suggestions=[],
            status="uncertain",
            is_dynamic=False,
            landmark_count=0,
            timestamp="",
            explanation="Gesture recognition fallback encountered an issue."
        )

@router.post("/gesture/classify", response_model=GestureRecognizeResponse)
async def classify_landmarks(req: GestureClassifyRequest):
    """
    Direct low-latency classification of pre-extracted 21 MediaPipe hand landmarks.
    """
    try:
        result = gesture_service.recognize_gesture(
            landmarks=req.landmarks,
            generate_suggestions=True
        )
        return GestureRecognizeResponse(**result)
    except Exception as e:
        logger.error(f"Error in landmark classify endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to classify landmarks: {str(e)}"
        )

@router.get("/gesture/vocabulary", response_model=GestureVocabularyResponse)
async def get_gesture_vocabulary():
    """
    Returns the supported gesture vocabulary with active configurable phrases.
    """
    vocab_items = gesture_service.get_vocabulary()
    definitions = [GestureDefinition(**item) for item in vocab_items]
    return GestureVocabularyResponse(
        vocabulary=definitions,
        total_gestures=len(definitions),
        custom_mappings_count=len(gesture_service.custom_mappings)
    )

@router.get("/gesture/history", response_model=GestureHistoryResponse)
async def get_gesture_history():
    """
    Returns ephemeral history of recent recognition events.
    """
    history_items = gesture_service.get_history()
    formatted = []
    for item in history_items:
        formatted.append(
            GestureHistoryItem(
                history_id=item.get("gesture_id", ""),
                gesture_id=item.get("gesture_id", ""),
                label=item.get("label", ""),
                confidence=item.get("confidence", 0.0),
                suggested_text=item.get("suggested_text", ""),
                status=item.get("status", "recognized"),
                is_dynamic=item.get("is_dynamic", False),
                timestamp=item.get("timestamp", "")
            )
        )
    return GestureHistoryResponse(
        history=formatted,
        total=len(formatted)
    )

@router.put("/gesture/mappings", response_model=GestureVocabularyResponse)
async def update_gesture_mappings(req: GestureMappingUpdateRequest):
    """
    Updates configurable communication shortcuts for gestures.
    """
    gesture_service.update_mappings(req.mappings)
    return await get_gesture_vocabulary()
