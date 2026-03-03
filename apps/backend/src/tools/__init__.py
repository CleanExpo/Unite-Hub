"""Advanced Tool Use System.

Implements Anthropic's advanced tool use features:
- Tool Search Tool: Dynamic tool discovery (85% context reduction)
- Programmatic Tool Calling: Code execution for tool orchestration (37% token reduction)
- Tool Use Examples: Improved parameter accuracy (72% → 90%)

Usage:
    from src.tools import register_all_tools, get_registry
    from src.tools.search import ToolSearcher
    from src.tools.programmatic import ProgrammaticToolCaller

    # Initialize all tools
    registry = register_all_tools()

    # Get API-ready tools with deferred loading
    api_tools = registry.to_api_format(
        include_search_tool=True,
        include_code_execution=True,
    )

    # Search for relevant tools
    searcher = ToolSearcher(registry)
    results = searcher.search("verify task outputs")

    # Enable programmatic calling
    caller = ProgrammaticToolCaller(registry)
    context = caller.create_context()
"""

from .definitions import get_tool_stats, register_all_tools
from .programmatic import ProgrammaticToolCaller, ToolExecutionContext
from .registry import (
    ToolCategory,
    ToolConfig,
    ToolDefinition,
    ToolExample,
    ToolRegistry,
    get_registry,
)
from .search import SearchResult, ToolSearcher

# Beta header for advanced tool use
BETA_HEADER = "advanced-tool-use-2025-11-20"

__all__ = [
    # Core exports
    "ToolRegistry",
    "ToolDefinition",
    "ToolExample",
    "ToolConfig",
    "ToolCategory",
    "get_registry",
    # Search
    "ToolSearcher",
    "SearchResult",
    # Programmatic calling
    "ProgrammaticToolCaller",
    "ToolExecutionContext",
    # Definitions
    "register_all_tools",
    "get_tool_stats",
    # Constants
    "BETA_HEADER",
]
