---
name: execution-guardian
description: >-
  Pre-execution governance with dynamic validation gates, risk/confidence
  scoring, and structured error format. Activates before destructive,
  multi-layer, or security-impacting operations to assess safety.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Execution Guardian - Pre-Execution Governance

Dynamic validation gates and risk assessment for operations that could harm system integrity. Evaluates blast radius, reversibility, and confidence before allowing execution to proceed.

## Description

Provides a pre-execution safety layer that auto-detects operation types, generates prerequisite validation gates, scores risk and confidence, and produces structured error output when operations are blocked. Complements the Council of Logic (code quality) with operation safety assessment.

## When to Apply

### Positive Triggers

- **Destructive operations**: Database migrations, file deletions, `git reset`, `DROP TABLE`, `rm -rf`
- **Multi-layer changes**: Modifications spanning frontend + backend + database in a single operation
- **Auth/security changes**: JWT secret rotation, RBAC permission changes, CORS policy updates, OAuth config
- **Payment/billing changes**: Pricing logic, subscription tiers, billing calculations
- **API contract changes**: Breaking changes to endpoint signatures, response shapes, error codes
- **Deployment operations**: Production deployments, infrastructure changes, environment variable updates
- **Data migrations**: Schema changes with existing data, column renames, type changes
- User mentions: "risk", "safe to proceed", "prerequisite", "validation gate", "confidence"

### Negative Triggers (Delegate to Other Systems)

- Code quality review → **council-of-logic**
- Phase sequencing and workflow → **genesis-orchestrator**
- Architecture drift or dead code → **system-supervisor**
- Runtime error handling → **error-taxonomy**
- Exploration or read-only operations → No governance needed (EXPLORATION mode)
- Pure strategy/planning → No gates needed (STRATEGY mode)

---

## Dynamic Validation Gates

### Operation Type Auto-Detection

Scan the proposed operation and classify it into one or more operation types:

| Operation Type | Detection Signals | Default Risk |
|---------------|-------------------|-------------|
| `DATABASE_MIGRATION` | Alembic revision, `ALTER TABLE`, `DROP`, schema changes | HIGH |
| `AUTH_CHANGE` | JWT config, RBAC rules, password hashing, session management | HIGH |
| `API_CONTRACT_CHANGE` | Endpoint signature change, response model change, status code change | MEDIUM |
| `DEPLOYMENT` | Docker push, `vercel deploy`, environment variable changes | HIGH |
| `DESTRUCTIVE_FILE_OP` | `rm -rf`, `git reset --hard`, `git clean -f`, file overwrites | HIGH |
| `SECURITY_CHANGE` | CORS policy, CSP headers, rate limit config, secret rotation | HIGH |
| `MULTI_LAYER_CHANGE` | Changes in 2+ of: `apps/web/`, `apps/backend/`, `scripts/`, `docker-compose.yml` | MEDIUM |
| `DEPENDENCY_CHANGE` | `pnpm add`, `uv add`, major version bumps, removing packages | LOW |
| `CONFIG_CHANGE` | `next.config`, `pyproject.toml`, `tsconfig.json`, `.env` files | LOW |

### Gate Generation

For each detected operation type, generate prerequisite gates. Gates are checks that **must pass** before execution proceeds.

#### DATABASE_MIGRATION Gates

```
GATE: Backup exists or migration is reversible
  CHECK: Verify downgrade() function exists in Alembic revision
  BLOCKING: YES

GATE: No data loss in migration
  CHECK: Scan for DROP COLUMN, DROP TABLE, ALTER TYPE without data preservation
  BLOCKING: YES

GATE: Migration tested locally
  CHECK: uv run alembic upgrade head (on local database)
  BLOCKING: YES
```

#### AUTH_CHANGE Gates

```
GATE: No secret exposure in code
  CHECK: Grep for hardcoded secrets, JWT keys, API keys in diff
  BLOCKING: YES

GATE: Existing sessions handled
  CHECK: Verify session invalidation strategy for JWT secret rotation
  BLOCKING: YES

GATE: Auth tests pass
  CHECK: uv run pytest tests/test_auth.py
  BLOCKING: YES
```

#### API_CONTRACT_CHANGE Gates

```
GATE: Breaking change documented
  CHECK: Verify changelog entry or API version bump
  BLOCKING: NO (warning only)

GATE: Frontend contract updated
  CHECK: Verify corresponding Zod schema change in apps/web/
  BLOCKING: YES

GATE: API tests pass
  CHECK: uv run pytest tests/test_api_*.py
  BLOCKING: YES
```

