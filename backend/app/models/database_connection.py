from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


# ── Request Models ──────────────────────────────────────────────────────────

class DBConnectionRequest(BaseModel):
    db_type: Literal["mysql"] = "mysql"
    host: str = Field(..., min_length=1, max_length=253)
    port: int = Field(..., ge=1, le=65535)
    database: str = Field(..., min_length=1, max_length=255)
    username: str = Field(..., min_length=1, max_length=128)
    password: str = Field(..., min_length=1)


# ── Response Models ──────────────────────────────────────────────────────────

class TestConnectionResponse(BaseModel):
    success: bool
    message: str


class ConnectSaveResponse(BaseModel):
    success: bool
    message: str
    connection_id: Optional[str] = None


# ── MongoDB Document Model (safe – no password) ──────────────────────────────

class DatabaseConnectionDoc(BaseModel):
    id: str
    user_id: str
    db_type: str
    host: str
    port: int
    database: str
    username: str
    status: str
    created_at: datetime
    updated_at: datetime
