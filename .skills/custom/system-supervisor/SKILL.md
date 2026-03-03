---
name: system-supervisor
description: >-
  Architecture drift detection, silent failure scanning, hallucination
  prevention, and feature completeness auditing. Activates at phase
  boundaries, before merges, or on explicit audit requests.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# System Supervisor - Architectural Integrity Scanner

Detects specification drift, silent failures, hallucinated assertions, and incomplete features. Provides a post-execution audit layer that complements the Execution Guardian's pre-execution gates.

## Description

Scans the codebase for architectural integrity issues that accumulate over time. Compares implementation against specifications, detects dead code and silent failures, validates technical assertions, and measures feature completeness across all layers. Distinct from the Execution Guardian (pre-execution safety) and the Council of Logic (code quality).

## When to Apply

### Positive Triggers

- **Before merge to main**: Final integrity check before code reaches production branch
- **After Genesis Orchestrator execution phase**: Post-section or post-phase audit
- **Explicit audit keywords**: "audit", "drift", "dead code", "completeness", "integrity", "silent failure"
- **Feature declared complete**: Verify all layers are implemented before closing
- **Periodic review**: At least once per milestone boundary
- **SCALE mode**: Full audit capability available

### Negative Triggers (Delegate to Other Systems)

- Active coding/implementation → **genesis-orchestrator** (phase-locked execution)
- Pre-execution risk assessment → **execution-guardian** (validation gates)
- Code quality/complexity → **council-of-logic** (mathematical principles)
- Runtime error handling → **error-taxonomy** (structured error codes)
- EXPLORATION mode → No auditing needed
- STRATEGY mode → Planning phase, no code to audit

---

## Architecture Drift Detection

### How It Works

1. **Parse specifications**: Scan `docs/phases/`, `docs/features/`, and spec files for declared features, endpoints, models, and components
2. **Scan implementation**: Walk the codebase for matching implementations
3. **Compare and report**: Identify MISSING, ORPHANED, and DIVERGED items

### Drift Categories

| Category | Meaning | Severity |
|----------|---------|----------|
| **MISSING** | Spec declares it, codebase does not implement it | HIGH |
| **ORPHANED** | Codebase implements it, no spec references it | MEDIUM |
| **DIVERGED** | Both exist but implementation differs from spec | HIGH |
| **ALIGNED** | Spec and implementation match | OK |

### Drift Report Format

```markdown
## Architecture Drift Report — {date}

| Item | Spec Location | Code Location | Status | Severity |
|------|--------------|---------------|--------|----------|
| User authentication | docs/features/auth/spec.md | apps/backend/src/auth/ | ALIGNED | OK |
| Contractor API | docs/phases/phase-2-spec.md | apps/backend/src/api/contractors.py | DIVERGED | HIGH |
| Analytics dashboard | docs/features/analytics/spec.md | — | MISSING | HIGH |
| Legacy helper | — | apps/backend/src/utils/old_helper.py | ORPHANED | MEDIUM |

### Summary
- ALIGNED: {n}
- MISSING: {n} (HIGH priority)
- ORPHANED: {n} (review for removal)
- DIVERGED: {n} (reconcile spec or code)
```

### Drift Scanning Rules

See `references/drift-rules.md` for:
- Spec-to-code location mapping conventions
- Severity assignment rules
- Ignore patterns for generated/config files

---

## Silent Failure Detection

Silent failures are code constructs that fail without alerting. They accumulate technical debt invisibly.

### What to Scan For

| Silent Failure Type | Detection Pattern | Severity |
|--------------------|-------------------|----------|
| **Dead imports** | `import X` where X is never used in the file | LOW |
| **Empty catch blocks** | `except:` or `catch {}` with no logging or re-raise | HIGH |
| **Unused API endpoints** | Route defined but no frontend calls reference it | MEDIUM |
| **Orphaned DB columns** | Column in model but never read/written by any query | MEDIUM |
| **Unchecked return values** | Async function called without `await` or return value discarded | HIGH |
| **Unreachable code paths** | Code after unconditional `return`, `raise`, or `break` | LOW |
| **Stale environment variables** | `.env.example` references variable not used in code | LOW |
| **Unhandled promise rejections** | `.then()` without `.catch()` or missing error boundary | HIGH |
| **Type assertion bypasses** | `as any`, `# type: ignore` without justification comment | MEDIUM |
| **Commented-out code blocks** | More than 5 consecutive commented lines of code | LOW |

### Silent Failure Report Format

