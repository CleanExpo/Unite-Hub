## CRITICAL: RLS / Authentication Issue Found

### Problem
Browser queries are timing out because **Supabase client is not authenticated**.

### Evidence
```
Test 1: Service Role Client (bypasses RLS)
  ✅ SUCCESS in 135ms

Test 2: Anon Key Client (subject to RLS)
  ❌ Error: Cannot coerce the result to a single JSON object
     Code: PGRST116
```

### Root Cause
The browser's `supabaseBrowser` client is making queries with the **anon key** but:
1. RLS policies require authentication
2. Session is not properly set in the browser client
3. Queries fail with PGRST116 error or timeout

### Why This Happens
In `AuthContext.tsx`, the flow is:
1. Detect SIGNED_IN event
2. Try to fetch profile using `supabaseBrowser`
3. But `supabaseBrowser` doesn't have the session set yet!

### The Fix
**Option 1: Use the session from the auth event**

In AuthContext, when we have a `session` from the auth event, we need to ensure `supabaseBrowser` is using that session for queries.

**Option 2: Use service role for initial fetch**

Use the service role key (via API route) to fetch profile/orgs on initial sign-in, then switch to client queries.

**Option 3: Wait for session to propagate**

Add a check to ensure `supabaseBrowser.auth.getSession()` returns a valid session before fetching data.

### Recommended Solution
**Ensure supabaseBrowser has the session before making queries:**

```typescript
// In fetchProfile
const { data: { session } } = await supabaseBrowser.auth.getSession();
if (!session) {
  console.error('No session available for authenticated query');
  return;
}

// Now the browser client will send the session token with the query
const { data, error } = await supabaseBrowser
  .from("user_profiles")
  .select("*")
  .eq("id", userId)
  .single();
```

### Next Steps
1. Modify AuthContext to check for session before queries
2. Or call API routes (which use service role) for initial data fetch
3. Test that queries succeed with proper authentication
