"""
Workflow Builder API Routes.

Full CRUD operations for visual workflow builder with:
- Workflow management (create, read, update, delete, list)
- Node management within workflows
- Edge management for connections
- Execution triggering and monitoring
- Collaboration management for real-time editing

Scientific Luxury Design System compliant.
Australian localisation (en-AU).
"""

from datetime import UTC, datetime
from math import ceil
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.api.deps import get_current_user, get_optional_user
from src.api.schemas import (
    CollaboratorAddRequest,
    # Collaboration schemas
    CollaboratorResponse,
    # Workflow schemas
    WorkflowCreate,
    WorkflowDetailResponse,
    # Edge schemas
    WorkflowEdgeCreate,
    WorkflowEdgeResponse,
    # Execution schemas
    WorkflowExecuteRequest,
    WorkflowExecutionDetailResponse,
    WorkflowExecutionResponse,
    WorkflowListResponse,
    # Node schemas
    WorkflowNodeCreate,
    WorkflowNodeResponse,
    WorkflowNodeUpdate,
    WorkflowResponse,
    WorkflowUpdate,
)
from src.config.database import get_async_db
from src.db import (
    User,
    Workflow,
    WorkflowCollaborator,
    WorkflowEdge,
    WorkflowExecution,
    WorkflowExecutionStatus,
    WorkflowNode,
    WorkflowNodeType,
)
from src.utils import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/workflow-builder",
    tags=["Workflow Builder"],
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Not authorised"},
        404: {"description": "Resource not found"},
    },
)


# =============================================================================
# Workflow CRUD Operations
# =============================================================================


@router.post(
    "/workflows",
    response_model=WorkflowDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new workflow",
    description="Create a new workflow with optional initial nodes and edges",
)
async def create_workflow(
    workflow_data: WorkflowCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowDetailResponse:
    """
    Create a new workflow.

    The workflow is created with the authenticated user as owner.
    Optionally include initial nodes and edges in the request.
    """
    # Create workflow
    workflow = Workflow(
        user_id=current_user.id,
        name=workflow_data.name,
        description=workflow_data.description,
        tags=workflow_data.tags,
        variables=workflow_data.variables,
    )
    db.add(workflow)
    await db.flush()  # Get workflow ID

    # Create nodes if provided
    node_id_map: dict[int, UUID] = {}  # Map index to actual UUID
    for idx, node_data in enumerate(workflow_data.nodes):
        node = WorkflowNode(
            workflow_id=workflow.id,
            type=WorkflowNodeType(node_data.type),
            label=node_data.label,
            description=node_data.description,
            position_x=node_data.position.x,
            position_y=node_data.position.y,
            config=node_data.config,
            inputs=node_data.inputs,
            outputs=node_data.outputs,
        )
        db.add(node)
        await db.flush()
        node_id_map[idx] = node.id

    # Create edges if provided (after nodes are created)
    for edge_data in workflow_data.edges:
        edge = WorkflowEdge(
            workflow_id=workflow.id,
            source_node_id=edge_data.source_node_id,
            target_node_id=edge_data.target_node_id,
            source_handle=edge_data.source_handle,
            target_handle=edge_data.target_handle,
            type=edge_data.type,
            condition=edge_data.condition,
        )
        db.add(edge)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.nodes), selectinload(Workflow.edges))
        .where(Workflow.id == workflow.id)
    )
    workflow = result.scalar_one()

    logger.info(
        "Workflow created",
        workflow_id=str(workflow.id),
        user_id=str(current_user.id),
        node_count=len(workflow.nodes),
    )

    return _workflow_to_detail_response(workflow)


