"""Tests for domain memory Pydantic models."""

import pytest
from datetime import datetime
from uuid import uuid4

from src.memory.models import (
    MemoryDomain,
    MemoryEntry,
    MemoryQuery,
    MemoryResult,
    KnowledgeType,
    KnowledgeEntry,
    CodingStyle,
    CommunicationPreferences,
    WorkflowPreferences,
    PreferenceEntry,
    TestFailurePattern,
    TestResult,
    Hypothesis,
    InvestigationFinding,
    DebuggingSession,
)


class TestMemoryEntry:
    """Test MemoryEntry model."""

    def test_create_memory_entry(self):
        """Test creating a basic memory entry."""
        entry = MemoryEntry(
            domain=MemoryDomain.KNOWLEDGE,
            category="architecture",
            key="api_pattern",
            value={"pattern": "OAuth 2.0"},
        )

        assert entry.domain == MemoryDomain.KNOWLEDGE
        assert entry.category == "architecture"
        assert entry.key == "api_pattern"
        assert entry.value == {"pattern": "OAuth 2.0"}
        assert entry.relevance_score == 1.0
        assert entry.access_count == 0
        assert entry.id.startswith("mem_")

    def test_memory_entry_with_embedding(self):
        """Test memory entry with vector embedding."""
        embedding = [0.1] * 1536

        entry = MemoryEntry(
            domain=MemoryDomain.KNOWLEDGE,
            category="test",
            key="test_key",
            value={"data": "test"},
            embedding=embedding,
        )

        assert entry.embedding == embedding
        assert len(entry.embedding) == 1536

    def test_memory_entry_with_user_id(self):
        """Test memory entry with user ID."""
        user_id = str(uuid4())

        entry = MemoryEntry(
            domain=MemoryDomain.PREFERENCE,
            category="coding_style",
            key="indentation",
            value={"style": "spaces", "size": 2},
            user_id=user_id,
        )

        assert entry.user_id == user_id

    def test_memory_entry_with_tags(self):
        """Test memory entry with tags."""
        entry = MemoryEntry(
            domain=MemoryDomain.TESTING,
            category="patterns",
            key="auth_failure",
            value={"error": "401"},
            tags=["authentication", "api", "http"],
        )

        assert len(entry.tags) == 3
        assert "authentication" in entry.tags

    def test_relevance_score_validation(self):
        """Test relevance score stays within 0-1 range."""
        entry = MemoryEntry(
            domain=MemoryDomain.KNOWLEDGE,
            category="test",
            key="test",
            value={},
            relevance_score=0.5,
        )

        assert 0.0 <= entry.relevance_score <= 1.0


class TestMemoryQuery:
    """Test MemoryQuery model."""

    def test_create_basic_query(self):
        """Test creating a basic query."""
        query = MemoryQuery(
            domain=MemoryDomain.KNOWLEDGE,
            category="architecture",
        )

        assert query.domain == MemoryDomain.KNOWLEDGE
        assert query.category == "architecture"
        assert query.limit == 10
        assert query.offset == 0

    def test_query_with_semantic_search(self):
        """Test query with semantic search parameters."""
        query = MemoryQuery(
            query_text="How does authentication work?",
            similarity_threshold=0.8,
        )

        assert query.query_text == "How does authentication work?"
        assert query.similarity_threshold == 0.8

    def test_query_with_filters(self):
        """Test query with multiple filters."""
        query = MemoryQuery(
            domain=MemoryDomain.TESTING,
            tags=["authentication", "api"],
            min_relevance=0.7,
            limit=20,
        )

        assert query.tags == ["authentication", "api"]
        assert query.min_relevance == 0.7
        assert query.limit == 20


class TestKnowledgeEntry:
    """Test KnowledgeEntry model."""

    def test_create_knowledge_entry(self):
        """Test creating a knowledge entry."""
        entry = KnowledgeEntry(
            type=KnowledgeType.ARCHITECTURAL_DECISION,
            title="Use OAuth 2.0 for Authentication",
            description="API uses OAuth 2.0 with PKCE flow for secure authentication",
            context="All API endpoints require authentication",
        )

        assert entry.type == KnowledgeType.ARCHITECTURAL_DECISION
        assert entry.title == "Use OAuth 2.0 for Authentication"
        assert entry.confidence == 1.0
        assert entry.usage_count == 0
        assert entry.id.startswith("know_")

    def test_knowledge_with_examples(self):
        """Test knowledge entry with examples."""
        entry = KnowledgeEntry(
            type=KnowledgeType.PATTERN,
            title="API Route Pattern",
            description="REST API follows /api/v1/{resource}/{action} pattern",
            examples=[
                "/api/v1/users/create",
                "/api/v1/posts/list",
            ],
            related_files=["src/api/routes/users.py", "src/api/routes/posts.py"],
        )

        assert len(entry.examples) == 2
        assert len(entry.related_files) == 2

    def test_knowledge_types(self):
        """Test all knowledge types are valid."""
        types = [
            KnowledgeType.ARCHITECTURAL_DECISION,
            KnowledgeType.PATTERN,
            KnowledgeType.CONVENTION,
            KnowledgeType.CONSTRAINT,
            KnowledgeType.DEPENDENCY,
            KnowledgeType.CODEBASE_STRUCTURE,
        ]

        for kt in types:
            entry = KnowledgeEntry(
                type=kt,
                title=f"Test {kt}",
                description="Test description",
            )
            assert entry.type == kt


