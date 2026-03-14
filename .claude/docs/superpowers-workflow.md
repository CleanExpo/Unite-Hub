# Superpowers Workflow Integration — Unite-Group

## Overview

Superpowers (v4.3.1) provides 16 workflow skills. This document maps each to Unite-Group use cases, integrating with the Council of Logic, CLI Control Plane, and Karpathy self-improving skills loop.

## Skill to Use Case Mapping

| Superpowers Skill | Unite-Group Use Case | When to Trigger |
|---|---|---|
| brainstorming | Advisory case strategy, experiment design, new feature scoping | Before any BUILD mode task |
| writing-plans | Multi-step feature implementation | After brainstorming approval |
| subagent-driven-development | Independent parallel tasks (Kanban features, notification wiring) | When plan has 3+ independent tasks |
| executing-plans | Batch execution in separate session | When plan needs isolation |
| test-driven-development | Karpathy eval loop RED phase, component testing | During all implementation |
| systematic-debugging | Production issue triage, API failures | When encountering bugs |
| using-git-worktrees | Feature branches, skill improvement branches | Before starting feature work |
| requesting-code-review | Post-implementation review | After completing a feature |
| receiving-code-review | Processing PR feedback | When review comments arrive |
| verification-before-completion | Pre-commit verification | Before claiming work is done |
| finishing-a-development-branch | Merge/PR/cleanup decision | After all tests pass |
| dispatching-parallel-agents | Multi-domain tasks (Kanban + Slack + Skills) | 3+ unrelated tasks |
| writing-skills | Creating new eval.json files, new skills | When extending the skill ecosystem |
| using-superpowers | Session start — establishes skill discovery | Every new conversation |

## Integration with Council of Logic

| Council Member | Superpowers Touchpoint |
|---|---|
| Turing (algorithms) | TDD skill enforces O(n) thinking in test design |
| Von Neumann (architecture) | Brainstorming skill validates architecture decisions |
| Shannon (information theory) | Verification skill ensures minimal token overhead |
| Bezier (UI/animation) | Frontend-design plugin for UI components |

### How Council Gates Interact with Superpowers

1. **Brainstorming** triggers Von Neumann architecture validation before any design is approved.
2. **TDD** runs Turing complexity checks on test fixtures — O(n^2) test setup is rejected.
3. **Verification** applies Shannon compression — output must not exceed the information content of the change.
4. **Writing-plans** embeds Bezier easing selections for any UI-related plan steps.

## Karpathy Loop Integration

The self-improving skills loop uses the Superpowers TDD pattern:

1. **RED**: Eval runner (`scripts/skill-eval-runner.mjs`) identifies a failing assertion — this IS the failing test.
2. **GREEN**: Auto-improve script requests minimal SKILL.md change to pass the assertion.
3. **REFACTOR**: After pass, request coherence cleanup across the full SKILL.md.
4. **COMMIT**: Git commit on improvement, reset on regression.

### Eval Runner Integration

```bash
# Run evals for a single skill
node scripts/skill-eval-runner.mjs --skill blog-write

# Run evals for all skills with eval.json
node scripts/skill-eval-runner.mjs --all

# Verbose mode for debugging assertion failures
node scripts/skill-eval-runner.mjs --skill blog-write --verbose
```

Results are written to `~/.claude/skills/{name}/eval-results.json` after each run.

## CLI Control Plane Mapping

| CLI Mode | Active Superpowers | Governance Level |
|---|---|---|
| BUILD | brainstorming, writing-plans, subagent-driven-dev, TDD | Standard |
| FIX | systematic-debugging, TDD, verification | Standard |
| REFACTOR | requesting-code-review, TDD | Standard |
| MIGRATE | brainstorming, writing-plans, verification | Full (rollback required) |
| DEPLOY | verification, finishing-branch | Full (rollback required) |
| PLAN | brainstorming only | Light |
| AUDIT | requesting-code-review (read-only) | Light |
| EXPLORE | No superpowers needed | Minimal |

## Workflow Sequences

### New Feature (BUILD mode)

```
brainstorming
  -> writing-plans
    -> using-git-worktrees
      -> subagent-driven-development OR executing-plans
        -> test-driven-development (per task)
          -> verification-before-completion
            -> requesting-code-review
              -> finishing-a-development-branch
```

### Bug Fix (FIX mode)

```
systematic-debugging
  -> test-driven-development (write failing test first)
    -> verification-before-completion
      -> finishing-a-development-branch
```

### Skill Improvement (Karpathy loop)

```
writing-skills
  -> test-driven-development (eval.json is the test suite)
    -> skill-eval-runner.mjs (RED phase)
      -> SKILL.md edit (GREEN phase)
        -> skill-eval-runner.mjs (verify pass)
          -> verification-before-completion
```

### Multi-Domain Sprint

```
dispatching-parallel-agents
  -> Agent A: subagent-driven-development (domain 1)
  -> Agent B: subagent-driven-development (domain 2)
  -> Agent C: subagent-driven-development (domain 3)
  -> Merge gate: verification-before-completion (all agents)
    -> finishing-a-development-branch
```

## Minion Protocol Integration

When `/minion` is active, Superpowers skills are invoked as deterministic nodes within the blueprint DAG:

- **brainstorming** is skipped (intent is pre-defined in the blueprint).
- **writing-plans** is skipped (plan is the blueprint itself).
- **TDD**, **verification**, and **finishing-branch** remain active as quality gates.
- Iteration caps from `minions-protocol.md` override Superpowers retry behaviour.

## Agent Routing Rules

Per CLAUDE.md, delegate to subagents. Superpowers skills inform WHICH agent to dispatch:

| Superpowers Skill | Primary Agent |
|---|---|
| brainstorming | project-manager |
| writing-plans | project-manager |
| subagent-driven-development | senior-fullstack (orchestrates) |
| test-driven-development | qa-tester |
| systematic-debugging | senior-fullstack + qa-tester |
| requesting-code-review | code-auditor |
| verification-before-completion | qa-tester |
| finishing-a-development-branch | devops-engineer |
| writing-skills | project-manager |
