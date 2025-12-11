# Guardian Z03: Editions & Fit Scoring

**Status**: ✅ Complete (editions framework, fit engine, APIs, UI, tests, docs)
**Scope**: Global Guardian edition profiles + per-tenant edition fit snapshots
**Type**: Z-Series (Advisory-only, packaging/positioning layer; no runtime impact)

---

## Overview

Z03 adds **Guardian Editions** — named capability groupings that help tenants understand and plan adoption journeys. Each edition represents a meaningful bundle of Guardian features:

- **Guardian Core**: Rule engine, alerts, incidents (foundation)
- **Guardian Pro**: Core + Risk Engine + QA Simulation (scaling)
- **Guardian Network-Intelligent**: Pro + X-series Network Intelligence (full-stack)
- **Guardian Custom**: Flexible, composable (bespoke needs)

**Key Features**:
- ✅ 4 canonical edition profiles (Core, Pro, Network-Intelligent, Custom)
- ✅ Per-tenant edition fit scoring (0-100, mapped to status buckets)
- ✅ Gap analysis (missing or low-scoring capabilities)
- ✅ Edition-aware uplifting (Z03 + Z02 integration)
- ✅ Advisory-only framing (no licensing or enforcement)
- ✅ Privacy-preserving (no PII, aggregated metrics only)
- ✅ Dashboard with edition cards and fit visualization
- ✅ 30+ comprehensive tests

---

## Architecture

### 1. Edition Profiles

**Schema: `guardian_edition_profiles`**

```sql
CREATE TABLE guardian_edition_profiles (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE,                    -- 'guardian_core', 'guardian_pro', etc.
  label TEXT,                         -- Human-readable name
  description TEXT,                   -- Long-form explanation
  tier TEXT,                          -- 'core' | 'pro' | 'elite' | 'custom'
  category TEXT DEFAULT 'packaging',  -- Always 'packaging'
  capabilities_required TEXT[],       -- Required capability keys
  capabilities_nice_to_have TEXT[],   -- Optional enhancements
  min_overall_score NUMERIC,          -- Min readiness to start this edition
  recommended_overall_score NUMERIC,  -- Target readiness for this edition
  is_default BOOLEAN,                 -- Only one per system
  is_active BOOLEAN,                  -- Can be soft-deleted
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB
);
```

**RLS Policy**: All authenticated users can READ active editions (global reference data); writes disabled via RLS.

**Canonical Editions**:

| Edition | Tier | Min Score | Target Score | Core Capabilities |
|---------|------|-----------|--------------|-------------------|
| **Guardian Core** | core | 0 | 40 | Rules, Alerts, Incidents |
| **Guardian Pro** | pro | 35 | 60 | Core + Risk + QA Simulation |
| **Guardian Network-Intelligent** | elite | 55 | 80 | Pro + X-series Network Intelligence |
| **Guardian Custom** | custom | 0 | 50 | (Configurable) |

### 2. Edition Fit Snapshots

**Schema: `guardian_tenant_edition_fit`**

```sql
CREATE TABLE guardian_tenant_edition_fit (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES workspaces(id),
  edition_key TEXT REFERENCES guardian_edition_profiles(key),
  computed_at TIMESTAMPTZ,

  overall_fit_score NUMERIC,          -- 0..100 weighted fit
  status TEXT,                        -- 'not_started' | 'emerging' | 'aligned' | 'exceeds'

  capability_scores JSONB,            -- { [capKey]: { score, status, weight } }
  gaps JSONB,                         -- [{ capabilityKey, gapType, currentScore, targetScore }]
  recommendations_summary JSONB,      -- High-level linked recommendations

  metadata JSONB
);
```

**RLS Policy**: Tenant-scoped via `tenant_id = get_current_workspace_id()`.

**Status Buckets**:
- **not_started** (0-24): Very few required capabilities configured
- **emerging** (25-59): Initial progress but significant gaps
- **aligned** (60-89): Most required capabilities at acceptable level
- **exceeds** (90-100): Target edition fully realized

### 3. Fit Computation

**Algorithm**:

