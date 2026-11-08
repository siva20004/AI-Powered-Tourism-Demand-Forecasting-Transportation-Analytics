import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "FUJITRACK AI – Intelligent Tourism Demand Forecasting & Transportation Analytics"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database: defaults to local SQLite for seamless standalone execution,
    # or PostgreSQL when DATABASE_URL is set (e.g. Neon, Render).
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'fujitrack.db'}"
    )

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fujikyu-dx-ai-secret-key-mt-fuji-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Storage Paths
    DATA_DIR: Path = BASE_DIR / "data"
    SAMPLES_DIR: Path = BASE_DIR / "data" / "samples"
    CLEANED_DIR: Path = BASE_DIR / "data" / "cleaned"
    MODELS_DIR: Path = BASE_DIR / "data" / "models"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"

    # Optional External Integrations
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure required directories exist
for path in [settings.DATA_DIR, settings.SAMPLES_DIR, settings.CLEANED_DIR, settings.MODELS_DIR, settings.REPORTS_DIR]:
    path.mkdir(parents=True, exist_ok=True)
