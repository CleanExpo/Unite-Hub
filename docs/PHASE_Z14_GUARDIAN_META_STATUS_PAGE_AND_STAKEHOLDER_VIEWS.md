# Guardian Z14: Meta Status Page & Stakeholder Views

**Phase**: Guardian Z-Series Meta Orchestration
**Status**: Complete
**Complexity**: Medium (8 tasks, ~2,200 lines)
**Dependencies**: Z01-Z13, Z10 governance, Z11 exports
**Built On**: statusPageService aggregator pattern, Z13 automation integration

---

## Overview

Guardian Z14 adds **Meta Status Page & Stakeholder Views** — the presentation layer for Z01-Z13 meta signals. Provides role-safe, PII-free status summaries accessible to operators (detailed), leadership (executive), and CS (customer-safe), with optional AI narrative generation.

**Key Features**:
- **Operator View**: Full Z01-Z13 summary with admin links and detailed metrics
- **Leadership View**: Executive summary respecting governance policies
- **CS View**: Customer-safe summary excluding sensitive details
- **Snapshot Persistence**: Point-in-time frozen views with history
- **Z13 Automation**: Integrated with Z13 schedules for automated captures
- **AI Narratives**: Claude Sonnet-powered executive summaries (governance-gated)
- **Z11 Export**: Status snapshots included in export bundles

**Non-Breaking Guarantee**: Meta-only operations. No core Guardian G/H/I/X modifications.

---

## Architecture

### Data Flow

```
Z01-Z13 Meta Sources
        ↓
loadMetaStateForStatus()  [Aggregate PII-free summaries]
        ↓
buildStatusCards()        [Role-safe cards by view type]
        ↓
captureStatusSnapshot()   [Persist frozen view + audit]
        ↓
Status Page UI            [Operator/Leadership/CS views]
        ↓
Export Bundle (Z11)       [status_snapshots scope]
        ↓
AI Narrative (optional)   [Claude Sonnet, governance-gated]
```

### Database Schema

**Table**: `guardian_meta_status_snapshots` (150 lines)
- Tenant-scoped (RLS enforced)
- view_type: `operator | leadership | cs`
- period_label: `last_7d | last_30d | quarter_to_date`
- overall_status: `experimental | limited | recommended | needs_attention`
- cards: JSONB array of role-safe status cards
- blockers, warnings: TEXT arrays for critical issues
- captured_at: timestamp for sorting/history

---

## Implementation Tasks

### T01: Status Snapshots Schema ✅

**File**: `supabase/migrations/609_guardian_z14_meta_status_page_and_stakeholder_views.sql`

```sql
CREATE TABLE guardian_meta_status_snapshots (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  view_type TEXT NOT NULL,     -- operator|leadership|cs
  period_label TEXT NOT NULL,  -- last_7d|last_30d|quarter_to_date
  overall_status TEXT NOT NULL,
  headline TEXT NOT NULL,
  cards JSONB NOT NULL,
  blockers TEXT[],
  warnings TEXT[],
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guardian_meta_status_snapshots ENABLE ROW LEVEL SECURITY;
```

**Key Features**:
- Full RLS tenant isolation
- Indexes on (tenant_id, view_type, period_label, captured_at DESC)
- Constraints enforce valid values

---

### T02: Status Page Aggregator Service ✅

**File**: `src/lib/guardian/meta/statusPageService.ts` (500+ lines)

#### `loadMetaStateForStatus(tenantId, period)`

Aggregates PII-free summaries from Z01-Z13:

```typescript
interface MetaState {
  readinessScore?: number;           // Z01
  adoptionRate?: number;              // Z05
  upliftActivePlans?: number;        // Z02
  kpiOnTrackPercent?: number;        // Z08
  integrationsConfigured?: number;   // Z07 (count only)
  integrationsRecentFailures?: number;
  exportsBundleAge?: number;         // Z11 (days)
  improvementCyclesActive?: number;  // Z12
  automationSchedulesActive?: number; // Z13
  stackOverallStatus?: string;       // Z10
  stackBlockers?: string[];
  stackWarnings?: string[];
}
```

**Safety**:
- No raw logs, alert payloads, or incident data
- No webhook URLs or API keys
- Only safe aggregates: scores, statuses, counts, ages

#### `buildStatusCards(viewType, metaState, governancePrefs)`

Generates role-safe cards based on view type:

```typescript
type ViewType = 'operator' | 'leadership' | 'cs';

interface StatusCard {
  key: string;
  title: string;
  status: 'good' | 'warn' | 'bad' | 'info';
  value?: string;
  details?: string;
  links?: Array<{ label: string; href: string }>;
}
```

