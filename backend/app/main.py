import sys
import os
from contextlib import asynccontextmanager
import logging

# Ensure repo root and backend directory are always on sys.path regardless of execution working directory
_app_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_app_dir)
_repo_root = os.path.dirname(_backend_dir)
for _p in [_repo_root, _backend_dir]:
    if _p and _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.core.config import settings
from backend.app.database.mongodb import db_manager
from backend.app.database.indexes import create_database_indexes
from backend.app.middleware.authentication import AuthenticationMiddleware
from backend.app.api.v1.router import api_router
from backend.app.websockets.routes import ws_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("voice_expression")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VoiceExpression Backend & MongoDB Database Engine...")
    await db_manager.connect()
    await create_database_indexes()
    yield
    await db_manager.close()
    logger.info("Shutting down VoiceExpression Backend...")

app = FastAPI(
    title="VoiceExpression - Multimodal Live Assistive API",
    description="Accessible AI-powered live conversation assistant for people with speech impairments (AI Manthan 2.0 PS16)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware (supports credentials, headers, and frontend ports 3000 & 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Token Inspector Middleware
app.add_middleware(AuthenticationMiddleware)

# Custom Exception Handlers for Envelope Consistency (Section 10)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "detail": exc.detail,
        },
        headers=headers,
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error in request body or parameters.",
            "detail": exc.errors(),
        },
    )

# Mount API Routers under /api/v1 and /api
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

# Mount WebSocket Router
app.include_router(ws_router)

@app.get("/")
@app.get("/health")
@app.get("/ready")
async def root():
    return {
        "success": True,
        "status": "ok",
        "message": "VoiceExpression Live Assistive API is running",
        "database": "MongoDB Atlas" if db_manager.is_atlas_connected else "Local Async Memory (ai_manthan)",
        "documentation": "/docs",
        "version": "1.0.0",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
