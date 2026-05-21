---
name: dispatching-parallel-agents
description: Use when facing 2+ independent failures or tasks that can be worked on concurrently without shared state. Groups independent failures by component (frontend/backend/database), launches concurrent agents, integrates results, then runs full test suite. Triggers on multiple independent test failures, multi-component CI failures, or parallel feature work.
license: MIT
metadata:
  author: NodeJS-Starter-V1 — adapted from obra/superpowers (MIT)
  version: '1.0.0'
  locale: en-AU
---

# Dispatching Parallel Agents

Adapted from [obra/superpowers](https://github.com/obra/superpowers) — MIT. Adapted for the NodeJS-Starter-V1 monorepo (frontend/backend/database component separation).

## Overview

When you have multiple unrelated failures across different components or files, investigating them sequentially wastes time. Each independent investigation can happen in parallel.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently. Integrate results after all complete.

## When to Use

**Use when:**
- 3+ test files failing with different root causes
- Multiple independent subsystems broken (e.g., React component + FastAPI endpoint + DB model)
- Each problem can be understood without context from the others
- No shared state between investigations (agents won't edit the same files)

**Don't use when:**
- Failures are related (fixing one might fix others — investigate together first)
- Exploratory debugging (you don't know what's broken yet)
- Agents would edit the same files (shared state conflict)
- All failures clearly stem from a single root cause

---

## The Pattern

### Step 1: Identify Independent Domains

Group failures by component. In NodeJS-Starter-V1:

| Domain | Scope | Typical Failures |
|--------|-------|-----------------|
| **Frontend** | `apps/web/` | React component tests, vitest failures, TypeScript errors |
| **Backend** | `apps/backend/` | FastAPI route tests, Pydantic validation, pytest failures |
| **Database** | `scripts/`, `alembic/` | Migration errors, schema mismatches, pgvector issues |
| **E2E** | `apps/web/e2e/` | Playwright test failures, user flow regressions |
| **CI/CD** | `.github/workflows/` | Pipeline failures, environment issues |

Each domain is independent — fixing a React component doesn't affect pytest failures.

### Step 2: Create Focused Agent Prompts

Each agent gets:
- **Specific scope**: One test file, one component, or one subsystem
- **Clear goal**: Make these specific tests pass
- **Constraints**: Do NOT change code outside this scope
- **Expected output**: Summary of root cause and changes made

**Good agent prompt template:**

```
Fix the N failing tests in <test-file-path>:

1. "<test name>" — <error description>
2. "<test name>" — <error description>

Your task:
1. Read the test file and understand what each test verifies
2. Identify root cause — use systematic-debugging skill (Phase 1 first)
3. Write a failing regression test for each issue (TDD skill)
4. Fix the root cause, not the symptom
5. Verify all N tests pass: <test command>
6. Ensure no other tests regressed

Do NOT change code outside <scope-path>.
Return: Summary of root cause and what you changed.
```

### Step 3: Dispatch in Parallel

In Claude Code, use the Task tool to dispatch concurrent agents:

```
Task("Fix apps/web/__tests__/components/auth-form.test.tsx failures — 3 failing tests [TDD + systematic-debugging]")
Task("Fix apps/backend/tests/api/test_contractors.py failures — 2 failing tests [TDD + systematic-debugging]")
Task("Fix apps/backend/tests/unit/test_models.py failures — 1 failing test [TDD + systematic-debugging]")
# All three run concurrently
```

### Step 4: Review and Integrate

When all agents return:
1. **Read each summary** — understand what changed and why
2. **Check for conflicts** — did any agents edit the same files?
3. **Run full test suite** — verify all fixes work together

```bash
# Integration verification
pnpm turbo run test
pnpm turbo run type-check
pnpm turbo run lint
```

4. **Spot check** — agents can make systematic errors; review critical changes manually

---

## Real-World Example

**Scenario:** CI fails after a backend refactor. 5 test failures across 3 files.

**Failures:**
- `apps/web/__tests__/components/contractor-card.test.tsx`: 2 failures (missing prop types after API change)
- `apps/backend/tests/api/test_contractors.py`: 2 failures (422 on new required field)
- `apps/backend/tests/unit/test_validators.py`: 1 failure (ABN validator edge case)

**Decision:** Independent domains — React component props separate from FastAPI validation separate from validator logic.

**Dispatch:**
```
Agent 1 → Fix contractor-card.test.tsx (frontend scope only)
Agent 2 → Fix test_contractors.py (backend API scope only)
Agent 3 → Fix test_validators.py (unit validator scope only)
```

**Results:**
- Agent 1: Updated TypeScript interface to include new `abn` field from API
- Agent 2: Added default value for new `availability_status` field in test data
- Agent 3: Fixed edge case: ABN with leading zeros was being trimmed

**Integration:** All fixes independent. No conflicts. Full suite green.

**Time saved:** 3 investigations in parallel vs. 3 sequential investigations.

---

## Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| "Fix all the tests" (too broad) | "Fix the 3 failing tests in auth-form.test.tsx" |
| No context (agent is lost) | Paste the exact error messages and test names |
| No constraints (agent refactors everything) | "Do NOT change code outside apps/web/components/" |
| Vague output ("Fix it") | "Return: root cause summary and list of files changed" |
| Dispatch related failures to separate agents | Investigate related failures together first |

---

## Verification After Integration

After all agents complete and you've integrated:

```bash
# Must all pass before closing the task
pnpm turbo run test       # All tests green
pnpm turbo run type-check # 0 TypeScript errors
pnpm turbo run lint       # Lint clean
```

Use the `verification-before-completion` skill before claiming "Done" — run the commands, read the output.

---

## Key Benefits

1. **Parallelisation** — Multiple investigations happen simultaneously
2. **Focus** — Each agent has narrow scope, less context noise
3. **Independence** — Agents don't interfere with each other
4. **Speed** — N problems solved in time of 1

---

## Integration with Existing Infrastructure

- **`/minion` command** — Minion currently dispatches serially. This skill provides the formal pattern for concurrent dispatch when multiple independent failures are detected.
- **`systematic-debugging` skill** — Each agent should apply systematic-debugging within its scope (4-phase protocol, 3-attempt circuit breaker).
- **`tdd` skill** — Each agent writes failing tests first, then fixes.
- **`verification-before-completion` skill** — Final integration check before claiming all done.