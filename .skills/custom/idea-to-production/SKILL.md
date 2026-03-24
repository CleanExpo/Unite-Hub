---
name: idea-to-production
version: 1.0.0
description: Plain-English pipeline from idea to production — routes user requests to the right phase and agent
triggers:
  - idea
  - build me
  - i want to
  - let's create
  - let's build
  - can we add
  - from scratch
  - new feature
  - full pipeline
  - end to end
---

# Idea to Production — Plain-English Pipeline

> You have an idea. Here is exactly what happens next, who does the work, and when you need to step in.

---

## Got an Idea? Here's What Happens Next.

When you say "build me X" or "I have an idea for Y", Claude doesn't just start writing code.
It runs your request through an 8-phase pipeline that takes you from raw idea to a reviewed,
tested, production-ready pull request — with a human review gate at the end before anything ships.

You don't need to know the phases. Claude routes everything automatically.
This skill documents how that routing works so you always know where you are.

---

## The 8-Phase Pipeline (Plain English)

| Phase | Name              | What Happens                                                                                                                  | Who Does It                                 |
| ----- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1     | **Intake**        | Claude reads your request, classifies what kind of task it is, and decides how much process to apply                          | Orchestrator                                |
| 2     | **Discovery**     | A Product Strategist agent writes a one-page spec (PRD) that defines the problem, who it is for, and what is in scope         | product-strategist                          |
| 3     | **Decomposition** | A Technical Architect maps out what files, APIs, and database tables need to change. A Senior Engineer breaks that into tasks | technical-architect, senior-engineer        |
| 4     | **Execution**     | Specialist agents build the feature in parallel, writing tests first (TDD), then code                                         | Frontend, backend, database specialists     |
| 5     | **Aggregation**   | The Orchestrator collects all the work, checks nothing conflicts, and runs the full test suite                                | Orchestrator                                |
| 6     | **Verification**  | Three independent checks run in parallel: code quality, acceptance criteria, and design review                                | verification, qa-validator, design-reviewer |
| 7     | **Iteration**     | If anything fails verification, the responsible agent fixes it. Maximum 2 fix cycles                                          | Specialists                                 |
| 8     | **Production**    | A PR is created with a full evidence trail. The pipeline stops here — **you** review and merge                                | delivery-manager then you                   |

---

## Routing by What You Say

Claude listens to your natural language and routes to the right starting phase.

| What You Say                                 | What Claude Hears                 | Starting Phase                  |
| -------------------------------------------- | --------------------------------- | ------------------------------- |
| "I have an idea for..."                      | New product or feature concept    | Phase 1 — full pipeline         |
| "Build me X"                                 | Feature request, scope unknown    | Phase 1 — full pipeline         |
| "Let's create a..."                          | New thing from scratch            | Phase 1 — full pipeline         |
| "Can we add X to the existing Y?"            | Feature addition, codebase exists | Phase 1 — full pipeline         |
| "Make the button say Submit instead of Send" | Copy change, trivial edit         | Phase 4 — skip discovery        |
| "Fix the login page"                         | Bug fix                           | Phase 4 — root-cause first      |
| "Make it work"                               | Something is broken               | Phase 4 — diagnose then fix     |
| "Is it ready?"                               | Needs verification                | Phase 6 — verification only     |
| "Ship it"                                    | Ready to release                  | Phase 6 then 8 — verify then PR |
| "What does this do?"                         | Explanation, no build needed      | No pipeline — answer only       |

---

## Scope Classifier — 3 Questions

Before running the pipeline, Claude answers these three questions to decide how much process to apply.

**Question 1: Is this a single, isolated change?**

- Yes, one file or one value — **Trivial** — skip to Phase 4
- No, touches multiple areas — continue to Question 2

**Question 2: Does this require changes to the database, API contracts, or authentication?**

- No — **Standard** — full 8-phase pipeline
- Yes — **Complex** — full 8-phase pipeline with extended discovery

**Question 3: Could this break existing users if it goes wrong?**

- No — proceed at current scope
- Yes — HIGH risk flag raised — Claude pauses and confirms with you before executing

### Scope Decision Table

| Scope        | Examples                                                 | Phases Used          |
| ------------ | -------------------------------------------------------- | -------------------- |
| **Trivial**  | Change a label, tweak a config value, fix a typo         | 4 then 6 then 8      |
| **Standard** | New page, new API endpoint, new feature flag             | 1 through 8          |
| **Complex**  | New module, database migration, auth changes, new system | 1 through 8 extended |

---

## Quick-Start Commands by Scenario

**"I have a new idea"**

Describe your idea in plain English in chat. Claude classifies scope automatically.
For complex features, it will ask up to 3 scoping questions before starting.
To explicitly trigger the discovery phase: `/new-feature "your idea description"`

**"Fix something that is broken"**

Describe the symptom, not the cause. Claude runs systematic-debugging first, then implements the fix.

```bash
pnpm turbo run test          # Check what is failing before Claude starts
```

