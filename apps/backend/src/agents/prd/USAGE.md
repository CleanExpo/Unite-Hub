# Agent PRD System - Usage Guide

## Overview

The Agent PRD System transforms free-text requirements into comprehensive, production-ready Product Requirement Documents using Claude Opus 4.5.

**What it generates**:
- 📄 Complete PRD with executive summary, requirements, constraints
- 📝 User stories with acceptance criteria (Epic → User Story format)
- 🏗️ Technical specification (database schema, API endpoints, architecture)
- 🧪 Test plan (unit, integration, E2E test scenarios)
- 🗺️ Implementation roadmap (sprint breakdown, timeline, risks)
- 📦 6 document files (prd.md, user_stories.md, tech_spec.md, test_plan.md, roadmap.md, feature_list.json)

---

## Quick Start

### Basic Usage

```python
from src.agents.prd import PRDOrchestrator

# Initialize orchestrator
orchestrator = PRDOrchestrator()

# Generate PRD from requirements
result = await orchestrator.generate(
    requirements="""
    Build a task management application for remote teams.
    Users should be able to create projects, assign tasks,
    track progress, and communicate with team members in real-time.
    """,
    context={
        "target_users": "Remote teams, project managers, developers",
        "timeline": "3 months",
        "team_size": 2,
    },
    output_dir="./prds/task-manager"
)

if result["success"]:
    prd = result["prd_result"]
    print(f"✅ Generated {prd['total_user_stories']} user stories")
    print(f"✅ Designed {prd['total_api_endpoints']} API endpoints")
    print(f"✅ Created {prd['total_test_scenarios']} test scenarios")
    print(f"✅ Planned {prd['total_sprints']} sprints ({prd['estimated_duration_weeks']} weeks)")
    print(f"✅ Documents: {prd['documents_generated']}")
else:
    print(f"❌ Error: {result['error']}")
```

---

## Individual Agents

You can also use agents independently:

### 1. PRD Analysis Agent

Analyzes requirements and extracts structured information.

```python
from src.agents.prd import PRDAnalysisAgent

agent = PRDAnalysisAgent()
result = await agent.execute(
    task_description="Build a chat app with AI responses",
    context={"target_users": "Developers", "timeline": "2 months"}
)

analysis = result["analysis"]
print(analysis["executive_summary"])
print(analysis["functional_requirements"])
```

**Outputs**: `PRDAnalysis` with:
- Executive summary (2-3 sentences)
- Problem statement
- Target users
- Success metrics
- Functional requirements
- Non-functional requirements
- Constraints, assumptions, out-of-scope

### 2. Feature Decomposer

Breaks requirements into epics and user stories.

```python
from src.agents.prd import FeatureDecomposer, PRDAnalysis

decomposer = FeatureDecomposer()
result = await decomposer.execute(
    prd_analysis=prd_analysis,  # From step 1
    context={"team_size": 2, "sprint_length": 2}
)

decomposition = result["decomposition"]
print(f"Epics: {len(decomposition['epics'])}")
print(f"User Stories: {len(decomposition['user_stories'])}")

# Convert to feature_list.json format for InitializerAgent
feature_list = decomposer.to_feature_list_json(decomposition)
```

**Outputs**: `FeatureDecomposition` with:
- Epics (high-level feature groups)
- User stories (As a X, I want Y, so that Z)
- Acceptance criteria (Given-When-Then)
- Dependencies, priorities, effort estimates
- Critical path

### 3. Technical Spec Generator

Designs system architecture, database schema, API endpoints.

```python
from src.agents.prd import TechnicalSpecGenerator

generator = TechnicalSpecGenerator()
result = await generator.execute(
    prd_analysis=prd_analysis,
    feature_decomposition=decomposition,
    context={"existing_stack": "Next.js + FastAPI + Supabase"}
)

tech_spec = result["specification"]
print(f"Database tables: {len(tech_spec['database_schema'])}")
print(f"API endpoints: {len(tech_spec['api_endpoints'])}")
```

**Outputs**: `TechnicalSpec` with:
- System architecture overview + Mermaid diagram
- Database schema (tables, columns, indexes, relationships)
- API endpoints (method, path, auth, request/response schemas)
- Technology stack recommendations
- Security considerations
- Performance targets, caching strategy
- Deployment architecture

### 4. Test Scenario Generator

Creates comprehensive test plans.

