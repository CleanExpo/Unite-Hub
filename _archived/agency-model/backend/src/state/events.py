"""Real-time event publisher for agent orchestration.

This module provides a clean interface for agents to publish status updates
that are automatically propagated to the frontend via Supabase Realtime.

Usage:
    publisher = AgentEventPublisher()

    # Start a new agent run
    run_id = await publisher.start_run(
        task_id="task_123",
        user_id="user_456",
        agent_name="orchestrator",
    )

    # Publish progress updates
    await publisher.update_progress(
        run_id=run_id,
        step="Routing task to agent",
        progress=25.0,
    )

    # Publish completion
    await publisher.complete_run(
        run_id=run_id,
        result={"output": "Task completed successfully"},
    )
"""

from typing import Any
from uuid import uuid4

from src.utils import get_logger

from .null_store import NullStateStore

logger = get_logger(__name__)


class AgentEventPublisher:
    """Publishes agent execution events via the state store.

    Uses NullStateStore as backend (Supabase removed).
    Local caching provides in-memory state during the process lifetime.
    """

    def __init__(self) -> None:
        self.store = NullStateStore()
        self.local_cache: dict[str, dict[str, Any]] = {}

    async def start_run(
        self,
        task_id: str,
        user_id: str | None,
        agent_name: str,
        agent_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        """Start a new agent run and return the run ID.

        Args:
            task_id: ID of the task being executed
            user_id: ID of the user who owns this run
            agent_name: Name of the agent (e.g., 'orchestrator')
            agent_id: Unique agent instance ID (auto-generated if not provided)
            metadata: Additional metadata

        Returns:
            The created agent run ID

        Raises:
            Exception if creation fails
        """
        agent_id = agent_id or f"{agent_name}_{uuid4().hex[:8]}"

        run = await self.store.create_agent_run(
            task_id=task_id,
            user_id=user_id,
            agent_name=agent_name,
            agent_id=agent_id,
            metadata=metadata,
        )

        if not run:
            raise Exception("Failed to create agent run")

        # Cache the run locally
        self.local_cache[run["id"]] = run

        logger.info(
            "Started agent run",
            run_id=run["id"],
            agent=agent_name,
            task_id=task_id,
        )

        return run["id"]

    async def update_progress(
        self,
        run_id: str,
        step: str | None = None,
        progress: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Update agent run progress.

        Args:
            run_id: ID of the agent run
            step: Current step description
            progress: Progress percentage (0-100)
            metadata: Additional metadata to merge
        """
        run = await self.store.update_agent_run(
            run_id=run_id,
            status="in_progress",
            current_step=step,
            progress_percent=progress,
            metadata=metadata,
        )

        # Update local cache
        if run:
            self.local_cache[run_id] = run

        logger.debug(
            "Updated agent progress",
            run_id=run_id,
            step=step,
            progress=progress,
        )

    async def update_status(
        self,
        run_id: str,
        status: str,
        step: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Update agent run status.

        Args:
            run_id: ID of the agent run
            status: New status
            step: Current step description
            metadata: Additional metadata to merge
        """
        run = await self.store.update_agent_run(
            run_id=run_id,
            status=status,
            current_step=step,
            metadata=metadata,
        )

        # Update local cache
        if run:
            self.local_cache[run_id] = run

        logger.info(
            "Updated agent status",
            run_id=run_id,
            status=status,
        )

    async def update_verification(
        self,
        run_id: str,
        status: str,
        attempts: int,
        evidence: list[dict[str, Any]] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Update agent run verification status.

        Args:
            run_id: ID of the agent run
            status: Verification status
            attempts: Number of verification attempts
            evidence: Verification evidence array
            metadata: Additional metadata to merge
        """
        await self.store.update_agent_run(
            run_id=run_id,
            status=status,
            verification_attempts=attempts,
            verification_evidence=evidence,
            metadata=metadata,
        )

        logger.info(
            "Updated verification status",
            run_id=run_id,
            status=status,
            attempts=attempts,
        )

    async def complete_run(
        self,
        run_id: str,
        result: Any = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Mark agent run as completed.

        Args:
            run_id: ID of the agent run
            result: Result data
            metadata: Additional metadata to merge
        """
        run = await self.store.update_agent_run(
            run_id=run_id,
            status="completed",
            progress_percent=100.0,
            result=result,
            metadata=metadata,
        )

        # Update local cache
        if run:
            self.local_cache[run_id] = run

        logger.info(
            "Completed agent run",
            run_id=run_id,
        )

    async def fail_run(
        self,
        run_id: str,
        error: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Mark agent run as failed.

        Args:
            run_id: ID of the agent run
            error: Error message
            metadata: Additional metadata to merge
        """
        run = await self.store.update_agent_run(
            run_id=run_id,
            status="failed",
            error=error,
            metadata=metadata,
        )

        # Update local cache
        if run:
            self.local_cache[run_id] = run

        logger.error(
            "Failed agent run",
            run_id=run_id,
            error=error,
        )

    async def escalate_run(
        self,
        run_id: str,
        reason: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Escalate agent run to human review.

        Args:
            run_id: ID of the agent run
            reason: Escalation reason
            metadata: Additional metadata to merge
        """
        await self.store.update_agent_run(
            run_id=run_id,
            status="escalated_to_human",
            error=reason,
            metadata=metadata,
        )

        logger.warning(
            "Escalated agent run to human",
            run_id=run_id,
            reason=reason,
        )

    async def get_run_status(self, run_id: str) -> dict[str, Any] | None:
        """Get current status of an agent run.

        Uses local cache first, falls back to database if not found.

        Args:
            run_id: ID of the agent run

        Returns:
            Agent run data or None if not found
        """
        # Check local cache first
        if run_id in self.local_cache:
            return self.local_cache[run_id]

        # Fall back to database
        run = await self.store.get_agent_run(run_id)
        if run:
            self.local_cache[run_id] = run
        return run

    async def get_active_runs(self, user_id: str) -> list[dict[str, Any]]:
        """Get all active agent runs for a user.

        Args:
            user_id: ID of the user

        Returns:
            List of active agent runs
        """
        return await self.store.get_active_agent_runs(user_id)
