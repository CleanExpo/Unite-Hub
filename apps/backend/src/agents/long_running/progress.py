"""Progress Tracker for Long-Running Agents.

Maintains session-by-session progress notes that allow each new agent
instance to quickly understand what has been done and what remains.

Key insight: Effective software engineers document their work so that
team members can pick up where they left off. We apply the same principle
to agents working across multiple context windows.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from pydantic import BaseModel, Field


class SessionProgress(BaseModel):
    """Record of a single agent session's work."""

    session_id: str
    started_at: str
    ended_at: str | None = None
    agent_type: str = "coding"  # "initializer" or "coding"
    features_worked_on: list[str] = Field(default_factory=list)
    features_completed: list[str] = Field(default_factory=list)
    commits_made: list[str] = Field(default_factory=list)
    bugs_fixed: list[str] = Field(default_factory=list)
    notes: str = ""
    status: str = "in_progress"  # "in_progress", "completed", "interrupted"


class ProgressFile(BaseModel):
    """The claude-progress.txt file structure.

    This file is read by every new agent session to understand
    the current state of the project.
    """

    project_name: str
    created_at: str
    last_updated: str
    total_sessions: int = 0
    current_focus: str | None = None
    blockers: list[str] = Field(default_factory=list)
    sessions: list[SessionProgress] = Field(default_factory=list)

    # Quick reference for the next agent
    next_steps: list[str] = Field(default_factory=list)
    known_issues: list[str] = Field(default_factory=list)


