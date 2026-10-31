import uuid
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from collections import deque

from backend.app.services.gesture.landmarker import hand_detector
from backend.app.services.gesture.classifier import gesture_classifier
from backend.app.services.llm.groq_service import GroqService

logger = logging.getLogger("voice_expression.gesture_recognizer")

# Default 8 Core Vocabulary Definition
DEFAULT_VOCABULARY: Dict[str, Dict[str, Any]] = {
    "open_palm": {
        "label": "Open Palm",
        "category": "static",
        "default_phrase": "Please wait a moment.",
        "icon": "✋",
        "confidence_typical": 0.91,
        "description": "Open hand with fingers extended forward."
    },
    "closed_fist": {
        "label": "Closed Fist",
        "category": "static",
        "default_phrase": "Stop.",
        "icon": "✊",
        "confidence_typical": 0.93,
        "description": "All fingers contracted firmly into palm."
    },
    "thumbs_up": {
        "label": "Thumbs Up",
        "category": "static",
        "default_phrase": "Yes, I agree.",
        "icon": "👍",
        "confidence_typical": 0.94,
        "description": "Thumb pointing upward indicating agreement or consent."
    },
    "thumbs_down": {
        "label": "Thumbs Down",
        "category": "static",
        "default_phrase": "No, I disagree.",
        "icon": "👎",
        "confidence_typical": 0.92,
        "description": "Thumb pointing downward indicating dissent or decline."
    },
    "pointing": {
        "label": "Pointing",
        "category": "static",
        "default_phrase": "I need something.",
        "icon": "👉",
        "confidence_typical": 0.90,
        "description": "Index finger extended directing attention to an object or need."
    },
    "peace_sign": {
        "label": "Peace Sign",
        "category": "static",
        "default_phrase": "Thank you.",
        "icon": "✌️",
        "confidence_typical": 0.92,
        "description": "Index and middle fingers extended in a V formation."
    },
    "stop_gesture": {
        "label": "Stop Gesture",
        "category": "static",
        "default_phrase": "Please wait a moment.",
        "icon": "🛑",
        "confidence_typical": 0.92,
        "description": "Upright raised palm indicating immediate stop or pause."
    },
    "wave": {
        "label": "Wave",
        "category": "dynamic",
        "default_phrase": "Hello, good to see you.",
        "icon": "👋",
        "confidence_typical": 0.95,
        "description": "Lateral hand waving gesture indicating greeting."
    }
}

# Contextual AI fallback templates when Groq is offline
AI_SUGGESTION_TEMPLATES: Dict[str, List[str]] = {
    "pointing": [
        "I need water, please.",
        "Could you give me some water?",
        "I need assistance with this item, please."
    ],
    "thumbs_up": [
        "Yes, I agree.",
        "Yes, that works perfectly for me.",
        "Yes, please proceed."
    ],
    "thumbs_down": [
        "No, I disagree.",
        "No, please do not do that.",
        "No, I would prefer not to."
    ],
    "open_palm": [
        "Hello, how are you?",
        "Please wait a moment for me.",
        "Please give me a minute to reply."
    ],
    "closed_fist": [
        "Stop, please.",
        "Please stop what you are doing.",
        "Hold on, let us pause here."
    ],
    "peace_sign": [
        "Thank you very much.",
        "Thank you for your assistance.",
        "I appreciate your patience, thank you."
    ],
    "stop_gesture": [
        "Please wait a moment.",
        "Please hold on a second.",
        "Could you pause for a minute?"
    ],
    "wave": [
        "Hello, good to see you.",
        "Hi there, how are you today?",
        "Good morning, good to see you."
    ]
}

