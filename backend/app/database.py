"""
MongoDB connection and database initialization.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Initialize MongoDB connection."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.DATABASE_NAME]
    
    # Create indexes for performance
    await db.students.create_index("student_id", unique=True)
    await db.students.create_index("class_section")
    await db.attendance.create_index([("student_id", 1), ("date", 1)], unique=True)
    await db.attendance.create_index("date")
    
    print(f"[OK] Connected to MongoDB: {settings.DATABASE_NAME}")
    return db


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("[END] MongoDB connection closed")


def get_db():
    """Get the database instance."""
    return db
