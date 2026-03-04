"""Roadmap Planner Agent - Creates implementation roadmap with sprints.

This agent generates:
- Sprint breakdown with goals
- Timeline estimates
- Dependency graph
- Resource allocation
- Risk mitigation
- Milestone planning
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
from .feature_decomposer import FeatureDecomposition
from .tech_spec_generator import TechnicalSpec
from .test_generator import TestPlan

settings = get_settings()
logger = get_logger(__name__)


class Sprint(BaseModel):
    """Sprint definition with goals and stories."""

    sprint_number: int = Field(description="Sprint number (1, 2, 3, ...)")
    sprint_goal: str = Field(description="What this sprint aims to achieve")
    duration_weeks: int = Field(description="Sprint length in weeks", default=2)
    user_stories: list[str] = Field(
        description="User story IDs in this sprint"
    )
    dependencies_met: list[str] = Field(
        default_factory=list,
        description="User story dependencies resolved by this sprint"
    )
    deliverables: list[str] = Field(
        description="What will be delivered at sprint end"
    )
    acceptance_criteria: list[str] = Field(
        description="Sprint completion criteria"
    )
    risks: list[str] = Field(
        default_factory=list,
        description="Potential risks and blockers"
    )
    team_capacity: str = Field(
        description="Expected team capacity/velocity",
        default="100%"
    )


class Milestone(BaseModel):
    """Major project milestone."""

    name: str = Field(description="Milestone name (e.g., 'MVP Launch')")
    target_sprint: int = Field(description="Sprint number when milestone is due")
    description: str = Field(description="What this milestone represents")
    success_criteria: list[str] = Field(
        description="How to know milestone is achieved"
    )
    deliverables: list[str] = Field(
        description="What is delivered at this milestone"
    )


class Risk(BaseModel):
    """Project risk with mitigation strategy."""

    id: str = Field(description="Risk ID (e.g., R-001)")
    title: str = Field(description="Risk title")
    description: str = Field(description="Detailed risk description")
    probability: str = Field(description="Low | Medium | High")
    impact: str = Field(description="Low | Medium | High")
    mitigation: str = Field(description="How to mitigate this risk")
    contingency: str = Field(description="Backup plan if risk occurs")


class Roadmap(BaseModel):
    """Complete implementation roadmap."""

    # Sprint Planning
    sprints: list[Sprint] = Field(description="Sprint breakdown")
    total_duration_weeks: int = Field(description="Total project duration")

    # Milestones
    milestones: list[Milestone] = Field(description="Major project milestones")

    # Dependencies
    dependency_graph_mermaid: str = Field(
        description="Mermaid diagram showing dependencies"
    )
    critical_path: list[str] = Field(
        description="Critical path user story IDs"
    )

    # Resource Planning
    team_composition: dict[str, str] = Field(
        description="Recommended team roles and responsibilities"
    )
    resource_allocation: list[dict[str, Any]] = Field(
        description="Resource allocation by sprint"
    )

    # Risks
    risks: list[Risk] = Field(description="Project risks and mitigations")

    # Release Strategy
    release_strategy: str = Field(
        description="How releases will be managed"
    )
    deployment_checkpoints: list[str] = Field(
        description="Quality gates before deployment"
    )

    # Success Tracking
    velocity_tracking: str = Field(
        description="How to measure team velocity"
    )
    kpis: list[str] = Field(
        description="Key performance indicators to track"
    )

    # Summary
    executive_summary: str = Field(
        description="High-level roadmap summary for stakeholders"
    )

    # Metadata
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    model_used: str = "claude-opus-4-5-20251101"


class RoadmapPlanner(BaseAgent):
    """Agent that creates implementation roadmaps with sprint planning.

    This agent uses Claude Opus to design realistic project timelines,
    sprint breakdowns, and risk mitigation strategies.

    Usage:
        planner = RoadmapPlanner()
        result = await planner.execute(
            prd_analysis=analysis,
            feature_decomposition=decomposition,
            tech_spec=tech_spec,
            test_plan=test_plan,
            context={"team_size": 2, "target_launch": "3 months"}
        )

        roadmap = Roadmap(**result["roadmap"])
    """

    def __init__(self) -> None:
        super().__init__(
            name="roadmap_planner",
            capabilities=[
                "sprint_planning",
                "timeline_estimation",
                "dependency_analysis",
                "risk_assessment",
                "milestone_planning",
            ],
        )
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def execute(
        self,
        prd_analysis: PRDAnalysis | dict[str, Any],
        feature_decomposition: FeatureDecomposition | dict[str, Any],
        tech_spec: TechnicalSpec | dict[str, Any],
        test_plan: TestPlan | dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate implementation roadmap.

        Args:
            prd_analysis: PRDAnalysis object or dict
            feature_decomposition: FeatureDecomposition object or dict
            tech_spec: TechnicalSpec object or dict
            test_plan: TestPlan object or dict
            context: Additional context (team_size, target_launch, etc.)

        Returns:
            Dictionary with Roadmap and metadata
        """
        context = context or {}
        task_id = f"roadmap_{datetime.now().strftime('%H%M%S')}"
        self.start_task(task_id)

        # Convert dicts to objects if needed
        if isinstance(prd_analysis, dict):
            prd_analysis = PRDAnalysis(**prd_analysis)
        if isinstance(feature_decomposition, dict):
            feature_decomposition = FeatureDecomposition(**feature_decomposition)
        if isinstance(tech_spec, dict):
            tech_spec = TechnicalSpec(**tech_spec)
        if isinstance(test_plan, dict):
            test_plan = TestPlan(**test_plan)

        self.logger.info(
            "Starting roadmap planning",
            user_stories=len(feature_decomposition.user_stories),
            epics=len(feature_decomposition.epics),
            estimated_effort=feature_decomposition.total_effort_estimate,
        )

        try:
            # Generate the roadmap using Claude Opus
            roadmap = await self._generate_roadmap(
                prd_analysis,
                feature_decomposition,
                tech_spec,
                test_plan,
                context
            )

            # Report outputs for verification
            self.report_output(
                "roadmap",
                "implementation_plan",
                "Complete implementation roadmap with sprints and milestones"
            )

            self.logger.info(
                "Roadmap planning completed",
                sprints=len(roadmap.sprints),
                milestones=len(roadmap.milestones),
                total_weeks=roadmap.total_duration_weeks,
                risks=len(roadmap.risks),
            )

            return {
                "success": True,
                "roadmap": roadmap.model_dump(),
                "task_id": task_id,
            }

        except Exception as e:
            self.logger.error("Roadmap planning failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "task_id": task_id,
            }

    async def _generate_roadmap(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        tech_spec: TechnicalSpec,
        test_plan: TestPlan,
        context: dict[str, Any],
    ) -> Roadmap:
        """Use Claude Opus to generate implementation roadmap."""

        # Build the roadmap prompt
        prompt = self._build_roadmap_prompt(
            prd_analysis,
            feature_decomposition,
            tech_spec,
            test_plan,
            context
        )

        # Call Claude Opus for roadmap planning
        response = await self.client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=12000,  # Large token count for comprehensive roadmap
            temperature=0.4,  # Moderate temperature for planning creativity
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
                roadmap_data = json.loads(json_str)
                return Roadmap(**roadmap_data)
            else:
                # Fallback: parse markdown structure
                return self._parse_markdown_response(content)

        except Exception as e:
            self.logger.warning("Failed to parse JSON, using fallback", error=str(e))
            return self._parse_markdown_response(content)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for roadmap planning."""
        return """You are an expert agile coach and delivery manager.

