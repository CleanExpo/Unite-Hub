"""Tests for RAG search functionality."""

import pytest
from unittest.mock import AsyncMock, MagicMock

# Supabase removed in JWT migration — all Supabase-dependent tests are skipped.
HAS_SUPABASE = False

requires_supabase = pytest.mark.skipif(
    not HAS_SUPABASE,
    reason="Persistent state store not configured (Supabase removed, PostgreSQL migration pending)",
)


@requires_supabase
@pytest.mark.asyncio
async def test_rag_store_initialization():
    """Test RAG store can be initialized."""
    from src.rag.storage import RAGStore

    store = RAGStore()
    await store.initialize()

    assert store.supabase is not None
    assert store.client is not None
    assert store.embedding_provider is not None


@requires_supabase
@pytest.mark.asyncio
async def test_hybrid_search_call():
    """Test hybrid search function call structure."""
    from src.rag.storage import RAGStore

    store = RAGStore()
    await store.initialize()

    store.embedding_provider.get_embedding = AsyncMock(return_value=[0.1] * 1536)
    store.client.rpc = AsyncMock(return_value=MagicMock(data=[]))

    results = await store.hybrid_search(
        query="test query",
        project_id="test-project",
        vector_weight=0.6,
        keyword_weight=0.4,
        limit=10,
    )

    assert store.embedding_provider.get_embedding.called
    assert store.client.rpc.called
    call_args = store.client.rpc.call_args
    assert call_args[0][0] == "hybrid_search"


@requires_supabase
@pytest.mark.asyncio
async def test_vector_search_call():
    """Test vector search function call."""
    from src.rag.storage import RAGStore

    store = RAGStore()
    await store.initialize()

    store.embedding_provider.get_embedding = AsyncMock(return_value=[0.1] * 1536)

    mock_execute = MagicMock()
    mock_execute.data = []

    mock_builder = MagicMock()
    mock_builder.execute.return_value = mock_execute
    mock_builder.select.return_value = mock_builder
    mock_builder.match.return_value = mock_builder
    mock_builder.order.return_value = mock_builder
    mock_builder.limit.return_value = mock_builder

    store.client.table = MagicMock(return_value=mock_builder)

    results = await store.vector_search(
        query="test query",
        project_id="test-project",
        limit=5,
    )

    assert isinstance(results, list)


# Integration tests (require database)
@pytest.mark.integration
@pytest.mark.asyncio
async def test_search_knowledge_base_tool():
    """Test the search_knowledge_base tool (requires database)."""
    from src.tools.rag_tools import search_knowledge_base

    result = await search_knowledge_base(
        query="test",
        project_id="test-project",
        search_type="vector",
        limit=5,
    )

    assert "status" in result
    assert "results" in result
    assert isinstance(result["results"], list)