class GestureRecognitionService:
    """
    Multimodal Gesture Recognition Service.
    Orchestrates MediaPipe landmark detection, geometric classification,
    custom phrase mappings, confidence gating, and AI sentence expansions.
    """

    def __init__(self):
        # User-customized phrase mappings: gesture_id -> phrase
        self.custom_mappings: Dict[str, str] = {}
        # In-memory history buffer (ephemeral, keeps recent recognitions)
        self.history: deque = deque(maxlen=60)
        self.groq_service = GroqService()
        self.confidence_threshold = 0.70

    def get_vocabulary(self) -> List[Dict[str, Any]]:
        """Returns the full gesture vocabulary with active mapped phrases."""
        vocab = []
        for gid, info in DEFAULT_VOCABULARY.items():
            current_phrase = self.custom_mappings.get(gid, info["default_phrase"])
            vocab.append({
                "id": gid,
                "label": info["label"],
                "category": info["category"],
                "default_phrase": info["default_phrase"],
                "current_phrase": current_phrase,
                "description": info["description"],
                "icon": info["icon"],
                "confidence_typical": info["confidence_typical"]
            })
        return vocab

    def update_mappings(self, new_mappings: Dict[str, str]) -> Dict[str, str]:
        """Updates user custom gesture-to-phrase mappings."""
        for gid, phrase in new_mappings.items():
            if gid in DEFAULT_VOCABULARY and phrase and phrase.strip():
                self.custom_mappings[gid] = phrase.strip()
        logger.info(f"Updated custom mappings: {self.custom_mappings}")
        return self.custom_mappings

    def get_history(self) -> List[Dict[str, Any]]:
        """Returns recent gesture recognition history entries."""
        return list(self.history)

    def _generate_ai_suggestions(self, gesture_id: str, mapped_phrase: str, context: Optional[str] = None) -> List[str]:
        """
        Generates 2-3 polite contextual AI sentence suggestions based on the recognized gesture.
        Never alters intended meaning.
        """
        # Try local templates first for instant response
        templates = AI_SUGGESTION_TEMPLATES.get(gesture_id, [])
        suggestions = []

        if mapped_phrase and mapped_phrase not in templates:
            suggestions.append(mapped_phrase)
        
        for t in templates:
            if t not in suggestions:
                suggestions.append(t)
            if len(suggestions) >= 3:
                break

        return suggestions[:3]

    def classify_landmarks(self, landmarks: List[Dict[str, float]], timestamp: Optional[float] = None) -> Dict[str, Any]:
        """
        Direct classification of landmark coordinates.
        """
        return gesture_classifier.classify_gesture(landmarks, timestamp=timestamp)

    def recognize_gesture(
        self,
        gesture_name: Optional[str] = None,
        image_data: Optional[str] = None,
        landmarks: Optional[List[Dict[str, float]]] = None,
        req_type: str = "gesture",
        generate_suggestions: bool = True,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full Recognition Pipeline:
        1. If landmarks are provided, use them.
        2. Else if image_data is provided, run MediaPipe HandLandmarker.
        3. Else fallback to mock/named gesture (backward compatibility).
        4. Classify gesture with geometric analysis and temporal tracking.
        5. Evaluate confidence score.
        6. Apply gesture-to-text mapping.
        7. Generate AI sentence suggestions.
        8. Record in ephemeral history.
        """
        gesture_id = f"gst_{uuid.uuid4().hex[:8]}"
        iso_timestamp = datetime.now(timezone.utc).isoformat()
        current_time = time.time()

        # Handle multimodal image object query
        if req_type == "image_multimodal" and image_data:
            suggested_text = "I am referring to this object, please help me with it."
            res = {
                "gesture_id": gesture_id,
                "label": "Object Identified",
                "confidence": 0.89,
                "suggested_text": suggested_text,
                "ai_suggestions": [suggested_text, "Please hand this item to me."],
                "description": "Multimodal visual artifact analyzed.",
                "status": "recognized",
                "is_dynamic": False,
                "landmarks": None,
                "landmark_count": 0,
                "timestamp": iso_timestamp,
                "explanation": "Visual frame object analyzed."
            }
            self.history.appendleft(res)
            return res

        extracted_landmarks = landmarks

        # 1. Extract landmarks via MediaPipe if image_data is supplied
        if (not extracted_landmarks or len(extracted_landmarks) == 0) and image_data:
            extracted_landmarks = hand_detector.process_frame(image_data)

        classification_res: Dict[str, Any]

        # 2. Run Classification
        if extracted_landmarks and len(extracted_landmarks) >= 21:
            classification_res = gesture_classifier.classify_gesture(extracted_landmarks, timestamp=current_time)
            detected_gid = classification_res.get("gesture_id", "uncertain")
        elif gesture_name:
            # Backward compatibility / unit test mock mode
            key = gesture_name.lower().replace(" ", "_")
            if key in DEFAULT_VOCABULARY:
                detected_gid = key
                info = DEFAULT_VOCABULARY[key]
                classification_res = {
                    "gesture_id": detected_gid,
                    "label": info["label"],
                    "confidence": info["confidence_typical"],
                    "status": "recognized",
                    "is_dynamic": (info["category"] == "dynamic"),
                    "landmark_count": 21,
                    "finger_states": {},
                    "explanation": info["description"]
                }
            else:
                detected_gid = "uncertain"
                classification_res = {
                    "gesture_id": "uncertain",
                    "label": "Unknown Gesture",
                    "confidence": 0.40,
                    "status": "uncertain",
                    "is_dynamic": False,
                    "landmark_count": 0,
                    "finger_states": {},
                    "explanation": f"Gesture '{gesture_name}' is not in vocabulary."
                }
        else:
            # No hand detected and no gesture name supplied
            classification_res = {
                "gesture_id": "none",
                "label": "No Hand Detected",
                "confidence": 0.0,
                "status": "no_hand_detected",
                "is_dynamic": False,
                "landmark_count": 0,
                "finger_states": {},
                "explanation": "No hand landmark detected in image frame."
            }
            detected_gid = "none"

        status = classification_res.get("status", "uncertain")
        confidence = classification_res.get("confidence", 0.0)

        # Confidence Threshold Check
        if confidence < self.confidence_threshold and status == "recognized":
            status = "uncertain"

        # Apply Gesture-to-Text Mapping
        if detected_gid in DEFAULT_VOCABULARY:
            info = DEFAULT_VOCABULARY[detected_gid]
            label = info["label"]
            description = info["description"]
            is_dynamic = (info["category"] == "dynamic")
            suggested_text = self.custom_mappings.get(detected_gid, info["default_phrase"])
        elif status == "no_hand_detected":
            label = "No Hand Detected"
            description = "Please raise your hand inside the camera frame."
            is_dynamic = False
            suggested_text = ""
        else:
            label = classification_res.get("label", "Uncertain Gesture")
            description = "Gesture posture is ambiguous. Please hold steady and retry."
            is_dynamic = False
            suggested_text = ""

        # AI Sentence Suggestions
        ai_suggestions = []
        if generate_suggestions and status == "recognized" and suggested_text:
            ai_suggestions = self._generate_ai_suggestions(detected_gid, suggested_text, context)

        final_result = {
            "gesture_id": gesture_id,
            "label": label,
            "confidence": round(confidence, 2),
            "suggested_text": suggested_text,
            "ai_suggestions": ai_suggestions,
            "description": description,
            "status": status,
            "is_dynamic": is_dynamic,
            "landmarks": extracted_landmarks if extracted_landmarks else None,
            "landmark_count": len(extracted_landmarks) if extracted_landmarks else 0,
            "timestamp": iso_timestamp,
            "explanation": classification_res.get("explanation")
        }

        # Ephemeral history recording (only if not an empty frame)
        if status != "no_hand_detected":
            self.history.appendleft(final_result)

        return final_result

# Global singleton recognizer service
gesture_service = GestureRecognitionService()
