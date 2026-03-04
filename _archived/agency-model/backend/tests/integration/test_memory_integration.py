"""Integration tests for domain memory system.

Tests actual database operations without mocking.
Run with: pytest tests/integration/test_memory_integration.py -v -m integration
"""

import pytest
from uuid import uuid4

from src.memory.models import MemoryDomain, MemoryQuery
from src.memory.store import MemoryStore
from src.state.supabase import SupabaseStateStore


@pytest.mark.integration
class TestMemoryStoreIntegration:
    """Test MemoryStore with real database."""

    @pytest.fixture
    async def memory_store(self):
        """Create MemoryStore connected to test database."""
        store = MemoryStore()
        await store.initialize()
        yield store
        # Cleanup happens in individual tests

    @pytest.mark.asyncio
    async def test_create_and_retrieve_memory(self, memory_store):
        """Test creating and retrieving a memory entry."""
        # Create memory
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="integration_test",
            key="test_create_retrieve",
            value={"test": "data", "number": 42},
            generate_embedding=False,  # Skip embedding for speed
        )

        assert entry.id is not None
        assert entry.domain == MemoryDomain.KNOWLEDGE
        assert entry.category == "integration_test"
        assert entry.key == "test_create_retrieve"
        assert entry.value == {"test": "data", "number": 42}

        # Retrieve memory
        retrieved = await memory_store.get(entry.id)
        assert retrieved is not None
        assert retrieved.id == entry.id
        assert retrieved.key == "test_create_retrieve"
        assert retrieved.value == {"test": "data", "number": 42}
        assert retrieved.relevance_score == 1.0
        assert retrieved.access_count == 1  # Should be incremented

        # Clean up
        deleted = await memory_store.delete(entry.id)
        assert deleted is True

    @pytest.mark.asyncio
    async def test_create_memory_with_user_id(self, memory_store):
        """Test creating user-specific memory."""
        user_id = str(uuid4())

        entry = await memory_store.create(
            domain=MemoryDomain.PREFERENCE,
            category="user_settings",
            key="theme",
            value={"theme": "dark", "font_size": 14},
            user_id=user_id,
            generate_embedding=False,
        )

        assert entry.user_id == user_id

        # Retrieve and verify
        retrieved = await memory_store.get(entry.id)
        assert retrieved.user_id == user_id

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_create_memory_with_tags(self, memory_store):
        """Test creating memory with tags."""
        entry = await memory_store.create(
            domain=MemoryDomain.TESTING,
            category="failure_patterns",
            key="auth_401_error",
            value={"error": "401 Unauthorized"},
            tags=["authentication", "api", "http"],
            generate_embedding=False,
        )

        assert len(entry.tags) == 3
        assert "authentication" in entry.tags

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_update_memory(self, memory_store):
        """Test updating a memory entry."""
        # Create
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="integration_test",
            key="test_update",
            value={"status": "initial"},
            generate_embedding=False,
        )

        # Update
        updated = await memory_store.update(
            entry.id,
            {"value": {"status": "updated", "new_field": "added"}},
        )

        assert updated is not None
        assert updated.value == {"status": "updated", "new_field": "added"}

        # Verify persistence
        retrieved = await memory_store.get(updated.id)
        assert retrieved.value == {"status": "updated", "new_field": "added"}

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_query_memories_by_domain(self, memory_store):
        """Test querying memories by domain."""
        # Create test data
        entries = []
        for i in range(3):
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="integration_test",
                key=f"test_query_{i}",
                value={"index": i},
                generate_embedding=False,
            )
            entries.append(entry)

        # Query by domain
        result = await memory_store.query(
            MemoryQuery(
                domain=MemoryDomain.KNOWLEDGE,
                category="integration_test",
                limit=10,
            )
        )

        assert result.total_count >= 3
        assert len(result.entries) >= 3

        # Verify our entries are in results
        entry_ids = {e.id for e in result.entries}
        assert all(e.id in entry_ids for e in entries)

        # Clean up
        for entry in entries:
            await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_query_memories_with_pagination(self, memory_store):
        """Test memory query pagination."""
        # Create test data
        entries = []
        for i in range(5):
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="pagination_test",
                key=f"test_page_{i}",
                value={"index": i},
                generate_embedding=False,
            )
            entries.append(entry)

        # Query first page
        page1 = await memory_store.query(
            MemoryQuery(
                domain=MemoryDomain.KNOWLEDGE,
                category="pagination_test",
                limit=2,
                offset=0,
            )
        )

        assert len(page1.entries) == 2
        assert page1.total_count >= 5

        # Query second page
        page2 = await memory_store.query(
            MemoryQuery(
                domain=MemoryDomain.KNOWLEDGE,
                category="pagination_test",
                limit=2,
                offset=2,
            )
        )

        assert len(page2.entries) == 2

        # Ensure different results
        page1_ids = {e.id for e in page1.entries}
        page2_ids = {e.id for e in page2.entries}
        assert page1_ids.isdisjoint(page2_ids)

        # Clean up
        for entry in entries:
            await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_vector_search_with_embeddings(self, memory_store):
        """Test semantic search with real embeddings."""
        # Create memories with embeddings
        entries = []
        test_data = [
            ("oauth_pattern", {"pattern": "OAuth 2.0 authentication with PKCE"}),
            ("jwt_pattern", {"pattern": "JWT token-based authentication"}),
            ("api_design", {"pattern": "REST API with resource-based routing"}),
        ]

        for key, value in test_data:
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="patterns",
                key=key,
                value=value,
                generate_embedding=True,  # Generate real embeddings
            )
            entries.append(entry)

        # Search for similar memories
        results = await memory_store.find_similar(
            query_text="How does authentication work?",
            domain=MemoryDomain.KNOWLEDGE,
            similarity_threshold=0.1,  # Low threshold for test
            limit=5,
        )

        # Should find our entries
        assert len(results) > 0

        # OAuth and JWT patterns should be more relevant than API design
        result_keys = [r.get("key") for r in results]
        assert any(k in ["oauth_pattern", "jwt_pattern"] for k in result_keys)

        # Clean up
        for entry in entries:
            await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_access_count_increment(self, memory_store):
        """Test that access count increments on retrieval."""
        # Create memory
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="integration_test",
            key="test_access_count",
            value={"test": "data"},
            generate_embedding=False,
        )

        assert entry.access_count == 0

        # Retrieve multiple times
        for i in range(3):
            retrieved = await memory_store.get(entry.id, increment_access=True)
            assert retrieved.access_count == i + 1

        # Verify final count
        final = await memory_store.get(entry.id, increment_access=False)
        assert final.access_count == 3

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_update_relevance(self, memory_store):
        """Test updating memory relevance score."""
        # Create memory
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="integration_test",
            key="test_relevance",
            value={"test": "data"},
            generate_embedding=False,
        )

        assert entry.relevance_score == 1.0

        # Positive feedback
        success = await memory_store.update_relevance(
            entry.id,
            feedback=1.0,  # Very relevant
        )
        assert success is True

        retrieved = await memory_store.get(entry.id)
        assert retrieved.relevance_score > 1.0

        # Negative feedback
        success = await memory_store.update_relevance(
            entry.id,
            feedback=-1.0,  # Not relevant
            decay_rate=0.2,
        )
        assert success is True

        retrieved = await memory_store.get(entry.id)
        assert retrieved.relevance_score < 1.0

        # Clean up
        await memory_store.delete(entry.id)


