import uuid
from typing import Dict, Any, Optional

GESTURE_MAP = {
    "thumbs_up": {
        "label": "Thumbs Up",
        "phrase": "Yes, I agree.",
        "confidence": 0.94,
        "description": "Upward thumb gesture indicating affirmative consent or agreement."
    },
    "thumbs_down": {
        "label": "Thumbs Down",
        "phrase": "No, I disagree.",
        "confidence": 0.91,
        "description": "Downward thumb gesture indicating decline or refusal."
    },
    "open_palm": {
        "label": "Open Palm",
        "phrase": "Please wait a moment.",
        "confidence": 0.88,
        "description": "Flat palm facing forward indicating pause or wait."
    },
    "wave": {
        "label": "Wave",
        "phrase": "Hello, good to see you.",
        "confidence": 0.95,
        "description": "Lateral hand waving gesture indicating greeting."
    },
    "pointing": {
        "label": "Pointing",
        "phrase": "I need that one, please.",
        "confidence": 0.82,
        "description": "Extended index finger indicating object of interest."
    },
    "head_nod": {
        "label": "Head Nod",
        "phrase": "Yes, absolutely.",
        "confidence": 0.89,
        "description": "Vertical head movement indicating agreement."
    }
}

class GestureRecognitionService:
    def recognize_gesture(self, gesture_name: Optional[str] = None, image_data: Optional[str] = None, landmarks = None, req_type: str = "gesture") -> Dict[str, Any]:
        gesture_id = f"gst_{uuid.uuid4().hex[:8]}"

        if req_type == "image_multimodal" and image_data:
            return {
                "gesture_id": gesture_id,
                "label": "Object Identified",
                "confidence": 0.89,
                "suggested_text": "I am referring to this object, please help me with it.",
                "description": "Multimodal visual artifact analyzed.",
                "status": "recognized"
            }

        key = (gesture_name or "thumbs_up").lower().replace(" ", "_")
        g_info = GESTURE_MAP.get(key, GESTURE_MAP["thumbs_up"])

        return {
            "gesture_id": gesture_id,
            "label": g_info["label"],
            "confidence": g_info["confidence"],
            "suggested_text": g_info["phrase"],
            "description": g_info["description"],
            "status": "recognized"
        }

gesture_service = GestureRecognitionService()

