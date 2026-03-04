"""Agent orchestration API endpoints with Realtime event bridge.

This module provides HTTP endpoints for triggering and monitoring agent runs.
Uses Supabase Realtime to push updates to the frontend in real-time.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, Field

from src.agents.orchestrator import OrchestratorAgent
from src.api.error_handling import create_error_response
from src.state.events import AgentEventPublisher
from src.state.supabase import SupabaseStateStore
from src.utils import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/agents", tags=["agents"])


# ============================================================================
# Request/Response Models
# ============================================================================


class TriggerAgentRequest(BaseModel):
    """Request to trigger an agent run."""

    task_description: str = Field(..., min_length=1, max_length=1000)
    user_id: str | None = None
    context: dict | None = None


class TriggerAgentResponse(BaseModel):
    """Response after triggering an agent run."""

    run_id: str
    task_id: str
    status: str
    message: str


class AgentRunStatusResponse(BaseModel):
    """Response with agent run status."""

    run_id: str
    task_id: str
    agent_name: str
    status: str
    progress_percent: float
    current_step: str | None
    error: str | None
    result: dict | None
    verification_attempts: int
    started_at: str
    completed_at: str | None


# ============================================================================
# Helper Functions
# ============================================================================


async def execute_agent_with_events(
    task_description: str,
    run_id: str,
    task_id: str,
    user_id: str | None,
    context: dict | None,
) -> None:
    """Execute agent and publish status updates via Realtime.

    This runs in the background and updates the agent_runs table
    in real-time as the agent makes progress.

    Args:
        task_description: Description of the task
        run_id: Agent run ID
        task_id: Task ID
        user_id: User ID
        context: Additional context
    """
    publisher = AgentEventPublisher()
    orchestrator = OrchestratorAgent()

    try:
        # Update to in_progress
        await publisher.update_status(
            run_id=run_id,
            status="in_progress",
            step="Starting orchestrator",
        )

        # Execute the orchestrator
        # Note: In a real implementation, you'd update progress throughout execution
        # For now, we'll do a simple start -> execute -> complete flow
        result = await orchestrator.run(
            task_description=task_description,
            context=context or {},
        )

        # Check if completed successfully
        if result.get("completed", 0) > 0:
            await publisher.complete_run(
                run_id=run_id,
                result=result,
            )
        elif result.get("escalated", 0) > 0:
            await publisher.escalate_run(
                run_id=run_id,
                reason="Task escalated to human review",
                metadata={"result": result},
            )
        else:
            await publisher.fail_run(
                run_id=run_id,
                error=f"Task failed or blocked. Result: {result}",
            )

    except Exception as e:
        logger.error("Agent execution failed", error=str(e))
        await publisher.fail_run(
            run_id=run_id,
            error=str(e),
        )


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/run", response_model=TriggerAgentResponse)
async def trigger_agent_run(
    request: Request,
    trigger_request: TriggerAgentRequest,
    background_tasks: BackgroundTasks,
) -> TriggerAgentResponse:
    """Trigger a new agent run.

    This creates a task and agent run, then executes the orchestrator
    in the background. The frontend can subscribe to real-time updates
    via Supabase Realtime.

    Args:
        request: Trigger request with task description
        background_tasks: FastAPI background tasks

    Returns:
        Response with run_id and task_id

    Example:
        ```bash
        curl -X POST http://localhost:8000/api/agents/run \\
          -H "Content-Type: application/json" \\
          -d '{
            "task_description": "Build a new login page",
            "user_id": "user_123"
          }'
        ```
    """
    try:
        store = SupabaseStateStore()
        publisher = AgentEventPublisher()

        # Create task
        task_id = f"task_{hash(trigger_request.task_description) % 10000}"

        await store.save_task(
            task_id=task_id,
            conversation_id=None,
            description=trigger_request.task_description,
            status="pending",
        )

        # Create agent run
        run_id = await publisher.start_run(
            task_id=task_id,
            user_id=trigger_request.user_id,
            agent_name="orchestrator",
            metadata={"context": trigger_request.context or {}},
        )

        # Execute agent in background
        background_tasks.add_task(
            execute_agent_with_events,
            trigger_request.task_description,
            run_id,
            task_id,
            trigger_request.user_id,
            trigger_request.context,
        )

        logger.info(
            "Triggered agent run",
            run_id=run_id,
            task_id=task_id,
            description=trigger_request.task_description[:100],
        )

        return TriggerAgentResponse(
            run_id=run_id,
            task_id=task_id,
            status="pending",
            message="Agent run started successfully. Subscribe to real-time updates via Supabase.",
        )

    except Exception as e:
        logger.error("Failed to trigger agent run", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to trigger agent run",
            error_code="AGENT_TRIGGER_ERROR",
        )


@router.get("/run/{run_id}", response_model=AgentRunStatusResponse)
async def get_agent_run_status(request: Request, run_id: str) -> AgentRunStatusResponse:
    """Get current status of an agent run.

    Args:
        run_id: Agent run ID

    Returns:
        Current status and details

    Example:
        ```bash
        curl http://localhost:8000/api/agents/run/abc123
        ```
    """
    try:
        publisher = AgentEventPublisher()
        run = await publisher.get_run_status(run_id)

        if not run:
            raise HTTPException(status_code=404, detail="Agent run not found")

        return AgentRunStatusResponse(
            run_id=run["id"],
            task_id=run["task_id"],
            agent_name=run["agent_name"],
            status=run["status"],
            progress_percent=run["progress_percent"],
            current_step=run["current_step"],
            error=run["error"],
            result=run["result"],
            verification_attempts=run["verification_attempts"],
            started_at=run["started_at"],
            completed_at=run["completed_at"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get agent run status", run_id=run_id, error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to get agent run status",
            error_code="AGENT_STATUS_ERROR",
        )


@router.get("/active", response_model=list[AgentRunStatusResponse])
async def get_active_agent_runs(request: Request, user_id: str) -> list[AgentRunStatusResponse]:
    """Get all active agent runs for a user.

    Args:
        user_id: User ID to filter runs

    Returns:
        List of active agent runs

    Example:
        ```bash
        curl http://localhost:8000/api/agents/active?user_id=user_123
        ```
    """
    try:
        publisher = AgentEventPublisher()
        runs = await publisher.get_active_runs(user_id)

        return [
            AgentRunStatusResponse(
                run_id=run["id"],
                task_id=run["task_id"],
                agent_name=run["agent_name"],
                status=run["status"],
                progress_percent=run["progress_percent"],
                current_step=run["current_step"],
                error=run["error"],
                result=run["result"],
                verification_attempts=run["verification_attempts"],
                started_at=run["started_at"],
                completed_at=run["completed_at"],
            )
            for run in runs
        ]

    except Exception as e:
        logger.error("Failed to get active agent runs", user_id=user_id, error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to get active agent runs",
            error_code="AGENT_LIST_ERROR",
        )
