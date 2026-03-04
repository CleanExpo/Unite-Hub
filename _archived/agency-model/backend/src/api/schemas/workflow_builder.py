"""
Pydantic schemas for Workflow Builder API.

Request/response validation models for workflow CRUD operations.
Scientific Luxury Design System compliant.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# =============================================================================
# Node Position
# =============================================================================


class NodePosition(BaseModel):
    """Position coordinates for a workflow node."""

    x: float = Field(default=0, description="X coordinate on canvas")
    y: float = Field(default=0, description="Y coordinate on canvas")


# =============================================================================
# Workflow Node Schemas
# =============================================================================


class WorkflowNodeBase(BaseModel):
    """Base schema for workflow nodes."""

    type: str = Field(..., description="Node type (trigger, action, logic, agent, output)")
    label: str = Field(..., min_length=1, max_length=255, description="Node label")
    description: str | None = Field(None, description="Node description")
    position: NodePosition = Field(default_factory=NodePosition)
    config: dict[str, Any] = Field(default_factory=dict, description="Node configuration")
    inputs: dict[str, Any] = Field(default_factory=dict, description="Input mappings")
    outputs: dict[str, Any] = Field(default_factory=dict, description="Output mappings")


class WorkflowNodeCreate(WorkflowNodeBase):
    """Schema for creating a workflow node."""

    pass


class WorkflowNodeUpdate(BaseModel):
    """Schema for updating a workflow node."""

    type: str | None = None
    label: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    position: NodePosition | None = None
    config: dict[str, Any] | None = None
    inputs: dict[str, Any] | None = None
    outputs: dict[str, Any] | None = None


class WorkflowNodeResponse(WorkflowNodeBase):
    """Schema for workflow node response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Workflow Edge Schemas
# =============================================================================


class WorkflowEdgeBase(BaseModel):
    """Base schema for workflow edges."""

    source_node_id: UUID = Field(..., description="Source node ID")
    target_node_id: UUID = Field(..., description="Target node ID")
    source_handle: str | None = Field(None, description="Source handle identifier")
    target_handle: str | None = Field(None, description="Target handle identifier")
    type: str = Field(default="default", description="Edge type")
    condition: str | None = Field(None, description="Condition expression for conditional edges")


class WorkflowEdgeCreate(WorkflowEdgeBase):
    """Schema for creating a workflow edge."""

    pass


class WorkflowEdgeResponse(WorkflowEdgeBase):
    """Schema for workflow edge response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    created_at: datetime


# =============================================================================
# Workflow Schemas
# =============================================================================


class WorkflowBase(BaseModel):
    """Base schema for workflows."""

    name: str = Field(..., min_length=1, max_length=255, description="Workflow name")
    description: str | None = Field(None, description="Workflow description")
    tags: list[str] = Field(default_factory=list, description="Workflow tags")
    variables: dict[str, Any] = Field(default_factory=dict, description="Workflow variables")


class WorkflowCreate(WorkflowBase):
    """Schema for creating a workflow."""

    nodes: list[WorkflowNodeCreate] = Field(default_factory=list)
    edges: list[WorkflowEdgeCreate] = Field(default_factory=list)


class WorkflowUpdate(BaseModel):
    """Schema for updating a workflow."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] | None = None
    variables: dict[str, Any] | None = None
    is_published: bool | None = None


class WorkflowResponse(WorkflowBase):
    """Schema for workflow response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None
    version: str
    is_published: bool
    is_template: bool
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class WorkflowDetailResponse(WorkflowResponse):
    """Schema for detailed workflow response with nodes and edges."""

    nodes: list[WorkflowNodeResponse] = Field(default_factory=list)
    edges: list[WorkflowEdgeResponse] = Field(default_factory=list)


class WorkflowListResponse(BaseModel):
    """Schema for paginated workflow list."""

    workflows: list[WorkflowResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# =============================================================================
# Workflow Execution Schemas
# =============================================================================


class WorkflowExecuteRequest(BaseModel):
    """Schema for workflow execution request."""

    input_data: dict[str, Any] = Field(default_factory=dict, description="Input data for execution")
    variables: dict[str, Any] = Field(default_factory=dict, description="Variable overrides")


class WorkflowExecutionResponse(BaseModel):
    """Schema for workflow execution response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    user_id: UUID | None
    status: str
    current_node_id: UUID | None
    input_data: dict[str, Any]
    output_data: dict[str, Any] | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    duration_ms: int | None


class ExecutionLogResponse(BaseModel):
    """Schema for execution log entry response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    execution_id: UUID
    node_id: UUID
    status: str
    input_data: dict[str, Any] | None
    output_data: dict[str, Any] | None
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None
    duration_ms: int | None


class WorkflowExecutionDetailResponse(WorkflowExecutionResponse):
    """Schema for detailed execution response with logs."""

    logs: list[ExecutionLogResponse] = Field(default_factory=list)


# =============================================================================
# Collaboration Schemas
# =============================================================================


class CollaboratorResponse(BaseModel):
    """Schema for workflow collaborator response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workflow_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    last_active_at: datetime | None
    cursor_position: dict[str, Any] | None


class CollaboratorAddRequest(BaseModel):
    """Schema for adding a collaborator."""

    user_id: UUID
    role: str = Field(default="editor", description="Collaborator role (editor, viewer)")


# =============================================================================
# Canvas State Schema (for real-time sync)
# =============================================================================


class CanvasStateUpdate(BaseModel):
    """Schema for canvas state updates (Yjs sync)."""

    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    viewport: dict[str, float] | None = None