```typescript
function computeEditionFitForTenant(tenantId, edition, readinessSnapshot):
  1. For each capability in edition.capabilitiesRequired:
     - Check readinessSnapshot for matching capability
     - If missing: gap = 'missing', score = 0
     - If score < tier_threshold: gap = 'low_score', score = actual
     - Else: no gap, score = actual

  2. Aggregate required capabilities with weight 1.0
  3. Add nice-to-have capabilities with weight 0.5
  4. overallFitScore = weighted_avg(all capability scores)
  5. status = mapScoreToBucket(overallFitScore)

  Returns: { editionKey, overallFitScore, status, capabilityScores, gaps }
```

**Tier-Specific Thresholds**:
- Core: Low-score threshold = 40
- Pro: Low-score threshold = 60
- Elite: Low-score threshold = 75
- Custom: Low-score threshold = 50

---

## APIs

### GET /api/guardian/meta/editions

**Purpose**: Retrieve all active Guardian edition profiles

**Response**:
```json
{
  "success": true,
  "data": {
    "editions": [
      {
        "key": "guardian_core",
        "label": "Guardian Core",
        "description": "...",
        "tier": "core",
        "capabilitiesRequired": ["guardian.core.rules", "guardian.core.alerts", "guardian.core.incidents"],
        "capabilitiesNiceToHave": ["guardian.core.risk"],
        "minOverallScore": 0,
        "recommendedOverallScore": 40,
        "isDefault": true
      }
    ],
    "count": 4
  }
}
```

---

### GET /api/guardian/meta/editions/fit

**Purpose**: Retrieve latest edition fit snapshot for a tenant

**Query Parameters**:
- `workspaceId` (required): Tenant identifier

**Response**:
```json
{
  "success": true,
  "data": {
    "computedAt": "2025-12-12T10:00:00Z",
    "editions": [
      {
        "key": "guardian_core",
        "label": "Guardian Core",
        "tier": "core",
        "overallFitScore": 65,
        "status": "aligned",
        "capabilityScores": {
          "guardian.core.rules": { "score": 70, "status": "ready", "weight": 1.0 },
          "guardian.core.alerts": { "score": 60, "status": "partial", "weight": 1.0 },
          "guardian.core.incidents": { "score": 65, "status": "ready", "weight": 1.0 }
        },
        "gaps": [
          { "capabilityKey": "guardian.core.risk", "gapType": "low_score", "currentScore": 30, "targetScore": 60 }
        ]
      }
    ],
    "count": 4
  }
}
```

---

### POST /api/guardian/meta/editions/fit/compute

**Purpose**: Compute and persist edition fit snapshot for a tenant

**Query Parameters**:
- `workspaceId` (required): Tenant identifier

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Edition fit snapshot computed successfully",
    "editions": [...],
    "count": 4,
    "computedAt": "2025-12-12T10:15:00Z"
  }
}
```

---

## UI Integration

### Editions Dashboard

**Location**: `/app/guardian/admin/editions/page.tsx`

**Features**:
- ✅ Grid of edition cards (Core, Pro, Network-Intelligent, Custom)
- ✅ Each card shows: label, tier badge, description, fit progress bar
- ✅ Expandable detail view with gap list
- ✅ "Compute Fit" button to trigger fit snapshot calculation
- ✅ "Generate Uplift Plan" link to navigate to Z02 (optionally filtered by edition)
- ✅ Advisory banner explaining non-binding nature
- ✅ Edition selection guide with recommendations

**Interaction Flow**:
1. User opens Editions page
2. System loads edition profiles (static) and latest fits (from DB)
3. User clicks "Compute Fit" to trigger POST /editions/fit/compute
4. Fits are updated and UI refreshes
5. User clicks edition card to expand and see gaps
6. User clicks "Generate Uplift Plan" to navigate to Z02 Guided Uplift (optionally scoped to this edition)

---

## Z02 Integration (Optional)

**Edition-Aware Uplift Plans**:

When generating an uplift plan from the Editions view, the plan can be:
1. **Edition-scoped**: Only include tasks that address gaps in the chosen edition
2. **Edition-tagged**: Mark generated tasks with `metadata.edition_key` and `metadata.edition_gap_type`
3. **Edition-ranked**: Prioritize playbooks that close edition gaps first

**Example Flow**:
```
User in Editions view
  ↓
Selects Guardian Pro edition
  ↓
Clicks "Generate Uplift Plan"
  ↓
POST /api/guardian/meta/uplift/plans { editionKey: 'guardian_pro' }
  ↓
