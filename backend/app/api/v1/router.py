from fastapi import APIRouter
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.users import router as users_router
from backend.app.api.v1.conversations import router as conversations_router
from backend.app.api.v1.messages import router as messages_router
from backend.app.api.v1.preferences import router as preferences_router
from backend.app.api.v1.phrases import router as phrases_router
from backend.app.api.v1.speech import router as speech_router
from backend.app.api.v1.inference import router as inference_router
from backend.app.api.v1.gesture import router as gesture_router
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.feedback import router as feedback_router
from backend.app.api.v1.evaluations import router as evaluations_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(conversations_router)
api_router.include_router(messages_router)
api_router.include_router(preferences_router)
api_router.include_router(phrases_router)
api_router.include_router(speech_router)
api_router.include_router(inference_router)
api_router.include_router(gesture_router)
api_router.include_router(health_router)
api_router.include_router(feedback_router)
api_router.include_router(evaluations_router)