```markdown
## Silent Failure Scan — {date}

| # | Type | Location | Line | Severity | Recommendation |
|---|------|----------|------|----------|---------------|
| 1 | Empty catch | apps/backend/src/api/main.py | 47 | HIGH | Add logging or re-raise |
| 2 | Dead import | apps/web/lib/api/client.ts | 3 | LOW | Remove unused import |
| 3 | Unchecked await | apps/backend/src/agents/base.py | 92 | HIGH | Add await or handle return |

### Summary
- HIGH: {n} (fix immediately)
- MEDIUM: {n} (fix before merge)
- LOW: {n} (fix when convenient)
```

---

## Hallucination Prevention

### The Problem

AI coding agents can make assertions about code behaviour that are not verified. These assertions become "technical hallucinations" — statements treated as fact that may be incorrect.

### Assertion Classification

When the agent makes a technical assertion (e.g., "this function handles errors correctly", "this endpoint returns 404"), classify it:

| Classification | Meaning | Action |
|---------------|---------|--------|
| **CONFIRMED** | Verified by test, code inspection, or documentation | No action needed |
| **INFERRED** | Logically follows from confirmed facts but not directly verified | Acceptable with note |
| **ASSUMED** | Plausible but not verified | Trigger verification pass |
| **FABRICATED** | No evidence supports the assertion | Block and correct immediately |

### Verification Protocol

When an assertion is classified as ASSUMED:

1. **Locate the source**: Find the code or spec that should confirm the assertion
2. **Run targeted test**: Execute relevant test if available
3. **Reclassify**: Move to CONFIRMED or FABRICATED based on evidence
4. **Report**: Document the verification result

### Hallucination Report Format

```markdown
## Assertion Verification — {date}

| # | Assertion | Classification | Evidence | Action |
|---|-----------|---------------|----------|--------|
| 1 | "Auth middleware validates JWT expiry" | CONFIRMED | test_auth.py:test_expired_token passes | None |
| 2 | "Rate limiter returns 429 after 100 req/min" | ASSUMED | No rate limiter test exists | Write test |
| 3 | "Contractor API returns paginated results" | FABRICATED | API returns full list, no pagination | Correct claim |
```

### Scope Boundary

This hallucination check applies to **technical code assertions** only. For content-level claims (marketing copy, user-facing text), defer to content review processes.

---

## Feature Completeness Matrix

### How It Works

For each declared feature, verify implementation across all required layers:

| Layer | What to Check | Path Pattern |
|-------|--------------|-------------|
| **UI** | React component exists and renders | `apps/web/app/**/*.tsx`, `apps/web/components/**/*.tsx` |
| **API Route** | Backend endpoint defined | `apps/backend/src/api/**/*.py` |
| **Data Model** | SQLAlchemy model or Pydantic schema | `apps/backend/src/db/**/*.py`, `apps/backend/src/models/**/*.py` |
| **Validation** | Input validation (Zod frontend, Pydantic backend) | Inline in route handlers and components |
| **Tests** | At least one test per layer | `apps/backend/tests/**/*.py`, `apps/web/**/*.test.{ts,tsx}` |
| **Docs** | Feature documented | `docs/features/**/*.md`, `docs/reference/**/*.md` |
| **Error Handling** | Errors follow error-taxonomy patterns | Inline in route handlers |

### Completeness Report Format

```markdown
## Feature Completeness — {date}

| Feature | UI | API | Model | Validation | Tests | Docs | Errors | Score |
|---------|----|----|-------|-----------|-------|------|--------|-------|
| Auth (login/logout) | Y | Y | Y | Y | Y | Y | Y | 100% |
| Contractor profiles | Y | Y | Y | P | N | N | P | 57% |
| Document management | Y | Y | Y | Y | P | Y | Y | 86% |
| Analytics dashboard | N | P | N | N | N | N | N | 14% |

**Legend**: Y = Complete, P = Partial, N = Missing

### Thresholds
- 100%: Release-ready
- 80-99%: Acceptable for merge (document gaps)
- 50-79%: Requires completion plan before merge
- <50%: Not ready — must complete core layers first
```

See `references/completeness-matrix.md` for detailed layer-by-layer checklists and path patterns.

---

## Strategic Intelligence (Lightweight)

Portable, project-scoped signals only. No investor readiness, competitive analysis, or business metrics — those are non-portable and outside this skill's scope.

### Technical Debt Trajectory

Track across audit runs:

