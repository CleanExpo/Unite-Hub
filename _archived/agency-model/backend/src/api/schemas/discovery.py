"""Pydantic schemas for the Discovery API.

Exposes agent and tool metadata so the workflow builder
frontend can populate dropdowns dynamically.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Agent schemas
# ---------------------------------------------------------------------------


class AgentInfo(BaseModel):
    """Public metadata for a registered agent."""

    name: str = Field(description="Unique agent name (e.g. 'frontend')")
    capabilities: list[str] = Field(
        default_factory=list,
        description="Keywords the agent matches against",
    )


class AgentListResponse(BaseModel):
    """Response for GET /api/discovery/agents."""

    agents: list[AgentInfo]
    total: int


# ---------------------------------------------------------------------------
# Tool schemas
# ---------------------------------------------------------------------------


class ToolParameterSchema(BaseModel):
    """Simplified JSON-schema for tool input parameters."""

    type: str = "object"
    properties: dict = Field(default_factory=dict)
    required: list[str] = Field(default_factory=list)


class ToolInfo(BaseModel):
    """Public metadata for a registered tool."""

    name: str = Field(description="Unique tool name (e.g. 'file.read')")
    description: str = Field(default="")
    categories: list[str] = Field(default_factory=list)
    has_handler: bool = Field(
        default=False,
        description="Whether the tool has an executable handler",
    )
    parameters: ToolParameterSchema = Field(default_factory=ToolParameterSchema)
    deferred: bool = Field(
        default=False,
        description="Whether the tool uses defer_loading",
    )


class ToolListResponse(BaseModel):
    """Response for GET /api/discovery/tools."""

    tools: list[ToolInfo]
    total: int
