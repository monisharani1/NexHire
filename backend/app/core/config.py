from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME:    str = "NexHire"
    APP_VERSION: str = "1.0.0"
    DEBUG:       bool = True

    # Database (defaults to SQLite for easy local dev)
    DATABASE_URL: str = "sqlite:///./nexhire.db"

    # JWT
    SECRET_KEY:                    str = "nexhire-dev-secret-change-in-production"
    ALGORITHM:                     str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES:   int = 60
    REFRESH_TOKEN_EXPIRE_DAYS:     int = 7

    # Firebase — optional; leave blank to skip Firebase auth
    FIREBASE_KEY_PATH:    str = ""
    FIREBASE_WEB_API_KEY: Optional[str] = None

    # Groq AI — primary AI provider (Llama 3)
    GROQ_API_KEY: Optional[str] = None

    # OpenRouter — fallback AI provider
    OPENROUTER_API_KEY: Optional[str] = None

    # Redis — optional; system falls back to in-memory if blank
    REDIS_URL: Optional[str] = None

    # Cloudinary Config
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # ElevenLabs Config
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: Optional[str] = "21m00Tcm4TlvDq8ikWAM"

    # OpenAI Config (Whisper fallback)
    OPENAI_API_KEY: Optional[str] = None

    # GitHub OAuth — optional
    GITHUB_CLIENT_ID:     Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_REDIRECT_URI:  str = "http://localhost:8000/auth/github/callback"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Triggering reload to pick up new GROQ_API_KEY
