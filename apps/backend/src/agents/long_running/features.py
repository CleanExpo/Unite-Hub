"""Feature List Management for Long-Running Agents.

Maintains a structured JSON file of feature requirements that:
1. Prevents agents from declaring victory prematurely
2. Provides clear targets for incremental progress
3. Tracks which features pass end-to-end testing

Key insight: Using JSON instead of Markdown makes the model
less likely to inappropriately change or overwrite content.
"""

from __future__ import annotations

import json
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


class FeatureCategory(str, Enum):
    """Categories of features."""

    FUNCTIONAL = "functional"
    UI = "ui"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"
    SECURITY = "security"
    ACCESSIBILITY = "accessibility"


class FeaturePriority(str, Enum):
    """Priority levels for features."""

    CRITICAL = "critical"  # Must have for MVP
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Feature(BaseModel):
    """A single feature requirement.

    Example:
        {
            "id": "new-chat-button",
            "category": "functional",
            "priority": "critical",
            "description": "New chat button creates a fresh conversation",
            "steps": [
                "Navigate to main interface",
                "Click the 'New Chat' button",
                "Verify a new conversation is created"
            ],
            "passes": false,
            "last_tested": null,
            "notes": ""
        }
    """

    id: str
    category: FeatureCategory
    priority: FeaturePriority = FeaturePriority.MEDIUM
    description: str
    steps: list[str] = Field(default_factory=list)
    passes: bool = False
    last_tested: str | None = None
    tested_by_session: str | None = None
    notes: str = ""
    blockers: list[str] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)


class FeatureList(BaseModel):
    """The feature_list.json file structure.

    IMPORTANT: Agents should ONLY modify the 'passes', 'last_tested',
    'tested_by_session', and 'notes' fields. Feature definitions should
    not be changed without explicit user approval.
    """

    project_name: str
    created_at: str
    last_updated: str
    total_features: int = 0
    passing_features: int = 0
    features: list[Feature] = Field(default_factory=list)

    # Metadata for tracking
    version: str = "1.0"
    generated_by: str = "initializer_agent"


