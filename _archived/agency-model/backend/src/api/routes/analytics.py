"""Analytics API routes for observability dashboard.

Returns empty metrics until a persistent state store (PostgreSQL) is configured.
Supabase was removed in the JWT-only auth migration.
"""

from typing import Any

from fastapi import APIRouter, Query

from src.utils import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])

_NOT_CONFIGURED_MSG = "Analytics requires persistent state store (not yet configured)"


@router.get("/metrics/overview")
async def get_metrics_overview(
    time_range: str = Query("7d", regex="^(1h|24h|7d|30d|90d)$"),
    agent_name: str | None = None,
) -> dict[str, Any]:
    """Get high-level metrics overview."""
    return {
        "total_runs": 0,
        "completed_runs": 0,
        "failed_runs": 0,
        "active_runs": 0,
        "success_rate": 0.0,
        "avg_duration_seconds": 0.0,
        "total_cost_usd": 0.0,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "time_range": time_range,
        "message": _NOT_CONFIGURED_MSG,
    }


@router.get("/metrics/agents")
async def get_agent_metrics(
    time_range: str = Query("7d"),
    group_by: str = Query("day", regex="^(hour|day|week)$"),
) -> list[dict[str, Any]]:
    """Get agent-specific performance metrics."""
    return []


@router.get("/metrics/costs")
async def get_cost_metrics(
    time_range: str = Query("30d"),
) -> dict[str, Any]:
    """Get cost and token usage metrics."""
    return {
        "total_cost_usd": 0.0,
        "total_input_tokens": 0,
        "total_output_tokens": 0,
        "total_calls": 0,
        "by_model": [],
        "time_range": time_range,
        "message": _NOT_CONFIGURED_MSG,
    }


@router.get("/runs/{run_id}/details")
async def get_run_details(run_id: str) -> dict[str, Any]:
    """Get detailed information about a specific agent run."""
    return {
        "run": None,
        "api_usage": [],
        "tool_usage": [],
        "message": _NOT_CONFIGURED_MSG,
    }
