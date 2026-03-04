"""Task Queue API Routes.

Endpoints for managing agent task queue:
- Submit tasks to agentic layer
- View task status
- List pending/completed tasks
- Cancel tasks
"""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from src.api.error_handling import create_error_response
from src.state.supabase import SupabaseStateStore
from src.utils import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["task_queue"])


# ============================================================================
# Request/Response Models
# ============================================================================


class CreateTaskRequest(BaseModel):
    """Request to create a new task."""

    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    task_type: str = Field(..., pattern="^(feature|bug|refactor|docs|test)$")
    priority: int = Field(default=5, ge=1, le=10)


class UpdateTaskRequest(BaseModel):
    """Request to update a task."""

    status: str | None = Field(None, pattern="^(pending|in_progress|completed|failed|cancelled)$")
    assigned_agent_id: str | None = None
    assigned_agent_type: str | None = None
    result: dict[str, Any] | None = None
    error_message: str | None = None


class TaskResponse(BaseModel):
    """Response model for a task."""

    id: str
    title: str
    description: str
    task_type: str
    priority: int
    status: str
    assigned_agent_id: str | None
    assigned_agent_type: str | None
    started_at: str | None
    completed_at: str | None
    iterations: int
    verification_status: str | None
    pr_url: str | None
    created_by: str | None
    created_at: str
    updated_at: str


