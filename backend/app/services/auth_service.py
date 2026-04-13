"""
Authentication service for admin login using JWT tokens.
"""

import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings


security = HTTPBearer()


class AuthService:
    """Handles admin authentication with JWT."""

    @staticmethod
    def verify_admin(username: str, password: str) -> bool:
        """Verify admin credentials against environment variables."""
        return (
            username == settings.ADMIN_USERNAME
            and password == settings.ADMIN_PASSWORD
        )

    @staticmethod
    def create_token(username: str) -> str:
        """Create a JWT access token."""
        payload = {
            "sub": username,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    @staticmethod
    def verify_token(token: str) -> str:
        """Verify JWT token and return username."""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            username = payload.get("sub")
            if username is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            return username
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """FastAPI dependency to get the current authenticated user."""
    return AuthService.verify_token(credentials.credentials)


auth_service = AuthService()
