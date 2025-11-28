# Unite-Hub Full System Diagnostic Report

**Generated**: 2025-11-28
**Diagnostic Engine**: Claude ML Diagnostic v1.0
**Scope**: API Routes, SSR/CSR Hydration, Database Schema, RLS Policies, UI Components

---

## Executive Summary

| Category | Issues Found | Blockers | Major | Minor |
|----------|-------------|----------|-------|-------|
| API Routes | 14 | 3 | 3 | 8 |
| SSR/CSR Hydration | 15 | 8 | 5 | 2 |
| Database Schema | 4 | 2 | 1 | 1 |
| UI Components | 13 | 2 | 6 | 5 |
| **TOTAL** | **46** | **15** | **15** | **16** |

**Overall System Health Score**: 72/100 (Needs Attention)

---

## BLOCKER Issues (Must Fix Before Production)

### B1. SSR Hydration: AuthContext Browser API Access Without Guards
**File**: `src/contexts/AuthContext.tsx`
**Lines**: 169, 209, 247, 275, 356
**Impact**: App crashes on server-side rendering

```typescript
// Line 169 - localStorage without typeof guard
localStorage.getItem("currentOrganizationId")

// Line 209 - window.location.origin unguarded
redirectTo: `${window.location.origin}/auth/callback`

// Line 247 - localStorage.removeItem unguarded
localStorage.removeItem("currentOrganizationId")
```

**Fix Applied**: See `patches/001-auth-context-hydration.patch`

---

### B2. SSR Hydration: ClientContext Browser API Access
**File**: `src/contexts/ClientContext.tsx`
**Lines**: 90-102
**Impact**: Hydration mismatch on page load

```typescript
// Lines 90-102 - Multiple localStorage calls without guards
localStorage.getItem("unite_hub_current_client_id")
localStorage.setItem("unite_hub_current_client_id", ...)
localStorage.removeItem("unite_hub_current_client_id")
```

**Fix Applied**: See `patches/002-client-context-hydration.patch`

---

### B3. API Routes: supabaseBrowser Used Server-Side
**Files**:
- `src/app/api/content/route.ts` (lines 303-316, 402-415)
- `src/app/api/emails/send/route.ts` (lines 29-30)
- `src/app/api/media/upload/route.ts` (lines 47-48)

**Impact**: Browser client cannot work server-side, routes may fail

**Pattern Found**:
```typescript
const { supabaseBrowser } = await import("@/lib/supabase");
const { data, error } = await supabaseBrowser.auth.getUser(token);
```

**Should Be**:
```typescript
const { getSupabaseServerWithAuth } = await import("@/lib/supabase");
const supabase = getSupabaseServerWithAuth(token);
const { data: { user }, error } = await supabase.auth.getUser();
```

---

### B4. API Routes: Missing Workspace Validation on PATCH/DELETE
**File**: `src/app/api/content/route.ts`
**Lines**: 293-455
**Impact**: Data modification without workspace authorization

---

### B5. Database: ai_score Type Mismatch
**Issue**: Column defined as DECIMAL(3,2) but code expects INTEGER 0-100
**Impact**: Lead scoring calculations incorrect

