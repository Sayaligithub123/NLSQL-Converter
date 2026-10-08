import hashlib
import logging
import secrets
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.models.user import UserResponse
from app.utils.dependencies import get_current_user

logger = logging.getLogger("nlsql.api_keys")

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


def hash_key(raw_key: str) -> str:
    """Compute SHA-256 hash of plaintext API key for secure persistence."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def format_key_doc(doc: dict) -> ApiKeyResponse:
    """Format MongoDB document into safe ApiKeyResponse without exposing hashes or secrets."""
    return ApiKeyResponse(
        id=str(doc["_id"]),
        name=doc.get("name", "Unnamed Key"),
        key_prefix=doc.get("key_prefix", "nlsql_****"),
        created_at=doc.get("created_at"),
        last_used_at=doc.get("last_used_at"),
        is_active=doc.get("is_active", True),
    )


@router.get("", response_model=List[ApiKeyResponse])
async def list_api_keys(current_user: UserResponse = Depends(get_current_user)):
    """
    List all active API keys belonging to the authenticated user.
    Never exposes key hashes or plaintext secrets.
    """
    db = get_db()
    keys_col = db["api_keys"]

    docs = list(
        keys_col.find(
            {"user_id": current_user.id},
            {"key_hash": 0},
        ).sort("created_at", -1)
    )
    return [format_key_doc(doc) for doc in docs]


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    req: ApiKeyCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Generate a new cryptographically secure API key.
    The raw plaintext key is returned ONLY once in this response.
    The database only stores its SHA-256 hash and masked preview prefix.
    """
    db = get_db()
    keys_col = db["api_keys"]

    name = req.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API key name cannot be empty.",
        )

    # Generate 32 bytes (64 hex characters) of cryptographic randomness
    raw_token = secrets.token_hex(24)
    raw_api_key = f"nlsql_{raw_token}"
    masked_prefix = f"nlsql_{raw_token[:6]}...{raw_token[-4:]}"
    hashed = hash_key(raw_api_key)
    now = datetime.now(timezone.utc)

    doc = {
        "user_id": current_user.id,
        "user_email": current_user.email,
        "name": name,
        "key_prefix": masked_prefix,
        "key_hash": hashed,
        "created_at": now,
        "last_used_at": None,
        "is_active": True,
    }

    result = keys_col.insert_one(doc)
    key_id = str(result.inserted_id)

    logger.info("API key created: id=%s user_id=%s name=%s", key_id, current_user.id, name)

    return ApiKeyCreatedResponse(
        id=key_id,
        name=name,
        key_prefix=masked_prefix,
        created_at=now,
        last_used_at=None,
        is_active=True,
        api_key=raw_api_key,
        message="Please copy and securely store this API key now. It will not be shown again.",
    )


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Revoke and permanently delete an API key belonging to the authenticated user.
    Users cannot delete or access keys belonging to others.
    """
    db = get_db()
    keys_col = db["api_keys"]

    try:
        oid = ObjectId(key_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid API key ID format.",
        )

    result = keys_col.delete_one({"_id": oid, "user_id": current_user.id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found or does not belong to your account.",
        )

    logger.info("API key revoked: id=%s user_id=%s", key_id, current_user.id)
    return {"message": "API key revoked successfully."}
