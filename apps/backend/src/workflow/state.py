"""
Workflow Execution State.

Pydantic models for tracking execution state through a workflow graph.
Passed between nodes during execution, accumulating results.
"""

from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class NodeStatus(str, Enum):
    """Status of a single node execution."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class NodeResult(BaseModel):
    """Result from executing a single workflow node."""

    node_id: UUID
    node_type: str
    status: NodeStatus = NodeStatus.PENDING
    input_data: dict[str, Any] = Field(default_factory=dict)
    output_data: dict[str, Any] = Field(default_factory=dict)
    error_message: str | None = None
    duration_ms: int | None = None


class ExecutionState(BaseModel):
    """
    Mutable state passed through the workflow execution graph.

    Accumulates outputs from each node, tracks variables, and
    provides the data context for downstream node evaluation.
    """

    execution_id: UUID
    workflow_id: UUID
    user_id: UUID | None = None

    # Global variables available to all nodes
    variables: dict[str, Any] = Field(default_factory=dict)

    # Input data provided when execution was triggered
    input_data: dict[str, Any] = Field(default_factory=dict)

    # Accumulated outputs keyed by node_id string
    node_outputs: dict[str, Any] = Field(default_factory=dict)

    # Results per node
    node_results: dict[str, NodeResult] = Field(default_factory=dict)

    # Current node being executed
    current_node_id: UUID | None = None

    # Error state
    error: str | None = None

    # Loop tracking: maps loop node_id -> current iteration index
    loop_counters: dict[str, int] = Field(default_factory=dict)

    def get_node_output(self, node_id: str) -> Any:
        """Retrieve the output of a previously executed node."""
        return self.node_outputs.get(node_id)

    def set_node_output(self, node_id: str, output: Any) -> None:
        """Store the output of an executed node."""
        self.node_outputs[node_id] = output

    def resolve_variable(self, expression: str) -> Any:
        """
        Resolve a variable expression like '{{input.query}}' or '{{node_abc.result}}'.

        Supports:
        - {{input.<key>}}       -> self.input_data[key]
        - {{vars.<key>}}        -> self.variables[key]
        - {{<node_id>.<key>}}   -> self.node_outputs[node_id][key]
        """
        expr = expression.strip()
        if not (expr.startswith("{{") and expr.endswith("}}")):
            return expression

        path = expr[2:-2].strip()
        parts = path.split(".", 1)

        if len(parts) < 2:
            # Single token - check variables then input
            return self.variables.get(parts[0], self.input_data.get(parts[0]))

        source, key = parts

        if source == "input":
            return self.input_data.get(key)
        elif source == "vars":
            return self.variables.get(key)
        else:
            # Assume source is a node_id
            node_output = self.node_outputs.get(source, {})
            if isinstance(node_output, dict):
                return node_output.get(key)
            return node_output

    def resolve_config(self, config: dict[str, Any]) -> dict[str, Any]:
        """Resolve all variable expressions in a config dict."""
        resolved: dict[str, Any] = {}
        for k, v in config.items():
            if isinstance(v, str) and "{{" in v:
                resolved[k] = self.resolve_variable(v)
            elif isinstance(v, dict):
                resolved[k] = self.resolve_config(v)
            elif isinstance(v, list):
                resolved[k] = [
                    self.resolve_variable(item) if isinstance(item, str) and "{{" in item else item
                    for item in v
                ]
            else:
                resolved[k] = v
        return resolved
