"""Initializer Agent for Long-Running Projects.

Sets up the environment on the FIRST run only:
1. Creates init.sh script for environment setup
2. Creates claude-progress.txt for session tracking
3. Generates feature_list.json from project specification
4. Makes initial git commit

This agent runs ONCE at the start of a project. All subsequent
sessions use the CodingAgent instead.

Key insight: Effective engineers set up good infrastructure before
diving into implementation. The initializer agent does the same.
"""

from __future__ import annotations

import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from ..base_agent import BaseAgent
from .features import FeatureManager, generate_features_from_spec, load_features_from_prd_json
from .progress import ProgressTracker, create_init_script


class InitializerConfig(BaseModel):
    """Configuration for the initializer agent."""

    project_path: str
    project_name: str
    specification: str
    init_commands: list[str] = Field(default_factory=list)
    create_git_repo: bool = True
    dev_server_command: str | None = None


class InitializerResult(BaseModel):
    """Result from initializer agent execution."""

    success: bool
    project_path: str
    files_created: list[str] = Field(default_factory=list)
    features_generated: int = 0
    initial_commit: str | None = None
    error: str | None = None
    next_steps: list[str] = Field(default_factory=list)


class InitializerAgent(BaseAgent):
    """Agent that sets up the environment for long-running projects.

    This agent is used ONLY on the first run. It:
    1. Analyzes the project specification
    2. Generates comprehensive feature list
    3. Creates init.sh for environment setup
    4. Creates progress tracking file
    5. Makes initial git commit

    Usage:
        agent = InitializerAgent()
        result = await agent.execute(
            task_description="Set up project: Build a clone of claude.ai",
            context={
                "project_path": "/path/to/project",
                "project_name": "claude-clone",
            }
        )
    """

    def __init__(self) -> None:
        super().__init__(
            name="initializer",
            capabilities=[
                "initialize",
                "setup",
                "scaffold",
                "first-run",
                "environment",
            ],
        )

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute the initialization.

        Args:
            task_description: The project specification
            context: Must include project_path and project_name

        Returns:
            InitializerResult as dictionary
        """
        context = context or {}

        # Validate required context
        project_path = context.get("project_path")
        project_name = context.get("project_name", "project")

        if not project_path:
            return InitializerResult(
                success=False,
                project_path="",
                error="project_path is required in context",
            ).model_dump()

        task_id = f"init_{project_name}_{datetime.now().strftime('%H%M%S')}"
        self.start_task(task_id)

        self.logger.info(
            "Starting project initialization",
            project_name=project_name,
            project_path=project_path,
        )

        try:
            result = await self._initialize_project(
                project_path=project_path,
                project_name=project_name,
                specification=task_description,
                context=context,
            )
            return result.model_dump()

        except Exception as e:
            self.logger.error("Initialization failed", error=str(e))
            return InitializerResult(
                success=False,
                project_path=project_path,
                error=str(e),
            ).model_dump()

    async def _initialize_project(
        self,
        project_path: str,
        project_name: str,
        specification: str,
        context: dict[str, Any],
    ) -> InitializerResult:
        """Perform the actual initialization."""
        path = Path(project_path)
        files_created = []

        # Ensure directory exists
        path.mkdir(parents=True, exist_ok=True)

        # 1. Initialize progress tracker
        self.logger.info("Creating progress tracker")
        progress = ProgressTracker(project_path)
        progress.initialize(project_name)
        files_created.append("claude-progress.txt")

        # 2. Generate feature list
        self.logger.info("Generating feature list from specification")
        features = await self._generate_features(specification, context)

        feature_manager = FeatureManager(project_path)
        feature_manager.initialize(project_name, features)
        files_created.append("feature_list.json")

        # 3. Create init.sh script
        self.logger.info("Creating init.sh script")
        init_commands = context.get("init_commands", [])

        # Add default commands if none provided
        if not init_commands:
            init_commands = self._get_default_init_commands(context)

        create_init_script(project_path, init_commands)
        files_created.append("init.sh")

        # 4. Initialize git repo if requested
        initial_commit = None
        if context.get("create_git_repo", True):
            initial_commit = await self._init_git_repo(path, project_name)

        # 5. Start the first session
        progress.start_session("initializer")
        progress.end_session(
            notes=f"Initialized project with {len(features)} features",
            next_steps=[
                "Run init.sh to set up the development environment",
                "Start with the first critical feature",
                "Test each feature end-to-end before marking as passing",
            ],
        )

        # Report outputs for verification
        self.report_output("file", "claude-progress.txt", "Progress tracking file")
        self.report_output("file", "feature_list.json", "Feature requirements list")
        self.report_output("file", "init.sh", "Environment initialization script")

        self.add_completion_criterion(
            "file_exists",
            str(path / "claude-progress.txt"),
        )
        self.add_completion_criterion(
            "file_exists",
            str(path / "feature_list.json"),
        )
        self.add_completion_criterion(
            "file_exists",
            str(path / "init.sh"),
        )

        return InitializerResult(
            success=True,
            project_path=project_path,
            files_created=files_created,
            features_generated=len(features),
            initial_commit=initial_commit,
            next_steps=[
                "Run: bash init.sh",
                "Start the development server",
                "Begin implementing the first critical feature",
            ],
        )

    async def _generate_features(
        self,
        specification: str,
        context: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """Generate feature list from specification.

        Priority order:
        1. Load from feature_list_path if provided (PRD-generated JSON)
        2. Use provided features list if in context
        3. Use custom feature_generator callback if provided
        4. Generate from spec using PRD system (default)
        """
        # Option 1: Load from PRD-generated feature_list.json
        if "feature_list_path" in context:
            feature_list_path = context["feature_list_path"]
            self.logger.info(
                "Loading features from PRD JSON",
                path=feature_list_path
            )
            try:
                return load_features_from_prd_json(feature_list_path)
            except Exception as e:
                self.logger.error(
                    "Failed to load PRD feature list, falling back to generation",
                    path=feature_list_path,
                    error=str(e),
                )
                # Fall through to generation

        # Option 2: Features provided directly
        if "features" in context:
            self.logger.info("Using features from context")
            return context["features"]

        # Option 3: Custom feature generator callback
        feature_generator = context.get("feature_generator")
        if feature_generator:
            self.logger.info("Using custom feature generator")
            return await feature_generator(specification)

        # Option 4: Generate from spec using PRD system (default)
        self.logger.info("Generating features using PRD system")

        # Prepare PRD context
        prd_context = {
            "target_users": context.get("target_users", "Users"),
            "timeline": context.get("timeline", "3 months"),
            "team_size": context.get("team_size", 2),
        }

        # Add any additional context keys that PRD system might use
        for key in ["existing_stack", "technology_constraints", "budget", "compliance"]:
            if key in context:
                prd_context[key] = context[key]

        # Generate features using PRD system
        features = await generate_features_from_spec(
            spec=specification,
            context=prd_context,
            output_dir=context.get("prd_output_dir"),  # Optional: save PRD docs
        )

        self.logger.info(
            "Generated features from PRD",
            feature_count=len(features),
        )

        return features

    def _get_default_init_commands(self, context: dict[str, Any]) -> list[str]:
        """Get default initialization commands based on project type."""
        commands = []

        project_type = context.get("project_type", "")

        if project_type == "nextjs" or "next" in str(context):
            commands = [
                "pnpm install",
                "pnpm dev &",
                "sleep 5",  # Wait for server to start
                "echo 'Dev server started on http://localhost:3000'",
            ]
        elif project_type == "python" or "fastapi" in str(context):
            commands = [
                "uv sync",
                "uv run uvicorn src.api.main:app --reload &",
                "sleep 3",
                "echo 'API server started on http://localhost:8000'",
            ]
        else:
            # Generic commands
            commands = [
                "echo 'No specific init commands - customize init.sh'",
            ]

        return commands

    async def _init_git_repo(self, path: Path, project_name: str) -> str | None:
        """Initialize git repository and make initial commit."""
        try:
            # Check if already a git repo
            git_dir = path / ".git"
            if not git_dir.exists():
                subprocess.run(
                    ["git", "init"],
                    cwd=path,
                    check=True,
                    capture_output=True,
                )

            # Create .gitignore if it doesn't exist
            gitignore = path / ".gitignore"
            if not gitignore.exists():
                gitignore.write_text(
                    "node_modules/\n.env\n.env.local\n__pycache__/\n*.pyc\n.venv/\n"
                )

            # Add all files
            subprocess.run(
                ["git", "add", "."],
                cwd=path,
                check=True,
                capture_output=True,
            )

            # Make initial commit
            subprocess.run(
                [
                    "git", "commit", "-m",
                    f"Initial setup: {project_name}\n\n"
                    "- Added claude-progress.txt for session tracking\n"
                    "- Added feature_list.json with requirements\n"
                    "- Added init.sh for environment setup\n"
                ],
                cwd=path,
                check=True,
                capture_output=True,
                text=True,
            )

            # Get commit hash
            hash_result = subprocess.run(
                ["git", "rev-parse", "--short", "HEAD"],
                cwd=path,
                check=True,
                capture_output=True,
                text=True,
            )

            return hash_result.stdout.strip()

        except subprocess.CalledProcessError as e:
            self.logger.warning("Git operation failed", error=str(e))
            return None
        except Exception as e:
            self.logger.warning("Could not initialize git", error=str(e))
            return None


def check_if_initialized(project_path: str | Path) -> bool:
    """Check if a project has been initialized.

    Args:
        project_path: Path to the project

    Returns:
        True if already initialized (progress file exists)
    """
    path = Path(project_path)
    return (path / "claude-progress.txt").exists()
