import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # JWT configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-this")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Security
    EMBEDDING_NOISE_SCALE: float = float(os.getenv("EMBEDDING_NOISE_SCALE", "0.01"))
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
    
    # CORS
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # App settings
    APP_NAME: str = "Universal Connection Platform"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ALLOW_TEST_USER: bool = os.getenv("ALLOW_TEST_USER", "True").lower() == "true"
    
    # AI Services
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()