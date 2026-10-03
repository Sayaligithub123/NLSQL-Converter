from typing import Optional, List
from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.database import get_db
from app.models.user import UserResponse
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def format_user_doc(doc: dict) -> UserResponse:
    return UserResponse(
        id=str(doc.get("_id")),
        email=doc["email"],
        full_name=doc.get("full_name", ""),
        role=doc.get("role", "manager"),
        is_active=doc.get("is_active", True),
        created_at=doc.get("created_at"),
        avatar_url=doc.get("avatar_url"),
    )


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> UserResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: Optional[str] = payload.get("sub")
    if email is None:
        raise credentials_exception

    db = get_db()
    user_doc = db["users"].find_one({"email": email.lower()})
    if user_doc is None:
        raise credentials_exception

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return format_user_doc(user_doc)


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role '{allowed_roles}', your role is '{current_user.role}'",
            )
        return current_user
    return role_checker
