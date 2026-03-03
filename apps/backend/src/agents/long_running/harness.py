"""Long-Running Agent Harness.

Provides a unified interface for managing long-running agent projects
that span multiple context windows.

Key Components:
1. InitializerAgent - Sets up on first run
2. CodingAgent - Makes incremental progress
3. ProgressTracker - Maintains session history
4. FeatureManager - Tracks feature completion

Key Insight: The core challenge of long-running agents is that they
must work in discrete sessions, where each new session begins with
no memory of what came before. This harness solves that by:
- Maintaining structured progress files
- Using git for version control and recovery
- Working incrementally (one feature at a time)
- Leaving clear documentation for the next session

Reference: Anthropic Blog - "Effective harnesses for long-running agents"
https://www.anthropic.com/research/long-running-agents
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from .coding_agent import CodingAgent
from .features import FeatureManager
from .initializer import InitializerAgent, check_if_initialized
from .progress import ProgressTracker


class HarnessConfig(BaseModel):
    """Configuration for the long-running agent harness."""

    project_path: str
    project_name: str
    specification: str | None = None

    # Session settings
    max_sessions: int = 100  # Safety limit
    session_timeout_seconds: int = 3600  # 1 hour

    # Feature settings
    max_features_per_session: int = 1
    require_e2e_testing: bool = True

    # Environment settings
    run_health_check: bool = True
    auto_commit: bool = True
    browser_testing: bool = False
    dev_server_url: str = "http://localhost:3000"

    # Custom handlers
    init_commands: list[str] = Field(default_factory=list)


class HarnessState(BaseModel):
    """Current state of the harness."""

    initialized: bool = False
    total_sessions: int = 0
    current_session: str | None = None
    features_complete: int = 0
    features_total: int = 0
    percent_complete: float = 0.0
    last_activity: str | None = None


class SessionResult(BaseModel):
    """Result from a harness session."""

    success: bool
    session_id: str
    session_type: str  # "initializer" or "coding"
    features_completed: int = 0
    commits_made: list[str] = Field(default_factory=list)
    error: str | None = None
    should_continue: bool = True
    summary: str = ""


class LongRunningAgentHarness:
    """Manages long-running agent projects across multiple sessions.

    This harness implements the two-fold solution from Anthropic's research:
    1. Initializer Agent - Sets up environment on first run
    2. Coding Agent - Makes incremental progress each session

    Usage:
        harness = LongRunningAgentHarness(
            project_path="/path/to/project",
            project_name="my-app",
            specification="Build a clone of claude.ai",
        )

        # Run a single session (init or coding based on state)
        result = await harness.run_session()

        # Or run until complete (use with caution!)
        results = await harness.run_until_complete(max_sessions=50)

    The harness handles:
    - Detecting if initialization is needed
    - Running appropriate agent for each session
    - Tracking progress across sessions
    - Providing status and summaries
    """

    def __init__(
        self,
        project_path: str | Path,
        project_name: str,
        specification: str | None = None,
        config: HarnessConfig | None = None,
    ) -> None:
        """Initialize the harness.

        Args:
            project_path: Root path for the project
            project_name: Name of the project
            specification: High-level project specification
            config: Optional configuration overrides
        """
        self.project_path = Path(project_path)
        self.project_name = project_name
        self.specification = specification

        if config:
            self.config = config
        else:
            self.config = HarnessConfig(
                project_path=str(self.project_path),
                project_name=project_name,
                specification=specification,
            )

        self._progress: ProgressTracker | None = None
        self._features: FeatureManager | None = None

    def get_state(self) -> HarnessState:
        """Get current harness state."""
        initialized = check_if_initialized(self.project_path)

        if not initialized:
            return HarnessState(initialized=False)

        # Load progress and features
        progress = ProgressTracker(self.project_path)
        features = FeatureManager(self.project_path)

        progress.load()
        features.load()

        stats = features.get_stats()

        return HarnessState(
            initialized=True,
            total_sessions=progress._progress.total_sessions if progress._progress else 0,
            features_complete=stats.get("passing", 0),
            features_total=stats.get("total", 0),
            percent_complete=stats.get("percent_complete", 0.0),
            last_activity=progress._progress.last_updated if progress._progress else None,
        )

    async def run_session(
        self,
        **context: Any,
    ) -> SessionResult:
        """Run a single session.

        Automatically determines whether to run initializer or coding agent.

        Args:
            **context: Additional context for the agent

        Returns:
            SessionResult with outcome
        """
        ctx = {
            "project_path": str(self.project_path),
            "project_name": self.project_name,
            "run_health_check": self.config.run_health_check,
            "auto_commit": self.config.auto_commit,
            "browser_testing": self.config.browser_testing,
            "dev_server_url": self.config.dev_server_url,
            "init_commands": self.config.init_commands,
            **context,
        }

        if not check_if_initialized(self.project_path):
            # First run - use initializer
            if not self.specification:
                return SessionResult(
                    success=False,
                    session_id="",
                    session_type="initializer",
                    error="Specification required for first run",
                    should_continue=False,
                )

            agent = InitializerAgent()
            result = await agent.execute(self.specification, ctx)

            return SessionResult(
                success=result.get("success", False),
                session_id=result.get("session_id", "init"),
                session_type="initializer",
                features_completed=0,
                commits_made=[result.get("initial_commit")] if result.get("initial_commit") else [],
                error=result.get("error"),
                should_continue=result.get("success", False),
                summary=f"Initialized with {result.get('features_generated', 0)} features",
            )
        else:
            # Subsequent run - use coding agent
            agent = CodingAgent()
            result = await agent.execute("Continue with next feature", ctx)

            # Check if all features are complete
            features = FeatureManager(self.project_path)
            features.load()
            stats = features.get_stats()

            all_complete = stats.get("failing", 0) == 0

            return SessionResult(
                success=result.get("success", False),
                session_id=result.get("session_id", ""),
                session_type="coding",
                features_completed=result.get("features_completed", 0),
                commits_made=result.get("commits_made", []),
                error=result.get("error"),
                should_continue=not all_complete and result.get("success", False),
                summary=result.get("progress_summary", ""),
            )

    async def run_until_complete(
        self,
        max_sessions: int | None = None,
        on_session_complete: Callable[[SessionResult], Awaitable[bool]] | None = None,
    ) -> list[SessionResult]:
        """Run sessions until project is complete or max reached.

        WARNING: Use with caution! This can run many sessions.

        Args:
            max_sessions: Maximum number of sessions (default from config)
            on_session_complete: Optional callback after each session.
                                 Return False to stop early.

        Returns:
            List of all session results
        """
        max_sessions = max_sessions or self.config.max_sessions
        results = []

        for i in range(max_sessions):
            result = await self.run_session()
            results.append(result)

            # Call callback if provided
            if on_session_complete:
                should_continue = await on_session_complete(result)
                if not should_continue:
                    break

            # Check if we should continue
            if not result.should_continue:
                break

            # Small delay between sessions
            await asyncio.sleep(1)

        return results

    def get_progress_summary(self) -> str:
        """Get a human-readable progress summary."""
        state = self.get_state()

        if not state.initialized:
            return "Project not initialized. Run a session to start."

        lines = [
            f"# {self.project_name}",
            f"Sessions: {state.total_sessions}",
            f"Features: {state.features_complete}/{state.features_total} ({state.percent_complete:.1f}%)",
        ]

        if state.last_activity:
            lines.append(f"Last activity: {state.last_activity}")

        # Add detailed progress if available
        progress = ProgressTracker(self.project_path)
        if progress.load():
            lines.append("")
            lines.append(progress.get_summary_for_context())

        return "\n".join(lines)

    def get_feature_summary(self) -> str:
        """Get a summary of feature progress."""
        features = FeatureManager(self.project_path)
        if features.load():
            return features.get_summary_for_context()
        return "No features defined."

    def is_complete(self) -> bool:
        """Check if all features are complete."""
        features = FeatureManager(self.project_path)
        if features.load():
            stats = features.get_stats()
            return stats.get("failing", 1) == 0
        return False


# Convenience function for quick usage
async def run_long_running_project(
    project_path: str | Path,
    project_name: str,
    specification: str,
    max_sessions: int = 50,
) -> dict[str, Any]:
    """Run a long-running project from start to finish.

    Args:
        project_path: Where to create/continue the project
        project_name: Name of the project
        specification: High-level project specification
        max_sessions: Maximum sessions to run

    Returns:
        Summary of all sessions
    """
    harness = LongRunningAgentHarness(
        project_path=project_path,
        project_name=project_name,
        specification=specification,
    )

    results = await harness.run_until_complete(max_sessions=max_sessions)

    return {
        "total_sessions": len(results),
        "successful_sessions": sum(1 for r in results if r.success),
        "features_completed": sum(r.features_completed for r in results),
        "is_complete": harness.is_complete(),
        "final_summary": harness.get_progress_summary(),
    }
