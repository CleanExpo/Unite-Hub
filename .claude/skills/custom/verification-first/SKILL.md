---
name: verification-first
category: verification
version: 2.0.0
description: Hard verification gate — no task is complete without proof it works (Next.js/Supabase stack)
author: Unite Group (ported from NodeJS-Starter-V1)
priority: 1
auto_load: true
triggers:
  - any_code_change
  - post-implementation
  - pre-commit
---

# Verification-First Development

## The Core Rule

**A task is NOT complete until verification passes. "Almost working" = broken.**

No self-attestation. No assumed success. Evidence required.

---

## The 5 Rules

### Rule 1 — Prove It Works
Every code change MUST be verified before moving on:
- Run the actual build command
- Run actual tests (not mocked)
- Check actual output
- Confirm expected behaviour

### Rule 2 — Honest Failure Reporting
When something fails:
- State clearly: "This failed"
- Include the actual error message verbatim
- Do not soften or interpret the failure
- Do not say "almost working" — it either works or it doesn't

### Rule 3 — No Assumptions
- Never assume a fix worked
- Never assume tests pass because logic looks right
- Never assume the build succeeds
- VERIFY EVERYTHING

### Rule 4 — Root Cause First
Before attempting any fix:
1. Read the actual error message
2. Understand what the error means
3. Identify the root cause
4. THEN propose a fix (one at a time)

### Rule 5 — Independent Verification
**The agent that wrote the code MUST NOT verify its own work.**
Route to `[[verification]]` agent. No exceptions.

---

## Verification Commands (Unite-Group Stack)

```bash
# TypeScript type check
pnpm run type-check

# Lint
pnpm run lint

# Unit tests (Vitest)
pnpm vitest run

# Full pipeline
pnpm run type-check && pnpm run lint && pnpm vitest run

# Health check (comprehensive)
.\scripts\health-check.ps1
```

> Note: `turbo` CLI is NOT available globally — use `pnpm run` scripts directly.

---

## Verification Tiers

### Tier A — Quick (30 seconds)
- TypeScript type-check passes
- Lint passes (zero errors, zero warnings)
- No console errors

**Trigger**: After every code generation

### Tier B — Standard (2–3 minutes)
- All Tier A checks
- Vitest unit tests pass
- Build succeeds (`pnpm build`)
- Manual smoke test of changed functionality

**Trigger**: Before git commit

### Tier C — Full (5–10 minutes)
- All Tier B checks
- Integration tests pass
- E2E tests for affected flows (Playwright)
- Visual regression check (Scientific Luxury tokens)
- Performance benchmark

**Trigger**: Feature additions, migrations

### Tier D — Production (15–20 minutes)
- All Tier C checks
- Full test suite
- Lighthouse audit >90 all scores
- Security scan (OWASP Top 10)
- Accessibility audit (WCAG 2.1 AA)
- RLS policy verification (founder_id isolation)

**Trigger**: Before any production deploy

---

## Verification Output Format

All verification reports MUST use this format:

```
## Verification: [Task Description]

### Status: [PASS | FAIL | BLOCKED]
### Tier: [A | B | C | D]

### Results:
- type-check:  [PASS/FAIL] — [error if failed]
- lint:        [PASS/FAIL] — [error if failed]
- unit-tests:  [PASS/FAIL] — [X/Y passed]
- build:       [PASS/FAIL] — [error if failed]
- manual:      [PASS/FAIL] — [what was checked]

### Evidence:
[Actual command output, test results, or screenshot path]

### Next Steps:
[If PASS → what's next]
[If FAIL → root cause + proposed fix]
```

---

## Hook Integration

Verification is automatically enforced by:
- `post-code.hook.md` — Runs Tier A after code generation
- `pre-commit.hook.md` — Runs Tier B before git commit
- `pre-deploy.hook.md` — Runs Tier D before deployment

---

## Australian Context Verification

For any user-facing output, also verify:
- [ ] en-AU spelling (colour, organisation, behaviour, licence)
- [ ] Dates in DD/MM/YYYY format
- [ ] Currency in AUD format ($1,234.56)
- [ ] No American defaults

---

## One Fix at a Time

When verification fails:
1. Fix the FIRST failing check only
2. Re-run verification
3. Confirm it passes before moving to the next fix
4. Never stack multiple untested changes

Stacking fixes creates the same problem as never testing: you don't know which change broke what.
