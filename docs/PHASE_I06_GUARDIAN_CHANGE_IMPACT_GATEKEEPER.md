# Guardian I06: Change Impact Gatekeeper

**Phase**: I06 (Pre-Deployment Change Impact & Gatekeeping Layer)
**Status**: ✅ Implementation Complete
**Date**: 2025-12-11

---

## Executive Summary

Guardian I06 **Change Impact Gatekeeper** is a pre-deployment validation layer that:

1. **Captures** Guardian config changes (rules, playbooks, thresholds)
2. **Analyzes** impact by running targeted I01–I05 simulations against those changes
3. **Produces** structured pass/fail/warn gate decisions for CI/CD systems
4. **Never modifies** core Guardian runtime behavior (read-only layer)

**Key Principle**: Gatekeeper is advisory. It provides pass/fail recommendations to external systems (CI/CD, admins) but does not enforce or block deployments itself. Final decisions are made by CI/CD pipelines or human operators.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Guardian Config Change (CI/CD, API, Manual)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
       ┌─────────────────────┐
       │ Change Diff         │ ← Capture config changes
       │ Collector           │   (rules, playbooks, thresholds)
       └────────┬────────────┘
                │
                ▼
       ┌─────────────────────┐
       │ Change Impact       │ ← Map changes to test artifacts
       │ Planner             │   (regression packs, chaos profiles,
       └────────┬────────────┘    QA schedules)
                │
                ▼
       ┌─────────────────────┐
       │ Gate Evaluation     │ ← Execute I01–I05 simulations
       │ Engine              │   Check results against thresholds
       └────────┬────────────┘
                │
                ▼
       ┌─────────────────────┐
       │ Gatekeeper          │ ← Orchestrate flow
       │ Orchestrator        │   Create/update decision records
       └────────┬────────────┘
                │
                ▼
      ┌──────────────────────────┐
      │ Gate Decision: ALLOW     │ ← Advisory to CI/CD
      │ (ALLOW|BLOCK|WARN)       │   (not enforcement)
      │ + Flags + Summary        │
      └──────────────────────────┘
```

---

## Core Components

### 1. Change Diff Collector (`changeDiffCollector.ts`)

**Purpose**: Extract high-level diffs from Guardian configuration snapshots.

**Key Functions**:
- `collectRuleDiff(before, after)` → Rules added/removed/modified
- `collectPlaybookDiff(before, after)` → Playbooks added/removed/modified
- `collectThresholdDiff(before, after)` → Thresholds added/removed/modified
- `mergeDiffs(...diffs)` → Combine multiple categories
- `generateImpactHints(diff)` → Classify change type (e.g., "added_rules", "modified_playbooks")

**Design**:
- Operates on read-only snapshots (no writes to Guardian configuration)
- Extracts only identifiers and key metadata (no PII)
- Deterministic classification logic

**Example**:
```typescript
const ruleDiff = collectRuleDiff(
  [{ key: 'auth_fail', severity: 'high', enabled: true }],
  [
    { key: 'auth_fail', severity: 'critical', enabled: true }, // modified
    { key: 'new_rule', severity: 'critical', enabled: true }   // added
  ]
);
// → { rules: { added: ['new_rule'], modified: ['auth_fail'], removed: [] } }
```

---

### 2. Change Impact Planner (`changeImpactPlanner.ts`)

**Purpose**: Map Guardian config changes to appropriate test artifacts.

**Key Functions**:
- `planImpactForChangeSet(tenantId, changeSetId)` → GuardianImpactPlan
  - Examines change diff
  - Selects regression packs (e.g., "guardian_core")
  - Selects chaos profiles (e.g., "chaos_critical" for new high-severity rules)
  - Selects QA schedules (e.g., "qa_playbook_validation" for playbook changes)
  - Returns rationale markdown explaining selections
- `validateImpactPlan(tenantId, plan)` → {valid, errors[]}

**Selection Logic** (Deterministic):
| Change Type | Regression Packs | Chaos Profiles | QA Schedules | Rationale |
|---|---|---|---|---|
| Rule additions | guardian_core | chaos_critical | - | Stress-test new rules |
| Rule modifications | guardian_core | chaos_medium | - | Validate threshold accuracy |
| Playbook changes | guardian_core | - | qa_playbook_validation | Test automated remediation |
| Threshold changes | guardian_core | chaos_medium | - | Validate alert/incident escalation |
| Mixed changes | guardian_core | chaos_critical | qa_playbook_validation | Comprehensive testing |

**Design**:
- Extensible: Easy to add new mappings for future use cases
- Conservative: Always includes baseline "guardian_core" pack
- Produces human-readable rationale for transparency

---

### 3. Gate Evaluation Engine (`gateEvaluationEngine.ts`)

**Purpose**: Execute impact plans and translate simulation results into gate decisions.

**Key Functions**:
- `evaluateImpactPlan(tenantId, plan, gateConfig?)` → GuardianGateEvaluationResponse
  - Runs regression packs via I03 orchestrator
  - Runs QA schedules via I05 executor
  - Inspects regression and drift results
  - Applies configurable thresholds
  - Returns {decision, reason, flags, summary}
- `applyDecisionLogic(drift, regressionFailed, gateConfig)` → {decision, flags}
- `formatGateDecision(result)` → markdown summary

**Decision Logic**:
```
IF regression_failed AND failureOnRegressionFail
  → BLOCK ("Regression pack execution failed")