Service:
  - Loads Pro edition definition
  - Loads latest Pro fit snapshot
  - Prioritizes playbooks addressing Pro gaps
  - Generates tasks tagged with edition_key='guardian_pro'
  ↓
UI shows Guided Uplift with Pro-specific tasks highlighted
```

---

## Services

### editionProfileService.ts

**Functions**:

```typescript
// Load/manage canonical edition profiles
export const GUARDIAN_EDITIONS: GuardianEditionProfileDefinition[]
export function upsertEditionProfiles(): Promise<void>
export function getAllEditionProfiles(): Promise<GuardianEditionProfileDefinition[]>
export function getEditionProfileByKey(key: string): Promise<GuardianEditionProfileDefinition | null>
export function getDefaultEditionProfile(): Promise<GuardianEditionProfileDefinition | null>
```

### editionFitService.ts

**Functions**:

```typescript
// Compute and persist edition fit scores
export function computeEditionFitForTenant(input: GuardianEditionFitInput): GuardianEditionFitResult
export function computeEditionFitSnapshotForTenant(tenantId, editions, now?): Promise<GuardianEditionFitResult[]>
export function persistEditionFitSnapshotForTenant(tenantId, editions, now?): Promise<void>
export function loadLatestEditionFitForTenant(tenantId, editionKey): Promise<GuardianEditionFitResult | null>
export function loadLatestEditionFitsForTenant(tenantId): Promise<GuardianEditionFitResult[]>
```

---

## Testing

**Test File**: `tests/guardian/z03_editions_and_fit_scoring.test.ts`

**Coverage** (30+ tests):
- ✅ Edition profile validation (structure, uniqueness, defaults)
- ✅ Edition tiers and progression (Core → Pro → Elite)
- ✅ Fit computation (scoring, status mapping, gap identification)
- ✅ Tier-specific thresholds (stricter for Pro/Elite)
- ✅ Missing vs. low-score gaps
- ✅ Empty capability snapshots
- ✅ Advisory-only pattern (no auto-enable language)
- ✅ Privacy guardrails (no PII, generic keys)

**Run**:
```bash
npm run test -- z03_editions_and_fit_scoring
```

---

## Privacy & Security

### Non-Breaking, Advisory-Only

- ✅ Editions are descriptive groupings, NOT a licensing system
- ✅ Edition fit shows guidance, NOT enforcement
- ✅ Tenants remain fully in control of feature activation
- ✅ No automatic configuration changes
- ✅ No feature gating based on edition

### Privacy Guarantees

- ✅ No PII in edition definitions or fit gaps
- ✅ Only aggregated metrics (capability scores)
- ✅ Generic capability keys only (no raw logs, no user data)
- ✅ No cross-tenant data leakage (RLS enforcement)
- ✅ Fit snapshots append-only (immutable history)

---

## Deployment Checklist

- [x] Migration 598: Create `guardian_edition_profiles` and `guardian_tenant_edition_fit` tables
- [x] `editionProfileService.ts`: Edition profile definitions and management
- [x] `editionFitService.ts`: Fit computation and scoring
- [x] APIs: GET editions, GET fit, POST compute
- [x] UI: Editions dashboard page
- [x] Tests: 30+ comprehensive tests
- [x] Documentation: This guide

**Deployment Order**:
1. Apply migration 598
2. Deploy edition profile service
3. Deploy fit computation service
4. Deploy APIs
5. Deploy editions UI
6. Run tests to validate
7. Access `/app/guardian/admin/editions` to verify

---

## Future Enhancements

- [ ] AI narrative generation for each edition (Claude Sonnet)
- [ ] Edition-specific onboarding guides and checklists
- [ ] Edition upgrade wizard (step-by-step guidance from Core → Pro)
- [ ] Edition recommendations based on use case/industry
- [ ] Per-edition success metrics and KPIs
- [ ] Edition benchmarking (anonymized peer comparisons)
- [ ] Custom edition builder (drag-drop capability selection)

---

## References

- **Z01**: Capability Manifest & Readiness Scoring
- **Z02**: Guided Uplift Planner & Adoption Playbooks
- **X-Series**: Network Intelligence (telemetry, anomalies, early warnings)
- **G-Series**: Core Guardian (rules, alerts, incidents, risk)
- **I-Series**: QA Chaos Testing

---

*Last Updated: 2025-12-12*
*Z03 Status: Complete with migration, services, APIs, UI, 30+ tests, and full documentation*
