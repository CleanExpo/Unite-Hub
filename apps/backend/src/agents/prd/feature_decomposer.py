"""Feature Decomposer Agent - Breaks PRD into epics and user stories.

This agent takes structured PRD analysis and decomposes it into:
- Epics (high-level feature groups)
- User stories (specific actionable features)
- Acceptance criteria (Given-When-Then format)
- Dependencies and priorities
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field

from src.config import get_settings
from src.utils import get_logger

from ..base_agent import BaseAgent
from .analysis_agent import PRDAnalysis

settings = get_settings()
logger = get_logger(__name__)


class UserStory(BaseModel):
    """Individual user story with acceptance criteria."""

    id: str = Field(description="Unique identifier (e.g., US-001)")
    title: str = Field(description="Concise story title")
    description: str = Field(
        description="User story in format: As a [user], I want to [action], so that [benefit]"
    )
    acceptance_criteria: list[str] = Field(
        description="Given-When-Then acceptance criteria"
    )
    priority: str = Field(description="Critical | High | Medium | Low")
    epic: str = Field(description="Parent epic name")
    dependencies: list[str] = Field(
        default_factory=list, description="IDs of dependent user stories"
    )
    effort_estimate: str = Field(
        description="T-shirt size: XS | S | M | L | XL",
        default="M"
    )
    technical_notes: list[str] = Field(
        default_factory=list, description="Implementation hints"
    )


class Epic(BaseModel):
    """Epic (group of related user stories)."""

    id: str = Field(description="Unique identifier (e.g., EP-001)")
    name: str = Field(description="Epic name")
    description: str = Field(description="What this epic achieves")
    user_stories: list[str] = Field(
        description="IDs of user stories in this epic"
    )
    priority: str = Field(description="Critical | High | Medium | Low")
    business_value: str = Field(description="Why this epic matters")


class FeatureDecomposition(BaseModel):
    """Complete feature decomposition output."""

    epics: list[Epic] = Field(description="High-level feature groups")
    user_stories: list[UserStory] = Field(description="Actionable user stories")
    total_effort_estimate: str = Field(
        description="Overall project size estimate"
    )
    critical_path: list[str] = Field(
        description="User story IDs on critical path"
    )

    # Metadata
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    model_used: str = "claude-opus-4-5-20251101"


class FeatureDecomposer(BaseAgent):
    """Agent that decomposes PRD into epics and user stories.

    This agent uses Claude Opus to intelligently break down requirements
    into actionable development tasks with proper prioritization and dependencies.

    Usage:
        decomposer = FeatureDecomposer()
        result = await decomposer.execute(
            prd_analysis=analysis,  # PRDAnalysis object
            context={"team_size": 2, "sprint_length": 2}
        )

        decomposition = FeatureDecomposition(**result["decomposition"])
    """

    def __init__(self) -> None:
        super().__init__(
            name="feature_decomposer",
            capabilities=[
                "epic_creation",
                "user_story_generation",
                "acceptance_criteria",
                "dependency_analysis",
                "effort_estimation",
            ],
        )
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def execute(
        self,
        prd_analysis: PRDAnalysis | dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Decompose PRD into epics and user stories.

        Args:
            prd_analysis: PRDAnalysis object or dict from PRDAnalysisAgent
            context: Additional context (team_size, sprint_length, etc.)

        Returns:
            Dictionary with FeatureDecomposition and metadata
        """
        context = context or {}
        task_id = f"feature_decomp_{datetime.now().strftime('%H%M%S')}"
        self.start_task(task_id)

        # Convert dict to PRDAnalysis if needed
        if isinstance(prd_analysis, dict):
            prd_analysis = PRDAnalysis(**prd_analysis)

        self.logger.info(
            "Starting feature decomposition",
            functional_reqs=len(prd_analysis.functional_requirements),
            target_users=len(prd_analysis.target_users),
        )

        try:
            # Generate the feature decomposition using Claude Opus
            decomposition = await self._decompose_features(prd_analysis, context)

            # Report outputs for verification
            self.report_output(
                "feature_decomposition",
                "epics_and_stories",
                "Epics and user stories with acceptance criteria"
            )

            self.logger.info(
                "Feature decomposition completed",
                epics=len(decomposition.epics),
                user_stories=len(decomposition.user_stories),
                critical_path=len(decomposition.critical_path),
            )

            return {
                "success": True,
                "decomposition": decomposition.model_dump(),
                "task_id": task_id,
            }

        except Exception as e:
            self.logger.error("Feature decomposition failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "task_id": task_id,
            }

    async def _decompose_features(
        self,
        prd_analysis: PRDAnalysis,
        context: dict[str, Any],
    ) -> FeatureDecomposition:
        """Use Claude Opus to decompose features into epics and stories."""

        # Build the decomposition prompt
        prompt = self._build_decomposition_prompt(prd_analysis, context)

        # Call Claude Opus for deep analysis
        response = await self.client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=8000,  # More tokens for detailed stories
            temperature=0.4,  # Slightly higher for creativity in story writing
            system=self._get_system_prompt(),
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        # Extract and parse the response
        content = response.content[0].text

        # Claude should return JSON, but wrap in try/catch
        try:
            # Try to extract JSON from the response
            json_start = content.find("{")
            json_end = content.rfind("}") + 1

            if json_start >= 0 and json_end > json_start:
                json_str = content[json_start:json_end]
                decomposition_data = json.loads(json_str)
                return FeatureDecomposition(**decomposition_data)
            else:
                # Fallback: parse markdown structure
                return self._parse_markdown_response(content)

        except Exception as e:
            self.logger.warning("Failed to parse JSON, using fallback", error=str(e))
            return self._parse_markdown_response(content)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for feature decomposition."""
        return """You are an expert agile coach and technical product manager.