@router.get(
    "/workflows",
    response_model=WorkflowListResponse,
    summary="List workflows",
    description="Get paginated list of workflows for current user",
)
async def list_workflows(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    is_published: bool | None = Query(None, description="Filter by published status"),
    is_template: bool | None = Query(None, description="Filter by template status"),
    tag: str | None = Query(None, description="Filter by tag"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowListResponse:
    """
    List workflows with optional filtering.

    Returns workflows owned by the current user plus any they collaborate on.
    """
    # Base query for user's workflows
    query = select(Workflow).where(
        (Workflow.user_id == current_user.id)
        | (
            Workflow.id.in_(
                select(WorkflowCollaborator.workflow_id).where(
                    WorkflowCollaborator.user_id == current_user.id
                )
            )
        )
    )

    # Apply filters
    if is_published is not None:
        query = query.where(Workflow.is_published == is_published)
    if is_template is not None:
        query = query.where(Workflow.is_template == is_template)
    if tag:
        query = query.where(Workflow.tags.contains([tag]))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Workflow.updated_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    workflows = result.scalars().all()

    return WorkflowListResponse(
        workflows=[_workflow_to_response(w) for w in workflows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.get(
    "/workflows/{workflow_id}",
    response_model=WorkflowDetailResponse,
    summary="Get workflow details",
    description="Get workflow with all nodes and edges",
)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowDetailResponse:
    """Get workflow by ID with full details."""
    workflow = await _get_workflow_with_access(db, workflow_id, current_user)

    # Load relationships
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.nodes), selectinload(Workflow.edges))
        .where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one()

    return _workflow_to_detail_response(workflow)


@router.patch(
    "/workflows/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Update workflow",
    description="Update workflow metadata (partial update)",
)
async def update_workflow(
    workflow_id: UUID,
    updates: WorkflowUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowResponse:
    """Update workflow metadata."""
    workflow = await _get_workflow_with_access(db, workflow_id, current_user, require_edit=True)

    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)

    # Handle publish timestamp
    if updates.is_published and not workflow.published_at:
        workflow.published_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(workflow)

    logger.info(
        "Workflow updated",
        workflow_id=str(workflow_id),
        user_id=str(current_user.id),
        fields=list(update_data.keys()),
    )

    return _workflow_to_response(workflow)


@router.delete(
    "/workflows/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workflow",
    description="Delete workflow and all associated nodes, edges, and executions",
)
async def delete_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete workflow (owner only)."""
    workflow = await _get_workflow_with_access(db, workflow_id, current_user, require_owner=True)

    await db.delete(workflow)
    await db.commit()

    logger.info(
        "Workflow deleted",
        workflow_id=str(workflow_id),
        user_id=str(current_user.id),
    )


# =============================================================================
# Node Operations
# =============================================================================


@router.post(
    "/workflows/{workflow_id}/nodes",
    response_model=WorkflowNodeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add node to workflow",
)
async def create_node(
    workflow_id: UUID,
    node_data: WorkflowNodeCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowNodeResponse:
    """Add a new node to workflow."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_edit=True)

    node = WorkflowNode(
        workflow_id=workflow_id,
        type=WorkflowNodeType(node_data.type),
        label=node_data.label,
        description=node_data.description,
        position_x=node_data.position.x,
        position_y=node_data.position.y,
        config=node_data.config,
        inputs=node_data.inputs,
        outputs=node_data.outputs,
    )
    db.add(node)
    await db.commit()
    await db.refresh(node)

    logger.info(
        "Node created",
        node_id=str(node.id),
        workflow_id=str(workflow_id),
        node_type=node_data.type,
    )

    return _node_to_response(node)


@router.patch(
    "/workflows/{workflow_id}/nodes/{node_id}",
    response_model=WorkflowNodeResponse,
    summary="Update node",
)
async def update_node(
    workflow_id: UUID,
    node_id: UUID,
    updates: WorkflowNodeUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowNodeResponse:
    """Update node properties."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_edit=True)

    result = await db.execute(
        select(WorkflowNode).where(
            WorkflowNode.id == node_id, WorkflowNode.workflow_id == workflow_id
        )
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node {node_id} not found in workflow",
        )

    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)

    # Handle position separately
    if "position" in update_data and update_data["position"]:
        node.position_x = update_data["position"].x
        node.position_y = update_data["position"].y
        del update_data["position"]

    # Handle type conversion
    if "type" in update_data and update_data["type"]:
        update_data["type"] = WorkflowNodeType(update_data["type"])

    for field, value in update_data.items():
        if value is not None:
            setattr(node, field, value)

    await db.commit()
    await db.refresh(node)

    return _node_to_response(node)


@router.delete(
    "/workflows/{workflow_id}/nodes/{node_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete node",
)
async def delete_node(
    workflow_id: UUID,
    node_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete node and its connected edges."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_edit=True)

    result = await db.execute(
        select(WorkflowNode).where(
            WorkflowNode.id == node_id, WorkflowNode.workflow_id == workflow_id
        )
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node {node_id} not found in workflow",
        )

    await db.delete(node)  # Cascades to edges
    await db.commit()

    logger.info("Node deleted", node_id=str(node_id), workflow_id=str(workflow_id))


# =============================================================================
# Edge Operations
# =============================================================================


@router.post(
    "/workflows/{workflow_id}/edges",
    response_model=WorkflowEdgeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add edge to workflow",
)
async def create_edge(
    workflow_id: UUID,
    edge_data: WorkflowEdgeCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowEdgeResponse:
    """Add a new edge connecting two nodes."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_edit=True)

    # Verify source and target nodes exist in workflow
    for node_id in [edge_data.source_node_id, edge_data.target_node_id]:
        result = await db.execute(
            select(WorkflowNode).where(
                WorkflowNode.id == node_id, WorkflowNode.workflow_id == workflow_id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Node {node_id} not found in workflow",
            )

    edge = WorkflowEdge(
        workflow_id=workflow_id,
        source_node_id=edge_data.source_node_id,
        target_node_id=edge_data.target_node_id,
        source_handle=edge_data.source_handle,
        target_handle=edge_data.target_handle,
        type=edge_data.type,
        condition=edge_data.condition,
    )
    db.add(edge)
    await db.commit()
    await db.refresh(edge)

    logger.info(
        "Edge created",
        edge_id=str(edge.id),
        workflow_id=str(workflow_id),
        source=str(edge_data.source_node_id),
        target=str(edge_data.target_node_id),
    )

    return _edge_to_response(edge)


@router.delete(
    "/workflows/{workflow_id}/edges/{edge_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete edge",
)
async def delete_edge(
    workflow_id: UUID,
    edge_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete edge connection."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_edit=True)

    result = await db.execute(
        select(WorkflowEdge).where(
            WorkflowEdge.id == edge_id, WorkflowEdge.workflow_id == workflow_id
        )
    )
    edge = result.scalar_one_or_none()

    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edge {edge_id} not found in workflow",
        )

    await db.delete(edge)
    await db.commit()

    logger.info("Edge deleted", edge_id=str(edge_id), workflow_id=str(workflow_id))


# =============================================================================
# Execution Operations
# =============================================================================


@router.post(
    "/workflows/{workflow_id}/execute",
    response_model=WorkflowExecutionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Execute workflow",
    description="Start workflow execution (async)",
)
async def execute_workflow(
    workflow_id: UUID,
    request: WorkflowExecuteRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowExecutionResponse:
    """
    Start workflow execution.

    Returns immediately with execution ID.
    Poll the execution status endpoint to track progress.
    """
    workflow = await _get_workflow_with_access(db, workflow_id, current_user)

    # Create execution record
    execution = WorkflowExecution(
        workflow_id=workflow_id,
        user_id=current_user.id,
        status=WorkflowExecutionStatus.PENDING,
        input_data=request.input_data,
        variables={**workflow.variables, **request.variables},
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # Trigger actual execution in background
    background_tasks.add_task(
        _run_execution_background,
        execution_id=execution.id,
    )

    logger.info(
        "Workflow execution started",
        execution_id=str(execution.id),
        workflow_id=str(workflow_id),
        user_id=str(current_user.id),
    )

    return _execution_to_response(execution)


async def _run_execution_background(execution_id: UUID) -> None:
    """Run workflow execution in the background with its own DB session."""
    from src.config.database import AsyncSessionLocal
    from src.workflow.db_executor import run_workflow_execution

    try:
        async with AsyncSessionLocal() as db:
            await run_workflow_execution(db, execution_id)
    except Exception as e:
        logger.error(
            "Background execution failed",
            execution_id=str(execution_id),
            error=str(e),
        )


@router.get(
    "/workflows/{workflow_id}/executions",
    response_model=list[WorkflowExecutionResponse],
    summary="List workflow executions",
)
async def list_executions(
    workflow_id: UUID,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> list[WorkflowExecutionResponse]:
    """List recent executions for workflow."""
    await _get_workflow_with_access(db, workflow_id, current_user)

    result = await db.execute(
        select(WorkflowExecution)
        .where(WorkflowExecution.workflow_id == workflow_id)
        .order_by(WorkflowExecution.created_at.desc())
        .limit(limit)
    )
    executions = result.scalars().all()

    return [_execution_to_response(e) for e in executions]


@router.get(
    "/workflows/{workflow_id}/executions/{execution_id}",
    response_model=WorkflowExecutionDetailResponse,
    summary="Get execution details",
)
async def get_execution(
    workflow_id: UUID,
    execution_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowExecutionDetailResponse:
    """Get execution with logs."""
    await _get_workflow_with_access(db, workflow_id, current_user)

    result = await db.execute(
        select(WorkflowExecution)
        .options(selectinload(WorkflowExecution.logs))
        .where(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.workflow_id == workflow_id,
        )
    )
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution {execution_id} not found",
        )

    return _execution_to_detail_response(execution)


# =============================================================================
# Collaboration Operations
# =============================================================================


@router.get(
    "/workflows/{workflow_id}/collaborators",
    response_model=list[CollaboratorResponse],
    summary="List workflow collaborators",
)
async def list_collaborators(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> list[CollaboratorResponse]:
    """List collaborators on workflow."""
    await _get_workflow_with_access(db, workflow_id, current_user)

    result = await db.execute(
        select(WorkflowCollaborator).where(
            WorkflowCollaborator.workflow_id == workflow_id
        )
    )
    collaborators = result.scalars().all()

    return [_collaborator_to_response(c) for c in collaborators]


@router.post(
    "/workflows/{workflow_id}/collaborators",
    response_model=CollaboratorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add collaborator",
)
async def add_collaborator(
    workflow_id: UUID,
    request: CollaboratorAddRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> CollaboratorResponse:
    """Add collaborator to workflow (owner only)."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_owner=True)

    # Check if user exists
    result = await db.execute(select(User).where(User.id == request.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {request.user_id} not found",
        )

    # Check if already a collaborator
    result = await db.execute(
        select(WorkflowCollaborator).where(
            WorkflowCollaborator.workflow_id == workflow_id,
            WorkflowCollaborator.user_id == request.user_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a collaborator",
        )

    collaborator = WorkflowCollaborator(
        workflow_id=workflow_id,
        user_id=request.user_id,
        role=request.role,
    )
    db.add(collaborator)
    await db.commit()
    await db.refresh(collaborator)

    logger.info(
        "Collaborator added",
        workflow_id=str(workflow_id),
        collaborator_id=str(request.user_id),
        role=request.role,
    )

    return _collaborator_to_response(collaborator)


@router.delete(
    "/workflows/{workflow_id}/collaborators/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove collaborator",
)
async def remove_collaborator(
    workflow_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove collaborator from workflow (owner only)."""
    await _get_workflow_with_access(db, workflow_id, current_user, require_owner=True)

    result = await db.execute(
        select(WorkflowCollaborator).where(
            WorkflowCollaborator.workflow_id == workflow_id,
            WorkflowCollaborator.user_id == user_id,
        )
    )
    collaborator = result.scalar_one_or_none()

    if not collaborator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found",
        )

    await db.delete(collaborator)
    await db.commit()

    logger.info(
        "Collaborator removed",
        workflow_id=str(workflow_id),
        collaborator_id=str(user_id),
    )


# =============================================================================
# Public Templates
# =============================================================================


@router.get(
    "/templates",
    response_model=WorkflowListResponse,
    summary="List workflow templates",
    description="Get public workflow templates (no auth required)",
)
async def list_templates(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    tag: str | None = Query(None, description="Filter by tag"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User | None = Depends(get_optional_user),
) -> WorkflowListResponse:
    """List public workflow templates."""
    query = select(Workflow).where(
        Workflow.is_template == True,  # noqa: E712
        Workflow.is_published == True,  # noqa: E712
    )

    if tag:
        query = query.where(Workflow.tags.contains([tag]))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Workflow.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    workflows = result.scalars().all()

    return WorkflowListResponse(
        workflows=[_workflow_to_response(w) for w in workflows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 1,
    )


@router.post(
    "/templates/{template_id}/clone",
    response_model=WorkflowDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Clone template",
    description="Create a new workflow from a template",
)
async def clone_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user),
) -> WorkflowDetailResponse:
    """Clone a template to create a new workflow."""
    # Get template
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.nodes), selectinload(Workflow.edges))
        .where(
            Workflow.id == template_id,
            Workflow.is_template == True,  # noqa: E712
            Workflow.is_published == True,  # noqa: E712
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    # Create new workflow
    workflow = Workflow(
        user_id=current_user.id,
        name=f"{template.name} (Copy)",
        description=template.description,
        tags=template.tags.copy() if template.tags else [],
        variables=template.variables.copy() if template.variables else {},
        is_template=False,
        is_published=False,
    )
    db.add(workflow)
    await db.flush()

    # Clone nodes
    node_id_map: dict[UUID, UUID] = {}
    for template_node in template.nodes:
        node = WorkflowNode(
            workflow_id=workflow.id,
            type=template_node.type,
            label=template_node.label,
            description=template_node.description,
            position_x=template_node.position_x,
            position_y=template_node.position_y,
            config=template_node.config.copy() if template_node.config else {},
            inputs=template_node.inputs.copy() if template_node.inputs else {},
            outputs=template_node.outputs.copy() if template_node.outputs else {},
        )
        db.add(node)
        await db.flush()
        node_id_map[template_node.id] = node.id

    # Clone edges with updated node IDs
    for template_edge in template.edges:
        edge = WorkflowEdge(
            workflow_id=workflow.id,
            source_node_id=node_id_map[template_edge.source_node_id],
            target_node_id=node_id_map[template_edge.target_node_id],
            source_handle=template_edge.source_handle,
            target_handle=template_edge.target_handle,
            type=template_edge.type,
            condition=template_edge.condition,
        )
        db.add(edge)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.nodes), selectinload(Workflow.edges))
        .where(Workflow.id == workflow.id)
    )
    workflow = result.scalar_one()

    logger.info(
        "Template cloned",
        template_id=str(template_id),
        workflow_id=str(workflow.id),
        user_id=str(current_user.id),
    )

    return _workflow_to_detail_response(workflow)


# =============================================================================
# Helper Functions
# =============================================================================


async def _get_workflow_with_access(
    db: AsyncSession,
    workflow_id: UUID,
    user: User,
    require_edit: bool = False,
    require_owner: bool = False,
) -> Workflow:
    """Get workflow and verify user access."""
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow {workflow_id} not found",
        )

    # Check ownership
    is_owner = workflow.user_id == user.id

    if require_owner and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the workflow owner can perform this action",
        )

    if not is_owner:
        # Check collaboration
        result = await db.execute(
            select(WorkflowCollaborator).where(
                WorkflowCollaborator.workflow_id == workflow_id,
                WorkflowCollaborator.user_id == user.id,
            )
        )
        collaborator = result.scalar_one_or_none()

        if not collaborator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this workflow",
            )

        if require_edit and collaborator.role == "viewer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have edit permissions for this workflow",
            )

    return workflow


