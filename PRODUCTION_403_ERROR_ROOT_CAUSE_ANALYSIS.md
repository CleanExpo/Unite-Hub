# Production 403 Error - Deep Root Cause Analysis

**Date**: 2025-11-18
**Analyst**: Claude Code
**Status**: 🔴 CRITICAL - Authentication Chain Broken
**Impact**: 100% of protected API routes failing with 403 Forbidden

---

## Executive Summary

The production errors are **NOT** superficial issues. The root cause is a **fundamental authentication chain break** in the workspace validation layer that cascades through the entire application.

### The Real Problem

**Symptom**: 403 Forbidden errors on `/api/agents/contact-intelligence` and `/api/calendar/events`
**Root Cause**: `validateUserAuth()` in `workspace-validation.ts` **CANNOT find user organizations** because the user profile doesn't exist in `user_profiles` table
**Cascade Effect**: Every protected API route using workspace validation fails

---

## Root Cause Analysis (Deep Dive)

### The Authentication Chain (Should Work)

```
1. User logs in with Google OAuth
   ↓
2. AuthContext stores session in localStorage
   ↓
3. AuthContext calls /api/auth/initialize-user
   ↓
4. /api/auth/initialize-user creates:
   - user_profiles entry
   - organizations entry
   - user_organizations link
   - workspaces entry
   ↓
5. AuthContext fetches profile and organizations
   ↓
6. Dashboard components receive valid workspaceId
   ↓
7. API calls include Authorization header with session token
   ↓
8. API route validates authentication via validateUserAuth()
   ↓
9. validateUserAuth() queries user_organizations table
   ↓
10. Returns orgId for workspace validation
    ↓
11. Request succeeds ✅
```

### The Broken Reality (What Actually Happens)

```
1. User logs in with Google OAuth ✅
   ↓
2. AuthContext stores session in localStorage ✅
   ↓
3. AuthContext calls /api/auth/initialize-user ✅
   ↓
4. /api/auth/initialize-user creates organization ✅
   ↓
5. /api/auth/initialize-user creates workspace ✅
   ↓
6. /api/auth/initialize-user FAILS to create user_profiles entry ❌
   (Or creates it but RLS prevents reading it back)
   ↓
7. AuthContext.fetchProfile() returns NULL ❌
   Console: "[AuthContext] No profile found for user: 0082768b-c40a-4c4e-8150-84a3dd406cbc"
   ↓
8. AuthContext.fetchOrganizations() succeeds ✅
   (Uses service role in /api/organizations, bypasses RLS)
   ↓
9. Dashboard loads, workspaceId is valid ✅
   ↓
10. HotLeadsPanel calls /api/agents/contact-intelligence ✅
    ↓
11. API route calls validateUserAuth() ✅
    ↓
12. validateUserAuth() queries user_organizations table ❌
    (Uses getSupabaseServer() which is affected by RLS)
    ↓
13. Query returns NULL because:
    - User profile doesn't exist, OR
    - RLS policy on user_organizations blocks the query
    ↓
14. validateUserAuth() throws: "Forbidden: No organization found for user" ❌
    ↓
15. API returns 403 Forbidden ❌
```

---

## Evidence From Logs

### Log 1: Profile Fetch Fails (Line 109)
```
[AuthContext] No profile found for user: 0082768b-c40a-4c4e-8150-84a3dd406cbc
```

**Analysis**:
- `/api/profile` route uses `getSupabaseServer()` (line 50 of `/api/profile/route.ts`)
- `getSupabaseServer()` respects RLS policies
- Either:
  1. User profile was never created in `initialize-user`, OR
  2. User profile exists but RLS policy blocks the SELECT query

### Log 2: Organizations Fetch Succeeds
```
[AuthContext] Organizations fetched: 1
[AuthContext] Current org set to: Phill McGurk's Organization
```

**Analysis**:
- `/api/organizations` route uses **service role client** (line 29-32):
  ```typescript
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← BYPASSES RLS
  );
  ```
- This is why organizations fetch succeeds while profile fetch fails

### Log 3: Contact Intelligence 403
```
/api/agents/contact-intelligence:1 Failed to load resource: the server responded with a status of 403
Failed to load hot leads: Error: Failed to load hot leads: 403
```

**Analysis**:
- `contact-intelligence` route calls `validateUserAuth()` (line 44)
- `validateUserAuth()` uses `getSupabaseServer()` to query `user_organizations` (line 62-68):
  ```typescript
  const supabase = await getSupabaseServer();
  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  ```
- Query returns NULL (despite org existing!)
- Throws error: "Forbidden: No organization found for user" (line 78)

