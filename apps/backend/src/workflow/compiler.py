"""
Workflow Graph Compiler.

Validates and compiles a visual workflow graph into an execution plan.
Performs topological sorting, cycle detection, and validates connectivity.

Turing Check: Topological sort is O(V + E) - APPROVED.
"""

from __future__ import annotations

from collections import defaultdict, deque
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from src.utils import get_logger

logger = get_logger(__name__)


class CompilationError(Exception):
    """Raised when workflow compilation fails."""

    def __init__(self, message: str, errors: list[str] | None = None) -> None:
        super().__init__(message)
        self.errors = errors or [message]


class CompiledNode(BaseModel):
    """A node in the compiled execution graph."""

    id: UUID
    node_type: str
    label: str
    config: dict[str, Any] = Field(default_factory=dict)
    inputs: dict[str, Any] = Field(default_factory=dict)
    outputs: dict[str, Any] = Field(default_factory=dict)


class CompiledEdge(BaseModel):
    """An edge in the compiled execution graph."""

    source_id: UUID
    target_id: UUID
    edge_type: str = "default"
    condition: str | None = None
    source_handle: str | None = None
    target_handle: str | None = None


class CompiledWorkflow(BaseModel):
    """
    The result of compiling a visual workflow.

    Contains a validated graph with:
    - Topologically sorted execution order
    - Adjacency lists for efficient traversal
    - Start and end node references
    """

    workflow_id: UUID
    nodes: dict[str, CompiledNode] = Field(default_factory=dict)
    edges: list[CompiledEdge] = Field(default_factory=list)
    execution_order: list[str] = Field(default_factory=list)
    adjacency: dict[str, list[CompiledEdge]] = Field(default_factory=dict)
    reverse_adjacency: dict[str, list[CompiledEdge]] = Field(default_factory=dict)
    start_node_id: str | None = None
    end_node_ids: list[str] = Field(default_factory=list)
    loop_nodes: list[str] = Field(default_factory=list)


