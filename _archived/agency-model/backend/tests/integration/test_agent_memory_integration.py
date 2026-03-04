"""Test memory integration with agents.

Tests that agents can properly use the domain memory system.
Run with: pytest tests/integration/test_agent_memory_integration.py -v -m integration
"""

import pytest
from uuid import uuid4

from src.memory.models import MemoryDomain, MemoryQuery
from src.memory.store import MemoryStore


@pytest.mark.integration
class TestAgentMemoryIntegration:
    """Test agent integration with memory system."""

    @pytest.fixture
    async def memory_store(self):
        """Create initialized MemoryStore."""
        store = MemoryStore()
        await store.initialize()
        yield store

    @pytest.mark.asyncio
    async def test_agent_can_store_knowledge(self, memory_store):
        """Verify agents can store project knowledge."""
        # Simulate agent learning about API design pattern
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="project_patterns",
            key="api_design",
            value={
                "pattern": "REST API with /api/v1/{resource}/{action}",
                "convention": "Use Zod for validation",
                "example": "/api/v1/users/create",
            },
            source="agent_discovery",
            tags=["api", "rest", "patterns"],
            generate_embedding=True,  # Enable semantic search
        )

        assert entry is not None
        assert entry.domain == MemoryDomain.KNOWLEDGE
        assert entry.category == "project_patterns"

        # Verify agent can retrieve this knowledge later
        results = await memory_store.query(
            MemoryQuery(
                domain=MemoryDomain.KNOWLEDGE,
                category="project_patterns",
                limit=10,
            )
        )

        assert len(results.entries) > 0
        assert any(e.key == "api_design" for e in results.entries)

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_agent_can_store_user_preferences(self, memory_store):
        """Verify agents can store user-specific preferences."""
        user_id = str(uuid4())

        # Store coding style preference
        entry = await memory_store.create(
            domain=MemoryDomain.PREFERENCE,
            category="coding_style",
            key="indentation",
            value={
                "style": "spaces",
                "size": 2,
                "quote_style": "single",
                "semicolons": False,
            },
            user_id=user_id,
            generate_embedding=False,
        )

        # Verify retrieval
        results = await memory_store.query(
            MemoryQuery(
                domain=MemoryDomain.PREFERENCE,
                category="coding_style",
                user_id=user_id,
                limit=10,
            )
        )

        assert len(results.entries) > 0
        assert results.entries[0].user_id == user_id
        assert results.entries[0].value["style"] == "spaces"

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_agent_can_store_test_failures(self, memory_store):
        """Verify agents can track test failure patterns."""
        # Store failure pattern
        entry = await memory_store.create(
            domain=MemoryDomain.TESTING,
            category="failure_patterns",
            key="auth_401_error",
            value={
                "error_signature": "AuthenticationError: 401 Unauthorized",
                "error_type": "runtime",
                "description": "API authentication failures",
                "solutions": [
                    {
                        "description": "Refresh OAuth token",
                        "success_count": 5,
                        "steps": ["Get refresh token", "Request new access token"],
                    }
                ],
            },
            tags=["authentication", "api", "401"],
            generate_embedding=True,
        )

        # Verify semantic search can find it
        results = await memory_store.find_similar(
            query_text="401 authentication error",
            domain=MemoryDomain.TESTING,
            similarity_threshold=0.3,
            limit=5,
        )

        assert len(results) > 0
        found = any(r.get("key") == "auth_401_error" for r in results)
        assert found

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_agent_can_use_semantic_search(self, memory_store):
        """Test agent using semantic search to find relevant context."""
        # Create multiple knowledge entries
        entries = []

        knowledge_items = [
            ("oauth_implementation", {"description": "OAuth 2.0 with PKCE flow"}),
            ("database_schema", {"description": "PostgreSQL with Supabase RLS"}),
            ("frontend_framework", {"description": "Next.js 15 with React 19"}),
        ]

        for key, value in knowledge_items:
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="architecture",
                key=key,
                value=value,
                generate_embedding=True,
            )
            entries.append(entry)

        # Agent searches for authentication-related knowledge
        results = await memory_store.find_similar(
            query_text="How is authentication implemented?",
            domain=MemoryDomain.KNOWLEDGE,
            similarity_threshold=0.2,
            limit=5,
        )

        # Should find OAuth entry as most relevant
        assert len(results) > 0
        result_keys = [r.get("key") for r in results]
        assert "oauth_implementation" in result_keys

        # Clean up
        for entry in entries:
            await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_agent_memory_relevance_feedback(self, memory_store):
        """Test agent providing relevance feedback on memories."""
        # Create memory
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="patterns",
            key="useful_pattern",
            value={"pattern": "Repository pattern for data access"},
            generate_embedding=False,
        )

        assert entry.relevance_score == 1.0

        # Agent uses this memory successfully -> positive feedback
        success = await memory_store.update_relevance(
            entry.id,
            feedback=0.5,  # Moderately helpful
        )
        assert success is True

        # Check relevance increased
        updated = await memory_store.get(entry.id)
        assert updated.relevance_score > 1.0

        # Agent tries to use it but it's not helpful -> negative feedback
        success = await memory_store.update_relevance(
            entry.id,
            feedback=-0.5,
            decay_rate=0.1,
        )
        assert success is True

        # Check relevance decreased
        updated = await memory_store.get(entry.id)
        assert updated.relevance_score < 1.1

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_agent_can_query_by_tags(self, memory_store):
        """Test agent querying memories by tags."""
        # Create memories with different tags
        entries = []

        entries.append(
            await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="patterns",
                key="pattern1",
                value={"pattern": "API design"},
                tags=["api", "rest", "backend"],
                generate_embedding=False,
            )
        )

        entries.append(
            await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="patterns",
                key="pattern2",
                value={"pattern": "Component design"},
                tags=["frontend", "react", "ui"],
                generate_embedding=False,
            )
        )

        entries.append(
            await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="patterns",
                key="pattern3",
                value={"pattern": "Full-stack API"},
                tags=["api", "frontend", "backend"],
                generate_embedding=False,
            )
        )

        # Query for API-related memories
        results = await memory_store.query(
            MemoryQuery(
                domain=MemoryDomain.KNOWLEDGE,
                category="patterns",
                tags=["api"],
                limit=10,
            )
        )

        # Should find pattern1 and pattern3
        result_keys = {e.key for e in results.entries}
        assert "pattern1" in result_keys
        assert "pattern3" in result_keys
        # pattern2 should not be included (no 'api' tag)

        # Clean up
        for entry in entries:
            await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_agent_cross_session_memory_persistence(self, memory_store):
        """Test that agent memory persists across sessions."""
        # Session 1: Agent learns about a pattern
        session1_entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="learned_patterns",
            key="session1_learning",
            value={"learned": "Agent learned this in session 1"},
            source="session_1",
            generate_embedding=False,
        )

        # Simulate session end (memory_store is recreated)
        session1_id = session1_entry.id
        del memory_store

        # Session 2: New agent instance
        memory_store_session2 = MemoryStore()
        await memory_store_session2.initialize()

        # Agent should be able to retrieve memory from session 1
        retrieved = await memory_store_session2.get(session1_id)

        assert retrieved is not None
        assert retrieved.key == "session1_learning"
        assert retrieved.value["learned"] == "Agent learned this in session 1"
        assert retrieved.source == "session_1"

        # Clean up
        await memory_store_session2.delete(session1_id)

    @pytest.mark.asyncio
    async def test_agent_debugging_context_storage(self, memory_store):
        """Test agent storing debugging context."""
        # Agent encounters a bug and stores debugging context
        entry = await memory_store.create(
            domain=MemoryDomain.DEBUGGING,
            category="investigations",
            key="bug_investigation_123",
            value={
                "initial_error": "TypeError: Cannot read property 'id' of undefined",
                "error_type": "runtime",
                "affected_files": ["src/api/users.ts"],
                "hypotheses": [
                    {
                        "description": "User object not properly validated",
                        "confidence": 0.8,
                        "status": "testing",
                    }
                ],
                "findings": [
                    {
                        "description": "User validation missing in middleware",
                        "type": "clue",
                    }
                ],
                "status": "in_progress",
            },
            tags=["bug", "runtime", "validation"],
            generate_embedding=True,
        )

        # Verify retrieval
        retrieved = await memory_store.get(entry.id)
        assert retrieved is not None
        assert retrieved.domain == MemoryDomain.DEBUGGING
        assert retrieved.value["status"] == "in_progress"
        assert len(retrieved.value["hypotheses"]) == 1

        # Agent can update investigation as it progresses
        updated = await memory_store.update(
            entry.id,
            {
                "value": {
                    **retrieved.value,
                    "status": "resolved",
                    "resolution": "Added user validation middleware",
                }
            },
        )

        assert updated.value["status"] == "resolved"

        # Clean up
        await memory_store.delete(entry.id)
