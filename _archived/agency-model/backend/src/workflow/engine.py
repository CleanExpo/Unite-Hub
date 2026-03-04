"""Workflow execution engine."""

import re
import uuid
from datetime import datetime
from typing import Any

from src.agents.orchestrator import OrchestratorAgent
from src.tools.registry import get_registry
from src.utils import get_logger
from src.workflow.models import (
    EdgeType,
    ExecutionContext,
    ExecutionStatus,
    NodeConfig,
    NodeType,
    WorkflowDefinition,
)
from src.workflow.storage import WorkflowStorage

logger = get_logger(__name__)


class WorkflowEngine:
    """Executes visual workflows by coordinating node execution."""

    def __init__(self) -> None:
        self.storage = WorkflowStorage()
        self.orchestrator = OrchestratorAgent()
        self.tool_registry = get_registry()

    async def start_execution(
        self,
        workflow: WorkflowDefinition,
        input_variables: dict[str, Any],
        user_id: str | None = None,
    ) -> str:
        """Start workflow execution and return execution ID."""
        execution_id = str(uuid.uuid4())

        context = ExecutionContext(
            execution_id=execution_id,
            workflow_id=workflow.id,
            user_id=user_id,
            variables={**workflow.variables, **input_variables},
            status=ExecutionStatus.PENDING,
        )

        # Save initial execution state
        await self.storage.create_execution(context)

        logger.info(
            "Started workflow execution",
            execution_id=execution_id,
            workflow_id=workflow.id,
        )

        return execution_id

    async def execute(self, execution_id: str) -> ExecutionContext:
        """Execute the workflow."""
        context = await self.storage.get_execution(execution_id)
        if not context:
            raise ValueError(f"Execution {execution_id} not found")

        workflow = await self.storage.get_workflow(context.workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {context.workflow_id} not found")

        context.status = ExecutionStatus.RUNNING
        await self.storage.update_execution(execution_id, context)

        try:
            # Find start node
            start_node = next(
                (n for n in workflow.nodes if n.type == NodeType.START),
                None,
            )

            if not start_node:
                raise ValueError("Workflow has no start node")

            # Execute from start node
            await self._execute_node(start_node, workflow, context)

            context.status = ExecutionStatus.COMPLETED
            context.completed_at = datetime.now().isoformat()

        except Exception as e:
            logger.error("Workflow execution failed", error=str(e))
            context.status = ExecutionStatus.FAILED
            context.completed_at = datetime.now().isoformat()
            await self._add_log(context, "system", f"Execution failed: {str(e)}")

        finally:
            await self.storage.update_execution(execution_id, context)

        return context

    async def _execute_node(
        self,
        node: NodeConfig,
        workflow: WorkflowDefinition,
        context: ExecutionContext,
    ) -> Any:
        """Execute a single node."""
        context.current_node_id = node.id
        await self.storage.update_execution(context.execution_id, context)
        await self._add_log(
            context, node.id, f"Executing {node.type.value} node: {node.label}"
        )

        try:
            # Resolve input variables
            resolved_inputs = self._resolve_variables(node.inputs, context.variables)

            # Execute based on node type
            result: dict[str, Any] = {}

            if node.type == NodeType.START:
                result = {"started": True}

            elif node.type == NodeType.END:
                await self._add_log(context, node.id, "Reached end node")
                context.completed_nodes.add(node.id)
                return None

            elif node.type == NodeType.LLM:
                result = await self._execute_llm_node(node, resolved_inputs)

            elif node.type == NodeType.AGENT:
                result = await self._execute_agent_node(node, resolved_inputs)

            elif node.type == NodeType.TOOL:
                result = await self._execute_tool_node(node, resolved_inputs)

            elif node.type == NodeType.CONDITIONAL:
                result = await self._execute_conditional_node(node, resolved_inputs)

            else:
                logger.warning(f"Node type {node.type} not yet implemented")
                result = {"skipped": True}

            # Store outputs
            context.node_outputs[node.id] = result
            for output_name, output_var in node.outputs.items():
                if output_name in result:
                    context.variables[output_var] = result[output_name]

            context.completed_nodes.add(node.id)
            await self._add_log(context, node.id, "Completed successfully")

            # Find and execute next nodes
            next_edges = self._find_outgoing_edges(node.id, workflow)
            for edge in next_edges:
                # Check edge conditions
                should_execute = True

                if edge.type == EdgeType.CONDITIONAL_TRUE:
                    should_execute = result.get("condition", False)
                elif edge.type == EdgeType.CONDITIONAL_FALSE:
                    should_execute = not result.get("condition", False)

                if should_execute:
                    next_node = next(
                        (n for n in workflow.nodes if n.id == edge.target_node_id),
                        None,
                    )
                    if next_node:
                        await self._execute_node(next_node, workflow, context)

            return result

        except Exception as e:
            logger.error("Node execution failed", node_id=node.id, error=str(e))
            context.failed_nodes.add(node.id)
            await self._add_log(context, node.id, f"Failed: {str(e)}")
            raise

    async def _execute_llm_node(
        self,
        node: NodeConfig,
        inputs: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute an LLM node."""
        # This would call Claude API
        # For now, return a placeholder
        logger.info("LLM node execution (placeholder)", node_id=node.id)
        return {
            "response": f"LLM response for: {node.config.get('prompt', '')}",
            "model": node.config.get("model", "claude-sonnet"),
        }

    async def _execute_agent_node(
        self,
        node: NodeConfig,
        inputs: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute an agent node using existing orchestrator."""
        agent_name = node.config.get("agent_name")
        _task_description = node.config.get("task_description", "")

        # Use existing orchestrator
        # This is a simplified version - full integration would be more complex
        logger.info(
            "Agent node execution",
            node_id=node.id,
            agent_name=agent_name,
        )

        return {
            "result": f"Agent {agent_name} executed task",
            "status": "completed",
        }

    async def _execute_tool_node(
        self,
        node: NodeConfig,
        inputs: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a tool node using existing tool registry."""
        tool_name = node.config.get("tool_name")

        if not tool_name:
            raise ValueError("Tool node missing tool_name in config")

        tool = self.tool_registry.get(tool_name)
        if not tool or not tool.handler:
            raise ValueError(f"Tool not found or has no handler: {tool_name}")

        parameters = node.config.get("parameters", {})
        resolved_params = self._resolve_variables(parameters, inputs)

        # Call tool handler
        result = await tool.handler(**resolved_params)

        return {"results": result}

    async def _execute_conditional_node(
        self,
        node: NodeConfig,
        inputs: dict[str, Any],
    ) -> dict[str, Any]:
        """Execute a conditional node."""
        condition = node.config.get("condition", "")

        # Resolve variables in condition
        resolved_condition = self._resolve_variables_in_string(condition, inputs)

        # Evaluate condition (simple eval for now - should use safe evaluator)
        try:
            # This is a simplified evaluation
            # In production, use a safe expression evaluator
            result = eval(resolved_condition)
            condition_met = bool(result)
        except Exception as e:
            logger.error("Condition evaluation failed", error=str(e))
            condition_met = False

        return {"condition": condition_met}

    def _resolve_variables(
        self,
        template: dict[str, Any],
        variables: dict[str, Any],
    ) -> dict[str, Any]:
        """Resolve variable references like {{variable.path}}."""

        def resolve_value(value: Any) -> Any:
            if isinstance(value, str):
                return self._resolve_variables_in_string(value, variables)
            elif isinstance(value, dict):
                return {k: resolve_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [resolve_value(v) for v in value]
            else:
                return value

        return resolve_value(template)

    def _resolve_variables_in_string(
        self,
        text: str,
        variables: dict[str, Any],
    ) -> str:
        """Resolve variables in a string."""
        pattern = r"\{\{([^}]+)\}\}"
        matches = re.findall(pattern, text)

        for match in matches:
            path_parts = match.strip().split(".")
            resolved = variables

            for part in path_parts:
                if isinstance(resolved, dict):
                    resolved = resolved.get(part, {})
                else:
                    resolved = {}

            text = text.replace(f"{{{{{match}}}}}", str(resolved))

        return text

    def _find_outgoing_edges(
        self,
        node_id: str,
        workflow: WorkflowDefinition,
    ) -> list:
        """Find all edges going out from a node."""
        return [e for e in workflow.edges if e.source_node_id == node_id]

    async def _add_log(
        self,
        context: ExecutionContext,
        node_id: str,
        message: str,
    ) -> None:
        """Add a log entry to the execution context."""
        context.logs.append(
            {
                "timestamp": datetime.now().isoformat(),
                "node_id": node_id,
                "message": message,
            }
        )

    async def get_execution_status(self, execution_id: str) -> dict | None:
        """Get execution status."""
        context = await self.storage.get_execution(execution_id)
        if not context:
            return None

        return {
            "execution_id": context.execution_id,
            "workflow_id": context.workflow_id,
            "status": context.status.value,
            "started_at": context.started_at,
            "completed_at": context.completed_at,
            "current_node_id": context.current_node_id,
            "completed_nodes": list(context.completed_nodes),
            "failed_nodes": list(context.failed_nodes),
            "logs": context.logs,
        }
