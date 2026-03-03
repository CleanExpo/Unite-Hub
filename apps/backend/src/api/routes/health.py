"""Health check routes."""

from datetime import datetime

from fastapi import APIRouter

from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0",
    }


@router.get("/ready")
async def readiness_check() -> dict[str, str | bool]:
    """Readiness check — verifies database connectivity."""
    db_ok = False
    try:
        from sqlalchemy import text

        from src.config.database import async_engine

        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as exc:
        logger.warning("Readiness check failed: database unreachable", error=str(exc))

    status = "ready" if db_ok else "not_ready"
    return {
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "database": db_ok,
    }