IF drift_severity == CRITICAL AND failureOnCriticalDrift
  → BLOCK ("Critical drift detected")

IF drift_severity == WARNING
  → WARN ("Warning-level drift detected")

IF playbook_action_count > baseline * warnOnPlaybookExplosionFactor
  → WARN ("Playbook action explosion")

ELSE
  → ALLOW
```

**Default Thresholds**:
```typescript
{
  failureOnCriticalDrift: true,
  failureOnRegressionFail: true,
  warnOnPlaybookExplosionFactor: 1.5,
  maxAllowedAlertsRelativeChange: 0.2,        // 20%
  maxAllowedIncidentsRelativeChange: 0.25,    // 25%
  maxAllowedRiskRelativeChange: 0.3,          // 30%
}
```

---

### 4. Gatekeeper Orchestrator (`gatekeeperOrchestrator.ts`)

**Purpose**: Main entry point; orchestrates complete gatekeeper flow.

**Key Functions**:
- `runGatekeeper(request, gateConfig?)` → GuardianGatekeeperResponse
  1. Insert guardian_change_sets row
  2. Insert guardian_gate_decisions row (status='pending')
  3. Call planImpactForChangeSet
  4. Call evaluateImpactPlan
  5. Update gate_decisions with results (status='evaluated')
  6. Return response
- `listGateDecisions(tenantId, filters)` → GateDecision[]
- `getGateDecision(tenantId, gateDecisionId)` → GateDecision

**Request Type**:
```typescript
interface GuardianGatekeeperRequest {
  tenantId: string;
  source: 'manual' | 'ci' | 'api' | 'script';
  sourceRef?: string;                    // commit hash, PR id, pipeline run id
  changeType: 'rules' | 'playbooks' | 'thresholds' | 'mixed';
  diff: GuardianChangeDiff;
  actorId?: string;
}
```

**Response Type**:
```typescript
interface GuardianGatekeeperResponse {
  changeSetId: string;
  gateDecisionId: string;
  decision: 'allow' | 'block' | 'warn';
  reason: string;
  flags: string[];                       // [allow/block/warn reasons]
  summary: Record<string, unknown>;      // metrics, selected packs, evaluation time
}
```

---

## Database Schema

### guardian_change_sets
Stores captured Guardian config changes.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| tenant_id | UUID | Workspace (RLS enforced) |
| source | TEXT | 'manual'\|'ci'\|'api'\|'script' |
| source_ref | TEXT | commit hash, PR id, etc. |
| change_type | TEXT | 'rules'\|'playbooks'\|'thresholds'\|'mixed' |
| description | TEXT | User-provided context |
| diff | JSONB | {rules, playbooks, thresholds, impactHints} |
| created_at | TIMESTAMPTZ | |
| created_by | TEXT | Actor ID |
| metadata | JSONB | Extension field |

**Indexes**: (tenant_id, created_at DESC), (tenant_id, source)

### guardian_gate_decisions
Stores evaluation results and gate decisions.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| tenant_id | UUID | Workspace (RLS enforced) |
| change_set_id | UUID | Reference to guardian_change_sets |
| created_at | TIMESTAMPTZ | |
| status | TEXT | 'pending'\|'evaluated'\|'failed' |
| decision | TEXT | 'allow'\|'block'\|'warn' or NULL |
| reason | TEXT | Human-readable explanation |
| regression_run_id | UUID | Link to I03 regression (if available) |
| qa_schedule_id | UUID | Link to I05 QA schedule (if available) |
| drift_report_id | UUID | Link to I05 drift report (if available) |
| summary | JSONB | Evaluation metrics, flags, timestamps |
| error_message | TEXT | If status='failed' |
| created_by | TEXT | Actor ID |
| metadata | JSONB | Extension field |

**Indexes**: (tenant_id, created_at DESC), (tenant_id, status), (change_set_id)

**RLS Policy**: Tenants can only access rows where `tenant_id IN (SELECT get_user_workspaces())`

---

## API Routes

### POST /api/guardian/admin/gatekeeper/run
**Trigger gatekeeper evaluation for a change.**

Request:
```json
{
  "source": "ci",
  "sourceRef": "abc1234",
  "changeType": "rules",
  "diff": {
    "rules": {
      "added": ["new_alert_rule"],
      "removed": [],
      "modified": ["auth_fail"]
    }
  },
  "actorId": "ci-service"
}
```

Response (201):
```json
{
  "changeSetId": "uuid",
  "gateDecisionId": "uuid",
  "decision": "warn",
  "reason": "Warning-level drift detected",
  "flags": ["Modified auth_fail rule triggers warning-level alerts"],
  "summary": {
    "selectedPacks": ["guardian_core"],
    "selectedChaosProfiles": ["chaos_medium"],
    "evaluationTime": "2025-12-11T10:00:00Z"
  }
}
```

### GET /api/guardian/admin/gatekeeper/decisions
**List gate decisions with filters.**

Query params:
- `status`: pending|evaluated|failed
- `decision`: allow|block|warn
- `limit`: 50 (default)
- `offset`: 0 (default)

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "change_set_id": "uuid",
      "status": "evaluated",
      "decision": "allow",
      "reason": "No issues detected",
      "created_at": "2025-12-11T10:00:00Z",
      "guardian_change_sets": {...}
    }
  ]
}
```

