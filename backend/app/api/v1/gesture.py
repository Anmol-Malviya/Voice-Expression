from fastapi import APIRouter
from backend.app.schemas.gestures import GestureRecognizeRequest, GestureRecognizeResponse
from backend.app.services.gesture.recognizer import gesture_service

router = APIRouter(tags=["Gestures & Multimodal Vision"])

@router.post("/gesture/recognize", response_model=GestureRecognizeResponse)
async def recognize_gesture(req: GestureRecognizeRequest):
    result = gesture_service.recognize_gesture(
        gesture_name=req.gesture_name,
        image_data=req.image_data,
        landmarks=req.landmarks,
        req_type=req.type
    )
    return GestureRecognizeResponse(
        gesture_id=result["gesture_id"],
        label=result["label"],
        confidence=result["confidence"],
        suggested_text=result["suggested_text"],
        description=result.get("description"),
        status=result["status"]
    )

