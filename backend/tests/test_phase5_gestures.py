import pytest
import time
import json
from httpx import AsyncClient, ASGITransport
from starlette.testclient import TestClient

from backend.app.main import app
from backend.app.services.gesture.classifier import GestureClassifier
from backend.app.services.gesture.recognizer import gesture_service, DEFAULT_VOCABULARY

def create_synthetic_hand(
    wrist=(0.5, 0.8),
    thumb_tip=(0.35, 0.6),
    thumb_mcp=(0.42, 0.7),
    index_tip=(0.45, 0.3),
    index_pip=(0.45, 0.5),
    index_mcp=(0.45, 0.65),
    middle_tip=(0.50, 0.28),
    middle_pip=(0.50, 0.5),
    middle_mcp=(0.50, 0.65),
    ring_tip=(0.55, 0.32),
    ring_pip=(0.55, 0.52),
    ring_mcp=(0.55, 0.66),
    pinky_tip=(0.60, 0.38),
    pinky_pip=(0.60, 0.55),
    pinky_mcp=(0.60, 0.68),
):
    """Generates a complete list of 21 3D MediaPipe landmarks."""
    landmarks = [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(21)]
    landmarks[0] = {"x": wrist[0], "y": wrist[1], "z": 0.0}

    # Thumb (1-4)
    landmarks[1] = {"x": (wrist[0] + thumb_mcp[0]) / 2, "y": (wrist[1] + thumb_mcp[1]) / 2, "z": 0.0}
    landmarks[2] = {"x": thumb_mcp[0], "y": thumb_mcp[1], "z": 0.0}
    landmarks[3] = {"x": (thumb_mcp[0] + thumb_tip[0]) / 2, "y": (thumb_mcp[1] + thumb_tip[1]) / 2, "z": 0.0}
    landmarks[4] = {"x": thumb_tip[0], "y": thumb_tip[1], "z": 0.0}

    # Index (5-8)
    landmarks[5] = {"x": index_mcp[0], "y": index_mcp[1], "z": 0.0}
    landmarks[6] = {"x": index_pip[0], "y": index_pip[1], "z": 0.0}
    landmarks[7] = {"x": (index_pip[0] + index_tip[0]) / 2, "y": (index_pip[1] + index_tip[1]) / 2, "z": 0.0}
    landmarks[8] = {"x": index_tip[0], "y": index_tip[1], "z": 0.0}

    # Middle (9-12)
    landmarks[9] = {"x": middle_mcp[0], "y": middle_mcp[1], "z": 0.0}
    landmarks[10] = {"x": middle_pip[0], "y": middle_pip[1], "z": 0.0}
    landmarks[11] = {"x": (middle_pip[0] + middle_tip[0]) / 2, "y": (middle_pip[1] + middle_tip[1]) / 2, "z": 0.0}
    landmarks[12] = {"x": middle_tip[0], "y": middle_tip[1], "z": 0.0}

    # Ring (13-16)
    landmarks[13] = {"x": ring_mcp[0], "y": ring_mcp[1], "z": 0.0}
    landmarks[14] = {"x": ring_pip[0], "y": ring_pip[1], "z": 0.0}
    landmarks[15] = {"x": (ring_pip[0] + ring_tip[0]) / 2, "y": (ring_pip[1] + ring_tip[1]) / 2, "z": 0.0}
    landmarks[16] = {"x": ring_tip[0], "y": ring_tip[1], "z": 0.0}

    # Pinky (17-20)
    landmarks[17] = {"x": pinky_mcp[0], "y": pinky_mcp[1], "z": 0.0}
    landmarks[18] = {"x": pinky_pip[0], "y": pinky_pip[1], "z": 0.0}
    landmarks[19] = {"x": (pinky_pip[0] + pinky_tip[0]) / 2, "y": (pinky_pip[1] + pinky_tip[1]) / 2, "z": 0.0}
    landmarks[20] = {"x": pinky_tip[0], "y": pinky_tip[1], "z": 0.0}

    return landmarks

def make_open_palm():
    return create_synthetic_hand(
        index_tip=(0.40, 0.25),
        middle_tip=(0.50, 0.22),
        ring_tip=(0.60, 0.26),
        pinky_tip=(0.70, 0.32),
        thumb_tip=(0.28, 0.55),
    )

def make_closed_fist():
    # Curled tips close to palm
    return create_synthetic_hand(
        thumb_tip=(0.45, 0.70),
        thumb_mcp=(0.42, 0.72),
        index_tip=(0.45, 0.72),
        index_pip=(0.45, 0.65),
        middle_tip=(0.50, 0.72),
        middle_pip=(0.50, 0.65),
        ring_tip=(0.55, 0.72),
        ring_pip=(0.55, 0.66),
        pinky_tip=(0.60, 0.73),
        pinky_pip=(0.60, 0.68),
    )