```markdown
## Technical Debt Signals

| Metric | Previous | Current | Trend |
|--------|----------|---------|-------|
| Silent failures (HIGH) | 12 | 8 | Improving |
| Architecture drift items | 5 | 7 | Worsening |
| Feature completeness avg | 72% | 78% | Improving |
| Type assertion bypasses | 3 | 1 | Improving |
| Empty catch blocks | 6 | 4 | Improving |
```

### Dependency Health

```markdown
## Dependency Health

| Package | Current | Latest | Status |
|---------|---------|--------|--------|
| next | 15.x.x | 15.x.x | Current |
| fastapi | 0.x.x | 0.x.x | Current |
| sqlalchemy | 2.x.x | 2.x.x | Current |
| {package} | {ver} | {ver} | Outdated (n versions behind) |
```

### Feature Completion Percentage

```
Overall completion: {n}% ({completed}/{total} features at 80%+ threshold)
```

---

## Audit Workflow

### Full Audit (SCALE mode or explicit request)

Run all four scans in sequence:

1. **Architecture Drift Detection** → Drift Report
2. **Silent Failure Detection** → Silent Failure Report
3. **Hallucination Prevention** → Assertion Verification
4. **Feature Completeness Matrix** → Completeness Report
5. **Strategic Intelligence** → Debt Trajectory + Dependency Health

### Quick Audit (BUILD mode phase boundary)

Run abbreviated scans:

1. **Architecture Drift** → Changed files only (not full codebase)
2. **Silent Failures** → Changed files only
3. **Feature Completeness** → Affected features only

### On-Demand Scan

Run individual scans based on user request:

- "check for drift" → Architecture Drift only
- "dead code scan" → Silent Failure Detection only
- "is this feature complete?" → Feature Completeness for specified feature
- "verify my assertions" → Hallucination Prevention on recent claims

---

## Integration Points

### Execution Guardian

- Guardian handles **pre-execution** safety; Supervisor handles **post-execution** integrity
- Guardian's risk score can trigger a Supervisor audit (HIGH risk operations → auto-audit after completion)
- No overlap: Guardian gates operations, Supervisor audits results

### Genesis Orchestrator

- Supervisor scans activate at **phase boundaries** (between SECTION_A → SECTION_B, etc.)
- Quick audit after each section; full audit after phase completion
- Supervisor does **not** interrupt mid-section execution

### Council of Logic

- Supervisor's silent failure detection complements Turing's complexity analysis
- Shannon compression applies to all Supervisor report formats
- Von Neumann architecture review feeds into drift detection baseline

### Execution Modes

- **EXPLORATION**: Supervisor off
- **BUILD**: Quick audit at phase boundaries only
- **SCALE**: Full audit capability
- **STRATEGY**: Supervisor off (planning phase)

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|------------------|
| Running full audit during active coding | Interrupts flow, wastes tokens | Audit at phase boundaries or on request |
| Flagging all ORPHANED code as errors | Some utilities are intentionally decoupled | Check if referenced in tests or docs before flagging |
| Treating INFERRED assertions as FABRICATED | Over-verification wastes effort | INFERRED is acceptable when logic chain is clear |
| Auditing generated/config files for drift | False positives from auto-generated content | Apply ignore patterns from drift-rules.md |
| Running Strategic Intelligence every scan | Token-heavy, low signal frequency | Run at milestone boundaries only |

## Checklist

- [ ] Drift scan covers all spec files in `docs/phases/` and `docs/features/`
- [ ] Silent failure scan checks all detection patterns
- [ ] Assertions classified (CONFIRMED/INFERRED/ASSUMED/FABRICATED)
- [ ] ASSUMED assertions trigger verification pass
- [ ] Feature completeness checks all 7 layers
- [ ] Completeness score calculated correctly
- [ ] Quick audit used at phase boundaries (not full audit)
- [ ] Full audit reserved for SCALE mode, merge prep, or explicit request
- [ ] Reports use compressed table format (Shannon principle)
- [ ] Strategic intelligence limited to portable, technical metrics

## Response Format

```
[AGENT_ACTIVATED]: System Supervisor
[MODE]: {BUILD | SCALE}
[SCAN_TYPE]: {full | quick | on-demand}
[STATUS]: {scanning | complete}

{audit reports}

[NEXT_ACTION]: {proceed with merge | fix {n} issues | schedule follow-up}
```

## Australian Localisation (en-AU)

- **Date Format**: DD/MM/YYYY
- **Currency**: AUD ($)
- **Spelling**: colour, behaviour, optimisation, analyse, centre, authorisation
- **Tone**: Direct, factual — report findings without hedging
