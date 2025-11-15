# API Authentication Fix Guide

**Generated**: 2025-11-15
**Status**: CRITICAL SECURITY FIXES REQUIRED
**Affected**: 148 total endpoints (90 missing auth, 58 with broken patterns)

---

## Executive Summary

**CRITICAL SECURITY VULNERABILITY IDENTIFIED**:
- **90 API endpoints** have NO authentication
- **58 API endpoints** use broken authentication patterns
- **0 endpoints** have workspace isolation (data leak risk)
- **0 endpoints** implement proper error logging

This means **ANY USER can access ANY DATA** across the entire application.

---

## What Was Created

### 1. Unified Authentication Middleware (`src/lib/api-auth.ts`)

A production-ready authentication system with:
- ✅ Consistent authentication across all endpoints
- ✅ Automatic organization validation
- ✅ Workspace isolation helpers
- ✅ Comprehensive error logging
- ✅ Type-safe context objects
- ✅ Easy-to-use wrapper functions

### 2. Audit Tools

- `scripts/fix-api-auth.mjs` - Comprehensive auditor (identifies all issues)
- `scripts/apply-api-auth-fixes.mjs` - Automated fixer (USE WITH CAUTION)
- `API_AUTH_AUDIT_REPORT.md` - Detailed findings

---

## How to Use the New Auth System

### Pattern 1: Simple Authentication (Profile, Settings, etc.)

**BEFORE** (❌ Broken):
```typescript
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // ... rest of logic
}
```

**AFTER** (✅ Correct):
```typescript
import { requireAuth, AuthError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase, orgId } = await requireAuth(req);

    // user.id is now available
    // supabase client is ready to use
    // orgId is the user's active organization

    // ... rest of logic

  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    throw error;
  }
}
```

### Pattern 2: Workspace-Scoped Authentication (Contacts, Campaigns, etc.)

**BEFORE** (❌ Missing workspace validation):
```typescript
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await req.json();

  // ❌ NO VALIDATION that workspaceId belongs to user's org!
  const contacts = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", workspaceId);
}
```