#### DESTRUCTIVE_FILE_OP Gates

```
GATE: Files are not uncommitted work
  CHECK: git status — verify target files are committed or backed up
  BLOCKING: YES

GATE: No shared resources affected
  CHECK: Verify files are not imported/referenced by other modules
  BLOCKING: YES
```

#### DEPLOYMENT Gates

```
GATE: All tests pass
  CHECK: pnpm turbo run test
  BLOCKING: YES

GATE: Type checks pass
  CHECK: pnpm turbo run type-check
  BLOCKING: YES

GATE: No secrets in build output
  CHECK: Scan build artifacts for .env patterns
  BLOCKING: YES
```

#### SECURITY_CHANGE Gates

```
GATE: Change follows OWASP guidelines
  CHECK: Reference input-sanitisation or csrf-protection skill
  BLOCKING: NO (advisory)

GATE: Security tests pass
  CHECK: uv run pytest tests/ -k "security or auth"
  BLOCKING: YES
```

#### MULTI_LAYER_CHANGE Gates

```
GATE: API contract consistency
  CHECK: Backend response models match frontend Zod schemas
  BLOCKING: YES

GATE: Cross-layer tests pass
  CHECK: pnpm turbo run test (full suite)
  BLOCKING: YES
```

#### DEPENDENCY_CHANGE Gates

```
GATE: No known vulnerabilities
  CHECK: pnpm audit / uv pip audit
  BLOCKING: NO (warning for non-critical)

GATE: Peer dependency compatibility
  CHECK: pnpm install --dry-run succeeds
  BLOCKING: YES
```

#### CONFIG_CHANGE Gates

```
GATE: Config syntax valid
  CHECK: Validate JSON/TOML/YAML syntax
  BLOCKING: YES

GATE: Environment variables documented
  CHECK: New variables added to .env.example
  BLOCKING: NO (warning)
```

---

## Risk Scoring Engine

### Three Dimensions

Each operation is scored across three dimensions:

| Dimension | LOW (1) | MEDIUM (2) | HIGH (3) |
|-----------|---------|-----------|----------|
| **Blast Radius** | Single file/function | Single service/layer | Multiple services or shared infrastructure |
| **Reversibility** | Easily undone (git revert, config rollback) | Requires manual steps (data restore, migration rollback) | Irreversible or extremely costly to reverse |
| **Confidence** | Well-understood pattern, high test coverage | Partially tested, some unknowns | Novel pattern, low coverage, complex domain |

### Composite Risk Calculation

```
composite_score = max(blast_radius, reversibility, confidence)
```

| Composite Score | Risk Level | Required Response |
|----------------|-----------|-------------------|
| 1 | **LOW** | Proceed. Log the operation. |
| 2 | **MEDIUM** | Require user approval before execution. State the risk clearly. |
| 3 | **HIGH** | Mandatory review. Require rollback plan. Block until approval received. |

### Risk-Appropriate Responses

**LOW Risk**:
```
[GUARDIAN: LOW RISK] Proceeding with {operation}.
Gates passed: {list}. No rollback plan required.
```

**MEDIUM Risk**:
```
[GUARDIAN: MEDIUM RISK] {operation} requires approval.
Blast radius: {assessment}
Reversibility: {assessment}
Confidence: {assessment}
Approval required before proceeding.
```

**HIGH Risk**:
```
[GUARDIAN: HIGH RISK] {operation} blocked pending review.
Blast radius: {assessment}
Reversibility: {assessment}
Confidence: {assessment}

Rollback Plan:
1. {step 1}
2. {step 2}
3. {step 3}

Approval required. Respond with "proceed" to continue.
```

---

## Confidence Scoring

Confidence is scored 0-100% based on four factors:

| Factor | Weight | High Confidence | Low Confidence |
|--------|--------|----------------|----------------|
| **Pattern Novelty** | 30% | Well-known pattern used elsewhere in codebase | First-time pattern, no precedent |
| **Test Coverage** | 30% | Relevant tests exist and pass | No tests cover this path |
| **Domain Complexity** | 20% | Simple CRUD, config change | Auth, payment, distributed state |
| **Change Scope** | 20% | Single file, < 50 lines | 5+ files, 200+ lines |

### Confidence Thresholds

