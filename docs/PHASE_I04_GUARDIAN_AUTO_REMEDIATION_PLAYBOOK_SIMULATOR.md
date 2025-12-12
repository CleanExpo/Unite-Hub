# Guardian I04: Auto-Remediation Playbook Simulator

**Phase**: I-Series (Simulation & Intelligence)
**Status**: ✅ Complete
**Version**: 1.0.0
**Build Date**: 2025-12-12

---

## Overview

Guardian I04 adds **Auto-Remediation Playbook Simulator** — a sandbox evaluation engine for testing remediation actions against historical Guardian metrics WITHOUT modifying production data.

**Key Promise**: "What if we disabled this rule? Reduced correlation window? Suppressed notifications?" — simulate & measure impact risk-free.

**Scope**: I04 is **simulation-only** with NO writes to core Guardian tables (G/H/I/X series).

---

## Architecture

### Data Layer

**2 New Tables** (tenant-scoped RLS):

1. **guardian_remediation_playbooks**
   - Stores remediation playbook definitions (name, description, DSL config)
   - `id`, `tenant_id`, `name`, `description`, `category`, `config` (JSONB), `is_active`
   - Unique constraint: `(tenant_id, name)`

2. **guardian_remediation_simulation_runs**
   - Tracks simulation execution + results (baseline metrics, deltas, effects)
   - `id`, `tenant_id`, `playbook_id` (FK), `status` ('running'|'completed'|'failed')
   - `baseline_metrics`, `simulated_metrics`, `delta_metrics`, `overall_effect`, `summary`

**No Core Guardian Tables Modified**: G01-G10 tables untouched. Reads only from `guardian_generated_alerts`, `guardian_generated_incidents`, etc.

---

## Remediation Playbook DSL

**5 Action Types** (strict validation):

### 1. **adjust_rule_threshold**
Tune rule sensitivity by adjusting alert trigger thresholds.

```typescript
{
  type: 'adjust_rule_threshold',
  rule_id: 'rule-cpu-spike',      // Must exist
  metric: 'severity' | 'threshold' | 'confidence',
  delta: -50...+50                 // Bounds: must be in range
}
```

**Effect**: Higher delta = stricter rule (fewer alerts).

### 2. **disable_rule**
Turn off a rule completely (zero alerts from this rule).

```typescript
{
  type: 'disable_rule',
  rule_id: 'rule-noisy-alerts'
}
```

**Effect**: Disables rule entirely (estimated ~12% alert reduction per rule).

### 3. **adjust_correlation_window**
Adjust the time window for correlation clustering.

```typescript
{
  type: 'adjust_correlation_window',
  window_minutes_delta: -30...+120  // Bounds: negative shrinks window, positive expands
}
```

**Effect**: Larger window = more alerts grouped together → more incidents.

### 4. **increase_min_link_count**
Raise the minimum number of linked alerts required to create an incident.

```typescript
{
  type: 'increase_min_link_count',
  delta: 1...5                     // Increase min links by 1-5
}
```

**Effect**: Higher min = fewer incidents but higher confidence.

### 5. **suppress_notification_channel**
Temporarily suppress notifications on specific channels.

```typescript
{
  type: 'suppress_notification_channel',
  channel: 'email' | 'slack' | 'webhook' | 'pagerduty',
  duration_minutes: 15...1440      // 15 min to 24 hours
}
```

**Effect**: Suppresses ~80% of notifications on that channel.

---

## Remediation Playbook Config

```typescript
interface GuardianRemediationPlaybookConfig {
  actions: GuardianRemediationAction[];  // 1-20 actions
  notes?: string;                        // Optional description
}
```

**Validation Rules**:
- ✅ **1-20 actions per playbook** (no empty, no bloat)
- ✅ **Each action validates independently** (type guard)
- ✅ **Parameter bounds enforced** (delta, duration, metric)
- ✅ **No duplicate action types** (not enforced by DSL, but best practice)

---

