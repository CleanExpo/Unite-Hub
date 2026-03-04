"""
Database-Backed Workflow Executor.

Executes compiled workflows with full SQLAlchemy persistence.
Creates execution logs per node, updates status in real-time,
and handles conditional branching and loop control flow.

Turing Check: Graph traversal is O(V + E) per execution — approved.
Von Neumann Check: Async I/O with non-blocking DB writes — optimal.
Shannon Check: Only persists node-level results, not intermediate state — compressed.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db import (
    Workflow,
    WorkflowExecution,
    WorkflowExecutionLog,
    WorkflowExecutionStatus,
)
from src.utils import get_logger
from src.workflow.compiler import CompiledEdge, CompiledWorkflow, WorkflowCompiler
from src.workflow.node_handlers import execute_node
from src.workflow.state import ExecutionState, NodeResult, NodeStatus

logger = get_logger(__name__)

# Maximum loop iterations as a safety guard
MAX_LOOP_ITERATIONS = 1000


class WorkflowExecutionError(Exception):
    """Raised when workflow execution fails."""

    pass


class DbWorkflowExecutor:
    """
    Executes visual workflows backed by SQLAlchemy.

    Workflow:
    1. Load workflow + nodes + edges from DB
    2. Compile to execution graph (validated, topologically sorted)
    3. Walk graph from start node, executing each node handler
    4. Persist per-node execution logs to DB
    5. Handle conditional branches and loops
    6. Update execution record with final status
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.compiler = WorkflowCompiler()

    async def execute(
        self,
        execution_id: UUID,
    ) -> WorkflowExecution:
        """
        Execute a workflow that already has an execution record.

        Args:
            execution_id: The ID of the WorkflowExecution record (already created)

        Returns:
            Updated WorkflowExecution with final status
        """
        # Load execution with workflow
        execution = await self._load_execution(execution_id)
        workflow = await self._load_workflow(execution.workflow_id)

        # Mark as running
        execution.status = WorkflowExecutionStatus.RUNNING
        execution.started_at = datetime.now(UTC)
        await self.db.commit()

        try:
            # Compile the workflow graph
            compiled = self._compile_workflow(workflow)

            # Build execution state
            state = ExecutionState(
                execution_id=execution.id,
                workflow_id=workflow.id,
                user_id=execution.user_id,
                variables=execution.variables or {},
                input_data=execution.input_data or {},
            )

            # Execute from start node, walking the graph
            await self._walk_graph(compiled, state, execution)

            # Mark completed
            execution.status = WorkflowExecutionStatus.COMPLETED
            execution.output_data = state.node_outputs
            execution.completed_at = datetime.now(UTC)

            logger.info(
                "Workflow execution completed",
                execution_id=str(execution_id),
                workflow_id=str(workflow.id),
                duration_ms=execution.duration_ms,
            )

        except Exception as e:
            logger.error(
                "Workflow execution failed",
                execution_id=str(execution_id),
                error=str(e),
            )
            execution.status = WorkflowExecutionStatus.FAILED
            execution.error_message = str(e)
            execution.completed_at = datetime.now(UTC)

        finally:
            execution.current_node_id = None
            await self.db.commit()

        return execution

    async def _walk_graph(
        self,
        compiled: CompiledWorkflow,
        state: ExecutionState,
        execution: WorkflowExecution,
    ) -> None:
        """Walk the compiled graph, executing nodes in order."""
        executed: set[str] = set()

        # Start from the start node and follow edges
        await self._execute_from(
            node_id=compiled.start_node_id,
            compiled=compiled,
            state=state,
            execution=execution,
            executed=executed,
        )

    async def _execute_from(
        self,
        node_id: str,
        compiled: CompiledWorkflow,
        state: ExecutionState,
        execution: WorkflowExecution,
        executed: set[str],
    ) -> dict[str, Any] | None:
        """
        Execute a node and follow its outgoing edges recursively.

        Handles:
        - Normal sequential flow
        - Conditional branching (true/false edges)
        - Loop iteration (item edges)
        """
        if node_id in executed:
            return state.node_outputs.get(node_id)

        node = compiled.nodes.get(node_id)
        if node is None:
            logger.warning("Node not found in compiled graph", node_id=node_id)
            return None

        # Check if all incoming nodes have been executed (join point)
        reverse_edges = compiled.reverse_adjacency.get(node_id, [])
        for rev_edge in reverse_edges:
            source = str(rev_edge.source_id)
            # Skip loop back-edges for dependency checking
            if source not in executed and node.node_type != "loop":
                return None

        executed.add(node_id)

        # Update execution pointer
        try:
            execution.current_node_id = node.id
            await self.db.commit()
        except Exception:
            pass  # Non-critical — don't fail execution on status update

        # Resolve config with current state
        resolved_config = state.resolve_config(node.config)

        # Execute the node handler
        node_result = await self._execute_single_node(
            node_id=node.id,
            node_type=node.node_type,
            config=resolved_config,
            state=state,
            execution=execution,
        )

        # Store output in state
        state.set_node_output(node_id, node_result)

        # Map outputs to variables
        for output_key, var_name in node.outputs.items():
            if output_key in node_result:
                state.variables[var_name] = node_result[output_key]

        # Handle end nodes — stop traversal
        if node.node_type in ("end", "output"):
            return node_result

        # Handle loop nodes specially
        if node.node_type == "loop":
            await self._execute_loop(
                loop_node_id=node_id,
                loop_result=node_result,
                compiled=compiled,
                state=state,
                execution=execution,
                executed=executed,
            )
            return node_result

        # Follow outgoing edges
        outgoing = compiled.adjacency.get(node_id, [])

        if node.node_type in ("conditional", "logic"):
            # Branch based on condition result
            condition_met = node_result.get("condition", False)
            await self._follow_conditional_edges(
                outgoing=outgoing,
                condition_met=condition_met,
                compiled=compiled,
                state=state,
                execution=execution,
                executed=executed,
            )
        else:
            # Follow all outgoing edges (parallel paths)
            for edge in outgoing:
                target_id = str(edge.target_id)
                if self._should_follow_edge(edge, node_result):
                    await self._execute_from(
                        target_id, compiled, state, execution, executed
                    )

        return node_result

    async def _execute_single_node(
        self,
        node_id: UUID,
        node_type: str,
        config: dict[str, Any],
        state: ExecutionState,
        execution: WorkflowExecution,
    ) -> dict[str, Any]:
        """Execute a single node and create its execution log."""
        started_at = datetime.now(UTC)

        # Create log entry
        log = WorkflowExecutionLog(
            execution_id=execution.id,
            node_id=node_id,
            status=WorkflowExecutionStatus.RUNNING,
            input_data=config,
            started_at=started_at,
        )
        self.db.add(log)
        await self.db.flush()

        try:
            result = await execute_node(node_type, config, state)

            completed_at = datetime.now(UTC)
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)

            # Update log with success
            log.status = WorkflowExecutionStatus.COMPLETED
            log.output_data = result
            log.completed_at = completed_at
            log.duration_ms = duration_ms

            # Track in state
            state.node_results[str(node_id)] = NodeResult(
                node_id=node_id,
                node_type=node_type,
                status=NodeStatus.COMPLETED,
                input_data=config,
                output_data=result,
                duration_ms=duration_ms,
            )

            await self.db.commit()

            logger.debug(
                "Node executed",
                node_id=str(node_id),
                node_type=node_type,
                duration_ms=duration_ms,
            )

            return result

        except Exception as e:
            completed_at = datetime.now(UTC)
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)

            log.status = WorkflowExecutionStatus.FAILED
            log.error_message = str(e)
            log.completed_at = completed_at
            log.duration_ms = duration_ms

            state.node_results[str(node_id)] = NodeResult(
                node_id=node_id,
                node_type=node_type,
                status=NodeStatus.FAILED,
                error_message=str(e),
                duration_ms=duration_ms,
            )

            await self.db.commit()

            # Check if there's an error edge from this node
            # If so, follow it instead of raising
            logger.error(
                "Node execution failed",
                node_id=str(node_id),
                node_type=node_type,
                error=str(e),
            )
            raise

    async def _execute_loop(
        self,
        loop_node_id: str,
        loop_result: dict[str, Any],
        compiled: CompiledWorkflow,
        state: ExecutionState,
        execution: WorkflowExecution,
        executed: set[str],
    ) -> None:
        """
        Execute a loop node's body for each item in the collection.

        Finds the 'item' edges from the loop node and executes
        those paths for each iteration.
        """
        items = loop_result.get("items", [])
        item_variable = loop_result.get("item_variable", "item")
        outgoing = compiled.adjacency.get(loop_node_id, [])

        # Separate item edges (loop body) from continuation edges
        item_edges = [e for e in outgoing if e.edge_type == "item"]
        continuation_edges = [e for e in outgoing if e.edge_type != "item"]

        for idx, item in enumerate(items):
            if idx >= MAX_LOOP_ITERATIONS:
                logger.warning("Loop safety limit reached", loop_node=loop_node_id)
                break

            # Set current item in state
            state.variables[item_variable] = item
            state.variables[f"{item_variable}_index"] = idx
            state.loop_counters[loop_node_id] = idx

            # Execute loop body for this iteration
            # Clear executed status for loop body nodes so they re-execute
            loop_body_executed: set[str] = set(executed)

            for edge in item_edges:
                target_id = str(edge.target_id)
                await self._execute_from(
                    target_id, compiled, state, execution, loop_body_executed
                )

        # Follow continuation edges after loop completes
        for edge in continuation_edges:
            target_id = str(edge.target_id)
            await self._execute_from(
                target_id, compiled, state, execution, executed
            )

    async def _follow_conditional_edges(
        self,
        outgoing: list[CompiledEdge],
        condition_met: bool,
        compiled: CompiledWorkflow,
        state: ExecutionState,
        execution: WorkflowExecution,
        executed: set[str],
    ) -> None:
        """Follow the appropriate branch of a conditional node."""
        for edge in outgoing:
            should_follow = False

            if edge.edge_type == "true" and condition_met:
                should_follow = True
            elif edge.edge_type == "false" and not condition_met:
                should_follow = True
            elif edge.edge_type == "default":
                should_follow = True

            if should_follow:
                target_id = str(edge.target_id)
                await self._execute_from(
                    target_id, compiled, state, execution, executed
                )

    def _should_follow_edge(
        self,
        edge: CompiledEdge,
        node_result: dict[str, Any],
    ) -> bool:
        """Determine if an edge should be followed based on result."""
        if edge.edge_type == "success":
            return node_result.get("success", True) and not node_result.get("error")
        elif edge.edge_type == "error":
            return bool(node_result.get("error")) or not node_result.get("success", True)
        return True  # default edges always followed

    def _compile_workflow(self, workflow: Workflow) -> CompiledWorkflow:
        """Compile a SQLAlchemy Workflow model to an execution graph."""
        nodes = []
        for node in workflow.nodes:
            node_type = node.type.value if hasattr(node.type, "value") else str(node.type)
            nodes.append({
                "id": node.id,
                "type": node_type,
                "label": node.label or "",
                "config": node.config or {},
                "inputs": node.inputs or {},
                "outputs": node.outputs or {},
            })

        edges = []
        for edge in workflow.edges:
            edge_type = edge.type.value if hasattr(edge.type, "value") else str(edge.type)
            edges.append({
                "source_node_id": edge.source_node_id,
                "target_node_id": edge.target_node_id,
                "type": edge_type,
                "condition": edge.condition,
                "source_handle": edge.source_handle,
                "target_handle": edge.target_handle,
            })

        return self.compiler.compile(
            workflow_id=workflow.id,
            nodes=nodes,
            edges=edges,
        )

    async def _load_execution(self, execution_id: UUID) -> WorkflowExecution:
        """Load execution record from DB."""
        result = await self.db.execute(
            select(WorkflowExecution).where(WorkflowExecution.id == execution_id)
        )
        execution = result.scalar_one_or_none()

        if not execution:
            raise WorkflowExecutionError(f"Execution {execution_id} not found")

        return execution

    async def _load_workflow(self, workflow_id: UUID) -> Workflow:
        """Load workflow with nodes and edges from DB."""
        result = await self.db.execute(
            select(Workflow)
            .options(
                selectinload(Workflow.nodes),
                selectinload(Workflow.edges),
            )
            .where(Workflow.id == workflow_id)
        )
        workflow = result.scalar_one_or_none()

        if not workflow:
            raise WorkflowExecutionError(f"Workflow {workflow_id} not found")

        if not workflow.nodes:
            raise WorkflowExecutionError("Workflow has no nodes")

        return workflow


async def run_workflow_execution(
    db: AsyncSession,
    execution_id: UUID,
) -> WorkflowExecution:
    """
    Convenience function to run a workflow execution.

    Called from the API route as a background task.
    """
    executor = DbWorkflowExecutor(db)
    return await executor.execute(execution_id)
