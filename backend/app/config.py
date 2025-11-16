from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
import os


class Settings(BaseSettings):
    # API Configuration
    api_title: str = "The Contender API"
    api_version: str = "1.0.0"
    environment: str = "development"
    
    # CORS Configuration
    # Can be set via CORS_ORIGINS env var (comma-separated)
    # Default to localhost for development + Vercel production domain
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080,https://fit-duo-ashen.vercel.app"
    
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
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list"""
        # Parse comma-separated string and strip whitespace
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

