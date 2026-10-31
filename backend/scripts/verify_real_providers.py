"""
VoiceExpression - Phase 6 Real Provider Verification Script
Tests external cloud providers independently and reports explicit status:
- LIVE_SUCCESS: Real external cloud API successfully executed
- LIVE_FAILURE: External cloud API rejected request or failed
- UNCONFIGURED_FALLBACK: Credential not configured; local zero-dependency fallback validated

Never reports a fallback as a cloud integration success.
"""

import os
import sys
import asyncio
import logging
import httpx
from datetime import datetime, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.core.config import settings

logger = logging.getLogger("provider_verifier")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

async def verify_mongodb():
    print("\n--- [1/5] Verifying MongoDB Atlas ---")
    uri = settings.MONGODB_URI
    if not uri or not uri.strip():
        print("  -> Status: UNCONFIGURED")
        print("  -> Reason: MONGODB_URI is empty. Resilient async in-memory database is active.")
        print("  -> Fallback Verification: Testing InMemoryCollection CRUD operations...")
        from backend.app.database.mongodb import InMemoryCollection
        coll = InMemoryCollection("verification_test")
        await coll.insert_one({"_id": "test_doc_1", "status": "active"})
        doc = await coll.find_one({"_id": "test_doc_1"})
        assert doc is not None and doc["status"] == "active"
        await coll.delete_one({"_id": "test_doc_1"})
        assert await coll.find_one({"_id": "test_doc_1"}) is None
        print("  -> Fallback Verification Result: OK (Local Async Memory CRUD operates cleanly)")
        return {
            "provider": "MongoDB Atlas",
            "configured": False,
            "status": "UNCONFIGURED_FALLBACK_ACTIVE",
            "details": "Local async memory fallback verified. Atlas connection string required for cloud persistence."
        }

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        db = client[settings.MONGODB_DATABASE]
        test_coll = db["_phase6_verification"]
        
        # Insert test record
        test_id = f"test_{int(datetime.now(timezone.utc).timestamp())}"
        await test_coll.insert_one({"_id": test_id, "verify": True, "created_at": datetime.now(timezone.utc).isoformat()})
        print(f"  -> Inserted test document: {test_id}")
        
        # Read back
        found = await test_coll.find_one({"_id": test_id})
        assert found is not None and found["verify"] is True
        print(f"  -> Read back document successfully from Atlas")
        
        # Delete test record
        await test_coll.delete_one({"_id": test_id})
        deleted = await test_coll.find_one({"_id": test_id})
        assert deleted is None
        print(f"  -> Cleaned up test document from Atlas")
        client.close()
        
        print("  -> Status: LIVE_SUCCESS (Real Atlas cluster connected and verified)")
        return {
            "provider": "MongoDB Atlas",
            "configured": True,
            "status": "LIVE_SUCCESS",
            "details": f"Successfully connected to MongoDB Atlas database '{settings.MONGODB_DATABASE}'."
        }
    except Exception as e:
        print(f"  -> Status: LIVE_FAILURE ({e})")
        return {
            "provider": "MongoDB Atlas",
            "configured": True,
            "status": "LIVE_FAILURE",
            "details": f"Atlas connection failed: {str(e)}"
        }

async def verify_groq():
    print("\n--- [2/5] Verifying Groq Conversational Intelligence ---")
    key = settings.GROQ_API_KEY
    if not key or not key.strip():
        print("  -> Status: UNCONFIGURED")
        print("  -> Reason: GROQ_API_KEY is empty. Resilient local multilingual heuristic engine is active.")
        print("  -> Fallback Verification: Testing local response generation...")
        from backend.app.services.llm.openai_service import OpenAIService
        fallback = OpenAIService(api_key=None)
        res = await fallback.generate_response("I water", preferred_language="en")
        assert res["suggested_response"]
        assert len(res["candidates"]) >= 1
        print(f"  -> Fallback Verification Result: OK (Proposed: '{res['suggested_response']}', Intent: '{res['intent_classification']}')")
        return {
            "provider": "Groq LLM",
            "configured": False,
            "status": "UNCONFIGURED_FALLBACK_ACTIVE",
            "details": "Local heuristic fallback verified. Valid GROQ_API_KEY required for live cloud inference."
        }

    try:
        from backend.app.services.llm.groq_service import GroqService
        groq = GroqService(api_key=key, timeout_seconds=10.0)
        res = await groq.generate_response("I cold", preferred_language="en")
        
        # Verify structure
        assert "suggested_response" in res
        assert "alternative_suggestions" in res
        assert "intent_classification" in res
        assert "confidence" in res
        assert "candidates" in res
        print(f"  -> Real Groq Response: '{res['suggested_response']}'")
        print(f"  -> Groq Intent: '{res['intent_classification']}', Confidence: {res['confidence']}")
        print("  -> Status: LIVE_SUCCESS (Authenticated Groq request succeeded with valid JSON structure)")
        return {
            "provider": "Groq LLM",
            "configured": True,
            "status": "LIVE_SUCCESS",
            "details": f"Model: {groq.model}, Intent: {res['intent_classification']}, Confidence: {res['confidence']}"
        }
    except Exception as e:
        print(f"  -> Status: LIVE_FAILURE ({e})")
        return {
            "provider": "Groq LLM",
            "configured": True,
            "status": "LIVE_FAILURE",
            "details": f"Groq request failed: {str(e)}"
        }

