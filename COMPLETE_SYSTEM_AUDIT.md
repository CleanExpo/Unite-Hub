# COMPLETE SYSTEM AUDIT - Unite-Hub

**Date**: 2025-11-15
**Status**: CRITICAL ISSUES FOUND

## EXECUTIVE SUMMARY

The system has **CRITICAL BROKEN IMPLEMENTATIONS** that prevent core functionality from working. The dashboard is currently a placeholder with broken API connections.

---

## 1. CRITICAL DATABASE ISSUES

### Issue #1: Missing Import in `src/lib/db.ts`
**File**: `src/lib/db.ts:58`
**Severity**: CRITICAL - System Breaking
**Status**: BROKEN

```typescript
// Line 58 - supabaseServer is used but NOT imported
const { data: workspace, error } = await supabaseServer  // ❌ UNDEFINED
```

**Impact**: ALL workspace operations fail with `ReferenceError: supabaseServer is not defined`

**Fix Required**:
```typescript
// Line 1 - Add to import
import { supabase, getSupabaseServer } from "./supabase";

// Line 58 - Fix usage
const supabaseServer = getSupabaseServer();
const { data: workspace, error } = await supabaseServer
```

---

## 2. AUTHENTICATION FLOW ANALYSIS

### OAuth Flow - WORKING ✅
- Google OAuth login successfully authenticates
- Session stored in localStorage (implicit flow)
- User redirects to `/dashboard/overview`
- User profile displays correctly ("Phill McGurk" instead of hardcoded "Duncan")

### User Initialization - PARTIALLY WORKING ⚠️
**API**: `/api/auth/initialize-user`
- Creates user profile from Google metadata ✅
- Creates organization with user as owner ✅
- Creates default workspace ✅
- **BUT**: Not being called consistently on first login

### Authentication State Management
**File**: `src/contexts/AuthContext.tsx`
**Status**: WORKING ✅
- User session detection working
- Profile fetching working
- Organization fetching working
- Logout functionality working

---

## 3. DASHBOARD OVERVIEW PAGE ANALYSIS

### File: `src/app/dashboard/overview/page.tsx`

**Data Flow**:
1. Gets `currentOrganization` from AuthContext
2. Extracts `workspaceId = currentOrganization?.org_id`
3. **PROBLEM**: Queries Supabase for stats WITHOUT filtering by workspace ❌

```typescript
// Line 24-26 - NO workspace filter!
const { data: contacts, error: contactsError } = await supabase
  .from("contacts")
  .select("ai_score, status");
  // Missing: .eq("workspace_id", workspaceId)
```

**Impact**: Shows ALL contacts from ALL workspaces, not just user's workspace

**Fix Required**:
```typescript
const { data: contacts, error: contactsError } = await supabase
  .from("contacts")
  .select("ai_score, status")
  .eq("workspace_id", workspaceId);  // Add workspace filter

const { data: campaigns, error: campaignsError } = await supabase
  .from("campaigns")
  .select("id")
  .eq("workspace_id", workspaceId);  // Add workspace filter
```

---

## 4. HOT LEADS PANEL - BROKEN

### File: `src/components/HotLeadsPanel.tsx`

**API Call**:
```typescript
// Line 24-30
const res = await fetch("/api/agents/contact-intelligence", {
  method: "POST",
  body: JSON.stringify({
    action: "get_hot_leads",
    workspaceId,  // Passes workspaceId
  }),
});
```

### API Handler: `/api/agents/contact-intelligence/route.ts`

**Status**: Authentication disabled (Line 10-16) ⚠️

```typescript
// TODO: Re-enable authentication in production
// const { auth } = await import("@/lib/auth");
// const session = await auth();
```

### Agent Logic: `src/lib/agents/contact-intelligence.ts`

**Line 240-253**: `getHotLeads()` function
```typescript
export async function getHotLeads(workspaceId: string, limit = 10) {
  const contacts = await db.contacts.listByWorkspace(workspaceId);  // ✅ Uses workspace filter

  const scored = contacts
    .map((c) => ({
      ...c,
      compositeScore: calculateCompositeScore(c),  // ✅ Calculates score
    }))
    .filter((c) => c.compositeScore >= 70)  // ✅ Filters by score
    .sort((a, b) => b.compositeScore - a.compositeScore)  // ✅ Sorts by score
    .slice(0, limit);  // ✅ Limits results

  return scored;
}
```

**Status**: Logic is correct ✅

**Current Error**: `invalid input syntax for type uuid: "default-org"`

**Root Cause**: `workspaceId` being passed is `"default-org"` (string) instead of actual UUID

**Trace Back**:
```
HotLeadsPanel
  → workspaceId from props
  → overview/page.tsx: workspaceId = currentOrganization?.org_id
  → AuthContext: currentOrganization from fetchOrganizations()
```

**Problem Location**: `src/contexts/AuthContext.tsx:110-112`

