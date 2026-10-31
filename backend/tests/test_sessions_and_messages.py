import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_session_lifecycle_and_messages():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create a session
        sess_payload = {
            "title": "Therapy Session",
            "language": "en",
            "mode": "live_conversation"
        }
        res = await ac.post("/api/conversations", json=sess_payload)
        assert res.status_code == 201
        session_id = res.json()["session_id"]
        assert session_id.startswith("sess_")

        # 2. List sessions
        list_res = await ac.get("/api/conversations")
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1

        # 3. Post a message
        msg_payload = {
            "conversation_id": session_id,
            "sender": "partner",
            "message_type": "transcript",
            "content": "Are you comfortable right now?"
        }
        msg_res = await ac.post("/api/messages", json=msg_payload)
        assert msg_res.status_code == 201
        assert msg_res.json()["content"] == "Are you comfortable right now?"

        # 4. Fetch messages
        fetch_res = await ac.get(f"/api/conversations/{session_id}/messages")
        assert fetch_res.status_code == 200
        assert len(fetch_res.json()) >= 1

        # 5. End session
        end_res = await ac.post(f"/api/conversations/{session_id}/end")
        assert end_res.status_code == 200
        assert end_res.json()["status"] == "ended"