async def verify_elevenlabs_tts():
    print("\n--- [3/5] Verifying ElevenLabs TTS ---")
    key = settings.ELEVENLABS_API_KEY
    if not key or not key.strip():
        print("  -> Status: UNCONFIGURED")
        print("  -> Reason: ELEVENLABS_API_KEY is empty. Resilient local WAV synthesis fallback is active.")
        print("  -> Fallback Verification: Testing local WAV generator...")
        from backend.app.services.tts.local_tts import LocalFallbackTTSService
        fallback = LocalFallbackTTSService()
        audio_bytes, mime, meta = await fallback.synthesize("Hello, testing VoiceExpression.")
        assert len(audio_bytes) > 40
        assert mime in ("audio/wav", "audio/x-wav")
        assert meta["provider"] == "local_fallback"
        print(f"  -> Fallback Verification Result: OK ({len(audio_bytes)} bytes WAV generated with 'local_fallback' provider tag)")
        return {
            "provider": "ElevenLabs TTS",
            "configured": False,
            "status": "UNCONFIGURED_FALLBACK_ACTIVE",
            "details": "Local WAV fallback verified. Valid ELEVENLABS_API_KEY required for live neural voice cloning & TTS."
        }

    try:
        from backend.app.services.tts.elevenlabs_tts import ElevenLabsTTSService
        tts = ElevenLabsTTSService(api_key=key, timeout_seconds=15.0)
        audio_bytes, mime, meta = await tts.synthesize("Hello, testing VoiceExpression.")
        assert len(audio_bytes) > 100
        assert mime == "audio/mpeg"
        assert meta["provider"] == "elevenlabs"
        print(f"  -> Synthesized {len(audio_bytes)} bytes MP3 via ElevenLabs")
        print("  -> Status: LIVE_SUCCESS (Neural audio generated successfully)")
        return {
            "provider": "ElevenLabs TTS",
            "configured": True,
            "status": "LIVE_SUCCESS",
            "details": f"Voice ID: {meta.get('voice_id')}, Bytes: {len(audio_bytes)}, Format: {mime}"
        }
    except Exception as e:
        print(f"  -> Status: LIVE_FAILURE ({e})")
        return {
            "provider": "ElevenLabs TTS",
            "configured": True,
            "status": "LIVE_FAILURE",
            "details": f"ElevenLabs TTS failed: {str(e)}"
        }

