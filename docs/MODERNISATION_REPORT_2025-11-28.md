# Unite-Hub Global API Modernisation Report

**Generated**: 2025-11-28
**Scope**: API modernisation, workspace-scoped RLS, ML Observability Layer
**Previous Report**: STABILITY_REPORT_2025-11-28.md

---

## Migration Error Resolution

### Root Cause Analysis

**Original Errors**:
1. **Migration 314**: `permission denied for schema auth` - Created functions in `auth` schema
2. **Migration 315**: `column up.role does not exist` - Referenced non-existent `user_profiles.role`

**Root Cause**: Writing SQL based on assumptions instead of checking actual schema.

**Fixes Applied**:
- Moved all functions to `public` schema
- Changed `user_profiles.role` to `profiles.role` (which uses `user_role` ENUM)
- Updated role checks to use `'ADMIN', 'FOUNDER'` (uppercase, matching ENUM)

**Prevention Strategy Implemented**:
1. Created `.claude/SCHEMA_REFERENCE.md` with actual schema documentation
2. Added mandatory schema check to `CLAUDE.md`
3. Pre-migration checklist to verify tables/columns exist

---

## Executive Summary

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Legacy supabaseBrowser Usage | 271 occurrences | Pattern established | In Progress |
| Workspace-Scoped RLS | None | Migration 314 ready | Pending Apply |
| ML Observability | None | Full layer created | Implemented |
| API Validation | Minimal | Zod infrastructure | Implemented |
| Hydration Issues | Flash visible | isHydrated fix | Implemented |

---

## Infrastructure Created

### 1. Zod Validation Schemas (`src/lib/validation/schemas.ts`)

**New Helpers Added**:
```typescript
// Safe parse request body with typed response
safeParseBody<T>(req: Request, schema: T)

// Safe parse URL search params
safeParseParams<T>(searchParams: URLSearchParams, schema: T)
```

**New Schemas Added**:
- `WorkspaceScopedSchema` - Base schema for all workspace operations
- `PaginationSchema` - Standard pagination params
- `CreateContactSchema` / `UpdateContactSchema`
- `CreateCampaignSchema` / `UpdateCampaignSchema`
- `SendEmailSchema` - Email sending validation
- `GenerateContentSchema` - AI content generation
- `AgentActionSchema` - AI agent operations
- `SearchSchema` - Search operations

---

### 2. ML Observability Layer (`src/lib/observability/`)

**Components**:

| File | Purpose |
|------|---------|
| `mlDetector.ts` | Core ML-based anomaly detection engine |
| `middleware.ts` | API route wrapper with observability |
| `index.ts` | Module exports |

**Features**:
- Real-time latency spike detection (3-sigma rule)
- Error rate anomaly detection (baseline comparison)
- In-memory metrics buffer (10,000 entries)
- Automatic baseline learning
- Health score calculation (0-100)
- Prometheus-compatible metrics export

**Key Functions**:
```typescript
// Record API request metrics
mlDetector.recordRequest(metrics: RequestMetrics)

// Get system health score
mlDetector.getHealthScore(): HealthScore

// Get recent anomalies
mlDetector.getRecentAnomalies(limit: number): AnomalyDetection[]

// Route performance summary
mlDetector.getRoutePerformance(): Map<string, PerformanceStats>
```

**Middleware Usage**:
```typescript
import { withObservability } from '@/lib/observability';

export const GET = withObservability(
  async (req, { user, supabase }) => {
    // Route logic with automatic auth + metrics
    return NextResponse.json(data);
  },
  { routeName: '/api/contacts' }
);
```

---

### 3. Migration 314: Workspace-Scoped RLS

**File**: `supabase/migrations/314_workspace_scoped_rls.sql`

**Helper Functions Created**:
```sql
-- Check if user is member of workspace
auth.is_workspace_member(workspace_id UUID) -> BOOLEAN

-- Get all workspace IDs user belongs to
auth.get_user_workspaces() -> SETOF UUID

-- Check if user is admin/owner of workspace
auth.is_workspace_admin(workspace_id UUID) -> BOOLEAN
```

**Tables with Workspace-Scoped Policies**:
- `contacts` - Full CRUD scoped to workspace membership
- `emails` - SELECT/INSERT/UPDATE scoped to workspace
- `campaigns` - Full CRUD (DELETE requires admin)
- `drip_campaigns` - Full CRUD (DELETE requires admin)
- `generatedContent` - SELECT/INSERT/UPDATE scoped
- `integrations` - Full access (manage requires admin)
- `leads` - Full CRUD (DELETE requires admin)
- `clients` - Full CRUD (DELETE requires admin)
- `client_actions` - Access via client's workspace

**Admin-Only Tables**:
- `admin_approvals` - ADMIN/FOUNDER roles only
- `admin_trusted_devices` - Own devices or ADMIN/FOUNDER

---

### 4. Migration 315: Observability Tables

**File**: `supabase/migrations/315_observability_tables.sql`

**Tables Created**:

| Table | Purpose |
|-------|---------|
| `observability_logs` | API request metrics storage |
| `observability_anomalies` | Detected anomalies |
| `observability_health_snapshots` | Periodic health scores |
| `observability_route_baselines` | Learned route baselines |

**Indexes Optimized For**:
- Time-series queries (created_at DESC)
- Route lookup (route_path, method)
- Error filtering (status_code >= 400)
- Unresolved anomaly queries