class FeatureManager:
    """Manages the feature list for a project.

    Usage:
        manager = FeatureManager(project_path="/path/to/project")

        # Initialize with features
        manager.initialize("My Project", features)

        # Get next feature to work on
        next_feature = manager.get_next_feature()

        # Mark feature as passing
        manager.mark_passing("new-chat-button", session_id="session_123")

        # Get progress stats
        stats = manager.get_stats()
    """

    FEATURE_FILE = "feature_list.json"

    def __init__(self, project_path: str | Path) -> None:
        """Initialize the feature manager.

        Args:
            project_path: Root path of the project
        """
        self.project_path = Path(project_path)
        self.feature_file = self.project_path / self.FEATURE_FILE
        self._feature_list: FeatureList | None = None

    def initialize(
        self,
        project_name: str,
        features: list[dict[str, Any]],
    ) -> FeatureList:
        """Initialize the feature list for a project.

        Called by the InitializerAgent on first run.

        Args:
            project_name: Name of the project
            features: List of feature definitions

        Returns:
            The created feature list
        """
        parsed_features = []
        for f in features:
            # Ensure we have an ID
            if "id" not in f:
                f["id"] = f.get("description", "")[:50].lower().replace(" ", "-")

            # Parse category
            if isinstance(f.get("category"), str):
                try:
                    f["category"] = FeatureCategory(f["category"])
                except ValueError:
                    f["category"] = FeatureCategory.FUNCTIONAL

            # Parse priority
            if isinstance(f.get("priority"), str):
                try:
                    f["priority"] = FeaturePriority(f["priority"])
                except ValueError:
                    f["priority"] = FeaturePriority.MEDIUM

            parsed_features.append(Feature(**f))

        self._feature_list = FeatureList(
            project_name=project_name,
            created_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            total_features=len(parsed_features),
            features=parsed_features,
        )

        self._save()
        return self._feature_list

    def load(self) -> FeatureList | None:
        """Load existing feature list.

        Returns:
            Feature list if it exists, None otherwise
        """
        if not self.feature_file.exists():
            return None

        try:
            content = self.feature_file.read_text()
            self._feature_list = FeatureList.model_validate_json(content)
            return self._feature_list
        except Exception:
            return None

    def exists(self) -> bool:
        """Check if feature list exists."""
        return self.feature_file.exists()

    def get_feature(self, feature_id: str) -> Feature | None:
        """Get a specific feature by ID.

        Args:
            feature_id: The feature ID

        Returns:
            The feature if found, None otherwise
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return None

        for f in self._feature_list.features:
            if f.id == feature_id:
                return f
        return None

    def get_next_feature(
        self,
        category: FeatureCategory | None = None,
    ) -> Feature | None:
        """Get the next feature to work on.

        Prioritizes:
        1. Critical priority features
        2. Features with no blockers
        3. Features whose dependencies are met

        Args:
            category: Optional category filter

        Returns:
            The next feature to work on, or None if all done
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return None

        # Get all failing features
        failing = [f for f in self._feature_list.features if not f.passes]

        if category:
            failing = [f for f in failing if f.category == category]

        if not failing:
            return None

        # Filter by dependencies met
        passing_ids = {f.id for f in self._feature_list.features if f.passes}
        available = [
            f for f in failing
            if all(dep in passing_ids for dep in f.depends_on)
            and not f.blockers
        ]

        if not available:
            # Return first failing even if blocked (for visibility)
            available = failing

        # Sort by priority
        priority_order = {
            FeaturePriority.CRITICAL: 0,
            FeaturePriority.HIGH: 1,
            FeaturePriority.MEDIUM: 2,
            FeaturePriority.LOW: 3,
        }

        available.sort(key=lambda f: priority_order.get(f.priority, 2))

        return available[0] if available else None

    def get_failing_features(
        self,
        limit: int | None = None,
    ) -> list[Feature]:
        """Get all failing features.

        Args:
            limit: Maximum number to return

        Returns:
            List of failing features
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return []

        failing = [f for f in self._feature_list.features if not f.passes]

        if limit:
            return failing[:limit]
        return failing

    def get_passing_features(self) -> list[Feature]:
        """Get all passing features."""
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return []

        return [f for f in self._feature_list.features if f.passes]

    def mark_passing(
        self,
        feature_id: str,
        session_id: str | None = None,
        notes: str = "",
    ) -> bool:
        """Mark a feature as passing.

        IMPORTANT: Only call this after proper end-to-end testing!

        Args:
            feature_id: ID of the feature
            session_id: ID of the testing session
            notes: Optional notes about the test

        Returns:
            True if successful, False if feature not found
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return False

        for f in self._feature_list.features:
            if f.id == feature_id:
                f.passes = True
                f.last_tested = datetime.now().isoformat()
                f.tested_by_session = session_id
                if notes:
                    f.notes = notes

                self._feature_list.passing_features = len(self.get_passing_features())
                self._feature_list.last_updated = datetime.now().isoformat()
                self._save()
                return True

        return False

    def mark_failing(
        self,
        feature_id: str,
        session_id: str | None = None,
        notes: str = "",
    ) -> bool:
        """Mark a feature as failing (revert a previous pass).

        Args:
            feature_id: ID of the feature
            session_id: ID of the testing session
            notes: Optional notes about why it failed

        Returns:
            True if successful, False if feature not found
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return False

        for f in self._feature_list.features:
            if f.id == feature_id:
                f.passes = False
                f.last_tested = datetime.now().isoformat()
                f.tested_by_session = session_id
                if notes:
                    f.notes = notes

                self._feature_list.passing_features = len(self.get_passing_features())
                self._feature_list.last_updated = datetime.now().isoformat()
                self._save()
                return True

        return False

    def add_blocker(self, feature_id: str, blocker: str) -> bool:
        """Add a blocker to a feature.

        Args:
            feature_id: ID of the feature
            blocker: Description of the blocker

        Returns:
            True if successful
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return False

        for f in self._feature_list.features:
            if f.id == feature_id:
                if blocker not in f.blockers:
                    f.blockers.append(blocker)
                    self._save()
                return True

        return False

    def remove_blocker(self, feature_id: str, blocker: str) -> bool:
        """Remove a blocker from a feature.

        Args:
            feature_id: ID of the feature
            blocker: Description of the blocker to remove

        Returns:
            True if successful
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return False

        for f in self._feature_list.features:
            if f.id == feature_id:
                if blocker in f.blockers:
                    f.blockers.remove(blocker)
                    self._save()
                return True

        return False

    def get_stats(self) -> dict[str, Any]:
        """Get feature list statistics.

        Returns:
            Dictionary with stats about features
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return {"total": 0, "passing": 0, "failing": 0, "percent_complete": 0}

        total = len(self._feature_list.features)
        passing = len([f for f in self._feature_list.features if f.passes])
        failing = total - passing

        # Count by category
        by_category = {}
        for cat in FeatureCategory:
            cat_features = [f for f in self._feature_list.features if f.category == cat]
            cat_passing = [f for f in cat_features if f.passes]
            by_category[cat.value] = {
                "total": len(cat_features),
                "passing": len(cat_passing),
            }

        # Count by priority
        by_priority = {}
        for pri in FeaturePriority:
            pri_features = [f for f in self._feature_list.features if f.priority == pri]
            pri_passing = [f for f in pri_features if f.passes]
            by_priority[pri.value] = {
                "total": len(pri_features),
                "passing": len(pri_passing),
            }

        # Count blocked
        blocked = len([f for f in self._feature_list.features if f.blockers])

        return {
            "total": total,
            "passing": passing,
            "failing": failing,
            "blocked": blocked,
            "percent_complete": round((passing / total) * 100, 1) if total > 0 else 0,
            "by_category": by_category,
            "by_priority": by_priority,
        }

    def get_summary_for_context(self) -> str:
        """Get a summary suitable for agent context.

        Returns a concise summary that helps a new agent
        quickly understand which features need work.
        """
        if not self._feature_list:
            self.load()

        if not self._feature_list:
            return "No feature list found. Run initializer to create one."

        stats = self.get_stats()

        lines = [
            f"# Feature Progress: {self._feature_list.project_name}",
            f"Complete: {stats['passing']}/{stats['total']} ({stats['percent_complete']}%)",
            "",
        ]

        # Show next features to work on
        next_features = self.get_failing_features(limit=5)
        if next_features:
            lines.append("## Next Features to Implement:")
            for f in next_features:
                priority = f"[{f.priority.value}]"
                blocked = " [BLOCKED]" if f.blockers else ""
                lines.append(f"- {priority} {f.description}{blocked}")
                if f.blockers:
                    for b in f.blockers:
                        lines.append(f"  - Blocker: {b}")

        # Show critical features still failing
        critical_failing = [
            f for f in self._feature_list.features
            if f.priority == FeaturePriority.CRITICAL and not f.passes
        ]
        if critical_failing:
            lines.append(f"\n## Critical Features Remaining: {len(critical_failing)}")

        return "\n".join(lines)

    def _save(self) -> None:
        """Save feature list to file."""
        if self._feature_list:
            content = self._feature_list.model_dump_json(indent=2)
            self.feature_file.write_text(content)


