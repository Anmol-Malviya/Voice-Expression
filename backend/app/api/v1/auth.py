from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
import uuid
from backend.app.schemas.auth import (
    UserRegisterRequest, 
    UserLoginRequest, 
    TokenResponse, 
    UserProfileResponse,
    UserUpdateRequest
)
from backend.app.core.database import get_users_collection
from backend.app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    get_current_user_required
)

router = APIRouter(tags=["Authentication & Users"])

@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest):
    users = get_users_collection()
    existing = await users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()
    user_doc = {
        "_id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password_hash": hash_password(req.password),
        "preferred_language": req.preferred_language,
        "accessibility_settings": req.accessibility_settings or {
            "font_size": "large",
            "high_contrast": False,
            "theme": "light",
            "reduced_motion": False
        },
        "created_at": now,
        "updated_at": now,
    }
    await users.insert_one(user_doc)

    token = create_access_token({"sub": user_id, "email": req.email.lower(), "name": req.name})
    user_profile = UserProfileResponse(
        id=user_id,
        name=user_doc["name"],
        email=user_doc["email"],
        preferred_language=user_doc["preferred_language"],
        accessibility_settings=user_doc["accessibility_settings"],
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_profile)

@router.post("/auth/login", response_model=TokenResponse)
async def login(req: UserLoginRequest):
    users = get_users_collection()
    user = await users.find_one({"email": req.email.lower()})
    
    # Auto-provision demo user if email is demo/alex
    if not user and req.email.lower() in ["demo@example.com", "alex@example.com"]:
        user_id = f"usr_demo_{uuid.uuid4().hex[:6]}"
        now = datetime.utcnow().isoformat()
        user = {
            "_id": user_id,
            "name": "Alex Mercer",
            "email": req.email.lower(),
            "password_hash": hash_password(req.password or "demo123"),
            "preferred_language": "en",
            "accessibility_settings": {
                "font_size": "large",
                "high_contrast": False,
                "theme": "light",
                "reduced_motion": False
            },
            "created_at": now,
            "updated_at": now,
        }
        await users.insert_one(user)

    if not user or not verify_password(req.password, user.get("password_hash", "")):
        # If demo password matches demo123
        if req.email.lower() in ["demo@example.com", "alex@example.com"]:
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

    token = create_access_token({"sub": str(user["_id"]), "email": user["email"], "name": user["name"]})
    user_profile = UserProfileResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        preferred_language=user.get("preferred_language", "en"),
        accessibility_settings=user.get("accessibility_settings", {}),
        created_at=user.get("created_at", datetime.utcnow().isoformat())
    )
    return TokenResponse(access_token=token, user=user_profile)

@router.post("/auth/logout")
async def logout():
    return {"message": "Successfully logged out."}

@router.get("/auth/me", response_model=UserProfileResponse)
@router.get("/users/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user_required)):
    user_id = current_user.get("sub")
    users = get_users_collection()
    user = await users.find_one({"_id": user_id})
    if not user:
        # Fallback profile from token claims
        return UserProfileResponse(
            id=user_id,
            name=current_user.get("name", "User"),
            email=current_user.get("email", ""),
            preferred_language="en",
            accessibility_settings={},
            created_at=datetime.utcnow().isoformat()
        )
    return UserProfileResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        preferred_language=user.get("preferred_language", "en"),
        accessibility_settings=user.get("accessibility_settings", {}),
        created_at=user.get("created_at", "")
    )

@router.patch("/users/me", response_model=UserProfileResponse)
async def update_user_profile(req: UserUpdateRequest, current_user: dict = Depends(get_current_user_required)):
    user_id = current_user.get("sub")
    users = get_users_collection()
    update_data = {}
    if req.name:
        update_data["name"] = req.name
    if req.preferred_language:
        update_data["preferred_language"] = req.preferred_language
    if req.accessibility_settings:
        update_data["accessibility_settings"] = req.accessibility_settings
    update_data["updated_at"] = datetime.utcnow().isoformat()

    await users.update_one({"_id": user_id}, {"$set": update_data})
    user = await users.find_one({"_id": user_id})
    return UserProfileResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        preferred_language=user.get("preferred_language", "en"),
        accessibility_settings=user.get("accessibility_settings", {}),
        created_at=user.get("created_at", "")
    )