**"Check if it is ready to ship"**

```bash
pnpm turbo run type-check    # Types
pnpm turbo run lint          # Code style
pnpm turbo run test          # All tests
```

Claude also runs a design review if any frontend files were changed.

**"Create a PR"**

Claude creates the PR at Phase 8 with full evidence. You review and merge. Claude never merges automatically.

**"Something went wrong in the pipeline"**

Claude will escalate to you with a clear ESCALATION report — what failed, why it cannot auto-fix, and what decision you need to make.

---

## Escalation Signals — When Claude Stops and Asks You

Claude runs autonomously through the pipeline but stops for your input when:

| Signal                                                             | What Claude Does                                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Requirements are ambiguous after one clarifying question           | Outputs `BLUEPRINT_ESCALATION` — describes what is unclear and what it needs from you |
| A fix attempt fails twice (Phase 7 cap reached)                    | Stops, reports what failed, asks you to decide the next step                          |
| The change touches authentication, database schema, or auth config | Pauses and confirms with you before executing — these are HIGH risk                   |
| Rubric score below 50 after two iteration cycles                   | Escalates — the output is not good enough and needs your direction                    |
| Multiple agents return failures simultaneously                     | Escalates — too many moving parts to auto-resolve safely                              |

When you see an escalation, read the report. It will always tell you:

- What the pipeline completed successfully
- What blocked it
- The single most important decision you need to make to unblock it

---

## What You Never Need to Do Manually

The pipeline handles all of this automatically:

- Writing tests before writing code (TDD — Iron Law)
- Checking type safety (`pnpm turbo run type-check`)
- Running the linter (`pnpm turbo run lint`)
- Running the test suite (`pnpm turbo run test`)
- Checking that design tokens are used correctly (Scientific Luxury system)
- Writing the PR description with evidence
- Checking that nothing from another part of the codebase was accidentally broken

---

## Phase Detail Reference

### Phase 1: Intake

Owner: orchestrator

1. Classify intent via CLI Control Plane (BUILD, FIX, REFACTOR, etc.)
2. Assess scope: trivial / standard / complex
3. Assess risk: LOW / MEDIUM / HIGH
4. Decide phase range — trivial tasks skip to Phase 4

### Phase 2: Discovery

Owner: product-strategist

1. If context is insufficient, run spec-builder interview mode (up to 3 questions)
2. Draft PRD covering problem, users, scope, non-goals, and success metrics
3. Score PRD against rubric via qa-validator (threshold: 70 to proceed, 50-69 iterate, below 50 escalate)

### Phase 3: Decomposition

Owner: technical-architect then senior-engineer

1. Technical-architect produces architecture delta (what files and contracts change)
2. Score architecture against rubric via qa-validator
3. Senior-engineer decomposes into implementation tasks
4. Orchestrator assigns tasks to specialist agents

### Phase 4: Execution

Owner: orchestrator (coordination), specialists (implementation)

1. Specialists write a failing test first — always
2. Specialists write minimal code to make the test pass
3. Each specialist reports completion with evidence

### Phase 5: Aggregation

Owner: orchestrator

1. Collect all specialist outputs
2. Verify interface contracts match across layers
3. Resolve any integration conflicts
4. Run `pnpm turbo run type-check lint test`

### Phase 6: Verification

Three parallel tracks — all must clear thresholds or Phase 7 runs:

| Track      | Agent           | Checks                           |
| ---------- | --------------- | -------------------------------- |
| Code       | verification    | type-check, lint, test           |
| Acceptance | qa-validator    | rubric score 0-100               |
| Design     | design-reviewer | UX audit (frontend changes only) |

### Phase 7: Iteration

Owner: orchestrator

- Maximum 2 fix cycles
- Each failure routed to the responsible agent
- After fixes, Phase 6 re-runs
- If cap exceeded — escalate to user

### Phase 8: Production

Owner: delivery-manager

1. Score release against release rubric
2. Create PR with full evidence trail
3. Produce hand-off documentation
4. **STOP** — human review gate — you merge, never Claude

---

## Where Things Live

| What                      | Where                                   |
| ------------------------- | --------------------------------------- |
| Full harness protocol     | `.claude/AGENT_HARNESS.md`              |
| All agent definitions     | `.claude/agents/*/agent.md`             |
| Idea to PRD workflow      | `.claude/workflows/idea-to-prd.md`      |
| PRD to Spec workflow      | `.claude/workflows/prd-to-spec.md`      |
| Spec to Build workflow    | `.claude/workflows/spec-to-build.md`    |
| Build to Release workflow | `.claude/workflows/build-to-release.md` |
| Quality rubrics           | `.claude/rubrics/`                      |
| Orchestrator agent        | `.claude/agents/orchestrator/agent.md`  |
| All 65 skills             | `.skills/AGENTS.md`                     |

---

## One-Line Summary

**You describe what you want. Claude figures out the scope, writes the spec, builds it with tests, verifies it three ways, and hands you a PR. You review and merge. Nothing ships without you.**