import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi import HTTPException

from backend.app.services.llm.openai_service import OpenAIService

@pytest.mark.asyncio
async def test_openai_service_unit_response_success():
    """Test OpenAI response generation with mocked chat completions API."""
    service = OpenAIService(api_key="mock_openai_key_789")

    mock_llm_content = (
        '{\n'
        '  "suggested_response": "I would like some water, please.",\n'
        '  "alternative_suggestions": ["Can I have a glass of water?", "Water, please."],\n'
        '  "intent_classification": "request_need",\n'
        '  "confidence": 0.96,\n'
        '  "explanation": "User expressed a physical need for hydration.",\n'
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
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
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
        assert res["confidence"] == 0.96
        assert len(res["candidates"]) == 3
        assert res["candidates"][0]["text"] == "I would like some water, please."

@pytest.mark.asyncio
async def test_openai_service_suggestions_unit():
    """Test generate_suggestions for user shorthand draft."""
    service = OpenAIService(api_key="mock_key")
    mock_llm_content = (
        '{\n'
        '  "suggested_response": "Could you please pass the water?",\n'
        '  "alternative_suggestions": ["I need water.", "Glass of water, please."],\n'
        '  "intent_classification": "request_need",\n'
        '  "confidence": 0.94,\n'
        '  "explanation": "Clarification of telegraphic expression.",\n'
        '  "needs_clarification": false\n'
        '}'
    )
    mock_resp = httpx.Response(
        status_code=200,
        json={"choices": [{"message": {"content": mock_llm_content}}]},
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    )
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        sug = await service.generate_suggestions("I water")
        assert sug["original_text"] == "I water"
        assert sug["suggested_response"] == "Could you please pass the water?"
        assert len(sug["alternative_suggestions"]) == 2

@pytest.mark.asyncio
async def test_openai_service_multilingual_hindi():
    """Test multilingual support with Hindi preference."""
    service = OpenAIService(api_key=None)  # Tests local assistive intent engine
    res = await service.generate_response(
        user_message="pani",
        preferred_language="hi"
    )
    assert res["intent_classification"] == "request_need"
    assert "पानी" in res["suggested_response"]

@pytest.mark.asyncio
async def test_openai_service_invalid_credentials_401():
    """Test handling of 401 Unauthorized from OpenAI."""
    service = OpenAIService(api_key="invalid_sk_live_key")
    mock_resp = httpx.Response(
        status_code=401,
        text='{"error":{"message":"Incorrect API key provided"}}',
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    )
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_response("Hello")
        assert exc_info.value.status_code == 401
        assert "authentication failed" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_openai_service_rate_limit_429():
    """Test handling of 429 Too Many Requests from OpenAI."""
    service = OpenAIService(api_key="active_key")
    mock_resp = httpx.Response(
        status_code=429,
        text='{"error":{"message":"Rate limit reached"}}',
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions")
    )
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_response("Hello")
        assert exc_info.value.status_code == 429
        assert "rate limit" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_openai_service_timeout():
    """Test handling of timeout from OpenAI."""
    service = OpenAIService(api_key="active_key", timeout_seconds=1.0)
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("OpenAI timeout")
        with pytest.raises(HTTPException) as exc_info:
            await service.generate_response("Hello")
        assert exc_info.value.status_code == 504

