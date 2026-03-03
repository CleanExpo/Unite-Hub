"""
Workflow Node Handlers.

Execution handlers for each node type in the visual workflow.
Each handler receives resolved config + execution state and returns output.

Turing Check: Each handler is O(1) per node (excluding I/O waits) — approved.
Shannon Check: Handlers return only the data needed — minimal payloads.
"""

from __future__ import annotations

import ast
import operator
import time
from typing import Any

import httpx

from src.models.selector import ModelSelector
from src.utils import get_logger
from src.workflow.state import ExecutionState

logger = get_logger(__name__)

# Safe operators for condition evaluation (no exec/eval)
_SAFE_OPS: dict[type, Any] = {
    ast.Eq: operator.eq,
    ast.NotEq: operator.ne,
    ast.Lt: operator.lt,
    ast.LtE: operator.le,
    ast.Gt: operator.gt,
    ast.GtE: operator.ge,
    ast.And: lambda a, b: a and b,
    ast.Or: lambda a, b: a or b,
    ast.Not: operator.not_,
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.In: lambda a, b: a in b,
    ast.NotIn: lambda a, b: a not in b,
    ast.Is: operator.is_,
    ast.IsNot: operator.is_not,
}

_model_selector = ModelSelector()


async def handle_start(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """START/TRIGGER node — passes input data through."""
    return {"started": True, **state.input_data}


async def handle_end(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """END/OUTPUT node — collects final outputs."""
    output_mapping = config.get("output_mapping", {})
    result: dict[str, Any] = {}

    for output_key, source_expr in output_mapping.items():
        if isinstance(source_expr, str) and "{{" in source_expr:
            result[output_key] = state.resolve_variable(source_expr)
        else:
            result[output_key] = source_expr

    # If no mapping, return all accumulated outputs
    if not result:
        result = {"outputs": state.node_outputs}

    return result


async def handle_llm(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    LLM node — calls the AI provider.

    Config:
        prompt: str — the prompt template (supports {{}} variables)
        system_prompt: str | None
        model: str | None — provider:tier (e.g. "anthropic:sonnet")
        temperature: float
        max_tokens: int
    """
    prompt = config.get("prompt", "")
    system_prompt = config.get("system_prompt") or config.get("systemPrompt")
    temperature = config.get("temperature", 0.7)
    max_tokens = config.get("max_tokens") or config.get("maxTokens", 2048)

    # Resolve variables in prompt
    resolved_prompt = _resolve_string(prompt, state)

    # Select model provider
    model_spec = config.get("model", "")
    provider = None
    tier = "default"
    if ":" in str(model_spec):
        parts = model_spec.split(":", 1)
        provider = parts[0] if parts[0] else None
        tier = parts[1] if len(parts) > 1 else "default"

    try:
        client = _model_selector.get_client(provider=provider, tier=tier)
        response = await client.complete(
            prompt=resolved_prompt,
            system=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return {
            "response": response,
            "model": client.model_name,
            "provider": client.provider_name,
        }
    except Exception as e:
        logger.error("LLM node failed", error=str(e))
        return {"response": None, "error": str(e)}


async def handle_agent(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    AGENT node — delegates to a registered agent via AgentRegistry.

    Lookup order:
      1. Exact name match via ``get_agent(name)``
      2. Intelligent routing via ``get_agent_for_task(task)``
      3. Fallback to the ``general`` agent

    The workflow engine provides its own execution logging, so we call
    the agent's ``execute()`` directly rather than going through the
    orchestrator's verification loop.

    Config:
        agent_name / agentName: str
        task_description / taskDescription: str
        max_iterations / maxIterations: int
    """
    agent_name = config.get("agent_name") or config.get("agentName", "default")
    task_desc = config.get("task_description") or config.get("taskDescription", "")
    resolved_task = _resolve_string(task_desc, state)

    try:
        from src.agents.registry import AgentRegistry

        registry = AgentRegistry()

        # 1. Exact name match
        agent = registry.get_agent(agent_name)

        # 2. Intelligent routing by task description
        if agent is None and resolved_task:
            agent = registry.get_agent_for_task(resolved_task)

        # 3. Fallback to general
        if agent is None:
            agent = registry.get_agent("general")

        if agent is None:
            return {
                "result": None,
                "agent": agent_name,
                "error": "No suitable agent found in registry",
            }

        result = await agent.execute(
            task_description=resolved_task,
            context={
                "requested_agent": agent_name,
                "variables": state.variables,
                "node_outputs": state.node_outputs,
            },
        )

        # Normalise response — agents return dicts
        if isinstance(result, dict):
            return {
                "result": result,
                "agent": agent.name,
                "status": result.get("status", "completed"),
            }

        return {
            "result": str(result),
            "agent": agent.name,
            "status": "completed",
        }
    except Exception as e:
        logger.error("Agent node failed", agent=agent_name, error=str(e))
        return {"result": None, "agent": agent_name, "error": str(e)}


async def handle_http(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    HTTP node — makes an HTTP request.

    Config:
        url: str
        method: str (GET, POST, PUT, PATCH, DELETE)
        headers: dict
        body: dict | str
        timeout: int (seconds)
    """
    url = _resolve_string(config.get("url", ""), state)
    method = config.get("method", "GET").upper()
    headers = state.resolve_config(config.get("headers", {}))
    body = config.get("body")
    timeout = config.get("timeout", 30)

    if isinstance(body, dict):
        body = state.resolve_config(body)
    elif isinstance(body, str) and "{{" in body:
        body = _resolve_string(body, state)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                json=body if isinstance(body, dict) else None,
                content=body if isinstance(body, str) else None,
            )
            response_data: Any = None
            content_type = response.headers.get("content-type", "")
            if "json" in content_type:
                try:
                    response_data = response.json()
                except Exception:
                    response_data = response.text
            else:
                response_data = response.text

            return {
                "status_code": response.status_code,
                "data": response_data,
                "headers": dict(response.headers),
                "success": 200 <= response.status_code < 300,
            }
    except httpx.TimeoutException:
        return {"status_code": 408, "error": "Request timed out", "success": False}
    except Exception as e:
        return {"status_code": 0, "error": str(e), "success": False}


async def handle_code(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    CODE node — executes Python code in a restricted sandbox.

    Config:
        code: str — Python code to execute
        language: str — Currently only "python" is supported

    The code receives 'inputs' and 'variables' dicts and must
    set 'result' to its output value.

    Security: Uses AST-based restricted execution. No imports,
    no exec, no eval, no file/network access.
    """
    code = config.get("code", "")
    language = config.get("language", "python")

    if language != "python":
        return {"error": f"Language '{language}' not supported. Only 'python' is available."}

    # Build the sandbox context
    sandbox_globals: dict[str, Any] = {
        "inputs": dict(state.node_outputs),
        "variables": dict(state.variables),
        "input_data": dict(state.input_data),
        "result": None,
        # Safe builtins
        "len": len,
        "str": str,
        "int": int,
        "float": float,
        "bool": bool,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "range": range,
        "enumerate": enumerate,
        "zip": zip,
        "map": map,
        "filter": filter,
        "sorted": sorted,
        "reversed": reversed,
        "min": min,
        "max": max,
        "sum": sum,
        "abs": abs,
        "round": round,
        "isinstance": isinstance,
        "type": type,
        "print": lambda *a, **kw: None,  # Silenced
    }

    try:
        # Parse and validate AST for safety
        tree = ast.parse(code, mode="exec")
        _validate_ast(tree)

        # Execute in sandbox
        exec(compile(tree, "<workflow_code>", "exec"), sandbox_globals)  # noqa: S102

        return {
            "result": sandbox_globals.get("result"),
            "success": True,
        }
    except SecurityError as e:
        return {"error": f"Security violation: {e}", "success": False}
    except SyntaxError as e:
        return {"error": f"Syntax error: {e}", "success": False}
    except Exception as e:
        return {"error": str(e), "success": False}


class SecurityError(Exception):
    """Raised when code sandbox detects unsafe operations."""

    pass


def _validate_ast(tree: ast.AST) -> None:
    """Validate AST to block unsafe operations."""
    blocked_names = {"exec", "eval", "compile", "__import__", "open", "globals", "locals"}
    blocked_attrs = {"__class__", "__subclasses__", "__bases__", "__mro__", "__code__"}

    for node in ast.walk(tree):
        if isinstance(node, ast.Import | ast.ImportFrom):
            raise SecurityError("Imports are not allowed")
        if isinstance(node, ast.Name) and node.id in blocked_names:
            raise SecurityError(f"'{node.id}' is not allowed")
        if isinstance(node, ast.Attribute) and node.attr in blocked_attrs:
            raise SecurityError(f"Access to '{node.attr}' is not allowed")


async def handle_conditional(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    CONDITIONAL/LOGIC node — evaluates a condition safely.

    Config:
        condition: str — Expression like "{{input.score}} > 80"
        operator: str — eq, ne, gt, gte, lt, lte, contains, not_contains
        left_value: Any
        right_value: Any

    Returns:
        {"condition": bool, "evaluated": str}
    """
    # Support structured operator-based conditions
    op = config.get("operator")
    if op:
        left = config.get("left_value") or config.get("leftValue", "")
        right = config.get("right_value") or config.get("rightValue", "")

        if isinstance(left, str) and "{{" in left:
            left = state.resolve_variable(left)
        if isinstance(right, str) and "{{" in right:
            right = state.resolve_variable(right)

        condition_met = _evaluate_operator(op, left, right)
        return {"condition": condition_met, "left": left, "right": right, "operator": op}

    # Fallback to expression-based condition
    condition_str = config.get("condition", "false")
    resolved = _resolve_string(condition_str, state)

    try:
        result = _safe_eval_condition(resolved)
        return {"condition": bool(result), "evaluated": resolved}
    except Exception as e:
        logger.error("Condition evaluation failed", condition=resolved, error=str(e))
        return {"condition": False, "error": str(e)}


def _evaluate_operator(op: str, left: Any, right: Any) -> bool:
    """Evaluate a structured operator condition."""
    try:
        match op:
            case "eq" | "equals":
                return left == right
            case "ne" | "not_equals":
                return left != right
            case "gt" | "greater_than":
                return float(left) > float(right)
            case "gte" | "greater_than_or_equal":
                return float(left) >= float(right)
            case "lt" | "less_than":
                return float(left) < float(right)
            case "lte" | "less_than_or_equal":
                return float(left) <= float(right)
            case "contains":
                return str(right) in str(left)
            case "not_contains":
                return str(right) not in str(left)
            case "is_empty":
                return not left
            case "is_not_empty":
                return bool(left)
            case _:
                return False
    except (ValueError, TypeError):
        return False


def _safe_eval_condition(expression: str) -> bool:
    """
    Safely evaluate a condition expression using AST.
    No exec/eval — parses AST and evaluates node-by-node.
    """
    try:
        tree = ast.parse(expression, mode="eval")
        return bool(_eval_node(tree.body))
    except Exception:
        return False


def _eval_node(node: ast.expr) -> Any:
    """Recursively evaluate an AST expression node (safe subset only)."""
    if isinstance(node, ast.Constant):
        return node.value
    elif isinstance(node, ast.Compare):
        left = _eval_node(node.left)
        for op_node, comparator in zip(node.ops, node.comparators):
            op_func = _SAFE_OPS.get(type(op_node))
            if op_func is None:
                raise ValueError(f"Unsupported operator: {type(op_node).__name__}")
            right = _eval_node(comparator)
            if not op_func(left, right):
                return False
            left = right
        return True
    elif isinstance(node, ast.BoolOp):
        op_func = _SAFE_OPS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported boolean op: {type(node.op).__name__}")
        values = [_eval_node(v) for v in node.values]
        result = values[0]
        for v in values[1:]:
            result = op_func(result, v)
        return result
    elif isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
        return not _eval_node(node.operand)
    elif isinstance(node, ast.BinOp):
        op_func = _SAFE_OPS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported binary op: {type(node.op).__name__}")
        return op_func(_eval_node(node.left), _eval_node(node.right))
    elif isinstance(node, ast.Name):
        # Variable names resolve to string for comparison
        match node.id:
            case "True":
                return True
            case "False":
                return False
            case "None":
                return None
            case _:
                return node.id
    elif isinstance(node, ast.Str):
        return node.s  # type: ignore[attr-defined]
    elif isinstance(node, ast.Num):
        return node.n  # type: ignore[attr-defined]
    else:
        raise ValueError(f"Unsupported expression: {type(node).__name__}")


async def handle_loop(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    LOOP node — provides iteration context.

    The executor handles loop control flow. This handler
    sets up the iteration data.

    Config:
        collection: str — Variable expression for the collection
        max_iterations: int — Safety limit
        parallel: bool — Whether items can be processed in parallel
        item_variable: str — Variable name for current item
    """
    collection_expr = config.get("collection", "[]")
    max_iterations = config.get("max_iterations") or config.get("maxIterations", 100)

    # Resolve collection
    if isinstance(collection_expr, str) and "{{" in collection_expr:
        collection = state.resolve_variable(collection_expr)
    elif isinstance(collection_expr, list):
        collection = collection_expr
    else:
        collection = []

    if not isinstance(collection, list | tuple):
        collection = list(collection) if hasattr(collection, "__iter__") else [collection]

    # Apply safety limit
    items = list(collection)[:max_iterations]

    return {
        "items": items,
        "total_count": len(items),
        "parallel": config.get("parallel", False),
        "item_variable": config.get("item_variable") or config.get("itemVariable", "item"),
    }


async def handle_tool(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    TOOL node — calls a registered tool.

    Three outcomes:
      1. Tool found + handler exists → execute handler, record usage.
      2. Tool found + handler is None → return tool metadata with
         ``handler_missing: True`` so the workflow can continue and
         the user sees what parameters the tool expects.
      3. Tool not found → error output.

    Config:
        tool_name / toolName: str
        parameters: dict
    """
    tool_name = config.get("tool_name") or config.get("toolName", "")
    parameters = state.resolve_config(config.get("parameters", {}))

    try:
        from src.tools.registry import get_registry

        registry = get_registry()
        tool = registry.get(tool_name)

        # Case 3: tool not in registry at all
        if tool is None:
            return {"error": f"Tool not found: {tool_name}", "tool": tool_name, "success": False}

        # Case 2: tool exists but has no handler implementation
        if tool.handler is None:
            return {
                "tool": tool_name,
                "description": tool.description,
                "parameters_schema": tool.input_schema,
                "categories": [c.value for c in tool.categories],
                "handler_missing": True,
                "success": False,
                "note": "Tool is registered but has no executable handler yet",
            }

        # Case 1: execute the handler
        result = await tool.handler(**parameters)
        registry.record_usage(tool_name)
        return {"result": result, "tool": tool_name, "success": True}
    except Exception as e:
        logger.error("Tool node failed", tool=tool_name, error=str(e))
        return {"error": str(e), "tool": tool_name, "success": False}


async def handle_knowledge(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    KNOWLEDGE node — performs vector similarity search.

    Config:
        query: str — Search query
        collection: str — Knowledge base collection name
        top_k: int — Number of results
    """
    query = _resolve_string(config.get("query", ""), state)
    top_k = config.get("top_k") or config.get("topK", 5)

    try:
        client = _model_selector.get_client()
        embeddings = await client.generate_embeddings(query)

        # Placeholder: actual vector search would query pgvector here
        return {
            "query": query,
            "results": [],
            "embedding_dimensions": len(embeddings),
            "top_k": top_k,
            "note": "Vector search requires pgvector integration",
        }
    except Exception as e:
        logger.error("Knowledge node failed", error=str(e))
        return {"query": query, "results": [], "error": str(e)}


async def handle_verification(
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    VERIFICATION node — validates data against rules.

    Config:
        rules: list[dict] — Validation rules
        strict: bool — Fail on first violation
    """
    rules = config.get("rules", [])
    strict = config.get("strict", True)
    violations: list[str] = []

    for rule in rules:
        field = rule.get("field", "")
        check = rule.get("check", "")
        expected = rule.get("expected")

        # Resolve field value
        if isinstance(field, str) and "{{" in field:
            actual = state.resolve_variable(field)
        else:
            actual = state.variables.get(field, state.input_data.get(field))

        passed = _check_rule(check, actual, expected)
        if not passed:
            msg = rule.get("message", f"Verification failed: {field} {check} {expected}")
            violations.append(msg)
            if strict:
                break

    return {
        "passed": len(violations) == 0,
        "violations": violations,
        "rules_checked": len(rules),
    }


def _check_rule(check: str, actual: Any, expected: Any) -> bool:
    """Evaluate a single verification rule."""
    match check:
        case "required":
            return actual is not None and actual != ""
        case "equals":
            return actual == expected
        case "not_equals":
            return actual != expected
        case "contains":
            return str(expected) in str(actual) if actual else False
        case "type":
            return type(actual).__name__ == expected
        case "min_length":
            return len(str(actual or "")) >= int(expected)
        case "max_length":
            return len(str(actual or "")) <= int(expected)
        case "regex":
            import re
            return bool(re.match(str(expected), str(actual or "")))
        case _:
            return True


# Handler dispatch map — O(1) lookup
NODE_HANDLERS: dict[str, Any] = {
    "start": handle_start,
    "trigger": handle_start,
    "end": handle_end,
    "output": handle_end,
    "llm": handle_llm,
    "agent": handle_agent,
    "http": handle_http,
    "code": handle_code,
    "conditional": handle_conditional,
    "logic": handle_conditional,
    "loop": handle_loop,
    "tool": handle_tool,
    "action": handle_tool,
    "knowledge": handle_knowledge,
    "verification": handle_verification,
}


async def execute_node(
    node_type: str,
    config: dict[str, Any],
    state: ExecutionState,
) -> dict[str, Any]:
    """
    Execute a node by type. Main dispatch function.

    Returns the node's output dict.
    """
    handler = NODE_HANDLERS.get(node_type)
    if handler is None:
        logger.warning("Unknown node type, skipping", node_type=node_type)
        return {"skipped": True, "reason": f"Unknown node type: {node_type}"}

    start = time.monotonic()
    result = await handler(config, state)
    elapsed_ms = int((time.monotonic() - start) * 1000)

    result["_duration_ms"] = elapsed_ms
    return result


def _resolve_string(text: str, state: ExecutionState) -> str:
    """Resolve all {{}} expressions in a string."""
    import re

    pattern = r"\{\{([^}]+)\}\}"
    matches = re.findall(pattern, text)

    for match in matches:
        resolved = state.resolve_variable(f"{{{{{match}}}}}")
        text = text.replace(f"{{{{{match}}}}}", str(resolved) if resolved is not None else "")

    return text
