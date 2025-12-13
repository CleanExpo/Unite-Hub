# Guardian GTM-05 — Pricing, Packaging, and Feature Matrix (Display-Only)

## Purpose (Display-Only)
Guardian GTM-05 provides a **display-only** pricing/packaging system for UX, GTM, and sales visibility.

Non-goals (explicit):
- No billing
- No runtime enforcement
- No feature gating

## Concepts
### Plan Tier (per workspace)
Each workspace can be associated with a plan tier:
- `internal`
- `starter`
- `pro`
- `enterprise`

This tier is informational only.

### Feature Catalog (global)
`guardian_feature_catalog` is a global list of features across Guardian modules:
- modules: `G`, `H`, `I`, `Z`, `GTM`
- optional `route` and `docs_ref` for navigation and sales collateral
- optional `requires_keys` for dependencies (display-only)

This table intentionally has **no RLS** and does not gate anything.

### Feature Matrix (per workspace)
`guardian_tier_feature_map` maps global features into a workspace-specific matrix per tier:
- `included` is display-only
- no access enforcement is performed anywhere in code

## Database Objects
Migration: `supabase/migrations/guardian_gtm05_pricing_feature_catalog.sql`

Tables:
- `guardian_plan_tiers` (workspace-scoped, RLS via `get_current_workspace_id()`)
- `guardian_feature_catalog` (global, no RLS)
- `guardian_tier_feature_map` (workspace-scoped, RLS via `get_current_workspace_id()`)

## API (Admin Only)
All routes require:
- `Authorization: Bearer <JWT>`
- `x-workspace-id: <workspace_uuid>`
- workspace role `owner` or `admin`

### Get Workspace Plan
`GET /api/guardian/gtm/plan`

Example response:
```json
{
  "success": true,
  "data": {
    "is_set": true,
    "tier": "pro",
    "record": {
      "workspace_id": "…",
      "tier": "pro",
      "effective_from": "…",
      "set_by": "…",
      "notes": "display only",
      "metadata": {},
      "created_at": "…",
      "updated_at": "…"
    }
  }
}
```

### Set Workspace Plan
`POST /api/guardian/gtm/plan`

Body:
```json
{ "tier": "starter", "notes": "sales-qualified" }
```

### List Feature Catalog
`GET /api/guardian/gtm/features`

Example response:
```json
{
  "success": true,
  "data": {
    "features": [
      { "key": "i04.remediation.simulator", "module": "I", "name": "Remediation Simulator", "description": "…", "route": null, "docs_ref": null, "requires_keys": [], "is_available": true, "created_at": "…", "updated_at": "…" }
    ],
    "total": 1
  }
}
```

### Get Workspace Feature Matrix
`GET /api/guardian/gtm/features/matrix`

Response shape:
- `tiers[]` in deterministic order: `internal`, `starter`, `pro`, `enterprise`
- `features[]` in deterministic order: by `module`, then `key`

## Safety Guarantee
GTM-05 is display-only:
- It does not block or allow access to any Guardian capability.
- It does not bill users.
- It does not enforce tier entitlements at runtime.

