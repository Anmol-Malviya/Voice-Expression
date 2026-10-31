from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.core.database import db_manager

router = APIRouter(tags=["Health & Readiness"])

@router.get("/health")
@router.get("/ready")
async def health_check():
    return {
        "status": "ok",
        "app": "VoiceExpression",
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "database": "mongodb_atlas" if db_manager.is_atlas_connected else "local_async_memory",
        "providers": {
            "tts": "elevenlabs" if settings.ELEVENLABS_API_KEY else "browser_local_fallback",
            "stt": "elevenlabs_scribe" if settings.ELEVENLABS_API_KEY else "web_speech_fallback",
            "llm": "gemini" if settings.GEMINI_API_KEY else "context_heuristic_engine"
        }
    }

