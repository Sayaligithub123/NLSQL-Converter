import logging
import re
from typing import Optional, Dict, Any
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import settings

logger = logging.getLogger("nlsql.database")

_mongo_client: Optional[MongoClient] = None
_database = None
_is_connected: bool = False
_is_mock: bool = False
_connection_error: Optional[str] = None


def mask_uri(uri: str) -> str:
    """Mask password in MongoDB URI for safe logging and display."""
    if not uri:
        return ""
    # Mask password pattern ://username:password@
    return re.sub(r'(://[^:]+:)([^@]+)(@)', r'\1****\3', uri)


def init_db():
    global _mongo_client, _database, _is_connected, _is_mock, _connection_error
    
    uri = settings.MONGODB_URI.strip()
    db_name = settings.MONGODB_DB_NAME.strip()
    masked = mask_uri(uri)
    
    logger.info(f"Connecting to MongoDB at: {masked} ...")
    try:
        # 5 second timeout to allow cloud MongoDB Atlas handshake
        client = MongoClient(uri, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        # Test connection ping
        client.admin.command('ping')
        _mongo_client = client
        
        # Pick database name from URI if provided, otherwise settings.MONGODB_DB_NAME
        try:
            default_db = _mongo_client.get_default_database()
            _database = default_db if default_db is not None else _mongo_client[db_name]
        except Exception:
            _database = _mongo_client[db_name]

        _is_connected = True
        _is_mock = False
        _connection_error = None
        logger.info(f"✅ Successfully connected to live MongoDB: '{_database.name}' ({masked})")
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
        _connection_error = str(exc)
        logger.warning(
            f"⚠️ Could not connect to MongoDB server ({_connection_error}). "
            f"Falling back to in-memory mongomock for development. "
            f"To connect your own MongoDB, set MONGODB_URI in backend/.env"
        )
        try:
            import mongomock
            _mongo_client = mongomock.MongoClient()
            _database = _mongo_client[db_name]
            _is_connected = True
            _is_mock = True
            logger.info(f"⚡ In-memory MongoMock active for database: '{db_name}'")
        except Exception as mock_exc:
            logger.error(f"❌ Failed to initialize fallback mongomock: {mock_exc}")
            raise

    # Ensure indexes on users collection
    try:
        users_col = _database["users"]
        users_col.create_index([("email", ASCENDING)], unique=True)
        users_col.create_index([("created_at", ASCENDING)])
        logger.info("✅ Database indexes ensured on 'users' collection")
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")

    return _database


def get_db():
    global _database
    if _database is None:
        init_db()
    return _database


def get_db_status() -> Dict[str, Any]:
    global _is_connected, _is_mock, _connection_error, _database
    db_name = _database.name if _database is not None else settings.MONGODB_DB_NAME
    return {
        "connected": _is_connected,
        "is_mock": _is_mock,
        "mode": "in-memory (mongomock)" if _is_mock else "mongodb-server",
        "uri": mask_uri(settings.MONGODB_URI) if not _is_mock else "mongomock://in-memory",
        "database": db_name,
        "error": _connection_error if _is_mock else None,
    }


def close_db():
    global _mongo_client
    if _mongo_client:
        _mongo_client.close()
        logger.info("MongoDB connection closed.")