```python
from src.agents.prd import TestScenarioGenerator

generator = TestScenarioGenerator()
result = await generator.execute(
    prd_analysis=prd_analysis,
    feature_decomposition=decomposition,
    tech_spec=tech_spec,
    context={"test_framework": "Vitest + Playwright"}
)

test_plan = result["test_plan"]
print(f"Unit tests: {len(test_plan['unit_tests'])}")
print(f"Integration tests: {len(test_plan['integration_tests'])}")
print(f"E2E tests: {len(test_plan['e2e_tests'])}")
```

**Outputs**: `TestPlan` with:
- Unit test scenarios
- Integration test scenarios
- E2E test scenarios
- Test fixtures and mock services
- Security tests
- Performance tests
- CI integration strategy

### 5. Roadmap Planner

Plans implementation timeline with sprints and milestones.

```python
from src.agents.prd import RoadmapPlanner

planner = RoadmapPlanner()
result = await planner.execute(
    prd_analysis=prd_analysis,
    feature_decomposition=decomposition,
    tech_spec=tech_spec,
    test_plan=test_plan,
    context={"team_size": 2, "target_launch": "3 months"}
)

roadmap = result["roadmap"]
print(f"Total sprints: {len(roadmap['sprints'])}")
print(f"Duration: {roadmap['total_duration_weeks']} weeks")
print(f"Milestones: {', '.join(m['name'] for m in roadmap['milestones'])}")
```

**Outputs**: `Roadmap` with:
- Sprint breakdown (goals, stories, deliverables, risks)
- Milestones (MVP, Beta, Launch)
- Dependency graph (Mermaid diagram)
- Critical path
- Team composition and resource allocation
- Risks with mitigation strategies
- Release strategy, KPIs

---

## Output Documents

When you specify `output_dir`, the system generates 6 files:

### 1. `prd.md` - Product Requirements Document
- Executive summary
- Problem statement
- Target users, success metrics
- Functional and non-functional requirements
- Feature epics
- Constraints, assumptions, out-of-scope

### 2. `user_stories.md` - User Stories
- Organized by epic
- Full user story format
- Acceptance criteria (Given-When-Then)
- Priorities, effort estimates
- Dependencies, technical notes

### 3. `feature_list.json` - Feature List (for InitializerAgent)
```json
{
  "version": "1.0",
  "total_features": 15,
  "epics": [...],
  "features": [
    {
      "id": "US-001",
      "name": "User Registration",
      "description": "As a user, I want to...",
      "priority": "critical",
      "status": "pending",
      "acceptance_criteria": [...]
    }
  ],
  "critical_path": ["US-001", "US-002"]
}
```

### 4. `tech_spec.md` - Technical Specification
- Architecture overview + diagram
- Database schema with all tables
- API endpoints with full specs
- Technology stack
- Security, performance, deployment

### 5. `test_plan.md` - Test Plan
- Coverage strategy
- Unit, integration, E2E test scenarios
- Security tests
- CI integration approach

### 6. `roadmap.md` - Implementation Roadmap
- Sprint breakdown
- Milestones
- Dependency graph
- Risks and mitigations
- Release strategy, KPIs

---

## Integration with InitializerAgent

The PRD system generates `feature_list.json` compatible with the long-running agent harness:

```python
from src.agents.prd import PRDOrchestrator
from src.agents.long_running.initializer import InitializerAgent

# Step 1: Generate PRD
orchestrator = PRDOrchestrator()
prd_result = await orchestrator.generate(
    requirements="Build X feature...",
    output_dir="./workspace"
)

# Step 2: Use generated feature_list.json
initializer = InitializerAgent()
await initializer.execute(
    task_description="Implement features",
    context={
        "feature_list_path": "./workspace/feature_list.json",
        "output_dir": "./workspace"
    }
)
```

The InitializerAgent will:
1. Load features from `feature_list.json`
2. Implement each feature using CodingAgent
3. Track progress in `claude-progress.txt`
4. Update feature status in the JSON file

---

## Context Parameters

Optional context to customize PRD generation:

```python
context = {
    # User & Timeline
    "target_users": "Remote teams, developers",
    "timeline": "3 months",
    "target_launch": "Q2 2025",

    # Team
    "team_size": 2,
    "team_roles": "1 frontend, 1 backend",
    "sprint_length": 2,  # weeks

    # Technology
    "existing_stack": "Next.js + FastAPI + Supabase",
    "technology_constraints": "Must use PostgreSQL",
    "test_framework": "Vitest + Playwright",

    # Business
    "budget": "$50k",
    "compliance": "GDPR, SOC 2",
    "priority": "Speed to market > Perfect architecture",
}
```

