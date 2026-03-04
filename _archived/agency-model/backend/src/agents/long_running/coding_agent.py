"""Coding Agent for Long-Running Projects.

Used for EVERY session after initialization. This agent:
1. Gets up to speed by reading progress files and git history
2. Runs basic tests to verify environment is healthy
3. Picks ONE feature to work on
4. Implements and tests the feature end-to-end
5. Commits progress and updates documentation

Key insight: Effective engineers work incrementally and leave
the codebase in a clean state for their teammates.
"""

from __future__ import annotations

import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from ..base_agent import BaseAgent
from .features import Feature, FeatureManager
from .progress import ProgressTracker


class SessionPhase(str):
    """Phases of a coding session."""

    GETTING_BEARINGS = "getting_bearings"
    HEALTH_CHECK = "health_check"
    SELECTING_FEATURE = "selecting_feature"
    IMPLEMENTING = "implementing"
    TESTING = "testing"
    COMMITTING = "committing"
    WRAPPING_UP = "wrapping_up"


class CodingConfig(BaseModel):
    """Configuration for the coding agent."""

    project_path: str
    max_features_per_session: int = 1
    run_health_check: bool = True
    browser_testing: bool = False
    auto_commit: bool = True
    dev_server_url: str = "http://localhost:3000"


class FeatureWorkResult(BaseModel):
    """Result from working on a single feature."""

    feature_id: str
    success: bool
    tests_passed: bool
    commit_hash: str | None = None
    notes: str = ""
    time_spent_seconds: int = 0


class CodingSessionResult(BaseModel):
    """Result from a coding session."""

    success: bool
    session_id: str
    features_attempted: int = 0
    features_completed: int = 0
    features_worked: list[FeatureWorkResult] = Field(default_factory=list)
    bugs_fixed: list[str] = Field(default_factory=list)
    commits_made: list[str] = Field(default_factory=list)
    error: str | None = None
    next_steps: list[str] = Field(default_factory=list)
    progress_summary: str = ""


