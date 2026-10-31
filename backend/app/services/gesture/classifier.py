import time
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from collections import deque
import numpy as np

logger = logging.getLogger("voice_expression.gesture_classifier")

# 21 Hand Landmark indices according to MediaPipe specification
WRIST = 0
THUMB_CMC = 1
THUMB_MCP = 2
THUMB_IP = 3
THUMB_TIP = 4

INDEX_MCP = 5
INDEX_PIP = 6
INDEX_DIP = 7
INDEX_TIP = 8

MIDDLE_MCP = 9
MIDDLE_PIP = 10
MIDDLE_DIP = 11
MIDDLE_TIP = 12

RING_MCP = 13
RING_PIP = 14
RING_DIP = 15
RING_TIP = 16

PINKY_MCP = 17
PINKY_PIP = 18
PINKY_DIP = 19
PINKY_TIP = 20

# Standard connections for skeleton rendering
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),        # Index
    (5, 9), (9, 10), (10, 11), (11, 12),   # Middle
    (9, 13), (13, 14), (14, 15), (15, 16), # Ring
    (13, 17), (17, 18), (18, 19), (19, 20),# Pinky
    (0, 17)                                # Palm base
]

class GestureClassifier:
    """
    Modular Computer Vision Gesture Classifier.
    Extracts 3D geometric joint angles, finger extension states, hand orientation,
    and temporal motion tracking to classify static and dynamic hand gestures.
    """

    def __init__(self, history_len: int = 15):
        # Sliding window of hand centroids for temporal dynamic gestures (e.g. Wave)
        self.history_len = history_len
        # Deque of tuples: (timestamp, wrist_x, wrist_y, palm_center_x, palm_center_y)
        self.temporal_history: deque = deque(maxlen=history_len)

    def reset_temporal_history(self):
        """Reset temporal motion history when tracking starts or resets."""
        self.temporal_history.clear()

    @staticmethod
    def _euclidean_dist_2d(p1: Dict[str, float], p2: Dict[str, float]) -> float:
        return math.sqrt((p1.get("x", 0) - p2.get("x", 0)) ** 2 + (p1.get("y", 0) - p2.get("y", 0)) ** 2)

    @staticmethod
    def _euclidean_dist_3d(p1: Dict[str, float], p2: Dict[str, float]) -> float:
        return math.sqrt(
            (p1.get("x", 0) - p2.get("x", 0)) ** 2 +
            (p1.get("y", 0) - p2.get("y", 0)) ** 2 +
            (p1.get("z", 0) - p2.get("z", 0)) ** 2
        )

    def extract_features(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Calculates geometric metrics from 21 MediaPipe hand landmarks.
        Normalizes for scale by palm reference size (wrist to middle MCP).
        """
        if not landmarks or len(landmarks) < 21:
            return {"valid": False}

        wrist = landmarks[WRIST]
        palm_size = self._euclidean_dist_2d(wrist, landmarks[MIDDLE_MCP])
        if palm_size < 1e-5:
            palm_size = 0.1  # avoid division by zero

        # Check extension for 4 main fingers
        # A finger is extended when tip distance to wrist is significantly larger than pip to wrist
        def is_finger_extended(tip_idx: int, pip_idx: int, mcp_idx: int) -> Tuple[bool, float]:
            tip = landmarks[tip_idx]
            pip = landmarks[pip_idx]
            mcp = landmarks[mcp_idx]
            dist_tip_wrist = self._euclidean_dist_2d(tip, wrist)
            dist_pip_wrist = self._euclidean_dist_2d(pip, wrist)
            ratio = dist_tip_wrist / max(dist_pip_wrist, 1e-4)
            # Upright extension heuristic in image coords (y decreases upwards)
            is_extended = ratio > 1.15 and dist_tip_wrist > (self._euclidean_dist_2d(mcp, wrist) * 1.1)
            return is_extended, ratio

        index_ext, index_ratio = is_finger_extended(INDEX_TIP, INDEX_PIP, INDEX_MCP)
        middle_ext, middle_ratio = is_finger_extended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP)
        ring_ext, ring_ratio = is_finger_extended(RING_TIP, RING_PIP, RING_MCP)
        pinky_ext, pinky_ratio = is_finger_extended(PINKY_TIP, PINKY_PIP, PINKY_MCP)

        # Thumb extension & orientation
        # Thumb operates on abduction and flexion relative to pinky MCP and wrist
        thumb_tip = landmarks[THUMB_TIP]
        thumb_ip = landmarks[THUMB_IP]
        thumb_mcp = landmarks[THUMB_MCP]
        dist_thumb_pinky_mcp = self._euclidean_dist_2d(thumb_tip, landmarks[PINKY_MCP])
        dist_thumb_wrist = self._euclidean_dist_2d(thumb_tip, wrist)
        thumb_mcp_wrist = self._euclidean_dist_2d(thumb_mcp, wrist)
        thumb_ext = dist_thumb_pinky_mcp > (palm_size * 0.9) or (dist_thumb_wrist > thumb_mcp_wrist * 1.18)

        # Thumb direction vector (from MCP to TIP)
        thumb_dx = thumb_tip.get("x", 0) - thumb_mcp.get("x", 0)
        thumb_dy = thumb_tip.get("y", 0) - thumb_mcp.get("y", 0)
        
        # In screen coords: y=0 top, y=1 bottom. Up means dy < -0.05
        thumb_up = thumb_dy < -0.06 and thumb_tip.get("y", 0) < wrist.get("y", 0)
        thumb_down = thumb_dy > 0.06 and thumb_tip.get("y", 0) > wrist.get("y", 0)

        # Distance between index tip and middle tip (for peace sign V-spread)
        index_middle_spread = self._euclidean_dist_2d(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]) / palm_size

        # Palm center approx
        palm_center_x = (wrist.get("x", 0) + landmarks[INDEX_MCP].get("x", 0) + landmarks[PINKY_MCP].get("x", 0)) / 3.0
        palm_center_y = (wrist.get("y", 0) + landmarks[INDEX_MCP].get("y", 0) + landmarks[PINKY_MCP].get("y", 0)) / 3.0

        return {
            "valid": True,
            "palm_size": palm_size,
            "palm_center": (palm_center_x, palm_center_y),
            "wrist": wrist,
            "finger_states": {
                "thumb": thumb_ext,
                "index": index_ext,
                "middle": middle_ext,
                "ring": ring_ext,
                "pinky": pinky_ext
            },
            "thumb_up": thumb_up,
            "thumb_down": thumb_down,
            "index_middle_spread": index_middle_spread,
            "num_extended_fingers": sum([thumb_ext, index_ext, middle_ext, ring_ext, pinky_ext]),
            "num_extended_four": sum([index_ext, middle_ext, ring_ext, pinky_ext])
        }

    def detect_wave_motion(self, current_time: float, palm_center_x: float) -> Tuple[bool, float]:
        """
        Temporal dynamic analysis: Detects side-to-side hand waving oscillation.
        Returns (is_wave, motion_confidence).
        """
        self.temporal_history.append((current_time, palm_center_x))
        if len(self.temporal_history) < 6:
            return False, 0.0

        # Filter points within the last 1.8 seconds
        recent = [pt for pt in self.temporal_history if current_time - pt[0] <= 1.8]
        if len(recent) < 6:
            return False, 0.0

        xs = [pt[1] for pt in recent]
        dxs = [xs[i] - xs[i - 1] for i in range(1, len(xs))]

        # Count direction reversals (sign changes in dx with minimum threshold)
        threshold = 0.015
        significant_dxs = [d for d in dxs if abs(d) >= threshold]
        reversals = 0
        for i in range(1, len(significant_dxs)):
            if (significant_dxs[i] > 0 and significant_dxs[i - 1] < 0) or \
               (significant_dxs[i] < 0 and significant_dxs[i - 1] > 0):
                reversals += 1

        total_lateral_path = sum(abs(d) for d in dxs)
        is_wave = reversals >= 2 and total_lateral_path > 0.10
        confidence = min(0.96, 0.70 + (reversals * 0.08) + min(0.12, total_lateral_path * 0.5))
        return is_wave, float(confidence) if is_wave else 0.0

    def classify_gesture(
        self,
        landmarks: Optional[List[Dict[str, float]]],
        timestamp: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Classifies static or dynamic hand gesture into one of the 8 core vocabulary items:
        1. Open Palm
        2. Closed Fist
        3. Thumbs Up
        4. Thumbs Down
        5. Pointing
        6. Peace Sign
        7. Stop Gesture
        8. Wave
        """
        now = timestamp if timestamp is not None else time.time()

        if not landmarks or len(landmarks) < 21:
            return {
                "gesture_id": "none",
                "label": "No Hand Detected",
                "confidence": 0.0,
                "status": "no_hand_detected",
                "is_dynamic": False,
                "landmark_count": 0,
                "finger_states": {},
                "explanation": "No hand detected in current frame."
            }

        features = self.extract_features(landmarks)
        if not features.get("valid"):
            return {
                "gesture_id": "uncertain",
                "label": "Uncertain Posture",
                "confidence": 0.35,
                "status": "uncertain",
                "is_dynamic": False,
                "landmark_count": len(landmarks),
                "finger_states": {},
                "explanation": "Landmarks coordinates were incomplete or ambiguous."
            }

        f = features["finger_states"]
        num_four = features["num_extended_four"]
        palm_center_x, palm_center_y = features["palm_center"]

        # Check dynamic Wave first if fingers are open
        if num_four >= 3:
            is_wave, wave_conf = self.detect_wave_motion(now, palm_center_x)
            if is_wave and wave_conf >= 0.75:
                return {
                    "gesture_id": "wave",
                    "label": "Wave",
                    "confidence": round(wave_conf, 2),
                    "status": "recognized",
                    "is_dynamic": True,
                    "landmark_count": len(landmarks),
                    "finger_states": f,
                    "explanation": "Lateral oscillating hand movement detected."
                }
        else:
            # Not an open hand, record center to maintain temporal smooth
            self.temporal_history.append((now, palm_center_x))

        # 1. Thumbs Up: Thumb pointing up, 4 fingers curled
        if features["thumb_up"] and num_four == 0:
            return {
                "gesture_id": "thumbs_up",
                "label": "Thumbs Up",
                "confidence": 0.94,
                "status": "recognized",
                "is_dynamic": False,
                "landmark_count": len(landmarks),
                "finger_states": f,
                "explanation": "Thumb extended upward with fingers retracted."
            }

        # 2. Thumbs Down: Thumb pointing down, 4 fingers curled
        if features["thumb_down"] and num_four == 0:
            return {
                "gesture_id": "thumbs_down",
                "label": "Thumbs Down",
                "confidence": 0.92,
                "status": "recognized",
                "is_dynamic": False,
                "landmark_count": len(landmarks),
                "finger_states": f,
                "explanation": "Thumb extended downward with fingers retracted."
            }

        # 3. Pointing: Index finger extended, middle/ring/pinky curled
        if f["index"] and not f["middle"] and not f["ring"] and not f["pinky"]:
            conf = 0.91 if not f["thumb"] else 0.86
            return {
                "gesture_id": "pointing",
                "label": "Pointing",
                "confidence": conf,
                "status": "recognized",
                "is_dynamic": False,
                "landmark_count": len(landmarks),
                "finger_states": f,
                "explanation": "Index finger extended directing attention."
            }

        # 4. Peace Sign: Index and Middle extended, Ring and Pinky curled
        if f["index"] and f["middle"] and not f["ring"] and not f["pinky"]:
            # If fingers are spread in V
            spread = features.get("index_middle_spread", 0)
            conf = 0.93 if spread > 0.25 else 0.85
            return {
                "gesture_id": "peace_sign",
                "label": "Peace Sign",
                "confidence": conf,
                "status": "recognized",
                "is_dynamic": False,
                "landmark_count": len(landmarks),
                "finger_states": f,
                "explanation": "Index and middle fingers extended in V formation."
            }

        # 5. Closed Fist: All fingers curled
        if not f["index"] and not f["middle"] and not f["ring"] and not f["pinky"] and not features["thumb_up"] and not features["thumb_down"]:
            return {
                "gesture_id": "closed_fist",
                "label": "Closed Fist",
                "confidence": 0.93,
                "status": "recognized",
                "is_dynamic": False,
                "landmark_count": len(landmarks),
                "finger_states": f,
                "explanation": "All fingers contracted firmly into palm."
            }

        # 6. Stop Gesture vs 7. Open Palm
        # When all 4 or 5 fingers are extended:
        if num_four >= 4:
            # Check orientation: if fingers are vertical and thumb is close or outstretched
            wrist_y = features["wrist"].get("y", 0)
            fingers_upright = all(landmarks[idx].get("y", 0) < wrist_y - 0.12 for idx in [INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP])
            
            # Stop gesture: firm vertical upright hand facing camera, steady
            if fingers_upright:
                # If thumb is also extended wide -> Open Palm / Stop
                # We classify as Stop Gesture if fingers are held closely together, or Open Palm if spread
                spread_span = abs(landmarks[INDEX_TIP].get("x", 0) - landmarks[PINKY_TIP].get("x", 0))
                if spread_span > 0.22:
                    return {
                        "gesture_id": "open_palm",
                        "label": "Open Palm",
                        "confidence": 0.91,
                        "status": "recognized",
                        "is_dynamic": False,
                        "landmark_count": len(landmarks),
                        "finger_states": f,
                        "explanation": "Open palm extended with outstretched fingers."
                    }
                else:
                    return {
                        "gesture_id": "stop_gesture",
                        "label": "Stop Gesture",
                        "confidence": 0.92,
                        "status": "recognized",
                        "is_dynamic": False,
                        "landmark_count": len(landmarks),
                        "finger_states": f,
                        "explanation": "Upright raised palm indicating stop or wait."
                    }
            else:
                return {
                    "gesture_id": "open_palm",
                    "label": "Open Palm",
                    "confidence": 0.87,
                    "status": "recognized",
                    "is_dynamic": False,
                    "landmark_count": len(landmarks),
                    "finger_states": f,
                    "explanation": "Fingers extended forward."
                }

        # Fallback for ambiguous or low-confidence configurations
        return {
            "gesture_id": "uncertain",
            "label": "Uncertain Gesture",
            "confidence": 0.52,
            "status": "uncertain",
            "is_dynamic": False,
            "landmark_count": len(landmarks),
            "finger_states": f,
            "explanation": "Finger configuration was ambiguous. Please adjust hand position."
        }

# Global singleton classifier instance
gesture_classifier = GestureClassifier()

