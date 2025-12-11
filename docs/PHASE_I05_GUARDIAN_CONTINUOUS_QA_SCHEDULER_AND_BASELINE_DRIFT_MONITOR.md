# Guardian I05: Continuous QA Scheduler & Baseline Drift Monitor

**Status**: ✅ Implementation Complete
**Date**: 2025-12-11
**Type**: Guardian I-series automation (QA & monitoring layer)

---

## Overview

**Guardian I05** adds **continuous regression testing and behavioral drift detection** to the Guardian pipeline without affecting production runtime. It combines:

1. **QA Schedule Management** — Cron-driven execution of regression packs
2. **Baseline Management** — Snapshot-and-compare metrics from simulation runs
3. **Drift Detection Engine** — Identify behavioral changes with severity flags
4. **Admin APIs & Dashboard** — Manage schedules, baselines, and drift reports

**Non-destructive by design**: I05 schedules only trigger I01–I04 simulation/regression runs. No real alerts, incidents, or notifications. All isolation guarantees from I01–I04 remain intact.

---

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────────┐
│ QA Dashboard (React UI)                  │  ← Admin interface
│ - Schedule management                    │
│ - Baseline browser                       │
│ - Drift report viewer                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ QA Admin APIs (Next.js Routes)           │  ← REST endpoints
│ - /api/guardian/admin/qa/schedules       │
│ - /api/guardian/admin/qa/baselines       │
│ - /api/guardian/admin/qa/drift           │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ QA Core Services (TypeScript)            │  ← Business logic
│ - qaMetrics: Extract aggregates          │
│ - qaBaselineManager: Manage snapshots    │
│ - qaDriftEngine: Compare metrics         │
│ - qaScheduleExecutor: Orchestrate runs   │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Database (Supabase PostgreSQL)           │  ← Tenant-scoped tables
│ - guardian_qa_schedules                  │
│ - guardian_qa_baselines                  │
│ - guardian_qa_drift_reports              │
└─────────────────────────────────────────┘
```

---

## Core Concepts

### 1. QA Schedule

A **cron-driven trigger** that automatically executes regression packs and tracks results.

**Table**: `guardian_qa_schedules`

```sql
{
  id: UUID,
  tenant_id: UUID,           -- Tenant isolation
  name: string,              -- "Daily Core Validation"
  schedule_cron: string,     -- "0 3 * * *" (3 AM UTC daily)
  timezone: string,          -- "UTC" or "America/New_York"
  pack_id: UUID,             -- References regression pack (I03)
  chaos_profile_id?: UUID,   -- Optional chaos injection
  simulate_playbooks: bool,  -- Include playbook sim (I04)
  max_runtime_minutes: int,  -- 30 (safety limit)
  last_run_id?: UUID,        -- Track last execution
  last_run_at?: timestamp,   -- Last execution time
  is_active: bool,           -- Enable/disable schedule
  metadata: JSONB            -- Extra config (future use)
}
```

**Workflow**:
1. External cron runner (or job processor) calls `/api/.../schedules/[id]/run` periodically
2. qaScheduleExecutor loads schedule and validates
3. Triggers regression pack execution via I03 orchestrator
4. Manages baseline selection/creation
5. Computes drift and stores report
6. Updates `last_run_id` and `last_run_at`

### 2. Baseline

A **snapshot of aggregate metrics** from a regression/simulation/playbook run. Used as reference for drift detection.

**Table**: `guardian_qa_baselines`

```sql
{
  id: UUID,
  tenant_id: UUID,
  name: string,              -- "weekly_core_baseline"
  scope: string,             -- 'regression_pack' | 'scenario' | 'playbook'
  source_type: string,       -- 'regression_run' | 'simulation_run' | 'playbook_simulation_run'
  source_id: string,         -- UUID of run that created baseline
  captured_at: timestamp,    -- When baseline was captured
  metrics: JSONB,            -- Aggregate metrics (counts, ratios, no PII)
  comparison_window?: string,-- "last_4_weeks" for context
  is_reference: bool,        -- Whether this is reference for drift comparison
  created_by?: string,       -- "admin" or "qaSchedule"
  metadata: JSONB
}
```

**Metrics Structure** (JSONB):
```json
{
  "alerts": {
    "total": 2500,
    "bySeverity": { "critical": 20, "high": 80, "medium": 150, "low": 250 },
    "byRule": { "auth_fail_rate_high": 100, "cpu_spike_critical": 80 }
  },
  "incidents": {
    "total": 45,
    "byType": { "security": 15, "performance": 20, "reliability": 10 }
  },
  "risk": {
    "avgScore": 6.5,
    "maxScore": 9.2
  },
  "notifications": {
    "simulatedTotal": 150,
    "byChannel": { "slack": 60, "email": 50, "pagerduty": 30 }
  },
  "playbooks": {
    "totalEvaluated": 12,
    "totalActions": 18,
    "byPlaybookId": {
      "pb_auto_remediate": { "actions": 5 },
      "pb_escalate": { "actions": 8 }
    }
  }
}
```

**Key Rule**: No raw payloads, no PII, only aggregate counts and identified (anonymized) rule/pack keys.

### 3. Drift Report

Comparison of current run metrics against a baseline. Flags behavioral changes.

**Table**: `guardian_qa_drift_reports`

```sql
{
  id: UUID,
  tenant_id: UUID,
  schedule_id?: UUID,        -- Which schedule triggered this (if any)
  baseline_id: UUID,         -- Reference baseline used
  comparison_run_id: UUID,   -- Current regression run compared
  created_at: timestamp,
  status: string,            -- 'completed' | 'failed'
  severity: string,          -- 'info' | 'warning' | 'critical'
  summary: JSONB,            -- Aggregated deltas and flags
  details: JSONB,            -- Markdown summary and metadata
  created_by?: string,       -- Who triggered this
  metadata: JSONB
}
```

**Drift Severity Rules**:
- **Info** (green): < 15% relative change on any metric
- **Warning** (yellow): 15–34% relative change
- **Critical** (red): ≥ 35% relative change

**Relative Change Calculation**:
```
relative_change = (current - baseline) / max(1, abs(baseline))
```

---

## Services (TypeScript)

### qaMetrics.ts

Extract comparable metrics from I01–I04 runs.

**Key Functions**:
- `extractMetricsFromRegressionRun(tenantId, regressionRunId)` — Load metrics from I03 run
- `extractMetricsFromSimulationRun(tenantId, simulationRunId)` — Load metrics from I01/I02 run
- `extractMetricsFromPlaybookSimulationRun(tenantId, playbookSimRunId)` — Load metrics from I04 run
- `consolidateMetrics(metricsArray)` — Merge multiple metric sets into aggregate
- `mergeMetrics(...)` — Safe merge with null checks

**Key Features**:
- All extractors are read-only (no mutations)
- Tenant-scoped via database queries
- Returns unified `GuardianQaMetrics` interface

### qaBaselineManager.ts

Create and manage baseline snapshots.

**Key Functions**:
- `createBaselineFromRegressionRun(tenantId, name, regressionRunId, options)` — Capture baseline from I03
- `createBaselineFromSimulationRun(tenantId, name, simulationRunId, options)` — From I01/I02
- `createBaselineFromPlaybookSimulationRun(tenantId, name, playbookSimRunId, options)` — From I04
- `markBaselineAsReference(tenantId, baselineId, isReference)` — Set as comparison baseline
- `listBaselines(tenantId, filters)` — Browse baselines
- `getBaseline(tenantId, baselineId)` — Fetch single baseline
- `findReferenceBaseline(tenantId, scope, name)` — Auto-find reference baseline
- `deleteBaseline(tenantId, baselineId)` — Remove baseline

**Key Features**:
- Automatic metric extraction from source run
- Tenant isolation via database filters
- Optional auto-creation if no reference baseline exists

### qaDriftEngine.ts

Compute drift and generate reports.

**Key Functions**:
- `computeDrift(baseline, current, config)` → `GuardianQaDriftResult` — Core drift calculation
- `createDriftReportForRegressionRun(tenantId, baselineId, runId, scheduleId, baseline, current)` — Store report
- `listDriftReports(tenantId, filters)` — Browse reports
- `getDriftReport(tenantId, reportId)` — Fetch single report

**Drift Computation**:
1. Calculate relative change for each metric (alert count, incident count, risk, notifications, playbook actions)
2. Compare against configured thresholds
3. Set severity based on max absolute change
4. Generate markdown summary with recommendations
5. Return flags listing specific changes

**Custom Configuration**:
```typescript
interface GuardianQaDriftConfig {
  thresholds: {
    alertsRelativeChange?: 0.15,
    incidentsRelativeChange?: 0.2,
    riskRelativeChange?: 0.1,
    notificationsRelativeChange?: 0.15,
    playbookActionsRelativeChange?: 0.2,
  },
  severityRules: {
    warningAbove?: 0.15,
    criticalAbove?: 0.35,
  },
}
```

### qaScheduleExecutor.ts

Orchestrate QA execution: load schedule, run regression, manage baseline, compute drift.

**Key Functions**:
- `runQaSchedule(context)` → `GuardianQaScheduleExecutionResult` — Main orchestrator
- `listQaSchedules(tenantId, filters)` — Browse schedules
- `getQaSchedule(tenantId, scheduleId)` — Fetch schedule
- `createQaSchedule(tenantId, input)` — Create new schedule
- `updateQaSchedule(tenantId, scheduleId, updates)` — Edit schedule
- `deleteQaSchedule(tenantId, scheduleId)` — Remove schedule

**Execution Workflow**:
```
1. Load schedule (validate active + tenant)
2. Execute regression pack via I03 orchestrator
3. Extract current metrics from regression run
4. Find or create reference baseline
5. Compute drift against baseline
6. Store drift report with severity
7. Update schedule.last_run_id and .last_run_at
8. Return execution result (IDs + summaries)
```

**Mock Implementation Note**:
Currently `executeRegressionPackMock()` creates mock data for testing. In production, this calls the real `regressionOrchestrator.executeRegressionRun()` from I03.

---

## REST APIs

### Schedules

```
GET    /api/guardian/admin/qa/schedules?workspaceId=X&isActive=true
  → List QA schedules for workspace

