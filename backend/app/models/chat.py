"""
models/chat.py
--------------
Pydantic request and response models for the chatbot endpoints.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ── Shared ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """Single turn in a conversation."""
    role: str  # "user" | "assistant"
    content: str


# ── Request ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    connection_id: str = Field(..., description="MongoDB ObjectId of the saved DB connection")
    db_password: str = Field(..., min_length=1, description="DB password for this session (never stored)")
    question: str = Field(..., min_length=1, max_length=2000)
    chat_history: List[ChatMessage] = Field(default_factory=list)


# ── Response ──────────────────────────────────────────────────────────────────

class ChatResponse(BaseModel):
    success: bool
    question: str
    sql: Optional[str] = None
    columns: List[str] = Field(default_factory=list)
    results: List[List[Any]] = Field(default_factory=list)
    row_count: int = 0
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    cannot_convert: bool = False


# ── Schema Endpoint ───────────────────────────────────────────────────────────

class SchemaColumn(BaseModel):
    column: str
    type: str
    nullable: bool
    key: str
    default: Optional[str] = None
    extra: str = ""


class SchemaRequest(BaseModel):
    db_password: str = Field(..., min_length=1)


class SchemaResponse(BaseModel):
    success: bool
    database: str
    tables: Dict[str, List[SchemaColumn]]
    error: Optional[str] = None


# ── Query History ─────────────────────────────────────────────────────────────

class QueryHistoryDoc(BaseModel):
    id: str
    user_id: str
    connection_id: str
    database_name: str
    question: str
    sql: str
    row_count: int
    success: bool
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    created_at: datetime
