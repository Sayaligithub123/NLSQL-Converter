"""
nl2sql_engine.py
----------------
Core NL→SQL conversion engine powered by Google Gemini (google-genai SDK).

Responsibilities:
  1. Build a detailed system prompt with the DB schema injected.
  2. Maintain conversation context (multi-turn chat).
  3. Send user question to Gemini, receive raw SQL response.
  4. Strip any markdown fences from the response.
  5. Return clean SQL ready for execution.

Security:
  - API key comes from settings, never from request body.
  - No arbitrary code execution — only SQL is returned and then
    the caller decides whether/how to run it.
"""
import logging
import re
from typing import List, Dict

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger("nlsql.nl2sql_engine")


# ── System Prompt Template ─────────────────────────────────────────────────────

_SYSTEM_TEMPLATE = """\
You are an expert SQL assistant for a {db_type} database.
Your only job is to convert the user's plain-English questions into valid {db_type} SQL queries.

STRICT RULES:
1. Return ONLY the raw SQL query — no explanations, no markdown fences (```), no comments.
2. Always use fully-qualified table names when there could be ambiguity.
3. Use LIMIT 200 by default on SELECT queries that could return many rows, unless the user asks for all data.
4. Never generate DROP, DELETE, TRUNCATE, ALTER, CREATE, INSERT, UPDATE, or any DDL/DML statements
   that modify data — only SELECT and SHOW queries are allowed.
5. If the question cannot be answered with a SQL query, respond with exactly:
   CANNOT_CONVERT: <brief reason>
6. If the user asks "show tables" or "list tables", return: SHOW TABLES;

DATABASE SCHEMA:
{schema_text}
"""


def _build_system_prompt(schema_text: str, db_type: str = "MySQL") -> str:
    return _SYSTEM_TEMPLATE.format(db_type=db_type, schema_text=schema_text)


# ── SQL Extraction ─────────────────────────────────────────────────────────────

def _strip_markdown(text: str) -> str:
    """Remove ```sql ... ``` or ``` ... ``` fences and strip whitespace."""
    text = re.sub(r"```(?:sql|SQL)?\s*", "", text)
    text = re.sub(r"```", "", text)
    return text.strip()


# ── Main Conversion Function ───────────────────────────────────────────────────

def convert_nl_to_sql(
    question: str,
    schema_text: str,
    chat_history: List[Dict[str, str]] | None = None,
    db_type: str = "MySQL",
) -> str:
    """
    Convert a natural-language question to SQL using the Gemini API (google-genai SDK).

    Args:
        question:     The user's English question.
        schema_text:  Compact schema string from schema_inspector.
        chat_history: List of {"role": "user"|"assistant", "content": "..."} dicts.
        db_type:      Database dialect (default "MySQL").

    Returns:
        A clean SQL string, or a string starting with "CANNOT_CONVERT:" if
        the question cannot be answered with SQL.

    Raises:
        RuntimeError: If GEMINI_API_KEY is missing.
        Exception:    On Gemini API failure.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Please add it to backend/.env"
        )

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    system_prompt = _build_system_prompt(schema_text, db_type)

    # Build conversation history for multi-turn support
    contents: List[types.Content] = []

    if chat_history:
        for msg in chat_history:
            role = msg.get("role", "user")
            content_text = msg.get("content", "")
            # google-genai uses "model" not "assistant"
            if role == "assistant":
                role = "model"
            if content_text:
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=content_text)]
                ))

    # Add the current question
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=question)]
    ))

    logger.info("Sending question to Gemini [%s]: %s", settings.GEMINI_MODEL, question[:120])

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,        # low temperature for deterministic SQL
            max_output_tokens=2048,
        ),
    )

    raw = response.text or ""
    logger.info("Gemini response: %s", raw[:200])

    return _strip_markdown(raw)