class ProgressTracker:
    """Tracks and persists agent progress across sessions.

    Usage:
        tracker = ProgressTracker(project_path="/path/to/project")

        # At session start
        session = tracker.start_session("coding")
        previous = tracker.get_recent_sessions(limit=3)

        # During session
        tracker.record_feature_work("user-authentication")
        tracker.record_commit("abc123", "Added login form")

        # At session end
        tracker.end_session(
            notes="Completed auth flow, tests passing",
            next_steps=["Add password reset", "Add remember me checkbox"]
        )
    """

    PROGRESS_FILE = "claude-progress.txt"

    def __init__(self, project_path: str | Path) -> None:
        """Initialize the progress tracker.

        Args:
            project_path: Root path of the project
        """
        self.project_path = Path(project_path)
        self.progress_file = self.project_path / self.PROGRESS_FILE
        self._current_session: SessionProgress | None = None
        self._progress: ProgressFile | None = None

    def initialize(self, project_name: str) -> ProgressFile:
        """Initialize a new progress file for a project.

        Called by the InitializerAgent on first run.

        Args:
            project_name: Name of the project

        Returns:
            The newly created progress file
        """
        self._progress = ProgressFile(
            project_name=project_name,
            created_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
        )
        self._save()
        return self._progress

    def load(self) -> ProgressFile | None:
        """Load existing progress file.

        Returns:
            Progress file if it exists, None otherwise
        """
        if not self.progress_file.exists():
            return None

        try:
            content = self.progress_file.read_text()
            self._progress = ProgressFile.model_validate_json(content)
            return self._progress
        except Exception:
            return None

    def exists(self) -> bool:
        """Check if progress file exists."""
        return self.progress_file.exists()

    def start_session(self, agent_type: str = "coding") -> SessionProgress:
        """Start a new agent session.

        Args:
            agent_type: Type of agent ("initializer" or "coding")

        Returns:
            The new session record
        """
        if not self._progress:
            self.load()

        if not self._progress:
            raise ValueError("Progress file not initialized. Run initializer first.")

        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self._current_session = SessionProgress(
            session_id=session_id,
            started_at=datetime.now().isoformat(),
            agent_type=agent_type,
        )

        self._progress.total_sessions += 1
        self._progress.sessions.append(self._current_session)
        self._save()

        return self._current_session

    def get_recent_sessions(self, limit: int = 5) -> list[SessionProgress]:
        """Get recent session records for context.

        Args:
            limit: Maximum number of sessions to return

        Returns:
            List of recent sessions, most recent first
        """
        if not self._progress:
            self.load()

        if not self._progress:
            return []

        return list(reversed(self._progress.sessions[-limit:]))

    def get_current_focus(self) -> str | None:
        """Get what the previous session was focusing on."""
        if not self._progress:
            self.load()

        return self._progress.current_focus if self._progress else None

    def get_next_steps(self) -> list[str]:
        """Get the next steps suggested by previous session."""
        if not self._progress:
            self.load()

        return self._progress.next_steps if self._progress else []

    def get_known_issues(self) -> list[str]:
        """Get known issues from previous sessions."""
        if not self._progress:
            self.load()

        return self._progress.known_issues if self._progress else []

    def record_feature_work(self, feature_id: str) -> None:
        """Record that work is being done on a feature.

        Args:
            feature_id: ID of the feature being worked on
        """
        if not self._current_session:
            raise ValueError("No active session. Call start_session first.")

        if feature_id not in self._current_session.features_worked_on:
            self._current_session.features_worked_on.append(feature_id)
            self._progress.current_focus = feature_id
            self._save()

    def record_feature_complete(self, feature_id: str) -> None:
        """Record that a feature has been completed.

        Args:
            feature_id: ID of the completed feature
        """
        if not self._current_session:
            raise ValueError("No active session. Call start_session first.")

        if feature_id not in self._current_session.features_completed:
            self._current_session.features_completed.append(feature_id)
            self._save()

    def record_commit(self, commit_hash: str, message: str) -> None:
        """Record a git commit made during this session.

        Args:
            commit_hash: Short git commit hash
            message: Commit message
        """
        if not self._current_session:
            raise ValueError("No active session. Call start_session first.")

        commit_record = f"{commit_hash}: {message[:100]}"
        self._current_session.commits_made.append(commit_record)
        self._save()

    def record_bug_fix(self, description: str) -> None:
        """Record a bug that was fixed.

        Args:
            description: Description of the bug fix
        """
        if not self._current_session:
            raise ValueError("No active session. Call start_session first.")

        self._current_session.bugs_fixed.append(description)
        self._save()

    def add_known_issue(self, issue: str) -> None:
        """Add a known issue for future sessions.

        Args:
            issue: Description of the issue
        """
        if not self._progress:
            self.load()

        if self._progress and issue not in self._progress.known_issues:
            self._progress.known_issues.append(issue)
            self._save()

    def add_blocker(self, blocker: str) -> None:
        """Add a blocker that prevents progress.

        Args:
            blocker: Description of the blocker
        """
        if not self._progress:
            self.load()

        if self._progress and blocker not in self._progress.blockers:
            self._progress.blockers.append(blocker)
            self._save()

    def end_session(
        self,
        notes: str = "",
        next_steps: list[str] | None = None,
        status: str = "completed",
    ) -> None:
        """End the current session.

        Args:
            notes: Summary notes about what was accomplished
            next_steps: Suggested next steps for the following session
            status: Session status ("completed", "interrupted")
        """
        if not self._current_session:
            raise ValueError("No active session to end.")

        self._current_session.ended_at = datetime.now().isoformat()
        self._current_session.notes = notes
        self._current_session.status = status

        if self._progress:
            self._progress.last_updated = datetime.now().isoformat()
            if next_steps:
                self._progress.next_steps = next_steps

        self._save()
        self._current_session = None

    def get_summary_for_context(self) -> str:
        """Get a summary suitable for agent context.

        Returns a concise summary that helps a new agent
        quickly understand the project state.
        """
        if not self._progress:
            self.load()

        if not self._progress:
            return "No progress file found. This appears to be a new project."

        lines = [
            f"# Project: {self._progress.project_name}",
            f"Total sessions: {self._progress.total_sessions}",
            f"Last updated: {self._progress.last_updated}",
            "",
        ]

        if self._progress.current_focus:
            lines.append(f"Current focus: {self._progress.current_focus}")

        if self._progress.next_steps:
            lines.append("\n## Next Steps:")
            for step in self._progress.next_steps[:5]:
                lines.append(f"- {step}")

        if self._progress.known_issues:
            lines.append("\n## Known Issues:")
            for issue in self._progress.known_issues[:5]:
                lines.append(f"- {issue}")

        if self._progress.blockers:
            lines.append("\n## Blockers:")
            for blocker in self._progress.blockers:
                lines.append(f"- {blocker}")

        # Add recent session info
        recent = self.get_recent_sessions(3)
        if recent:
            lines.append("\n## Recent Sessions:")
            for session in recent:
                lines.append(
                    f"- [{session.agent_type}] {session.started_at[:10]}: "
                    f"{len(session.features_completed)} features completed"
                )
                if session.notes:
                    lines.append(f"  Notes: {session.notes[:100]}")

        return "\n".join(lines)

    def _save(self) -> None:
        """Save progress to file."""
        if self._progress:
            content = self._progress.model_dump_json(indent=2)
            self.progress_file.write_text(content)


def create_init_script(project_path: str | Path, commands: list[str]) -> Path:
    """Create an init.sh script for the project.

    Args:
        project_path: Root path of the project
        commands: List of shell commands to include

    Returns:
        Path to the created init.sh file
    """
    init_path = Path(project_path) / "init.sh"

    script_content = """#!/bin/bash
# Auto-generated initialization script for long-running agents
# This script sets up the development environment

set -e  # Exit on error

echo "=== Initializing Development Environment ==="

"""

    for cmd in commands:
        script_content += f'echo "Running: {cmd}"\n'
        script_content += f"{cmd}\n\n"

    script_content += """
echo "=== Environment Ready ==="
echo "Development server should now be running."
"""

    init_path.write_text(script_content)
    init_path.chmod(0o755)  # Make executable

    return init_path