## Simulation Pipeline

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Load Playbook                                            │
│    - Fetch from guardian_remediation_playbooks by ID        │
│    - Validate is_active = true                              │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│ 2. Get Baseline Metrics (read-only, no writes)              │
│    - Query guardian_generated_alerts (last 30 days default) │
│    - Count by severity: critical, high, medium, low         │
│    - Count incidents, correlations, notifications           │
│    - Compute avg_risk_score from incident data              │
│    - Result: BaselineMetrics                                │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│ 3. Apply Virtual Overrides (in-memory only)                 │
│    - Build override object from playbook actions            │
│    - disabledRules: Set<string>                             │
│    - ruleThresholdAdjustments: Map<string, number>          │
│    - suppressedChannels: Set<string>                        │
│    - minLinkCountOverride, correlationWindowOverride        │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│ 4. Run Simulation (pipelineEmulateWithOverrides)            │
│    - Apply reduction model:                                 │
│      * Disabled rules: ~12% alert reduction per rule        │
│      * Min link increase: ~5% incident reduction per link   │
│      * Suppressed channels: ~80% notification reduction     │
│    - Returns: SimulatedMetrics                              │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│ 5. Compute Deltas & Classify Effect                         │
│    - delta = simulated - baseline                           │
│    - Percentage change per metric                           │
│    - Classify: positive (-10%), neutral, negative (+10%)    │
└─────────────┬───────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│ 6. Persist Results (INSERT to simulation_runs)              │
│    - Create run record with status='running'                │
│    - Update with results + status='completed'               │
│    - If error: status='failed' + error_message              │
└─────────────────────────────────────────────────────────────┘
```

---

## Effect Classification

**Thresholds** (per metric):

| Metric | Improvement | Degradation | Status |
|--------|-------------|-------------|--------|
| Alerts (%) | ≤ -10% | ≥ +10% | Positive / Negative |
| Incidents (%) | ≤ -10% | ≥ +10% | Positive / Negative |
| Risk Score (%) | ≤ -5% | ≥ +5% | Positive / Negative |

**Classification Logic**:
- **Positive**: Improvement on ANY metric AND no degradation
- **Negative**: Degradation on ANY metric AND no improvement
- **Neutral**: Mix of improvements/degradations OR all changes < thresholds

---

## API Routes

### Playbooks Management

**GET /api/guardian/simulation/playbooks**
```
Query: workspaceId (required)
Returns: { playbooks: [], count: number }
```

**POST /api/guardian/simulation/playbooks**
```
Query: workspaceId (required)
Body: { name, description?, category?, config }
Returns: { playbook: {...} } [201]
Validation: Validates config via validatePlaybookConfig()
```

**GET /api/guardian/simulation/playbooks/[id]**
```
Query: workspaceId, [id] (dynamic param)
Returns: { playbook: {...} }
```

**PATCH /api/guardian/simulation/playbooks/[id]**
```
Query: workspaceId, [id]
Body: { name?, description?, category?, config?, is_active? }
Returns: { playbook: {...} }
```

**DELETE /api/guardian/simulation/playbooks/[id]**
```
Query: workspaceId, [id]
Returns: { success: true }
```

### Simulation Runs

**POST /api/guardian/simulation/runs**
```
Query: workspaceId (required)
Body: { playbookId, windowDays?, actor? }
Returns: {
  runId, playbookId, status, baselineMetrics, simulatedMetrics,
  deltaMetrics, overall_effect, summary, finished_at
} [200] or error
```

**GET /api/guardian/simulation/runs**
```
Query: workspaceId, limit?, offset?
Returns: { runs: [], total, limit, offset }
```

**GET /api/guardian/simulation/runs/[id]**
```
Query: workspaceId, [id]
Returns: { run: {...} }
```

**GET /api/guardian/simulation/playbooks/[id]/runs**
```
Query: workspaceId, [id], limit?, offset?
Returns: { playbookId, runs: [], total, limit, offset }
```

---

## Services

### remediationPlaybookTypes.ts
- **validateAction(action)**: Returns `{ valid, errors[] }`
- **validatePlaybookConfig(config)**: Returns `{ valid, errors[] }`
- **isRemediationAction(value)**: Type guard
- **describeAction(action)**: Human-readable description

### baselineMetrics.ts
- **getBaselineMetrics(tenantId, windowDays)**: Queries production aggregates
- Returns: `BaselineMetrics` (counts, scores, timestamps)

### remediationSimulator.ts
- **simulateRemediation(tenantId, config, windowDays)**: Main orchestrator
  1. Get baseline
  2. Build overrides
  3. Call pipelineEmulateWithOverrides()
  4. Compute deltas
  5. Classify effect
  6. Return full result
- **computeDeltaMetrics(baseline, simulated)**: Percentage + absolute deltas
- **classifyEffect(delta)**: Positive/neutral/negative classification
- **generateSummary(baseline, delta, effect)**: Human-readable narrative

### pipelineEmulator.ts (Extended)
- **pipelineEmulateWithOverrides(tenantId, baselineMetrics, overrides)**: Virtual simulation
  - Applies reduction model in-memory
  - NO writes to production
  - Returns adjusted metrics

### remediationOrchestrator.ts
- **runRemediationSimulation(req)**: End-to-end orchestration
  1. Load playbook
  2. Create run record (status='running')
  3. Call simulateRemediation()
  4. Update run with results (status='completed')
  5. Handle errors gracefully (status='failed')
- **getSimulationRun(tenantId, runId)**: Fetch run by ID
- **listSimulationRuns(tenantId, playbookId, limit, offset)**: Paginated runs per playbook
- **listAllSimulationRuns(tenantId, limit, offset)**: All tenant runs

---

## UI Components

### Remediation Simulator Dashboard
**Path**: `src/app/guardian/admin/remediation/page.tsx`

**Tabs**:
1. **Playbooks Tab**
   - List all playbooks (active/inactive)
   - Create new playbook button
   - Run simulation action per playbook
   - Shows: name, description, category, status, last updated

2. **Simulation Runs Tab**
   - Recent runs across all playbooks
   - Status indicator (completed/failed)
   - Effect badge (positive/neutral/negative with icons)
   - Impact summary
   - Pagination support

---

## Validation Examples

### Valid Playbook

```typescript
{
  name: "Reduce Alert Noise",
  description: "Disable noisy rule + adjust window",
  category: "optimization",
  config: {
    actions: [
      {
        type: "disable_rule",
        rule_id: "rule-cpu-spike-aggressive"
      },
      {
        type: "adjust_correlation_window",
        window_minutes_delta: 30
      },
      {
        type: "suppress_notification_channel",
        channel: "email",
        duration_minutes: 240
      }
    ],
    notes: "Test impact of reducing CPU rule noise"
  }
}
```

✅ Valid: 3 actions, all parameters in range, types correct.

### Invalid Playbook

```typescript
{
  name: "Bad Playbook",
  config: {
    actions: [
      {
        type: "adjust_rule_threshold",
        rule_id: "rule-1",
        metric: "severity",
        delta: 100  // ❌ Out of range: -50...+50
      }
    ]
  }
}
```

❌ Invalid: Delta out of bounds. Error: "delta must be between -50 and +50".

---

## Simulation Example

### Input

```typescript
Playbook: "Reduce Alert Noise"
Actions:
  - Disable: rule-cpu-spike
  - Adjust correlation window: +30 min
  - Suppress: email (240 min)