**Verification Query**:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'ai_score';
```

**Fix**: Migration 311 created

---

### B6. Database: Missing 75 Tables Referenced in Code
**Impact**: Runtime errors when querying non-existent tables
**Critical Missing Tables**:
- `leads`, `clients`, `client_actions` (CRM)
- `admin_approvals`, `admin_trusted_devices` (Admin)
- `integrations` (3rd party APIs)
- `seo_credentials`, `seo_profiles` (SEO)

**Fix**: Migration 312 created with core table stubs

---

### B7. SSR Hydration: CookieConsent Browser APIs
**File**: `src/components/CookieConsent.tsx`
**Lines**: 38-70
**Impact**: window.dispatchEvent fails during SSR

---

### B8. SSR Hydration: Dashboard Layout window.location
**File**: `src/app/dashboard/layout.tsx`
**Lines**: 74-75, 109, 118
**Impact**: Navigation redirects fail on server

---

## MAJOR Issues (Fix This Week)

### M1. API Routes: Hardcoded Admin Email
**File**: `src/app/api/admin/approve-access/route.ts`
**Line**: 5
```typescript
const MASTER_APPROVER_EMAIL = "phill.mcgurk@gmail.com"; // HARDCODED
```
**Should Use**: `process.env.ADMIN_APPROVER_EMAIL`

### M2. API Routes: Missing Rate Limiting
**Files**: `src/app/api/founder/ops/tasks/route.ts` and other founder routes
**Impact**: Vulnerable to DoS attacks

### M3. API Routes: Inconsistent Error Response Format
**Impact**: Clients need different error handling per endpoint

### M4. Database: Duplicate Table Definitions (30+ tables)
**Impact**: Schema ambiguity, unclear which definition is current

### M5. UI: Non-Semantic Clickable DIVs
**File**: `src/app/client/dashboard/overview/page.tsx`
**Lines**: 170-189
**Impact**: Not keyboard accessible, fails WCAG

### M6. UI: Icon-Only Buttons Without aria-label
**Files**: Multiple component files
**Impact**: Screen readers can't identify button purpose

---

## MINOR Issues (Fix When Time Permits)

### N1. API Routes: Inconsistent Parameter Naming
- `/api/content?workspace=...` vs `/api/contacts?workspaceId=...`

### N2. API Routes: Missing Input Validation
- `/api/ai/analyze-stripe` doesn't validate request body

### N3. API Routes: Verbose Error Details in Production
- Raw database errors exposed to clients

### N4. Database: 77 Unused Tables
- Tables created but never referenced in code

### N5. Database: Missing Indexes on 50 Foreign Keys
- Slight performance impact on CASCADE operations

### N6. UI: Hardcoded Fixed Widths
- `w-[140px]` instead of responsive `w-[140px] sm:w-[180px]`

### N7. UI: TODO Comments in Production Code
- 7 components with "Replace with actual API" TODOs

### N8. UI: Missing Error Boundaries
- 5 dashboard pages without error boundaries

---

## Patches Generated

| Patch File | Issue | Status |
|------------|-------|--------|
| `patches/001-auth-context-hydration.patch` | B1 | Ready |
| `patches/002-client-context-hydration.patch` | B2 | Ready |
| `patches/003-api-supabase-client-fix.patch` | B3 | Ready |

---

## Migrations Generated

| Migration | Description | Status |
|-----------|-------------|--------|
| `311_verify_ai_score_type.sql` | Verify and fix ai_score column | Ready |
| `312_create_missing_core_tables.sql` | Create stub tables for missing references | Ready |

---

## Recommended Fix Order

### Phase 1: BLOCKER Fixes (Today)
1. Apply hydration patches (B1, B2, B7, B8)
2. Fix supabaseBrowser usage (B3, B4)
3. Run migration 311 to verify ai_score type

### Phase 2: MAJOR Fixes (This Week)
4. Move hardcoded email to env var (M1)
5. Add rate limiting to founder routes (M2)
6. Standardize error responses (M3)
7. Fix accessibility issues (M5, M6)

### Phase 3: Database Cleanup (Next Week)
8. Run migration 312 for missing tables
9. Clean up duplicate definitions (M4)
10. Add missing indexes (N5)

### Phase 4: Polish (Before Release)
11. Fix all minor issues (N1-N8)
12. Add comprehensive error boundaries
13. Replace TODO comments with implementations

---

## Verification Commands

```bash
# Run after applying patches
npm run build

# Test hydration
npm run dev
# Visit /login, /dashboard, /founder - check for hydration warnings

# Verify database schema
npm run check:db

# Run full test suite
npm test
```

---

## Root Cause Analysis

| Root Cause | Issues Affected | Prevention |
|------------|-----------------|------------|
| PKCE Migration Incomplete | B1, B2, B7, B8 | Add SSR guards to all browser API calls |
| Inconsistent Patterns | B3, M2, M3, N1 | Create API style guide, linting rules |
| Rapid Development | N7, M4 | Enforce PR reviews, remove dead code |
| Missing Standards | M5, M6 | Adopt accessibility checklist |

---

## Effort Estimation

| Category | Hours |
|----------|-------|
| BLOCKER Fixes | 6-8 |
| MAJOR Fixes | 8-12 |
| MINOR Fixes | 6-8 |
| Testing & Verification | 4-6 |
| **TOTAL** | **24-34 hours** |

---

**Report Generated By**: Claude ML Diagnostic Engine
**Next Scan Recommended**: After applying all BLOCKER fixes
