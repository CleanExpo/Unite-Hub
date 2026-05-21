# /done — Completion Verification Gate

> Runs the full completion checklist before marking any task as done.
> Prevents false "it's done" reports by enforcing objective verification.

## Usage

```
/done
/done "feature name"
```

## Execution Protocol

### Step 1 — Type-Check

```bash
pnpm turbo run type-check
```

**Pass condition**: Zero TypeScript errors.
**Fail condition**: Any error → task is NOT done. Fix first.

### Step 2 — Lint

```bash
pnpm turbo run lint
```

**Pass condition**: Zero lint errors (warnings acceptable).
**Fail condition**: Any error → task is NOT done. Fix first.

**Auto-fixable lint**: Run `pnpm turbo run lint -- --fix` first, then re-check.

### Step 3 — Tests

```bash
pnpm turbo run test
```

**Pass condition**: All tests pass.
**Fail condition**: Any failing test → task is NOT done. Fix first.

If no tests exist for the changed code: flag as MISSING COVERAGE (does not block, but must be noted).

### Step 4 — Uncommitted Changes Check

```bash
git status
git diff --stat
```

**Pass condition**: All changes are staged and committed (or PR created).
**Fail condition**: Uncommitted changes exist → commit or document why.

### Step 5 — AGENT-PROTOCOL Score

Check the current task against `.claude/rules/cli-control-plane.md` validation gates:

- [ ] Referenced files confirmed to exist (no invented paths)
- [ ] Import paths verified against actual file locations
- [ ] No `console.log` in production code
- [ ] No `any` types introduced
- [ ] No TODOs left without tracking

### Step 6 — Report

```
DONE CHECK: {task name or current context}
Date: {DD/MM/YYYY HH:MM} AEST

type-check:   PASS ✓ / FAIL ✗ ({n} errors)
lint:         PASS ✓ / FAIL ✗ ({n} errors)
tests:        PASS ✓ / FAIL ✗ ({n} failures) | NO TESTS (noted)
committed:    YES ✓ / NO ✗
protocol:     PASS ✓ / FAIL ✗ ({what failed})

VERDICT: DONE ✓ / NOT DONE ✗

{If NOT DONE}: Remaining blockers:
1. {specific blocker with file:line}
```

## Hard Rules

- Never self-report "done" without running this command
- A FAIL on type-check, lint, or tests means the task is NOT done — no exceptions
- Missing tests are noted but do not block (unless the task was specifically to write tests)
- Uncommitted code is not shipped — always commit before reporting done

## Integration with Minion

The `/minion` protocol runs verification automatically (Steps 1–3) before git operations. `/done` is for interactive sessions where minion was not used.

## Locale

All output: Australian English. All dates: DD/MM/YYYY. All times: AEST/AEDT.
