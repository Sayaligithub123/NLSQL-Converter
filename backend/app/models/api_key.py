from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Friendly name for the API key")


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    api_key: str = Field(..., description="Plaintext API key returned only upon initial creation")
    message: str = "Please copy and securely store this API key now. It will not be shown again."
