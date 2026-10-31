import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    
    # JWT Authentication
    JWT_SECRET: str = "super_secret_jwt_key_for_ai_manthan_ps16_assistive_app"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # MongoDB Atlas
    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "ai_manthan"

    # AI Providers
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_DEFAULT_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