Your role is to create realistic, achievable implementation roadmaps.

Guidelines:
1. Be realistic about timelines - account for unknowns
2. Plan sprints around delivering user value
3. Consider dependencies - some stories must be done first
4. Account for testing time in estimates
5. Identify risks early and have mitigation plans
6. Plan for buffer time (20-30% contingency)
7. Balance features across sprints for sustainable pace
8. Output MUST be valid JSON matching the expected schema

Sprint Planning Principles:
- 2-week sprints are standard (can be 1-4 weeks)
- Each sprint should deliver working software
- Don't overcommit - better to under-promise and over-deliver
- Account for meetings, code review, bug fixes (20-30% of time)
- Include refactoring and technical debt in sprints

Dependency Management:
- Identify blocking dependencies early
- Critical path = longest chain of dependent stories
- Parallelize work where possible
- Infrastructure/foundation stories come first

Risk Management:
- Technical risks: New technologies, complex integrations
- Resource risks: Key person dependency, skill gaps
- External risks: Third-party service availability
- Schedule risks: Optimistic estimates, scope creep

Milestone Planning:
- MVP = Minimum Viable Product (core features only)
- Beta = Feature complete, needs polish
- Launch = Production ready
- Post-launch = Enhancements and improvements
"""

    def _build_roadmap_prompt(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        tech_spec: TechnicalSpec,
        test_plan: TestPlan,
        context: dict[str, Any],
    ) -> str:
        """Build the roadmap prompt with all context."""

        context_str = ""
        if context:
            context_str = "\n\nAdditional Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"

        # Group user stories by epic
        epic_stories = {}
        for epic in feature_decomposition.epics:
            stories = [
                s for s in feature_decomposition.user_stories
                if s.epic == epic.id
            ]
            epic_stories[epic.name] = {
                "id": epic.id,
                "priority": epic.priority,
                "stories": [(s.id, s.title, s.effort_estimate, s.dependencies) for s in stories]
            }

        return f"""Create an implementation roadmap for this project.

