from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.database import db_manager

# Import API Routers
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.sessions import router as sessions_router
from backend.app.api.v1.messages import router as messages_router
from backend.app.api.v1.speech import router as speech_router
from backend.app.api.v1.inference import router as inference_router
from backend.app.api.v1.gesture import router as gesture_router
from backend.app.api.v1.preferences import router as preferences_router
from backend.app.api.v1.quick_phrases import router as quick_phrases_router
from backend.app.api.v1.evaluations import router as evaluations_router
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.feedback import router as feedback_router
from backend.app.websockets.routes import ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("voice_expression")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VoiceExpression Backend...")
    await db_manager.connect()
    yield
    logger.info("Shutting down VoiceExpression Backend...")

app = FastAPI(
    title="VoiceExpression - Multimodal Live Assistive API",
    description="Accessible AI-powered live conversation assistant for people with speech impairments (AI Manthan 2.0 PS16)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes under /api/v1
for r in [
    auth_router, 
    sessions_router, 
    messages_router, 
    speech_router, 
    inference_router, 
    gesture_router, 
    preferences_router, 
    quick_phrases_router, 
    evaluations_router, 
    health_router,
    feedback_router
]:
    app.include_router(r, prefix="/api/v1")
    # Also mount under /api for full endpoint contract coverage
    app.include_router(r, prefix="/api")

# Mount WebSocket Router
app.include_router(ws_router)

@app.get("/")
@app.get("/health")
@app.get("/ready")
async def root():
    return {
        "status": "ok",
        "message": "VoiceExpression Live Assistive API is running",
        "documentation": "/docs",
        "health": "/api/health",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)

