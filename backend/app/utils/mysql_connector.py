"""
mysql_connector.py
------------------
Handles the REAL MySQL connection test using SQLAlchemy + PyMySQL.

Security notes:
- Password is NEVER logged.
- Only a lightweight PING query is executed; no arbitrary SQL.
- Errors are caught and returned as safe messages (no stack traces to client).
"""
import logging
from sqlalchemy import create_engine, text

logger = logging.getLogger("nlsql.mysql_connector")


def build_mysql_url(host: str, port: int, database: str, username: str, password: str) -> str:
    """Build a SQLAlchemy connection URL for MySQL via PyMySQL driver."""
    # URL-encode special characters in password to avoid parsing issues
    from urllib.parse import quote_plus
    safe_pass = quote_plus(password)
    safe_user = quote_plus(username)
    return f"mysql+pymysql://{safe_user}:{safe_pass}@{host}:{port}/{database}"


def test_mysql_connection(host: str, port: int, database: str, username: str, password: str) -> dict:
    """
    Attempt a real MySQL connection and run a lightweight PING.

    Returns:
        {"success": True/False, "message": "..."}

    Password is NEVER logged or included in the returned dict.
    """
    # Normalize: PyMySQL on Windows resolves 'localhost' as a socket path.
    # Force TCP by converting to the loopback IP address.
    if host.lower() == "localhost":
        host = "127.0.0.1"

    url = build_mysql_url(host, port, database, username, password)
    engine = None
    try:
        engine = create_engine(
            url,
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 8,
                "read_timeout": 8,
                "write_timeout": 8,
            },
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("MySQL connection test PASSED for host=%s port=%s database=%s user=%s",
                    host, port, database, username)
        return {"success": True, "message": "Database connection successful"}
    except Exception as exc:
        # Log WHAT went wrong (but not the password)
        logger.warning(
            "MySQL connection test FAILED host=%s port=%s database=%s user=%s | reason: %s",
            host, port, database, username, type(exc).__name__
        )
        return {"success": False, "message": "Unable to connect to database. Please check your connection details."}
    finally:
        if engine:
            try:
                engine.dispose()
            except Exception:
                pass