def make_thumbs_up():
    fist = make_closed_fist()
    # Thumb points straight up above wrist
    fist[4] = {"x": 0.40, "y": 0.35, "z": 0.0}
    fist[3] = {"x": 0.40, "y": 0.48, "z": 0.0}
    fist[2] = {"x": 0.42, "y": 0.62, "z": 0.0}
    return fist

def make_thumbs_down():
    fist = make_closed_fist()
    # Thumb points straight down below wrist
    fist[4] = {"x": 0.40, "y": 0.98, "z": 0.0}
    fist[3] = {"x": 0.40, "y": 0.88, "z": 0.0}
    fist[2] = {"x": 0.42, "y": 0.75, "z": 0.0}
    return fist

def make_pointing():
    fist = make_closed_fist()
    # Index finger extended
    fist[8] = {"x": 0.45, "y": 0.25, "z": 0.0}
    fist[7] = {"x": 0.45, "y": 0.38, "z": 0.0}
    fist[6] = {"x": 0.45, "y": 0.50, "z": 0.0}
    return fist

def make_peace_sign():
    fist = make_closed_fist()
    # Index and Middle extended in V
    fist[8] = {"x": 0.42, "y": 0.25, "z": 0.0}
    fist[6] = {"x": 0.44, "y": 0.50, "z": 0.0}
    fist[12] = {"x": 0.56, "y": 0.25, "z": 0.0}
    fist[10] = {"x": 0.52, "y": 0.50, "z": 0.0}
    return fist

def make_stop_gesture():
    # Vertical upright hand with tight fingers
    return create_synthetic_hand(
        wrist=(0.5, 0.8),
        index_tip=(0.47, 0.28),
        middle_tip=(0.50, 0.26),
        ring_tip=(0.53, 0.29),
        pinky_tip=(0.56, 0.34),
        thumb_tip=(0.40, 0.50),
    )

class TestGestureRecognitionClassifier:

    def test_static_gesture_classifications(self):
        classifier = GestureClassifier()

        # 1. Open Palm
        res = classifier.classify_gesture(make_open_palm())
        assert res["gesture_id"] == "open_palm"
        assert res["confidence"] >= 0.80

        # 2. Closed Fist
        res = classifier.classify_gesture(make_closed_fist())
        assert res["gesture_id"] == "closed_fist"
        assert res["confidence"] >= 0.80

        # 3. Thumbs Up
        res = classifier.classify_gesture(make_thumbs_up())
        assert res["gesture_id"] == "thumbs_up"
        assert res["confidence"] >= 0.85

        # 4. Thumbs Down
        res = classifier.classify_gesture(make_thumbs_down())
        assert res["gesture_id"] == "thumbs_down"
        assert res["confidence"] >= 0.85

        # 5. Pointing
        res = classifier.classify_gesture(make_pointing())
        assert res["gesture_id"] == "pointing"
        assert res["confidence"] >= 0.80

        # 6. Peace Sign
        res = classifier.classify_gesture(make_peace_sign())
        assert res["gesture_id"] == "peace_sign"
        assert res["confidence"] >= 0.80

        # 7. Stop Gesture
        res = classifier.classify_gesture(make_stop_gesture())
        assert res["gesture_id"] in ["stop_gesture", "open_palm"]
        assert res["confidence"] >= 0.80

    def test_dynamic_wave_classification(self):
        classifier = GestureClassifier()
        palm = make_open_palm()

        # Simulate lateral waving oscillation across timestamps: Left -> Right -> Left -> Right
        t0 = time.time()
        # Feed 10 frames oscillating laterally
        offsets = [-0.10, -0.05, 0.02, 0.08, 0.03, -0.04, -0.09, -0.02, 0.06, 0.09]
        res = None
        for i, dx in enumerate(offsets):
            shifted_palm = [{"x": pt["x"] + dx, "y": pt["y"], "z": pt["z"]} for pt in palm]
            res = classifier.classify_gesture(shifted_palm, timestamp=t0 + (i * 0.1))

        assert res is not None
        assert res["gesture_id"] == "wave"
        assert res["is_dynamic"] is True
        assert res["confidence"] >= 0.75

    def test_no_hand_and_uncertain(self):
        classifier = GestureClassifier()
        
        # Empty landmarks
        res = classifier.classify_gesture([])
        assert res["status"] == "no_hand_detected"
        assert res["confidence"] == 0.0

        # Incomplete landmarks
        res2 = classifier.classify_gesture([{"x": 0.5, "y": 0.5}] * 10)
        assert res2["status"] == "no_hand_detected"

