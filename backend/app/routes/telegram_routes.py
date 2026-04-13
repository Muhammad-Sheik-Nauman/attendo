"""
Telegram bot webhook and registration routes.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.database import get_db
from app.services.telegram_service import telegram_service
from datetime import datetime

router = APIRouter(prefix="/api/telegram", tags=["Telegram"])


class TelegramUpdate(BaseModel):
    """Simplified Telegram webhook update object."""
    update_id: int
    message: dict = None


@router.post("/webhook")
async def telegram_webhook(update: dict):
    """
    Receive Telegram bot webhook updates.
    When a student sends /start <student_id>, register their chat_id.
    """
    db = get_db()
    
    message = update.get("message", {})
    if not message:
        return {"ok": True}
    
    chat = message.get("chat", {})
    chat_id = str(chat.get("id", ""))
    text = message.get("text", "").strip()
    first_name = chat.get("first_name", "User")
    
    if not text:
        return {"ok": True}
    
    # Handle /start command
    if text.startswith("/start"):
        parts = text.split()
        
        if len(parts) == 2:
            student_id = parts[1]
            
            # Look up student by ID
            student = await db.students.find_one({"student_id": student_id})
            
            if student:
                # Update student's Telegram chat ID
                await db.students.update_one(
                    {"student_id": student_id},
                    {"$set": {
                        "telegram_chat_id": chat_id,
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                # Send confirmation
                await telegram_service.send_message(
                    chat_id,
                    f"✅ <b>Welcome, {student['name']}!</b>\n\n"
                    f"Your Telegram account has been linked to:\n"
                    f"📋 Student ID: <b>{student_id}</b>\n"
                    f"📚 Class: <b>{student['class_section']}</b>\n\n"
                    f"You will now receive attendance notifications here.\n\n"
                    f"<i>— Attendo Smart Attendance System</i>"
                )
            else:
                await telegram_service.send_message(
                    chat_id,
                    f"❌ Student ID <b>{student_id}</b> not found.\n"
                    f"Please check your Student ID and try again.\n\n"
                    f"Usage: <code>/start YOUR_STUDENT_ID</code>"
                )
        else:
            await telegram_service.send_message(
                chat_id,
                f"👋 <b>Welcome to Attendo!</b>\n\n"
                f"To link your account, send:\n"
                f"<code>/start YOUR_STUDENT_ID</code>\n\n"
                f"Example: <code>/start STU001</code>\n\n"
                f"<i>— Attendo Smart Attendance System</i>"
            )
    
    # Handle /status command
    elif text == "/status":
        student = await db.students.find_one({"telegram_chat_id": chat_id})
        if student:
            from datetime import date
            today_str = date.today().isoformat()
            attendance = await db.attendance.find_one({
                "student_id": student["student_id"],
                "date": today_str
            })
            
            if attendance:
                status_msg = f"✅ You are marked <b>PRESENT</b> today at {attendance.get('time', 'N/A')}"
            else:
                status_msg = "❌ You have <b>NOT</b> been marked present today"
            
            await telegram_service.send_message(
                chat_id,
                f"📊 <b>Your Status</b>\n\n"
                f"👤 Name: {student['name']}\n"
                f"📋 ID: {student['student_id']}\n"
                f"📚 Class: {student['class_section']}\n\n"
                f"{status_msg}"
            )
        else:
            await telegram_service.send_message(
                chat_id,
                "⚠️ Your Telegram is not linked to any student account.\n"
                "Use <code>/start YOUR_STUDENT_ID</code> to link."
            )
    
    return {"ok": True}


@router.get("/bot-info")
async def get_bot_info():
    """Get Telegram bot information."""
    info = await telegram_service.get_bot_info()
    if info:
        return {
            "configured": True,
            "bot_name": info.get("first_name", ""),
            "bot_username": info.get("username", "")
        }
    return {"configured": False, "message": "Telegram bot token not configured"}