class CodingAgent(BaseAgent):
    """Agent that makes incremental progress on long-running projects.

    This agent is used for ALL sessions after initialization. It:
    1. Reads progress files and git logs to understand current state
    2. Runs health checks to verify environment
    3. Selects the highest priority incomplete feature
    4. Implements and tests the feature
    5. Commits and documents progress

    CRITICAL BEHAVIORS:
    - Works on ONE feature at a time
    - Tests features end-to-end before marking complete
    - Leaves environment in a clean state
    - Documents progress for the next session

    Usage:
        agent = CodingAgent()
        result = await agent.execute(
            task_description="Continue working on the project",
            context={
                "project_path": "/path/to/project",
            }
        )
    """

    def __init__(self) -> None:
        super().__init__(
            name="coding",
            capabilities=[
                "code",
                "implement",
                "feature",
                "develop",
                "build",
                "test",
            ],
        )
        self._progress: ProgressTracker | None = None
        self._features: FeatureManager | None = None
        self._session_id: str | None = None
        self._start_time: datetime | None = None

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute a coding session.

        Args:
            task_description: What to work on (or "continue")
            context: Must include project_path

        Returns:
            CodingSessionResult as dictionary
        """
        context = context or {}
        project_path = context.get("project_path")

        if not project_path:
            return CodingSessionResult(
                success=False,
                session_id="",
                error="project_path is required in context",
            ).model_dump()

        self._start_time = datetime.now()

        try:
            result = await self._run_session(project_path, task_description, context)
            return result.model_dump()

        except Exception as e:
            self.logger.error("Coding session failed", error=str(e))
            return CodingSessionResult(
                success=False,
                session_id=self._session_id or "",
                error=str(e),
            ).model_dump()

    async def _run_session(
        self,
        project_path: str,
        task_description: str,
        context: dict[str, Any],
    ) -> CodingSessionResult:
        """Run a complete coding session."""
        path = Path(project_path)

        # Initialize trackers
        self._progress = ProgressTracker(project_path)
        self._features = FeatureManager(project_path)

        # Load existing state
        if not self._progress.load():
            return CodingSessionResult(
                success=False,
                session_id="",
                error="No progress file found. Run initializer first.",
            )

        if not self._features.load():
            return CodingSessionResult(
                success=False,
                session_id="",
                error="No feature list found. Run initializer first.",
            )

        # Start session
        session = self._progress.start_session("coding")
        self._session_id = session.session_id
        self.start_task(self._session_id)

        self.logger.info(
            "Starting coding session",
            session_id=self._session_id,
            project_path=project_path,
        )

        # Phase 1: Get bearings
        await self._get_bearings(path, context)

        # Phase 2: Health check
        if context.get("run_health_check", True):
            healthy = await self._run_health_check(path, context)
            if not healthy:
                # Try to fix issues before proceeding
                await self._fix_health_issues(path, context)

        # Phase 3: Select feature to work on
        feature = self._features.get_next_feature()

        if not feature:
            # All features complete!
            self._progress.end_session(
                notes="All features are passing!",
                next_steps=["Project appears complete", "Consider adding more tests"],
                status="completed",
            )
            return CodingSessionResult(
                success=True,
                session_id=self._session_id,
                progress_summary="All features are complete!",
                next_steps=["Final review", "Deploy"],
            )

        # Phase 4: Work on the feature
        self.logger.info(
            "Selected feature to work on",
            feature_id=feature.id,
            description=feature.description,
        )

        self._progress.record_feature_work(feature.id)
        work_result = await self._work_on_feature(feature, path, context)

        # Phase 5: Commit and wrap up
        commits = []
        if context.get("auto_commit", True) and work_result.success:
            commit_hash = await self._commit_progress(path, feature, work_result)
            if commit_hash:
                commits.append(commit_hash)
                self._progress.record_commit(commit_hash, f"Implement {feature.id}")

        # Update feature status
        if work_result.tests_passed:
            self._features.mark_passing(
                feature.id,
                session_id=self._session_id,
                notes=work_result.notes,
            )
            self._progress.record_feature_complete(feature.id)

        # End session
        next_feature = self._features.get_next_feature()
        next_steps = []
        if next_feature:
            next_steps.append(f"Next: {next_feature.description}")
        next_steps.extend(work_result.notes.split("\n") if work_result.notes else [])

        stats = self._features.get_stats()
        summary = (
            f"Worked on: {feature.description}\n"
            f"Status: {'PASSED' if work_result.tests_passed else 'NEEDS WORK'}\n"
            f"Progress: {stats['passing']}/{stats['total']} features complete"
        )

        self._progress.end_session(
            notes=summary,
            next_steps=next_steps[:5],
            status="completed",
        )

        return CodingSessionResult(
            success=True,
            session_id=self._session_id,
            features_attempted=1,
            features_completed=1 if work_result.tests_passed else 0,
            features_worked=[work_result],
            commits_made=commits,
            progress_summary=summary,
            next_steps=next_steps,
        )

    async def _get_bearings(
        self,
        path: Path,
        context: dict[str, Any],
    ) -> None:
        """Get up to speed on the project state.

        This mimics what an engineer does when starting a shift:
        1. Check what directory we're in
        2. Read recent git history
        3. Read progress notes
        4. Understand what was done and what's next
        """
        self.logger.info("Getting bearings on project state")

        # Read progress summary
        progress_summary = self._progress.get_summary_for_context()
        self.logger.debug("Progress summary", summary=progress_summary[:500])

        # Read feature summary
        feature_summary = self._features.get_summary_for_context()
        self.logger.debug("Feature summary", summary=feature_summary[:500])

        # Check recent git commits
        try:
            result = subprocess.run(
                ["git", "log", "--oneline", "-10"],
                cwd=path,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                self.logger.debug("Recent commits", commits=result.stdout[:500])
        except Exception:
            pass

        # Check current git status
        try:
            result = subprocess.run(
                ["git", "status", "--short"],
                cwd=path,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0 and result.stdout.strip():
                self.logger.warning(
                    "Uncommitted changes detected",
                    changes=result.stdout[:200],
                )
        except Exception:
            pass

    async def _run_health_check(
        self,
        path: Path,
        context: dict[str, Any],
    ) -> bool:
        """Run basic health check on the project.

        This ensures we catch any issues before implementing new features.
        """
        self.logger.info("Running health check")

        # Check if init.sh exists and can run
        init_script = path / "init.sh"
        if not init_script.exists():
            self.logger.warning("init.sh not found")
            return False

        # Run init.sh to start dev server
        try:
            result = subprocess.run(
                ["bash", str(init_script)],
                cwd=path,
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode != 0:
                self.logger.warning(
                    "init.sh failed",
                    stderr=result.stderr[:200],
                )
                return False
        except subprocess.TimeoutExpired:
            self.logger.info("init.sh running (dev server started)")
        except Exception as e:
            self.logger.warning("Could not run init.sh", error=str(e))
            return False

        # If browser testing is enabled, do a basic smoke test
        if context.get("browser_testing"):
            return await self._browser_smoke_test(context)

        return True

    async def _browser_smoke_test(self, context: dict[str, Any]) -> bool:
        """Run a basic browser smoke test.

        In a full implementation, this would use Puppeteer MCP
        to verify the app loads correctly.
        """
        # Placeholder - would use browser automation
        self.logger.info("Browser smoke test would run here")
        return True

    async def _fix_health_issues(
        self,
        path: Path,
        context: dict[str, Any],
    ) -> bool:
        """Attempt to fix health issues.

        This might involve:
        - Reinstalling dependencies
        - Reverting bad commits
        - Fixing configuration issues
        """
        self.logger.info("Attempting to fix health issues")

        # Try reinstalling dependencies
        try:
            if (path / "package.json").exists():
                subprocess.run(
                    ["pnpm", "install"],
                    cwd=path,
                    capture_output=True,
                    timeout=120,
                )
            elif (path / "pyproject.toml").exists():
                subprocess.run(
                    ["uv", "sync"],
                    cwd=path,
                    capture_output=True,
                    timeout=120,
                )
        except Exception as e:
            self.logger.warning("Could not reinstall dependencies", error=str(e))

        return True  # Optimistically continue

    async def _work_on_feature(
        self,
        feature: Feature,
        path: Path,
        context: dict[str, Any],
    ) -> FeatureWorkResult:
        """Work on implementing a single feature.

        In a full implementation, this would:
        1. Analyze what needs to be done
        2. Write the code
        3. Run tests
        4. Iterate until tests pass

        For now, this is a placeholder that would be extended
        by actual code generation capabilities.
        """
        start = datetime.now()
        self.logger.info(
            "Working on feature",
            feature_id=feature.id,
            steps=feature.steps,
        )

        # Report the work
        self.report_output(
            "feature",
            feature.id,
            feature.description,
        )

        # Add completion criteria
        self.add_completion_criterion(
            "feature_passes",
            feature.id,
            expected="true",
        )

        # The actual implementation would happen here
        # For now, we return a template result

        # Check if there's a custom implementation handler
        impl_handler = context.get("implementation_handler")
        if impl_handler:
            try:
                success = await impl_handler(feature, path)
                tests_passed = success
            except Exception as e:
                self.logger.error("Implementation failed", error=str(e))
                success = False
                tests_passed = False
        else:
            # Placeholder - in real usage, Claude would implement the feature
            self.logger.info("Feature implementation would happen here")
            success = True
            tests_passed = False  # Require explicit testing

        elapsed = (datetime.now() - start).seconds

        return FeatureWorkResult(
            feature_id=feature.id,
            success=success,
            tests_passed=tests_passed,
            notes=f"Worked on for {elapsed}s",
            time_spent_seconds=elapsed,
        )

    async def _commit_progress(
        self,
        path: Path,
        feature: Feature,
        result: FeatureWorkResult,
    ) -> str | None:
        """Commit the work done on a feature."""
        try:
            # Add all changes
            subprocess.run(
                ["git", "add", "."],
                cwd=path,
                check=True,
                capture_output=True,
            )

            # Check if there are changes to commit
            status = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=path,
                capture_output=True,
                text=True,
            )

            if not status.stdout.strip():
                self.logger.info("No changes to commit")
                return None

            # Create commit message
            status_emoji = "✅" if result.tests_passed else "🚧"
            message = (
                f"{status_emoji} {feature.id}: {feature.description[:50]}\n\n"
                f"Status: {'Passing' if result.tests_passed else 'In Progress'}\n"
                f"Session: {self._session_id}\n"
            )

            # Commit
            subprocess.run(
                ["git", "commit", "-m", message],
                cwd=path,
                check=True,
                capture_output=True,
            )

            # Get commit hash
            hash_result = subprocess.run(
                ["git", "rev-parse", "--short", "HEAD"],
                cwd=path,
                check=True,
                capture_output=True,
                text=True,
            )

            commit_hash = hash_result.stdout.strip()
            self.logger.info("Committed progress", hash=commit_hash)
            return commit_hash

        except subprocess.CalledProcessError as e:
            self.logger.warning("Could not commit", error=str(e))
            return None
        except Exception as e:
            self.logger.warning("Commit error", error=str(e))
            return None


class SessionRunner:
    """Convenience class for running long-running sessions.

    Usage:
        runner = SessionRunner(project_path="/path/to/project")

        # First run - initializes the project
        result = await runner.run("Build a chat application")

        # Subsequent runs - makes incremental progress
        result = await runner.run()  # Continues from where it left off
    """

    def __init__(
        self,
        project_path: str | Path,
        project_name: str | None = None,
    ) -> None:
        self.project_path = Path(project_path)
        self.project_name = project_name or self.project_path.name

    async def run(
        self,
        specification: str | None = None,
        **context: Any,
    ) -> dict[str, Any]:
        """Run a session - either init or coding.

        Args:
            specification: Project spec (required for first run)
            **context: Additional context for the agent

        Returns:
            Result from the agent
        """
        from .initializer import InitializerAgent, check_if_initialized

        ctx = {
            "project_path": str(self.project_path),
            "project_name": self.project_name,
            **context,
        }

        if not check_if_initialized(self.project_path):
            if not specification:
                raise ValueError("Specification required for first run")

            agent = InitializerAgent()
            return await agent.execute(specification, ctx)
        else:
            agent = CodingAgent()
            return await agent.execute(specification or "Continue", ctx)

    def is_initialized(self) -> bool:
        """Check if the project has been initialized."""
        from .initializer import check_if_initialized
        return check_if_initialized(self.project_path)

    def get_progress(self) -> str:
        """Get current progress summary."""
        tracker = ProgressTracker(self.project_path)
        if tracker.load():
            return tracker.get_summary_for_context()
        return "Project not initialized"

    def get_features(self) -> str:
        """Get feature list summary."""
        manager = FeatureManager(self.project_path)
        if manager.load():
            return manager.get_summary_for_context()
        return "No features defined"
