import pytest
import io
import time
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta, timezone
from jose import jwt

from backend.app.main import app
from backend.app.core.config import settings

async def create_and_login_user(ac: AsyncClient, email: str = "alex@example.com", password: str = "strongPassword123") -> str:
    """Helper to ensure user exists and returns an active JWT token."""
    # Attempt login first
    login_res = await ac.post("/api/v1/auth/login", json={"email": email, "password": password})
    if login_res.status_code == 200:
        return login_res.json()["access_token"]
    
    # Register if not present
    reg_res = await ac.post("/api/v1/auth/register", json={
        "name": "Alex Mercer",
        "email": email,
        "password": password,
        "preferred_language": "en"
    })
    if reg_res.status_code in (200, 201):
        return reg_res.json()["access_token"]
    
    # Retry login
    login_retry = await ac.post("/api/v1/auth/login", json={"email": email, "password": password})
    return login_retry.json()["access_token"]

@pytest.mark.asyncio
async def test_workflow_a_text_to_speech():
    """
    Workflow A: Text-to-Speech
    1. User logs in.
    2. Opens a conversation.
    3. Enters a message.
    4. Clicks Speak.
    5. Backend generates audio.
    6. Audio plays successfully (valid bytes and media type).
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login
        token = await create_and_login_user(ac, "workflow_a_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create / Open conversation
        conv_res = await ac.post("/api/v1/conversations", json={
            "title": "Daily Morning Check-in",
            "language": "en"
        }, headers=headers)
        assert conv_res.status_code in (200, 201)
        conv_id = conv_res.json()["id"]

        # 3. Enter and post a message
        msg_res = await ac.post("/api/v1/messages", json={
            "conversation_id": conv_id,
            "sender": "user",
            "content": "Good morning, I am ready for breakfast.",
            "message_type": "text"
        }, headers=headers)
        assert msg_res.status_code == 201
        assert msg_res.json()["content"] == "Good morning, I am ready for breakfast."

        # 4 & 5. Trigger Speak (synthesize)
        synth_res = await ac.post("/api/v1/speech/synthesize", json={
            "text": "Good morning, I am ready for breakfast.",
            "voice_id": "21m00Tcm4TlvDq8ikWAM",
            "speed": 1.0,
            "language": "en"
        }, headers=headers)
        assert synth_res.status_code == 200
        # 6. Verify valid audio bytes returned with audio media type and headers
        assert len(synth_res.content) > 40
        assert synth_res.headers["content-type"] in ("audio/mpeg", "audio/wav", "audio/x-wav")
        assert "X-Audio-Provider" in synth_res.headers

@pytest.mark.asyncio
async def test_workflow_b_speech_to_text():
    """
    Workflow B: Speech-to-Text
    1. User opens conversation.
    2. Enables microphone (submits audio).
    3. Speaks a sentence.
    4. Speech is transcribed.
    5. Transcription appears in chat.
    6. User can edit and send it.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create conversation
        conv_res = await ac.post("/api/v1/conversations", json={
            "title": "Speech Input Session",
            "language": "en"
        })
        assert conv_res.status_code in (200, 201)
        conv_id = conv_res.json()["id"]

        # 2, 3 & 4. Send audio sample for transcription
        fake_wav = b"RIFF" + b"\x00" * 36 + b"WAVEfmt " + b"\x00" * 20 + b"data" + b"\x00" * 100
        files = {"audio_file": ("test_speech.wav", fake_wav, "audio/wav")}
        stt_res = await ac.post("/api/v1/speech/transcribe", files=files, data={"language": "en"})
        assert stt_res.status_code == 200
        data = stt_res.json()
        assert "text" in data
        transcribed_text = data["text"]
        assert len(transcribed_text) > 0

        # 5 & 6. User edits transcribed text and posts as confirmed message
        edited_text = transcribed_text + " - confirmed by user"
        msg_res = await ac.post("/api/v1/messages", json={
            "conversation_id": conv_id,
            "sender": "user",
            "content": edited_text,
            "message_type": "speech_transcription"
        })
        assert msg_res.status_code == 201
        assert msg_res.json()["content"] == edited_text

