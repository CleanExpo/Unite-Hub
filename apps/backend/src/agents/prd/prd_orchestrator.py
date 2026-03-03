"""PRD Orchestrator - Coordinates all PRD generation agents.

This orchestrator runs all PRD agents in sequence:
1. PRDAnalysisAgent - Requirements analysis
2. FeatureDecomposer - User stories
3. TechnicalSpecGenerator - Architecture & APIs
4. TestScenarioGenerator - Test plans
5. RoadmapPlanner - Implementation roadmap

Outputs comprehensive PRD documents ready for development.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from src.config import get_settings
from src.utils import get_logger

from ..base_agent import BaseAgent
from .analysis_agent import PRDAnalysis, PRDAnalysisAgent
from .feature_decomposer import FeatureDecomposer, FeatureDecomposition
from .roadmap_planner import Roadmap, RoadmapPlanner
from .tech_spec_generator import TechnicalSpec, TechnicalSpecGenerator
from .test_generator import TestPlan, TestScenarioGenerator

settings = get_settings()
logger = get_logger(__name__)


class PRDResult(BaseModel):
    """Complete PRD generation result."""

    # Analysis
    prd_analysis: PRDAnalysis
    feature_decomposition: FeatureDecomposition
    technical_spec: TechnicalSpec
    test_plan: TestPlan
    roadmap: Roadmap

    # Generated Documents
    documents_generated: list[str] = Field(
        description="Paths to generated document files"
    )

    # Summary
    total_user_stories: int
    total_api_endpoints: int
    total_test_scenarios: int
    total_sprints: int
    estimated_duration_weeks: int

    # Metadata
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    model_used: str = "claude-opus-4-5-20251101"


class PRDOrchestrator(BaseAgent):
    """Orchestrator that coordinates all PRD generation agents.

    This is the main entry point for PRD generation. It runs all agents
    in the correct sequence and generates comprehensive documentation.

    Usage:
        orchestrator = PRDOrchestrator()
        result = await orchestrator.generate(
            requirements=\"Build a chat app with AI responses\",
            context={
                \"target_users\": \"Developers\",
                \"timeline\": \"3 months\",
                \"team_size\": 2
            }
        )

        # Access generated artifacts
        prd = result[\"prd_result\"]
        print(f\"Generated {prd['total_user_stories']} user stories\")
        print(f\"Estimated duration: {prd['estimated_duration_weeks']} weeks\")
    """

    def __init__(self) -> None:
        super().__init__(
            name="prd_orchestrator",
            capabilities=[
                "requirements_analysis",
                "feature_decomposition",
                "technical_design",
                "test_planning",
                "roadmap_planning",
                "document_generation",
            ],
        )

        # Initialize all sub-agents
        self.analysis_agent = PRDAnalysisAgent()
        self.feature_decomposer = FeatureDecomposer()
        self.tech_spec_generator = TechnicalSpecGenerator()
        self.test_generator = TestScenarioGenerator()
        self.roadmap_planner = RoadmapPlanner()

    async def execute(
        self,
        task_description: str,
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute PRD generation (BaseAgent interface)."""
        return await self.generate(requirements=task_description, context=context)

    async def generate(
        self,
        requirements: str,
        context: dict[str, Any] | None = None,
        output_dir: Path | str | None = None,
    ) -> dict[str, Any]:
        """Generate complete PRD from high-level requirements.

        Args:
            requirements: User requirements (free text)
            context: Additional context (target_users, timeline, team_size, etc.)
            output_dir: Directory to write PRD documents (optional)

        Returns:
            Dictionary with PRDResult and all generated artifacts
        """
        context = context or {}
        task_id = f"prd_gen_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.start_task(task_id)

        self.logger.info(
            "Starting PRD generation",
            requirements_length=len(requirements),
            context_keys=list(context.keys()),
        )

        try:
            # Phase 1: Requirements Analysis
            self.logger.info("Phase 1/5: Analyzing requirements...")
            analysis_result = await self.analysis_agent.execute(
                task_description=requirements,
                context=context
            )
            if not analysis_result["success"]:
                raise Exception(f"Analysis failed: {analysis_result.get('error')}")

            prd_analysis = PRDAnalysis(**analysis_result["analysis"])
            self.logger.info(
                "Requirements analysis complete",
                functional_reqs=len(prd_analysis.functional_requirements),
                target_users=len(prd_analysis.target_users),
            )

            # Phase 2: Feature Decomposition
            self.logger.info("Phase 2/5: Decomposing features into user stories...")
            decomp_result = await self.feature_decomposer.execute(
                prd_analysis=prd_analysis,
                context=context
            )
            if not decomp_result["success"]:
                raise Exception(f"Feature decomposition failed: {decomp_result.get('error')}")

            feature_decomposition = FeatureDecomposition(**decomp_result["decomposition"])
            self.logger.info(
                "Feature decomposition complete",
                epics=len(feature_decomposition.epics),
                user_stories=len(feature_decomposition.user_stories),
            )

            # Phase 3: Technical Specification
            self.logger.info("Phase 3/5: Generating technical specification...")
            tech_result = await self.tech_spec_generator.execute(
                prd_analysis=prd_analysis,
                feature_decomposition=feature_decomposition,
                context=context
            )
            if not tech_result["success"]:
                raise Exception(f"Technical spec generation failed: {tech_result.get('error')}")

            tech_spec = TechnicalSpec(**tech_result["specification"])
            self.logger.info(
                "Technical specification complete",
                database_tables=len(tech_spec.database_schema),
                api_endpoints=len(tech_spec.api_endpoints),
            )

            # Phase 4: Test Plan Generation
            self.logger.info("Phase 4/5: Generating test plan...")
            test_result = await self.test_generator.execute(
                prd_analysis=prd_analysis,
                feature_decomposition=feature_decomposition,
                tech_spec=tech_spec,
                context=context
            )
            if not test_result["success"]:
                raise Exception(f"Test plan generation failed: {test_result.get('error')}")

            test_plan = TestPlan(**test_result["test_plan"])
            self.logger.info(
                "Test plan complete",
                total_tests=test_plan.total_test_count,
                unit_tests=len(test_plan.unit_tests),
                integration_tests=len(test_plan.integration_tests),
                e2e_tests=len(test_plan.e2e_tests),
            )

            # Phase 5: Roadmap Planning
            self.logger.info("Phase 5/5: Creating implementation roadmap...")
            roadmap_result = await self.roadmap_planner.execute(
                prd_analysis=prd_analysis,
                feature_decomposition=feature_decomposition,
                tech_spec=tech_spec,
                test_plan=test_plan,
                context=context
            )
            if not roadmap_result["success"]:
                raise Exception(f"Roadmap planning failed: {roadmap_result.get('error')}")

            roadmap = Roadmap(**roadmap_result["roadmap"])
            self.logger.info(
                "Roadmap planning complete",
                sprints=len(roadmap.sprints),
                total_weeks=roadmap.total_duration_weeks,
                milestones=len(roadmap.milestones),
            )

            # Generate documents if output directory specified
            documents_generated = []
            if output_dir:
                self.logger.info("Generating PRD documents...")
                documents_generated = await self._generate_documents(
                    prd_analysis=prd_analysis,
                    feature_decomposition=feature_decomposition,
                    tech_spec=tech_spec,
                    test_plan=test_plan,
                    roadmap=roadmap,
                    output_dir=Path(output_dir),
                )
                self.logger.info(
                    "Documents generated",
                    count=len(documents_generated),
                )

            # Create final result
            prd_result = PRDResult(
                prd_analysis=prd_analysis,
                feature_decomposition=feature_decomposition,
                technical_spec=tech_spec,
                test_plan=test_plan,
                roadmap=roadmap,
                documents_generated=documents_generated,
                total_user_stories=len(feature_decomposition.user_stories),
                total_api_endpoints=len(tech_spec.api_endpoints),
                total_test_scenarios=test_plan.total_test_count,
                total_sprints=len(roadmap.sprints),
                estimated_duration_weeks=roadmap.total_duration_weeks,
            )

            # Report outputs for verification
            self.report_output(
                "prd_generation",
                "complete_prd",
                f"Complete PRD with {prd_result.total_user_stories} user stories, "
                f"{prd_result.total_api_endpoints} API endpoints, "
                f"{prd_result.total_test_scenarios} test scenarios"
            )

            self.logger.info(
                "PRD generation complete",
                user_stories=prd_result.total_user_stories,
                api_endpoints=prd_result.total_api_endpoints,
                test_scenarios=prd_result.total_test_scenarios,
                sprints=prd_result.total_sprints,
                estimated_weeks=prd_result.estimated_duration_weeks,
            )

            return {
                "success": True,
                "prd_result": prd_result.model_dump(),
                "task_id": task_id,
            }

        except Exception as e:
            self.logger.error("PRD generation failed", error=str(e))
            return {
                "success": False,
                "error": str(e),
                "task_id": task_id,
            }

    async def _generate_documents(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
        tech_spec: TechnicalSpec,
        test_plan: TestPlan,
        roadmap: Roadmap,
        output_dir: Path,
    ) -> list[str]:
        """Generate PRD document files.

        Returns:
            List of generated file paths
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        generated_files = []

        # 1. PRD Document (prd.md)
        prd_md_path = output_dir / "prd.md"
        prd_md_content = self._generate_prd_markdown(prd_analysis, feature_decomposition)
        prd_md_path.write_text(prd_md_content, encoding="utf-8")
        generated_files.append(str(prd_md_path))

        # 2. User Stories (user_stories.md)
        stories_md_path = output_dir / "user_stories.md"
        stories_md_content = self._generate_user_stories_markdown(feature_decomposition)
        stories_md_path.write_text(stories_md_content, encoding="utf-8")
        generated_files.append(str(stories_md_path))

        # 3. Feature List JSON (feature_list.json) - for InitializerAgent
        feature_json_path = output_dir / "feature_list.json"
        feature_json_content = self.feature_decomposer.to_feature_list_json(
            feature_decomposition
        )
        feature_json_path.write_text(
            json.dumps(feature_json_content, indent=2),
            encoding="utf-8"
        )
        generated_files.append(str(feature_json_path))

        # 4. Technical Specification (tech_spec.md)
        tech_md_path = output_dir / "tech_spec.md"
        tech_md_content = self._generate_tech_spec_markdown(tech_spec)
        tech_md_path.write_text(tech_md_content, encoding="utf-8")
        generated_files.append(str(tech_md_path))

        # 5. Test Plan (test_plan.md)
        test_md_path = output_dir / "test_plan.md"
        test_md_content = self._generate_test_plan_markdown(test_plan)
        test_md_path.write_text(test_md_content, encoding="utf-8")
        generated_files.append(str(test_md_path))

        # 6. Implementation Roadmap (roadmap.md)
        roadmap_md_path = output_dir / "roadmap.md"
        roadmap_md_content = self._generate_roadmap_markdown(roadmap)
        roadmap_md_path.write_text(roadmap_md_content, encoding="utf-8")
        generated_files.append(str(roadmap_md_path))

        return generated_files

    def _generate_prd_markdown(
        self,
        prd_analysis: PRDAnalysis,
        feature_decomposition: FeatureDecomposition,
    ) -> str:
        """Generate PRD markdown document."""
        epic_list = "\n".join(
            f"- **{epic.name}**: {epic.description}"
            for epic in feature_decomposition.epics
        )

        return f"""# Product Requirements Document (PRD)

**Generated**: {prd_analysis.generated_at}
**Model**: {prd_analysis.model_used}

---

## Executive Summary

{prd_analysis.executive_summary}

## Problem Statement

{prd_analysis.problem_statement}

## Target Users

{chr(10).join(f"- {user}" for user in prd_analysis.target_users)}

## Success Metrics

{chr(10).join(f"- {metric}" for metric in prd_analysis.success_metrics)}

## Functional Requirements

{chr(10).join(f"{i+1}. {req}" for i, req in enumerate(prd_analysis.functional_requirements))}

## Non-Functional Requirements

{chr(10).join(f"{i+1}. {req}" for i, req in enumerate(prd_analysis.non_functional_requirements))}

## Feature Epics

{epic_list}

**Total User Stories**: {len(feature_decomposition.user_stories)}

## Constraints

{chr(10).join(f"- {c}" for c in prd_analysis.constraints)}

## Assumptions

{chr(10).join(f"- {a}" for a in prd_analysis.assumptions)}

## Out of Scope

{chr(10).join(f"- {item}" for item in prd_analysis.out_of_scope)}

---

*See user_stories.md for detailed user stories*
*See tech_spec.md for technical architecture*
*See test_plan.md for testing strategy*
*See roadmap.md for implementation timeline*
"""

    def _generate_user_stories_markdown(
        self,
        feature_decomposition: FeatureDecomposition,
    ) -> str:
        """Generate user stories markdown document."""
        epics_content = []

        for epic in feature_decomposition.epics:
            stories = [
                s for s in feature_decomposition.user_stories
                if s.epic == epic.id
            ]

            stories_text = []
            for story in stories:
                dependencies = ", ".join(story.dependencies) if story.dependencies else "None"
                technical_notes = "\n".join(f"    - {note}" for note in story.technical_notes)

                story_text = f"""### {story.id}: {story.title}

**Priority**: {story.priority}
**Effort**: {story.effort_estimate}
**Dependencies**: {dependencies}

**User Story**:
{story.description}

**Acceptance Criteria**:
{chr(10).join(f"- {criteria}" for criteria in story.acceptance_criteria)}

**Technical Notes**:
{technical_notes if story.technical_notes else "None"}
"""
                stories_text.append(story_text)

            epic_content = f"""## {epic.name} ({epic.id})

**Priority**: {epic.priority}
**Business Value**: {epic.business_value}

{epic.description}

{chr(10).join(stories_text)}

---
"""
            epics_content.append(epic_content)

        return f"""# User Stories

**Generated**: {feature_decomposition.generated_at}
**Total Stories**: {len(feature_decomposition.user_stories)}
**Total Epics**: {len(feature_decomposition.epics)}
**Estimated Effort**: {feature_decomposition.total_effort_estimate}

---

{chr(10).join(epics_content)}

## Critical Path

{chr(10).join(f"{i+1}. {story_id}" for i, story_id in enumerate(feature_decomposition.critical_path))}
"""

    def _generate_tech_spec_markdown(self, tech_spec: TechnicalSpec) -> str:
        """Generate technical specification markdown document."""
        # Database tables
        db_tables = []
        for table in tech_spec.database_schema:
            columns_text = "\n".join(
                f"- **{col['name']}** ({col['type']}): {col.get('description', '')} `{col.get('constraints', '')}`"
                for col in table.columns
            )
            indexes_text = "\n".join(f"- {idx}" for idx in table.indexes) if table.indexes else "None"
            relationships_text = "\n".join(f"- {rel}" for rel in table.relationships) if table.relationships else "None"

            db_tables.append(f"""### {table.name}

{table.description}

**Columns**:
{columns_text}

**Indexes**:
{indexes_text}

**Relationships**:
{relationships_text}
""")

        # API endpoints
        api_endpoints = []
        for ep in tech_spec.api_endpoints:
            api_endpoints.append(f"""### {ep.method} {ep.path}

{ep.description}

- **Authentication Required**: {ep.auth_required}
- **Rate Limit**: {ep.rate_limit or 'None'}
- **Related Story**: {ep.related_user_story or 'N/A'}
""")

        return f"""# Technical Specification

**Generated**: {tech_spec.generated_at}

---

## Architecture Overview

{tech_spec.architecture_overview}

## Architecture Diagram

```mermaid
{tech_spec.architecture_diagram_mermaid}
```

## Database Schema

{chr(10).join(db_tables)}

## API Endpoints

{chr(10).join(api_endpoints)}

## Technology Stack

{chr(10).join(f"- **{k}**: {v}" for k, v in tech_spec.recommended_stack.items())}

## Security

**Authentication**: {tech_spec.authentication_approach}

**Authorization**: {tech_spec.authorization_model}

**Security Considerations**:
{chr(10).join(f"- {item}" for item in tech_spec.security_considerations)}

## Performance & Scalability

{tech_spec.scalability_approach}

**Performance Targets**:
{chr(10).join(f"- **{k}**: {v}" for k, v in tech_spec.performance_targets.items())}

**Caching Strategy**: {tech_spec.caching_strategy}

## Deployment

{tech_spec.deployment_architecture}

**Infrastructure Requirements**:
{chr(10).join(f"- {item}" for item in tech_spec.infrastructure_requirements)}
"""

    def _generate_test_plan_markdown(self, test_plan: TestPlan) -> str:
        """Generate test plan markdown document."""
        return f"""# Test Plan

**Generated**: {test_plan.generated_at}
**Total Test Scenarios**: {test_plan.total_test_count}
**Estimated Implementation**: {test_plan.estimated_implementation_effort}

---

## Coverage Strategy

{test_plan.coverage_strategy}

## Test Frameworks

{chr(10).join(f"- **{k}**: {v}" for k, v in test_plan.test_frameworks.items())}

## Unit Tests ({len(test_plan.unit_tests)} scenarios)

{chr(10).join(
    f"### {test.id}: {test.title}\n"
    f"**Given**: {test.given}\n"
    f"**When**: {test.when}\n"
    f"**Then**: {test.then}\n"
    f"**Priority**: {test.priority}\n"
    for test in test_plan.unit_tests[:10]
)}

## Integration Tests ({len(test_plan.integration_tests)} scenarios)

{chr(10).join(
    f"### {test.id}: {test.title}\n"
    f"**Given**: {test.given}\n"
    f"**When**: {test.when}\n"
    f"**Then**: {test.then}\n"
    f"**Priority**: {test.priority}\n"
    for test in test_plan.integration_tests[:10]
)}

## E2E Tests ({len(test_plan.e2e_tests)} scenarios)

{chr(10).join(
    f"### {test.id}: {test.title}\n"
    f"**Given**: {test.given}\n"
    f"**When**: {test.when}\n"
    f"**Then**: {test.then}\n"
    f"**Priority**: {test.priority}\n"
    for test in test_plan.e2e_tests
)}

## Security Tests

{chr(10).join(f"- {test}" for test in test_plan.security_tests)}

## CI Integration

{test_plan.ci_integration}
"""

    def _generate_roadmap_markdown(self, roadmap: Roadmap) -> str:
        """Generate implementation roadmap markdown document."""
        sprints_content = []
        for sprint in roadmap.sprints:
            sprints_content.append(f"""## Sprint {sprint.sprint_number}: {sprint.sprint_goal}

**Duration**: {sprint.duration_weeks} weeks
**Team Capacity**: {sprint.team_capacity}

**User Stories**: {", ".join(sprint.user_stories)}

**Deliverables**:
{chr(10).join(f"- {d}" for d in sprint.deliverables)}

**Acceptance Criteria**:
{chr(10).join(f"- {ac}" for ac in sprint.acceptance_criteria)}

**Risks**: {", ".join(sprint.risks) if sprint.risks else "None"}

---
""")

        milestones_content = "\n".join(
            f"### {m.name} (Sprint {m.target_sprint})\n{m.description}\n**Deliverables**: {', '.join(m.deliverables)}"
            for m in roadmap.milestones
        )

        return f"""# Implementation Roadmap

**Generated**: {roadmap.generated_at}
**Total Duration**: {roadmap.total_duration_weeks} weeks
**Total Sprints**: {len(roadmap.sprints)}

---

## Executive Summary

{roadmap.executive_summary}

## Sprints

{chr(10).join(sprints_content)}

## Milestones

{milestones_content}

## Dependency Graph

```mermaid
{roadmap.dependency_graph_mermaid}
```

## Critical Path

{", ".join(roadmap.critical_path)}

## Risks

{chr(10).join(
    f"### {r.id}: {r.title}\n"
    f"**Probability**: {r.probability} | **Impact**: {r.impact}\n"
    f"**Mitigation**: {r.mitigation}\n"
    f"**Contingency**: {r.contingency}\n"
    for r in roadmap.risks
)}

## Release Strategy

{roadmap.release_strategy}

## KPIs

{chr(10).join(f"- {kpi}" for kpi in roadmap.kpis)}
"""