class TaskListResponse(BaseModel):
    """Response for task list."""

    tasks: list[TaskResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: Request,
    task_data: CreateTaskRequest,
    user_id: str | None = None,  # Would come from auth middleware
) -> TaskResponse:
    """Submit a new task to the agentic layer.

    Args:
        request: HTTP request
        task_data: Task creation request
        user_id: Optional user ID from auth

    Returns:
        Created task

    Raises:
        HTTPException: If creation fails
    """
    try:
        store = SupabaseStateStore()

        # Create task in database
        result = store.client.table("agent_task_queue").insert({
            "title": task_data.title,
            "description": task_data.description,
            "task_type": task_data.task_type,
            "priority": task_data.priority,
            "status": "pending",
            "created_by": user_id
        }).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create task"
            )

        row = result.data[0]

        logger.info(
            "Task created",
            task_id=row["id"],
            task_type=task_data.task_type,
            priority=task_data.priority
        )

        return TaskResponse(
            id=str(row["id"]),
            title=row["title"],
            description=row["description"],
            task_type=row["task_type"],
            priority=row["priority"],
            status=row["status"],
            assigned_agent_id=row.get("assigned_agent_id"),
            assigned_agent_type=row.get("assigned_agent_type"),
            started_at=row.get("started_at"),
            completed_at=row.get("completed_at"),
            iterations=row.get("iterations", 0),
            verification_status=row.get("verification_status"),
            pr_url=row.get("pr_url"),
            created_by=row.get("created_by"),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to create task",
            error_code="CREATE_TASK_FAILED",
        )


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    request: Request,
    status_filter: str | None = Query(None, description="Filter by status"),
    task_type: str | None = Query(None, description="Filter by task type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> TaskListResponse:
    """List tasks with pagination and filtering.

    Args:
        status_filter: Optional status filter
        task_type: Optional task type filter
        page: Page number
        page_size: Items per page

    Returns:
        Paginated task list

    Raises:
        HTTPException: If listing fails
    """
    try:
        store = SupabaseStateStore()

        # Build query
        query = store.client.table("agent_task_queue").select("*")

        # Apply filters
        if status_filter:
            query = query.eq("status", status_filter)
        if task_type:
            query = query.eq("task_type", task_type)

        # Order by priority then created_at
        query = query.order("priority", desc=True).order("created_at", desc=True)

        # Pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        result = query.execute()

        # Get total count
        count_query = store.client.table("agent_task_queue").select("id", count="exact")
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        if task_type:
            count_query = count_query.eq("task_type", task_type)

        count_result = count_query.execute()
        total = count_result.count or 0

        tasks = [
            TaskResponse(
                id=str(task["id"]),
                title=task["title"],
                description=task["description"],
                task_type=task["task_type"],
                priority=task["priority"],
                status=task["status"],
                assigned_agent_id=task.get("assigned_agent_id"),
                assigned_agent_type=task.get("assigned_agent_type"),
                started_at=task.get("started_at"),
                completed_at=task.get("completed_at"),
                iterations=task.get("iterations", 0),
                verification_status=task.get("verification_status"),
                pr_url=task.get("pr_url"),
                created_by=task.get("created_by"),
                created_at=task["created_at"],
                updated_at=task["updated_at"]
            )
            for task in result.data
        ]

        logger.info(
            "Tasks listed",
            count=len(tasks),
            total=total,
            filters={"status": status_filter, "type": task_type}
        )

        return TaskListResponse(
            tasks=tasks,
            total=total,
            page=page,
            page_size=page_size
        )

    except Exception as e:
        logger.error(f"Failed to list tasks: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to list tasks",
            error_code="LIST_TASKS_FAILED",
        )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(request: Request, task_id: str) -> TaskResponse:
    """Get a specific task by ID.

    Args:
        task_id: Task UUID

    Returns:
        Task details

    Raises:
        HTTPException: If task not found
    """
    try:
        store = SupabaseStateStore()

        result = store.client.table("agent_task_queue").select("*").eq(
            "id", task_id
        ).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        task = result.data[0]

        return TaskResponse(
            id=str(task["id"]),
            title=task["title"],
            description=task["description"],
            task_type=task["task_type"],
            priority=task["priority"],
            status=task["status"],
            assigned_agent_id=task.get("assigned_agent_id"),
            assigned_agent_type=task.get("assigned_agent_type"),
            started_at=task.get("started_at"),
            completed_at=task.get("completed_at"),
            iterations=task.get("iterations", 0),
            verification_status=task.get("verification_status"),
            pr_url=task.get("pr_url"),
            created_by=task.get("created_by"),
            created_at=task["created_at"],
            updated_at=task["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve task",
            error_code="GET_TASK_FAILED",
        )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    request: Request,
    task_id: str,
    update_data: UpdateTaskRequest,
) -> TaskResponse:
    """Update a task.

    Args:
        request: HTTP request
        task_id: Task UUID
        update_data: Update request

    Returns:
        Updated task

    Raises:
        HTTPException: If task not found or update fails
    """
    try:
        store = SupabaseStateStore()

        # Build update fields
        fields = {}
        if update_data.status:
            fields["status"] = update_data.status
        if update_data.assigned_agent_id:
            fields["assigned_agent_id"] = update_data.assigned_agent_id
        if update_data.assigned_agent_type:
            fields["assigned_agent_type"] = update_data.assigned_agent_type
        if update_data.result:
            fields["result"] = update_data.result
        if update_data.error_message:
            fields["error_message"] = update_data.error_message

        # Update status timestamps
        if update_data.status == "in_progress" and "started_at" not in fields:
            fields["started_at"] = datetime.now().isoformat()
        elif update_data.status in ["completed", "failed", "cancelled"]:
            fields["completed_at"] = datetime.now().isoformat()

        result = store.client.table("agent_task_queue").update(
            fields
        ).eq("id", task_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        task = result.data[0]

        logger.info(
            "Task updated",
            task_id=task_id,
            updates=list(fields.keys())
        )

        return TaskResponse(
            id=str(task["id"]),
            title=task["title"],
            description=task["description"],
            task_type=task["task_type"],
            priority=task["priority"],
            status=task["status"],
            assigned_agent_id=task.get("assigned_agent_id"),
            assigned_agent_type=task.get("assigned_agent_type"),
            started_at=task.get("started_at"),
            completed_at=task.get("completed_at"),
            iterations=task.get("iterations", 0),
            verification_status=task.get("verification_status"),
            pr_url=task.get("pr_url"),
            created_by=task.get("created_by"),
            created_at=task["created_at"],
            updated_at=task["updated_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to update task",
            error_code="UPDATE_TASK_FAILED",
        )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_task(request: Request, task_id: str) -> None:
    """Cancel a pending task.

    Args:
        task_id: Task UUID

    Raises:
        HTTPException: If task not found or already completed
    """
    try:
        store = SupabaseStateStore()

        # Check task exists and is cancellable
        task_result = store.client.table("agent_task_queue").select("status").eq(
            "id", task_id
        ).execute()

        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        current_status = task_result.data[0]["status"]

        if current_status in ["completed", "failed", "cancelled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel task with status: {current_status}"
            )

        # Update to cancelled
        store.client.table("agent_task_queue").update({
            "status": "cancelled",
            "completed_at": datetime.now().isoformat()
        }).eq("id", task_id).execute()

        logger.info("Task cancelled", task_id=task_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel task: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to cancel task",
            error_code="CANCEL_TASK_FAILED",
        )


@router.post("/{task_id}/execute", response_model=dict[str, Any])
async def execute_task(request: Request, task_id: str) -> dict[str, Any]:
    """Execute a task using the orchestrator.

    Args:
        task_id: Task UUID

    Returns:
        Execution result

    Raises:
        HTTPException: If task not found or execution fails
    """
    try:
        store = SupabaseStateStore()

        # Get task
        task_result = store.client.table("agent_task_queue").select("*").eq(
            "id", task_id
        ).execute()

        if not task_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )

        task = task_result.data[0]

        if task["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task must be pending, current status: {task['status']}"
            )

        # Update to in_progress
        store.client.table("agent_task_queue").update({
            "status": "in_progress",
            "started_at": datetime.now().isoformat()
        }).eq("id", task_id).execute()

        # Execute via orchestrator (placeholder - would use real orchestrator)
        # from src.agents.orchestrator import OrchestratorAgent
        # orchestrator = OrchestratorAgent()
        # result = await orchestrator.run(task["description"], {})

        logger.info(
            "Task execution initiated",
            task_id=task_id,
            title=task["title"]
        )

        return {
            "status": "in_progress",
            "task_id": task_id,
            "message": "Task execution initiated"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to execute task: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to execute task",
            error_code="EXECUTE_TASK_FAILED",
        )


@router.get("/stats/summary", response_model=dict[str, Any])
async def get_queue_stats(request: Request) -> dict[str, Any]:
    """Get queue statistics.

    Returns:
        Queue statistics

    Raises:
        HTTPException: If fetching fails
    """
    try:
        store = SupabaseStateStore()

        result = store.client.table("agent_task_queue").select("status, task_type").execute()

        # Count by status
        by_status = {}
        by_type = {}

        for task in result.data:
            status_val = task["status"]
            type_val = task["task_type"]

            by_status[status_val] = by_status.get(status_val, 0) + 1
            by_type[type_val] = by_type.get(type_val, 0) + 1

        stats = {
            "total_tasks": len(result.data),
            "by_status": by_status,
            "by_type": by_type,
            "pending": by_status.get("pending", 0),
            "in_progress": by_status.get("in_progress", 0),
            "completed": by_status.get("completed", 0),
            "failed": by_status.get("failed", 0)
        }

        logger.info("Queue stats retrieved", total=stats["total_tasks"])

        return stats

    except Exception as e:
        logger.error(f"Failed to get queue stats: {e}")
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to retrieve queue statistics",
            error_code="GET_QUEUE_STATS_FAILED",
        )