| Range | Label | Action |
|-------|-------|--------|
| 80-100% | **High** | Proceed with standard gates |
| 50-79% | **Moderate** | Require explicit approval |
| 0-49% | **Low** | Recommend spike/prototype first, or request additional review |

---

## Structured Error Format

When the Guardian blocks an operation, output uses this format. This is distinct from `error-taxonomy` (which handles runtime API errors). Guardian errors are governance-level blocking decisions.

```
ERROR: {What failed or was blocked}
CAUSE: {Why the gate failed or risk is too high}
RISK:  {LOW | MEDIUM | HIGH} — {one-line risk summary}
FIX:   {Specific action to resolve the block}
BLOCKING: {YES | NO}
```

### Examples

See `references/error-format.md` for complete examples per operation type.

### BLOCKING Classification

| BLOCKING | Meaning | When Used |
|----------|---------|-----------|
| **YES** | Operation cannot proceed until resolved | Data loss risk, security vulnerability, test failure |
| **NO** | Warning only — operation may proceed | Documentation missing, advisory best practice |

---

## Self-Healing Retry

When `BLOCKING: NO` and risk is `LOW`:

1. Apply the suggested `FIX` automatically
2. Re-run the failed gate
3. If pass → proceed
4. If fail again → escalate to `BLOCKING: YES`

Self-healing is **never** applied to:
- `BLOCKING: YES` gates
- MEDIUM or HIGH risk operations
- Security-related gates
- Database migration gates

---

## Integration Points

### Council of Logic

| Council Member | Feeds Into | How |
|---------------|-----------|-----|
| **Turing** (complexity) | Confidence scoring | High complexity = lower confidence |
| **Von Neumann** (architecture) | Blast radius assessment | Multi-service = higher blast radius |
| **Shannon** (compression) | Guardian output format | Structured, compressed error format |

**Boundary**: Council validates *code quality*; Execution Guardian validates *operation safety*.

### Genesis Orchestrator

- Phase boundaries trigger gate re-evaluation
- Guardian respects phase-locked execution (does not skip ahead)
- Section completion gates align with Guardian's deployment gates

### Verification Agent

- LOW risk → standard verification
- MEDIUM risk → verification + regression tests
- HIGH risk → comprehensive verification + manual review recommendation

### Execution Modes

- **EXPLORATION**: Guardian off
- **BUILD**: Standard gates, approval for MEDIUM+
- **SCALE**: Full gates, rollback plans required for MEDIUM+
- **STRATEGY**: Guardian off

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|------------------|
| Gating every file edit | Over-governance, kills momentum | Only gate destructive/multi-layer/security ops |
| Skipping gates because "it's just a small change" | Small changes to auth/security can be catastrophic | Gate based on operation type, not change size |
| Blocking on advisory warnings in BUILD mode | Momentum loss | Advisory = `BLOCKING: NO`, proceed with warning |
| Applying self-healing to security gates | Could mask real vulnerabilities | Self-healing only for LOW risk, non-security gates |
| Generating rollback plans for LOW risk ops | Token waste, over-engineering | Rollback plans for HIGH risk only (MEDIUM in SCALE mode) |

## Checklist

- [ ] Operation type correctly auto-detected
- [ ] Prerequisite gates generated for all detected types
- [ ] Risk scored across blast radius, reversibility, and confidence
- [ ] Composite risk level drives appropriate response
- [ ] Structured error format used for all blocks (`ERROR / CAUSE / RISK / FIX / BLOCKING`)
- [ ] Self-healing only applied to `BLOCKING: NO` + LOW risk
- [ ] Council of Logic feeds into confidence and blast radius
- [ ] Mode-appropriate governance (BUILD vs SCALE intensity)
- [ ] Rollback plan present for HIGH risk operations

## Response Format

```
[AGENT_ACTIVATED]: Execution Guardian
[MODE]: {EXPLORATION | BUILD | SCALE | STRATEGY}
[OPERATION]: {detected operation type(s)}
[RISK]: {LOW | MEDIUM | HIGH}
[STATUS]: {gates_passed | approval_required | blocked}

{gate results, risk assessment, or structured error}

[NEXT_ACTION]: {proceed | await approval | apply fix | escalate}
```

## Australian Localisation (en-AU)

- **Date Format**: DD/MM/YYYY
- **Currency**: AUD ($)
- **Spelling**: colour, behaviour, optimisation, analyse, centre, authorisation
- **Tone**: Direct, professional — state risks clearly without hedging
