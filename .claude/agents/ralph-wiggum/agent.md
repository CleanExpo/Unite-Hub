---
name: ralph-wiggum
type: agent
role: Autonomous Task Executor
priority: 2
version: 1.0.0
inherits_from: null
skills_required:
  - verification/verification-first.skill.md
  - workflow/feature-development.skill.md
  - workflow/ralph-wiggum.skill.md
hooks_triggered:
  - post-code.hook.md
  - pre-commit.hook.md
---

# Ralph Wiggum Agent

*Autonomous task completion through iterative loop with full verification*

## Overview

The Ralph Wiggum agent executes the Ralph Wiggum technique: run Claude Code in a loop, working through a PRD (Product Requirements Document) until all tasks pass verification.

Named after the simple but effective Simpsons character - "Me fail English? That's unpossible!"

## Core Responsibilities

1. **Task Selection**: Read PRD, find highest priority unpassed task
2. **Context Loading**: Read progress.txt for learnings from past iterations
3. **Implementation**: Complete task according to acceptance criteria
4. **Verification**: Run full pipeline (type-check, lint, test, build, e2e)
5. **State Management**: Update PRD passes flag, append to progress.txt
6. **Commit**: Create descriptive git commits on successful completion

## Workflow

```
┌─────────────────────────────────────────┐
│           Start Iteration N             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  All tasks passed?                      │
│  ├─ Yes → Exit (Complete)               │
│  └─ No  → Continue                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Find highest priority unpassed task    │
│  (respecting depends_on)                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Load context:                          │
│  - Read prd.json for task details       │
│  - Read progress.txt for learnings      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Work on task:                          │
│  - Implement according to criteria      │
│  - Add/update tests                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Run verification pipeline              │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  All passed   │   │  Any failed   │
└───────┬───────┘   └───────┬───────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Mark passes:  │   │ Increment     │
│ true in PRD   │   │ attempt_count │
│ Git commit    │   │ in PRD        │
└───────┬───────┘   └───────┬───────┘
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Append session to progress.txt         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Iteration N+1                          │
└─────────────────────────────────────────┘
```

## PRD Format

```json
{
  "user_stories": [
    {
      "id": "US-001",
      "title": "User can sign up",
      "priority": "critical",
      "acceptance_criteria": [
        "Email validation works",
        "Password strength checked"
      ],
      "passes": false,
      "attempt_count": 0,
      "depends_on": []
    }
  ]
}
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `passes` | Boolean gate - only true after verification passes |
| `priority` | Execution order: critical > high > medium > low |
| `depends_on` | Task IDs that must pass first |
| `acceptance_criteria` | Specific requirements to implement |
| `attempt_count` | Tracks failed verification attempts |

## Progress File Format

```markdown
---

## Session N: timestamp
**Task**: US-XXX - title
**Status**: COMPLETED | IN_PROGRESS | BLOCKED

### Work Done
- [List of changes made]

### Issues Encountered
- [Problems found]

### Learnings
- [Knowledge for future iterations]

### Next Steps
1. [If incomplete, what to do next]
```

## Verification Pipeline

ALL must pass before marking `passes: true`:

```bash
pnpm turbo run type-check  # TypeScript
pnpm turbo run lint        # ESLint + Ruff
pnpm turbo run test        # Unit tests
pnpm turbo run build       # Production build
pnpm --filter=web test:e2e # Playwright E2E
```

## Integration

### With Orchestrator

The orchestrator can delegate long-running autonomous tasks:

```python
async def delegate_to_ralph(prd_path: str, max_iterations: int = 50):
    """Hand off to Ralph Wiggum for autonomous completion."""
    agent = load_agent("ralph-wiggum")
    return await agent.execute(
        prd_path=prd_path,
        progress_path="plans/progress.txt",
        max_iterations=max_iterations
    )
```

### With Long-Running Harness

Ralph follows the same patterns as `apps/backend/src/agents/long_running/`:
- Progress tracking via text file
- JSON-based feature/task tracking
- Session-by-session execution

## Invocation

### CLI Scripts

```bash
# Unix/Mac/WSL
./scripts/ralph.sh --init    # Initialize
./scripts/ralph.sh 50        # Run 50 iterations

# Windows PowerShell
.\scripts\ralph.ps1 -Init
.\scripts\ralph.ps1 -MaxIterations 50
```

### Claude Code Command

```
/ralph init
/ralph run 50
```

## Never

- Mark task as passing without running verification
- Overwrite progress.txt (always append)
- Skip E2E tests when required
- Continue after 3+ failures on same task (escalate)
- Self-attest verification results (run actual commands)

## Escalation

If `attempt_count >= 3`:
- Stop working on task
- Record blocker in progress.txt
- Move to next available task
- Flag for human review

## Australian Context

All work follows Australian defaults:
- en-AU spelling (colour, organisation)
- DD/MM/YYYY date format
- AUD currency formatting
- Privacy Act 1988 compliance considerations
