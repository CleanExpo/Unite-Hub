"""Tests for MemoryStore CRUD and vector search operations."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from src.memory.store import MemoryStore
from src.memory.models import (
    MemoryDomain,
    MemoryEntry,
    MemoryQuery,
    MemoryResult,
)


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client."""
    client = MagicMock()

    # Mock table chain
    table_mock = MagicMock()
    client.table.return_value = table_mock

    # Mock RPC
    client.rpc.return_value = MagicMock()

    return client


@pytest.fixture
def mock_embedding_provider():
    """Mock embedding provider."""
    provider = AsyncMock()
    provider.get_embedding.return_value = [0.1] * 1536
    return provider


@pytest.fixture
async def memory_store(mock_supabase_client, mock_embedding_provider):
    """Create a MemoryStore with mocked dependencies."""
    with patch("src.memory.store.SupabaseStateStore") as mock_supabase:
        mock_supabase.return_value.client = mock_supabase_client

        store = MemoryStore()
        store.embedding_provider = mock_embedding_provider

        yield store


class TestMemoryStoreCRUD:
    """Test CRUD operations."""

    @pytest.mark.asyncio
    async def test_create_memory(self, memory_store, mock_supabase_client):
        """Test creating a new memory entry."""
        # Mock response
        mock_response = MagicMock()
        mock_response.data = [{
            "id": str(uuid4()),
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0"},
            "user_id": None,
            "embedding": [0.1] * 1536,
            "relevance_score": 1.0,
            "access_count": 0,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": None,
            "expires_at": None,
        }]

        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = mock_response

        # Create memory
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="architecture",
            key="api_pattern",
            value={"pattern": "OAuth 2.0"},
        )

        assert entry.domain == MemoryDomain.KNOWLEDGE
        assert entry.category == "architecture"
        assert entry.key == "api_pattern"
        assert entry.embedding is not None

        # Verify embedding was generated
        memory_store.embedding_provider.get_embedding.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_memory_without_embedding(self, memory_store, mock_supabase_client):
        """Test creating memory without generating embedding."""
        mock_response = MagicMock()
        mock_response.data = [{
            "id": str(uuid4()),
            "domain": "preference",
            "category": "coding_style",
            "key": "indentation",
            "value": {"style": "spaces"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 1.0,
            "access_count": 0,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": None,
            "expires_at": None,
        }]

        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = mock_response

        entry = await memory_store.create(
            domain=MemoryDomain.PREFERENCE,
            category="coding_style",
            key="indentation",
            value={"style": "spaces"},
            generate_embedding=False,
        )

        assert entry.embedding is None
        memory_store.embedding_provider.get_embedding.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_memory(self, memory_store, mock_supabase_client):
        """Test retrieving a memory entry."""
        memory_id = str(uuid4())

        mock_response = MagicMock()
        mock_response.data = [{
            "id": memory_id,
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 1.0,
            "access_count": 5,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": "2024-01-02T00:00:00",
            "expires_at": None,
        }]

        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        mock_supabase_client.rpc.return_value.execute.return_value = MagicMock()

        entry = await memory_store.get(memory_id)

        assert entry is not None
        assert entry.id == memory_id
        assert entry.access_count == 6  # Incremented

    @pytest.mark.asyncio
    async def test_get_memory_not_found(self, memory_store, mock_supabase_client):
        """Test retrieving a non-existent memory."""
        mock_response = MagicMock()
        mock_response.data = []

        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

        entry = await memory_store.get(str(uuid4()))

        assert entry is None

    @pytest.mark.asyncio
    async def test_update_memory(self, memory_store, mock_supabase_client):
        """Test updating a memory entry."""
        memory_id = str(uuid4())

        mock_response = MagicMock()
        mock_response.data = [{
            "id": memory_id,
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0 with PKCE"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 0.9,
            "access_count": 10,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-03T00:00:00",
            "tags": ["authentication"],
            "source": None,
            "last_accessed_at": "2024-01-02T00:00:00",
            "expires_at": None,
        }]

        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response

        entry = await memory_store.update(
            memory_id,
            {"value": {"pattern": "OAuth 2.0 with PKCE"}, "tags": ["authentication"]},
        )

        assert entry is not None
        assert entry.value == {"pattern": "OAuth 2.0 with PKCE"}
        assert "authentication" in entry.tags

    @pytest.mark.asyncio
    async def test_delete_memory(self, memory_store, mock_supabase_client):
        """Test deleting a memory entry."""
        memory_id = str(uuid4())

        mock_response = MagicMock()
        mock_response.data = [{"id": memory_id}]

        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response

        success = await memory_store.delete(memory_id)

        assert success is True

    @pytest.mark.asyncio
    async def test_delete_memory_not_found(self, memory_store, mock_supabase_client):
        """Test deleting a non-existent memory."""
        mock_response = MagicMock()
        mock_response.data = []

        mock_supabase_client.table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response

        success = await memory_store.delete(str(uuid4()))

        assert success is False


class TestMemoryStoreQuery:
    """Test query operations."""

    @pytest.mark.asyncio
    async def test_query_by_domain(self, memory_store, mock_supabase_client):
        """Test querying memories by domain."""
        mock_response = MagicMock()
        mock_response.data = [
            {
                "id": str(uuid4()),
                "domain": "knowledge",
                "category": "architecture",
                "key": "api_pattern",
                "value": {"pattern": "OAuth 2.0"},
                "user_id": None,
                "embedding": None,
                "relevance_score": 1.0,
                "access_count": 0,
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00",
                "tags": [],
                "source": None,
                "last_accessed_at": None,
                "expires_at": None,
            }
        ]

        mock_count_response = MagicMock()
        mock_count_response.count = 1

        # Mock the query chain
        query_mock = mock_supabase_client.table.return_value.select.return_value
        query_mock.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_response

        # Mock the count query
        count_query_mock = mock_supabase_client.table.return_value.select.return_value
        count_query_mock.eq.return_value.execute.return_value = mock_count_response

        query = MemoryQuery(domain=MemoryDomain.KNOWLEDGE)
        result = await memory_store.query(query)

        assert result.total_count == 1
        assert len(result.entries) == 1
        assert result.entries[0].domain == MemoryDomain.KNOWLEDGE

    @pytest.mark.asyncio
    async def test_query_with_pagination(self, memory_store, mock_supabase_client):
        """Test querying with pagination."""
        mock_response = MagicMock()
        mock_response.data = []

        mock_count_response = MagicMock()
        mock_count_response.count = 100

        query_mock = mock_supabase_client.table.return_value.select.return_value
        query_mock.order.return_value.range.return_value.execute.return_value = mock_response

        count_query_mock = mock_supabase_client.table.return_value.select.return_value
        count_query_mock.execute.return_value = mock_count_response

        query = MemoryQuery(limit=20, offset=40)
        result = await memory_store.query(query)

        assert result.total_count == 100
        # Verify range was called with correct pagination
        query_mock.order.return_value.range.assert_called_once_with(40, 59)

    @pytest.mark.asyncio
    async def test_query_with_filters(self, memory_store, mock_supabase_client):
        """Test querying with multiple filters."""
        mock_response = MagicMock()
        mock_response.data = []

        mock_count_response = MagicMock()
        mock_count_response.count = 0

        query_mock = mock_supabase_client.table.return_value.select.return_value
        query_mock.eq.return_value.eq.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_response

        count_query_mock = mock_supabase_client.table.return_value.select.return_value
        count_query_mock.eq.return_value.eq.return_value.eq.return_value.execute.return_value = mock_count_response

        user_id = str(uuid4())
        query = MemoryQuery(
            domain=MemoryDomain.TESTING,
            category="patterns",
            user_id=user_id,
        )
        result = await memory_store.query(query)

        assert result.total_count == 0


class TestMemoryStoreVectorSearch:
    """Test vector similarity search."""

    @pytest.mark.asyncio
    async def test_find_similar(self, memory_store, mock_supabase_client, mock_embedding_provider):
        """Test semantic similarity search."""
        mock_response = MagicMock()
        mock_response.data = [
            {
                "id": str(uuid4()),
                "domain": "knowledge",
                "category": "architecture",
                "key": "api_auth",
                "value": {"pattern": "OAuth 2.0"},
                "similarity": 0.95,
            },
            {
                "id": str(uuid4()),
                "domain": "knowledge",
                "category": "security",
                "key": "token_validation",
                "value": {"method": "JWT"},
                "similarity": 0.87,
            },
        ]

        mock_supabase_client.rpc.return_value.execute.return_value = mock_response

        results = await memory_store.find_similar(
            query_text="How does authentication work?",
            domain=MemoryDomain.KNOWLEDGE,
            similarity_threshold=0.8,
            limit=10,
        )

        assert len(results) == 2
        assert results[0]["similarity"] > results[1]["similarity"]

        # Verify embedding was generated
        mock_embedding_provider.get_embedding.assert_called_once_with("How does authentication work?")

    @pytest.mark.asyncio
    async def test_find_similar_with_user_filter(self, memory_store, mock_supabase_client, mock_embedding_provider):
        """Test similarity search with user filter."""
        user_id = str(uuid4())

        mock_response = MagicMock()
        mock_response.data = []

        mock_supabase_client.rpc.return_value.execute.return_value = mock_response

        results = await memory_store.find_similar(
            query_text="coding style preferences",
            user_id=user_id,
        )

        # Verify RPC was called with user filter
        call_args = mock_supabase_client.rpc.call_args
        assert call_args[0][0] == "find_similar_memories"
        # Access the arguments dict from args[1]
        rpc_params = call_args[0][1] if len(call_args[0]) > 1 else call_args[1]
        assert rpc_params["filter_user_id"] == user_id


class TestMemoryStoreMaintenance:
    """Test maintenance operations."""

    @pytest.mark.asyncio
    async def test_prune_stale(self, memory_store, mock_supabase_client):
        """Test pruning stale memories."""
        mock_response = MagicMock()
        mock_response.data = 5  # 5 memories pruned

        mock_supabase_client.rpc.return_value.execute.return_value = mock_response

        deleted_count = await memory_store.prune_stale(
            min_relevance=0.3,
            max_age_days=90,
        )

        assert deleted_count == 5

        # Verify RPC was called
        call_args = mock_supabase_client.rpc.call_args
        assert call_args[0][0] == "prune_stale_memories"

    @pytest.mark.asyncio
    async def test_update_relevance_positive(self, memory_store, mock_supabase_client):
        """Test updating relevance with positive feedback."""
        memory_id = str(uuid4())

        # Mock get response
        get_response = MagicMock()
        get_response.data = [{
            "id": memory_id,
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 0.8,
            "access_count": 10,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": "2024-01-02T00:00:00",
            "expires_at": None,
        }]

        # Mock update response - needs all required fields for MemoryEntry
        update_response = MagicMock()
        update_response.data = [{
            "id": memory_id,
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 0.9,
            "access_count": 10,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-03T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": "2024-01-02T00:00:00",
            "expires_at": None,
        }]

        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = get_response
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = update_response
        mock_supabase_client.rpc.return_value.execute.return_value = MagicMock()

        success = await memory_store.update_relevance(memory_id, feedback=1.0)

        assert success is True

    @pytest.mark.asyncio
    async def test_update_relevance_negative(self, memory_store, mock_supabase_client):
        """Test updating relevance with negative feedback."""
        memory_id = str(uuid4())

        # Mock get response
        get_response = MagicMock()
        get_response.data = [{
            "id": memory_id,
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 0.8,
            "access_count": 10,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": "2024-01-02T00:00:00",
            "expires_at": None,
        }]

        # Mock update response - needs all required fields for MemoryEntry
        update_response = MagicMock()
        update_response.data = [{
            "id": memory_id,
            "domain": "knowledge",
            "category": "architecture",
            "key": "api_pattern",
            "value": {"pattern": "OAuth 2.0"},
            "user_id": None,
            "embedding": None,
            "relevance_score": 0.7,
            "access_count": 10,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-03T00:00:00",
            "tags": [],
            "source": None,
            "last_accessed_at": "2024-01-02T00:00:00",
            "expires_at": None,
        }]

        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = get_response
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = update_response
        mock_supabase_client.rpc.return_value.execute.return_value = MagicMock()

        success = await memory_store.update_relevance(memory_id, feedback=-1.0)

        assert success is True


class TestMemoryStoreHelpers:
    """Test helper methods."""

    def test_memory_to_text(self, memory_store):
        """Test converting memory to text for embedding."""
        text = memory_store._memory_to_text(
            domain=MemoryDomain.KNOWLEDGE,
            category="architecture",
            key="api_pattern",
            value={
                "pattern": "OAuth 2.0",
                "flow": "PKCE",
                "endpoints": ["/auth", "/token"],
            },
        )

        assert "knowledge" in text.lower()
        assert "architecture" in text
        assert "api_pattern" in text
        assert "OAuth 2.0" in text
        assert "PKCE" in text
