"""Pydantic models for visual workflows."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


class NodeType(str, Enum):
    """Supported node types in visual workflows."""

    START = "start"
    END = "end"
    LLM = "llm"
    AGENT = "agent"
    TOOL = "tool"
    CONDITIONAL = "conditional"
    LOOP = "loop"
    KNOWLEDGE = "knowledge"
    HTTP = "http"
    CODE = "code"
    VERIFICATION = "verification"


class EdgeType(str, Enum):
    """Types of connections between nodes."""

    DEFAULT = "default"
    CONDITIONAL_TRUE = "true"
    CONDITIONAL_FALSE = "false"
    ON_SUCCESS = "success"
    ON_ERROR = "error"
    LOOP_ITEM = "item"


class NodePosition(BaseModel):
    """Canvas position for visual rendering."""

    x: float
    y: float


class NodeConfig(BaseModel):
    """Base configuration for all node types."""

    id: str
    type: NodeType
    position: NodePosition
    label: str
    description: str | None = None

    # Type-specific configuration
    config: dict[str, Any] = Field(default_factory=dict)

    # Input/output variable mapping
    inputs: dict[str, str] = Field(default_factory=dict)
    outputs: dict[str, str] = Field(default_factory=dict)

    # Metadata for UI
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkflowEdge(BaseModel):
    """Connection between nodes."""

    id: str
    source_node_id: str
    target_node_id: str
    source_handle: str | None = None
    target_handle: str | None = None
    type: EdgeType = EdgeType.DEFAULT
    condition: str | None = None


class WorkflowDefinition(BaseModel):
    """Complete workflow definition."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str | None = None
    version: str = "1.0.0"

    # Visual structure
    nodes: list[NodeConfig]
    edges: list[WorkflowEdge]

    # Global workflow configuration
    variables: dict[str, Any] = Field(default_factory=dict)

    # Compatibility with skills system
    skill_compatibility: list[str] = Field(default_factory=list)

    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    created_by: str | None = None
    tags: list[str] = Field(default_factory=list)
    is_published: bool = False


class ExecutionStatus(str, Enum):
    """Workflow execution status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExecutionContext(BaseModel):
    """Runtime context for workflow execution."""

    execution_id: str
    workflow_id: str
    user_id: str | None = None

    # Variable storage
    variables: dict[str, Any] = Field(default_factory=dict)

    # Execution state
    current_node_id: str | None = None
    completed_nodes: set[str] = Field(default_factory=set)
    failed_nodes: set[str] = Field(default_factory=set)
    node_outputs: dict[str, Any] = Field(default_factory=dict)

    # Logs
    logs: list[dict[str, Any]] = Field(default_factory=list)

    started_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    completed_at: str | None = None
    status: ExecutionStatus = ExecutionStatus.PENDING


class WorkflowExecutionRequest(BaseModel):
    """Request to execute a workflow."""

    workflow_id: str
    input_variables: dict[str, Any] = Field(default_factory=dict)
    user_id: str | None = None


class WorkflowExecutionResponse(BaseModel):
    """Response from workflow execution."""

    execution_id: str
    status: ExecutionStatus
    message: str
