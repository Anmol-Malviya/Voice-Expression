import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi import HTTPException
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.services.tts.elevenlabs_tts import ElevenLabsTTSService
from backend.app.core.config import settings

@pytest.mark.asyncio
async def test_elevenlabs_tts_unit_synthesize_success():
    """Test ElevenLabs TTS service with mocked successful HTTP response."""
    service = ElevenLabsTTSService(api_key="mock_xi_api_key_123")
    fake_mp3 = b"\xff\xfb\x90\x44" + b"\x00" * 100

    mock_resp = httpx.Response(
        status_code=200,
        content=fake_mp3,
        headers={"content-type": "audio/mpeg"},
        request=httpx.Request("POST", "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        audio_bytes, mime, meta = await service.synthesize(
            text="Please give me some water.",
            voice_id="21m00Tcm4TlvDq8ikWAM",
            speed=1.2,
            model_id="eleven_multilingual_v2",
            language="en"
        )
        assert audio_bytes == fake_mp3
        assert mime == "audio/mpeg"
        assert meta["voice_id"] == "21m00Tcm4TlvDq8ikWAM"
        assert meta["speed"] == 1.2
        assert meta["provider"] == "elevenlabs"
        assert meta["character_count"] == len("Please give me some water.")

@pytest.mark.asyncio
async def test_elevenlabs_tts_invalid_credentials_401():
    """Test handling of 401 Unauthorized from ElevenLabs."""
    service = ElevenLabsTTSService(api_key="invalid_bad_key")
    mock_resp = httpx.Response(
        status_code=401,
        text='{"detail":{"status":"invalid_api_key","message":"Invalid API key"}}',
        request=httpx.Request("POST", "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.synthesize("Test invalid key")
        assert exc_info.value.status_code == 401
        assert "authentication failed" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_elevenlabs_tts_rate_limit_429():
    """Test handling of 429 Too Many Requests from ElevenLabs."""
    service = ElevenLabsTTSService(api_key="active_key")
    mock_resp = httpx.Response(
        status_code=429,
        text='{"detail":"quota exceeded"}',
        request=httpx.Request("POST", "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.synthesize("Rate limit test")
        assert exc_info.value.status_code == 429
        assert "rate limit" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_elevenlabs_tts_timeout_handling():
    """Test handling of HTTP client timeouts."""
    service = ElevenLabsTTSService(api_key="active_key", timeout_seconds=2.0)

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Connection timed out")
        with pytest.raises(HTTPException) as exc_info:
            await service.synthesize("Timeout test text")
        assert exc_info.value.status_code == 504
        assert "timed out" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_elevenlabs_tts_empty_text_validation():
    """Test validation rejection on empty or whitespace text."""
    service = ElevenLabsTTSService(api_key="any_key")
    with pytest.raises(HTTPException) as exc_info:
        await service.synthesize("   ")
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_speech_synthesize_api_endpoint():
    """Test POST /api/v1/speech/synthesize HTTP endpoint with metadata headers."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "text": "Hello, this is a test synthesis.",
            "voice_id": "21m00Tcm4TlvDq8ikWAM",
            "speech_speed": 1.1,
            "language": "en"
        }
        res = await ac.post("/api/v1/speech/synthesize", json=payload)
        assert res.status_code == 200
        assert len(res.content) > 0
        assert "X-Voice-Id" in res.headers
        assert "X-Speech-Speed" in res.headers
        assert res.headers["X-Speech-Speed"] == "1.1"

@pytest.mark.asyncio
async def test_speech_synthesize_cloned_voice_consent_guard():
    """Test voice cloning consent guard blocks synthesis if consent revoked/missing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "text": "Cloned voice test without consent",
            "voice_id": "unconsented_clone_voice_xyz",
            "voice_mode": "cloned"
        }
        res = await ac.post("/api/v1/speech/synthesize", json=payload)
        assert res.status_code == 403
        assert "consent" in res.json()["detail"].lower()

