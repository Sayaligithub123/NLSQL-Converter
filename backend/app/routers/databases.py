"""
routers/databases.py
--------------------
API endpoints for database connection management.

POST /api/databases/test-connection  – No auth required (quick test)
POST /api/databases/connect          – JWT required; saves to MongoDB
GET  /api/databases/                 – JWT required; list user's connections
DELETE /api/databases/{conn_id}      – JWT required; remove a connection
"""
import logging
from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models.database_connection import (
    DBConnectionRequest,
    TestConnectionResponse,
    ConnectSaveResponse,
    DatabaseConnectionDoc,
)
from app.models.user import UserResponse
from app.utils.dependencies import get_current_user
from app.utils.mysql_connector import test_mysql_connection

logger = logging.getLogger("nlsql.databases")

router = APIRouter(prefix="/databases", tags=["Database Connections"])


# ── POST /api/databases/test-connection ──────────────────────────────────────

@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection(req: DBConnectionRequest):
    """
    Test a MySQL connection WITHOUT saving it.
    No authentication required (allows pre-login testing in UI).
    Password is NEVER logged or returned.
    """
    result = test_mysql_connection(
        host=req.host,
        port=req.port,
        database=req.database,
        username=req.username,
        password=req.password,
    )
    return TestConnectionResponse(**result)


# ── POST /api/databases/connect ──────────────────────────────────────────────

@router.post("/connect", response_model=ConnectSaveResponse, status_code=status.HTTP_201_CREATED)
async def connect_and_save(
    req: DBConnectionRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    1. Require JWT authentication (user identity comes from token, NOT request body).
    2. Test the MySQL connection.
    3. If successful, save metadata to MongoDB (password is NEVER saved).
    4. Return a unique connection_id.
    """
    # Step 1: Test connection first
    result = test_mysql_connection(
        host=req.host,
        port=req.port,
        database=req.database,
        username=req.username,
        password=req.password,
    )
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot save: MySQL connection failed. Please test your credentials first.",
        )

    # Step 2: Save metadata in MongoDB (NO PASSWORD STORED)
    db = get_db()
    connections_col = db["database_connections"]
    now = datetime.now(timezone.utc)

    doc = {
        "user_id": current_user.id,
        "db_type": req.db_type,
        "host": req.host,
        "port": req.port,
        "database": req.database,
        "username": req.username,
        # password is intentionally omitted
        "status": "connected",
        "created_at": now,
        "updated_at": now,
    }

    insert_result = connections_col.insert_one(doc)
    connection_id = str(insert_result.inserted_id)

    logger.info(
        "DB connection saved: connection_id=%s user_id=%s host=%s db=%s",
        connection_id, current_user.id, req.host, req.database,
    )

    return ConnectSaveResponse(
        success=True,
        message="Database connected and saved successfully",
        connection_id=connection_id,
    )


# ── GET /api/databases/ ───────────────────────────────────────────────────────

@router.get("/", response_model=List[DatabaseConnectionDoc])
async def list_connections(current_user: UserResponse = Depends(get_current_user)):
    """
    List all database connections belonging to the authenticated user.
    Password fields are NEVER included.
    """
    db = get_db()
    connections_col = db["database_connections"]

    docs = list(connections_col.find(
        {"user_id": current_user.id},
        {"password": 0},  # Explicit projection: exclude any stored password field
    ).sort("created_at", -1))

    return [
        DatabaseConnectionDoc(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            db_type=doc["db_type"],
            host=doc["host"],
            port=doc["port"],
            database=doc["database"],
            username=doc["username"],
            status=doc.get("status", "connected"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
        for doc in docs
    ]


# ── DELETE /api/databases/{connection_id} ────────────────────────────────────

@router.delete("/{connection_id}", status_code=status.HTTP_200_OK)
async def delete_connection(
    connection_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Delete a connection. Users can ONLY delete their OWN connections.
    """
    db = get_db()
    connections_col = db["database_connections"]

    try:
        oid = ObjectId(connection_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid connection ID format.")

    doc = connections_col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found.")

    if doc.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this connection.",
        )

    connections_col.delete_one({"_id": oid})
    return {"success": True, "message": "Connection deleted successfully."}
