import base64
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
    GoogleAuthRequest,
    UpdateProfileRequest,
    UpdateLanguageRequest,
    UpdateAvatarRequest,
    ChangePasswordRequest,
    UserRole,
)
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
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
        "language": "en",
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
            "language": "en",
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
    """Update profile details for the authenticated user.
    Role cannot be self-assigned by non-admin users.
    """
    db = get_db()
    users_col = db["users"]

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if profile_data.full_name is not None:
        update_fields["full_name"] = profile_data.full_name.strip()

    if profile_data.language is not None:
        lang_val = "hi" if profile_data.language == "hi" else "en"
        update_fields["language"] = lang_val

    # Ordinary users cannot change their own role.
    if profile_data.role is not None and current_user.role == "admin":
        role_val = profile_data.role.value if hasattr(profile_data.role, 'value') else profile_data.role
        update_fields["role"] = role_val

    users_col.update_one(
        {"email": current_user.email.lower()},
        {"$set": update_fields}
    )

    updated_doc = users_col.find_one({"email": current_user.email.lower()})
    return format_user_doc(updated_doc)


@router.put("/language", response_model=UserResponse)
async def update_language(
    req: UpdateLanguageRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Update the authenticated user's language preference ('en' or 'hi').
    """
    db = get_db()
    users_col = db["users"]
    lang_val = "hi" if req.language == "hi" else "en"

    users_col.update_one(
        {"email": current_user.email.lower()},
        {"$set": {"language": lang_val, "updated_at": datetime.now(timezone.utc)}},
    )

    updated_doc = users_col.find_one({"email": current_user.email.lower()})
    return format_user_doc(updated_doc)


@router.put("/avatar", response_model=UserResponse)
async def update_avatar(
    avatar_data: UpdateAvatarRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Upload or remove a profile picture for the authenticated user.

    avatar_data_url must be a Base64 data URL like:
        "data:image/jpeg;base64,/9j/4AAQ..."
    Pass null or an empty string to remove the current avatar.

    Constraints enforced on the server:
    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
    - Max decoded image size: 2 MB
    """
    db = get_db()
    users_col = db["users"]

    new_avatar: str | None = None

    if avatar_data.avatar_data_url:
        raw = avatar_data.avatar_data_url.strip()

        # Validate data URL format: "data:<mime>;base64,<data>"
        if not raw.startswith("data:"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid image format. Please upload a JPG, PNG, or WebP file.",
            )

        try:
            header, b64_data = raw.split(",", 1)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid image data. The upload appears to be corrupted.",
            )

        # Extract and validate MIME type from the header
        mime_part = header.replace("data:", "").replace(";base64", "").lower().strip()
        ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
        if mime_part not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported file type '{mime_part}'. Allowed: JPG, PNG, WebP, GIF.",
            )

        # Decode base64 and check image size (max 2 MB)
        try:
            decoded = base64.b64decode(b64_data)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid image data. The file could not be decoded.",
            )

        MAX_BYTES = 2 * 1024 * 1024  # 2 MB
        if len(decoded) > MAX_BYTES:
            size_mb = round(len(decoded) / (1024 * 1024), 1)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image is too large ({size_mb} MB). Maximum allowed size is 2 MB.",
            )

        new_avatar = raw  # store the full data URL in MongoDB

    # Save to MongoDB (null = avatar removed)
    users_col.update_one(
        {"email": current_user.email.lower()},
        {"$set": {"avatar_url": new_avatar, "updated_at": datetime.now(timezone.utc)}},
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

    if pwd_data.current_password == pwd_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    users_col.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "password_hash": get_password_hash(pwd_data.new_password),
            "updated_at": datetime.now(timezone.utc),
        }}
    )

    return {"message": "Password changed successfully."}


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Permanently delete the authenticated user's account and associated data.
    """
    db = get_db()
    users_col = db["users"]

    result = users_col.delete_one({"email": current_user.email.lower()})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    # Clean up associated API keys if any exist
    try:
        db["api_keys"].delete_many({"user_id": current_user.id})
    except Exception:
        pass

    return {"message": "Account has been permanently deleted."}


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
        "language": "en",
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
