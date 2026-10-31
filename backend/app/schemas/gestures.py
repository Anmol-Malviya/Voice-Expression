from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class LandmarkPoint(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0

class GestureRecognizeRequest(BaseModel):
    gesture_name: Optional[str] = None
    image_data: Optional[str] = None
    image: Optional[str] = None  # alias for image_data
    landmarks: Optional[List[Dict[str, float]]] = None
    type: str = "gesture" # "gesture" or "image_multimodal"
    generate_suggestions: bool = True
    context: Optional[str] = None

class GestureClassifyRequest(BaseModel):
    landmarks: List[Dict[str, float]]
    timestamp: Optional[float] = None

class GestureRecognizeResponse(BaseModel):
    gesture_id: str
    label: str
    confidence: float
    suggested_text: str
    ai_suggestions: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    status: str = "recognized" # "recognized", "uncertain", "no_hand_detected"
    is_dynamic: bool = False
    landmarks: Optional[List[Dict[str, float]]] = None
    landmark_count: int = 0
    timestamp: str
    explanation: Optional[str] = None

class GestureDefinition(BaseModel):
    id: str
    label: str
    category: str # "static" or "dynamic"
    default_phrase: str
    current_phrase: str
    description: str
    icon: str
    confidence_typical: float

class GestureVocabularyResponse(BaseModel):
    vocabulary: List[GestureDefinition]
    total_gestures: int
    custom_mappings_count: int

class GestureMappingUpdateRequest(BaseModel):
    mappings: Dict[str, str]

class GestureHistoryItem(BaseModel):
    history_id: str
    gesture_id: str
    label: str
    confidence: float
    suggested_text: str
    status: str
    is_dynamic: bool = False
    timestamp: str

class GestureHistoryResponse(BaseModel):
    history: List[GestureHistoryItem]
    total: int