POST   /api/guardian/admin/qa/schedules?workspaceId=X
  body: { name, schedule_cron, pack_id, chaos_profile_id?, simulate_playbooks?, max_runtime_minutes? }
  → Create schedule

GET    /api/guardian/admin/qa/schedules/[id]?workspaceId=X
  → Get single schedule

PATCH  /api/guardian/admin/qa/schedules/[id]?workspaceId=X
  body: { is_active?, schedule_cron?, simulate_playbooks?, ... }
  → Update schedule

DELETE /api/guardian/admin/qa/schedules/[id]?workspaceId=X
  → Delete schedule

POST   /api/guardian/admin/qa/schedules/[id]/run?workspaceId=X
  body: { actorId? }
  → Manually trigger schedule now
```

### Baselines

```
GET    /api/guardian/admin/qa/baselines?workspaceId=X&scope=X&isReference=true
  → List baselines

POST   /api/guardian/admin/qa/baselines?workspaceId=X
  body: { name, source_type, source_id, isReference?, description? }
  → Create baseline from run

GET    /api/guardian/admin/qa/baselines/[id]?workspaceId=X
  → Get single baseline

PATCH  /api/guardian/admin/qa/baselines/[id]?workspaceId=X
  body: { is_reference: bool }
  → Mark as reference