```typescript
// Line 110-112
const savedOrgId = localStorage.getItem("currentOrganizationId");
const savedOrg = orgs.find((org) => org.org_id === savedOrgId);
setCurrentOrganization(savedOrg || orgs[0] || null);
```

**Issue**: If `orgs` is empty array, `savedOrg || orgs[0]` = `undefined`, not `null`

**Fix Required**:
```typescript
if (orgs.length === 0) {
  setCurrentOrganization(null);
  return;
}

const savedOrgId = localStorage.getItem("currentOrganizationId");
const savedOrg = orgs.find((org) => org.org_id === savedOrgId);
setCurrentOrganization(savedOrg || orgs[0]);
```

---

## 5. API ENDPOINTS AUDIT

### Total API Routes: 104 routes found

### Authentication Required Routes (Currently Disabled):
- `/api/agents/contact-intelligence` - ⚠️ Auth TODO comment
- `/api/agents/content-personalization` - Status unknown
- Most other routes - Need to check each one

### Working Routes:
- ✅ `/api/auth/initialize-user` - Creates user profiles
- ✅ `/api/contacts/hot-leads` - Fetches hot leads (when workspace ID is valid)

### Broken/Untested Routes:
Need to audit each of the 104 API routes systematically

---

## 6. NAVIGATION & BREADCRUMB CONNECTIONS

### Dashboard Layout: `src/app/dashboard/layout.tsx`
**Navigation Links**:
- ✅ `/dashboard/overview` - Dashboard (WORKING)
- ✅ `/dashboard/campaigns` - Email Campaigns
- ✅ `/dashboard/campaigns/drip` - Drip Sequences
- ✅ `/dashboard/contacts` - Contacts
- ✅ `/dashboard/workspaces` - Workspaces
- ✅ `/billing` - Billing
- ❌ `/dashboard/settings` - Settings (in dropdown)

**Client Selector Component**: `<ClientSelector />`
- **Status**: Unknown - needs audit
- **Purpose**: Switch between clients/workspaces
- **Location**: `src/components/client/ClientSelector.tsx`

### Dashboard Pages Found:
1. `/dashboard/overview` ✅
2. `/dashboard/workspaces`
3. `/dashboard/campaigns`
4. `/dashboard/intelligence`
5. `/dashboard/contacts`
6. `/dashboard/contacts/[contactId]`
7. `/dashboard/calendar`
8. `/dashboard/content/templates`
9. `/dashboard/emails/sequences`
10. `/dashboard/insights/competitors`
11. `/dashboard/resources/landing-pages`
12. `/dashboard/resources/landing-pages/[id]`
13. `/dashboard/modern`
14. `/dashboard/team`
15. `/dashboard/projects`
16. `/dashboard/approvals`
17. `/dashboard/profile`
18. `/dashboard/ai-tools/code-generator`
19. `/dashboard/ai-tools/marketing-copy`
20. `/dashboard/settings`
21. `/dashboard/content`

**Status**: Need to test each page for functionality

---

## 7. MISSING IMPLEMENTATIONS

### Dashboard Overview Page
- ❌ Workspace filtering on contacts query
- ❌ Workspace filtering on campaigns query
- ❌ Error handling for missing workspace
- ❌ Loading states for individual stat cards

### Hot Leads System
- ❌ Proper workspace ID validation
- ❌ Fallback when no organizations exist
- ❌ "Send Email" button functionality (Line 219-224 in HotLeadsPanel)
- ❌ "View Details" button functionality (Line 225-231 in HotLeadsPanel)

### User Initialization
- ❌ Consistent triggering on first OAuth login
- ❌ Error handling when initialization fails
- ❌ Retry logic if network fails

### Authentication
- ❌ Re-enable authentication on API routes (currently disabled for development)
- ❌ Implement proper RBAC (Role-Based Access Control)
- ❌ Session refresh handling

---

## 8. DATABASE SCHEMA GAPS

**Need to verify these tables exist in Supabase**:
- `user_profiles` ✅ (exists, confirmed)
- `organizations` ✅ (exists, confirmed)
- `user_organizations` ✅ (exists, confirmed)
- `workspaces` - Status unknown
- `contacts` - Status unknown
- `emails` - Status unknown
- `campaigns` - Status unknown
- `generated_content` - Status unknown
- `email_variants` - Status unknown
- `contact_interactions` - Status unknown
- `audit_logs` - Status unknown
- `email_integrations` - Status unknown
- `sent_emails` - Status unknown
- `email_opens` - Status unknown
- `email_clicks` - Status unknown
- `drip_campaigns` - Status unknown
- `campaign_steps` - Status unknown
- `campaign_enrollments` - Status unknown
- `client_emails` - Status unknown

---

## 9. DATA FLOW ANALYSIS

### Complete Flow: OAuth → Dashboard → Hot Leads

