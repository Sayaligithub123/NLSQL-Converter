import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database import get_db, get_db_status
from app.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    PasswordResetRequest,
    PasswordResetConfirm,
    GoogleAuthRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    UserRole,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.utils.dependencies import get_current_user, format_user_doc

logger = logging.getLogger("nlsql.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    """Register a new user in MongoDB and return access token."""
    db = get_db()
    users_col = db["users"]
    
    email = user_in.email.lower().strip()
    existing_user = users_col.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
    
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": get_password_hash(user_in.password),
        "full_name": user_in.full_name.strip(),
        "role": (user_in.role.value if hasattr(user_in.role, 'value') else user_in.role) or "manager",
        "is_active": True,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }
    
    result = users_col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Generate Token
    token_payload = {
        "sub": email,
        "role": user_doc["role"],
        "id": str(result.inserted_id),
    }
    access_token = create_access_token(data=token_payload)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_doc(user_doc),
    )


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """Authenticate user with email and password, returning JWT access token."""
    db = get_db()
    users_col = db["users"]
    
    email = login_data.email.lower().strip()
    user_doc = users_col.find_one({"email": email})
    
    if not user_doc or not verify_password(login_data.password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator.",
        )
    
    now = datetime.now(timezone.utc)
    users_col.update_one({"_id": user_doc["_id"]}, {"$set": {"last_login_at": now}})
    
    # Custom expiration if remember_me is checked
    expires_delta = timedelta(days=30) if login_data.remember_me else timedelta(days=7)
    
    token_payload = {
        "sub": email,
        "role": user_doc.get("role", "manager"),
        "id": str(user_doc["_id"]),
    }
    access_token = create_access_token(data=token_payload, expires_delta=expires_delta)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_doc(user_doc),
    )


@router.post("/google", response_model=Token)
async def google_auth(req: GoogleAuthRequest):
    """Google OAuth sign-in / registration."""
    db = get_db()
    users_col = db["users"]
    
    if not req.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required for Google authentication.",
        )
    
    email = req.email.lower().strip()
    user_doc = users_col.find_one({"email": email})
    now = datetime.now(timezone.utc)
    
    if not user_doc:
        # Create user account for Google sign in
        full_name = req.name or email.split("@")[0].capitalize()
        user_doc = {
            "email": email,
            "password_hash": get_password_hash(f"google_oauth_{ObjectId()}"),
            "full_name": full_name,
            "role": "manager",
            "is_active": True,
            "avatar_url": req.picture,
            "created_at": now,
            "updated_at": now,
            "last_login_at": now,
            "auth_provider": "google",
        }
        result = users_col.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
    else:
        users_col.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"last_login_at": now, "avatar_url": req.picture or user_doc.get("avatar_url")}}
        )
    
    token_payload = {
        "sub": email,
        "role": user_doc.get("role", "manager"),
        "id": str(user_doc["_id"]),
    }
    access_token = create_access_token(data=token_payload, expires_delta=timedelta(days=7))
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_doc(user_doc),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve the current logged-in user profile."""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Update profile details for the authenticated user."""
    db = get_db()
    users_col = db["users"]
    
    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if profile_data.full_name is not None:
        update_fields["full_name"] = profile_data.full_name.strip()
    if profile_data.role is not None:
        role_val = profile_data.role.value if hasattr(profile_data.role, 'value') else profile_data.role
        update_fields["role"] = role_val
        
    users_col.update_one(
        {"email": current_user.email.lower()},
        {"$set": update_fields}
    )
    
    updated_doc = users_col.find_one({"email": current_user.email.lower()})
    return format_user_doc(updated_doc)


@router.post("/change-password")
async def change_password(
    pwd_data: ChangePasswordRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Change password for authenticated user."""
    db = get_db()
    users_col = db["users"]
    
    user_doc = users_col.find_one({"email": current_user.email.lower()})
    if not user_doc or not verify_password(pwd_data.current_password, user_doc.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    
    users_col.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "password_hash": get_password_hash(pwd_data.new_password),
            "updated_at": datetime.now(timezone.utc),
        }}
    )
    
    return {"message": "Password changed successfully."}


@router.post("/forgot-password")
async def forgot_password(req: PasswordResetRequest):
    """Request password reset token."""
    db = get_db()
    users_col = db["users"]
    
    email = req.email.lower().strip()
    user_doc = users_col.find_one({"email": email})
    
    if not user_doc:
        # Don't leak existence of email for security
        return {
            "message": "If an account exists with this email, a reset instructions link has been sent.",
            "reset_token": None,
        }
    
    token = create_password_reset_token(email)
    
    # Store token in user document for invalidation check
    users_col.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"reset_token": token, "reset_requested_at": datetime.now(timezone.utc)}}
    )
    
    return {
        "message": "Password reset token generated successfully.",
        "reset_token": token,
        "reset_link": f"/reset-password?token={token}",
    }


@router.post("/reset-password")
async def reset_password(req: PasswordResetConfirm):
    """Confirm password reset with a valid token."""
    email = verify_password_reset_token(req.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired.",
        )
    
    db = get_db()
    users_col = db["users"]
    user_doc = users_col.find_one({"email": email})
    
    if not user_doc or user_doc.get("reset_token") != req.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token.",
        )
    
    users_col.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "password_hash": get_password_hash(req.new_password),
            "reset_token": None,
            "updated_at": datetime.now(timezone.utc),
        }}
    )
    
    return {"message": "Password has been successfully reset. You can now log in."}


@router.get("/db-status")
async def get_database_status():
    """Check MongoDB connection and status."""
    return get_db_status()


@router.post("/seed-demo")
async def seed_demo_user():
    """Seeds the demo user 'John Doe' (john@company.com / password123) matching the UI mockups."""
    db = get_db()
    users_col = db["users"]
    
    email = "john@company.com"
    existing = users_col.find_one({"email": email})
    now = datetime.now(timezone.utc)
    
    demo_doc = {
        "email": email,
        "password_hash": get_password_hash("password123"),
        "full_name": "John Doe",
        "role": "manager",
        "is_active": True,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
        "last_login_at": now,
    }
    
    if existing:
        users_col.update_one({"email": email}, {"$set": demo_doc})
    else:
        users_col.insert_one(demo_doc)
        
    return {
        "message": "Demo user John Doe ready.",
        "email": email,
        "password": "password123",
        "role": "manager",
    }