def _workflow_to_response(workflow: Workflow) -> WorkflowResponse:
    """Convert Workflow model to response schema."""
    return WorkflowResponse(
        id=workflow.id,
        user_id=workflow.user_id,
        name=workflow.name,
        description=workflow.description,
        version=workflow.version,
        is_published=workflow.is_published,
        is_template=workflow.is_template,
        tags=workflow.tags or [],
        variables=workflow.variables or {},
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        published_at=workflow.published_at,
    )


def _workflow_to_detail_response(workflow: Workflow) -> WorkflowDetailResponse:
    """Convert Workflow model to detail response schema."""
    return WorkflowDetailResponse(
        id=workflow.id,
        user_id=workflow.user_id,
        name=workflow.name,
        description=workflow.description,
        version=workflow.version,
        is_published=workflow.is_published,
        is_template=workflow.is_template,
        tags=workflow.tags or [],
        variables=workflow.variables or {},
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        published_at=workflow.published_at,
        nodes=[_node_to_response(n) for n in workflow.nodes],
        edges=[_edge_to_response(e) for e in workflow.edges],
    )


def _node_to_response(node: WorkflowNode) -> WorkflowNodeResponse:
    """Convert WorkflowNode model to response schema."""
    from src.api.schemas import NodePosition

    return WorkflowNodeResponse(
        id=node.id,
        workflow_id=node.workflow_id,
        type=node.type.value,
        label=node.label,
        description=node.description,
        position=NodePosition(x=float(node.position_x), y=float(node.position_y)),
        config=node.config or {},
        inputs=node.inputs or {},
        outputs=node.outputs or {},
        created_at=node.created_at,
        updated_at=node.updated_at,
    )


