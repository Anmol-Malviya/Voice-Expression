from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class GestureRecognizeRequest(BaseModel):
    gesture_name: Optional[str] = None
    image_data: Optional[str] = None
    landmarks: Optional[List[Dict[str, float]]] = None
    type: str = "gesture" # "gesture" or "image_multimodal"

class GestureRecognizeResponse(BaseModel):
    gesture_id: str
    label: str
    confidence: float
    suggested_text: str
    description: Optional[str] = None
    status: str = "recognized"

