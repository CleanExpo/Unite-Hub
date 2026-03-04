"""MCP Server for Domain Memory - Exposes domain memory to agents via MCP.

This custom MCP server makes the domain memory system (vector search, knowledge,
patterns, etc.) available to AI agents through the Model Context Protocol.

Usage:
    uv run python -m src.tools.mcp_server

This will start an MCP server that agents can connect to for:
- Querying domain memories
- Searching for similar patterns
- Storing new learnings
- Accessing knowledge base
"""

from typing import Any

from src.memory.models import MemoryDomain, MemoryQuery
from src.memory.store import MemoryStore
from src.utils import get_logger

logger = get_logger(__name__)


class DomainMemoryMCPServer:
    """MCP server exposing domain memory operations.

    Note:
        Full implementation would use MCP SDK:
        from mcp import Server, Resource, Tool
        from mcp.server import stdio_server

        @server.list_resources()
        async def list_resources(): ...

        @server.list_tools()
        async def list_tools(): ...

        if __name__ == "__main__":
            stdio_server(server)
    """

    def __init__(self) -> None:
        """Initialize domain memory MCP server."""
        self.memory_store = MemoryStore()
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the memory store."""
        if not self._initialized:
            await self.memory_store.initialize()
            self._initialized = True
            logger.info("Domain memory MCP server initialized")

    async def list_resources(self) -> list[dict[str, Any]]:
        """List available memory resources.

        Returns:
            List of resource definitions for MCP clients
        """
        resources = [
            {
                "uri": "memory://knowledge/architecture",
                "name": "Architecture Patterns",
                "description": "Stored architectural decisions and patterns"
            },
            {
                "uri": "memory://knowledge/patterns",
                "name": "Code Patterns",
                "description": "Successful code patterns and approaches"
            },
            {
                "uri": "memory://testing/failures",
                "name": "Failure Patterns",
                "description": "Known failure patterns to avoid"
            },
            {
                "uri": "memory://preferences/user",
                "name": "User Preferences",
                "description": "User-specific preferences and settings"
            },
            {
                "uri": "memory://debugging/sessions",
                "name": "Debugging Sessions",
                "description": "Past debugging sessions and solutions"
            }
        ]

        return resources

    async def list_tools(self) -> list[dict[str, Any]]:
        """List available memory operation tools.

        Returns:
            List of tool definitions for MCP clients
        """
        tools = [
            {
                "name": "query_memory",
                "description": "Query domain memories with filters",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "domain": {
                            "type": "string",
                            "enum": ["knowledge", "preferences", "testing", "debugging"],
                            "description": "Memory domain to query"
                        },
                        "category": {
                            "type": "string",
                            "description": "Category filter (optional)"
                        },
                        "user_id": {
                            "type": "string",
                            "description": "User ID filter (optional)"
                        },
                        "limit": {
                            "type": "number",
                            "default": 10,
                            "description": "Max results"
                        }
                    }
                }
            },
            {
                "name": "search_similar",
                "description": "Semantic search through domain memories",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query text"
                        },
                        "domain": {
                            "type": "string",
                            "enum": ["knowledge", "preferences", "testing", "debugging"],
                            "description": "Memory domain filter (optional)"
                        },
                        "similarity_threshold": {
                            "type": "number",
                            "default": 0.7,
                            "description": "Minimum similarity score (0-1)"
                        },
                        "limit": {
                            "type": "number",
                            "default": 5,
                            "description": "Max results"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "store_pattern",
                "description": "Store a successful pattern for future reuse",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "pattern_type": {
                            "type": "string",
                            "description": "Type of pattern (e.g., 'authentication', 'api_design')"
                        },
                        "pattern_data": {
                            "type": "object",
                            "description": "Pattern details"
                        },
                        "session_id": {
                            "type": "string",
                            "description": "Session ID where discovered (optional)"
                        }
                    },
                    "required": ["pattern_type", "pattern_data"]
                }
            },
            {
                "name": "store_failure",
                "description": "Store a failure pattern to avoid repeating",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "failure_type": {
                            "type": "string",
                            "description": "Type of failure"
                        },
                        "context": {
                            "type": "object",
                            "description": "Context of what failed and why"
                        }
                    },
                    "required": ["failure_type", "context"]
                }
            },
            {
                "name": "get_relevant_context",
                "description": "Get relevant past work for a new task",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "task_description": {
                            "type": "string",
                            "description": "Description of current task"
                        },
                        "domain": {
                            "type": "string",
                            "enum": ["knowledge", "preferences", "testing", "debugging"],
                            "description": "Domain filter (optional)"
                        }
                    },
                    "required": ["task_description"]
                }
            }
        ]

        return tools

    async def execute_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any]
    ) -> dict[str, Any]:
        """Execute a memory operation tool.

        Args:
            tool_name: Name of tool to execute
            arguments: Tool arguments

        Returns:
            Tool result
        """
        if not self._initialized:
            await self.initialize()

        logger.info(
            "Executing memory tool",
            tool=tool_name
        )

        try:
            if tool_name == "query_memory":
                return await self._tool_query_memory(arguments)
            elif tool_name == "search_similar":
                return await self._tool_search_similar(arguments)
            elif tool_name == "store_pattern":
                return await self._tool_store_pattern(arguments)
            elif tool_name == "store_failure":
                return await self._tool_store_failure(arguments)
            elif tool_name == "get_relevant_context":
                return await self._tool_get_relevant_context(arguments)
            else:
                raise ValueError(f"Unknown tool: {tool_name}")

        except Exception as e:
            logger.error(
                "Tool execution failed",
                tool=tool_name,
                error=str(e)
            )
            return {"error": str(e), "success": False}

    async def _tool_query_memory(self, args: dict[str, Any]) -> dict[str, Any]:
        """Execute query_memory tool."""
        domain_str = args.get("domain")
        domain = MemoryDomain(domain_str) if domain_str else None

        query = MemoryQuery(
            domain=domain,
            category=args.get("category"),
            user_id=args.get("user_id"),
            limit=args.get("limit", 10)
        )

        result = await self.memory_store.query(query)

        return {
            "success": True,
            "entries": [e.model_dump() for e in result.entries],
            "total_count": result.total_count
        }

    async def _tool_search_similar(self, args: dict[str, Any]) -> dict[str, Any]:
        """Execute search_similar tool."""
        domain_str = args.get("domain")
        domain = MemoryDomain(domain_str) if domain_str else None

        similar = await self.memory_store.find_similar(
            query_text=args["query"],
            domain=domain,
            user_id=args.get("user_id"),
            similarity_threshold=args.get("similarity_threshold", 0.7),
            limit=args.get("limit", 5)
        )

        return {
            "success": True,
            "results": similar
        }

    async def _tool_store_pattern(self, args: dict[str, Any]) -> dict[str, Any]:
        """Execute store_pattern tool."""
        entry = await self.memory_store.store_pattern(
            pattern_type=args["pattern_type"],
            pattern_data=args["pattern_data"],
            session_id=args.get("session_id"),
            user_id=args.get("user_id")
        )

        return {
            "success": True,
            "memory_id": str(entry.id)
        }

    async def _tool_store_failure(self, args: dict[str, Any]) -> dict[str, Any]:
        """Execute store_failure tool."""
        entry = await self.memory_store.store_failure(
            failure_type=args["failure_type"],
            context=args["context"],
            session_id=args.get("session_id"),
            user_id=args.get("user_id")
        )

        return {
            "success": True,
            "memory_id": str(entry.id)
        }

    async def _tool_get_relevant_context(self, args: dict[str, Any]) -> dict[str, Any]:
        """Execute get_relevant_context tool."""
        domain_str = args.get("domain")
        domain = MemoryDomain(domain_str) if domain_str else None

        context = await self.memory_store.retrieve_relevant_context(
            task_description=args["task_description"],
            domain=domain,
            user_id=args.get("user_id"),
            limit=args.get("limit", 5)
        )

        return {
            "success": True,
            "relevant_context": context
        }


async def main() -> None:
    """Main entry point for MCP server.

    Starts the MCP server that agents can connect to.
    """
    server = DomainMemoryMCPServer()
    await server.initialize()

    logger.info("Domain Memory MCP Server started")

    # In full implementation, would run stdio server loop:
    # from mcp.server import stdio_server
    # await stdio_server(server)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