Your role is to break down product requirements into well-structured epics and user stories.

Guidelines:
1. Group related features into logical epics
2. Write user stories in format: "As a [user], I want to [action], so that [benefit]"
3. Create detailed acceptance criteria using Given-When-Then format
4. Identify dependencies between stories (what must be built first)
5. Assign realistic priorities (Critical = MVP, High = Post-launch week 1, etc.)
6. Estimate effort using t-shirt sizes (XS=hours, S=1-2 days, M=3-5 days, L=1-2 weeks, XL=2+ weeks)
7. Think about technical feasibility and architecture
8. Output MUST be valid JSON matching the expected schema

Story Quality Checklist:
- Is it independently testable?
- Does it deliver user value?
- Is it small enough to complete in one sprint?
- Are acceptance criteria specific and measurable?
- Are dependencies clearly identified?

Epic Quality Checklist:
- Does it represent a complete feature area?
- Can it be delivered incrementally?
- Does it have clear business value?
- Are stories properly grouped by functionality?
"""

    def _build_decomposition_prompt(
        self,
        prd_analysis: PRDAnalysis,
        context: dict[str, Any],
    ) -> str:
        """Build the decomposition prompt with PRD and context."""

        context_str = ""
        if context:
            context_str = "\n\nAdditional Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"

        functional_reqs = "\n".join(
            f"- {req}" for req in prd_analysis.functional_requirements
        )
        non_functional_reqs = "\n".join(
            f"- {req}" for req in prd_analysis.non_functional_requirements
        )
        target_users = ", ".join(prd_analysis.target_users)

        return f"""Break down the following PRD into epics and user stories.

## PRD Summary

**Problem**: {prd_analysis.problem_statement}

**Target Users**: {target_users}

**Functional Requirements**:
{functional_reqs}

**Non-Functional Requirements**:
{non_functional_reqs}

**Constraints**:
{chr(10).join(f"- {c}" for c in prd_analysis.constraints)}

**Success Metrics**:
{chr(10).join(f"- {m}" for m in prd_analysis.success_metrics)}
{context_str}

