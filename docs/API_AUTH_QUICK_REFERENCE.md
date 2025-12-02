# API Authentication - Quick Reference Card

**For:** Developers fixing routes without authentication
**Last Updated:** 2025-12-02

---

## 🚀 Quick Decision Tree

```
Does the route handle workspace-specific data (contacts, campaigns, etc.)?
├─ YES → Use Pattern 1: validateUserAndWorkspace()
└─ NO
    │
    Does it need user identity (profile, AI generation)?
    ├─ YES → Use Pattern 2: validateUserAuth()
    └─ NO
        │
        Is it admin/staff only?
        ├─ YES → Use Pattern 3: getUser() + role check
        └─ NO
            │
            Is it a cron job?
            ├─ YES → Use Pattern 4: validateCronRequest()
            └─ NO → Likely public (add rate limiting)
```

---

## Pattern 1: User + Workspace (Most Common)

**When:** Route operates on workspace-specific data

```typescript
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  // Get workspaceId from query params
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  // Validates user session AND workspace access
  await validateUserAndWorkspace(req, workspaceId);

  // Get authenticated Supabase client
  const supabase = await getSupabaseServer();

  // Query with workspace filter
  const { data, error } = await supabase
    .from("your_table")
    .select("*")
    .eq("workspace_id", workspaceId);

  return NextResponse.json({ data });
}
```

**Use for:**
- `/api/contacts/*`
- `/api/campaigns/*`
- `/api/emails/*`
- Any route with workspace-scoped data

---

## Pattern 2: User Auth Only

**When:** Route needs user identity but not workspace-specific

```typescript
import { validateUserAuth } from "@/lib/workspace-validation";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Validates user session, returns user object
  const user = await validateUserAuth(req);

  // user.userId and user.orgId available
  const body = await req.json();

  // Your logic here (AI generation, profile update, etc.)

  return NextResponse.json({ success: true });
}
```

**Use for:**
- `/api/ai/generate-*` (AI generation)
- `/api/profile/*` (user profile)
- `/api/synthex/*` (content generation)
- Cross-workspace operations

---

## Pattern 3: Admin/Staff Routes

**When:** Route is for internal staff or admins only

```typescript
import { getUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Get user from session
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role from profiles table
  const supabase = await getSupabaseServer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN" && profile?.role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin/staff logic here

  return NextResponse.json({ success: true });
}
```

**Use for:**
- `/api/admin/*`
- `/api/staff/*`
- Internal operation endpoints

---

## Pattern 4: Cron Jobs

**When:** Route is called by scheduled tasks (Vercel Cron)

```typescript
import { validateCronRequest } from "@/lib/cron/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

export async function GET(req: NextRequest) {
  // Validate CRON_SECRET with timestamp protection
  const auth = validateCronRequest(req, { logPrefix: "JobName" });
  if (!auth.valid) {
    return auth.response; // Returns 401 with error
  }

  // Your cron job logic here

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
  });
}
```

**Environment Variable Required:**
```env
CRON_SECRET=your-secret-key-here
```

**Use for:**
- `/api/cron/*`
- Background jobs
- Automated tasks

---

## Pattern 5: Webhook (Signature Verification)

**When:** Route receives webhooks from external services