### GET /api/guardian/admin/gatekeeper/decisions/[id]
**Fetch single decision with full change_set diff and evaluation details.**

Response:
```json
{
  "id": "uuid",
  "change_set_id": "uuid",
  "status": "evaluated",
  "decision": "block",
  "reason": "Critical drift detected",
  "summary": {
    "selectedPacks": ["guardian_core"],
    "impactPlanRationale": "Running core regression pack...",
    "flags": ["Alert volume increased by 35%"]
  },
  "guardian_change_sets": {
    "source": "ci",
    "change_type": "rules",
    "diff": {...}
  }
}
```

---

## UI: Gatekeeper Admin Dashboard

**Path**: `/guardian/admin/gatekeeper`

**Features**:
1. **Gate Decisions Table**: List recent decisions with filtering by status/decision
   - Created timestamp
   - Source (CI, manual, API, script)
   - Change type (rules, playbooks, thresholds)
   - Decision badge (🟢 ALLOW, 🔴 BLOCK, 🟡 WARN)
   - Status (pending, evaluated, failed)
   - View details button

2. **Decision Detail Panel** (modal):
   - Decision + status + reason
   - Change set diff preview (rules added/removed/modified)
   - Evaluation summary (metrics, flags, timestamps)
   - Links to related I01–I05 artifacts (regression runs, drift reports)
   - Impact plan rationale (markdown explanation)

3. **Filters**:
   - Status: All / Pending / Evaluated / Failed
   - Decision: All / Allow / Block / Warn

4. **Disclaimer Banner**:
   > Gatekeeper provides advisory pass/fail/warn decisions for CI/CD systems and admins. It does not enforce or block deployments directly. Final deployment decisions are made by external CI/CD pipelines or administrators.

---

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Guardian Pre-Deployment Check

on:
  pull_request:
    paths:
      - 'guardian/**'

jobs:
  gatekeeper-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Detect Guardian Config Changes
        id: detect_changes
        run: |
          # Compare main..HEAD to detect rule/playbook/threshold changes
          DIFF=$(git diff main..HEAD -- guardian/)
          echo "diff<<EOF" >> $GITHUB_OUTPUT
          echo "$DIFF" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Run Gatekeeper
        id: gatekeeper
        run: |
          curl -X POST https://app.example.com/api/guardian/admin/gatekeeper/run \
            -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "source": "ci",
              "sourceRef": "${{ github.sha }}",
              "changeType": "mixed",
              "diff": '${{ steps.detect_changes.outputs.diff }}'
            }' > decision.json

          DECISION=$(jq -r '.decision' decision.json)
          echo "decision=$DECISION" >> $GITHUB_OUTPUT

      - name: Check Gate Decision
        run: |
          if [ "${{ steps.gatekeeper.outputs.decision }}" = "block" ]; then
            echo "❌ Gatekeeper BLOCKED deployment (critical impact detected)"
            exit 1
          fi
          echo "✅ Gatekeeper decision: ${{ steps.gatekeeper.outputs.decision }}"