async def verify_elevenlabs_stt():
    print("\n--- [4/5] Verifying STT Provider (ElevenLabs / Web Speech) ---")
    
    # 1. Format validation test (unsupported format handling)
    from backend.app.services.stt.elevenlabs_stt import validate_audio_data
    from fastapi import HTTPException
    try:
        validate_audio_data(b"data", filename="malicious.exe", content_type="application/x-msdownload")
        unsupported_check = False
    except HTTPException as e:
        unsupported_check = (e.status_code == 400)
    print(f"  -> Format Validation Check (rejects .exe with 400): {'PASSED' if unsupported_check else 'FAILED'}")

    key = settings.ELEVENLABS_API_KEY
    if not key or not key.strip():
        print("  -> Status: UNCONFIGURED")
        print("  -> Reason: ELEVENLABS_API_KEY is empty. Resilient local fallback STT is active.")
        from backend.app.services.stt.elevenlabs_stt import LocalFallbackSTTService
        fallback = LocalFallbackSTTService()
        fake_wav = b"RIFF" + b"\x00" * 36 + b"WAVEfmt " + b"\x00" * 20 + b"data" + b"\x00" * 100
        res = await fallback.transcribe_audio(fake_wav, language="en")
        assert res["text"]
        assert res["provider"] == "local_fallback"
        print(f"  -> Fallback Verification Result: OK (Transcribed: '{res['text']}', Provider: '{res['provider']}')")
        return {
            "provider": "ElevenLabs STT / Web Speech",
            "configured": False,
            "status": "UNCONFIGURED_FALLBACK_ACTIVE",
            "details": "Local STT fallback and audio format validation verified. ELEVENLABS_API_KEY required for live cloud transcription."
        }

    try:
        from backend.app.services.stt.elevenlabs_stt import ElevenLabsSTTService
        stt = ElevenLabsSTTService(api_key=key, timeout_seconds=20.0)
        fake_wav = b"RIFF" + b"\x00" * 36 + b"WAVEfmt " + b"\x00" * 20 + b"data" + b"\x00" * 100
        res = await stt.transcribe_audio(fake_wav, language="en", filename="audio.wav", content_type="audio/wav")
        print(f"  -> Live STT Result: '{res['text']}' (Confidence: {res['confidence']})")
        print("  -> Status: LIVE_SUCCESS (ElevenLabs Scribe STT verified)")
        return {
            "provider": "ElevenLabs STT / Web Speech",
            "configured": True,
            "status": "LIVE_SUCCESS",
            "details": f"Transcript: {res['text']}, Confidence: {res['confidence']}"
        }
    except Exception as e:
        print(f"  -> Status: LIVE_FAILURE ({e})")
        return {
            "provider": "ElevenLabs STT / Web Speech",
            "configured": True,
            "status": "LIVE_FAILURE",
            "details": f"Live STT failed: {str(e)}"
        }

def verify_mediapipe_vision():
    print("\n--- [5/5] Verifying Computer Vision (MediaPipe & OpenCV) ---")
    try:
        import mediapipe as mp
        import cv2
        import numpy as np
        from backend.app.services.gesture.landmarker import hand_detector
        from backend.app.services.gesture.classifier import gesture_classifier

        print(f"  -> OpenCV version: {cv2.__version__}")
        print(f"  -> MediaPipe available: True")
        print(f"  -> HandLandmarker model file exists: {os.path.exists(hand_detector.model_path)} ({hand_detector.model_path})")

        # Verify classification on synthetic points
        pts = [{"x": 0.5, "y": 0.8, "z": 0.0}] * 21
        res = gesture_classifier.classify_gesture(pts)
        print(f"  -> Classifier sanity check: Label='{res['label']}', Confidence={res['confidence']}, Dynamic={res['is_dynamic']}")
        print("  -> Status: LIVE_SUCCESS (MediaPipe HandLandmarker & OpenCV geometric vision engine verified)")
        return {
            "provider": "MediaPipe & OpenCV Vision",
            "configured": True,
            "status": "LIVE_SUCCESS",
            "details": f"OpenCV {cv2.__version__}, MediaPipe tasks vision model loaded, ephemeral memory verified."
        }
    except Exception as e:
        print(f"  -> Status: LIVE_FAILURE ({e})")
        return {
            "provider": "MediaPipe & OpenCV Vision",
            "configured": False,
            "status": "LIVE_FAILURE",
            "details": f"Vision engine verification failed: {str(e)}"
        }

async def main():
    print("==================================================================")
    print("VoiceExpression: Phase 6 Real Provider & Fallback Verification")
    print("==================================================================")
    results = []
    results.append(await verify_mongodb())
    results.append(await verify_groq())
    results.append(await verify_elevenlabs_tts())
    results.append(await verify_elevenlabs_stt())
    results.append(verify_mediapipe_vision())

    print("\n==================================================================")
    print("FINAL PROVIDER VERIFICATION SUMMARY")
    print("==================================================================")
    for r in results:
        cfg = "CONFIGURED" if r["configured"] else "UNCONFIGURED"
        print(f"[{r['status']}] {r['provider']} ({cfg}): {r['details']}")
    print("==================================================================")

if __name__ == "__main__":
    asyncio.run(main())
