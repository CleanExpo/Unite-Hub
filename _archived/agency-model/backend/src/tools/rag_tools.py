"""RAG tools for agent use."""

from typing import Any

from src.utils import get_logger

from .registry import (
    ToolCategory,
    ToolConfig,
    ToolDefinition,
    ToolExample,
)

logger = get_logger(__name__)

# Global store instance
_rag_store = None


async def get_rag_store():
    """Get initialized RAG store."""
    global _rag_store
    if _rag_store is None:
        from src.rag.storage import RAGStore

        _rag_store = RAGStore()
        await _rag_store.initialize()
    return _rag_store


async def search_knowledge_base(
    query: str,
    project_id: str,
    search_type: str = "hybrid",
    limit: int = 5,
) -> dict[str, Any]:
    """
    Search the RAG knowledge base for relevant information.

    Args:
        query: Search query
        project_id: Project ID to search within
        search_type: "vector", "keyword", or "hybrid"
        limit: Maximum results

    Returns:
        Search results with chunks
    """
    try:

        store = await get_rag_store()

        # Execute search
        if search_type == "hybrid":
            results = await store.hybrid_search(
                query=query,
                project_id=project_id,
                limit=limit,
            )
        else:
            results = await store.vector_search(
                query=query,
                project_id=project_id,
                limit=limit,
            )

        return {
            "status": "success",
            "query": query,
            "results": results,
            "count": len(results),
        }

    except Exception as e:
        logger.error("RAG search failed", error=str(e))
        return {
            "status": "error",
            "error": str(e),
            "results": [],
            "count": 0,
        }


# Tool definition
RAG_SEARCH_TOOL = ToolDefinition(
    name="search_knowledge_base",
    description="""Search the RAG knowledge base for relevant information.

Use this tool to find documentation, code examples, and project knowledge.
Supports vector similarity search and hybrid (vector + keyword) search.""",
    input_schema={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query - what you're looking for",
            },
            "project_id": {
                "type": "string",
                "description": "Project ID to search within",
            },
            "search_type": {
                "type": "string",
                "enum": ["vector", "keyword", "hybrid"],
                "description": "Search strategy",
                "default": "hybrid",
            },
            "limit": {
                "type": "integer",
                "description": "Maximum number of results",
                "default": 5,
            },
        },
        "required": ["query", "project_id"],
    },
    handler=search_knowledge_base,
    config=ToolConfig(
        defer_loading=False,  # Core tool, always loaded
        allowed_callers=["code_execution_20250825"],  # Programmatic calling
        parallel_safe=True,
        cache_results=True,
        cache_ttl_seconds=300,
    ),
    examples=[
        ToolExample(
            description="Search for authentication documentation",
            input={
                "query": "How does OAuth authentication work?",
                "project_id": "proj_123",
                "search_type": "hybrid",
                "limit": 3,
            },
            expected_behavior="Returns top 3 chunks about OAuth authentication",
        )
    ],
    categories=[ToolCategory.CORE, ToolCategory.DATABASE],
    keywords=["search", "rag", "knowledge", "documentation", "retrieval", "find"],
)
