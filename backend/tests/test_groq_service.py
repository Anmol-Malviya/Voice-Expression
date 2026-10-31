import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi import HTTPException

from backend.app.services.llm.groq_service import GroqService

@pytest.mark.asyncio
async def test_groq_service_unit_response_success():
    """Test Groq response generation with mocked chat completions API."""
    service = GroqService(api_key="gsk_mock_valid_groq_key_123")

    mock_llm_content = (
        '{\n'
        '  "suggested_response": "I would like some water, please.",\n'
        '  "alternative_suggestions": ["Can I please have water?", "Water, please."],\n'
        '  "intent_classification": "request_need",\n'
        '  "confidence": 0.95,\n'
        '  "explanation": "User expressed a direct hydration request.",\n'
        '  "needs_clarification": false\n'
        '}'
    )

    mock_resp = httpx.Response(
        status_code=200,
        json={
            "choices": [{
                "message": {"content": mock_llm_content}
            }]
        },
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        res = await service.generate_response(
            user_message="I water",
            conversation_context=[{"sender": "partner", "content": "How can I help you?"}],
            preferred_language="en"
        )

        assert res["suggested_response"] == "I would like some water, please."
        assert len(res["alternative_suggestions"]) == 2
        assert res["intent_classification"] == "request_need"
        assert res["confidence"] == 0.95
        assert len(res["candidates"]) == 3
        assert res["candidates"][0]["text"] == "I would like some water, please."
        assert "groq_llm" in res["signals_used"]

@pytest.mark.asyncio
async def test_groq_service_suggestions_unit():
    """Test generate_suggestions for shorthand telegraphic user input."""
    service = GroqService(api_key="gsk_mock_key")
    mock_llm_content = (
        '{\n'
        '  "suggested_response": "Could you please assist me with this?",\n'
        '  "alternative_suggestions": ["I need assistance, please.", "Please help me."],\n'
        '  "intent_classification": "request_assistance",\n'
        '  "confidence": 0.94,\n'
        '  "explanation": "Expands urgent shorthand into polite request.",\n'
        '  "needs_clarification": false\n'
        '}'
    )
    mock_resp = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"content": mock_llm_content}}]},
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    )
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        sug = await service.generate_suggestions("help me")
        assert sug["original_text"] == "help me"
        assert sug["suggested_response"] == "Could you please assist me with this?"
        assert len(sug["alternative_suggestions"]) == 2
        assert sug["intent"] == "request_assistance"

@pytest.mark.asyncio
async def test_groq_service_invalid_credentials_401():
    """Test handling of 401 Unauthorized from Groq."""
    service = GroqService(api_key="invalid_gsk_key")
    mock_resp = httpx.Response(
        status_code=401,
        text='{"error":{"message":"Invalid API Key"}}',
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    )
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_response("Hello")
        assert exc_info.value.status_code == 401
        assert "groq authentication failed" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_groq_service_rate_limit_429():
    """Test handling of 429 Rate Limit from Groq."""
    service = GroqService(api_key="gsk_rate_limited")
    mock_resp = httpx.Response(
        status_code=429,
        text='{"error":{"message":"Rate limit reached"}}',
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    )
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_response("Hello")
        assert exc_info.value.status_code == 429
        assert "rate limit exceeded" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_groq_service_timeout_handling():
    """Test timeout handling when Groq network latency spikes."""
    service = GroqService(api_key="gsk_slow_net", timeout_seconds=1.0)
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Read timed out")
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_response("Hello")
        assert exc_info.value.status_code == 504
        assert "timed out" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_groq_service_local_fallback_when_no_key():
    """Test resilient local fallback when GROQ_API_KEY is not configured."""
    service = GroqService(api_key="")
    res = await service.generate_response("water please")
    assert "suggested_response" in res
    assert res["intent_classification"] in ("request_need", "general")
    assert len(res["candidates"]) >= 1

@pytest.mark.asyncio
async def test_groq_reply_candidates_multimodal():
    """Test reply candidates fusion with gesture and conversation history."""
    service = GroqService(api_key="")  # local fallback test
    res = await service.generate_reply_candidates(
        partner_text="Do you want anything to drink?",
        gesture="thumbs_up",
        lip_active=True
    )
    assert res["inference_id"].startswith("inf_")
    assert "suggested_response" in res
    assert "hand_landmarks" in res["signals_used"]
    assert "transcript" in res["signals_used"]
    assert "lip_motion" in res["signals_used"]

