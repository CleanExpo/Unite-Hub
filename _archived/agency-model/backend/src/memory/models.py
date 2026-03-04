"""Pydantic models for domain memory system.

These models define the structure of memory entries that persist across
agent sessions, enabling true long-running agent capabilities.
"""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field

# ============================================================================
# Core Memory Models
# ============================================================================


class MemoryDomain(str, Enum):
    """Domains of memory - high-level categorization."""

    KNOWLEDGE = "knowledge"
    PREFERENCE = "preference"
    TESTING = "testing"
    DEBUGGING = "debugging"


class MemoryEntry(BaseModel):
    """Base model for all memory entries.

    This is the core unit of persistent memory across sessions.
    """

    id: str = Field(default_factory=lambda: f"mem_{uuid4().hex[:12]}")
    user_id: str | None = None
    domain: MemoryDomain
    category: str  # Sub-categorization within domain
    key: str  # Unique identifier within category
    value: dict[str, Any]  # Flexible JSON storage
    embedding: list[float] | None = None  # Vector for semantic search

    # Relevance tracking
    relevance_score: float = Field(default=1.0, ge=0.0, le=1.0)
    access_count: int = 0
    last_accessed_at: str | None = None

    # Lifecycle
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    expires_at: str | None = None

    # Metadata
    source: str | None = None  # Where this memory came from
    tags: list[str] = Field(default_factory=list)

    model_config = {"use_enum_values": True}


class MemoryQuery(BaseModel):
    """Query specification for memory retrieval."""

    domain: MemoryDomain | None = None
    category: str | None = None
    key: str | None = None
    user_id: str | None = None

    # Semantic search
    query_text: str | None = None
    similarity_threshold: float = 0.7

    # Filters
    tags: list[str] | None = None
    min_relevance: float = 0.0

    # Pagination
    limit: int = 10
    offset: int = 0

    model_config = {"use_enum_values": True}


class MemoryResult(BaseModel):
    """Result from memory query with metadata."""

    entries: list[MemoryEntry]
    total_count: int
    query: MemoryQuery
    retrieved_at: str = Field(default_factory=lambda: datetime.now().isoformat())


# ============================================================================
# Domain Knowledge Models
# ============================================================================


class KnowledgeType(str, Enum):
    """Types of domain knowledge."""

    ARCHITECTURAL_DECISION = "architectural_decision"
    PATTERN = "pattern"
    CONVENTION = "convention"
    CONSTRAINT = "constraint"
    DEPENDENCY = "dependency"
    CODEBASE_STRUCTURE = "codebase_structure"


class KnowledgeEntry(BaseModel):
    """A piece of project-specific domain knowledge.

    Examples:
    - "This API uses OAuth 2.0 with PKCE flow"
    - "Database uses soft deletes, never hard delete"
    - "Frontend components use server components pattern"
    """

    id: str = Field(default_factory=lambda: f"know_{uuid4().hex[:12]}")
    type: KnowledgeType
    title: str
    description: str
    context: str = ""  # When/where this knowledge applies

    # Evidence
    examples: list[str] = Field(default_factory=list)
    related_files: list[str] = Field(default_factory=list)
    related_features: list[str] = Field(default_factory=list)

    # Categorization
    tags: list[str] = Field(default_factory=list)

    # Tracking
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    created_by_session: str | None = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    usage_count: int = 0

    model_config = {"use_enum_values": True}


# ============================================================================
# User Preference Models
# ============================================================================


class CodingStyle(BaseModel):
    """User's coding style preferences."""

    indentation: str = "spaces"  # "spaces" | "tabs"
    indent_size: int = 2
    quote_style: str = "double"  # "single" | "double"
    semicolons: bool = False
    trailing_commas: str = "es5"  # "none" | "es5" | "all"
    line_length: int = 100
    use_optional_chaining: bool = True


class CommunicationPreferences(BaseModel):
    """How the user prefers to communicate."""

    verbosity: str = "concise"  # "minimal" | "concise" | "detailed"
    explanation_style: str = "practical"  # "theoretical" | "practical" | "example-heavy"
    show_alternatives: bool = True
    include_rationale: bool = True
    language: str = "en"


class WorkflowPreferences(BaseModel):
    """User's workflow preferences."""

    auto_commit: bool = True
    commit_message_style: str = "conventional"  # "conventional" | "simple" | "verbose"
    prefer_small_changes: bool = True
    run_tests_before_commit: bool = True
    require_type_annotations: bool = True
    max_function_length: int = 50


