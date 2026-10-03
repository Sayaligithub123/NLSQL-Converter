import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, close_db, get_db
from app.routers.auth import router as auth_router
from app.routers.databases import router as databases_router
from app.utils.security import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nlsql.main")


def auto_seed_demo_account(db):
    try:
        users = db["users"]
        email = "john@company.com"
        if not users.find_one({"email": email}):
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)
            users.insert_one({
                "email": email,
                "password_hash": get_password_hash("password123"),
                "full_name": "John Doe",
                "role": "manager",
                "is_active": True,
                "avatar_url": None,
                "created_at": now,
                "updated_at": now,
                "last_login_at": now,
            })
            logger.info("⚡ Seeded initial demo user: john@company.com / password123")
    except Exception as e:
        logger.warning(f"Could not auto-seed demo user: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    db = init_db()
    auto_seed_demo_account(db)
    yield
    logger.info("Shutting down application...")
    close_db()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for NL2SQL Converter with MongoDB Authentication and Management",
    lifespan=lifespan,
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(databases_router, prefix=settings.API_PREFIX)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