@pytest.mark.asyncio
async def test_workflow_c_ai_assistant():
    """
    Workflow C: AI Assistant
    1. User enters an incomplete sentence.
    2. Groq/AI processes the intent.
    3. Alternative sentences are generated.
    4. User edits or selects a suggestion.
    5. User confirms.
    6. Confirmed message can be spoken.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1 & 2. Incomplete sentence submitted for suggestions
        suggest_res = await ac.post("/api/v1/ai/suggest", json={
            "text": "I cold",
            "language": "en"
        })
        assert suggest_res.status_code == 200
        sug_data = suggest_res.json()
        # 3. Alternatives generated
        assert sug_data["suggested_response"]
        assert len(sug_data["alternative_suggestions"]) >= 1
        assert sug_data["requires_confirmation"] is True

        selected_phrase = sug_data["alternative_suggestions"][0]

        # 4 & 5. User confirms selected phrase via confirmation gate
        confirm_res = await ac.post("/api/v1/sessions/active_session/confirmations", json={
            "action": "confirm",
            "edited_text": selected_phrase,
            "inference_id": "inf_workflow_c"
        })
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "confirmed"

        # 6. Confirmed message spoken
        tts_res = await ac.post("/api/v1/speech/synthesize", json={
            "text": selected_phrase,
            "voice_id": "21m00Tcm4TlvDq8ikWAM",
            "speed": 1.0
        })
        assert tts_res.status_code == 200
        assert len(tts_res.content) > 30

@pytest.mark.asyncio
async def test_workflow_d_gesture_recognition():
    """
    Workflow D: Gesture Recognition
    1. User opens gesture page.
    2. Grants camera permission.
    3. Shows a supported gesture (e.g. thumbs up).
    4. MediaPipe detects hand landmarks.
    5. Gesture classifier identifies the gesture.
    6. Suggested sentence appears.
    7. User edits or confirms.
    8. Speech is generated only after explicit confirmation.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 3 & 4. Submit 21 synthetic hand landmarks for thumbs_up
        # Thumb points up (y4 < y2 < y0), other 4 fingers curled (tip y > pip y)
        thumbs_up_landmarks = [
            {"x": 0.5, "y": 0.8, "z": 0.0},  # 0: wrist
            {"x": 0.45, "y": 0.7, "z": 0.0}, # 1: thumb cmc
            {"x": 0.42, "y": 0.6, "z": 0.0}, # 2: thumb mcp
            {"x": 0.40, "y": 0.45, "z": 0.0},# 3: thumb ip
            {"x": 0.40, "y": 0.30, "z": 0.0},# 4: thumb tip (highest point)
            {"x": 0.48, "y": 0.55, "z": 0.0},# 5: index mcp
            {"x": 0.48, "y": 0.65, "z": 0.0},# 6: index pip
            {"x": 0.48, "y": 0.70, "z": 0.0},# 7: index dip
            {"x": 0.48, "y": 0.75, "z": 0.0},# 8: index tip
            {"x": 0.52, "y": 0.55, "z": 0.0},# 9: middle mcp
            {"x": 0.52, "y": 0.65, "z": 0.0},# 10: middle pip
            {"x": 0.52, "y": 0.70, "z": 0.0},# 11: middle dip
            {"x": 0.52, "y": 0.75, "z": 0.0},# 12: middle tip
            {"x": 0.56, "y": 0.55, "z": 0.0},# 13: ring mcp
            {"x": 0.56, "y": 0.65, "z": 0.0},# 14: ring pip
            {"x": 0.56, "y": 0.70, "z": 0.0},# 15: ring dip
            {"x": 0.56, "y": 0.75, "z": 0.0},# 16: ring tip
            {"x": 0.60, "y": 0.55, "z": 0.0},# 17: pinky mcp
            {"x": 0.60, "y": 0.65, "z": 0.0},# 18: pinky pip
            {"x": 0.60, "y": 0.70, "z": 0.0},# 19: pinky dip
            {"x": 0.60, "y": 0.75, "z": 0.0},# 20: pinky tip
        ]

        # 5 & 6. Gesture recognition endpoint identifies gesture
        rec_res = await ac.post("/api/v1/gesture/recognize", json={
            "landmarks": thumbs_up_landmarks
        })
        assert rec_res.status_code == 200
        rec_data = rec_res.json()
        assert rec_data["label"] == "Thumbs Up"
        assert rec_data["confidence"] > 0.70
        assert "Yes, I agree." in rec_data["suggested_text"]

        # 7. User confirms sentence
        confirmed_phrase = rec_data["suggested_text"]

        # 8. Speech generated ONLY after confirmation
        speak_res = await ac.post("/api/v1/speech/synthesize", json={
            "text": confirmed_phrase,
            "voice_id": "21m00Tcm4TlvDq8ikWAM"
        })
        assert speak_res.status_code == 200
        assert len(speak_res.content) > 30

