"""
Authentication routes for admin login.
"""

from fastapi import APIRouter
from app.models import LoginRequest, TokenResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Admin login endpoint."""
    if not auth_service.verify_admin(request.username, request.password):
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = auth_service.create_token(request.username)
    return TokenResponse(access_token=token)


@router.get("/verify")
async def verify_token():
    """Verify the current JWT token is valid. Protected by middleware."""
    return {"valid": True, "message": "Token is valid"}