---

## Error Handling

All agents return a consistent structure:

```python
{
    "success": True | False,
    "analysis": {...},  # or "decomposition", "specification", etc.
    "task_id": "prd_gen_20250108_143022",
    "error": "Error message if success=False"
}
```

Example error handling:

```python
result = await orchestrator.generate(requirements="...")

if not result["success"]:
    logger.error(f"PRD generation failed: {result['error']}")
    # Handle error (retry, alert user, etc.)
else:
    prd = result["prd_result"]
    # Use PRD data
```

---

## Best Practices

### 1. Provide Clear Requirements

✅ **Good**:
```
Build a task management app for remote teams with real-time collaboration.
Users should create projects, assign tasks with due dates, track progress
with Kanban boards, and communicate via comments. Must support 100+ concurrent
users and integrate with Slack for notifications.
```

❌ **Bad**:
```
Make a todo app
```

### 2. Add Relevant Context

Always provide:
- Target users (who will use this?)
- Timeline (how much time do we have?)
- Team size (how many developers?)
- Existing stack (what are we building on?)

### 3. Use Output Directory

Specify `output_dir` to generate documentation files:

```python
result = await orchestrator.generate(
    requirements="...",
    output_dir=f"./prds/{project_name}"
)
```

### 4. Review Critical Path

The system identifies critical path user stories. Review these first:

```python
critical_stories = prd["feature_decomposition"]["critical_path"]
print(f"Must implement these stories in order: {critical_stories}")
```

---

## Advanced Usage

### Custom Agent Configuration

Override agent behavior:

```python
from src.agents.prd import FeatureDecomposer

class CustomDecomposer(FeatureDecomposer):
    async def _decompose_features(self, prd_analysis, context):
        # Custom decomposition logic
        # Maybe use a different prompt or model
        pass

decomposer = CustomDecomposer()
```

### Partial Generation

Run only specific agents:

```python
# Just analyze requirements
analysis_agent = PRDAnalysisAgent()
result = await analysis_agent.execute(requirements="...")

# Just create user stories (if you have PRD analysis already)
decomposer = FeatureDecomposer()
result = await decomposer.execute(prd_analysis=existing_analysis)
```

### Custom Document Templates

Modify markdown generation in `prd_orchestrator.py`:

```python
def _generate_prd_markdown(self, prd_analysis, feature_decomposition):
    # Custom markdown template
    return f"""
    # My Custom PRD Template

    {prd_analysis.executive_summary}
    ...
    """
```

---

## Troubleshooting

### "Failed to parse JSON"

If Claude returns markdown instead of JSON, the fallback parser handles it.
Check logs for warnings:

```
WARNING: Failed to parse JSON, using fallback
```

This means you'll get placeholder data. Review the raw LLM output.

### "Analysis failed" or "Decomposition failed"

Check:
1. ANTHROPIC_API_KEY is set correctly
2. Requirements are detailed enough (> 50 characters)
3. Claude Opus 4.5 API is accessible
4. No rate limiting

### Empty or minimal output

Provide more context:
- Add specific features to requirements
- Specify target users more clearly
- Add business constraints

---

## Performance

**Typical generation times** (depends on requirements complexity):

| Agent | Time | Tokens |
|-------|------|--------|
| PRDAnalysisAgent | 5-10s | ~2K |
| FeatureDecomposer | 10-20s | ~4K |
| TechnicalSpecGenerator | 15-30s | ~8K |
| TestScenarioGenerator | 15-30s | ~8K |
| RoadmapPlanner | 15-30s | ~8K |
| **Total (orchestrator)** | **1-2 min** | **~30K** |

**Cost estimate**: ~$0.50-1.00 per full PRD generation (Claude Opus 4.5 pricing)

---

## Next Steps

After generating a PRD:

1. **Review documents** in `output_dir`
2. **Validate with stakeholders** (show prd.md, roadmap.md)
3. **Adjust if needed** (re-run with refined requirements)
4. **Use feature_list.json** with InitializerAgent to start implementation
5. **Track progress** in Supabase agent_runs table

---

**Questions?** See `/docs/AGENT_PRD_SYSTEM.md` for architecture details.
