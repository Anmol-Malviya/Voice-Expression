import pytest
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.services.ai.conversation_engine import conversation_engine
from backend.app.services.message_service import message_service
from backend.app.services.conversation_service import conversation_service

@pytest.mark.asyncio
async def test_ai_respond_api_endpoint():
    """Test POST /api/v1/ai/respond endpoint generates proposals with intent and alternatives."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "conversation_id": "sess_test_autonomy",
            "user_message": "I water",
            "preferred_language": "en"
        }
        res = await ac.post("/api/v1/ai/respond", json=payload)
        assert res.status_code == 200
        data = res.json()

        # User Autonomy Guard Verifications
        assert data["is_proposal"] is True
        assert data["requires_confirmation"] is True
        assert "suggested_response" in data
        assert len(data["suggested_response"]) > 0
        assert "alternative_suggestions" in data
        assert isinstance(data["alternative_suggestions"], list)
        assert data["intent_classification"] == "request_need"
        assert len(data["candidates"]) >= 2
        assert data["confidence"] > 0.5

@pytest.mark.asyncio
async def test_ai_suggest_api_endpoint():
    """Test POST /api/v1/ai/suggest endpoint expands user shorthand."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "text": "I water",
            "language": "en"
        }
        res = await ac.post("/api/v1/ai/suggest", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["original_text"] == "I water"
        assert "water" in data["suggested_response"].lower()
        assert len(data["alternative_suggestions"]) >= 1
        assert data["is_proposal"] is True
        assert data["requires_confirmation"] is True
        assert data["intent"] == "request_need"

@pytest.mark.asyncio
async def test_ai_conversation_context_bounded_memory():
    """Test bounded conversation memory loaded from MongoDB messages."""
    user_id = "test_user_ctx_123"
    conv = await conversation_service.create_conversation(user_id=user_id, title="Test Memory Context")
    conv_id = conv["id"]

    # Insert 15 messages (more than default context window of 10)
    for i in range(15):
        sender = "partner" if i % 2 == 0 else "user"
        await message_service.create_message(
            user_id=user_id,
            conversation_id=conv_id,
            sender=sender,
            message_type="text",
            text=f"Message index {i}"
        )

    # Retrieve bounded context
    context = await conversation_engine.get_bounded_context(conv_id, user_id=user_id, limit=10)
    assert len(context) == 10
    # The last message should be index 14
    assert context[-1]["content"] == "Message index 14"
    # Verify sensitive metadata was stripped
    assert "metadata" not in context[-1]
    assert "user_id" not in context[-1]

@pytest.mark.asyncio
async def test_user_confirmation_workflow():
    """Test user confirmation workflow: confirm, edit, and reject."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        session_id = "sess_conf_test"

        # 1. Action: Confirm
        conf_res = await ac.post(f"/api/v1/sessions/{session_id}/confirmations", json={
            "action": "confirm",
            "edited_text": "I would like a glass of water, please."
        })
        assert conf_res.status_code == 200
        assert conf_res.json()["status"] == "confirmed"
        assert conf_res.json()["confirmed_text"] == "I would like a glass of water, please."

        # 2. Action: Edit
        edit_res = await ac.post(f"/api/v1/sessions/{session_id}/confirmations", json={
            "action": "edit",
            "edited_text": "I would like warm tea, please."
        })
        assert edit_res.status_code == 200
        assert edit_res.json()["status"] == "confirmed"
        assert edit_res.json()["confirmed_text"] == "I would like warm tea, please."

        # 3. Action: Reject
        rej_res = await ac.post(f"/api/v1/sessions/{session_id}/confirmations", json={
            "action": "reject"
        })
        assert rej_res.status_code == 200
        assert rej_res.json()["status"] == "rejected"
        assert rej_res.json()["confirmed_text"] is None