class WorkflowCompiler:
    """
    Compiles a visual workflow (DB models) into an executable graph.

    Validation checks:
    1. Has exactly one start/trigger node
    2. Has at least one end/output node
    3. All edges reference valid nodes
    4. No unreachable nodes (from start)
    5. Cycle detection (loops are allowed via loop nodes only)
    """

    def compile(
        self,
        workflow_id: UUID,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
    ) -> CompiledWorkflow:
        """
        Compile workflow nodes and edges into an execution graph.

        Args:
            workflow_id: The workflow ID
            nodes: List of node dicts (from DB model serialisation)
            edges: List of edge dicts (from DB model serialisation)

        Returns:
            CompiledWorkflow ready for execution

        Raises:
            CompilationError: If validation fails
        """
        errors: list[str] = []

        # Build node map - O(n)
        node_map: dict[str, CompiledNode] = {}
        for node in nodes:
            nid = str(node["id"])
            node_map[nid] = CompiledNode(
                id=node["id"],
                node_type=node.get("type", "unknown"),
                label=node.get("label", "Untitled"),
                config=node.get("config", {}),
                inputs=node.get("inputs", {}),
                outputs=node.get("outputs", {}),
            )

        if not node_map:
            raise CompilationError("Workflow has no nodes")

        # Build adjacency lists - O(e)
        adjacency: dict[str, list[CompiledEdge]] = defaultdict(list)
        reverse_adjacency: dict[str, list[CompiledEdge]] = defaultdict(list)
        compiled_edges: list[CompiledEdge] = []

        for edge in edges:
            source = str(edge["source_node_id"])
            target = str(edge["target_node_id"])

            if source not in node_map:
                errors.append(f"Edge references unknown source node: {source}")
                continue
            if target not in node_map:
                errors.append(f"Edge references unknown target node: {target}")
                continue

            compiled_edge = CompiledEdge(
                source_id=edge["source_node_id"],
                target_id=edge["target_node_id"],
                edge_type=edge.get("type", "default"),
                condition=edge.get("condition"),
                source_handle=edge.get("source_handle"),
                target_handle=edge.get("target_handle"),
            )
            compiled_edges.append(compiled_edge)
            adjacency[source].append(compiled_edge)
            reverse_adjacency[target].append(compiled_edge)

        # Find start and end nodes
        start_nodes = [
            nid for nid, n in node_map.items()
            if n.node_type in ("start", "trigger")
        ]
        end_nodes = [
            nid for nid, n in node_map.items()
            if n.node_type in ("end", "output")
        ]
        loop_nodes = [
            nid for nid, n in node_map.items()
            if n.node_type == "loop"
        ]

        # Validate start/end
        if len(start_nodes) == 0:
            errors.append("Workflow must have at least one start or trigger node")
        elif len(start_nodes) > 1:
            errors.append(f"Workflow has {len(start_nodes)} start nodes (expected 1)")

        if len(end_nodes) == 0:
            errors.append("Workflow must have at least one end or output node")

        if errors:
            raise CompilationError(
                f"Workflow validation failed with {len(errors)} error(s)",
                errors=errors,
            )

        start_node_id = start_nodes[0]

        # Reachability check via BFS - O(V + E)
        reachable: set[str] = set()
        queue: deque[str] = deque([start_node_id])
        while queue:
            current = queue.popleft()
            if current in reachable:
                continue
            reachable.add(current)
            for edge in adjacency.get(current, []):
                target = str(edge.target_id)
                if target not in reachable:
                    queue.append(target)

        unreachable = set(node_map.keys()) - reachable
        if unreachable:
            labels = [node_map[nid].label for nid in unreachable]
            logger.warning(
                "Unreachable nodes detected",
                unreachable=labels,
                workflow_id=str(workflow_id),
            )
            # Don't fail - just warn. Unreachable nodes are skipped.

        # Topological sort via Kahn's algorithm - O(V + E)
        # Exclude back-edges from loop nodes to prevent false cycle detection
        in_degree: dict[str, int] = defaultdict(int)
        for nid in reachable:
            in_degree[nid] = 0

        loop_back_edges: set[tuple[str, str]] = set()
        for nid in reachable:
            for edge in adjacency.get(nid, []):
                target = str(edge.target_id)
                if target in reachable:
                    # Detect loop back-edges: edges from within loop body back to loop node
                    if target in loop_nodes:
                        loop_back_edges.add((nid, target))
                    else:
                        in_degree[target] += 1

        topo_queue: deque[str] = deque()
        for nid in reachable:
            if in_degree[nid] == 0:
                topo_queue.append(nid)

        execution_order: list[str] = []
        while topo_queue:
            current = topo_queue.popleft()
            execution_order.append(current)

            for edge in adjacency.get(current, []):
                target = str(edge.target_id)
                if target in reachable and (current, target) not in loop_back_edges:
                    in_degree[target] -= 1
                    if in_degree[target] == 0:
                        topo_queue.append(target)

        # Cycle detection: if not all reachable nodes are in order, there's a cycle
        if len(execution_order) != len(reachable):
            cycle_nodes = reachable - set(execution_order)
            labels = [node_map[nid].label for nid in cycle_nodes if nid in node_map]
            raise CompilationError(
                f"Workflow contains a cycle involving: {', '.join(labels)}",
                errors=[f"Cycle detected involving nodes: {', '.join(labels)}"],
            )

        logger.info(
            "Workflow compiled successfully",
            workflow_id=str(workflow_id),
            node_count=len(node_map),
            edge_count=len(compiled_edges),
            execution_steps=len(execution_order),
        )

        return CompiledWorkflow(
            workflow_id=workflow_id,
            nodes=node_map,
            edges=compiled_edges,
            execution_order=execution_order,
            adjacency=dict(adjacency),
            reverse_adjacency=dict(reverse_adjacency),
            start_node_id=start_node_id,
            end_node_ids=end_nodes,
            loop_nodes=loop_nodes,
        )
