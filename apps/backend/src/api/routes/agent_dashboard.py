"""Agent Dashboard API Routes.

Provides endpoints for the agent dashboard UI:
- Agent statistics
- Task history
- Performance metrics
- Health reports
"""

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel

from src.api.error_handling import create_error_response
from src.monitoring.agent_metrics import AgentHealthReport, AgentMetrics
from src.utils import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/agents", tags=["agent_dashboard"])


# ============================================================================
# Response Models
# ============================================================================


class AgentStatsResponse(BaseModel):
    """Response model for agent statistics."""

    total_agents: int
    active_agents: int
    total_tasks: int
    successful_tasks: int
    failed_tasks: int
    success_rate: float
    avg_iterations: float
    avg_duration_seconds: float
    time_range_days: int


class AgentListItem(BaseModel):
    """Agent list item."""

    agent_id: str
    agent_type: str
    status: str
    last_active: str | None
    task_count: int
    success_rate: float


class TaskHistoryItem(BaseModel):
    """Task history item."""

    task_id: str
    agent_type: str
    description: str
    status: str
    iterations: int
    verified: bool
    created_at: str
    duration_seconds: float | None


# ============================================================================
# Endpoints
# ============================================================================


@router.get("/stats", response_model=AgentStatsResponse)
async def get_agent_statistics(
    request: Request,
    time_range: int = Query(7, ge=1, le=90, description="Days of history to include"),
) -> AgentStatsResponse:
    """Get overall agent statistics.

    Args:
        time_range: Number of days to include (default: 7)

    Returns:
        Agent statistics

    Raises:
        HTTPException: If fetching statistics fails
    """
    try:
        metrics = AgentMetrics()
        stats = await metrics.get_overall_statistics(time_range_days=time_range)

        # Calculate averages
        avg_iterations = 1.5  # Placeholder - would calculate from stats
        avg_duration = 180.0  # Placeholder - would calculate from stats

        # Count unique agents
        by_type = stats.get("by_agent_type", {})
        total_agents = len(by_type)
        active_agents = sum(
            1 for agent_stats in by_type.values()
            if agent_stats.get("total", 0) > 0
        )

        response = AgentStatsResponse(
            total_agents=total_agents,
            active_agents=active_agents,
            total_tasks=stats.get("total_tasks", 0),
            successful_tasks=stats.get("successful_tasks", 0),
            failed_tasks=stats.get("failed_tasks", 0),
            success_rate=stats.get("success_rate", 0.0),
            avg_iterations=avg_iterations,
            avg_duration_seconds=avg_duration,
            time_range_days=time_range
        )

        logger.info(
            "Agent statistics retrieved",
            time_range=time_range,
            total_tasks=response.total_tasks
        )

        return response

    except Exception as e:
        logger.error(f"Failed to get agent statistics: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve agent statistics",
            error_code="GET_AGENT_STATS_FAILED",
        )


@router.get("/list", response_model=list[AgentListItem])
async def list_agents(
    request: Request,
    agent_type: str | None = Query(None, description="Filter by agent type"),
) -> list[AgentListItem]:
    """List all agents with their statistics.

    Args:
        agent_type: Optional filter by agent type

    Returns:
        List of agents with stats

    Raises:
        HTTPException: If listing fails
    """
    try:
        # Placeholder - would query agent_runs table and aggregate
        agents = [
            AgentListItem(
                agent_id="agent_frontend_001",
                agent_type="frontend",
                status="active",
                last_active=datetime.now().isoformat(),
                task_count=45,
                success_rate=0.89
            ),
            AgentListItem(
                agent_id="agent_backend_002",
                agent_type="backend",
                status="active",
                last_active=datetime.now().isoformat(),
                task_count=62,
                success_rate=0.92
            ),
            AgentListItem(
                agent_id="agent_database_003",
                agent_type="database",
                status="idle",
                last_active=(datetime.now() - timedelta(hours=2)).isoformat(),
                task_count=28,
                success_rate=0.96
            )
        ]

        # Filter by type if specified
        if agent_type:
            agents = [a for a in agents if a.agent_type == agent_type]

        logger.info("Agents listed", count=len(agents), filter=agent_type)

        return agents

    except Exception as e:
        logger.error(f"Failed to list agents: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to list agents",
            error_code="LIST_AGENTS_FAILED",
        )


