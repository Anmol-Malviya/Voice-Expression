import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_gestures_and_quick_phrases():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Recognize gesture
        gest_res = await ac.post("/api/gesture/recognize", json={"gesture_name": "open_palm"})
        assert gest_res.status_code == 200
        data = gest_res.json()
        assert data["label"] == "Open Palm"
        assert "Please wait" in data["suggested_text"]
        assert data["confidence"] > 0.8

        # 2. List quick phrases
        phrases_res = await ac.get("/api/phrases")
        assert phrases_res.status_code == 200
        phrases = phrases_res.json()
        assert len(phrases) >= 9 # All standard required phrases present
        texts = [p["phrase"] for p in phrases]
        assert "I need help." in texts
        assert "I need water." in texts
        assert "Thank you." in texts

        # 3. Create custom quick phrase
        new_p = await ac.post("/api/phrases", json={"phrase": "Call my nurse, please.", "category": "Urgent"})
        assert new_p.status_code == 201
        created_id = new_p.json()["phrase_id"]

        # 4. Delete custom quick phrase
        del_p = await ac.delete(f"/api/phrases/{created_id}")
        assert del_p.status_code == 204

        # 5. Preferences get & patch
        pref_res = await ac.get("/api/preferences")
        assert pref_res.status_code == 200
        patch_res = await ac.patch("/api/preferences", json={"speech_speed": 1.2, "high_contrast": True})
        assert patch_res.status_code == 200
        assert patch_res.json()["speech_speed"] == 1.2
        assert patch_res.json()["high_contrast"] is True

        # 6. Evaluation metrics endpoint
        eval_metrics = await ac.get("/api/v1/evaluations/metrics")
        assert eval_metrics.status_code == 200
        assert eval_metrics.json()["latency_ms"]["meets_target"] is True
