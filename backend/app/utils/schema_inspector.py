"""
schema_inspector.py
-------------------
Introspects a live MySQL database and returns its schema as:
  - A structured dict (tables → columns → type/nullable/key)
  - A compact text representation for injecting into the LLM prompt

Security notes:
  - Password is never logged.
  - Read-only queries only (INFORMATION_SCHEMA).
"""
import logging
from typing import Dict, List, Any

from sqlalchemy import create_engine, text

logger = logging.getLogger("nlsql.schema_inspector")


def _build_url(host: str, port: int, database: str, username: str, password: str) -> str:
    from urllib.parse import quote_plus
    if host.lower() == "localhost":
        host = "127.0.0.1"
    return f"mysql+pymysql://{quote_plus(username)}:{quote_plus(password)}@{host}:{port}/{database}"


def get_schema(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
) -> Dict[str, Any]:
    """
    Returns a dict:
    {
      "database": "<db_name>",
      "tables": {
        "table_name": [
          {"column": "col_name", "type": "VARCHAR(255)", "nullable": True, "key": "PRI"},
          ...
        ],
        ...
      },
      "prompt_text": "<compact schema for LLM prompt>"
    }
    """
    url = _build_url(host, port, database, username, password)
    engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 8})
    tables: Dict[str, List[Dict]] = {}

    try:
        with engine.connect() as conn:
            # Fetch all columns across all tables
            rows = conn.execute(text("""
                SELECT
                    TABLE_NAME,
                    COLUMN_NAME,
                    COLUMN_TYPE,
                    IS_NULLABLE,
                    COLUMN_KEY,
                    COLUMN_DEFAULT,
                    EXTRA
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = :db
                ORDER BY TABLE_NAME, ORDINAL_POSITION
            """), {"db": database}).fetchall()

            for row in rows:
                tname = row[0]
                if tname not in tables:
                    tables[tname] = []
                tables[tname].append({
                    "column": row[1],
                    "type": row[2],
                    "nullable": row[3] == "YES",
                    "key": row[4] or "",
                    "default": row[5],
                    "extra": row[6] or "",
                })
    finally:
        engine.dispose()

    # Build a compact text representation for the LLM
    lines = [f"Database: `{database}`\n"]
    for tname, cols in tables.items():
        col_defs = []
        for c in cols:
            pk = " [PK]" if c["key"] == "PRI" else ""
            fk = " [FK]" if c["key"] == "MUL" else ""
            nn = " NOT NULL" if not c["nullable"] else ""
            col_defs.append(f"  - {c['column']} ({c['type']}){pk}{fk}{nn}")
        lines.append(f"Table `{tname}`:\n" + "\n".join(col_defs))

    prompt_text = "\n\n".join(lines)

    return {
        "database": database,
        "tables": tables,
        "prompt_text": prompt_text,
    }


def get_table_names(
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
) -> List[str]:
    """Quick helper — returns only the list of table names."""
    url = _build_url(host, port, database, username, password)
    engine = create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 8})
    try:
        with engine.connect() as conn:
            rows = conn.execute(text(
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
                "WHERE TABLE_SCHEMA = :db ORDER BY TABLE_NAME"
            ), {"db": database}).fetchall()
            return [r[0] for r in rows]
    finally:
        engine.dispose()