```
1. User clicks "Continue with Google" on /login
   ↓
2. Supabase OAuth (implicit flow)
   ↓
3. Redirect to /auth/callback
   ↓
4. /auth/callback detects no code parameter
   ↓
5. Redirects to /auth/implicit-callback (client-side)
   ↓
6. Client reads tokens from URL hash
   ↓
7. Supabase creates session in localStorage
   ↓
8. Redirect to /dashboard/overview
   ↓
9. AuthContext detects SIGNED_IN event
   ↓
10. Calls /api/auth/initialize-user (if first login) ❌ NOT ALWAYS CALLED
    ↓
11. Fetches user profile from user_profiles table
    ↓
12. Fetches organizations from user_organizations + organizations tables
    ↓
13. Sets currentOrganization to first org (or savedOrgId from localStorage)
    ↓
14. Dashboard overview page renders
    ↓
15. Fetches stats from contacts + campaigns tables ❌ NO WORKSPACE FILTER
    ↓
16. Passes workspaceId to HotLeadsPanel
    ↓
17. HotLeadsPanel calls /api/agents/contact-intelligence
    ↓
18. API calls getHotLeads(workspaceId) in contact-intelligence.ts
    ↓
19. getHotLeads calls db.contacts.listByWorkspace(workspaceId)
    ↓
20. db.contacts.listByWorkspace queries Supabase ✅
    ↓
21. Calculates composite scores and filters ✅
    ↓
22. Returns hot leads to panel ✅
    ↓
23. Panel displays leads ✅
```

**Critical Break Points**:
- Step 10: User initialization not always triggered
- Step 13: If no orgs exist, currentOrganization is undefined (not null)
- Step 15: No workspace filtering breaks data isolation
- Step 16: workspaceId might be "default-org" string instead of UUID

---

## 10. ENVIRONMENT & CONFIGURATION

### Required Environment Variables:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Confirmed working
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Confirmed working
- ✅ `ANTHROPIC_API_KEY` - Required for AI agents
- ❓ `STRIPE_SECRET_KEY` - For billing
- ❓ `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks
- ❓ `GMAIL_CLIENT_ID` - For Gmail integration
- ❓ `GMAIL_CLIENT_SECRET` - For Gmail integration

---

## 11. IMMEDIATE ACTION ITEMS (Priority Order)

### P0 - CRITICAL (System Breaking)
1. **Fix database import error** in `src/lib/db.ts:58`
   - Add `getSupabaseServer()` call
   - Test all workspace operations

2. **Fix workspace filtering** in `src/app/dashboard/overview/page.tsx`
   - Add `.eq("workspace_id", workspaceId)` to contacts query
   - Add `.eq("workspace_id", workspaceId)` to campaigns query
   - Add null check for workspaceId

3. **Fix currentOrganization undefined** in `src/contexts/AuthContext.tsx`
   - Handle empty orgs array properly
   - Ensure initialize-user is called on first login
   - Add error handling for initialization failures

### P1 - HIGH (Core Features Broken)
4. **Audit and test all 104 API endpoints**
   - Create endpoint testing script
   - Document which endpoints work
   - Identify authentication requirements

5. **Test all 21 dashboard pages**
   - Create page testing checklist
   - Document broken pages
   - Identify missing components

6. **Implement missing button functionality**
   - Hot Leads "Send Email" button
   - Hot Leads "View Details" button
   - Contact detail page navigation

### P2 - MEDIUM (User Experience)
7. **Add proper error handling**
   - Dashboard loading states
   - API error messages
   - Fallback UI for empty states

8. **Re-enable authentication**
   - Review all API routes with TODO auth comments
   - Implement proper RBAC
   - Add session management

### P3 - LOW (Polish)
9. **Performance optimization**
   - Add request caching
   - Optimize database queries
   - Implement pagination

---

## 12. TESTING REQUIRED

### Unit Tests Needed:
- `getHotLeads()` function
- `calculateCompositeScore()` function
- `analyzeContactIntelligence()` function
- All db wrapper functions

### Integration Tests Needed:
- OAuth flow end-to-end
- User initialization flow
- Dashboard data loading
- API endpoint security

### E2E Tests Needed:
- Complete user journey: signup → login → dashboard → contacts
- Email sending workflow
- Campaign creation workflow

---

## CONCLUSION

The system is **NOT production ready**. Critical issues prevent core functionality from working:

1. **Database layer is broken** (missing import)
2. **Data isolation is broken** (no workspace filtering)
3. **User onboarding is incomplete** (initialization not reliable)
4. **Most features are untested** (104 API routes, 21 pages)

**Estimated Fix Time**: 2-3 days for P0 items, 1-2 weeks for full system stabilization

**Next Steps**:
1. Fix P0 items immediately
2. Create comprehensive test suite
3. Audit remaining 100+ API endpoints
4. Test all dashboard pages
5. Implement missing functionality