**AFTER** (✅ Correct):
```typescript
import { requireWorkspace, AuthError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    // ✅ Automatically validates workspace access
    const { user, supabase, orgId, workspaceId } = await requireWorkspace(req);

    // workspaceId is now GUARANTEED to belong to user's organization
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId);

    return NextResponse.json({ contacts });

  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error("[/api/contacts] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Pattern 3: No Authentication (Public Endpoints)

**PUBLIC ENDPOINTS** (webhooks, tracking pixels, health checks):
- `/api/health`
- `/api/webhooks/*`
- `/api/tracking/pixel/*`
- `/api/stripe/webhook`

These should remain **WITHOUT** `requireAuth()`, but should:
1. Verify webhook signatures (Stripe, WhatsApp, etc.)
2. Use API keys or tokens for identification
3. Log all access attempts
4. Rate limit aggressively

```typescript
export async function POST(req: NextRequest) {
  // Verify webhook signature
  const signature = req.headers.get("stripe-signature");
  if (!signature || !verifyStripeSignature(signature, body)) {
    console.error("[/api/stripe/webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Process webhook
  // ...
}
```

---

## Priority Fix Order

### PRIORITY 1: Critical Security Issues (DO THESE FIRST)

**Endpoints actively being used in production**:

1. ✅ `/api/profile/update` - Already correct
2. ✅ `/api/agents/contact-intelligence` - Already correct
3. ✅ `/api/agents/content-personalization` - Already correct
4. ✅ `/api/contacts/analyze` - Already correct
5. ⚠️ `/api/contacts/[contactId]/route` - Needs workspace validation
6. ⚠️ `/api/contacts/delete` - Needs workspace validation
7. ⚠️ `/api/contacts/hot-leads` - Needs workspace validation

**How to fix**:
```bash
# Review each file
cat src/app/api/contacts/[contactId]/route.ts

# Apply fixes manually using Pattern 2 above
# Test with actual requests
# Verify error logging works
```

### PRIORITY 2: User-Facing Features

**Endpoints called from dashboard UI**:

1. `/api/integrations/gmail/*` - Email integration (HIGH USE)
2. `/api/campaigns/*` - Campaign management
3. `/api/clients/*` - Client/contact management
4. `/api/onboarding/*` - New user flow

**Fix count**: ~40 endpoints

### PRIORITY 3: Admin & AI Features

**Endpoints used by automation/agents**:

1. `/api/ai/*` - AI generation endpoints
2. `/api/calendar/*` - Calendar features
3. `/api/social-templates/*` - Content templates
4. `/api/landing-pages/*` - Landing page builder

**Fix count**: ~50 endpoints

### PRIORITY 4: Low-Priority Features

**Endpoints for future features**:

1. `/api/competitors/*` - Competitor analysis
2. `/api/subscription/*` - Billing (if using Stripe direct)
3. `/api/team/*` - Team management
4. `/api/projects/*` - Project management

**Fix count**: ~20 endpoints

---

## Testing Your Fixes

### 1. Manual Testing

```bash
# Start dev server
npm run dev

# Test authenticated endpoint
curl -X POST http://localhost:3008/api/profile/update \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_TOKEN" \
  -d '{"full_name": "Test User"}'

# Should return 401 if not authenticated
# Should return 200 if authenticated

# Test workspace-scoped endpoint
curl -X POST http://localhost:3008/api/contacts/hot-leads \
  -H "Content-Type: application/json" \
  -b "sb-access-token=YOUR_TOKEN" \
  -d '{"workspaceId": "valid-workspace-id"}'

# Should return 403 if workspace doesn't belong to user's org
# Should return 200 if workspace is valid
```

### 2. Check Server Logs

After making requests, check your server logs for:

```
[requireAuth] Authentication error: {
  message: "...",
  url: "...",
}
```

This confirms logging is working.

### 3. Automated Testing

Create integration tests for each fixed endpoint:

```typescript
// tests/api/profile-update.test.ts
describe("/api/profile/update", () => {
  it("should reject unauthenticated requests", async () => {
    const res = await fetch("http://localhost:3008/api/profile/update", {
      method: "POST",
      body: JSON.stringify({ full_name: "Test" }),
    });

    expect(res.status).toBe(401);
  });

  it("should accept authenticated requests", async () => {
    const res = await fetch("http://localhost:3008/api/profile/update", {
      method: "POST",
      headers: {
        "Cookie": `sb-access-token=${testToken}`,
      },
      body: JSON.stringify({ full_name: "Test" }),
    });

    expect(res.status).toBe(200);
  });
});
```

---

## Automated Fixer (Use with Caution)

**⚠️ WARNING**: The automated fixer can break code. ALWAYS:
1. Commit your changes first
2. Run in `--dry-run` mode
3. Review the output carefully
4. Test after applying

```bash
# Preview changes
node scripts/apply-api-auth-fixes.mjs --dry-run

# Apply fixes (DANGEROUS)
node scripts/apply-api-auth-fixes.mjs --apply

# If something breaks, revert
git checkout -- src/app/api/
```

The fixer handles:
- ✅ Replacing `auth()` with `requireAuth()`
- ✅ Adding authentication to endpoints without it
- ✅ Migrating `getSupabaseServer` + `auth.getUser()` to `requireAuth()`
- ⚠️ Adding workspace validation (may need manual adjustment)

---

## What Happens After Fixes

### Immediate Effects

1. **All API endpoints will require authentication**
   - Frontend must send valid Supabase session cookies
   - Unauthenticated requests will get 401 errors

2. **Workspace isolation will be enforced**
   - Users can only access data in their organization's workspaces
   - Cross-workspace data leaks are prevented

3. **Better error messages**
   - Failed requests will log detailed debugging info
   - Easier to diagnose production issues

### Frontend Changes Needed

If frontend is currently working, it likely means:
- Session cookies are being sent correctly
- Workspace IDs are in request bodies

After fixes, you might need to:
- Add error handling for 401/403 responses
- Show better error messages to users
- Redirect to login on auth failures

```typescript
// Example frontend error handling
try {
  const res = await fetch("/api/contacts/hot-leads", {
    method: "POST",
    body: JSON.stringify({ workspaceId }),
  });

  if (res.status === 401) {
    // Redirect to login
    router.push("/login");
    return;
  }

  if (res.status === 403) {
    // Show "Access Denied" message
    toast.error("You don't have access to this workspace");
    return;
  }

  const data = await res.json();
  // ... handle success
} catch (error) {
  console.error("API error:", error);
  toast.error("Something went wrong");
}
```

---

## Implementation Checklist

Use this checklist to track progress:

### Phase 1: Critical Fixes (Week 1)
- [ ] Fix `/api/contacts/[contactId]/route`
- [ ] Fix `/api/contacts/delete`
- [ ] Fix `/api/contacts/hot-leads`
- [ ] Fix `/api/contacts/[contactId]/emails/*`
- [ ] Test all contact endpoints manually
- [ ] Write integration tests for contact endpoints

### Phase 2: User-Facing Features (Week 2)
- [ ] Fix `/api/integrations/gmail/*` (15 endpoints)
- [ ] Fix `/api/campaigns/*` (2 endpoints)
- [ ] Fix `/api/clients/*` (25 endpoints)
- [ ] Fix `/api/onboarding/*` (4 endpoints)
- [ ] Test all fixed endpoints
- [ ] Write integration tests

### Phase 3: AI & Automation (Week 3)
- [ ] Fix `/api/ai/*` (10 endpoints)
- [ ] Fix `/api/calendar/*` (9 endpoints)
- [ ] Fix `/api/social-templates/*` (8 endpoints)
- [ ] Fix `/api/landing-pages/*` (4 endpoints)
- [ ] Test all fixed endpoints

### Phase 4: Low-Priority (Week 4)
- [ ] Fix remaining endpoints (~20)
- [ ] Run final audit with `scripts/fix-api-auth.mjs`
- [ ] Verify 0 endpoints without authentication
- [ ] Write comprehensive E2E tests
- [ ] Update API documentation

### Phase 5: Production Readiness
- [ ] Add rate limiting to public endpoints
- [ ] Set up monitoring/alerting for 401/403 errors
- [ ] Create runbook for auth debugging
- [ ] Train team on new auth patterns
- [ ] Deploy to staging
- [ ] Run penetration testing
- [ ] Deploy to production

---

## FAQ

### Q: Why not use the automated fixer?

A: The automated fixer uses regex patterns which can:
- Break complex code
- Miss edge cases
- Create hard-to-debug issues

Manual fixes with testing are safer for production systems.

### Q: What if I break something?

A: Always:
1. Commit before making changes
2. Test each endpoint after fixing
3. Have rollback plan ready
4. Fix in batches (5-10 endpoints at a time)

### Q: How do I know if my fix is correct?

A: Check for:
1. No compilation errors
2. Endpoint returns 401 without auth
3. Endpoint returns 200 with valid auth
4. Server logs show detailed error info
5. Workspace validation prevents cross-workspace access

### Q: Should I fix all 148 endpoints at once?

A: **NO!** Fix in phases:
1. Critical endpoints first (5-10)
2. Test thoroughly
3. Deploy to staging
4. Fix next batch
5. Repeat until done

### Q: What about NextAuth?

A: NextAuth was being used incorrectly. The project uses:
- **Supabase Auth** for authentication (correct)
- **Supabase SSR** for session management (correct)
- **NextAuth** for... nothing (should be removed)

Replace all `auth()` calls with `requireAuth()`.

---

## Support & Resources

- **Main Documentation**: `README.md`
- **Database Schema**: `COMPLETE_DATABASE_SCHEMA.sql`
- **System Audit**: `COMPLETE_SYSTEM_AUDIT.md`
- **Auth Audit**: `API_AUTH_AUDIT_REPORT.md`
- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Next.js API Docs**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## Final Notes

This is a **CRITICAL SECURITY FIX** that must be completed before any production launch.

The current state allows:
- ❌ Unauthenticated users to access all APIs
- ❌ Users to see other organizations' data
- ❌ No audit trail of who accessed what
- ❌ No rate limiting or abuse prevention

After fixes:
- ✅ All APIs require authentication
- ✅ Workspace isolation enforced
- ✅ Comprehensive logging
- ✅ Clear error messages
- ✅ Production-ready security

**Estimated Time**: 2-4 weeks for full implementation
**Risk**: HIGH if not completed
**Priority**: P0 - CRITICAL

Good luck! 🚀
