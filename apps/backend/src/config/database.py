"""
Database configuration and session management.

Provides SQLAlchemy connection setup for local PostgreSQL.
Includes slow-query detection via SQLAlchemy event listeners.
"""

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from .settings import get_settings

_SLOW_QUERY_THRESHOLD_MS = 500


def get_database_url(async_mode: bool = False) -> str:
    """
    Get database URL from settings.

    Args:
        async_mode: If True, returns async database URL (postgresql+asyncpg)
                   If False, returns sync database URL (postgresql+psycopg2)

    Returns:
        Database connection URL
    """
    settings = get_settings()

    # Default to local PostgreSQL if not configured
    db_url = settings.database_url or "postgresql://starter_user:local_dev_password@localhost:5433/starter_db"

    # Convert to async URL if needed
    if async_mode and not db_url.startswith("postgresql+asyncpg"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif not async_mode and not db_url.startswith("postgresql+psycopg2"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    return db_url


# Synchronous engine (for migrations and CLI tools)
sync_engine = create_engine(
    get_database_url(async_mode=False),
    echo=get_settings().debug,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10,
)

# Synchronous session factory
SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


# Asynchronous engine (for FastAPI endpoints)
async_engine = create_async_engine(
    get_database_url(async_mode=True),
    echo=get_settings().debug,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Asynchronous session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Slow-query detection for the sync engine
# ---------------------------------------------------------------------------

@event.listens_for(sync_engine, "before_cursor_execute")
def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):  # noqa: ANN001
    conn.info.setdefault("query_start_time", []).append(time.perf_counter())


@event.listens_for(sync_engine, "after_cursor_execute")
def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):  # noqa: ANN001
    from src.utils import get_logger
    total_ms = (time.perf_counter() - conn.info["query_start_time"].pop()) * 1000
    if total_ms > _SLOW_QUERY_THRESHOLD_MS:
        logger = get_logger(__name__)
        logger.warning(
            "Slow query detected",
            duration_ms=round(total_ms, 1),
            statement=statement[:200],
        )


def get_sync_db() -> Session:
    """
    Get synchronous database session.

    Yields:
        Database session

    Usage:
        ```python
        with get_sync_db() as db:
            user = db.query(User).first()
        ```
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get asynchronous database session (FastAPI dependency).

    Yields:
        Async database session

    Usage:
        ```python
        @router.get("/users")
        async def get_users(db: AsyncSession = Depends(get_async_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
        ```
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get async database session as context manager.

    Usage:
        ```python
        async with get_db_session() as db:
            result = await db.execute(select(User))
            users = result.scalars().all()
        ```
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
