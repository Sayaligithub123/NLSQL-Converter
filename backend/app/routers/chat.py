"""
routers/chat.py
---------------
Chatbot API endpoints.

POST /api/chat/query              – Main NL→SQL query endpoint (JWT required)
POST /api/chat/schema/{conn_id}   – Fetch schema for a connection (JWT required)
GET  /api/chat/history            – List query history for current user (JWT required)
"""
import logging
import time
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.chat import (
    ChatRequest,
    ChatResponse,
    SchemaRequest,
    SchemaResponse,
    SchemaColumn,
    QueryHistoryDoc,
)
from app.models.user import UserResponse
from app.utils.dependencies import get_current_user
from app.utils.schema_inspector import get_schema
from app.utils.nl2sql_engine import convert_nl_to_sql

logger = logging.getLogger("nlsql.chat")

router = APIRouter(prefix="/chat", tags=["AI Chat"])


# ── Helper: load connection from MongoDB ──────────────────────────────────────

def _load_connection(connection_id: str, user_id: str, db):
    """Load a database connection document, validating ownership."""
    try:
        oid = ObjectId(connection_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid connection_id format.")

    doc = db["database_connections"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Database connection not found.")
    if doc.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="You do not have access to this connection.")
    return doc


# ── Helper: execute SQL safely ────────────────────────────────────────────────

def _execute_sql(host, port, database, username, password, sql: str):
    """
    Execute a SQL query and return (columns, rows, execution_time_ms).
    Raises ValueError on failure.
    """
    from urllib.parse import quote_plus
    from sqlalchemy import create_engine, text

    if host.lower() == "localhost":
        host = "127.0.0.1"

    url = f"mysql+pymysql://{quote_plus(username)}:{quote_plus(password)}@{host}:{port}/{database}"
    engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10, "read_timeout": 15, "write_timeout": 15},
    )

    t0 = time.perf_counter()
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            columns = list(result.keys())
            rows = [list(row) for row in result.fetchall()]
        elapsed = (time.perf_counter() - t0) * 1000
        return columns, rows, round(elapsed, 2)
    except Exception as exc:
        raise ValueError(str(exc))
    finally:
        engine.dispose()


# ── POST /api/chat/query ──────────────────────────────────────────────────────

@router.post("/query", response_model=ChatResponse)
async def chat_query(
    req: ChatRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Main chatbot endpoint:
    1. Load the saved DB connection from MongoDB.
    2. Fetch the live schema using the user-supplied password.
    3. Convert the question to SQL via Gemini.
    4. Execute the SQL and return results.
    5. Persist query to history collection.
    """
    db = get_db()
    conn_doc = _load_connection(req.connection_id, current_user.id, db)

    host = conn_doc["host"]
    port = conn_doc["port"]
    database = conn_doc["database"]
    username = conn_doc["username"]
    password = req.db_password  # session-only, never stored

    # ── Step 1: Get schema ────────────────────────────────────────────────────
    try:
        schema = get_schema(host, port, database, username, password)
        schema_text = schema["prompt_text"]
    except Exception as exc:
        logger.warning("Schema fetch failed: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=f"Could not connect to database to read schema. Check your password. ({type(exc).__name__})",
        )

    # ── Step 2: Convert NL → SQL via Gemini ──────────────────────────────────
    history_for_gemini = [
        {"role": m.role, "content": m.content}
        for m in req.chat_history
    ]

    try:
        sql = convert_nl_to_sql(
            question=req.question,
            schema_text=schema_text,
            chat_history=history_for_gemini,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.error("Gemini conversion failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI conversion failed: {type(exc).__name__}")

    # ── Step 3: Handle CANNOT_CONVERT ────────────────────────────────────────
    if sql.upper().startswith("CANNOT_CONVERT:"):
        reason = sql[len("CANNOT_CONVERT:"):].strip()
        _save_history(db, current_user.id, req.connection_id, database,
                      req.question, sql, 0, False, reason, None)
        return ChatResponse(
            success=False,
            question=req.question,
            sql=None,
            cannot_convert=True,
            error=reason,
        )

    # ── Step 4: Execute SQL ────────────────────────────────────────────────────
    try:
        columns, rows, elapsed_ms = _execute_sql(host, port, database, username, password, sql)
        _save_history(db, current_user.id, req.connection_id, database,
                      req.question, sql, len(rows), True, None, elapsed_ms)
        return ChatResponse(
            success=True,
            question=req.question,
            sql=sql,
            columns=columns,
            results=rows,
            row_count=len(rows),
            execution_time_ms=elapsed_ms,
        )
    except ValueError as exc:
        err_msg = str(exc)
        _save_history(db, current_user.id, req.connection_id, database,
                      req.question, sql, 0, False, err_msg, None)
        return ChatResponse(
            success=False,
            question=req.question,
            sql=sql,
            error=f"SQL execution error: {err_msg}",
        )


# ── POST /api/chat/schema/{connection_id} ────────────────────────────────────

@router.post("/schema/{connection_id}", response_model=SchemaResponse)
async def get_connection_schema(
    connection_id: str,
    req: SchemaRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """Return the full schema for a saved connection."""
    db = get_db()
    conn_doc = _load_connection(connection_id, current_user.id, db)

    try:
        schema = get_schema(
            host=conn_doc["host"],
            port=conn_doc["port"],
            database=conn_doc["database"],
            username=conn_doc["username"],
            password=req.db_password,
        )
    except Exception as exc:
        return SchemaResponse(
            success=False,
            database=conn_doc.get("database", ""),
            tables={},
            error=f"Could not read schema: {type(exc).__name__}",
        )

    # Convert to Pydantic models
    tables_pydantic = {
        tname: [SchemaColumn(**col) for col in cols]
        for tname, cols in schema["tables"].items()
    }

    return SchemaResponse(
        success=True,
        database=schema["database"],
        tables=tables_pydantic,
    )


# ── GET /api/chat/history ─────────────────────────────────────────────────────

@router.get("/history", response_model=List[QueryHistoryDoc])
async def get_query_history(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = 100,
):
    """Return the authenticated user's query history (most recent first)."""
    db = get_db()
    docs = list(
        db["query_history"]
        .find({"user_id": current_user.id})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [
        QueryHistoryDoc(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            connection_id=doc["connection_id"],
            database_name=doc.get("database_name", ""),
            question=doc["question"],
            sql=doc.get("sql", ""),
            row_count=doc.get("row_count", 0),
            success=doc.get("success", False),
            error=doc.get("error"),
            execution_time_ms=doc.get("execution_time_ms"),
            created_at=doc["created_at"],
        )
        for doc in docs
    ]


# ── Helper: Save query history ────────────────────────────────────────────────

def _save_history(db, user_id, connection_id, database_name,
                  question, sql, row_count, success, error, execution_time_ms):
    try:
        db["query_history"].insert_one({
            "user_id": user_id,
            "connection_id": connection_id,
            "database_name": database_name,
            "question": question,
            "sql": sql,
            "row_count": row_count,
            "success": success,
            "error": error,
            "execution_time_ms": execution_time_ms,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception as exc:
        logger.warning("Failed to save query history: %s", exc)
