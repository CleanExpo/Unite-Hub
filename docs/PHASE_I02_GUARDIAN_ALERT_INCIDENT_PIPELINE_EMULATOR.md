# Guardian I02: Alert & Incident Pipeline Emulator

**Phase**: I02
**Status**: Complete
**Date**: 2025-12-11

---

## Overview

Guardian I02 extends the I01 simulation framework to **emulate the full Guardian alert/incident pipeline** in an isolated sandbox. It generates synthetic security events and simulates the complete Guardian workflow:

```
Synthetic Events → Rule Evaluation → Alert Aggregation → Correlation → Incidents → Risk Scoring → Notifications
```

### Key Goals

- ✅ Isolate simulation artifacts from production G-series tables
- ✅ Reuse Guardian's existing rule, correlation, and risk logic
- ✅ Generate detailed trace logs of the entire pipeline
- ✅ Prevent external notifications during simulation
- ✅ Enforce tenant-level data isolation via RLS

---

## Architecture

### Schema

#### guardian_simulation_events
Stores synthetic events generated from scenarios.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Multi-tenant isolation |
| `run_id` | UUID | Associated simulation run |
| `sequence_index` | INTEGER | Event ordering |
| `generated_at` | TIMESTAMPTZ | Timestamp |
| `rule_key` | TEXT | Matched rule identifier |
| `severity` | TEXT | Event severity level |
| `attributes` | JSONB | High-level metadata only (no PII/payloads) |
| `metadata` | JSONB | Internal tracking |

#### guardian_simulation_pipeline_traces
Detailed log of pipeline execution steps.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Multi-tenant isolation |
| `run_id` | UUID | Associated simulation run |
| `phase` | TEXT | Pipeline phase (ingest, rule_eval, correlation, etc.) |
| `step_index` | INTEGER | Step ordering within run |
| `occurred_at` | TIMESTAMPTZ | When step executed |
| `actor` | TEXT | Component (engine, correlator, risk_engine, notifier) |
| `message` | TEXT | Descriptive message |
| `details` | JSONB | Step-specific details |

### Flow

```
┌─────────────────────────────────────────┐
│ runDryRun(request)                      │
│ - Create guardian_simulation_runs        │
│ - Generate synthetic events              │
│ - (Optionally) Emulate pipeline          │
└─────────────────────────────────────────┘
                    ↓
      ┌─────────────────────────┐
      │ generateEventsForScenario│
      │ - Expand patterns        │
      │ - Distribute over time   │
      │ - Insert into DB         │
      └─────────────────────────┘
                    ↓
      ┌────────────────────────────┐
      │ emulatePipelineForRun()    │
      │ - Load synthetic events    │
      │ - Simulate rule eval      │
      │ - Simulate correlation    │
      │ - Simulate incidents      │
      │ - Simulate risk scoring   │
      │ - Simulate notifications  │
      │ - Record traces           │
      └────────────────────────────┘
                    ↓
      ┌──────────────────────────┐
      │ Return EmulationSummary  │
      │ - Counts per phase       │
      │ - Trace logs             │
      │ - Risk adjustments       │
      └──────────────────────────┘
```

---

## Components

### eventGenerator.ts

**Purpose**: Generate synthetic security events from scenario patterns.

**Key Functions**:
- `generateEventsForScenario()`: Create ordered synthetic events
- `loadGeneratedEventsForRun()`: Retrieve persisted events

**Distribution Strategies**:
- `uniform`: Events evenly spaced over time window
- `front_loaded`: Events clustered toward start
- `back_loaded`: Events clustered toward end

### pipelineEmulator.ts

**Purpose**: Simulate Guardian pipeline execution.

**Key Functions**:
- `emulatePipelineForRun()`: Run full emulation
- `simulateRuleEvaluation()`: Match rules to events
- `simulateCorrelation()`: Cluster related alerts
- `simulateIncidents()`: Create incidents from clusters
- `simulateRiskScoring()`: Calculate risk adjustments
- `simulateNotifications()`: Model notifications (no dispatch)

**Emulation Scopes**:
- `alerts_only`: Stop after alert aggregation
- `incident_flow`: Continue through incident creation
- `full_guardian`: Full pipeline including risk and notifications

### dryRunEngine.ts

**Purpose**: Orchestrate I01 + I02 functionality.

**Responsibilities**:
- Create simulation runs
- Invoke event generation
- (Optionally) invoke pipeline emulation
- Update run status and impact estimates
- Handle errors and logging

---

## Isolation Guarantees

### ✅ Tenant Isolation

All simulation tables use RLS policies enforcing `tenant_id` matching:

```sql
CREATE POLICY "tenant_isolation" ON guardian_simulation_events
  FOR ALL
  USING (tenant_id = get_current_workspace_id());
```

