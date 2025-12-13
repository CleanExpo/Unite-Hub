# Guardian I04 — Auto-Remediation Playbook Simulator (Simulation-Only)

## Purpose
Guardian I04 provides an end-to-end, simulation-only subsystem to evaluate proposed “auto-remediation” actions against **aggregate baseline metrics**. It **never** mutates Guardian production tables and stores **no raw events, payloads, or PII**.

## Tenancy & Access Control
- `tenant_id` maps to `workspaces.id`.
- Database access is enforced via RLS using `get_current_workspace_id()`; all reads/writes to I04 tables are tenant-scoped.
- API access is enforced at the route boundary via `requireExecutionContext()` and requires `x-workspace-id`.
- Admin-only: remediation simulator routes require workspace membership role `owner` or `admin`.

## Data Model (Authoritative Tables)

### `guardian_remediation_playbooks`
Tenant-scoped remediation playbooks (configs only).
- `id` (uuid)
- `tenant_id` (uuid, FK → `workspaces.id`)
- `name` (text, unique per tenant)
- `description` (text, nullable)
- `category` (text)
- `is_active` (boolean)
- `config` (jsonb) — remediation DSL
- `created_by` (text, nullable) — actor id (UUID string), no PII
- `metadata` (jsonb) — extensibility (must remain PII-free by convention)
- `created_at`, `updated_at` (timestamptz)

### `guardian_remediation_simulation_runs`
Simulation run results (aggregates only).
- `id` (uuid)
- `tenant_id` (uuid, FK → `workspaces.id`)
- `playbook_id` (uuid, FK → `guardian_remediation_playbooks.id`)
- `status` (`running` | `completed` | `failed`)
- `baseline_metrics` (jsonb) — aggregates only
- `simulated_metrics` (jsonb) — aggregates only
- `delta_metrics` (jsonb) — aggregates only (absolute + percentage deltas)
- `overall_effect` (`positive` | `neutral` | `negative`, nullable)
- `summary` (text, nullable) — deterministic summary string
- `metadata` (jsonb) — extensibility (includes `created_by` when available)
- `started_at`, `finished_at`, `created_at` (timestamptz)

## Supported Remediation Actions (Config DSL)
Playbook `config` must be JSON:
```json
{
  "actions": [
    { "type": "disable_rule", "rule_id": "rule.123" }
  ],
  "notes": "optional"
}
```

Supported `actions[].type` values:
- `disable_rule`: `{ rule_id }`
- `adjust_rule_threshold`: `{ rule_id, metric: "severity"|"threshold"|"confidence", delta: -50..50 }`
- `adjust_correlation_window`: `{ window_minutes_delta: -30..120 }`
- `increase_min_link_count`: `{ delta: 1..5 }`
- `suppress_notification_channel`: `{ channel: "email"|"slack"|"webhook"|"pagerduty", duration_minutes: 15..1440 }`

Unsupported action types are rejected.

## Metrics Contract (Aggregate-Only)
`baseline_metrics` must be an object containing only numeric aggregates:
```json
{
  "alerts_total": 1200,
  "alerts_by_severity": { "low": 900, "high": 300 },
  "incidents_total": 35,
  "incidents_by_status": { "open": 10, "resolved": 25 },
  "correlations_total": 80,
  "notifications_total": 500,
  "avg_risk_score": 41.2,
  "window_days": 7
}
```

No raw payloads, no identifiers that can contain PII, and no nested objects beyond aggregate breakdown maps.

## Simulation Flow (Deterministic)
1. API validates auth + workspace + admin role.
2. Create run (`status=running`) storing `baseline_metrics`.
3. Apply actions virtually with deterministic heuristics (no timestamps, no external calls).
4. Compute:
   - `simulated_metrics`
   - `delta_metrics` where positive values indicate improvement (reduction)
   - `overall_effect` classification
5. Persist final run (`status=completed`) or mark as `failed` with safe metadata.

## API (Admin Only)
Routes live under `src/app/api/guardian/remediation/`:
- `POST /api/guardian/remediation/playbooks`
- `GET  /api/guardian/remediation/playbooks`
- `POST /api/guardian/remediation/simulate`
- `GET  /api/guardian/remediation/runs`
- `GET  /api/guardian/remediation/runs/:id`

All requests must include:
- `Authorization: Bearer <JWT>`
- `x-workspace-id: <workspace_uuid>`

### Create Playbook
`POST /api/guardian/remediation/playbooks`
```json
{
  "name": "Reduce noisy alerts",
  "description": "Simulation-only",
  "category": "guardian_core",
  "is_active": true,
  "config": {
    "actions": [
      { "type": "disable_rule", "rule_id": "rule.noisy_001" },
      { "type": "suppress_notification_channel", "channel": "slack", "duration_minutes": 60 }
    ]
  },
  "metadata": { "source": "admin_api" }
}
```

### List Playbooks
`GET /api/guardian/remediation/playbooks?is_active=true&category=guardian_core&limit=50&offset=0`

### Run Simulation
`POST /api/guardian/remediation/simulate`
```json
{
  "playbookId": "00000000-0000-0000-0000-000000000000",
  "baseline_metrics": {
    "alerts_total": 1200,
    "incidents_total": 35,
    "correlations_total": 80,
    "notifications_total": 500,
    "avg_risk_score": 41.2
  }
}
```

### List Runs
`GET /api/guardian/remediation/runs`
`GET /api/guardian/remediation/runs?playbookId=<uuid>`

### Get Run
`GET /api/guardian/remediation/runs/<run_uuid>`

## Safety Guarantees
- Simulation only: writes are limited to `guardian_remediation_playbooks` and `guardian_remediation_simulation_runs`.
- No production Guardian tables are read or modified by the simulator service.
- Aggregate-only metrics: strict schema validation rejects non-aggregate shapes.
- PII-free by convention: metadata is validated to reject unsafe values (e.g., `@` in strings).
- Deterministic outputs from inputs: simulation results depend only on the provided baseline metrics and playbook config (DB timestamps excluded).

