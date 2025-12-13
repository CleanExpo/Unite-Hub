# Guardian I07 — Recommendation Lifecycle & Resolution Engine

## Purpose
Guardian I07 closes the loop for I05 remediation recommendations by recording a **human-decision lifecycle state**:
- open
- accepted
- rejected
- expired
- superseded

This phase introduces **no automation** beyond an explicit, admin-triggered expiry operation and performs **no enforcement**.

## Inputs (Read-Only)
- `guardian_remediation_recommendations` (I05)
- `guardian_remediation_recommendation_impacts` / `guardian_remediation_drift_events` (I06) (optional consumers)

## Output (New Table Only)
- `guardian_remediation_recommendation_lifecycle` (I07)

No writes to Guardian production tables.

## Tenancy & RLS
Workspace-scoped via `workspace_id` with RLS enforced by `get_current_workspace_id()`.

## Lifecycle States
- `open` (default)
- `accepted` (human decision)
- `rejected` (human decision)
- `superseded` (human decision; requires `superseded_by`)
- `expired` (system-initiated only via explicit expire endpoint)

## Allowed Transitions
```
open -> accepted
open -> rejected
open -> superseded
open -> expired
```

## Rules
- Default status is `open` on lifecycle creation.
- `accepted` / `rejected` require `decided_at` and `decided_by`.
- `superseded` requires `superseded_by`.
- `expired` is system-initiated only (via explicit expire endpoint; default threshold is 90 days).
- Terminal states are immutable: once not `open`, status cannot change again.

## Services
Implemented in `src/lib/guardian/remediationLifecycleService.ts`:
- `ensureLifecycle(workspaceId, recommendationId)`
- `decideRecommendation(workspaceId, recommendationId, { status, reason?, notes?, decidedBy })`
- `supersedeRecommendation(workspaceId, oldRecommendationId, newRecommendationId)`
- `expireStaleRecommendations(workspaceId, days = 90)`
- `listLifecycle(workspaceId, status?)`

## Admin API (Bearer JWT + x-workspace-id required)
Admin-only (workspace role `owner` or `admin`), via `requireExecutionContext()` contract.

Routes:
- `GET  /api/guardian/remediation/lifecycle?status=open`
- `POST /api/guardian/remediation/lifecycle/decide`
- `POST /api/guardian/remediation/lifecycle/expire`
- `POST /api/guardian/remediation/lifecycle/supersede`

## Safety Notes
- Human-decision only: no auto-acceptance and no auto-apply.
- No production Guardian mutations.
- Workspace-scoped; RLS enforced.
- No PII: `decided_by` stores actor id only; free-text fields reject `@`.