@pytest.mark.integration
class TestSupabaseStateStoreMemoryIntegration:
    """Test SupabaseStateStore memory methods with real database."""

    @pytest.fixture
    def supabase_store(self):
        """Create SupabaseStateStore."""
        return SupabaseStateStore()

    @pytest.mark.asyncio
    async def test_create_memory_via_supabase_store(self, supabase_store):
        """Test creating memory through SupabaseStateStore."""
        memory = await supabase_store.create_memory(
            domain="knowledge",
            category="integration_test",
            key="supabase_create_test",
            value={"test": "supabase integration"},
        )

        assert memory is not None
        assert memory["key"] == "supabase_create_test"
        assert memory["domain"] == "knowledge"
        assert "id" in memory

        # Clean up
        await supabase_store.delete_memory(memory["id"])

    @pytest.mark.asyncio
    async def test_query_memories_via_supabase_store(self, supabase_store):
        """Test querying memories through SupabaseStateStore."""
        # Create test data
        memory = await supabase_store.create_memory(
            domain="testing",
            category="integration_test",
            key="supabase_query_test",
            value={"test": "query"},
        )

        # Query
        results = await supabase_store.query_memories(
            domain="testing",
            category="integration_test",
            limit=10,
        )

        assert len(results) > 0
        assert any(r["key"] == "supabase_query_test" for r in results)

        # Clean up
        await supabase_store.delete_memory(memory["id"])

    @pytest.mark.asyncio
    async def test_get_memory_via_supabase_store(self, supabase_store):
        """Test retrieving memory through SupabaseStateStore."""
        # Create
        memory = await supabase_store.create_memory(
            domain="knowledge",
            category="integration_test",
            key="supabase_get_test",
            value={"test": "get"},
        )

        # Get
        retrieved = await supabase_store.get_memory(memory["id"])

        assert retrieved is not None
        assert retrieved["id"] == memory["id"]
        assert retrieved["key"] == "supabase_get_test"

        # Clean up
        await supabase_store.delete_memory(memory["id"])

    @pytest.mark.asyncio
    async def test_update_memory_via_supabase_store(self, supabase_store):
        """Test updating memory through SupabaseStateStore."""
        # Create
        memory = await supabase_store.create_memory(
            domain="knowledge",
            category="integration_test",
            key="supabase_update_test",
            value={"status": "initial"},
        )

        # Update
        updated = await supabase_store.update_memory(
            memory["id"],
            {"value": {"status": "updated"}},
        )

        assert updated is not None
        assert updated["value"] == {"status": "updated"}

        # Clean up
        await supabase_store.delete_memory(memory["id"])

    @pytest.mark.asyncio
    async def test_delete_memory_via_supabase_store(self, supabase_store):
        """Test deleting memory through SupabaseStateStore."""
        # Create
        memory = await supabase_store.create_memory(
            domain="knowledge",
            category="integration_test",
            key="supabase_delete_test",
            value={"test": "delete"},
        )

        # Delete
        success = await supabase_store.delete_memory(memory["id"])
        assert success is True

        # Verify deletion
        retrieved = await supabase_store.get_memory(memory["id"])
        assert retrieved is None
