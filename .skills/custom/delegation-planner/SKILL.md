---
id: delegation-planner
name: delegation-planner
type: Capability Uplift
version: 1.0.0
created: 20/03/2026
modified: 20/03/2026
status: active
triggers:
  - who should do this
  - which agent handles
  - delegate this
  - plan delegation
  - assign tasks
  - who handles
  - which specialist
  - route this task
  - assign work
description: ">"
---


# Delegation Planner Skill

> **Purpose**: Route every task to the correct agent layer before execution begins.
> Wrong routing wastes context budget and produces inferior output.

## When to Use

Use this skill when:

- An incoming task needs to be assigned to an agent
- A complex task needs to be decomposed across multiple agents
- A senior agent is being asked to do sub-agent work (or vice versa)
- Before dispatching any specialist agent

## Agent Layer Routing Rules

### Layer 1: Senior PM Agent

**Route here when:**

- User speaks in outcome language ("finished", "ready", "ship it")
- A Definition of Done needs to be established
- Proof artifacts need to be defined
- Milestone planning is needed
- Stakeholder communication is required

**Do NOT route here:**

- Implementation tasks (code, tests, deployments)
- Technical debugging
- Research tasks

---

### Layer 2: Senior Orchestrator Agent

**Route here when:**

- Task spans multiple specialist domains
- Phase dependencies need to be enforced
- Evidence needs to be collected from multiple agents
- A completion claim needs to be blocked or approved
- Context budget management across agents is needed

**Do NOT route here:**

- Single-domain implementation
- Research-only tasks
- Simple file edits

---

### Layer 3: Senior Specialist Agents

**Route to Senior Engineering Agent when:**

- Backend API, FastAPI routes, SQLAlchemy models, LangGraph agents
- Database migrations, schema changes
- Authentication, JWT, middleware
- Performance optimisation, infrastructure

**Route to Senior UI/UX Agent when:**

- React components, Next.js pages, Tailwind CSS
- Design system compliance, animations
- Responsive layout, accessibility
- Visual quality review

**Route to Senior QA / Production Agent when:**

- Test coverage (vitest, pytest, Playwright)
- CI/CD pipeline setup or fixes
- Deployment verification
- Monitoring and alerting setup

**Route to Senior Research Agent when:**

- Technology comparison or evaluation
- External documentation gathering
- Competitor analysis
- Best practice investigation

**Route to Senior LMS Content Agent when:**

- Educational content creation
- Learning module structure
- Content pipeline setup

**Route to Senior Growth / Marketing Agent when:**

- SEO optimisation
- GEO (Generative Engine Optimisation)
- Analytics setup
- Conversion optimisation

---

### Layer 4: Sub-Agents

**Route here when:**

- Single file edit or creation
- Targeted grep/glob search
- Proof artifact collection (curl, test run)
- Data transformation on a specific file
- Any task completable in < 5 minutes with a single tool

**Do NOT route here:**

- Multi-file architectural changes
- Tasks requiring decision-making
- Tasks requiring context from multiple parts of the codebase

## Procedure

### Step 1: Classify the task

Ask: What kind of work is this?

- Outcome language / stakeholder → Layer 1
- Multi-agent coordination → Layer 2
- Domain-specific implementation → Layer 3 (which specialist?)
- Isolated, bounded task → Layer 4

### Step 2: Check for decomposition

If the task touches multiple domains (e.g., "add a feature with API + UI + tests"):

1. Decompose into sub-tasks per domain
2. Identify dependencies (API must exist before UI can call it)
3. Plan execution order

### Step 3: Generate delegation plan

Produce the delegation plan table.

## Output Format

```
DELEGATION PLAN
═══════════════════════════════════════════════════
Task: [original task description]
Decomposed: [yes / no]

ROUTING
─────────────────
| # | Sub-task | Agent | Layer | Evidence Required | Gate |
|---|---------|-------|-------|------------------|------|
| 1 | [task]  | [agent] | [1-4] | [what to return] | [gate condition] |
| 2 | [task]  | [agent] | [1-4] | [what to return] | [gate condition — depends on #1] |
...

DEPENDENCY ORDER
─────────────────
[If tasks have dependencies: show order and gate conditions]
Step 1: Task #[N] must complete before Task #[N+1] begins
Gate:   [exact condition that unlocks next step]

CONTEXT BUDGET
─────────────────
Orchestrator:      [estimated tokens for coordination]
Each specialist:   [estimated tokens per agent]
Total estimate:    [rough total]
═══════════════════════════════════════════════════
```

## Validation Gates

Before finalising delegation plan:

- [ ] No Layer 1 agent assigned implementation work
- [ ] No Layer 4 sub-agent assigned architectural decisions
- [ ] Dependencies are correctly ordered (no circular deps)
- [ ] Evidence required is specific (not "show your work")
- [ ] Gate conditions are binary (pass/fail, not subjective)

## Failure Modes

| Failure                                          | Recovery                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| Task is too vague to route                       | Ask: "What does success look like?" — activate outcome-translator |
| Task spans all 4 layers                          | Decompose into phases, route each phase separately                |
| Wrong agent assigned (discovered mid-task)       | Re-route immediately, don't continue in wrong layer               |
| Sub-agent scope creeps to architectural decision | Pause sub-agent, escalate to orchestrator                         |

## Eval Examples

### Good Example

**Task:** "Add a protected dashboard page with user stats"

**Delegation Plan:**
| # | Sub-task | Agent | Layer | Evidence Required |
|---|---------|-------|-------|-----------------|
| 1 | API endpoint: GET /api/user/stats | Senior Engineering | 3A | curl output + type-check |
| 2 | Dashboard page component | Senior UI/UX | 3B | Screenshot + 0 TS errors |
| 3 | Auth middleware check | Senior Engineering | 3A | curl 401 without JWT |
| 4 | E2E test for dashboard | Senior QA | 3C | Playwright test output |

**Dependency order:** 1 → 3 → 2 → 4

### Bad Example (rejected)

**Task:** "Add dashboard"
**Response:** "Sure, I'll add the dashboard." — No routing, no decomposition, no evidence plan.