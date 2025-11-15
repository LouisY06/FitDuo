from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # API Configuration
    api_title: str = "The Contender API"
    api_version: str = "1.0.0"
    environment: str = "development"
    
    # CORS Configuration
    # Can be set via CORS_ORIGINS env var (comma-separated)
    cors_origins: list[str] = [
        "http://localhost:5173",  # Vite default
        "http://localhost:5174",  # Vite alternative port
        "http://localhost:3000",  # Alternative dev port
        "http://localhost:8080",  # Alternative dev port
    ]
    
    # Database (will be configured later)
    database_url: Optional[str] = None
    
    # OpenRouter API
    openrouter_api_key: Optional[str] = None
    openrouter_model: str = "anthropic/claude-3-haiku"  # Default cost-effective model
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # Firebase
    firebase_credentials: Optional[str] = None  # Path to service account JSON file
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override CORS origins from environment variable if provided
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            # Parse comma-separated string
            self.cors_origins = [origin.strip() for origin in cors_env.split(",")]


settings = Settings()