async def generate_features_from_spec(
    spec: str,
    context: dict[str, Any] | None = None,
    output_dir: Path | str | None = None,
) -> list[dict[str, Any]]:
    """Generate a list of features from a high-level specification using PRD system.

    This function uses the Agent PRD system with Claude Opus to analyze
    the specification and generate comprehensive, production-ready features.

    Args:
        spec: High-level project specification
        context: Additional context (target_users, timeline, team_size, etc.)
        output_dir: Directory to save PRD documents (optional)

    Returns:
        List of feature definitions from PRD generation
    """
    from src.agents.prd import PRDOrchestrator
    from src.utils import get_logger

    logger = get_logger(__name__)
    context = context or {}

    try:
        logger.info(
            "Generating features using PRD system",
            spec_length=len(spec),
            context_keys=list(context.keys()),
        )

        # Initialize PRD orchestrator
        orchestrator = PRDOrchestrator()

        # Generate comprehensive PRD
        result = await orchestrator.generate(
            requirements=spec,
            context=context,
            output_dir=output_dir,
        )

        if not result["success"]:
            logger.error("PRD generation failed, using fallback", error=result.get("error"))
            return _get_fallback_features()

        # Extract feature list from PRD result
        prd_result = result["prd_result"]
        feature_decomposition = prd_result["feature_decomposition"]

        # Convert user stories to feature format
        features = []
        for story in feature_decomposition["user_stories"]:
            feature = {
                "id": story["id"].lower().replace("-", "_"),  # US-001 -> us_001
                "category": "functional",
                "priority": story["priority"].lower(),  # Critical -> critical
                "description": story["title"],
                "user_story": story["description"],
                "steps": story["acceptance_criteria"],
                "depends_on": [
                    dep.lower().replace("-", "_")
                    for dep in story.get("dependencies", [])
                ],
                "epic": story.get("epic", ""),
                "effort": story.get("effort_estimate", "M"),
                "technical_notes": story.get("technical_notes", []),
            }
            features.append(feature)

        logger.info(
            "Features generated from PRD",
            feature_count=len(features),
            epics=len(feature_decomposition["epics"]),
        )

        return features

    except Exception as e:
        logger.error("Failed to generate features from PRD", error=str(e))
        return _get_fallback_features()


def _get_fallback_features() -> list[dict[str, Any]]:
    """Fallback features if PRD generation fails."""
    return [
        {
            "id": "basic_setup",
            "category": "functional",
            "priority": "critical",
            "description": "Basic project setup and configuration",
            "steps": [
                "Initialize project structure",
                "Install dependencies",
                "Verify dev server starts",
            ],
        },
        {
            "id": "core_functionality",
            "category": "functional",
            "priority": "critical",
            "description": "Core application functionality works",
            "steps": [
                "Main interface loads",
                "Basic user interactions work",
                "No console errors",
            ],
            "depends_on": ["basic_setup"],
        },
    ]


def load_features_from_prd_json(json_path: Path | str) -> list[dict[str, Any]]:
    """Load features from PRD-generated feature_list.json.

    Args:
        json_path: Path to feature_list.json generated by PRD system

    Returns:
        List of feature definitions

    Raises:
        FileNotFoundError: If JSON file doesn't exist
        ValueError: If JSON is invalid
    """
    from src.utils import get_logger

    logger = get_logger(__name__)
    json_path = Path(json_path)

    if not json_path.exists():
        raise FileNotFoundError(f"Feature list not found: {json_path}")

    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))

        # Validate structure
        if "features" not in data:
            raise ValueError("feature_list.json missing 'features' key")

        features = data["features"]

        logger.info(
            "Loaded features from PRD JSON",
            feature_count=len(features),
            source=str(json_path),
        )

        return features

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in feature list: {e}")
    except Exception as e:
        raise ValueError(f"Failed to load feature list: {e}")