### Stripe Webhook Example

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Process event
    console.log("Event:", event.type);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }
}
```

**Use for:**
- `/api/webhooks/stripe`
- `/api/webhooks/whatsapp`
- External service callbacks

---

## Pattern 6: OAuth Callback

**When:** Route is OAuth callback (Gmail, Outlook, etc.)

```typescript
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Get user session
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify state matches session (prevents CSRF)
  if (state !== session.oauthState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Exchange code for tokens
  // Link integration to user account

  return NextResponse.redirect("/dashboard/integrations?success=true");
}
```

**Use for:**
- `/api/integrations/*/callback`
- OAuth flow endpoints

---

## Pattern 7: Public Route (Rate Limited)

**When:** Route should be publicly accessible

```typescript
import { publicRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Apply rate limiting (required for public routes)
  const rateLimitResult = await publicRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult; // Returns 429 if rate limited
  }

  // Your public route logic here

  return NextResponse.json({ success: true });
}
```

**Use for:**
- `/api/contact/submit` (contact forms)
- `/api/health` (health checks)
- `/api/tracking/pixel/*` (tracking pixels)
- Public API endpoints

---

## Common Errors & Fixes

### Error: "workspace_id undefined"
**Fix:** Add workspaceId validation at start of route
```typescript
const workspaceId = req.nextUrl.searchParams.get("workspaceId");
if (!workspaceId) {
  return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
}
```

### Error: "supabase is not defined"
**Fix:** Import and use getSupabaseServer()
```typescript
import { getSupabaseServer } from "@/lib/supabase";

const supabase = await getSupabaseServer();
```

### Error: "User can access other workspace data"
**Fix:** Always filter by workspace_id
```typescript
.eq("workspace_id", workspaceId)
```

### Error: "401 Unauthorized but user is logged in"
**Fix:** Make sure to use await on auth functions
```typescript
await validateUserAndWorkspace(req, workspaceId); // ✅
validateUserAndWorkspace(req, workspaceId);       // ❌
```

---

## Testing Your Changes

### 1. Test Unauthenticated Access
```bash
curl http://localhost:3008/api/your-route
# Should return: 401 Unauthorized
```

### 2. Test With Valid Token
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3008/api/your-route?workspaceId=UUID
# Should return: 200 OK with data
```

### 3. Test Cross-Workspace Access
- User A in Workspace 1 tries to access Workspace 2 data
- Should return: 403 Forbidden or empty data

### 4. Test Rate Limiting (public routes)
```bash
# Make 21 requests in 1 minute
for i in {1..21}; do curl http://localhost:3008/api/your-route; done
# 21st request should return: 429 Too Many Requests
```

---

## Import Reference

```typescript
// User + Workspace validation (most common)
import { validateUserAndWorkspace } from "@/lib/workspace-validation";

// User validation only
import { validateUserAuth } from "@/lib/workspace-validation";

// Workspace access check (after getting orgId)
import { validateWorkspaceAccess } from "@/lib/workspace-validation";

// Get user from session (low-level)
import { getUser, getSession } from "@/lib/auth";

// Cron job validation
import { validateCronRequest } from "@/lib/cron/auth";

// Rate limiting
import { publicRateLimit, aiAgentRateLimit, strictRateLimit } from "@/lib/rate-limit";

// Supabase clients
import { getSupabaseServer } from "@/lib/supabase"; // Server-side (most common)
import { supabaseBrowser } from "@/lib/supabase";   // Client-side
import { getSupabaseAdmin } from "@/lib/supabase";  // Admin (bypass RLS)
```

---

## Files to Reference

### Good Examples (copy these patterns):
1. `src/app/api/contacts/route.ts` - Perfect user + workspace auth
2. `src/app/api/campaigns/route.ts` - Multi-method with validation
3. `src/app/api/cron/health-check/route.ts` - Cron job pattern
4. `src/app/api/stripe/webhook/route.ts` - Webhook signature verification

### Documentation:
1. `docs/API_ROUTE_SECURITY_AUDIT.md` - Full audit report
2. `docs/API_AUTH_CRITICAL_FINDINGS.md` - Prioritized findings
3. `docs/API_ROUTES_NEED_AUTH.txt` - List of routes to fix

---

## Checklist Before Committing

- [ ] Auth function is imported correctly
- [ ] `await` keyword used on async auth calls
- [ ] workspaceId validated if route uses workspace data
- [ ] Database queries filter by workspace_id
- [ ] Rate limiting added (if public route)
- [ ] Error messages don't leak sensitive info
- [ ] Tested: unauthenticated → 401
- [ ] Tested: valid user → 200 OK
- [ ] Tested: cross-workspace → blocked

---

## Quick Test Commands

```bash
# Re-run full audit
node scripts/audit-api-auth.mjs

# Test local endpoint
curl http://localhost:3008/api/your-route

# Test with auth header
curl -H "Authorization: Bearer TOKEN" http://localhost:3008/api/your-route

# Check if route file exists
ls -la src/app/api/your-route/route.ts
```

---

**Need Help?** Check the full documentation:
- `docs/API_ROUTE_SECURITY_AUDIT.md`
- `docs/API_AUTH_CRITICAL_FINDINGS.md`
- `.claude/QUICK_FIX_GUIDE.md`

**Re-run Audit:** `node scripts/audit-api-auth.mjs`
