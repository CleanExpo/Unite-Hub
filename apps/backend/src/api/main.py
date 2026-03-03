"""FastAPI application entry point."""

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import get_settings
from src.utils import get_logger, setup_logging

from .middleware.auth import AuthMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .middleware.request_id import RequestIdMiddleware
from .middleware.security_headers import SecurityHeadersMiddleware
from .routes import (
    agent_dashboard,
    agents,
    analytics,
    chat,
    contractors,
    discovery,
    documents,
    health,
    prd,
    rag,
    search,
    task_queue,
    webhooks,
    workflow_builder,
    workflows,
)

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager."""
    setup_logging(debug=settings.debug)
    logger.info("Starting application", environment=settings.environment)
    yield
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.project_name,
    description="LangGraph Agent Orchestration Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware — explicit methods and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id", "X-Request-ID"],
)

# Custom middleware (executed bottom-to-top: RequestId runs first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(RequestIdMiddleware)


# Global exception handler — safety net for unhandled errors
@app.exception_handler(Exception)
async def _global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    logger.error(
        "Unhandled exception",
        request_id=request_id,
        error=str(exc),
        error_type=type(exc).__name__,
        path=str(request.url.path),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "An internal error occurred",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id,
        },
    )


# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(agents.router, prefix="/api", tags=["Agents"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(webhooks.router, prefix="/api", tags=["Webhooks"])
app.include_router(prd.router, tags=["PRD Generation"])
app.include_router(workflows.router, prefix="/api", tags=["Workflows"])
app.include_router(rag.router, prefix="/api", tags=["RAG Pipeline"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(agent_dashboard.router, tags=["Agent Dashboard"])
app.include_router(task_queue.router, tags=["Task Queue"])
app.include_router(contractors.router, prefix="/api", tags=["Contractors"])
app.include_router(search.router, tags=["Search"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(workflow_builder.router, prefix="/api", tags=["Workflow Builder"])
app.include_router(discovery.router, prefix="/api", tags=["Discovery"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "AI Agent Orchestration API", "version": "0.1.0"}
