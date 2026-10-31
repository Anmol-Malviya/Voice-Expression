from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.auth import UserRegisterRequest, UserLoginRequest
from backend.app.services.auth_service import auth_service
from backend.app.core.dependencies import get_current_user
from backend.app.utils.responses import success_response, error_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
async def register(req: UserRegisterRequest):
    """Register a new user account with personalized accessibility preferences."""
    result = await auth_service.register(
        name=req.name,
        email=req.email,
        password=req.password,
        preferred_language=req.preferred_language,
        accessibility_settings=req.accessibility_settings,
    )
    return success_response(
        data=result,
        message="User account registered successfully",
        status_code=status.HTTP_201_CREATED,
        extra_fields={
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "user": result["user"],
        }
    )

@router.post("/login")
async def login(req: UserLoginRequest):
    """Authenticate with email and password to receive JWT bearer token."""
    result = await auth_service.login(email=req.email, password=req.password)
    return success_response(
        data=result,
        message="Signed in successfully",
        extra_fields={
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "user": result["user"],
        }
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Log out current user and invalidate active session tokens."""
    return success_response(data={}, message="Signed out successfully")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    profile = await auth_service.get_profile(current_user["id"])
    return success_response(
        data=profile,
        message="Profile retrieved",
        extra_fields=profile,  # Allows direct access like res.data.id
    )