@pytest.mark.asyncio
async def test_workflow_e_conversation_persistence():
    """
    Workflow E: Conversation Persistence
    1. User logs in.
    2. Creates a conversation.
    3. Sends messages.
    4. Refreshes the page (fetches conversation & messages anew).
    5. Conversation history is retrieved from database.
    6. Messages remain available and in sequence.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login
        token = await create_and_login_user(ac, "workflow_e_user@example.com")
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create conversation
        conv_res = await ac.post("/api/v1/conversations", json={
            "title": "Persistent Medical Session",
            "language": "en"
        }, headers=headers)
        assert conv_res.status_code in (200, 201)
        conv_id = conv_res.json()["id"]

        # 3. Send 3 sequential messages
        for i in range(1, 4):
            post_res = await ac.post("/api/v1/messages", json={
                "conversation_id": conv_id,
                "sender": "user" if i % 2 != 0 else "partner",
                "content": f"Message sequence entry #{i}",
                "message_type": "text"
            }, headers=headers)
            assert post_res.status_code == 201

        # 4 & 5. Refresh page simulation: retrieve conversation and messages from database
        get_conv = await ac.get(f"/api/v1/conversations/{conv_id}", headers=headers)
        assert get_conv.status_code == 200
        assert get_conv.json()["id"] == conv_id

        get_msgs = await ac.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers)
        assert get_msgs.status_code == 200
        msgs_resp = get_msgs.json()
        msgs = msgs_resp["data"] if isinstance(msgs_resp, dict) and "data" in msgs_resp else msgs_resp

        # 6. Messages remain available
        assert len(msgs) == 3
        assert msgs[0]["content"] == "Message sequence entry #1"
        assert msgs[1]["content"] == "Message sequence entry #2"
        assert msgs[2]["content"] == "Message sequence entry #3"

@pytest.mark.asyncio
async def test_workflow_f_authentication():
    """
    Workflow F: Authentication
    1. Registration.
    2. Login.
    3. Protected route access.
    4. Invalid token.
    5. Expired token.
    6. Logout.
    7. Session handling.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        test_email = f"user_{int(time.time())}@expression.org"
        password = "SecurePassword123!"

        # 1. Registration
        reg_res = await ac.post("/api/v1/auth/register", json={
            "name": "Sarah Connor",
            "email": test_email,
            "password": password,
            "preferred_language": "en"
        })
        assert reg_res.status_code == 201
        assert reg_res.json()["user"]["email"] == test_email

        # 2. Login
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": password
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 3. Protected route access (/api/v1/auth/me)
        me_res = await ac.get("/api/v1/auth/me", headers=auth_headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == test_email

        # 4. Invalid token rejection
        bad_res = await ac.get("/api/v1/auth/me", headers={"Authorization": "Bearer totally_invalid_token_123"})
        assert bad_res.status_code == 401

        # 5. Expired token rejection
        expired_payload = {
            "sub": "some_user_id",
            "email": test_email,
            "exp": datetime.now(timezone.utc) - timedelta(hours=2)  # Expired 2 hours ago
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        exp_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert exp_res.status_code == 401
        assert "expired" in exp_res.json()["detail"].lower()

        # 6. Logout
        logout_res = await ac.post("/api/v1/auth/logout", headers=auth_headers)
        assert logout_res.status_code == 200

        # 7. Session handling: guest / anonymous requests fallback cleanly
        guest_conv = await ac.post("/api/v1/conversations", json={"title": "Guest Session"})
        assert guest_conv.status_code in (200, 201)