@router.get("/{agent_id}/health", response_model=AgentHealthReport)
async def get_agent_health(request: Request, agent_id: str) -> AgentHealthReport:
    """Get health report for a specific agent.

    Args:
        agent_id: Agent identifier

    Returns:
        Agent health report

    Raises:
        HTTPException: If agent not found or fetch fails
    """
    try:
        metrics = AgentMetrics()
        health = await metrics.get_agent_health(agent_id)

        logger.info(
            "Agent health retrieved",
            agent_id=agent_id,
            success_rate=health.success_rate
        )

        return health

    except Exception as e:
        logger.error(f"Failed to get agent health: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve agent health",
            error_code="GET_AGENT_HEALTH_FAILED",
        )


@router.get("/tasks/recent", response_model=list[TaskHistoryItem])
async def get_recent_tasks(
    request: Request,
    limit: int = Query(20, ge=1, le=100, description="Max tasks to return"),
    agent_type: str | None = Query(None, description="Filter by agent type"),
    status: str | None = Query(None, description="Filter by status"),
) -> list[TaskHistoryItem]:
    """Get recent task history.

    Args:
        limit: Maximum number of tasks to return
        agent_type: Optional filter by agent type
        status: Optional filter by status

    Returns:
        List of recent tasks

    Raises:
        HTTPException: If fetching fails
    """
    try:
        # Placeholder - would query agent_runs table
        tasks = [
            TaskHistoryItem(
                task_id="task_001",
                agent_type="frontend",
                description="Create UserProfile component",
                status="completed",
                iterations=1,
                verified=True,
                created_at=datetime.now().isoformat(),
                duration_seconds=145.5
            ),
            TaskHistoryItem(
                task_id="task_002",
                agent_type="backend",
                description="Add authentication middleware",
                status="completed",
                iterations=2,
                verified=True,
                created_at=(datetime.now() - timedelta(hours=1)).isoformat(),
                duration_seconds=320.0
            ),
            TaskHistoryItem(
                task_id="task_003",
                agent_type="database",
                description="Create indexes for performance",
                status="completed",
                iterations=1,
                verified=True,
                created_at=(datetime.now() - timedelta(hours=3)).isoformat(),
                duration_seconds=85.0
            )
        ]

        # Apply filters
        if agent_type:
            tasks = [t for t in tasks if t.agent_type == agent_type]
        if status:
            tasks = [t for t in tasks if t.status == status]

        # Limit results
        tasks = tasks[:limit]

        logger.info(
            "Recent tasks retrieved",
            count=len(tasks),
            filters={"agent_type": agent_type, "status": status}
        )

        return tasks

    except Exception as e:
        logger.error(f"Failed to get recent tasks: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve task history",
            error_code="GET_RECENT_TASKS_FAILED",
        )


@router.get("/performance/trends", response_model=dict[str, Any])
async def get_performance_trends(
    request: Request,
    days: int = Query(7, ge=1, le=90, description="Days of data to analyze"),
) -> dict[str, Any]:
    """Get performance trends over time.

    Args:
        days: Number of days to analyze

    Returns:
        Performance trend data

    Raises:
        HTTPException: If analysis fails
    """
    try:
        # Placeholder - would aggregate metrics by day
        trends = {
            "time_range_days": days,
            "data_points": [
                {
                    "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "tasks_completed": 15 - i,
                    "success_rate": 0.85 + (i * 0.01),
                    "avg_iterations": 1.5 - (i * 0.05)
                }
                for i in range(days)
            ]
        }

        logger.info("Performance trends retrieved", days=days)

        return trends

    except Exception as e:
        logger.error(f"Failed to get performance trends: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve performance trends",
            error_code="GET_PERFORMANCE_TRENDS_FAILED",
        )
