"""Programmatic Tool Calling Implementation.

Enables Claude to invoke tools from code execution, keeping intermediate
results out of the context window. This provides:

- 37% average reduction in token consumption
- Reduced latency (fewer inference passes)
- Improved accuracy through explicit orchestration logic

Example:
    Instead of Claude making 20 individual tool calls with each result
    entering context, Claude writes code that orchestrates all calls
    and only returns the final summary.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .registry import ToolDefinition, ToolRegistry


class ExecutionStatus(str, Enum):
    """Status of tool execution."""

    PENDING = "pending"
    RUNNING = "running"
    WAITING_FOR_TOOL = "waiting_for_tool"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ToolCall:
    """A tool call requested during code execution."""

    id: str
    name: str
    input: dict[str, Any]
    caller_id: str  # ID of the code execution block
    status: ExecutionStatus = ExecutionStatus.PENDING
    result: Any | None = None
    error: str | None = None

    def to_api_format(self) -> dict[str, Any]:
        """Convert to Claude API format."""
        return {
            "type": "tool_use",
            "id": self.id,
            "name": self.name,
            "input": self.input,
            "caller": {
                "type": "code_execution_20250825",
                "tool_id": self.caller_id,
            },
        }


@dataclass
class ToolExecutionContext:
    """Context for a code execution session.

    Tracks tool calls made during code execution and manages
    the flow of results back to the executing code.
    """

    execution_id: str
    pending_calls: list[ToolCall] = field(default_factory=list)
    completed_calls: list[ToolCall] = field(default_factory=list)
    status: ExecutionStatus = ExecutionStatus.PENDING
    stdout: str = ""
    stderr: str = ""

    def add_tool_call(
        self,
        name: str,
        input: dict[str, Any],
    ) -> ToolCall:
        """Register a tool call from executing code."""
        call = ToolCall(
            id=f"toolu_{uuid.uuid4().hex[:12]}",
            name=name,
            input=input,
            caller_id=self.execution_id,
        )
        self.pending_calls.append(call)
        return call

    def get_pending_calls(self) -> list[ToolCall]:
        """Get all pending tool calls."""
        return [c for c in self.pending_calls if c.status == ExecutionStatus.PENDING]

    def complete_call(
        self,
        call_id: str,
        result: Any = None,
        error: str | None = None,
    ) -> None:
        """Mark a tool call as complete."""
        for call in self.pending_calls:
            if call.id == call_id:
                if error:
                    call.status = ExecutionStatus.FAILED
                    call.error = error
                else:
                    call.status = ExecutionStatus.COMPLETED
                    call.result = result
                self.completed_calls.append(call)
                self.pending_calls.remove(call)
                break

    def to_result_format(self) -> dict[str, Any]:
        """Convert to code execution result format."""
        return {
            "type": "code_execution_tool_result",
            "tool_use_id": self.execution_id,
            "content": {
                "stdout": self.stdout,
                "stderr": self.stderr if self.stderr else None,
            },
        }


class ProgrammaticToolCaller:
    """Manages programmatic tool calling from code execution.

    This class handles:
    1. Parsing tool calls from executing code
    2. Routing calls to appropriate tool handlers
    3. Returning results to the code execution environment
    4. Keeping intermediate results out of Claude's context

    Usage:
        caller = ProgrammaticToolCaller(registry)

        # When Claude sends code execution
        context = caller.create_context()

        # Code calls tools via generated Python functions
        # e.g., get_orders("user123") in Claude's code

        # Get pending tool calls to execute
        pending = context.get_pending_calls()

        # Execute tools and return results
        for call in pending:
            result = await execute_tool(call.name, call.input)
            context.complete_call(call.id, result)

        # Continue code execution with results
    """

    CODE_EXECUTION_CALLER = "code_execution_20250825"

    def __init__(self, registry: ToolRegistry) -> None:
        """Initialize the programmatic caller.

        Args:
            registry: Tool registry with tool definitions
        """
        self.registry = registry
        self._contexts: dict[str, ToolExecutionContext] = {}
        self._tool_handlers: dict[str, Callable] = {}

    def create_context(self) -> ToolExecutionContext:
        """Create a new execution context."""
        execution_id = f"srvtoolu_{uuid.uuid4().hex[:12]}"
        context = ToolExecutionContext(execution_id=execution_id)
        self._contexts[execution_id] = context
        return context

    def get_context(self, execution_id: str) -> ToolExecutionContext | None:
        """Get an existing execution context."""
        return self._contexts.get(execution_id)

    def register_handler(
        self,
        tool_name: str,
        handler: Callable,
    ) -> None:
        """Register a handler for a tool."""
        self._tool_handlers[tool_name] = handler

    def get_programmatic_tools(self) -> list[ToolDefinition]:
        """Get tools enabled for programmatic calling."""
        return [
            tool
            for tool in self.registry._tools.values()
            if self.CODE_EXECUTION_CALLER in tool.config.allowed_callers
        ]

    def generate_python_stubs(self) -> str:
        """Generate Python function stubs for programmatic tools.

        These stubs are injected into the code execution environment
        so Claude can call tools as regular Python functions.
        """
        stubs = [
            "# Auto-generated tool stubs for code execution",
            "import asyncio",
            "from typing import Any, Dict, List, Optional",
            "",
            "# Tool call registry",
            "_pending_tool_calls = []",
            "",
            "async def _call_tool(name: str, **kwargs) -> Any:",
            "    '''Make a tool call and wait for result.'''",
            "    call_id = f'call_{len(_pending_tool_calls)}'",
            "    _pending_tool_calls.append({",
            "        'id': call_id,",
            "        'name': name,",
            "        'input': kwargs,",
            "    })",
            "    # Pause execution - result will be injected",
            "    return await _wait_for_result(call_id)",
            "",
        ]

        # Generate stub for each programmatic tool
        for tool in self.get_programmatic_tools():
            stub = self._generate_tool_stub(tool)
            stubs.append(stub)
            stubs.append("")

        return "\n".join(stubs)

    def _generate_tool_stub(self, tool: ToolDefinition) -> str:
        """Generate Python stub for a single tool."""
        # Extract parameters from input schema
        params = []
        param_docs = []

        properties = tool.input_schema.get("properties", {})
        required = set(tool.input_schema.get("required", []))

        for name, schema in properties.items():
            param_type = self._schema_to_python_type(schema)
            if name in required:
                params.append(f"{name}: {param_type}")
            else:
                default = schema.get("default", "None")
                if isinstance(default, str):
                    default = f'"{default}"'
                params.append(f"{name}: {param_type} = {default}")

            param_docs.append(f"        {name}: {schema.get('description', '')}")

        params_str = ", ".join(params)
        param_docs_str = "\n".join(param_docs) if param_docs else "        None"

        # Clean function name (replace dots with underscores)
        func_name = tool.name.replace(".", "_").replace("-", "_")

        kwargs_str = ", ".join(
            f"{p.split(':')[0].strip()}={p.split(':')[0].strip()}"
            for p in params
            if ':' in p
        )

        return f'''async def {func_name}({params_str}) -> Any:
    """
    {tool.description}

    Args:
{param_docs_str}
    """
    return await _call_tool("{tool.name}", {kwargs_str})'''

    def _schema_to_python_type(self, schema: dict[str, Any]) -> str:
        """Convert JSON Schema type to Python type hint."""
        type_map = {
            "string": "str",
            "integer": "int",
            "number": "float",
            "boolean": "bool",
            "array": "List",
            "object": "Dict[str, Any]",
        }
        json_type = schema.get("type", "Any")
        return type_map.get(json_type, "Any")

    async def execute_pending_calls(
        self,
        context: ToolExecutionContext,
    ) -> list[dict[str, Any]]:
        """Execute all pending tool calls in a context.

        Args:
            context: Execution context with pending calls

        Returns:
            List of tool results
        """
        results = []
        pending = context.get_pending_calls()

        # Execute in parallel if tools are parallel-safe
        parallel_calls = []
        sequential_calls = []

        for call in pending:
            tool = self.registry.get(call.name)
            if tool and tool.config.parallel_safe:
                parallel_calls.append(call)
            else:
                sequential_calls.append(call)

        # Execute parallel calls
        if parallel_calls:
            parallel_results = await asyncio.gather(
                *[self._execute_single_call(c) for c in parallel_calls],
                return_exceptions=True,
            )
            for call, result in zip(parallel_calls, parallel_results):
                if isinstance(result, Exception):
                    context.complete_call(call.id, error=str(result))
                    results.append({"id": call.id, "error": str(result)})
                else:
                    context.complete_call(call.id, result=result)
                    results.append({"id": call.id, "result": result})

        # Execute sequential calls
        for call in sequential_calls:
            try:
                result = await self._execute_single_call(call)
                context.complete_call(call.id, result=result)
                results.append({"id": call.id, "result": result})
            except Exception as e:
                context.complete_call(call.id, error=str(e))
                results.append({"id": call.id, "error": str(e)})

        return results

    async def _execute_single_call(self, call: ToolCall) -> Any:
        """Execute a single tool call."""
        handler = self._tool_handlers.get(call.name)
        if not handler:
            raise ValueError(f"No handler registered for tool: {call.name}")

        call.status = ExecutionStatus.RUNNING
        result = handler(**call.input)

        # Handle async handlers
        if asyncio.iscoroutine(result):
            result = await result

        return result

    def get_code_execution_tool(self) -> dict[str, Any]:
        """Get the Code Execution tool definition."""
        return {
            "type": "code_execution_20250825",
            "name": "code_execution",
        }

    def parse_tool_request(
        self,
        request: dict[str, Any],
    ) -> ToolCall | None:
        """Parse a tool request from Claude API response.

        Checks if this is a programmatic call (has caller field).
        """
        if "caller" not in request:
            return None

        caller = request.get("caller", {})
        if caller.get("type") != self.CODE_EXECUTION_CALLER:
            return None

        return ToolCall(
            id=request["id"],
            name=request["name"],
            input=request.get("input", {}),
            caller_id=caller.get("tool_id", ""),
        )

    def format_tool_result(
        self,
        call: ToolCall,
        result: Any = None,
        error: str | None = None,
    ) -> dict[str, Any]:
        """Format tool result for return to code execution.

        Note: This result goes to the code execution environment,
        NOT to Claude's context window.
        """
        content: dict[str, Any] = {}

        if error:
            content["error"] = error
        else:
            # Serialize result for Python code
            if isinstance(result, (dict, list)):
                content["result"] = result
            else:
                content["result"] = str(result)

        return {
            "type": "tool_result",
            "tool_use_id": call.id,
            "content": json.dumps(content),
        }

    def get_context_savings(self) -> dict[str, Any]:
        """Calculate context savings from programmatic calling.

        Returns statistics on tokens saved by keeping intermediate
        results out of Claude's context.
        """
        total_calls = 0
        total_result_bytes = 0

        for context in self._contexts.values():
            for call in context.completed_calls:
                total_calls += 1
                if call.result:
                    result_str = json.dumps(call.result)
                    total_result_bytes += len(result_str)

        # Rough estimate: 4 bytes per token
        estimated_tokens_saved = total_result_bytes // 4

        return {
            "total_programmatic_calls": total_calls,
            "total_result_bytes": total_result_bytes,
            "estimated_tokens_saved": estimated_tokens_saved,
            "contexts_active": len(self._contexts),
        }