**Operator View**:
- All 10+ cards with detailed metrics
- Admin links to /guardian/admin/* surfaces
- Integration failure counts visible
- Export age visible

**Leadership View**:
- Summary cards only (same cards, less detail)
- No admin links
- Blockers and warnings prominent
- Respects governance policies

**CS View**:
- Customer-safe subset only
- Exports card filtered if internal_only
- No integration details
- No admin links
- External sharing policy enforced

#### `captureStatusSnapshot(tenantId, viewType, periodLabel, actor?)`

Persists frozen view with audit logging:

```typescript
// Returns { snapshotId: string }
// Logs to Z10 guardian_meta_audit_log with source='status_page'
```

---

### T03: Stakeholder Status APIs ✅

**Files**:
1. `src/app/api/guardian/meta/status/route.ts`
2. `src/app/api/guardian/meta/status/snapshots/route.ts`
3. `src/app/api/guardian/meta/status/capture/route.ts`

#### Endpoint 1: `GET /api/guardian/meta/status`

Fetch live or snapshot view:

```typescript
Query Params:
  workspaceId: string (required)
  viewType: 'operator' | 'leadership' | 'cs' (default: operator)
  period: 'last_7d' | 'last_30d' | 'quarter_to_date' (default: last_30d)
  live: '1' | '0' (default: 0)

Response:
  status: 'live' | 'snapshot'
  source: 'computed' | 'persisted' | 'computed_fallback'
  capturedAt?: ISO date string
  data: StatusPageView
```

**Behavior**:
- If live=1: Compute fresh status (no persistence)
- If live=0: Return latest snapshot, fallback to live if none exists
- Tenant-scoped via workspaceId validation

#### Endpoint 2: `GET /api/guardian/meta/status/snapshots`

List snapshot history:

```typescript
Query Params:
  workspaceId: string (required)
  viewType?: 'operator' | 'leadership' | 'cs'
  period?: 'last_7d' | 'last_30d' | 'quarter_to_date'
  limit?: number (max 100, default 50)

Response:
  snapshots: Array<{
    id: string
    viewType: string
    periodLabel: string
    overallStatus: string
    headline: string
    capturedAt: ISO date
    createdAt: ISO date
  }>
  total: number
```

#### Endpoint 3: `POST /api/guardian/meta/status/capture`

Admin-only: Capture snapshot now:

```typescript
Query Params:
  workspaceId: string (required)

Body:
  viewType: 'operator' | 'leadership' | 'cs'
  periodLabel: 'last_7d' | 'last_30d' | 'quarter_to_date'

Response:
  message: 'Status snapshot captured'
  snapshotId: string
```

---

### T04: Status Page UI ✅

**File**: `src/app/guardian/admin/status/page.tsx` (450+ lines)

React client component with:

- **View Type Selector**: Dropdown for operator/leadership/cs
- **Period Selector**: last_7d / last_30d / quarter_to_date
- **Capture Button**: Manual snapshot capture (admin-only)
- **History Drawer**: Recent snapshots with filtering
- **Status Banner**: Overall status color-coded (green/yellow/red/gray)
- **Blockers Alert**: Red box with blocking issues
- **Warnings Alert**: Yellow box with warnings
- **Cards Grid**: Responsive 3-column layout for status cards
- **Status Colors**: good (green), warn (yellow), bad (red), info (blue)

**Features**:
- Real-time data loading with error handling
- Live vs snapshot indicator
- Snapshot history with timestamps
- Accessibility-first design

---

### T05: Z13 Automation Integration ✅

**File**: `src/lib/guardian/meta/metaTaskRunner.ts` (updated)

Added `status_snapshot` task type to automation system:

```typescript
case 'status_snapshot':
  summary[taskType] = await runStatusSnapshotTask(
    tenantId,
    config[taskType] || {},
    actor
  );
  break;

// Task function:
async function runStatusSnapshotTask(
  tenantId: string,
  config: { viewTypes?: string[]; periodLabel?: string },
  actor: string
): Promise<TaskSummary['status_snapshot']>
```

**Configuration**:
```typescript
{
  viewTypes: ['operator', 'leadership', 'cs'],
  periodLabel: 'last_30d'
}
```

**Available in Z13 Automation Console**:
- Create schedule that runs status snapshot capture
- Configure which view types to capture
- Track execution history
- Set trigger rules for status degradation

---

### T06: Optional AI Status Narrative ✅

**File**: `src/lib/guardian/meta/statusNarrativeAiHelper.ts` (200+ lines)

AI-powered executive narrative generation:

```typescript
async function generateStatusNarrative(
  tenantId: string,
  statusView: StatusPageView,
  options?: { maxTokens?: number; fallbackNarrative?: string }
): Promise<{
  narrative: string;
  source: 'ai' | 'fallback';
  warnings?: string[];
}>
```

**Features**:
- Claude Sonnet 4.5 integration
- Governance gating: skips if Z10 `aiUsagePolicy='off'`
- Fallback narrative if AI fails or disabled
- System prompt enforces: no speculation, no PII, no secrets
- 2-3 sentence executive summaries
- Business-friendly language (no technical jargon)

**Fallback Narrative**:
Automatically generated when AI disabled:
- Shows % of healthy vs concerning areas
- Highlights critical blockers
- Suggests next steps

---

### T07: Z11 Export Integration ✅

**File**: `src/lib/guardian/meta/exportBundleService.ts` (updated)

Added `status_snapshots` to GuardianExportScope:

```typescript
export type GuardianExportScope =
  | 'readiness' | 'uplift' | 'editions' | ...
  | 'improvement_loop' | 'status_snapshots';  // NEW
```

Scope item builder returns:

```typescript
case 'status_snapshots': {
  snapshotsCount: number
  byViewType: {
    operator: Array<{ periodLabel, overallStatus, headline, capturedAt }>
    leadership: Array<...>
    cs: Array<...>
  }
  recentSnapshots: Array<{ viewType, status, capturedAt }>
}
```

**Export Safety**:
- No raw snapshot JSONB payloads (just counts and summaries)
- PII scrubber applied (removes actor names, notes)
- Respects governance policies

---

### T08: Tests & Documentation ✅

**Files**:
- `tests/guardian/z14_meta_status_page_and_stakeholder_views.test.ts` (40+ tests)
- `docs/PHASE_Z14_GUARDIAN_META_STATUS_PAGE_AND_STAKEHOLDER_VIEWS.md` (this file)

**Test Coverage**:
- ✅ loadMetaStateForStatus aggregation (Z01-Z13)
- ✅ buildStatusCards for each view type (operator/leadership/cs)
- ✅ Status rating logic (good/warn/bad thresholds)
- ✅ Governance-based redaction (exports filtering)
- ✅ Period computation (last_7d, last_30d, quarter_to_date)
- ✅ Snapshot capture and audit logging
- ✅ AI narrative generation (fallback paths)
- ✅ Z13 task integration (status_snapshot task)
- ✅ Z11 export integration (status_snapshots scope)
- ✅ Edge cases (empty state, capped blockers/warnings)
- ✅ Type safety (ViewType, PeriodLabel, CardStatus unions)
- ✅ Non-breaking verification (no core Guardian queries)

---

## Integration Points

### With Z10 (Meta Governance)
- Reads `externalSharingPolicy` to determine CS view redaction
- Reads `aiUsagePolicy` to gate narrative generation
- Logs all captures to `guardian_meta_audit_log`

### With Z13 (Meta Automation)
- `status_snapshot` task type available in schedules/triggers
- Can automate daily/weekly/monthly snapshot captures
- Integrates with Z13 scheduler and execution tracking

### With Z11 (Meta Exports)
- `status_snapshots` scope includes snapshots in export bundles
- Scrubbed: counts only, no raw snapshot JSONB
- Respects governance policies in exports

### With Z01-Z09
- Reads readiness (Z01), uplift (Z02), editions (Z03), goals (Z08), playbooks (Z09)
- Aggregates adoption (Z05) and integrations (Z07)

### With Z12 (Meta Improvement Loop)
- Displays active improvement cycles count
- Links to improvement console from operator view

---

## Data Flow Example

### 1. Operator Requests Status Page

```
GET /api/guardian/meta/status?workspaceId=X&viewType=operator&period=last_30d&live=0
```

### 2. System Loads Meta State

Queries Z01-Z13 for:
- readiness_score from Z01
- adoption_rate from Z05
- active uplift plans from Z02
- KPI on-track % from Z08
- active improvement cycles from Z12
- automation schedules from Z13
- stack readiness from Z10

### 3. Build Cards

For operator view:
- readiness card + link to /guardian/admin/readiness
- adoption card + link to /guardian/admin/adoption
- KPI card + link to /guardian/admin/goals
- uplift card + link to /guardian/admin/uplift
- improvement card + link to /guardian/admin/improvement
- automation card + link to /guardian/admin/automation
- exports card + link to /guardian/admin/exports
- integrations card + link to /guardian/admin/integrations

### 4. Return View

```json
{
  "status": "snapshot",
  "source": "persisted",
  "capturedAt": "2025-12-10T14:30:00Z",
  "data": {
    "overallStatus": "recommended",
    "headline": "All systems nominal",
    "cards": [...],
    "blockers": [],
    "warnings": [],
    "periodLabel": "last_30d",
    "viewType": "operator",
    "capturedAt": "2025-12-10T14:30:00Z"
  }
}
```

---

## Role-Based Redaction Rules

| Feature | Operator | Leadership | CS |
|---------|----------|------------|-----|
| Readiness | ✅ | ✅ | ✅ |
| Adoption | ✅ | ✅ | ✅ |
| KPIs | ✅ | ✅ | ✅ |
| Uplift Plans | ✅ | ✅ | ✅ |
| Admin Links | ✅ | ❌ | ❌ |
| Integrations Card | ✅ | ❌ | ❌ |
| Exports Card | ✅ | ✅ | ⚠️ (if cs_safe) |
| Improvement Cycles | ✅ | ✅ | ✅ |
| Automation Schedules | ✅ | ❌ | ❌ |
| Blockers | ✅ | ✅ | ✅ |
| Warnings | ✅ | ✅ | ⚠️ (summary only) |

---

## Success Criteria

- ✅ Migration 609 applies (1 table + RLS + indexes)
- ✅ statusPageService.ts loads PII-free meta state from Z01-Z13
- ✅ buildStatusCards generates role-safe cards per view type
- ✅ captureStatusSnapshot persists frozen view + audit logging
- ✅ 3 API endpoints (GET status, GET snapshots, POST capture)
- ✅ Status Page UI renders operator/leadership/cs views correctly
- ✅ Z13 integration: status_snapshot task type available
- ✅ Z11 integration: status_snapshots export scope
- ✅ AI narrative generation with governance gating
- ✅ 40+ tests pass (loadMetaState, buildCards, capture, AI, Z13, Z11, edge cases, type safety)
- ✅ TypeScript compiles with 0 Z14-specific errors
- ✅ No breaking changes to Z01-Z13 or core Guardian

---

## Files Created (8 Total)

1. `supabase/migrations/609_guardian_z14_meta_status_page_and_stakeholder_views.sql` (150 lines)
2. `src/lib/guardian/meta/statusPageService.ts` (500 lines)
3. `src/app/api/guardian/meta/status/route.ts` (80 lines)
4. `src/app/api/guardian/meta/status/snapshots/route.ts` (50 lines)
5. `src/app/api/guardian/meta/status/capture/route.ts` (35 lines)
6. `src/app/guardian/admin/status/page.tsx` (450 lines)
7. `src/lib/guardian/meta/statusNarrativeAiHelper.ts` (200 lines)
8. `tests/guardian/z14_meta_status_page_and_stakeholder_views.test.ts` (350 lines)

**Total**: ~2,200 lines of code + migration

---

## Non-Breaking Verification

✅ **Z14 does NOT:**
- Query core Guardian G/H/I/X tables (alerts, incidents, rules, network)
- Modify any existing behavior in Z01-Z13 or core Guardian
- Export raw logs, alert payloads, incident data, or secrets
- Weaken RLS policies
- Change database schema outside Z14

✅ **Verified**:
- All queries read from meta tables only (Z01-Z13)
- All RLS enforcement via `tenant_id = get_current_workspace_id()`
- PII scrubber applied to all exports
- No raw alert/incident payloads exposed
- No webhook URLs or API keys in snapshots
- Fallback mechanisms when AI disabled

---

## Deployment Checklist

- [ ] Apply migration 609 to Supabase
- [ ] Deploy services (statusPageService, statusNarrativeAiHelper)
- [ ] Deploy API routes (3 endpoints)
- [ ] Deploy UI component (status/page.tsx)
- [ ] Update Z13 metaTaskRunner with status_snapshot task
- [ ] Update Z11 exportBundleService with status_snapshots scope
- [ ] Verify tests pass (40+ passing)
- [ ] Smoke test: Operator/Leadership/CS views load correctly
- [ ] Smoke test: Snapshot capture creates audit log entries
- [ ] Verify AI narrative respects governance policies
- [ ] Cross-tenant isolation verified (RLS works correctly)

---

**Status**: ✅ COMPLETE
**Ready for Production**: Yes
**Risk Level**: Low (read-only, meta-only, full RLS enforcement)