class PreferenceEntry(BaseModel):
    """Complete user preferences store."""

    user_id: str
    project_id: str | None = None  # None = global preferences

    coding_style: CodingStyle = Field(default_factory=CodingStyle)
    communication: CommunicationPreferences = Field(
        default_factory=CommunicationPreferences
    )
    workflow: WorkflowPreferences = Field(default_factory=WorkflowPreferences)

    # Custom preferences (key-value for flexibility)
    custom: dict[str, Any] = Field(default_factory=dict)

    # Learning from corrections
    learned_corrections: list[dict[str, str]] = Field(default_factory=list)
    # [{"original": "...", "corrected_to": "...", "reason": "..."}]

    last_updated: str = Field(default_factory=lambda: datetime.now().isoformat())


# ============================================================================
# Testing Memory Models
# ============================================================================


class TestFailurePattern(BaseModel):
    """A recurring test failure pattern."""

    id: str = Field(default_factory=lambda: f"tfail_{uuid4().hex[:12]}")
    error_signature: str  # Regex or key features
    error_type: str  # "build" | "runtime" | "test" | "type"
    description: str

    # Solutions that worked
    solutions: list[dict[str, Any]] = Field(default_factory=list)
    # [{"description": str, "success_count": int, "steps": [], "files_changed": []}]

    # Tracking
    occurrence_count: int = 0
    last_occurred: str | None = None
    resolved_count: int = 0


class TestResult(BaseModel):
    """Result from a test run."""

    id: str = Field(default_factory=lambda: f"test_{uuid4().hex[:12]}")
    session_id: str
    feature_id: str | None = None

    test_type: str  # "unit" | "integration" | "e2e"
    passed: bool
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int = 0

    # Failure details
    failures: list[dict[str, Any]] = Field(default_factory=list)
    # [{"test_name": str, "error": str, "file": str, "line": int}]

    coverage: float | None = None
    duration_seconds: float = 0
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class TestingEntry(BaseModel):
    """Testing harness state and history."""

    project_id: str

    # Test configuration
    test_framework: str = "vitest"  # "vitest" | "jest" | "pytest"
    test_command: str = "pnpm test"
    coverage_threshold: float = 80.0

    # E2E configuration
    e2e_framework: str | None = None  # "playwright" | "cypress"
    e2e_command: str | None = None
    e2e_base_url: str = "http://localhost:3000"

    # History
    recent_results: list[TestResult] = Field(default_factory=list)
    failure_patterns: list[TestFailurePattern] = Field(default_factory=list)

    # Flaky test tracking
    flaky_tests: list[str] = Field(default_factory=list)

    # Feature -> test mapping
    feature_tests: dict[str, list[str]] = Field(default_factory=dict)


# ============================================================================
# Debugging Context Models
# ============================================================================


class Hypothesis(BaseModel):
    """A hypothesis about a bug's root cause."""

    id: str = Field(default_factory=lambda: f"hyp_{uuid4().hex[:8]}")
    description: str
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    status: str = "untested"  # "untested" | "testing" | "confirmed" | "refuted"
    evidence: list[str] = Field(default_factory=list)
    tested_at: str | None = None


class InvestigationFinding(BaseModel):
    """A finding during debugging investigation."""

    id: str = Field(default_factory=lambda: f"find_{uuid4().hex[:8]}")
    description: str
    type: str  # "clue" | "dead_end" | "solution"
    hypothesis_id: str | None = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class DebuggingSession(BaseModel):
    """State from a debugging session that can be resumed."""

    id: str = Field(default_factory=lambda: f"debug_{uuid4().hex[:12]}")
    session_id: str  # Links to ProgressTracker session
    feature_id: str | None = None

    # Problem context
    initial_error: str
    error_type: str
    stack_trace: str | None = None
    affected_files: list[str] = Field(default_factory=list)

    # Investigation state
    hypotheses: list[Hypothesis] = Field(default_factory=list)
    findings: list[InvestigationFinding] = Field(default_factory=list)
    attempted_fixes: list[dict[str, Any]] = Field(default_factory=list)

    current_hypothesis_id: str | None = None
    status: str = "in_progress"  # "in_progress" | "resolved" | "blocked"
    resolution: str | None = None

    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class DebuggingEntry(BaseModel):
    """Full debugging context store."""

    project_id: str

    # Active/recent debugging sessions
    active_sessions: list[DebuggingSession] = Field(default_factory=list)

    # Known error patterns
    error_patterns: list[TestFailurePattern] = Field(default_factory=list)

    # Quick lookup: error signature -> pattern ID
    pattern_index: dict[str, str] = Field(default_factory=dict)
