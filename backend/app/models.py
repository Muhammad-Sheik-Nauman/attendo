"""
Pydantic models for request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ──── Student Models ────

class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    student_id: str = Field(..., min_length=1, max_length=50)
    class_section: str = Field(..., min_length=1, max_length=50)
    telegram_chat_id: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    name: str
    student_id: str
    class_section: str
    telegram_chat_id: Optional[str] = None
    image_count: int = 0
    has_embeddings: bool = False
    created_at: datetime


class StudentListResponse(BaseModel):
    students: List[StudentResponse]
    total: int


# ──── Attendance Models ────

class AttendanceRecord(BaseModel):
    student_id: str
    student_name: str
    class_section: str
    status: str  # "present" or "absent"
    confidence: float
    date: str
    time: str
    timestamp: datetime


class FaceDetectionResult(BaseModel):
    name: str
    student_id: Optional[str] = None
    confidence: float
    bbox: dict  # {x, y, w, h}
    status: str  # "recognized", "unknown"


class AttendanceResponse(BaseModel):
    success: bool
    message: str
    total_faces: int
    recognized: int
    unknown: int
    faces: List[FaceDetectionResult]
    image_url: str
    date: str
    time: str


class AttendanceHistoryItem(BaseModel):
    student_id: str
    student_name: str
    class_section: str
    status: str
    confidence: float
    date: str
    time: str


class AttendanceSummary(BaseModel):
    date: str
    total_students: int
    present: int
    absent: int
    attendance_rate: float


# ──── Auth Models ────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ──── Dashboard Models ────

class DashboardStats(BaseModel):
    total_students: int
    present_today: int
    absent_today: int
    attendance_rate: float
    total_classes: int
    recent_attendance: List[dict]
    weekly_trend: List[dict]
