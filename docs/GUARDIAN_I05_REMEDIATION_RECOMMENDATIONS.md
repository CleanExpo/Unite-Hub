# Guardian I05 — Remediation Effectiveness Scoring + Recommendation Engine

## Purpose
Guardian I05 ranks remediation playbooks using deterministic scoring derived **only** from I04 simulation outcomes. It produces explainable, workspace-scoped recommendations using **aggregate delta metrics only**.

## Inputs (Read-Only)
I05 reads only:
- `guardian_remediation_playbooks`
- `guardian_remediation_simulation_runs` (completed runs only)

I05 does **not** read Guardian production event tables.

## Output (New Table)
I05 writes only to:
- `guardian_remediation_recommendations`

No I04 simulation data is mutated.

## Tenancy & RLS
- Workspace-scoped via `workspace_id` (maps to `workspaces.id`).
- RLS enforced via `get_current_workspace_id()`:
  - `workspace_id = get_current_workspace_id()`

## Schema: `guardian_remediation_recommendations`
Each row represents a scored recommendation for a specific completed simulation run.
- `id` (uuid)
- `workspace_id` (uuid)
- `playbook_id` (uuid)
- `simulation_run_id` (uuid)
- `score` (0–100)
- `confidence` (0–1)
- `effect` (`positive` | `neutral` | `negative`)
- `rationale` (deterministic, human-readable, PII-free)
- `metrics_snapshot` (jsonb, delta-only aggregates)
- `created_at` (timestamptz)

Indexes:
- by workspace: `(workspace_id)`
- by workspace + score: `(workspace_id, score desc)`

## Scoring (Deterministic)
Inputs:
- `delta_metrics` (aggregate deltas + percentages)
- `overall_effect`

Principles:
- Weight reductions in `alerts` and `incidents` higher than `notifications`.
- Penalize degradations (negative deltas / negative overall effect).
- Normalize to `0..100`.
- Confidence increases with:
  - magnitude of improvement/degradation, and
  - consistency across key metrics (alerts/incidents/risk).

No randomness. No ML.

## Services
Implemented in `src/lib/guardian/remediationRecommendationsService.ts`:
- `generateRecommendations(workspaceId, hours = 24)`
  - reads completed runs in the time window
  - computes score/confidence/effect/rationale from deltas
  - upserts recommendations (idempotent per simulation run)
  - returns ranked recommendations
- `listRecommendations(workspaceId)`
  - returns top 100 recommendations ordered by score/confidence/created_at

## Admin API (Bearer JWT + x-workspace-id required)
Routes live under `src/app/api/guardian/remediation/recommendations/` and require workspace role `owner` or `admin`.

### Generate
`POST /api/guardian/remediation/recommendations/generate`

Body (optional):
```json
{ "hours": 24 }
```

Response:
```json
{
  "success": true,
  "data": {
    "generated": 12,
    "recommendations": [ /* ranked */ ]
  }
}
```

### List
`GET /api/guardian/remediation/recommendations`

Response:
```json
{
  "success": true,
  "data": {
    "recommendations": [ /* ranked */ ]
  }
}
```

## Safety Guarantees
- Only aggregate delta metrics are stored (`metrics_snapshot`).
- No raw events/payloads; no user identifiers; no PII.
- I04 simulation tables are read-only for I05 (no updates/deletes).
- Deterministic scoring and rationale generation from stored simulation aggregates.