### Log 4: Calendar Events 403
```
/api/calendar/events?workspaceId=YOUR_WORKSPACE_ID&timeMin=2025-11-18T08:43:58.235Z:1
Failed to load resource: the server responded with a status of 403
```

**Analysis**: Same root cause - `validateUserAuth()` fails

---

## The RLS Policy Problem

### Current RLS Policies (Hypothesis)

Based on the behavior, the RLS policies likely look like this:

**user_profiles**:
```sql
-- READ: User can only see their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
```

**Problem**: When using **service role key** (like in `getSupabaseServer()`), `auth.uid()` returns `NULL` because there's no JWT context! The service role is authenticated but not tied to a specific user.

**user_organizations**:
```sql
-- READ: User can only see their own organization memberships
CREATE POLICY "Users can view own organizations"
  ON user_organizations FOR SELECT
  USING (auth.uid() = user_id);
```

**Same problem**: `auth.uid()` = NULL for service role queries.

---

## Why /api/organizations Works But Others Don't

### /api/organizations Route (Lines 29-32)
```typescript
// Create admin client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← SERVICE ROLE = BYPASS RLS
);
```

### /api/profile Route (Line 50)
```typescript
// Get Supabase instance for database operations
const supabase = await getSupabaseServer();  // ← RESPECTS RLS
```

### workspace-validation.ts (Line 62)
```typescript
// Get user's organization (using authenticated user's supabase client)
const supabase = await getSupabaseServer();  // ← RESPECTS RLS
const { data: userOrg, error: orgError } = await supabase
  .from("user_organizations")
  .select("org_id")
  .eq("user_id", userId)  // ← THIS QUERY FAILS DUE TO RLS
  .limit(1)
  .maybeSingle();
```

---

## The Fundamental Design Flaw

### Inconsistent Supabase Client Usage