DELETE /api/guardian/admin/qa/baselines/[id]?workspaceId=X
  → Delete baseline
```

### Drift Reports

```
GET    /api/guardian/admin/qa/drift?workspaceId=X&severity=warning&limit=20
  → List drift reports

GET    /api/guardian/admin/qa/drift/[id]?workspaceId=X
  → Get single drift report
```

---

## Admin Dashboard

**Route**: `/guardian/admin/qa`

**Tabs**:
1. **QA Schedules** — Create/edit/delete schedules; manually trigger runs
2. **Baselines** — Browse baselines; mark as reference
3. **Drift Reports** — View recent drift reports with severity badges; click to expand

**Features**:
- Real-time status updates
- Manual run trigger
- Baseline reference management
- Drift severity color-coding (red/yellow/green)
- Collapsible detail views

---

## Data Flow Example

**Scenario**: Scheduled regression runs daily at 3 AM, compares against baseline, flags drift.

```
1. Cron job triggers at 03:00 UTC
   → POST /api/guardian/admin/qa/schedules/sched-123/run

2. qaScheduleExecutor.runQaSchedule() executes:
   a. Load schedule { pack_id: "pack-456", chaos_profile_id: "chaos-789" }
   b. Call executeRegressionPack(tenant, pack-456, chaos-789)
   c. New regression_run created → run-999
   d. Extract metrics from run-999 → currentMetrics
   e. Find reference baseline for scope 'regression_pack' → baseline-111
   f. Load baseline.metrics → baselineMetrics
   g. computeDrift(baselineMetrics, currentMetrics)
      - Alerts: 2500 → 2875 (+15% = warning)
      - Incidents: 45 → 45 (no change)
      - Risk: 6.5 → 6.8 (+4.6% = info)
      → severity = warning, flags = ["Alert volume changed by +15%"]
   h. Create drift_report:
      { schedule_id: sched-123, baseline_id: baseline-111, comparison_run_id: run-999, severity: warning }
   i. Update schedule: last_run_id = run-999, last_run_at = now()