### ✅ No Production Table Writes

Pipeline emulator uses **only** simulation-specific tables:
- `guardian_simulation_events`
- `guardian_simulation_pipeline_traces`

It never writes to:
- `guardian_alerts`
- `guardian_incidents`
- `guardian_risk_scores`
- `guardian_notifications`

### ✅ No External Notifications

Notification steps are modeled as trace entries only. No actual emails, Slack messages, or webhooks are sent.

### ✅ Synthetic Identifiers

All generated entities use synthetic identifiers:
- Event sequences: `sim-event-{timestamp}-{random}`
- Incident IDs: `sim-incident-{timestamp}-{random}`

---

## API Routes

### GET /api/guardian/admin/simulation/runs/[id]/trace

Retrieve detailed pipeline traces with pagination.

**Query Parameters**:
- `workspaceId` (required): Tenant ID
- `page` (optional): Page number (default 1)
- `pageSize` (optional): Items per page (default 50, max 500)

**Response**:
```json
{
  "runId": "...",
  "traces": [
    {
      "id": "...",
      "phase": "rule_eval",
      "stepIndex": 1,
      "occurredAt": "2025-12-11T...",
      "actor": "engine",
      "message": "Rule 'auth_brute_force' matched...",
      "details": { ... }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

### GET /api/guardian/admin/simulation/runs/[id]/timeline

Retrieve aggregated pipeline timeline (phases with metrics).

**Response**:
```json
{
  "runId": "...",
  "timeline": [
    {
      "phase": "rule_eval",
      "count": 25,
      "severity_breakdown": {
        "critical": 5,
        "high": 10,
        "medium": 10
      },
      "first_occurred": "2025-12-11T...",
      "last_occurred": "2025-12-11T..."
    }
  ]
}
```

### GET /api/guardian/admin/simulation/runs/[id]/summary

Generate AI-powered summary of simulation traces.

**Response**:
```json
{
  "runId": "...",
  "summary": {
    "summaryMarkdown": "## Simulation Results\n\nThis simulation generated...",
    "keyFindings": [
      "Critical alerts from brute-force patterns dominated",
      "Correlation identified 3 distinct incident clusters"
    ],
    "potentialRisks": [
      "Risk score would increase by 25 points",
      "Recommended immediate investigation of incident-1"
    ],
    "suggestedNextScenarios": [
      "Test with multi-source coordination"
    ]
  }
}
```

---

## Usage Example

```typescript
import { runDryRun } from '@/lib/guardian/simulation/dryRunEngine';

// Run simulation with full pipeline emulation
const result = await runDryRun({
  tenantId: 'tenant-abc123',
  scenarioId: 'scenario-xyz789',
  actorId: 'user-admin',
  emulatePipeline: true,
  emulateScope: 'full_guardian',
  overrideWindow: {
    start: new Date('2025-12-01'),
    end: new Date('2025-12-02'),
  },
});

console.log(result);
// {
//   runId: 'run-...',
//   status: 'completed',
//   impactEstimate: {
//     estimatedEvents: 23,
//     estimatedAlerts: 18,
//     estimatedIncidents: 2,
//     estimatedNotifications: 3
//   },
//   pipelineSummary: {
//     totalSyntheticEvents: 23,
//     simulatedAlerts: 18,
//     simulatedIncidents: 2,
//     ...
//   }
// }
```

---

## Testing

### Unit Tests

See `tests/guardian/i02_simulation_pipeline.test.ts`:
- Event generation with various distributions
- Emulation context validation
- Severity level recognition
- Tenant isolation guarantees
- Production table isolation

### Integration Testing

1. Create a simulation run with `runDryRun()`
2. Verify `guardian_simulation_events` populated correctly
3. Verify `guardian_simulation_pipeline_traces` contains all phases
4. Confirm `guardian_simulation_runs.impact_estimate` updated
5. Query traces via `/api/guardian/admin/simulation/runs/[id]/trace`
6. Generate summary via `/api/guardian/admin/simulation/runs/[id]/summary`

### Manual QA

1. Log in as admin
2. Navigate to Simulation Studio
3. Create a new scenario
4. Run with pipeline emulation enabled
5. View Pipeline tab with timeline and traces
6. Verify no real alerts/incidents created in production tables
7. Test AI summary generation

---

## Future Extensions (I03+)

- **I03**: Controlled injection of real events into simulation
- **I04**: Auto-remediation testing (verify response automation)
- **I05**: Multi-tenant chaos scenarios
- **I06**: Performance profiling under synthetic load

---

## Notes

- Simulation runs are **immutable** after completion
- Trace logs are **not** deduplicated; actual Guardian pipeline will create real artifacts
- AI summaries are **advisory only** and should not be treated as authoritative recommendations
- All simulation data is **tenant-scoped** and never shared across workspaces
