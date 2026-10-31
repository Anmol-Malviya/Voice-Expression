import pytest
from unittest.mock import patch, AsyncMock
import httpx
from fastapi import HTTPException
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.services.stt.elevenlabs_stt import ElevenLabsSTTService

@pytest.mark.asyncio
async def test_elevenlabs_stt_unit_transcribe_success():
    """Test ElevenLabs STT service with mocked successful HTTP response."""
    service = ElevenLabsSTTService(api_key="mock_xi_api_key_456")
    sample_audio = b"\xff\xfb\x90\x44" + b"\x00" * 50

    mock_resp = httpx.Response(
        status_code=200,
        json={
            "text": "I need some water please.",
            "language_code": "en",
            "confidence": 0.97
        },
        request=httpx.Request("POST", "https://api.elevenlabs.io/v1/speech-to-text")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        res = await service.transcribe_audio(
            sample_audio,
            language="en",
            filename="voice_memo.mp3",
            content_type="audio/mpeg"
        )
        assert res["status"] == "completed"
        assert res["text"] == "I need some water please."
        assert res["language"] == "en"
        assert res["confidence"] == 0.97
        assert "transcript_id" in res

@pytest.mark.asyncio
async def test_elevenlabs_stt_empty_audio_validation():
    """Test empty audio file validation raises 400."""
    service = ElevenLabsSTTService(api_key="mock_key")
    with pytest.raises(HTTPException) as exc_info:
        await service.transcribe_audio(b"")
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_elevenlabs_stt_unsupported_format_validation():
    """Test unsupported format/extension raises 400."""
    service = ElevenLabsSTTService(api_key="mock_key")
    with pytest.raises(HTTPException) as exc_info:
        await service.transcribe_audio(
            b"some test bytes",
            filename="notes.txt",
            content_type="text/plain"
        )
    assert exc_info.value.status_code == 400
    assert "unsupported" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_elevenlabs_stt_oversized_audio_validation():
    """Test oversized audio (>25MB) raises 413."""
    service = ElevenLabsSTTService(api_key="mock_key")
    large_audio = b"0" * (26 * 1024 * 1024)
    with pytest.raises(HTTPException) as exc_info:
        await service.transcribe_audio(large_audio, filename="big.mp3")
    assert exc_info.value.status_code == 413

@pytest.mark.asyncio
async def test_elevenlabs_stt_invalid_credentials_401():
    """Test 401 invalid credentials error handling."""
    service = ElevenLabsSTTService(api_key="invalid_bad_key")
    mock_resp = httpx.Response(
        status_code=401,
        text='{"detail":{"status":"invalid_api_key"}}',
        request=httpx.Request("POST", "https://api.elevenlabs.io/v1/speech-to-text")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.transcribe_audio(b"fake audio bytes 123", filename="test.mp3")
        assert exc_info.value.status_code == 401
        assert "authentication failed" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_elevenlabs_stt_rate_limit_429():
    """Test 429 rate limit error handling."""
    service = ElevenLabsSTTService(api_key="valid_key")
    mock_resp = httpx.Response(
        status_code=429,
        text='{"detail":"rate limit"}',
        request=httpx.Request("POST", "https://api.elevenlabs.io/v1/speech-to-text")
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp
        with pytest.raises(HTTPException) as exc_info:
            await service.transcribe_audio(b"fake audio bytes 123", filename="test.mp3")
        assert exc_info.value.status_code == 429

@pytest.mark.asyncio
async def test_elevenlabs_stt_timeout_handling():
    """Test timeout handling on STT requests."""
    service = ElevenLabsSTTService(api_key="valid_key", timeout_seconds=1.0)

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("STT request timed out")
        with pytest.raises(HTTPException) as exc_info:
            await service.transcribe_audio(b"audio bytes for timeout", filename="test.wav")
        assert exc_info.value.status_code == 504
        assert "timed out" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_speech_transcribe_api_endpoint_success():
    """Test POST /api/v1/speech/transcribe with multipart audio file upload."""
    transport = ASGITransport(app=app)
    mock_result = {
        "transcript_id": "tr_12345",
        "text": "Test audio transcribed successfully.",
        "transcribed_text": "Test audio transcribed successfully.",
        "language": "en",
        "detected_language": "en",
        "confidence": 0.98,
        "status": "completed",
        "processing_status": "completed",
        "provider": "elevenlabs"
    }
    with patch("backend.app.services.stt.elevenlabs_stt.ElevenLabsSTTService.transcribe_audio", new_callable=AsyncMock) as mock_stt:
        mock_stt.return_value = mock_result
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            fake_audio_bytes = b"RIFFsampleWAVEdata12345"
            files = {
                "audio_file": ("test_recording.wav", fake_audio_bytes, "audio/wav")
            }
            data = {"language_preference": "en"}
            res = await ac.post("/api/v1/speech/transcribe", files=files, data=data)
            assert res.status_code == 200
            body = res.json()
            assert "transcribed_text" in body
            assert "detected_language" in body
            assert body["processing_status"] == "completed"

@pytest.mark.asyncio
async def test_speech_transcribe_api_endpoint_empty_file_rejected():
    """Test POST /api/v1/speech/transcribe rejects empty file with 400."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {
            "audio_file": ("empty.wav", b"", "audio/wav")
        }
        res = await ac.post("/api/v1/speech/transcribe", files=files)
        assert res.status_code == 400