**Cleanup Function**:
```sql
-- Remove logs older than N days (default 7)
cleanup_old_observability_logs(days_to_keep INTEGER)
```

---

### 5. AuthContext Hydration Fix

**File**: `src/contexts/AuthContext.tsx`

**Changes**:
- Added `isHydrated` state to track client-side hydration
- Exposed in context for components to check hydration status
- Prevents SSR/CSR mismatch flash during initial render

**Usage**:
```typescript
const { loading, isHydrated } = useAuth();

// Don't render until hydrated to prevent flash
if (!isHydrated) return null;

// Then check loading state
if (loading) return <LoadingSpinner />;
```

---

## API Route Modernisation Pattern

### Before (Legacy Pattern):
```typescript
import { supabaseBrowser } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    // ...
  }

  // No validation, no observability, no standardization
}
```

### After (Modern Pattern):
```typescript
import { withObservability, ok, badRequest } from '@/lib/observability';
import { safeParseBody, WorkspaceScopedSchema } from '@/lib/validation/schemas';

export const GET = withObservability(
  async (req, { user, supabase }) => {
    // Automatic auth handling via middleware
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    // Automatic metrics collection
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) return badRequest(error.message);

    return ok(data);
  },
  { routeName: '/api/contacts' }
);
```

---

## Legacy Route Analysis

**Total API Routes**: 104+
**Routes Using supabaseBrowser**: 100 files (271 occurrences)

**Categories**:
- Agent routes (`/api/agents/*`) - 8 files
- Auth routes (`/api/auth/*`) - 5 files
- Campaign routes (`/api/campaigns/*`) - 12 files
- Contact routes (`/api/contacts/*`) - 8 files
- Content routes (`/api/content/*`) - 4 files
- Email routes (`/api/emails/*`) - 6 files
- Integration routes (`/api/integrations/*`) - 15+ files
- Other routes - 40+ files

**Migration Priority**:
1. **P0** - Auth routes (security critical)
2. **P1** - Agent routes (high traffic)
3. **P2** - Campaign/Contact routes (core business)
4. **P3** - Integration routes (third-party)
5. **P4** - Other routes (lower priority)

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/observability/mlDetector.ts` | 340 | ML anomaly detection |
| `src/lib/observability/middleware.ts` | 160 | API middleware |
| `src/lib/observability/index.ts` | 25 | Module exports |
| `supabase/migrations/314_workspace_scoped_rls.sql` | 200 | Workspace RLS |
| `supabase/migrations/315_observability_tables.sql` | 140 | Observability tables |

**Total New Code**: ~865 lines

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/validation/schemas.ts` | Added 150+ lines of API schemas |
| `src/contexts/AuthContext.tsx` | Added isHydrated state |

---

## Migration Instructions

### Step 1: Apply Database Migrations

Run in Supabase SQL Editor in order:

1. **Migration 314** - Workspace-Scoped RLS
   ```sql
   -- Copy contents of 314_workspace_scoped_rls.sql
   -- Run in SQL Editor
   ```

2. **Migration 315** - Observability Tables
   ```sql
   -- Copy contents of 315_observability_tables.sql
   -- Run in SQL Editor
   ```

### Step 2: Verify Migrations

```sql
-- Check helper functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'is_workspace%';

-- Check observability tables exist
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'observability%';
```

### Step 3: Migrate API Routes (Incremental)

Routes can be migrated incrementally using the new pattern. Start with high-priority routes.

---

## Remaining Work

### P0 - Critical (This Sprint)
1. Apply migrations 314-315 to Supabase
2. Test workspace isolation with multiple users
3. Verify observability metrics collection

### P1 - High Priority (Next Sprint)
1. Migrate remaining 100 API routes to new pattern
2. Add observability dashboard for anomaly monitoring
3. Configure alerting for critical anomalies

### P2 - Medium Priority
1. Add route-level caching with Redis
2. Implement rate limiting per workspace
3. Add distributed tracing (Datadog APM)

### P3 - Low Priority
1. Add custom metrics for business KPIs
2. Create SLA dashboards
3. Implement predictive scaling

---

## Performance Targets

| Metric | Current | Target | Deadline |
|--------|---------|--------|----------|
| API Latency (p95) | Unknown | <200ms | Q1 2025 |
| Error Rate | Unknown | <0.1% | Q1 2025 |
| Workspace Isolation | Partial | 100% | Immediate |
| Observability Coverage | 0% | 80% | Q1 2025 |

---

## Health Score Formula

The ML Observability Layer calculates health scores as:

```
Overall = (Latency × 0.3) + (ErrorRate × 0.4) + (Availability × 0.3)

Where:
- Latency Score = 100 - ((p95 - 200ms) / 18)
- Error Score = 100 - (errorRate × 1000)
- Availability Score = (1 - failRate) × 100
```

Target: **Overall Health > 85/100**

---

## Commit Summary

```
feat: global API modernisation with ML observability

- Add Zod validation schemas with safeParseBody helper
- Create ML Observability Layer with anomaly detection
- Add Migration 314: workspace-scoped RLS policies
- Add Migration 315: observability tables
- Add withObservability middleware for API routes
- Fix AuthContext hydration flash with isHydrated state
- Establish modernised API route pattern
```

---

**Report Generated By**: Claude Code
**Next Review**: After migrations applied and initial routes migrated
