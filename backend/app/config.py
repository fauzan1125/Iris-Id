import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IRIS ID API"
    API_V1_STR: str = "/api/v1"
    
    # Database: Supports Laragon MySQL (default) or PostgreSQL
    # Laragon MySQL format: mysql+pymysql://root:@localhost:3306/attendance_db
    # PostgreSQL format: postgresql://postgres:postgres@localhost:5432/attendance_db
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:@localhost:3306/attendance_db"
    )
    
    # Face AI Engine Thresholds
    FACE_SIMILARITY_THRESHOLD: float = float(os.getenv("FACE_SIMILARITY_THRESHOLD", "0.65"))
    MAX_COSINE_DISTANCE: float = float(os.getenv("MAX_COSINE_DISTANCE", "0.35"))
    
    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "storage")
    
    # CORS
    CORS_ORIGINS: list = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()
