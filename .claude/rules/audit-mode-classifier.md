# Audit Mode Classifier — Structured Response Templates

> **Purpose**: Define expected output structure per execution mode.
> **Extends**: `cli-control-plane.md` (which owns the 8-mode detection logic — NOT duplicated here).
> **Authority**: Active for all modes. Guides response structure, not detection.

---

## Mode → Response Structure

### BUILD Mode

**Required sections**:
1. **Scope** — What will be created/modified (files, routes, components)
2. **Implementation** — The code changes (via Edit/Write tools)
3. **Verification** — Type-check, lint, test results

**Example skeleton**:
```
Creating {component/route/feature} in {path}.

[code changes via tools]

Verification: type-check ✓ | lint ✓ | tests ✓
```

### FIX Mode

**Required sections**:
1. **Diagnosis** — Root cause identification with evidence
2. **Fix** — The code change (minimal, targeted)
3. **Verification** — Proof the fix resolves the issue

**Example skeleton**:
```
Root cause: {description with file:line reference}

[fix via Edit tool]

Verified: {test output / reproduction steps now pass}
```

### REFACTOR Mode

**Required sections**:
1. **Analysis** — What's being improved and why
2. **Changes** — The refactored code (preserve behaviour)
3. **Verification** — Tests still pass, no regressions

**Example skeleton**:
```
Refactoring {target} — {reason: duplication / complexity / readability}.

[code changes via tools]

All existing tests pass. No behaviour change.
```

### MIGRATE Mode

**Required sections**:
1. **Migration plan** — Source → destination, what changes
2. **Rollback plan** — How to reverse if something breaks
3. **Execution** — The migration steps
4. **Verification** — Data integrity, functionality preserved

**Example skeleton**:
```
Migration: {from} → {to}
Rollback: {specific rollback steps}

[migration steps]

Verification: {data check} ✓ | {functionality check} ✓
```

### DEPLOY Mode

**Required sections**:
1. **Pre-deploy checklist** — Tests, env vars, dependencies
2. **Deploy action** — The deployment command/process
3. **Post-deploy verification** — Health check, smoke test

**Example skeleton**:
```
Pre-deploy: tests ✓ | env ✓ | deps ✓ | rollback plan ✓

[deploy action]

Post-deploy: health ✓ | smoke test ✓ | monitoring ✓
```

### PLAN Mode

**Required sections**:
1. **Context** — Current state, constraints, goals
2. **Options** — Enumerated approaches with trade-offs
3. **Recommendation** — Preferred approach with rationale
4. **Decision record** — For appending to `architectural-decisions.md` if approved

**Example skeleton**:
```
## Context
{current state and constraints}

## Options
1. {Option A} — Pro: {x}, Con: {y}
2. {Option B} — Pro: {x}, Con: {y}

## Recommendation
Option {N} because {rationale}.

## Decision Record (if approved)
[{date}] DECISION: {summary} | REASON: {rationale} | ALTERNATIVES REJECTED: {others}
```

### AUDIT Mode

**Required sections**:
1. **Scope** — What was audited (files, systems, patterns)
2. **Findings** — Categorised by severity (CRITICAL / HIGH / MEDIUM / LOW)
3. **Recommendations** — Prioritised action items

**Example skeleton**:
```
## Audit: {scope}

### Findings

| Severity | Finding | Location | Recommendation |
|----------|---------|----------|----------------|
| CRITICAL | {issue} | {file:line} | {fix} |
| HIGH | {issue} | {file:line} | {fix} |

### Priority Actions
1. {most urgent}
2. {next}
```

### EXPLORE Mode

**Required sections**:
1. **Answer** — Direct answer to the question
2. **Context** — Supporting details (only if non-obvious)

**Example skeleton**:
```
{Direct answer}

{Supporting context if the answer alone isn't sufficient}
```

---

## Mode Transition Rules

1. **Complete current mode** before switching — don't leave a BUILD half-done to start an AUDIT
2. **Explicit transitions** — announce mode change: "Switching to PLAN mode for architecture discussion"
3. **Inherit constraints** — MIGRATE always carries DEPLOY's rollback requirement
4. **Escalate up, not down** — FIX can escalate to MIGRATE, but EXPLORE never escalates to DEPLOY

---

## Governance Intensity Reference

Cross-reference with `cli-control-plane.md` Governance Routing table:

| Mode | Execution Guardian | System Supervisor | Council of Logic |
|------|:-----------------:|:-----------------:|:----------------:|
| BUILD | Active | Phase boundaries | All four |
| FIX | Active | Off | Turing + Shannon |
| REFACTOR | Active | Off | Turing + Von Neumann |
| MIGRATE | Full + rollback | Full audit | All four |
| DEPLOY | Full + rollback | Full audit | Shannon |
| PLAN | Off | Off | Von Neumann + Shannon |
| AUDIT | Off | Full | Shannon |
| EXPLORE | Off | Off | Shannon only |

---

## Cross-References

- **Mode detection logic**: `.claude/rules/cli-control-plane.md`
- **Core governance**: `.claude/rules/core.md`
- **Output quality**: `.claude/rules/slop-prevention.md`
- **Agent routing**: `.claude/agents/orchestrator/agent.md`
