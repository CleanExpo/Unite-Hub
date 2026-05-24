---
name: blueprint-engine
version: 1.0.0
description: Hybrid DAG execution primitive combining deterministic and agentic nodes with hard iteration caps
---

# Blueprint Engine — Hybrid DAG Primitive

> Inspired by Stripe Minions: deterministic scaffolding + bounded agentic intelligence.
> Hard caps are non-advisory — they are enforced by iteration-counter.py.

## Node Types

### Deterministic Nodes (No LLM — Always Idempotent)

Commands executed directly with no iteration cost:

- `git-branch` — `git checkout -b minion/{task-id}`
- `git-commit` — `git add -A && git commit -m "minion: {message}"`
- `git-push` — `git push -u origin HEAD`
- `create-pr` — `gh pr create --title "minion: {task}" --body "{template}" --label "minion-generated"`
- `lint` — `pnpm turbo run lint`
- `type-check` — `pnpm turbo run type-check`
- `test` — `pnpm turbo run test`
- `circular-deps-check` — `pnpm turbo run lint` (includes circular dep detection)
- `system-supervisor-quick-audit` — read `.claude/memory/current-state.md` + grep for violations (deterministic)
- `execution-guardian-check` — evaluate risk level from task keywords (deterministic mapping)

### Agentic Nodes (LLM Reasoning — Hard Caps Apply)

- `implement` — Implement the requested feature. **Cap: 1 pass only**
- `reproduce-bug` — Write a failing test that reproduces the bug. **Cap: 1 pass only**
- `implement-fix` — Fix the reproduced bug. **Cap: 1 pass only**
- `implement-migration` — Execute a database or code migration. **Cap: 1 pass only**
- `implement-refactor` — Refactor per system supervisor audit findings. **Cap: 1 pass only**
- `fix-ci` — Fix CI/test failures. **Cap: 2 rounds maximum**
- `fix-lint` — Fix non-auto-fixable lint errors. **Cap: 1 round maximum**

### Hard Iteration Caps (Non-Advisory)

| Node                            | Cap       |
| ------------------------------- | --------- |
| `implement`                     | 1 pass    |
| `reproduce-bug`                 | 1 pass    |
| `implement-fix`                 | 1 pass    |
| `implement-migration`           | 1 pass    |
| `implement-refactor`            | 1 pass    |
| `fix-ci`                        | 2 rounds  |
| `fix-lint`                      | 1 round   |
| **Total agentic per blueprint** | **3 max** |

When any cap is reached → output `BLUEPRINT_ESCALATION` block, halt, write to `.claude/memory/current-state.md`, stop.

## Auto-Fixes (Deterministic — Zero Iteration Cost)

These are applied automatically before any agentic node. They do NOT count against caps:

| Error Pattern              | Auto-Fix Command               |
| -------------------------- | ------------------------------ |
| `Cannot find module`       | `pnpm install`                 |
| `ModuleNotFoundError`      | `uv sync`                      |
| Auto-fixable ESLint errors | `pnpm turbo run lint -- --fix` |
| Auto-fixable Python lint   | `uv run ruff check src/ --fix` |
| Missing type stubs         | `pnpm add -D @types/{package}` |

## Escalation Format

When a cap is reached or a blocking error occurs, output this exact block and halt:

```
BLUEPRINT_ESCALATION
task_id: {id}
node: {failing-node}
iteration: {n}/{max}
reason: {what failed in one line}
evidence: {last 5 lines of error output}
next_action: Human review required — do not retry automatically
```

Then write to `.claude/memory/current-state.md`:

```
## Minion Escalation — {DD/MM/YYYY HH:MM AEST}
task_id: {id}
status: ESCALATED
node: {failing-node}
reason: {reason}
```

## Execution Rules

1. **One-shot mandate**: Execute the full blueprint DAG without asking clarifying questions.
2. **Context scoping**: Read ONLY files in the pre-hydration manifest. No additional file reads.
3. **Iteration counting**: Every agentic node execution increments the counter in `.claude/data/minion-state.json`.
4. **Human review gate**: NEVER auto-merge PRs. The blueprint always ends at `create-pr`.
5. **en-AU locale**: All PR bodies, commit messages, and output use Australian English.
6. **Deterministic first**: Always attempt auto-fixes before invoking any agentic node.

## Blueprint DAG Notation

```
node-type → node-type → [optional-node] → node-type
```

Brackets `[...]` indicate conditional nodes (only executed if the preceding deterministic check fails).