```

### Manual CLI Usage
```bash
# Trigger gatekeeper from command line
curl -X POST https://app.example.com/api/guardian/admin/gatekeeper/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "changeType": "rules",
    "diff": {
      "rules": {
        "added": ["new_critical_rule"],
        "removed": [],
        "modified": []
      }
    }
  }'
```

---

## Production Isolation & Safety

### ✅ Non-Destructive Guarantees

1. **Config Changes Captured, Not Applied**
   - Gatekeeper only reads Guardian rules, playbooks, thresholds
   - Never modifies production Guardian configuration
   - No writes to `guardian_rules`, `guardian_playbooks`, `guardian_thresholds`

2. **Simulations Only**
   - Gate evaluation runs I03 regression packs and I05 QA schedules
   - Results are isolated to I-series tables (guardian_regression_runs, guardian_qa_*)
   - Zero impact on production alerting, incidents, notifications

3. **Tenant Isolation**
   - RLS enforces `tenant_id` filtering on all I06 tables
   - Tenants cannot see changes or decisions from other tenants
   - All queries scoped by workspace/tenant

4. **Advisory, Not Enforcement**
   - Gatekeeper produces ALLOW/BLOCK/WARN decisions
   - Does not prevent or enforce deployments
   - CI/CD systems decide what to do with decisions
   - Admins can override if needed

### ✅ Data Privacy

- Change diffs contain only identifiers and counts (e.g., rule keys, playbook names)
- No raw configuration payloads stored
- No PII, credentials, or sensitive values captured
- Summary metrics are aggregates only

---

## Future Extensions (I07–I10)

Gatekeeper can be extended with:

1. **I07: Configuration Version Control**
   - Track historical snapshots of rules, playbooks, thresholds
   - Diff against any version
   - Rollback capability

2. **I08: Advanced Change Classification**
   - Heuristics for "risky" changes (e.g., disabling critical rule)
   - Change risk scoring
   - Automated escalation for high-risk changes

3. **I09: Multi-Stage Deployment Pipeline**
   - Dev → Staging → Prod deployment stages
   - Different gatekeeper strictness per stage
   - Approval workflow integration

4. **I10: Feedback Loop & Learning**
   - Track which gatekeeper decisions matched real-world incidents
   - Tune thresholds based on outcomes
   - Continuous improvement of decision accuracy

---

## Testing

**Unit Tests**: `tests/guardian/i06_change_impact_gatekeeper.test.ts` (30+ tests)

Coverage:
- ✅ Diff collection (added/removed/modified rules, playbooks, thresholds)
- ✅ Impact planning (classification, pack/profile/schedule selection)
- ✅ Gate decision logic (block, warn, allow based on thresholds)
- ✅ Orchestrator flow (change set creation, evaluation, decision storage)

**Run Tests**:
```bash
npm test -- i06_change_impact_gatekeeper
```

---

## Deployment Checklist

- [ ] Apply SQL migration 585 to Supabase
- [ ] Verify guardian_change_sets and guardian_gate_decisions tables created
- [ ] Verify RLS policies enabled
- [ ] Run `npm run build` and `npm run typecheck` successfully
- [ ] Run test suite: `npm test -- i06`
- [ ] Test gatekeeper/run API endpoint with POST request
- [ ] Test gatekeeper/decisions API endpoint with GET request
- [ ] Navigate to `/guardian/admin/gatekeeper` UI and verify loading
- [ ] (Optional) Integrate with CI/CD system for automated evaluation

---

## Summary

**Guardian I06** provides a **pre-deployment safety layer** for Guardian config changes by:

1. **Capturing** changes at high level (rules, playbooks, thresholds)
2. **Planning** targeted simulations based on change type
3. **Evaluating** impact by running I01–I05 tests
4. **Deciding** allow/block/warn based on configurable thresholds
5. **Advising** CI/CD systems and admins without enforcing

All while remaining **non-destructive**, **tenant-isolated**, and **read-only** with respect to production Guardian runtime.

Integration point for CI/CD pipelines, DevOps automation, and change governance workflows.
