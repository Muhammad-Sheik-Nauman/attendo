from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
from app.config import settings
from app.database import connect_db, close_db
from app.routes import auth_routes, student_routes, attendance_routes, telegram_routes
from app.services.telegram_service import telegram_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print("[*] Starting Attendo Backend...")
    await connect_db()
    
    # Start Telegram polling in background
    asyncio.create_task(telegram_service.poll_updates())
    
    print("[OK] Attendo is ready!")
    yield
    # Shutdown
    await close_db()
    print("[END] Attendo shutdown complete")


app = FastAPI(
    title="Attendo - AI Smart Classroom Attendance System",
    description="Multi-face recognition attendance system with Telegram notifications",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routes
app.include_router(auth_routes.router)
app.include_router(student_routes.router)
app.include_router(attendance_routes.router)
app.include_router(telegram_routes.router)


@app.get("/")
async def root():
    return {
        "name": "Attendo API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    from app.database import get_db
    db = get_db()
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
