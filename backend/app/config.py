"""
Application configuration loaded from environment variables.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "attendo")
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "default_secret")
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    
    # Face recognition settings
    FACE_CONFIDENCE_THRESHOLD: float = 0.25  # DeepFace distance threshold (lower = stricter)
    FACE_DETECTOR_BACKEND: str = "retinaface"  # opencv, mtcnn, retinaface, ssd, mediapipe
    FACE_MODEL: str = "Facenet512"  # VGG-Face, Facenet, Facenet512, ArcFace
    
    # Upload settings
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB


settings = Settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "students"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "attendance"), exist_ok=True)