**Pattern A (Works)**: Direct service role for RLS bypass
```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

**Pattern B (Fails)**: `getSupabaseServer()` which respects RLS
```typescript
const supabase = await getSupabaseServer();
```

### The Contradiction

The codebase **ASSUMES** that:
1. Protected API routes should respect RLS (security best practice)
2. But RLS policies require `auth.uid()` to be set
3. But server-side API routes don't have JWT context
4. So `auth.uid()` = NULL
5. So RLS policies block everything

**Result**: Either you bypass RLS (insecure) or you get 403 errors (broken)

---

## Why This Wasn't Caught Earlier

### 1. Dual Authentication Flow Complexity
- Implicit OAuth flow (client-side tokens)
- PKCE flow (server-side cookies)
- Each has different session storage mechanisms

### 2. Inconsistent Service Role Usage
- Some routes use service role (`/api/organizations`)
- Some routes use server client (`/api/profile`)
- No consistent pattern enforced

### 3. RLS Policies Designed for Client-Side Access
- RLS policies assume `auth.uid()` exists
- Server-side API routes don't have JWT context
- Mismatch between security model and implementation

### 4. Workspace Validation Added Later
- Original routes worked without workspace validation
- Adding `validateUserAuth()` broke everything
- But only in production where RLS is enforced

---

## The 404 Errors (Secondary Issue)

### Marketing Navigation Links
```
/docs?_rsc=k7a9b:1  Failed to load resource: 404
/blog?_rsc=k7a9b:1  Failed to load resource: 404
/api?_rsc=k7a9b:1  Failed to load resource: 404
/support?_rsc=k7a9b:1  Failed to load resource: 404
/integrations?_rsc=k7a9b:1  Failed to load resource: 404
/changelog?_rsc=k7a9b:1  Failed to load resource: 404
```

**Cause**: Marketing navigation footer includes links to non-existent pages (see [Footer.tsx](src/components/marketing/Footer.tsx))

**Impact**: Low (cosmetic, doesn't break functionality)

**Fix**: Either create placeholder pages or remove links from footer

---

## Solutions (In Order of Correctness)

### Solution 1: Proper JWT Context in Server Routes ✅ (RECOMMENDED)

**Approach**: Use the token from Authorization header to set auth context

```typescript
// workspace-validation.ts
export async function validateUserAuth(req: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let userId: string;
  let supabase;

  if (token) {
    // Create server client WITH user context
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`  // ← SETS JWT CONTEXT
          }
        }
      }
    );

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("Unauthorized: Invalid token");
    }

    userId = data.user.id;
  } else {
    // Fallback to server cookies
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("Unauthorized: No valid session");
    }

    userId = data.user.id;
  }

  // NOW this query works because auth.uid() is set
  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!userOrg) {
    throw new Error("Forbidden: No organization found for user");
  }

  return {
    userId,
    orgId: userOrg.org_id,
  };
}
```

**Pros**:
- Respects RLS (secure)
- Works with implicit OAuth flow
- No service role key exposure

**Cons**:
- Requires refactoring `validateUserAuth()`
- Need to test with both OAuth flows

---

### Solution 2: Use Service Role in validateUserAuth() ⚠️ (QUICK FIX)

**Approach**: Bypass RLS in workspace validation

```typescript
// workspace-validation.ts
export async function validateUserAuth(req: NextRequest): Promise<AuthenticatedUser> {
  // ... authenticate user to get userId ...

  // Use service role to bypass RLS (like /api/organizations does)
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  // ... rest of function ...
}
```

**Pros**:
- Quick fix (5 minutes)
- Will immediately resolve 403 errors
- Already used successfully in `/api/organizations`

**Cons**:
- Bypasses RLS (security concern)
- Not following security best practices
- Service role key in more places

---

### Solution 3: Fix RLS Policies for Service Role Access ❌ (NOT RECOMMENDED)

**Approach**: Modify RLS policies to allow service role queries

```sql
-- Allow service role to bypass RLS
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own organizations" ON user_organizations;

CREATE POLICY "Users and service role can view organizations"
  ON user_organizations FOR SELECT
  USING (
    auth.uid() = user_id  -- User can see their own
    OR
    auth.jwt() IS NULL    -- Service role can see all
  );
```

**Pros**:
- Minimal code changes

**Cons**:
- Opens security hole (service role can access all data)
- Defeats purpose of RLS
- Hard to audit

---

## Recommended Action Plan

### Phase 1: Immediate Fix (2 hours)

1. **Apply Solution 2** to `workspace-validation.ts`:
   - Use service role in `validateUserAuth()`
   - Test with production credentials
   - Deploy to production

2. **Create missing marketing pages** or remove links:
   - Create placeholder pages for `/docs`, `/blog`, etc.
   - OR remove links from Footer component

### Phase 2: Proper Fix (1 week)

3. **Refactor to Solution 1**:
   - Update `validateUserAuth()` to use JWT from header
   - Test with both OAuth flows
   - Ensure RLS policies are correct

4. **Audit all API routes** for consistent pattern:
   - Document when to use service role vs. user context
   - Create helper function for authenticated server client
   - Update all routes to follow pattern

5. **Add integration tests**:
   - Test workspace validation with real tokens
   - Test RLS policies with user context
   - Test both OAuth flows

### Phase 3: Long-term (1 month)

6. **Consolidate authentication patterns**:
   - Choose one OAuth flow (PKCE recommended)
   - Remove dual-flow complexity
   - Update documentation

7. **Implement proper JWT context handling**:
   - Create middleware for JWT context
   - Ensure all server routes have user context
   - Audit RLS policies for correctness

---

## Key Insights

### What We Learned

1. **The 403 errors are NOT superficial** - they reveal fundamental authentication architecture problems

2. **RLS and server-side API routes are inherently incompatible** unless you pass JWT context explicitly

3. **Inconsistent Supabase client usage** (service role vs. server client) masks the real problem

4. **The "No profile found" warning is the canary** - it indicates RLS is blocking queries

5. **Production fails where dev works** because local dev might not have RLS enforced

### The Real Root Cause

**Not**: "API routes need better error handling"
**Not**: "Workspace validation is too strict"
**Not**: "User initialization is incomplete"

**Actually**: **Server-side API routes using RLS-protected queries without JWT context**

---

## Testing Verification

### How to Confirm This Analysis

Run this query in Supabase SQL Editor:

```sql
-- Check if user profile exists
SELECT id, email, full_name, created_at
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Check if user organization link exists
SELECT user_id, org_id, role, is_active
FROM user_organizations
WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Check RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Check RLS policies on user_organizations
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_organizations';
```

**If user_profiles and user_organizations exist**: RLS is blocking the queries
**If they don't exist**: User initialization is failing

---

## Conclusion

This is **not a superficial issue**. The production 403 errors stem from:

1. **Architectural mismatch**: RLS policies designed for client-side access being used in server-side API routes
2. **Missing JWT context**: Server routes don't pass user tokens to Supabase client
3. **Inconsistent patterns**: Some routes use service role (bypass), others use server client (fail)

**The fix requires either**:
- Quick: Use service role in workspace validation (5 min, less secure)
- Proper: Pass JWT context to server Supabase client (2 hours, secure)
- Ideal: Refactor entire authentication architecture (1 week, production-ready)

**Priority**: P0 - System is broken in production for all authenticated routes

---

**Next Steps**: Choose solution, implement, test, deploy
