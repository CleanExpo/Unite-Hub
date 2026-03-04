"""Standardised error response handling.

Provides a consistent error response format that never leaks
internal details to clients. All exceptions are logged server-side
with request IDs for correlation.
"""

import uuid

from fastapi import Request
from fastapi.responses import JSONResponse

from src.utils import get_logger

logger = get_logger(__name__)


def create_error_response(
    *,
    request: Request,
    exc: Exception,
    status_code: int = 500,
    public_message: str = "An internal error occurred",
    error_code: str = "INTERNAL_ERROR",
) -> JSONResponse:
    """Create a standardised error response without leaking internals.

    Args:
        request: The incoming request (used for request ID).
        exc: The caught exception (logged server-side only).
        status_code: HTTP status code to return.
        public_message: Safe message to show the client.
        error_code: Machine-readable error code.

    Returns:
        JSONResponse with consistent error format.
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    # Log full exception detail server-side
    logger.error(
        "Request failed",
        request_id=request_id,
        error=str(exc),
        error_type=type(exc).__name__,
        path=str(request.url.path),
        method=request.method,
    )

    return JSONResponse(
        status_code=status_code,
        content={
            "error": public_message,
            "error_code": error_code,
            "request_id": request_id,
        },
    )
