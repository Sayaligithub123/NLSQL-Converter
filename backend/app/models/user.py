from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    VIEWER = "viewer"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.MANAGER
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: Optional[UserRole] = UserRole.MANAGER


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    picture: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    avatar_url: Optional[str] = None
    language: Optional[str] = "en"

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    sub: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    # Role is accepted for backward-compatible clients but ignored for ordinary users.
    role: Optional[UserRole] = None
    language: Optional[str] = None


class UpdateLanguageRequest(BaseModel):
    language: str = Field(..., pattern="^(en|hi)$")


class UpdateAvatarRequest(BaseModel):
    """
    Payload for profile picture upload.
    avatar_data_url: a Base64-encoded data URL, e.g. "data:image/png;base64,iVBOR..."
    Pass null / empty string to remove the current avatar.
    """
    avatar_data_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)

    @field_validator("new_password")
    @classmethod
    def password_not_blank(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("New password cannot be empty.")
        return value
