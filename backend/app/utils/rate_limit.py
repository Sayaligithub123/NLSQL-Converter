import time
from collections import defaultdict
from typing import DefaultDict, List

from fastapi import HTTPException, status


class InMemoryRateLimiter:
    """Simple process-local rate limiter for email and reset endpoints."""

    def __init__(self) -> None:
        self._hits: DefaultDict[str, List[float]] = defaultdict(list)

    def hit(self, key: str, max_hits: int, window_seconds: int) -> None:
        now = time.monotonic()
        window_start = now - window_seconds
        recent = [stamp for stamp in self._hits[key] if stamp >= window_start]
        if len(recent) >= max_hits:
            self._hits[key] = recent
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a few minutes and try again.",
            )
        recent.append(now)
        self._hits[key] = recent


limiter = InMemoryRateLimiter()