class TestPreferenceEntry:
    """Test PreferenceEntry model."""

    def test_create_preference_entry(self):
        """Test creating a preference entry."""
        entry = PreferenceEntry(
            user_id=str(uuid4()),
        )

        assert entry.coding_style.indentation == "spaces"
        assert entry.coding_style.indent_size == 2
        assert entry.communication.verbosity == "concise"
        assert entry.workflow.auto_commit is True

    def test_coding_style_preferences(self):
        """Test coding style preferences."""
        style = CodingStyle(
            indentation="tabs",
            indent_size=4,
            quote_style="single",
            semicolons=True,
        )

        entry = PreferenceEntry(
            user_id=str(uuid4()),
            coding_style=style,
        )

        assert entry.coding_style.indentation == "tabs"
        assert entry.coding_style.quote_style == "single"
        assert entry.coding_style.semicolons is True

    def test_communication_preferences(self):
        """Test communication preferences."""
        comm = CommunicationPreferences(
            verbosity="detailed",
            explanation_style="theoretical",
            show_alternatives=False,
        )

        entry = PreferenceEntry(
            user_id=str(uuid4()),
            communication=comm,
        )

        assert entry.communication.verbosity == "detailed"
        assert entry.communication.explanation_style == "theoretical"

    def test_workflow_preferences(self):
        """Test workflow preferences."""
        workflow = WorkflowPreferences(
            auto_commit=False,
            commit_message_style="simple",
            prefer_small_changes=False,
        )

        entry = PreferenceEntry(
            user_id=str(uuid4()),
            workflow=workflow,
        )

        assert entry.workflow.auto_commit is False
        assert entry.workflow.commit_message_style == "simple"

    def test_custom_preferences(self):
        """Test custom preferences storage."""
        entry = PreferenceEntry(
            user_id=str(uuid4()),
            custom={
                "favorite_editor": "vscode",
                "theme": "dark",
                "font_size": 14,
            },
        )

        assert entry.custom["favorite_editor"] == "vscode"
        assert entry.custom["theme"] == "dark"


class TestTestingModels:
    """Test testing-related models."""

    def test_test_failure_pattern(self):
        """Test TestFailurePattern model."""
        pattern = TestFailurePattern(
            error_signature="AuthenticationError: 401",
            error_type="runtime",
            description="API authentication failures",
            solutions=[
                {
                    "description": "Refresh OAuth token",
                    "success_count": 5,
                    "steps": ["Get refresh token", "Request new access token"],
                }
            ],
        )

        assert pattern.error_type == "runtime"
        assert pattern.occurrence_count == 0
        assert len(pattern.solutions) == 1
        assert pattern.id.startswith("tfail_")

    def test_test_result(self):
        """Test TestResult model."""
        result = TestResult(
            session_id="session_123",
            test_type="unit",
            passed=False,
            total_tests=10,
            passed_tests=8,
            failed_tests=2,
            failures=[
                {
                    "test_name": "test_auth",
                    "error": "401 Unauthorized",
                    "file": "tests/test_auth.py",
                    "line": 42,
                }
            ],
            coverage=85.5,
            duration_seconds=12.3,
        )

        assert result.test_type == "unit"
        assert result.passed is False
        assert result.failed_tests == 2
        assert len(result.failures) == 1
        assert result.coverage == 85.5


class TestDebuggingModels:
    """Test debugging-related models."""

    def test_hypothesis(self):
        """Test Hypothesis model."""
        hyp = Hypothesis(
            description="Authentication token is expired",
            confidence=0.8,
            status="testing",
            evidence=["401 error code", "Token issued 2 hours ago"],
        )

        assert hyp.confidence == 0.8
        assert hyp.status == "testing"
        assert len(hyp.evidence) == 2
        assert hyp.id.startswith("hyp_")

    def test_investigation_finding(self):
        """Test InvestigationFinding model."""
        finding = InvestigationFinding(
            description="Token expiration set to 1 hour",
            type="clue",
            hypothesis_id="hyp_abc123",
        )

        assert finding.type == "clue"
        assert finding.hypothesis_id == "hyp_abc123"
        assert finding.id.startswith("find_")

    def test_debugging_session(self):
        """Test DebuggingSession model."""
        session = DebuggingSession(
            session_id="session_123",
            initial_error="401 Unauthorized",
            error_type="runtime",
            stack_trace="...",
            affected_files=["src/api/auth.py"],
            hypotheses=[
                Hypothesis(
                    description="Token expired",
                    confidence=0.8,
                )
            ],
            findings=[
                InvestigationFinding(
                    description="Token issued 2 hours ago",
                    type="clue",
                )
            ],
            status="in_progress",
        )

        assert session.error_type == "runtime"
        assert session.status == "in_progress"
        assert len(session.hypotheses) == 1
        assert len(session.findings) == 1
        assert session.id.startswith("debug_")

    def test_debugging_session_resolution(self):
        """Test debugging session with resolution."""
        session = DebuggingSession(
            session_id="session_123",
            initial_error="401 Unauthorized",
            error_type="runtime",
            status="resolved",
            resolution="Updated token expiration to 2 hours",
        )

        assert session.status == "resolved"
        assert session.resolution is not None
