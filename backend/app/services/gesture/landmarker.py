import os
import base64
import logging
import threading
from typing import List, Dict, Any, Optional
import numpy as np
import cv2

logger = logging.getLogger("voice_expression.hand_landmarker")

# Lazy imports for MediaPipe to allow clean execution and fallbacks
_mp_available = False
_vision = None
_python = None
_mp = None

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    _mp = mp
    _python = mp_python
    _vision = mp_vision
    _mp_available = True
except Exception as e:
    logger.warning(f"MediaPipe tasks vision could not be imported: {e}")

class MediaPipeHandDetector:
    """
    Ephemerally processes camera frames with Google MediaPipe Hand Landmarker.
    Strict Privacy Compliance:
    - Never saves raw frames or video to disk.
    - Operates purely in ephemeral volatile memory.
    """

    def __init__(self, model_path: Optional[str] = None):
        self._lock = threading.Lock()
        self._detector = None
        self._initialized = False

        if not model_path:
            # Default model path
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_path = os.path.join(base_dir, "models", "hand_landmarker.task")
        else:
            self.model_path = model_path

    def _get_detector(self):
        if self._initialized:
            return self._detector

        with self._lock:
            if self._initialized:
                return self._detector

            if not _mp_available or not os.path.exists(self.model_path):
                logger.warning(f"HandLandmarker model not present at {self.model_path} or MediaPipe unavailable.")
                self._initialized = True
                self._detector = None
                return None

            try:
                base_options = _python.BaseOptions(model_asset_path=self.model_path)
                options = _vision.HandLandmarkerOptions(
                    base_options=base_options,
                    num_hands=1,
                    min_hand_detection_confidence=0.5,
                    min_hand_presence_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self._detector = _vision.HandLandmarker.create_from_options(options)
                self._initialized = True
                logger.info("MediaPipe HandLandmarker successfully loaded into memory.")
            except Exception as e:
                logger.error(f"Failed to initialize MediaPipe HandLandmarker: {e}")
                self._detector = None
                self._initialized = True

            return self._detector

    def decode_image_base64(self, image_data: str) -> Optional[np.ndarray]:
        """
        Decodes base64 JPEG/PNG string into RGB OpenCV numpy array in ephemeral memory.
        """
        try:
            if not image_data:
                return None

            # Strip data URL prefix if present (e.g. data:image/jpeg;base64,...)
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]

            img_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr is None:
                return None

            # Convert BGR to RGB for MediaPipe
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            return img_rgb
        except Exception as e:
            logger.warning(f"Error decoding image frame: {e}")
            return None

    def detect_landmarks_from_image(self, img_rgb: np.ndarray) -> List[Dict[str, float]]:
        """
        Runs MediaPipe inference on in-memory RGB frame.
        Returns list of 21 landmark dictionaries [{x, y, z}, ...] for the primary hand.
        """
        detector = self._get_detector()
        if detector is None or _mp is None:
            return []

        try:
            mp_image = _mp.Image(image_format=_mp.ImageFormat.SRGB, data=img_rgb)
            with self._lock:
                detection_result = detector.detect(mp_image)

            if not detection_result.hand_landmarks or len(detection_result.hand_landmarks) == 0:
                return []

            primary_hand = detection_result.hand_landmarks[0]
            landmarks = [
                {
                    "x": float(lm.x),
                    "y": float(lm.y),
                    "z": float(lm.z)
                }
                for lm in primary_hand
            ]
            return landmarks
        except Exception as e:
            logger.error(f"Inference error in detect_landmarks_from_image: {e}")
            return []

    def process_frame(self, image_data: str) -> List[Dict[str, float]]:
        """
        End-to-end ephemeral frame processing from base64 string to 21 landmarks.
        """
        img_rgb = self.decode_image_base64(image_data)
        if img_rgb is None:
            return []
        landmarks = self.detect_landmarks_from_image(img_rgb)
        return landmarks

# Global detector instance
hand_detector = MediaPipeHandDetector()

