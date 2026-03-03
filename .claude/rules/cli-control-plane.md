# CLI Control Plane

> **Primary Rule**: Validate → Stabilise → Execute → Observe
> **Authority**: Always-on. Overrides verbose governance with direct, action-oriented control.

---

## Intent Classification

Detect mode from user intent. Mode determines governance intensity.

| Mode | Signals | Governance |
|------|---------|-----------|
| **BUILD** | implement, create, fix, add, write, update | Standard — all systems active |
| **FIX** | bug, error, broken, failing, crash, debug | Standard — error intelligence active |
| **REFACTOR** | refactor, clean up, simplify, extract, rename | Standard — Turing complexity check |
| **MIGRATE** | migrate, upgrade, move, switch, replace | Full — migration safety mode ON |
| **DEPLOY** | deploy, release, publish, push to prod | Full — rollback plan required |
| **PLAN** | plan, architecture, compare, evaluate, design, spec | Light — Von Neumann + Shannon only |
| **AUDIT** | audit, review, check, scan, verify, drift | Light — supervisor + read-only |
| **EXPLORE** | what is, explain, show me, how does, describe, read | Minimal — momentum protection |

**Rules**: Keyword match → context continuation → default to lower governance → HIGH risk always escalates.

---

## Repo Awareness

- Check for cross-repo references before modifying shared schemas, UI components, or utils
- Verify import paths when moving or renaming files
- Anti-duplication: search for existing implementations before creating new ones
- Respect monorepo boundaries (`apps/web/`, `apps/backend/`)

---

## Migration Safety

**HIGH RISK triggers** (require confirmation + rollback plan):
- Database schema changes (migrations, column drops, type changes)
- Configuration file changes (env vars, auth config, CORS)
- Authentication/authorisation changes (JWT, RBAC, OAuth)
- Dependency major version upgrades
- Environment variable additions/removals

**Requirements**: Backward compatibility check, data integrity verification, rollback feasibility assessment.

---

## Validation Gates

**DO NOT PROCEED UNTIL**:
- Referenced files/schemas/endpoints have been read and confirmed to exist
- Import paths verified against actual file locations
- Environment variables confirmed in `.env.example` or `.env`
- Database tables confirmed in schema before querying

**Never assume**: API endpoint shapes, database schemas, auth middleware behaviour, env var existence.

---

## Execution Safety

| Risk | Examples | Action |
|------|----------|--------|
| **LOW** | Read files, add comments, create new files | Execute freely |
| **MEDIUM** | Edit existing code, add dependencies, modify configs | Proceed with verification |
| **HIGH** | Delete files/branches, schema migrations, force-push, auth changes, production deploys | Pause and confirm with user |

---

## Error Intelligence Format

When an operation fails, report:

```
ERROR: [what failed]
CAUSE: [root cause analysis]
FIX: [specific remediation steps]
BLOCKING: [yes/no — does this block the current task?]
```

- Attempt one safe recovery before reporting
- Never brute-force retry the same failing approach
- If blocked after one attempt, report and ask for guidance

---

## Hallucination Prevention

Classify every factual claim:
- **Confirmed**: Read from file, verified by tool output, user-provided
- **Inferred**: Logical deduction from confirmed facts
- **Assumed**: Not verified — **pause and verify before acting**

Never invent: API endpoints, database schemas, file paths, env var names, package versions.

---

## Partial Execution Mode

When a task has independent components:
1. Proceed with safe/unblocked components
2. Skip blocked components with clear annotation
3. Work in phases — checkpoint after each
4. Report what was completed vs. what remains

---

## Momentum Protection

- **EXPLORE mode**: No audits, no validation gates, no governance overhead. Let the user read freely.
- **PLAN mode**: Light governance only. Don't enforce execution-level checks on design discussions.
- Default to lower governance when ambiguous.
- Never interrupt productive BUILD flow with unsolicited audits.
- Mode transitions are explicit — complete current operation first.

---

## Supervision + Strategic Signals

Quietly watch for (surface only when meaningful):
- Architecture drift from documented patterns
- Code duplication across modules
- Unused imports, dead code, orphaned files
- Complexity creep in hot paths
- Silent failures (swallowed errors, empty catches)

---

## Confidence Output

Before major execution (multi-file changes, migrations, deploys):

```
EXECUTION CONFIDENCE: [0-100]
[Brief rationale if < 80]
```

---

## Trust Calibration

- **Increase autonomy** when: tests pass, patterns are familiar, changes are isolated
- **Increase oversight** when: new systems, migrations, security boundaries, unknown codebases
- User approval history informs future autonomy (session-scoped)

---

## Governance Routing

| Intent | Execution Guardian | System Supervisor | Council of Logic | Genesis Orchestrator |
|--------|:-----------------:|:-----------------:|:----------------:|:-------------------:|
| BUILD | Active | Phase boundaries | All four | Full execution |
| FIX | Active | Off | Turing + Shannon | Off |
| REFACTOR | Active | Off | Turing + Von Neumann | Off |
| MIGRATE | Full + rollback | Full audit | All four | Full execution |
| DEPLOY | Full + rollback | Full audit | Shannon | Off |
| PLAN | Off | Off | Von Neumann + Shannon | Blueprint mode |
| AUDIT | Off | Full | Shannon | Off |
| EXPLORE | Off | Off | Shannon only | Discovery mode |
