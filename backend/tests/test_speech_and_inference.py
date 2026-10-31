import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_speech_and_multimodal_inference():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Test TTS Speech Synthesis
        tts_payload = {
            "text": "Hello, this is an assistive test voice.",
            "voice_mode": "standard"
        }
        tts_res = await ac.post("/api/speech/tts", json=tts_payload)
        assert tts_res.status_code == 200
        assert len(tts_res.content) > 0

        # 2. Test STT Speech Transcription
        stt_res = await ac.post("/api/speech/stt")
        assert stt_res.status_code == 200
        assert "transcript_id" in stt_res.json()

        # 3. Test AI Multimodal Inference (Speech + Gesture)
        inf_payload = {
            "session_id": "sess_test_123",
            "partner_text": "Do you want some water?",
            "gesture": "thumbs_up",
            "lip_active": True,
            "language": "en"
        }
        inf_res = await ac.post("/api/ai/respond", json=inf_payload)
        assert inf_res.status_code == 200
        inf_data = inf_res.json()
        assert len(inf_data["candidates"]) >= 1
        assert "signals_used" in inf_data

        # 4. Test Strict Confirmation Gate
        conf_payload = {
            "inference_id": inf_data["inference_id"],
            "candidate_id": inf_data["candidates"][0]["candidate_id"],
            "action": "confirm",
            "edited_text": "Yes, please get me some water."
        }
        conf_res = await ac.post("/api/v1/sessions/sess_test_123/confirmations", json=conf_payload)
        assert conf_res.status_code == 200
        assert conf_res.json()["status"] == "confirmed"

        # 5. Test Voice Consent & Revocation (FR-013)
        consent_payload = {
            "voice_id": "test_clone_voice_1",
            "purpose": "Speech test",
            "scope": "voice_cloning_and_generation"
        }
        consent_res = await ac.post("/api/voice-consents", json=consent_payload)
        assert consent_res.status_code == 201
        consent_id = consent_res.json()["consent_id"]

        # Revoke consent
        revoke_res = await ac.delete(f"/api/voice-consents/{consent_id}")
        assert revoke_res.status_code == 204

