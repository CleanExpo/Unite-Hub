"""Workflow API routes."""


from fastapi import APIRouter, HTTPException, Request, status

from src.api.error_handling import create_error_response
from src.utils import get_logger
from src.workflow.models import (
    ExecutionStatus,
    WorkflowDefinition,
    WorkflowExecutionRequest,
    WorkflowExecutionResponse,
)
from src.workflow.storage import WorkflowStorage

logger = get_logger(__name__)
router = APIRouter(prefix="/workflows", tags=["workflows"])

# Initialize storage
storage = WorkflowStorage()


@router.post("/", response_model=WorkflowDefinition, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    request: Request,
    workflow: WorkflowDefinition,
    user_id: str | None = None,
) -> WorkflowDefinition:
    """Create a new workflow definition."""
    try:
        created = await storage.create_workflow(workflow, user_id=user_id)
        return created

    except Exception as e:
        logger.error("Failed to create workflow", error=str(e))
        return create_error_response(
            request=request,
            exc=e,
            public_message="Failed to create workflow",
            error_code="CREATE_WORKFLOW_FAILED",
        )


@router.get("/{workflow_id}", response_model=WorkflowDefinition)
async def get_workflow(workflow_id: str) -> WorkflowDefinition:
    """Get workflow by ID."""
    workflow = await storage.get_workflow(workflow_id)

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    return workflow


@router.put("/{workflow_id}", response_model=WorkflowDefinition)
async def update_workflow(
    workflow_id: str,
    workflow: WorkflowDefinition,
) -> WorkflowDefinition:
    """Update workflow definition."""
    updated = await storage.update_workflow(workflow_id, workflow)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    return updated


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: str) -> None:
    """Delete workflow."""
    success = await storage.delete_workflow(workflow_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )


@router.get("/", response_model=list[WorkflowDefinition])
async def list_workflows(
    user_id: str | None = None,
    is_published: bool | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[WorkflowDefinition]:
    """List workflows with optional filters."""
    workflows = await storage.list_workflows(
        user_id=user_id,
        is_published=is_published,
        limit=limit,
        offset=offset,
    )
    return workflows


@router.post("/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    workflow_id: str,
    request: WorkflowExecutionRequest,
) -> WorkflowExecutionResponse:
    """Execute a workflow."""
    # Verify workflow exists
    workflow = await storage.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    # Import execution engine
    from src.workflow.engine import WorkflowEngine

    engine = WorkflowEngine()

    # Start execution (returns execution ID immediately)
    execution_id = await engine.start_execution(
        workflow=workflow,
        input_variables=request.input_variables,
        user_id=request.user_id,
    )

    # Run execution in background (async)
    import asyncio

    asyncio.create_task(engine.execute(execution_id))

    logger.info(
        "Workflow execution started",
        workflow_id=workflow_id,
        execution_id=execution_id,
    )

    return WorkflowExecutionResponse(
        execution_id=execution_id,
        status=ExecutionStatus.PENDING,
        message="Workflow execution started. Use the execution ID to check status.",
    )


@router.get("/{workflow_id}/executions/{execution_id}")
async def get_execution_status(
    workflow_id: str,
    execution_id: str,
) -> dict:
    """Get execution status."""
    from src.workflow.engine import WorkflowEngine

    engine = WorkflowEngine()
    status_data = await engine.get_execution_status(execution_id)

    if not status_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution {execution_id} not found",
        )

    return status_data
