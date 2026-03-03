"""Session Manager - Handles session-to-session knowledge transfer and coordination.

Manages:
- Session lifecycle (start, end, resume)
- Knowledge accumulation across sessions
- Session history and context
- Learning extraction and storage
"""

from datetime import datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field

from src.memory.models import MemoryDomain
from src.memory.store import MemoryStore
from src.utils import get_logger

logger = get_logger(__name__)


class SessionContext(BaseModel):
    """Context for an active session."""

    session_id: str
    user_id: str | None = None
    started_at: str
    task_type: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SessionSummary(BaseModel):
    """Summary of a completed session."""

    session_id: str
    started_at: str
    ended_at: str
    duration_seconds: float
    tasks_completed: int
    tasks_failed: int
    patterns_learned: int
    failures_recorded: int


class SessionManager:
    """Manages session-to-session knowledge transfer."""

    def __init__(self, memory_store: MemoryStore | None = None) -> None:
        """Initialize session manager.

        Args:
            memory_store: Optional memory store (creates new if not provided)
        """
        self.memory_store = memory_store or MemoryStore()
        self._active_sessions: dict[str, SessionContext] = {}

    async def start_session(
        self,
        task_type: str | None = None,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None
    ) -> SessionContext:
        """Start a new session.

        Args:
            task_type: Type of tasks in this session
            user_id: Optional user ID
            metadata: Additional metadata

        Returns:
            Session context
        """
        session_id = f"session_{uuid4().hex[:12]}"

        context = SessionContext(
            session_id=session_id,
            user_id=user_id,
            started_at=datetime.now().isoformat(),
            task_type=task_type,
            metadata=metadata or {}
        )

        self._active_sessions[session_id] = context

        logger.info(
            "Session started",
            session_id=session_id,
            task_type=task_type,
            user_id=user_id
        )

        return context

    async def end_session(
        self,
        session_id: str,
        task_outcomes: list[dict[str, Any]],
        learnings: dict[str, Any] | None = None
    ) -> SessionSummary:
        """End a session and capture learnings.

        Args:
            session_id: Session to end
            task_outcomes: List of task results
            learnings: Optional explicit learnings to record

        Returns:
            Session summary
        """
        if session_id not in self._active_sessions:
            raise ValueError(f"Session {session_id} not found or already ended")

        context = self._active_sessions[session_id]

        # Calculate metrics
        ended_at = datetime.now()
        started_at = datetime.fromisoformat(context.started_at)
        duration = (ended_at - started_at).total_seconds()

        tasks_completed = sum(1 for t in task_outcomes if t.get("success"))
        tasks_failed = sum(1 for t in task_outcomes if not t.get("success"))

        # Capture learnings from task outcomes
        memory_entries = await self.memory_store.capture_session_learnings(
            session_id=session_id,
            task_outcomes=task_outcomes,
            user_id=context.user_id
        )

        # Store additional learnings if provided
        if learnings:
            await self._store_explicit_learnings(
                session_id=session_id,
                learnings=learnings,
                user_id=context.user_id
            )

        # Count pattern types
        patterns_learned = sum(
            1 for e in memory_entries
            if e.category == "patterns"
        )
        failures_recorded = sum(
            1 for e in memory_entries
            if e.category == "failure_patterns"
        )

        # Create summary
        summary = SessionSummary(
            session_id=session_id,
            started_at=context.started_at,
            ended_at=ended_at.isoformat(),
            duration_seconds=duration,
            tasks_completed=tasks_completed,
            tasks_failed=tasks_failed,
            patterns_learned=patterns_learned,
            failures_recorded=failures_recorded
        )

        # Remove from active sessions
        del self._active_sessions[session_id]

        logger.info(
            "Session ended",
            session_id=session_id,
            duration_seconds=duration,
            tasks_completed=tasks_completed,
            patterns_learned=patterns_learned
        )

        return summary

    async def get_session_history(
        self,
        task_type: str | None = None,
        user_id: str | None = None,
        limit: int = 10
    ) -> list[dict[str, Any]]:
        """Get history of past sessions.

        Args:
            task_type: Optional filter by task type
            user_id: Optional user filter
            limit: Max results

        Returns:
            List of past sessions with their learnings
        """
        # Query memory for session-related entries
        from src.memory.models import MemoryQuery

        query = MemoryQuery(
            domain=MemoryDomain.KNOWLEDGE,
            user_id=user_id,
            tags=["session_learning"],
            limit=limit * 5  # Get more to filter
        )

        result = await self.memory_store.query(query)

        # Group by session_id
        sessions_dict: dict[str, list] = {}
        for entry in result.entries:
            sid = entry.value.get("discovered_in_session") or entry.value.get("session_id")
            if sid:
                if sid not in sessions_dict:
                    sessions_dict[sid] = []
                sessions_dict[sid].append(entry)

        # Filter by task type if specified
        if task_type:
            sessions_dict = {
                k: v for k, v in sessions_dict.items()
                if any(e.value.get("task_type") == task_type for e in v)
            }

        # Convert to list and limit
        sessions = [
            {
                "session_id": sid,
                "learnings": [e.value for e in entries],
                "learning_count": len(entries)
            }
            for sid, entries in sessions_dict.items()
        ]

        return sessions[:limit]

    async def accumulate_knowledge(
        self,
        domain: str,
        insights: dict[str, Any],
        session_id: str | None = None,
        user_id: str | None = None
    ) -> None:
        """Accumulate knowledge from insights.

        Args:
            domain: Knowledge domain (architecture, patterns, etc.)
            insights: Insights to store
            session_id: Optional session ID
            user_id: Optional user ID
        """
        # Store insights as knowledge entries
        await self.memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category=domain,
            key=f"{domain}_{uuid4().hex[:8]}",
            value={
                **insights,
                "session_id": session_id,
                "accumulated_at": datetime.now().isoformat()
            },
            user_id=user_id,
            source="knowledge_accumulation",
            tags=["insight", domain],
            generate_embedding=True
        )

        logger.debug(
            "Knowledge accumulated",
            domain=domain,
            session_id=session_id
        )

    async def get_relevant_past_work(
        self,
        task_description: str,
        task_type: str | None = None,
        user_id: str | None = None
    ) -> dict[str, Any]:
        """Get relevant past work for a new task.

        Args:
            task_description: Current task description
            task_type: Optional task type
            user_id: Optional user filter

        Returns:
            Dict with similar work, patterns, and failures to avoid
        """
        # Get similar past work
        similar_work = await self.memory_store.retrieve_relevant_context(
            task_description=task_description,
            domain=MemoryDomain.KNOWLEDGE,
            user_id=user_id,
            limit=5
        )

        # Get successful patterns
        patterns = await self.memory_store.get_successful_patterns(
            pattern_type=task_type,
            user_id=user_id,
            limit=5
        )

        # Get failure patterns to avoid
        failures = await self.memory_store.get_failure_patterns(
            user_id=user_id,
            limit=5
        )

        return {
            "similar_work": similar_work,
            "successful_patterns": [p.value for p in patterns],
            "failures_to_avoid": [f.value for f in failures],
            "context_loaded": True
        }

    async def _store_explicit_learnings(
        self,
        session_id: str,
        learnings: dict[str, Any],
        user_id: str | None
    ) -> None:
        """Store explicit learnings provided at session end.

        Args:
            session_id: Session ID
            learnings: Learnings to store
            user_id: Optional user ID
        """
        # Store as general knowledge
        await self.memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="explicit_learnings",
            key=f"learning_{session_id}",
            value={
                **learnings,
                "session_id": session_id,
                "captured_at": datetime.now().isoformat()
            },
            user_id=user_id,
            source="explicit_learning",
            tags=["learning", "explicit"],
            generate_embedding=True
        )

    async def get_active_session(
        self,
        session_id: str
    ) -> SessionContext | None:
        """Get context for an active session.

        Args:
            session_id: Session ID

        Returns:
            Session context if active, None otherwise
        """
        return self._active_sessions.get(session_id)

    async def get_active_sessions(self) -> list[SessionContext]:
        """Get all active sessions.

        Returns:
            List of active session contexts
        """
        return list(self._active_sessions.values())

    async def initialize_memory_store(self) -> None:
        """Initialize the memory store if needed."""
        await self.memory_store.initialize()
