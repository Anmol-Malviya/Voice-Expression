from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Response, Depends
from typing import Optional, List
from datetime import datetime
import uuid

from backend.app.schemas.speech import (
    TTSRequest, 
    STTResponse, 
    VoiceOptionResponse, 
    VoiceConsentRequest, 
    VoiceConsentResponse
)
from backend.app.services.tts.elevenlabs_tts import get_tts_service
from backend.app.services.stt.elevenlabs_stt import get_stt_service
from backend.app.services.consent_service import consent_service
from backend.app.core.security import get_current_user_optional

router = APIRouter(tags=["Speech (STT / TTS / Consent)"])

APPROVED_VOICES = [
    VoiceOptionResponse(voice_id="21m00Tcm4TlvDq8ikWAM", name="Rachel (Warm, Assistive)", category="standard", language="en", gender="female"),
    VoiceOptionResponse(voice_id="AZnzlk1XvdvUeBnXmlld", name="Domi (Expressive, Clear)", category="standard", language="en", gender="female"),
    VoiceOptionResponse(voice_id="EXAVITQu4vr4xnSDxMaL", name="Bella (Gentle)", category="standard", language="en", gender="female"),
    VoiceOptionResponse(voice_id="ErXwobaYiN019PkySvjV", name="Antoni (Calm, Measured)", category="standard", language="en", gender="male"),
    VoiceOptionResponse(voice_id="VR6AewLTigWG4xSOukaG", name="Arnold (Deep, Reassuring)", category="standard", language="en", gender="male"),
    VoiceOptionResponse(voice_id="cloned_personal_v1", name="Personalized Voice Profile", category="cloned", language="en", gender="custom"),
]

@router.post("/speech/tts")
@router.post("/speech")
async def generate_speech(req: TTSRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "anonymous"

    # Enforce Voice Cloning Consent (SRC-07 / FR-013)
    if req.voice_mode == "cloned":
        is_permitted = await consent_service.is_voice_permitted(user_id, req.voice_id or "cloned_personal_v1")
        if not is_permitted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Active voice cloning consent required. Consent is either missing or revoked."
            )

    tts_service = get_tts_service()
    try:
        audio_bytes, mime_type = await tts_service.synthesize(
            text=req.text,
            voice_id=req.voice_id,
            speed=req.speed
        )
        return Response(content=audio_bytes, media_type=mime_type)
    except Exception as e:
        # Fallback to local audio
        from backend.app.services.tts.local_tts import LocalFallbackTTSService
        fallback = LocalFallbackTTSService()
        audio_bytes, mime_type = await fallback.synthesize(req.text)
        return Response(content=audio_bytes, media_type=mime_type)

@router.post("/speech/stt", response_model=STTResponse)
async def speech_to_text(audio_file: Optional[UploadFile] = File(None), language: str = Form("en")):
    stt_service = get_stt_service()
    content = b""
    if audio_file:
        content = await audio_file.read()
    
    result = await stt_service.transcribe_audio(content, language=language)
    return STTResponse(
        transcript_id=result["transcript_id"],
        text=result["text"],
        language=result["language"],
        confidence=result.get("confidence", 0.95),
        status=result["status"]
    )

@router.post("/transcriptions", response_model=STTResponse)
async def batch_transcriptions(
    session_id: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    language_hint: Optional[str] = Form("en")
):
    return await speech_to_text(audio_file, language_hint or "en")

@router.get("/voices", response_model=List[VoiceOptionResponse])
async def list_voices():
    return APPROVED_VOICES

@router.post("/voice-consents", response_model=VoiceConsentResponse, status_code=status.HTTP_201_CREATED)
async def create_voice_consent(req: VoiceConsentRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "anonymous"
    record = await consent_service.grant_consent(user_id, req.voice_id, req.purpose, req.scope)
    return VoiceConsentResponse(
        consent_id=record["_id"],
        status=record["status"],
        granted_at=record["granted_at"]
    )

@router.delete("/voice-consents/{consent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_voice_consent(consent_id: str, current_user: Optional[dict] = Depends(get_current_user_optional)):
    user_id = current_user.get("sub") if current_user else "anonymous"
    await consent_service.revoke_consent(user_id, consent_id)
    return None