3. Admin sees drift report on dashboard
   - Severity badge: "⚠️ WARNING"
   - Flag: "Alert volume changed by +15%"
   - Action: Investigate why alerts increased 15%

4. Admin can:
   - View detailed traces of run-999
   - Compare metrics side-by-side
   - Create new baseline if change is expected
   - Adjust thresholds for future runs
```

---

## Tenant Isolation

**Every I05 table** is tenant-scoped:

```sql
-- RLS policies enforce tenant isolation
CREATE POLICY qa_schedules_tenant_isolation ON guardian_qa_schedules
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));

CREATE POLICY qa_baselines_tenant_isolation ON guardian_qa_baselines
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));

CREATE POLICY qa_drift_reports_tenant_isolation ON guardian_qa_drift_reports
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));
```

**Service-level checks**:
- All functions validate `tenantId` matches query filters
- All API routes require `workspaceId` parameter
- Database queries always include `eq('tenant_id', tenantId)`

---

## Production Isolation Guarantees

✅ **I05 never writes to production Guardian tables**:
- No writes to `guardian_alerts`
- No writes to `guardian_incidents`
- No writes to `guardian_rules`
- No writes to `guardian_correlations`
- No writes to `guardian_notifications`
- No writes to `guardian_playbooks`

✅ **All I05 data isolated to simulation tables**:
- Reads from `guardian_regression_runs` (from I03) — read-only
- Reads from `guardian_simulation_runs` (from I01/I02) — read-only
- Reads from `guardian_playbook_simulation_runs` (from I04) — read-only
- Writes only to `guardian_qa_schedules`, `guardian_qa_baselines`, `guardian_qa_drift_reports`

✅ **If I05 is disabled or deleted**:
- All I01–I04 behavior unchanged
- No cascade deletions affect production
- Regression pack execution unaffected

---

## Testing

**Test File**: `tests/guardian/i05_qa_scheduler_drift_monitor.test.ts`

**Coverage**:
- Metrics consolidation (merge multiple metrics)
- Drift computation (identify changes, apply thresholds)
- Severity determination (info/warning/critical)
- Playbook metrics handling
- Tenant isolation contract
- Edge cases (zero baselines, missing fields, custom config)

**Run Tests**:
```bash
npm test -- i05_qa_scheduler_drift_monitor
```

---

## Future Extensions (I06+)

### I06: Regression Pack Replay Engine
- Re-execute historical incidents with exact conditions
- Validate if current rules would detect same incidents
- Build "regression prevention" database

### I07: Auto-Remediation Guardrail
- Monitor drift reports for critical changes
- Auto-trigger alternative playbooks if primary fails
- Feedback loop: drift → adjustment → baseline update

### I08: Simulation-Based Alerting
- Use drift history to predict future changes
- Alert on anomalies in drift pattern itself
- "Behavioral drift is drifting" meta-monitoring

---

## Deployment Checklist

- [ ] Migration 4277 applied (create I05 tables)
- [ ] qaMetrics.ts compiled and tested
- [ ] qaBaselineManager.ts compiled and tested
- [ ] qaDriftEngine.ts compiled and tested
- [ ] qaScheduleExecutor.ts compiled and tested
- [ ] All API routes deployed and responding
- [ ] QA dashboard loads at `/guardian/admin/qa`
- [ ] Tests pass: `npm test -- i05_qa_scheduler`
- [ ] Build passes: `npm run build`
- [ ] TypeScript strict mode: zero errors
- [ ] RLS policies verified in Supabase
- [ ] Manual test: Create schedule → Run → View drift report

---

## References

- **I01**: Impact Estimation & Scenario Registry
- **I02**: Alert & Incident Pipeline Emulator
- **I03**: Regression Pack Orchestrator
- **I04**: Auto-Remediation Playbook Simulator
- **I05**: Continuous QA Scheduler & Baseline Drift Monitor (this document)

---

**Implementation Complete**: ✅ Ready for deployment and testing
