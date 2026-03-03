"""Rate limiting middleware."""

import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import get_settings
from src.utils import get_logger

settings = get_settings()
logger = get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""

    def __init__(self, app: Callable, requests_per_minute: int = 60) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: dict[str, list[float]] = defaultdict(list)

    def _get_client_id(self, request: Request) -> str:
        """Get a unique identifier for the client."""
        # Use user ID if available, otherwise use IP
        user_id = request.headers.get("X-User-Id")
        if user_id:
            return f"user:{user_id}"

        # Get client IP from X-Forwarded-For header or connection
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"

        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"

    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if the client has exceeded the rate limit."""
        now = time.time()
        minute_ago = now - 60

        # Remove old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id] if req_time > minute_ago
        ]

        # Check if rate limited
        if len(self.requests[client_id]) >= self.requests_per_minute:
            return True

        # Add current request
        self.requests[client_id].append(now)
        return False

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Response],
    ) -> Response:
        """Process the request and apply rate limiting."""
        # Skip rate limiting for health checks
        if request.url.path in {"/health", "/ready"}:
            return await call_next(request)

        client_id = self._get_client_id(request)

        if self._is_rate_limited(client_id):
            logger.warning("Rate limit exceeded", client_id=client_id)
            return Response(
                content='{"error": "Rate limit exceeded. Please try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        return await call_next(request)