## Project Overview

**Problem**: {prd_analysis.problem_statement}

**Success Metrics**:
{chr(10).join(f"- {m}" for m in prd_analysis.success_metrics)}

**Constraints**:
{chr(10).join(f"- {c}" for c in prd_analysis.constraints)}

## Work Breakdown

**Total User Stories**: {len(feature_decomposition.user_stories)}
**Epics**: {len(feature_decomposition.epics)}
**Estimated Effort**: {feature_decomposition.total_effort_estimate}
**Critical Path**: {
    ', '.join(feature_decomposition.critical_path[:5])
} ... ({len(feature_decomposition.critical_path)} stories)

**Database Tables**: {len(tech_spec.database_schema)}
**API Endpoints**: {len(tech_spec.api_endpoints)}
**Test Scenarios**: {test_plan.total_test_count}
**Test Implementation Effort**: {test_plan.estimated_implementation_effort}

**Epic Breakdown**:
{chr(10).join(
    f"- {name} ({data['priority']}): {len(data['stories'])} stories"
    for name, data in list(epic_stories.items())[:10]
)}
{context_str}

## Instructions

Create a detailed roadmap in the following JSON format:

{{
  "sprints": [
    {{
      "sprint_number": 1,
      "sprint_goal": "Set up foundation and core authentication",
      "duration_weeks": 2,
      "user_stories": ["US-001", "US-002", "US-003"],
      "dependencies_met": [],
      "deliverables": [
        "Database schema deployed",
        "User registration working",
        "Login flow complete"
      ],
      "acceptance_criteria": [
        "All sprint tests passing",
        "Code reviewed and merged",
        "Deployed to staging environment"
      ],
      "risks": ["Supabase setup complexity"],
      "team_capacity": "80% (ramp-up sprint)"
    }}
  ],
  "total_duration_weeks": 12,

  "milestones": [
    {{
      "name": "MVP Launch",
      "target_sprint": 6,
      "description": "Core features ready for early users",
      "success_criteria": [
        "All critical user stories complete",
        "80%+ test coverage",
        "Security audit passed"
      ],
      "deliverables": ["Working app in production", "User documentation"]
    }}
  ],

  "dependency_graph_mermaid": "graph TD\\n  US001[Registration] --> US002[Login]\\n  US002 --> US003[Dashboard]",
  "critical_path": ["US-001", "US-002", "US-003"],

  "team_composition": {{
    "frontend_developer": "React/Next.js expert",
    "backend_developer": "Python/FastAPI expert",
    "full_stack_developer": "Can work across stack (optional for small teams)"
  }},
  "resource_allocation": [
    {{
      "sprint": 1,
      "frontend": "50%",
      "backend": "50%",
      "focus": "Foundation setup"
    }}
  ],

  "risks": [
    {{
      "id": "R-001",
      "title": "Third-party API integration delays",
      "description": "External service APIs may not work as documented",
      "probability": "Medium",
      "impact": "High",
      "mitigation": "Start integration work early in sprint 2",
      "contingency": "Use mock data initially, integrate later"
    }}
  ],

  "release_strategy": "Continuous deployment to staging, manual promotion to production after sprint review",
  "deployment_checkpoints": [
    "All tests passing",
    "Code review approved",
    "Security scan clean",
    "Performance benchmarks met"
  ],

  "velocity_tracking": "Track story points completed per sprint, aim for consistent velocity after sprint 2",
  "kpis": [
    "Sprint velocity (story points/sprint)",
    "Deployment frequency (releases/week)",
    "Test coverage percentage",
    "Bug escape rate (bugs in production)"
  ],

  "executive_summary": "12-week MVP in 6 sprints. 2 devs, 2-week sprints. Path: auth > core > launch."
}}