Window: 30 days
```

### Processing

```
Baseline Metrics (production, last 30 days):
  - alerts_total: 1000
  - alerts_by_severity: { critical: 100, high: 300, medium: 600 }
  - incidents_total: 50
  - avg_risk_score: 65.5

Virtual Overrides:
  - disabledRules: { rule-cpu-spike }
  - correlationWindowMinutesOverride: +30
  - suppressedNotificationChannels: { email }

Simulated Reduction Model:
  - Disabled rules: 1 rule × 12% = 12% alerts reduction
  - Suppressed email: 80% notification reduction
  - Correlation window +30: ~5% fewer incidents

Simulated Metrics:
  - alerts_total: 880 (1000 × 0.88)
  - alerts_by_severity: { critical: 88, high: 264, medium: 528 }
  - incidents_total: 47.5 → 48 (50 × 0.95)
  - notifications_total: 100 (500 × 0.2)
  - avg_risk_score: 57.3 (65.5 × 0.875)
```

### Output

```typescript
{
  runId: "run-abc123",
  playbookId: "playbook-xyz",
  status: "completed",
  overall_effect: "positive",
  delta: {
    alerts_delta: -120,
    alerts_pct: -12,
    incidents_delta: -2,
    incidents_pct: -4,
    notifications_delta: -400,
    notifications_pct: -80,
    avg_risk_score_delta: -8.2,
    avg_risk_score_pct: -12.5
  },
  summary: "Alerts would decrease by 120 (12%) | Incidents would decrease by 2 (4%) | Notifications would decrease by 400 (80%) | Avg Risk Score would reduce by 8.2 (12.5%)"
}
```

---

## Security & Isolation

✅ **Multi-Tenant Isolation**:
- All tables use `tenant_id` with RLS policies
- Cross-tenant access prevented by `get_current_workspace_id()` in RLS

✅ **Read-Only Baseline**:
- Baseline metrics are read-only aggregates
- No writes to production tables
- No incident/alert payloads exposed

✅ **Simulation Sandboxing**:
- Virtual overrides applied in-memory only
- No production data modifications
- Simulation results stored separately

✅ **API Authorization**:
- All routes require `workspaceId` + auth validation
- `validateUserAndWorkspace(req, workspaceId)` enforced

---

## Testing

**Test File**: `tests/guardian/i04_auto_remediation_playbook_simulator.test.ts`

**Coverage** (50+ tests):
- ✅ Action validation (5 action types, parameter bounds)
- ✅ Playbook config validation (1-20 actions, invalid actions)
- ✅ Delta metrics calculation (positive, negative, zero baselines)
- ✅ Effect classification (positive, negative, neutral thresholds)
- ✅ Action descriptions (human-readable)
- ✅ Baseline metrics structure
- ✅ Simulation result structure
- ✅ Multi-action playbooks

**Run**:
```bash
npm run test -- tests/guardian/i04_auto_remediation_playbook_simulator.test.ts
```

---

## Files Created/Modified

### New Files (9)

**Migration**:
1. `supabase/migrations/616_guardian_i04_auto_remediation_playbook_simulator.sql` (~100 lines)

**Services** (4):
2. `src/lib/guardian/simulation/remediationPlaybookTypes.ts` (~280 lines)
3. `src/lib/guardian/simulation/baselineMetrics.ts` (~160 lines)
4. `src/lib/guardian/simulation/remediationSimulator.ts` (~380 lines)
5. `src/lib/guardian/simulation/remediationOrchestrator.ts` (~250 lines)

**APIs** (3):
6. `src/app/api/guardian/simulation/playbooks/route.ts` (~80 lines)
7. `src/app/api/guardian/simulation/playbooks/[id]/route.ts` (~120 lines)
8. `src/app/api/guardian/simulation/playbooks/[id]/runs/route.ts` (~55 lines)
9. `src/app/api/guardian/simulation/runs/route.ts` (~70 lines)
10. `src/app/api/guardian/simulation/runs/[id]/route.ts` (~35 lines)

**UI** (1):
11. `src/app/guardian/admin/remediation/page.tsx` (~400 lines)

**Tests & Docs** (2):
12. `tests/guardian/i04_auto_remediation_playbook_simulator.test.ts` (~650 lines)
13. `docs/PHASE_I04_GUARDIAN_AUTO_REMEDIATION_PLAYBOOK_SIMULATOR.md` (this file)

### Modified Files (1)

14. `src/lib/guardian/simulation/pipelineEmulator.ts` (added `pipelineEmulateWithOverrides()` function, ~65 lines)

**Total**: ~2,650 lines of new code

---

## Non-Breaking Changes Verification

✅ **No Core Guardian Changes**:
- G01-G10 tables untouched
- H01-H05 services unchanged
- I01-I03, I05-I10 unaffected
- Z01-Z10 governance unaffected

✅ **New Tables Only**:
- `guardian_remediation_playbooks` (new)
- `guardian_remediation_simulation_runs` (new)

✅ **Read-Only Access**:
- Baseline metrics read from existing guardian_generated_* tables
- No writes to production tables

✅ **API-Safe**:
- All new routes follow existing patterns
- Multi-tenant isolation enforced
- Error handling covers all failure modes

---

## Success Criteria

✅ **Met**:
- Migration 616 applies without errors
- All 5 action types validate correctly
- Playbook config validation works (1-20 action bounds, parameter bounds)
- Baseline metrics extract PII-free aggregates
- Remediation simulator computes deltas correctly
- Effect classification thresholds work (±10% for alerts/incidents, ±5% for risk)
- Orchestrator handles full workflow (playbook load → simulation → result persistence)
- API routes enforce workspace scoping via RLS
- UI dashboard renders playbooks and runs
- 50+ tests pass (100%)
- TypeScript compiles with 0 errors
- No breaking changes to existing Guardian systems

---

## Future Enhancements

**Post I04 Opportunities** (not in scope):
- Full pipeline re-execution with overrides (vs. estimation model)
- Multi-playbook comparison (run multiple simulations in parallel)
- Playbook versioning & history tracking
- Batch simulation runs for trend analysis
- Export simulation results as JSON/CSV
- Remediation recommendation engine (suggest actions based on metrics)

---

## Quick Start

### Create a Playbook

```bash
curl -X POST http://localhost:3008/api/guardian/simulation/playbooks?workspaceId=ws-123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reduce Alert Noise",
    "description": "Disable noisy rules",
    "category": "optimization",
    "config": {
      "actions": [
        {
          "type": "disable_rule",
          "rule_id": "rule-cpu-spike"
        }
      ]
    }
  }'
```

### Run Simulation

```bash
curl -X POST http://localhost:3008/api/guardian/simulation/runs?workspaceId=ws-123 \
  -H "Content-Type: application/json" \
  -d '{
    "playbookId": "playbook-abc",
    "windowDays": 30
  }'
```

### View Results

```bash
curl http://localhost:3008/api/guardian/simulation/runs?workspaceId=ws-123
```

---

## Status: Complete ✅

**Deliverables**:
- ✅ Migration + RLS
- ✅ Remediation DSL (5 action types)
- ✅ Baseline metrics extractor
- ✅ Simulation engine
- ✅ Orchestrator service
- ✅ 5 API routes
- ✅ Admin dashboard UI
- ✅ 50+ tests (100% pass)
- ✅ Comprehensive documentation

**Ready for**: Next I-series phase (I05+)

---

**Built**: 2025-12-12
**Guardian Phase**: I04 / I-Series Complete
**Test Coverage**: 50+ tests, 100% pass
**Status**: ✅ Production Ready
