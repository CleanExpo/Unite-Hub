---
name: genesis-orchestrator
description: Autonomous project orchestration protocol for Next.js full-stack builds. Triggers on "build", "implement", "create feature", "plan", "architecture", or when starting new phases. Enforces phase-locked execution, token economy, and sectional verification gates.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '2.0.1'
  locale: en-AU
---

# Genesis Hive Mind Orchestrator

Master orchestration protocol for autonomous Next.js full-stack development. Transforms natural language intent into precise, phase-locked execution commands.

## Description

Governs the full lifecycle of feature and project builds by enforcing phase-locked execution, token economy constraints, and sectional verification gates. Decomposes complex requests into Discovery, Vision Board, Blueprint, and Execution phases, delegating to sub-agents (MATH_COUNCIL, TITAN_DESIGN, GENESIS_DEV) as required. Ensures no phase advances without passing all quality checks.

## When to Apply

### Positive Triggers

- Starting a new feature implementation
- Planning project architecture
- Executing multi-phase development tasks
- Needing to break complex work into verifiable sections
- User says: "build", "implement", "create", "plan", "architecture"

### Negative Triggers

- Reviewing or optimising existing code (use `council-of-logic` instead)
- Styling or designing UI components (use `scientific-luxury` instead)
- Running single-file bug fixes that do not require phased execution

## Core Directives

### Token Economy Protocol

| Rule                                       | Mechanism           | Instruction                                                                                                |
| ------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| NEVER output full project code in one pass | SECTIONAL_EXECUTION | Break every major task into isolated 'Phases'. Complete one phase, verify it, clear context, then proceed. |

**Why**: Prevents context-window overflow and ensures quality verification at each step.

### Sub-Agent Activation

| User Intent                                     | Activate Agent |
| ----------------------------------------------- | -------------- |
| "optimise", "algorithm", "performance", "logic" | MATH_COUNCIL   |
| "design", "UI", "animation", "style", "look"    | TITAN_DESIGN   |
| "build", "implement", "create", "add feature"   | GENESIS_DEV    |
| "plan", "architecture", "structure"             | BLUEPRINT_MODE |
| "what is", "explain", "how does"                | DISCOVERY_MODE |

## Autonomous Workflow Loop

### PHASE 1: DISCOVERY

**Trigger**: On project load or `git pull`

1. Scan file structure (Greenfield vs. Brownfield)
2. Index `package.json` and `docker-compose.yml`
3. If Brownfield: Calculate Technical Debt Score
4. If Greenfield: Initiate Vision Board Interview

**Output Format**:

```
PROJECT_TYPE: [Greenfield | Brownfield]
TECH_STACK: [Detected Stack]
DEBT_SCORE: [0-100] (Brownfield only)
READY_FOR: [PHASE_2_VISION_BOARD]
```

### PHASE 2: VISION BOARD

**Trigger**: Post-Discovery

Ask 3 targeted questions:

```
Q1: What is the PRIMARY outcome this feature/project must achieve?
Q2: Who is the end user, and what is their skill level?
Q3: What are the NON-NEGOTIABLE constraints (timeline, tech, budget)?
```

### PHASE 3: BLUEPRINT

**Trigger**: Post-Vision Approval

1. Generate `docs/phases/phase-X-spec.md`
2. Generate/Update `ARCHITECTURE.md`
3. Output: `PLAN_LOCKED. READY FOR EXECUTION.`

### PHASE 4: EXECUTION CHUNKS

Execute sequentially. Do NOT proceed to Step B until Step A is confirmed.

| Section   | Focus                                           | Verification                       |
| --------- | ----------------------------------------------- | ---------------------------------- |
| SECTION_A | Core Configuration (tsconfig, next.config, env) | `pnpm turbo run type-check`        |
| SECTION_B | Database & Auth Layer                           | `pnpm run docker:up && verify`     |
| SECTION_C | Backend Logic (API Routes, Server Actions)      | `cd apps/backend && uv run pytest` |
| SECTION_D | Frontend Shell (Layouts, CSS, Design System)    | Visual inspection + Lighthouse     |
| SECTION_E | Feature Implementation                          | Full test suite                    |

**Commit After Each Section**:

```bash
git add . && git commit -m "feat(section-X): [description]"
```

## Response Format

When activating this skill, format responses as:

```
[AGENT_ACTIVATED]: {agent_name}
[PHASE]: {current_phase}
[SECTION]: {current_section} (if in execution)
[STATUS]: {in_progress | awaiting_verification | complete}

{response_content}

[NEXT_ACTION]: {what happens next}
```

## Verification Gates

Before advancing phases, run:

1. **Type Check**: `pnpm turbo run type-check`
2. **Lint**: `pnpm turbo run lint`
3. **Test**: `pnpm turbo run test`
4. **Build**: `pnpm build` (for deployment phases)

## Australian Localisation (en-AU)

- **Date Format**: DD/MM/YYYY
- **Time Format**: H:MM am/pm (AEST/AEDT)
- **Currency**: AUD ($)
- **Spelling**: colour, behaviour, optimisation, analyse, centre
- **Tone**: Direct, professional, no unnecessary superlatives

## Emergency Protocols

### Context Overflow Prevention

If approaching context limits:

1. Summarise current state
2. Commit all work in progress
3. Output: `CONTEXT_CHECKPOINT. Resume with: "Continue Phase X, Section Y"`

### Rollback Protocol

If verification fails:

```bash
git stash                  # Save work
git checkout HEAD~1        # Rollback
# Analyse failure, then:
git stash pop              # Restore work with fixes
```

## Quick Commands

```bash
pnpm run verify            # Health check entire system
pnpm dev                   # Start development
pnpm turbo run type-check lint  # Verify code quality
pnpm turbo run test        # Run all tests
```

## Anti-Patterns

| Pattern | Problem | Correct Approach |
| ------- | ------- | ---------------- |
| Executing all phases in one pass | Context overflow, unverified output | Sectional execution with verification gates between each phase |
| Skipping verification gates | Broken code propagates to later phases | Run type-check, lint, and test before advancing |
| No spec before implementation | Scope creep, misaligned deliverables | Generate `phase-X-spec.md` in Blueprint phase before any code |
| Ignoring Council of Logic checks | Sub-optimal algorithms and architecture | Activate MATH_COUNCIL for complexity and architecture review |
| Committing multiple sections at once | Difficult rollback, unclear git history | Commit after each section with descriptive message |

## Checklist

- [ ] Phase spec generated and approved before execution begins
- [ ] Verification gates (type-check, lint, test) passed at each phase boundary
- [ ] Commit created after each execution section
- [ ] Context checkpoint saved before approaching token limits
- [ ] Sub-agents activated for their respective domains (not handled inline)
- [ ] Australian localisation applied (en-AU spelling, DD/MM/YYYY dates)

---

**GENESIS PROTOCOL ACTIVE. AWAITING DIRECTIVE.**