## Instructions

Create epics and user stories following this JSON format:

{{
  "epics": [
    {{
      "id": "EP-001",
      "name": "Epic Name",
      "description": "What this epic achieves",
      "user_stories": ["US-001", "US-002"],
      "priority": "Critical",
      "business_value": "Why this matters to users/business"
    }}
  ],
  "user_stories": [
    {{
      "id": "US-001",
      "title": "Short descriptive title",
      "description": "As a [user], I want to [action], so that [benefit]",
      "acceptance_criteria": [
        "Given [context], when [action], then [outcome]",
        "Given [context], when [action], then [outcome]"
      ],
      "priority": "Critical",
      "epic": "EP-001",
      "dependencies": ["US-002"],
      "effort_estimate": "M",
      "technical_notes": ["Use Supabase auth", "Needs rate limiting"]
    }}
  ],
  "total_effort_estimate": "3-4 weeks with 2 developers",
  "critical_path": ["US-001", "US-002", "US-005"]
}}

## Requirements

1. **Epics**: Group related functionality (e.g., "User Authentication", "Dashboard", "Admin Panel")
2. **User Stories**: Break each epic into 3-8 stories, each deliverable in < 1 week
3. **Acceptance Criteria**: At least 2-5 criteria per story in Given-When-Then format
4. **Priorities**:
   - Critical: Must have for MVP
   - High: Needed for launch
   - Medium: Post-launch enhancements
   - Low: Nice to have
5. **Dependencies**: List prerequisite story IDs (US-XXX)
6. **Effort**: XS (hours) | S (1-2 days) | M (3-5 days) | L (1-2 weeks) | XL (2+ weeks)
7. **Critical Path**: Stories that must be done in sequence for core functionality

Be comprehensive - extract EVERY feature from the functional requirements.
Return ONLY the JSON, no additional text."""

    def _parse_markdown_response(self, content: str) -> FeatureDecomposition:
        """Fallback parser for markdown-formatted responses."""
        # This is a simplified fallback - in production, you'd want more robust parsing

        # Create minimal valid structure
        fallback_epic = Epic(
            id="EP-001",
            name="Core Features",
            description="Feature decomposition requires manual review",
            user_stories=["US-001"],
            priority="High",
            business_value="See raw output for details"
        )

        fallback_story = UserStory(
            id="US-001",
            title="Review and decompose features manually",
            description="As a developer, I want to review the PRD analysis, so that I can create proper user stories",
            acceptance_criteria=[
                "Given the PRD analysis, when reviewed, then user stories are created",
                "Given user stories, when prioritized, then development can begin"
            ],
            priority="Critical",
            epic="EP-001",
            effort_estimate="M",
        )

        return FeatureDecomposition(
            epics=[fallback_epic],
            user_stories=[fallback_story],
            total_effort_estimate="Manual review required",
            critical_path=["US-001"],
        )

    def to_feature_list_json(self, decomposition: FeatureDecomposition) -> dict[str, Any]:
        """Convert decomposition to feature_list.json format for InitializerAgent.

        This transforms the FeatureDecomposition into the format expected by
        the long-running agent harness in apps/backend/src/agents/long_running/features.py
        """
        features = []

        for story in decomposition.user_stories:
            feature = {
                "id": story.id,
                "name": story.title,
                "description": story.description,
                "priority": story.priority.lower(),
                "status": "pending",
                "acceptance_criteria": story.acceptance_criteria,
                "dependencies": story.dependencies,
                "epic": story.epic,
                "effort": story.effort_estimate,
                "technical_notes": story.technical_notes,
            }
            features.append(feature)

        return {
            "version": "1.0",
            "generated_at": decomposition.generated_at,
            "total_features": len(features),
            "epics": [epic.model_dump() for epic in decomposition.epics],
            "features": features,
            "critical_path": decomposition.critical_path,
            "total_effort": decomposition.total_effort_estimate,
        }