def _edge_to_response(edge: WorkflowEdge) -> WorkflowEdgeResponse:
    """Convert WorkflowEdge model to response schema."""
    return WorkflowEdgeResponse(
        id=edge.id,
        workflow_id=edge.workflow_id,
        source_node_id=edge.source_node_id,
        target_node_id=edge.target_node_id,
        source_handle=edge.source_handle,
        target_handle=edge.target_handle,
        type=edge.type.value if hasattr(edge.type, "value") else edge.type,
        condition=edge.condition,
        created_at=edge.created_at,
    )


def _execution_to_response(execution: WorkflowExecution) -> WorkflowExecutionResponse:
    """Convert WorkflowExecution model to response schema."""
    return WorkflowExecutionResponse(
        id=execution.id,
        workflow_id=execution.workflow_id,
        user_id=execution.user_id,
        status=execution.status.value,
        current_node_id=execution.current_node_id,
        input_data=execution.input_data or {},
        output_data=execution.output_data,
        error_message=execution.error_message,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
        created_at=execution.created_at,
        duration_ms=execution.duration_ms,
    )


def _execution_to_detail_response(
    execution: WorkflowExecution,
) -> WorkflowExecutionDetailResponse:
    """Convert WorkflowExecution model to detail response schema."""
    from src.api.schemas import ExecutionLogResponse

    logs = []
    for log in execution.logs:
        logs.append(
            ExecutionLogResponse(
                id=log.id,
                execution_id=log.execution_id,
                node_id=log.node_id,
                status=log.status.value,
                input_data=log.input_data,
                output_data=log.output_data,
                error_message=log.error_message,
                started_at=log.started_at,
                completed_at=log.completed_at,
                duration_ms=log.duration_ms,
            )
        )

    return WorkflowExecutionDetailResponse(
        id=execution.id,
        workflow_id=execution.workflow_id,
        user_id=execution.user_id,
        status=execution.status.value,
        current_node_id=execution.current_node_id,
        input_data=execution.input_data or {},
        output_data=execution.output_data,
        error_message=execution.error_message,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
        created_at=execution.created_at,
        duration_ms=execution.duration_ms,
        logs=logs,
    )


def _collaborator_to_response(
    collaborator: WorkflowCollaborator,
) -> CollaboratorResponse:
    """Convert WorkflowCollaborator model to response schema."""
    return CollaboratorResponse(
        id=collaborator.id,
        workflow_id=collaborator.workflow_id,
        user_id=collaborator.user_id,
        role=collaborator.role,
        joined_at=collaborator.joined_at,
        last_active_at=collaborator.last_active_at,
        cursor_position=collaborator.cursor_position,
    )
