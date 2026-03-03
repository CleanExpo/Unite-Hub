"""Pytest configuration and fixtures."""

import pytest
from httpx import AsyncClient, ASGITransport

from src.api.main import app
from src.api.middleware.rate_limit import RateLimitMiddleware


def _find_rate_limiter(asgi_app) -> RateLimitMiddleware | None:
    """Walk middleware stack to find the rate limiter instance."""
    current = asgi_app
    for _ in range(10):
        if isinstance(current, RateLimitMiddleware):
            return current
        current = getattr(current, "app", None)
        if current is None:
            break
    return None


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    """Clear rate limiter state before each test to prevent cross-test 429s."""
    # Build middleware stack if not already built
    if app.middleware_stack is None:
        app.build_middleware_stack()
    limiter = _find_rate_limiter(app.middleware_stack)
    if limiter:
        limiter.requests.clear()


@pytest.fixture
def anyio_backend() -> str:
    """Use asyncio backend for async tests."""
    return "asyncio"


@pytest.fixture
async def client() -> AsyncClient:
    """Create an async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
