"""Tool Registry with Advanced Tool Use Features.

Implements:
- defer_loading: Tools marked for on-demand discovery
- allowed_callers: Tools that can be called from code execution
- input_examples: Usage examples for better parameter accuracy

This reduces context window usage by 85%+ when working with large tool libraries.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ToolCategory(str, Enum):
    """Categories for tool organization and search."""

    CORE = "core"
    FILE_SYSTEM = "file_system"
    DATABASE = "database"
    API = "api"
    VERIFICATION = "verification"
    AUDIT = "audit"
    MESSAGING = "messaging"
    VERSION_CONTROL = "version_control"
    DEPLOYMENT = "deployment"
    MONITORING = "monitoring"
    MARKETING = "marketing"


@dataclass
class ToolExample:
    """Example input for a tool demonstrating correct usage.

    Examples help Claude understand:
    - Format conventions (dates, IDs, etc.)
    - Nested structure patterns
    - Optional parameter correlations
    """

    description: str
    input: dict[str, Any]
    expected_behavior: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to API-compatible format."""
        result = {"input": self.input}
        if self.expected_behavior:
            result["description"] = f"{self.description} - {self.expected_behavior}"
        else:
            result["description"] = self.description
        return result


@dataclass
class ToolConfig:
    """Configuration for advanced tool use features."""

    # defer_loading: Tool definitions not loaded upfront, discovered on-demand
    defer_loading: bool = False

    # allowed_callers: List of callers that can invoke this tool
    # "code_execution_20250825" enables programmatic tool calling
    allowed_callers: list[str] = field(default_factory=list)

    # parallel_safe: Tool can be called in parallel (idempotent)
    parallel_safe: bool = True

    # retry_safe: Tool is safe to retry on failure
    retry_safe: bool = True

    # cache_results: Results can be cached for identical inputs
    cache_results: bool = False

    # cache_ttl_seconds: How long to cache results
    cache_ttl_seconds: int = 300

    def to_dict(self) -> dict[str, Any]:
        """Convert to API-compatible format."""
        result = {}
        if self.defer_loading:
            result["defer_loading"] = True
        if self.allowed_callers:
            result["allowed_callers"] = self.allowed_callers
        return result


@dataclass
class ToolDefinition:
    """Complete tool definition with advanced features."""

    name: str
    description: str
    input_schema: dict[str, Any]
    handler: Callable | None = None

    # Advanced features
    config: ToolConfig = field(default_factory=ToolConfig)
    examples: list[ToolExample] = field(default_factory=list)
    categories: list[ToolCategory] = field(default_factory=list)

    # Metadata for search
    keywords: list[str] = field(default_factory=list)
    aliases: list[str] = field(default_factory=list)

    def to_api_format(self, include_deferred: bool = False) -> dict[str, Any] | None:
        """Convert to Claude API tool format.

        Args:
            include_deferred: If False, returns None for deferred tools

        Returns:
            API-compatible tool definition or None if deferred
        """
        if self.config.defer_loading and not include_deferred:
            return None

        result: dict[str, Any] = {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }

        # Add config options
        config_dict = self.config.to_dict()
        result.update(config_dict)

        # Add examples
        if self.examples:
            result["input_examples"] = [ex.input for ex in self.examples]

        return result

    def matches_query(self, query: str) -> float:
        """Score how well this tool matches a search query.

        Returns:
            Score from 0.0 to 1.0, higher is better match
        """
        query_lower = query.lower()
        query_terms = set(re.findall(r"\w+", query_lower))

        score = 0.0

        # Exact name match
        if query_lower == self.name.lower():
            return 1.0

        # Name contains query
        if query_lower in self.name.lower():
            score += 0.8

        # Query contains name
        if self.name.lower() in query_lower:
            score += 0.6

        # Keyword matches
        tool_keywords = set(
            kw.lower() for kw in self.keywords + self.aliases + [self.name]
        )
        keyword_overlap = len(query_terms & tool_keywords) / max(len(query_terms), 1)
        score += keyword_overlap * 0.5

        # Description contains query terms
        desc_lower = self.description.lower()
        desc_terms = set(re.findall(r"\w+", desc_lower))
        desc_overlap = len(query_terms & desc_terms) / max(len(query_terms), 1)
        score += desc_overlap * 0.3

        # Category match
        for category in self.categories:
            if category.value in query_lower:
                score += 0.2

        return min(score, 1.0)