## Requirements

1. **Sprints**: Create 6-12 sprints based on project scope. Each sprint should:
   - Have a clear goal
   - Deliver working features
   - Respect dependencies
   - Be realistic (don't overload)

2. **Milestones**: Define at least 3 milestones (MVP, Beta, Launch)

3. **Dependencies**: Show dependencies in Mermaid diagram format

4. **Risks**: Identify 5-10 major risks with mitigations

5. **Resources**: Account for team size and roles

6. **Buffer**: Add 20-30% buffer for unknowns

Be realistic and production-ready. Account for testing time.
Return ONLY the JSON, no additional text."""

    def _parse_markdown_response(self, content: str) -> Roadmap:
        """Fallback parser for markdown-formatted responses."""
        # Simplified fallback

        fallback_sprint = Sprint(
            sprint_number=1,
            sprint_goal="Manual roadmap planning required",
            duration_weeks=2,
            user_stories=["Manual"],
            deliverables=["Manual roadmap review complete"],
            acceptance_criteria=["Roadmap finalized by team"],
        )

        fallback_milestone = Milestone(
            name="Manual Planning",
            target_sprint=1,
            description="Manual roadmap planning required",
            success_criteria=["Roadmap created manually"],
            deliverables=["Roadmap document"],
        )

        fallback_risk = Risk(
            id="R-001",
            title="Automated roadmap generation failed",
            description="Manual review of roadmap output required",
            probability="High",
            impact="Medium",
            mitigation="Review and create manual roadmap",
            contingency="Use simplified sprint plan",
        )

        return Roadmap(
            sprints=[fallback_sprint],
            total_duration_weeks=2,
            milestones=[fallback_milestone],
            dependency_graph_mermaid="graph TD\n  A[Manual Review Required]",
            critical_path=["Manual"],
            team_composition={"manual_review": "required"},
            resource_allocation=[{"sprint": 1, "manual": "100%"}],
            risks=[fallback_risk],
            release_strategy="To be determined manually",
            deployment_checkpoints=["Manual review complete"],
            velocity_tracking="To be determined",
            kpis=["Manual tracking required"],
            executive_summary="Manual roadmap planning required. See raw output for details.",
        )
