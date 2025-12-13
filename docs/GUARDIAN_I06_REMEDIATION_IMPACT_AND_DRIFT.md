# Guardian I06 — Recommendation Impact Tracking + Drift Detection

## Purpose
Guardian I06 tracks whether I05 remediation recommendations remain effective over time by recording **append-only** snapshots and detecting deterministic drift:
- score decay
- confidence drop
- effect flips
- staleness (no recent simulation)

This layer is **simulation-only** and performs **no enforcement**.

## Inputs (Read-Only)
I06 reads only:
- `guardian_remediation_simulation_runs` (I04)
- `guardian_remediation_recommendations` (I05)

No Guardian production event tables are read.

## Outputs (New, Append-Only)
I06 writes only:
- `guardian_remediation_recommendation_impacts`
- `guardian_remediation_drift_events`

I04 and I05 tables are never mutated by I06.

## Tenancy & RLS
Workspace-scoped via `workspace_id`:
- RLS enforced by `get_current_workspace_id()`
- All access requires `workspace_id = get_current_workspace_id()`

## Tables

### A) `guardian_remediation_recommendation_impacts`
Time-series snapshots of recommendation state.
- `workspace_id` (uuid)
- `recommendation_id` (uuid)
- `observed_at` (timestamptz)
- `score_at_time` (0–100)
- `confidence_at_time` (0–1, numeric(3,2))
- `effect` (`positive` | `neutral` | `negative`)
- `metrics_snapshot` (jsonb, aggregate deltas only)
- `created_at` (timestamptz)

Index:
- `(workspace_id, recommendation_id, observed_at desc)`

### B) `guardian_remediation_drift_events`
Drift signals derived from snapshots + freshness checks.
- `workspace_id` (uuid)
- `recommendation_id` (uuid)
- `detected_at` (timestamptz)
- `drift_type` (`score_decay` | `confidence_drop` | `effect_flip` | `stale`)
- `severity` (`low` | `medium` | `high`)
- `description` (text, deterministic)
- `metadata` (jsonb, aggregate-only + thresholds, PII-free)
- `created_at` (timestamptz)

Indexes:
- `(workspace_id, detected_at desc)`
- `(workspace_id, drift_type)`

## Data Flow
1. `recordImpactSnapshot(workspaceId)`
   - reads current I05 recommendations for the workspace
   - appends one impact snapshot per recommendation at `observed_at=now()`
2. `detectDrift(workspaceId)`
   - compares latest vs previous snapshot per recommendation
   - appends drift events when thresholds are crossed
   - checks simulation freshness per recommendation’s `playbook_id` using I04 completed runs

## Drift Rules (Deterministic)

| Rule | Condition | Severity |
|------|-----------|----------|
| Score decay | drop ≥ 15 points | medium |
| Score decay | drop ≥ 30 points | high |
| Confidence drop | drop ≥ 0.2 | medium |
| Confidence drop | drop ≥ 0.4 | high |
| Effect flip | positive → neutral/negative | high |
| Stale | no completed simulation run in ≥ 30 days | medium |
| Stale | no completed simulation run in ≥ 60 days | high |

## Services
Implemented in `src/lib/guardian/remediationImpactService.ts`:
- `recordImpactSnapshot(workspaceId)`
- `detectDrift(workspaceId)`
- `listImpacts(workspaceId, recommendationId)`
- `listDriftEvents(workspaceId, hours?)`

## Admin API (Bearer JWT + x-workspace-id required)
Admin-only (workspace role `owner` or `admin`), via `requireExecutionContext()` contract.

Routes:
- `POST /api/guardian/remediation/impact/record`
- `POST /api/guardian/remediation/impact/detect-drift`
- `GET  /api/guardian/remediation/impact?recommendationId=<uuid>`
- `GET  /api/guardian/remediation/drift?hours=168`

## Safety Guarantees
- Aggregate metrics only (delta snapshots only).
- Append-only I06 tables; no mutation of I04/I05 rows.
- No auto-remediation and no writes to Guardian production tables.
- Deterministic drift detection (pure arithmetic comparisons).