class ToolRegistry:
    """Central registry for all tools with advanced features.

    Features:
    - Registers tools with defer_loading, allowed_callers, examples
    - Provides tool search for dynamic discovery
    - Tracks tool usage for optimization
    - Manages tool loading/unloading
    """

    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}
        self._loaded_tools: set[str] = set()
        self._usage_count: dict[str, int] = {}

    def register(self, tool: ToolDefinition) -> None:
        """Register a tool definition."""
        self._tools[tool.name] = tool
        if not tool.config.defer_loading:
            self._loaded_tools.add(tool.name)

    def register_many(self, tools: list[ToolDefinition]) -> None:
        """Register multiple tools."""
        for tool in tools:
            self.register(tool)

    def get(self, name: str) -> ToolDefinition | None:
        """Get a tool by name."""
        return self._tools.get(name)

    def get_loaded_tools(self) -> list[ToolDefinition]:
        """Get all currently loaded (non-deferred) tools."""
        return [
            self._tools[name]
            for name in self._loaded_tools
            if name in self._tools
        ]

    def get_deferred_tools(self) -> list[ToolDefinition]:
        """Get all deferred tools."""
        return [
            tool
            for tool in self._tools.values()
            if tool.config.defer_loading
        ]

    def load_tool(self, name: str) -> ToolDefinition | None:
        """Load a deferred tool into active context."""
        tool = self._tools.get(name)
        if tool:
            self._loaded_tools.add(name)
            return tool
        return None

    def unload_tool(self, name: str) -> None:
        """Remove a tool from active context."""
        self._loaded_tools.discard(name)

    def search(self, query: str, limit: int = 5) -> list[ToolDefinition]:
        """Search for tools matching a query.

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of matching tools, sorted by relevance
        """
        scored_tools = [
            (tool, tool.matches_query(query))
            for tool in self._tools.values()
        ]

        # Filter and sort by score
        scored_tools = [
            (tool, score) for tool, score in scored_tools if score > 0.1
        ]
        scored_tools.sort(key=lambda x: x[1], reverse=True)

        return [tool for tool, _ in scored_tools[:limit]]

    def search_by_category(self, category: ToolCategory) -> list[ToolDefinition]:
        """Get all tools in a category."""
        return [
            tool
            for tool in self._tools.values()
            if category in tool.categories
        ]

    def get_programmatic_tools(self) -> list[ToolDefinition]:
        """Get tools that can be called from code execution."""
        return [
            tool
            for tool in self._tools.values()
            if "code_execution_20250825" in tool.config.allowed_callers
        ]

    def record_usage(self, name: str) -> None:
        """Record tool usage for optimization."""
        self._usage_count[name] = self._usage_count.get(name, 0) + 1

    def get_usage_stats(self) -> dict[str, int]:
        """Get tool usage statistics."""
        return dict(self._usage_count)

    def to_api_format(
        self,
        include_search_tool: bool = True,
        include_code_execution: bool = True,
        include_deferred: bool = False,
    ) -> list[dict[str, Any]]:
        """Convert registry to Claude API tools array.

        Args:
            include_search_tool: Include the tool search tool
            include_code_execution: Include code execution tool
            include_deferred: Include deferred tools in full

        Returns:
            List of tool definitions for Claude API
        """
        tools: list[dict[str, Any]] = []

        # Add Tool Search Tool for dynamic discovery
        if include_search_tool:
            tools.append({
                "type": "tool_search_tool_regex_20251119",
                "name": "tool_search",
            })

        # Add Code Execution tool for programmatic calling
        if include_code_execution:
            tools.append({
                "type": "code_execution_20250825",
                "name": "code_execution",
            })

        # Add registered tools
        for tool in self._tools.values():
            tool_def = tool.to_api_format(include_deferred=include_deferred)
            if tool_def:
                tools.append(tool_def)

        return tools

    def get_context_stats(self) -> dict[str, Any]:
        """Get statistics about context usage.

        Returns:
            Stats about loaded vs deferred tools and estimated token savings
        """
        loaded = len(self._loaded_tools)
        deferred = len([t for t in self._tools.values() if t.config.defer_loading])
        total = len(self._tools)

        # Rough estimate: ~500 tokens per tool definition
        tokens_per_tool = 500
        loaded_tokens = loaded * tokens_per_tool
        saved_tokens = deferred * tokens_per_tool

        return {
            "total_tools": total,
            "loaded_tools": loaded,
            "deferred_tools": deferred,
            "estimated_loaded_tokens": loaded_tokens,
            "estimated_saved_tokens": saved_tokens,
            "context_reduction_percent": (
                round(saved_tokens / max(total * tokens_per_tool, 1) * 100, 1)
                if total > 0
                else 0
            ),
        }


# Global registry instance
_registry: ToolRegistry | None = None


def get_registry() -> ToolRegistry:
    """Get the global tool registry."""
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry
