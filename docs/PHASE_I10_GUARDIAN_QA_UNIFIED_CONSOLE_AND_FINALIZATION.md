# Guardian I10: Unified QA Console & I-Series Finalization

**Status**: Final phase of Guardian QA & Chaos suite
**Last Updated**: 2025-12-11
**Version**: Guardian QA 1.0

## Overview

Guardian I10 finalizes the Guardian QA & Chaos layer (I01–I09) by introducing:

1. **Tenant-scoped QA Feature Flags** — Fine-grained control over QA module availability
2. **Cross-I-series Audit Logging** — Unified trail of all QA operations
3. **Unified QA Overview** — Single pane of glass aggregating KPIs from I01–I09
4. **QA Console UI** — Admin dashboard for monitoring and configuration

I10 is **non-breaking** and **read-only** with respect to core Guardian runtime (I-series anomaly detection, rule evaluation, incident handling). All QA feature flags default to a safe, non-disruptive stance.

## Feature Flags

QA features are controlled per-tenant via `guardian_qa_feature_flags` table. One row per tenant with boolean fields:

| Flag | Default | Purpose |
|------|---------|---------|
| `enableSimulation` | true | Allow scenario simulations (I01–I03) |
| `enableRegression` | true | Allow regression pack creation & runs (I02–I04) |
| `enableChaos` | false | Allow chaos/failure injection tests (I03) |
| `enableGatekeeper` | false | Allow pre-deployment impact analysis (I06) |
| `enableTraining` | false | Allow operator drills & war-games (I07) |
| `enablePerformance` | false | Allow performance & load tests (I09) |
| `enableCoverage` | true | Allow QA coverage snapshots (I08) |
| `enableDriftMonitor` | true | Allow test drift & anomaly detection (I05) |
| `enableAiScoring` | false | Allow AI-driven test scoring (I04/I07) |

**Recommended Defaults**:
- **Sandbox/Dev tenants**: All flags enabled for full experimentation
- **Staging tenants**: Simulation, regression, coverage, drift enabled; chaos, gatekeeper, training disabled pending validation
- **Production tenants**: Simulation & coverage enabled; all others disabled unless explicitly authorized

## Audit Logging

All QA operations log events to `guardian_qa_audit_events`:

```sql
CREATE TABLE guardian_qa_audit_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_id TEXT,
  source TEXT, -- 'simulation', 'regression', 'gatekeeper', 'training', 'performance', 'coverage', 'qa_scheduler'
  source_id TEXT, -- entity ID (e.g., scenario_id, regression_run_id, gate_decision_id)
  event_type TEXT, -- 'qa_run_started', 'qa_run_completed', 'gate_decision', 'slo_failed', etc.
  severity TEXT, -- 'info' | 'warning' | 'critical'
  summary TEXT, -- Human-readable summary
  details JSONB, -- IDs, counts, labels only — NO PII or raw payloads
  metadata JSONB
);
```

**Data Privacy**:
- `details` and `metadata` contain **only** IDs, counts, severities, and labels
- **Never** raw payloads, PII, credentials, or sensitive field values
- All values are truncated to safe lengths (500 chars max, 10KB total)
- Suspicious keys (password, token, email, phone, ssn) are automatically stripped

**Audit Events by I-series Module**:

| Module | Source | Event Type | Severity |
|--------|--------|------------|----------|
| I01–I03: Simulation | `simulation` | `qa_run_completed` | info/warning |
| I02–I04: Regression | `regression` | `qa_run_completed` | info/warning |
| I03: Chaos | `chaos` | `qa_run_completed` | info/warning |
| I04: Playbook Sim | `regression` | `playbook_sim_completed` | info/warning |
| I05: QA Scheduler | `qa_scheduler` | `drift_report_created` | info/warning/critical |
| I06: Gatekeeper | `gatekeeper` | `gate_decision` | info/warning/critical |
| I07: War-Games | `training` | `drill_completed`, `drill_scored` | info/warning |
| I08: Coverage | `coverage` | `coverage_snapshot_created` | info |
| I09: Performance | `performance` | `performance_slo_failed` | warning/critical |

## Unified QA Overview

The **qaOverviewService** aggregates metrics from I01–I09:

```typescript
interface GuardianQaOverview {
  stats: {
    simulationsLast30d: number;
    regressionPacks: number;
    regressionRunsLast30d: number;
    driftReportsCriticalLast30d: number;
    gatekeeperDecisionsLast30d: { allow, block, warn };
    drillsCompletedLast30d: number;
    coverageSnapshotsLast30d: number;
    performanceRunsLast30d: number;
  };
  coverage: {
    criticalRules: { total, averageCoverageScore, blindSpots };
    playbooks: { total, neverSimulated };
  };
  flags: GuardianQaFeatureFlags;
  latestAlerts: GuardianQaLatestAlert[]; // Last 20 audit events
}
```

All queries are **tenant-scoped** and **limited** to prevent heavy scans.

## QA Console UI

The unified QA console (`/guardian/admin/qa/index`) provides:

**Overview Tab**:
- KPI cards: Simulations, Regression Runs, Critical Drift Reports, Drills, Performance Tests, Coverage Snapshots
- Coverage snapshot showing: Critical rules, average coverage score, blind spots, playbook stats
- Latest QA events table (last 20) with severity badges and deep links to source modules

**Settings Tab**:
- Toggle switches for all 9 QA feature flags
- Inline descriptions for each flag
- Save button to persist changes to database

**Audit Log Tab**:
- Links to audit event API for detailed filtering and pagination

## API Endpoints

All endpoints are **admin-only** and **tenant-scoped**.

### GET `/api/guardian/admin/qa/settings`
**Query params**: `?workspaceId=<id>`
**Returns**: `{ flags: GuardianQaFeatureFlags }`

### PATCH `/api/guardian/admin/qa/settings`
**Query params**: `?workspaceId=<id>`
**Body**: Partial `GuardianQaFeatureFlags`
**Returns**: `{ flags: GuardianQaFeatureFlags }`
**Auth**: Admin required

### GET `/api/guardian/admin/qa/overview`
**Query params**: `?workspaceId=<id>`
**Returns**: `{ overview: GuardianQaOverview }`

### GET `/api/guardian/admin/qa/audit`
**Query params**:
- `?workspaceId=<id>` (required)
- `&source=<string>` (optional)
- `&eventType=<string>` (optional)
- `&severity=<string>` (optional)
- `&limit=<number>` (default 50, max 500)

**Returns**: `{ events: GuardianQaAuditEvent[], count: number }`

## Integration with I01–I09

I10 provides **non-breaking** integration points at the API boundary layer:

1. **Simulation/Regression Endpoints** (I01–I03):
   - Check `enableSimulation`/`enableRegression` flags before allowing operation
   - Return 403 with clear error if disabled

2. **Chaos Endpoints** (I03):
   - Skip chaos profile usage when `enableChaos` is false
   - Return 403 with error message

3. **Gatekeeper Endpoints** (I06):
   - Allow operation only when `enableGatekeeper` is true
   - Return 403 if disabled

4. **Training/Drill Endpoints** (I07):
   - Allow operation only when `enableTraining` is true
   - Return 403 if disabled

5. **Performance Endpoints** (I09):
   - Allow operation only when `enablePerformance` is true
   - Return 403 if disabled

6. **Coverage Endpoints** (I08):
   - Allow snapshot creation only when `enableCoverage` is true
   - Return 403 if disabled

7. **Audit Logging** (All I-series):
   - Call `logQaEvent()` helpers from key I-series handlers
   - Log at successful completion or on notable failures

## Implementation Notes

- **Database**: Migration 589 creates `guardian_qa_feature_flags` and `guardian_qa_audit_events` with RLS and indexes
- **Services**:
  - `qaFeatureFlagsService.ts` — Feature flag CRUD with 60-second cache
  - `qaAuditLogger.ts` — Audit event logging with sanitization
  - `qaOverviewService.ts` — Cross-I-series aggregation
- **APIs**: 3 new admin routes for settings, overview, and audit
- **UI**: Single-pane console with overview, settings, and audit tabs
- **Core Guardian**: Untouched. I10 only gates access to QA features; core runtime semantics unchanged.

## Readiness Checklist

Before marking Guardian QA 1.0 production-ready:

- [ ] Supabase migrations 589 applied
- [ ] QA feature flags set per-tenant (using recommended defaults per environment)
- [ ] Minimal regression pack(s) defined
- [ ] At least one QA schedule configured
- [ ] Gatekeeper smoke-tested in advisory mode
- [ ] Coverage snapshot created and reviewed
- [ ] Performance profile run to completion
- [ ] Drill created and executed successfully
- [ ] Audit events verified in console
- [ ] QA console UI accessible and functional
- [ ] Documentation reviewed and understood
- [ ] Tenant isolation (RLS) verified
- [ ] Admin-only access enforced on all settings endpoints

## Related Documentation

- [Guardian I-Series Overview](./PHASE_I_SERIES_OVERVIEW.md)
- [Guardian I01–I03: Simulation Studio](./PHASE_I01_SIMULATION_STUDIO.md)
- [Guardian I04: Playbook Simulator](./PHASE_I04_PLAYBOOK_SIMULATOR.md)
- [Guardian I05: QA Scheduler & Drift Monitor](./PHASE_I05_QA_SCHEDULER_DRIFT_MONITOR.md)
- [Guardian I06: Change Impact Gatekeeper](./PHASE_I06_GUARDIAN_CHANGE_IMPACT_GATEKEEPER.md)
- [Guardian I07: Incident War-Games & Operator Training](./PHASE_I07_INCIDENT_WAR_GAMES_TRAINING.md)
- [Guardian I08: QA Coverage Map & Blind-Spot Detector](./PHASE_I08_QA_COVERAGE_MAP.md)
- [Guardian I09: Performance & Cost Chaos Layer](./PHASE_I09_PERFORMANCE_AND_COST.md)

---

**Guardian QA & Chaos 1.0** — Non-breaking QA suite for complex systems.
