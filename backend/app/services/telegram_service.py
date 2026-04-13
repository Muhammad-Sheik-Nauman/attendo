"""
Telegram Bot integration service.
Sends attendance notifications to students and summary to teachers.
"""

import aiohttp
from typing import Optional
from datetime import datetime
from app.config import settings


class TelegramService:
    """Handles Telegram Bot API communication."""

    BASE_URL = "https://api.telegram.org/bot{token}/{method}"

    @staticmethod
    def _url(method: str) -> str:
        """Build Telegram API URL."""
        return TelegramService.BASE_URL.format(
            token=settings.TELEGRAM_BOT_TOKEN,
            method=method
        )

    @staticmethod
    async def send_message(chat_id: str, text: str, parse_mode: str = "HTML") -> bool:
        """
        Send a text message to a Telegram user.
        Returns True if sent successfully.
        """
        if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            print("[WARN] Telegram bot token not configured, skipping message")
            return False

        url = TelegramService._url("sendMessage")
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as resp:
                    result = await resp.json()
                    if result.get("ok"):
                        print(f"[OK] Telegram message sent to {chat_id}")
                        return True
                    else:
                        print(f"[ERROR] Telegram error: {result.get('description')}")
                        return False
        except Exception as e:
            print(f"[ERROR] Telegram send error: {e}")
            return False

    @staticmethod
    async def send_attendance_notification(
        chat_id: str,
        student_name: str,
        status: str,
        time_str: str,
        date_str: str
    ) -> bool:
        """
        Send personalized attendance notification to a student.
        """
        if status == "present":
            emoji = "✅"
            status_text = "PRESENT"
        else:
            emoji = "❌"
            status_text = "ABSENT"

        message = (
            f"<b>Hello {student_name}! 👋</b>\n\n"
            f"{emoji} You are marked <b>{status_text}</b>\n"
            f"🕒 Time: <b>{time_str}</b>\n"
            f"📅 Date: <b>{date_str}</b>\n\n"
            f"<i>— Attendo Smart Attendance System</i>"
        )

        return await TelegramService.send_message(chat_id, message)

    @staticmethod
    async def send_teacher_summary(
        chat_id: str,
        total_faces: int,
        present: int,
        unknown: int,
        class_section: str,
        time_str: str,
        date_str: str
    ) -> bool:
        """
        Send attendance summary to teacher/admin.
        """
        message = (
            f"<b>📊 Attendance Summary</b>\n\n"
            f"📚 Class: <b>{class_section}</b>\n"
            f"👥 Total Faces Detected: <b>{total_faces}</b>\n"
            f"✅ Present: <b>{present}</b>\n"
            f"❓ Unknown: <b>{unknown}</b>\n"
            f"🕒 Time: <b>{time_str}</b>\n"
            f"📅 Date: <b>{date_str}</b>\n\n"
            f"<i>— Attendo Smart Attendance System</i>"
        )

        return await TelegramService.send_message(chat_id, message)

    @staticmethod
    async def get_bot_info() -> Optional[dict]:
        """Get bot information to verify token is valid."""
        if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            return None

        url = TelegramService._url("getMe")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as resp:
                    result = await resp.json()
                    if result.get("ok"):
                        return result.get("result")
                    return None
        except Exception as e:
            print(f"[ERROR] Bot info error: {e}")
            return None

    @staticmethod
    async def poll_updates():
        """
        Background task to poll for Telegram updates (for local development).
        This replaces the need for a public webhook URL.
        """
        if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            return

        print(f"[*] Starting Telegram Bot polling...")
        offset = 0
        
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    url = TelegramService._url("getUpdates")
                    params = {"offset": offset, "timeout": 20}
                    
                    async with session.get(url, params=params) as resp:
                        result = await resp.json()
                        
                        if result.get("ok"):
                            updates = result.get("result", [])
                            for update in updates:
                                offset = update["update_id"] + 1
                                await TelegramService._handle_update(update)
                        
                except Exception as e:
                    print(f"[ERROR] Bot polling error: {e}")
                
                import asyncio
                await asyncio.sleep(0.5)

    @staticmethod
    async def _handle_update(update: dict):
        """Internal handler for processing bot updates."""
        from app.database import get_db
        db = get_db()
        
        message = update.get("message", {})
        if not message: return
        
        chat = message.get("chat", {})
        chat_id = str(chat.get("id", ""))
        text = message.get("text", "").strip()
        
        if not text: return
        
        if text.startswith("/start"):
            parts = text.split()
            if len(parts) == 2:
                student_id = parts[1]
                
                if db is None:
                    return

                student = await db.students.find_one({"student_id": student_id})
                if student:
                    await db.students.update_one(
                        {"student_id": student_id},
                        {"$set": {"telegram_chat_id": chat_id, "updated_at": datetime.utcnow()}}
                    )
                    await telegram_service.send_message(
                        chat_id,
                        f"✅ <b>Welcome, {student['name']}!</b>\n\nYour account is now linked to Student ID: <b>{student_id}</b>."
                    )
                else:
                    await telegram_service.send_message(chat_id, f"❌ Student ID <b>{student_id}</b> not found.")
            else:
                await telegram_service.send_message(
                    chat_id, 
                    "👋 <b>Welcome!</b>\n\nTo link your account, send:\n<code>/start YOUR_STUDENT_ID</code>"
                )


telegram_service = TelegramService()