@pytest.mark.asyncio
class TestGestureEndpoints:

    async def test_vocabulary_and_mappings(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. GET Vocabulary
            res = await ac.get("/api/v1/gesture/vocabulary")
            assert res.status_code == 200
            data = res.json()
            assert data["total_gestures"] == 8
            vocab_ids = [item["id"] for item in data["vocabulary"]]
            assert "open_palm" in vocab_ids
            assert "closed_fist" in vocab_ids
            assert "thumbs_up" in vocab_ids
            assert "thumbs_down" in vocab_ids
            assert "pointing" in vocab_ids
            assert "peace_sign" in vocab_ids
            assert "stop_gesture" in vocab_ids
            assert "wave" in vocab_ids

            # 2. PUT Custom Mappings
            update_res = await ac.put("/api/v1/gesture/mappings", json={
                "mappings": {
                    "open_palm": "Hello from custom mapping!",
                    "pointing": "I need some water please."
                }
            })
            assert update_res.status_code == 200
            updated_vocab = {item["id"]: item["current_phrase"] for item in update_res.json()["vocabulary"]}
            assert updated_vocab["open_palm"] == "Hello from custom mapping!"
            assert updated_vocab["pointing"] == "I need some water please."

            # 3. Recognize with updated mapping
            rec_res = await ac.post("/api/v1/gesture/recognize", json={"gesture_name": "open_palm"})
            assert rec_res.status_code == 200
            assert rec_res.json()["suggested_text"] == "Hello from custom mapping!"

            # Reset back to standard for other tests
            await ac.put("/api/v1/gesture/mappings", json={
                "mappings": {
                    "open_palm": "Please wait a moment."
                }
            })

    async def test_recognize_with_landmarks(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # Send synthetic pointing hand landmarks
            pointing_lms = make_pointing()
            res = await ac.post("/api/v1/gesture/recognize", json={
                "landmarks": pointing_lms,
                "generate_suggestions": True
            })
            assert res.status_code == 200
            data = res.json()
            assert data["label"] == "Pointing"
            assert data["confidence"] >= 0.80
            assert data["status"] == "recognized"
            assert len(data["ai_suggestions"]) > 0

    async def test_classify_endpoint(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            peace_lms = make_peace_sign()
            res = await ac.post("/api/v1/gesture/classify", json={"landmarks": peace_lms})
            assert res.status_code == 200
            data = res.json()
            assert data["label"] == "Peace Sign"
            assert data["confidence"] >= 0.80

    async def test_gesture_history_endpoint(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # Trigger a recognition first
            await ac.post("/api/v1/gesture/recognize", json={"gesture_name": "thumbs_up"})
            # Fetch history
            res = await ac.get("/api/v1/gesture/history")
            assert res.status_code == 200
            data = res.json()
            assert data["total"] > 0
            assert any(item["label"] == "Thumbs Up" for item in data["history"])

    async def test_low_confidence_uncertain_handling(self):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # Empty frame should return no_hand_detected
            res = await ac.post("/api/v1/gesture/recognize", json={"landmarks": []})
            assert res.status_code == 200
            assert res.json()["status"] == "no_hand_detected"
            assert res.json()["confidence"] == 0.0

    async def test_base64_image_frame_recognition(self):
        import cv2, base64, numpy as np
        # Generate black frame encoded to base64
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        _, buf = cv2.imencode('.jpg', frame)
        b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            res = await ac.post("/api/v1/gesture/recognize", json={"image_data": b64})
            assert res.status_code == 200
            data = res.json()
            assert data["status"] in ["no_hand_detected", "uncertain"]
            assert data["confidence"] < 0.70

def test_websocket_gesture_stream():
    client = TestClient(app)
    with client.websocket_connect("/ws/gesture") as websocket:
        init_msg = websocket.receive_json()
        assert init_msg["type"] == "gesture.ready"

        # Send ping
        websocket.send_json({"type": "ping"})
        pong = websocket.receive_json()
        assert pong["type"] == "pong"

        # Stream landmarks
        pointing_lms = make_pointing()
        websocket.send_json({"type": "landmarks", "landmarks": pointing_lms})
        result = websocket.receive_json()
        assert result["type"] == "gesture.result"
        assert result["data"]["label"] == "Pointing"
        assert result["data"]["confidence"] >= 0.80
