"""Discovery API — exposes agent and tool metadata.

Endpoints:
    GET /api/discovery/agents — list registered agents
    GET /api/discovery/tools  — list registered tools
"""

from __future__ import annotations

from fastapi import APIRouter

from src.agents.registry import AgentRegistry
from src.tools.definitions import register_all_tools
from src.tools.registry import get_registry

from ..schemas.discovery import (
    AgentInfo,
    AgentListResponse,
    ToolInfo,
    ToolListResponse,
    ToolParameterSchema,
)

router = APIRouter(prefix="/discovery", tags=["Discovery"])

# Lazily initialised singletons — created on first request.
_agent_registry: AgentRegistry | None = None


def _get_agent_registry() -> AgentRegistry:
    global _agent_registry
    if _agent_registry is None:
        _agent_registry = AgentRegistry()
    return _agent_registry


def _ensure_tools_registered() -> None:
    """Ensure tool definitions have been loaded into the global registry."""
    registry = get_registry()
    if not registry._tools:
        register_all_tools()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/agents", response_model=AgentListResponse)
async def list_agents() -> AgentListResponse:
    """Return all registered agents with their capabilities."""
    registry = _get_agent_registry()
    raw = registry.list_agents()

    agents = [
        AgentInfo(
            name=entry["name"],
            capabilities=entry.get("capabilities", []),
        )
        for entry in raw
    ]

    return AgentListResponse(agents=agents, total=len(agents))


@router.get("/tools", response_model=ToolListResponse)
async def list_tools() -> ToolListResponse:
    """Return all registered tools with metadata."""
    _ensure_tools_registered()
    registry = get_registry()

    tools: list[ToolInfo] = []
    for tool_def in registry._tools.values():
        schema = tool_def.input_schema or {}
        tools.append(
            ToolInfo(
                name=tool_def.name,
                description=tool_def.description,
                categories=[c.value for c in tool_def.categories],
                has_handler=tool_def.handler is not None,
                parameters=ToolParameterSchema(
                    type=schema.get("type", "object"),
                    properties=schema.get("properties", {}),
                    required=schema.get("required", []),
                ),
                deferred=tool_def.config.defer_loading,
            )
        )

    return ToolListResponse(tools=tools, total=len(tools))
