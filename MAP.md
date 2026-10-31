# API Endpoint Call Tree

This map shows the full nested function flow for each endpoint. Each function is linked to the implementation section.

---

## 1) Health

### GET /api/health
health_check() [backend/app/main.py#L59-L64](backend/app/main.py#L59-L64)
└─ returns
   ├─ "status": "healthy"
   ├─ "service": settings.PROJECT_NAME
   ├─ "version": settings.VERSION
   └─ "gemini_configured": bool(settings.GEMINI_API_KEY)

---

## 2) Authentication Routes

### POST /api/auth/register
register() [backend/app/routers/auth.py#L35-L77](backend/app/routers/auth.py#L35-L77)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
│  └─ returns MongoDB database access
├─ users_col.find_one({"email": email})
│  └─ checks if the user already exists
├─ get_password_hash(user_in.password) [backend/app/utils/security.py#L20-L23](backend/app/utils/security.py#L20-L23)
│  └─ hashes the raw password before storing
├─ create_access_token(data=token_payload) [backend/app/utils/security.py#L24-L50](backend/app/utils/security.py#L24-L50)
│  ├─ creates JWT payload with sub, role, id
│  └─ signs token using JWT secret and expiry settings
├─ format_user_doc(user_doc) [backend/app/utils/dependencies.py#L36-L62](backend/app/utils/dependencies.py#L36-L62)
│  └─ converts MongoDB document to API response model
└─ returns Token(access_token, token_type, user)

### POST /api/auth/login
login() [backend/app/routers/auth.py#L80-L120](backend/app/routers/auth.py#L80-L120)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.find_one({"email": email})
├─ verify_password(login_data.password, user_doc["password_hash"]) [backend/app/utils/security.py#L13-L18](backend/app/utils/security.py#L13-L18)
│  └─ checks submitted password against stored hash
├─ users_col.update_one({"_id": user_doc["_id"]}, {"$set": {"last_login_at": now}})
├─ create_access_token(data=token_payload, expires_delta=expires_delta) [backend/app/utils/security.py#L24-L50](backend/app/utils/security.py#L24-L50)
│  ├─ uses remember_me to decide expiry
│  └─ issues JWT
├─ format_user_doc(user_doc) [backend/app/utils/dependencies.py#L36-L62](backend/app/utils/dependencies.py#L36-L62)
└─ returns Token(...)

### POST /api/auth/google
google_auth() [backend/app/routers/auth.py#L122-L173](backend/app/routers/auth.py#L122-L173)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.find_one({"email": email})
├─ if not user_doc:
│  ├─ get_password_hash(f"google_oauth_{ObjectId()}") [backend/app/utils/security.py#L20-L23](backend/app/utils/security.py#L20-L23)
│  ├─ users_col.insert_one(user_doc)
│  └─ set auth_provider = "google"
├─ else:
│  └─ users_col.update_one(... {"last_login_at": now, "avatar_url": req.picture})
├─ create_access_token(data=token_payload, expires_delta=timedelta(days=7)) [backend/app/utils/security.py#L24-L50](backend/app/utils/security.py#L24-L50)
├─ format_user_doc(user_doc) [backend/app/utils/dependencies.py#L36-L62](backend/app/utils/dependencies.py#L36-L62)
└─ returns Token(...)

### GET /api/auth/me
get_me() [backend/app/routers/auth.py#L175-L179](backend/app/routers/auth.py#L175-L179)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
│  ├─ oauth2_scheme
│  ├─ decode JWT token
│  ├─ load user document from MongoDB
│  └─ return UserResponse
└─ returns current_user

### PUT /api/auth/profile
update_profile() [backend/app/routers/auth.py#L181-L204](backend/app/routers/auth.py#L181-L204)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.update_one({"email": current_user.email.lower()}, {"$set": update_fields})
│  └─ updates full_name and/or role
├─ users_col.find_one({"email": current_user.email.lower()})
├─ format_user_doc(updated_doc) [backend/app/utils/dependencies.py#L36-L62](backend/app/utils/dependencies.py#L36-L62)
└─ returns updated profile model

### POST /api/auth/change-password
change_password() [backend/app/routers/auth.py#L206-L231](backend/app/routers/auth.py#L206-L231)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.find_one({"email": current_user.email.lower()})
├─ verify_password(pwd_data.current_password, user_doc["password_hash"]) [backend/app/utils/security.py#L13-L18](backend/app/utils/security.py#L13-L18)
├─ get_password_hash(pwd_data.new_password) [backend/app/utils/security.py#L20-L23](backend/app/utils/security.py#L20-L23)
├─ users_col.update_one({"_id": user_doc["_id"]}, {"$set": {"password_hash": ..., "updated_at": ...}})
└─ returns success message

### POST /api/auth/forgot-password
forgot_password() [backend/app/routers/auth.py#L233-L262](backend/app/routers/auth.py#L233-L262)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.find_one({"email": email})
├─ create_password_reset_token(email) [backend/app/utils/security.py#L24-L50](backend/app/utils/security.py#L24-L50)
│  └─ creates signed token for password reset
├─ users_col.update_one({"_id": user_doc["_id"]}, {"$set": {"reset_token": token, "reset_requested_at": now}})
└─ returns reset message and reset_link

### POST /api/auth/reset-password
reset_password() [backend/app/routers/auth.py#L264-L294](backend/app/routers/auth.py#L264-L294)
├─ verify_password_reset_token(req.token) [backend/app/utils/security.py#L52-L71](backend/app/utils/security.py#L52-L71)
│  └─ verifies token validity and decodes email
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.find_one({"email": email})
├─ get_password_hash(req.new_password) [backend/app/utils/security.py#L20-L23](backend/app/utils/security.py#L20-L23)
├─ users_col.update_one({"_id": user_doc["_id"]}, {"$set": {"password_hash": ..., "reset_token": None, "updated_at": ...}})
└─ returns success confirmation

### GET /api/auth/db-status
get_database_status() [backend/app/routers/auth.py#L296-L300](backend/app/routers/auth.py#L296-L300)
└─ get_db_status() [backend/app/database.py#L94-L105](backend/app/database.py#L94-L105)
   └─ checks MongoDB connection status / health

### POST /api/auth/seed-demo
seed_demo_user() [backend/app/routers/auth.py#L302-L333](backend/app/routers/auth.py#L302-L333)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ users_col.find_one({"email": email})
├─ get_password_hash("password123") [backend/app/utils/security.py#L20-L23](backend/app/utils/security.py#L20-L23)
├─ if existing:
│  └─ users_col.update_one({"email": email}, {"$set": demo_doc})
├─ else:
│  └─ users_col.insert_one(demo_doc)
└─ returns demo account details

---

## 3) Database Connection Routes

### POST /api/databases/test-connection
test_connection() [backend/app/routers/databases.py#L37-L53](backend/app/routers/databases.py#L37-L53)
└─ test_mysql_connection(host, port, database, username, password) [backend/app/utils/mysql_connector.py](backend/app/utils/mysql_connector.py)
   ├─ creates MySQL connection attempt
   ├─ validates credentials and DB reachability
   └─ returns success/failure payload

### POST /api/databases/connect
connect_and_save() [backend/app/routers/databases.py#L56-L113](backend/app/routers/databases.py#L56-L113)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ test_mysql_connection(...) [backend/app/utils/mysql_connector.py](backend/app/utils/mysql_connector.py)
│  └─ validates database credentials before saving
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ connections_col.insert_one(doc)
│  └─ stores connection metadata without password
├─ ConnectSaveResponse(success=True, message=..., connection_id=...)
└─ returns saved connection details

### GET /api/databases/
list_connections() [backend/app/routers/databases.py#L116-L146](backend/app/routers/databases.py#L116-L146)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ connections_col.find({"user_id": current_user.id}, {"password": 0})
│  └─ fetches user-owned connections only
├─ DatabaseConnectionDoc(...)
│  └─ maps MongoDB docs to typed response model
└─ returns list of connections

### DELETE /api/databases/{connection_id}
delete_connection(connection_id) [backend/app/routers/databases.py#L149-L186](backend/app/routers/databases.py#L149-L186)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ ObjectId(connection_id)
│  └─ converts string ID to Mongo ObjectId
├─ connections_col.find_one({"_id": oid})
│  └─ loads connection to verify ownership
├─ permission check:
│  └─ if doc.get("user_id") != current_user.id: raise 403
├─ connections_col.delete_one({"_id": oid})
└─ returns success message

---

## 4) Chat / AI Query Routes

### POST /api/chat/query
chat_query() [backend/app/routers/chat.py#L91-L180](backend/app/routers/chat.py#L91-L180)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ _load_connection(req.connection_id, current_user.id, db) [backend/app/routers/chat.py#L39-L54](backend/app/routers/chat.py#L39-L54)
│  ├─ ObjectId(connection_id)
│  ├─ db["database_connections"].find_one({"_id": oid})
│  ├─ validates record exists
│  └─ validates user owns the connection
├─ get_schema(host, port, database, username, password) [backend/app/utils/schema_inspector.py#L27-L91](backend/app/utils/schema_inspector.py#L27-L91)
│  └─ reads schema metadata from the live MySQL DB
├─ history_for_gemini = [ ... ]
├─ convert_nl_to_sql(question=req.question, schema_text=schema_text, chat_history=history_for_gemini) [backend/app/utils/nl2sql_engine.py#L66-L184](backend/app/utils/nl2sql_engine.py#L66-L184)
│  ├─ builds prompt using DB schema
│  ├─ sends request to Gemini
│  └─ returns generated SQL string
├─ if sql.upper().startswith("CANNOT_CONVERT:"):
│  ├─ _save_history(..., success=False, error=reason) [backend/app/routers/chat.py#L256-L276](backend/app/routers/chat.py#L256-L276)
│  └─ returns ChatResponse(success=False, cannot_convert=True)
├─ _execute_sql(host, port, database, username, password, sql) [backend/app/routers/chat.py#L56-L88](backend/app/routers/chat.py#L56-L88)
│  ├─ sqlalchemy.create_engine(...)
│  ├─ conn.execute(text(sql))
│  ├─ collects columns and rows
│  └─ returns execution_time_ms
├─ _save_history(..., success=True, row_count=len(rows), execution_time_ms=elapsed_ms) [backend/app/routers/chat.py#L256-L276](backend/app/routers/chat.py#L256-L276)
└─ returns ChatResponse(success=True, sql=sql, columns=..., results=..., row_count=..., execution_time_ms=...)

### POST /api/chat/schema/{connection_id}
get_connection_schema(connection_id) [backend/app/routers/chat.py#L183-L222](backend/app/routers/chat.py#L183-L222)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ _load_connection(connection_id, current_user.id, db) [backend/app/routers/chat.py#L39-L54](backend/app/routers/chat.py#L39-L54)
├─ get_schema(host, port, database, username, password) [backend/app/utils/schema_inspector.py#L27-L91](backend/app/utils/schema_inspector.py#L27-L91)
├─ { tname: [SchemaColumn(**col) for col in cols] }
└─ returns SchemaResponse(...)

### GET /api/chat/history
get_query_history() [backend/app/routers/chat.py#L224-L254](backend/app/routers/chat.py#L224-L254)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ db["query_history"].find({"user_id": current_user.id}).sort("created_at", -1).limit(limit)
├─ QueryHistoryDoc(...)
│  └─ maps MongoDB data to response model
└─ returns list of queries

---

## 5) API Key Routes

### GET /api/api-keys
list_api_keys() [backend/app/routers/api_keys.py#L38-L53](backend/app/routers/api_keys.py#L38-L53)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ keys_col.find({"user_id": current_user.id}, {"key_hash": 0})
├─ format_key_doc(doc) [backend/app/routers/api_keys.py#L20-L35](backend/app/routers/api_keys.py#L20-L35)
│  └─ strips hashes and returns masked safe fields
└─ returns list of API keys

### POST /api/api-keys
create_api_key() [backend/app/routers/api_keys.py#L56-L109](backend/app/routers/api_keys.py#L56-L109)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ name = req.name.strip()
├─ if not name: raise HTTPException(400)
├─ secrets.token_hex(24)
├─ raw_api_key = f"nlsql_{raw_token}"
├─ hash_key(raw_api_key) [backend/app/routers/api_keys.py#L20-L35](backend/app/routers/api_keys.py#L20-L35)
│  └─ computes SHA-256 hash for storage
├─ keys_col.insert_one(doc)
│  └─ stores masked prefix + hash only
├─ ApiKeyCreatedResponse(...)
│  └─ returns plaintext API key only once
└─ returns generated key to client

### DELETE /api/api-keys/{key_id}
revoke_api_key(key_id) [backend/app/routers/api_keys.py#L111-L136](backend/app/routers/api_keys.py#L111-L136)
├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
├─ ObjectId(key_id)
├─ keys_col.delete_one({"_id": oid, "user_id": current_user.id})
├─ if deleted_count == 0: raise HTTPException(404)
└─ returns success message

---

## 6) Internal Helper Trees

### Startup chain
FastAPI app startup [backend/app/main.py#L22-L35](backend/app/main.py#L22-L35)
├─ lifespan(app)
│  ├─ logger.info("Starting ...")
│  ├─ if settings.GEMINI_API_KEY: logger.info("Gemini API key loaded")
│  ├─ else: logger.warning("GEMINI_API_KEY is not set")
│  ├─ init_db() [backend/app/database.py#L26-L85](backend/app/database.py#L26-L85)
│  │  ├─ ensures MongoDB client is created
│  │  └─ initializes database connection
│  └─ yield
└─ close_db() [backend/app/database.py#L107-L108](backend/app/database.py#L107-L108) on shutdown

### Security helper tree
create_access_token() [backend/app/utils/security.py#L24-L50](backend/app/utils/security.py#L24-L50)
├─ datetime.now(timezone.utc)
├─ timedelta(...) for expiration
├─ jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)
└─ returns encoded token

verify_password() [backend/app/utils/security.py#L13-L18](backend/app/utils/security.py#L13-L18)
├─ uses password hashing framework
└─ compares plain password with stored hash

get_password_hash() [backend/app/utils/security.py#L20-L23](backend/app/utils/security.py#L20-L23)
├─ hashes plaintext password
└─ returns secure digest

get_current_user() [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
├─ oauth2_scheme(token)
├─ decode JWT
├─ verify token values
├─ find user in MongoDB
└─ returns UserResponse

### Query execution helper tree
_load_connection() [backend/app/routers/chat.py#L39-L54](backend/app/routers/chat.py#L39-L54)
├─ ObjectId(connection_id)
├─ db["database_connections"].find_one({"_id": oid})
├─ if not doc: raise 404
├─ if doc.get("user_id") != user_id: raise 403
└─ return doc

_execute_sql() [backend/app/routers/chat.py#L56-L88](backend/app/routers/chat.py#L56-L88)
├─ urllib.parse.quote_plus(username)
├─ urllib.parse.quote_plus(password)
├─ sqlalchemy.create_engine(url)
├─ engine.connect()
├─ conn.execute(text(sql))
├─ result.fetchall()
├─ columns = list(result.keys())
├─ rows = [list(row) for row in result.fetchall()]
├─ elapsed = perf_counter difference
└─ returns (columns, rows, elapsed_ms)

_save_history() [backend/app/routers/chat.py#L256-L276](backend/app/routers/chat.py#L256-L276)
├─ db["query_history"].insert_one({
│  ├─ user_id
│  ├─ connection_id
│  ├─ database_name
│  ├─ question
│  ├─ sql
│  ├─ row_count
│  ├─ success
│  ├─ error
│  └─ execution_time_ms
│  })
└─ logs warning if insert fails

---

## 7) High-Level Flow

Frontend UI
├─ calls endpoint
├─ route function executes
├─ nested helper functions run
│  ├─ auth / JWT helpers
│  ├─ database access
│  ├─ MySQL schema inspection
│  ├─ Gemini NL-to-SQL conversion
│  └─ query execution and history storage
└─ returns final API response

Example tree:

POST /api/chat/query
└─ chat_query() [backend/app/routers/chat.py#L91-L180](backend/app/routers/chat.py#L91-L180)
   ├─ Depends(get_current_user) [backend/app/utils/dependencies.py#L25-L34](backend/app/utils/dependencies.py#L25-L34)
   ├─ get_db() [backend/app/database.py#L87-L95](backend/app/database.py#L87-L95)
   ├─ _load_connection() [backend/app/routers/chat.py#L39-L54](backend/app/routers/chat.py#L39-L54)
   │  └─ validates database ownership
   ├─ get_schema() [backend/app/utils/schema_inspector.py#L27-L91](backend/app/utils/schema_inspector.py#L27-L91)
   ├─ convert_nl_to_sql() [backend/app/utils/nl2sql_engine.py#L66-L184](backend/app/utils/nl2sql_engine.py#L66-L184)
   ├─ _execute_sql() [backend/app/routers/chat.py#L56-L88](backend/app/routers/chat.py#L56-L88)
   ├─ _save_history() [backend/app/routers/chat.py#L256-L276](backend/app/routers/chat.py#L256-L276)
   └─ return ChatResponse

---

## 8) Summary

This project is organized in layers:

Route layer
├─ auth routes
├─ database routes
├─ chat routes
├─ API key routes
├─ health route
├─ dependency validation and auth helpers
├─ database helpers
├─ AI conversion helpers
└─ response models / serialization
