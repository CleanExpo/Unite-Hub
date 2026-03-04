"""Domain Memory Module for Long-Running Agents.

This module implements Anthropic's domain memory pattern, providing persistent
context that agents can read/write across sessions to maintain state beyond
the context window.

Key Components:
- MemoryStore: Core CRUD and vector search for all memory types
- DomainMemoryCoordinator: Unified interface for all memory managers
- Individual managers: Knowledge, Preferences, Testing, Debugging

Integration Points:
- CodingAgent._get_bearings(): Load memory context at session start
- InitializerAgent: Initialize memory for new projects
- IndependentVerifier: Record test failures and solutions
"""

from src.memory.models import (
    DebuggingEntry,
    # Domain-specific models
    KnowledgeEntry,
    MemoryDomain,
    # Base memory models
    MemoryEntry,
    MemoryQuery,
    MemoryResult,
    PreferenceEntry,
    TestingEntry,
)

__all__ = [
    # Base models
    "MemoryEntry",
    "MemoryQuery",
    "MemoryResult",
    "MemoryDomain",
    # Domain models
    "KnowledgeEntry",
    "PreferenceEntry",
    "TestingEntry",
    "DebuggingEntry",
]
