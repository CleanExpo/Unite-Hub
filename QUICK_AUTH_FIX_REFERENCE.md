# Quick Authentication Fix Reference

**COPY-PASTE PATTERNS** for fixing API endpoints

---

## Pattern 1: Simple Authentication (Profile, Settings)

**Use when**: Endpoint doesn't need workspace validation

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase, orgId } = await requireAuth(req);

    // Your logic here
    // user.id, user.email available
    // supabase client ready

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error("[/api/your-endpoint] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Pattern 2: Workspace Authentication (Contacts, Campaigns)

**Use when**: Endpoint operates on workspace-scoped data

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase, orgId, workspaceId } = await requireWorkspace(req);

    // workspaceId is VALIDATED - guaranteed to belong to user's org

    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId);

    return NextResponse.json({ data });

  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error("[/api/your-endpoint] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Pattern 3: Multiple HTTP Methods

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace, AuthError } from "@/lib/api-auth";

// GET - List resources
export async function GET(req: NextRequest) {
  try {
    const { user, supabase, workspaceId } = await requireWorkspace(req);

    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId);

    return NextResponse.json({ contacts: data });

  } catch (error) {
    if (error instanceof AuthError) return error.toResponse();
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create resource
export async function POST(req: NextRequest) {
  try {
    const { user, supabase, workspaceId } = await requireWorkspace(req);
    const body = await req.json();

    const { data } = await supabase
      .from("contacts")
      .insert({ ...body, workspace_id: workspaceId })
      .select()
      .single();

    return NextResponse.json({ contact: data });

  } catch (error) {
    if (error instanceof AuthError) return error.toResponse();
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update resource
export async function PUT(req: NextRequest) {
  try {
    const { user, supabase, workspaceId } = await requireWorkspace(req);
    const body = await req.json();
    const { id } = body;

    const { data } = await supabase
      .from("contacts")
      .update(body)
      .eq("id", id)
      .eq("workspace_id", workspaceId) // Enforce workspace isolation
      .select()
      .single();

    return NextResponse.json({ contact: data });

  } catch (error) {
    if (error instanceof AuthError) return error.toResponse();
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Delete resource
export async function DELETE(req: NextRequest) {
  try {
    const { user, supabase, workspaceId } = await requireWorkspace(req);
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    await supabase
      .from("contacts")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId); // Enforce workspace isolation

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof AuthError) return error.toResponse();
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

---

## Pattern 4: Dynamic Route Parameters

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace, AuthError, validateContactAccess } from "@/lib/api-auth";

// app/api/contacts/[contactId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const { user, supabase, workspaceId } = await requireWorkspace(req);
    const { contactId } = await params;

    // Validate contact belongs to workspace
    const hasAccess = await validateContactAccess(supabase, contactId, workspaceId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .single();

    return NextResponse.json({ contact: data });

  } catch (error) {
    if (error instanceof AuthError) return error.toResponse();
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

---

## Pattern 5: Public Endpoint (Webhook)

**Use when**: Endpoint should NOT have authentication (webhooks, tracking)

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature instead of auth
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature || !verifyWebhookSignature(signature, body)) {
      console.error("[/api/webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Process webhook
    const event = JSON.parse(body);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[/api/webhook] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

---

## Common Mistakes to Avoid

### ❌ DON'T: Use old auth() pattern
```typescript
import { auth } from "@/lib/auth";
const session = await auth(); // BROKEN - doesn't work
```

### ❌ DON'T: Skip workspace validation
```typescript
const { workspaceId } = await req.json();
// Missing validation - user could access ANY workspace!
const data = await supabase.from("contacts").select("*").eq("workspace_id", workspaceId);
```

### ❌ DON'T: Forget error handling
```typescript
const { user } = await requireAuth(req);
// Missing try-catch - errors will crash the endpoint
```

### ❌ DON'T: Mix authentication patterns
```typescript
const supabase = await getSupabaseServer();
const { user } = await requireAuth(req); // Don't do both
```

---

## Testing Checklist

After fixing an endpoint:

- [ ] Endpoint compiles without errors
- [ ] Returns 401 when called without authentication
- [ ] Returns 403 when called with wrong workspace
- [ ] Returns 200 when called with valid auth + workspace
- [ ] Server logs show detailed error messages
- [ ] Database queries include workspace_id filter
- [ ] No cross-workspace data leakage
- [ ] Error handling catches AuthError
- [ ] All HTTP methods are protected

---

## Quick Test Commands

```bash
# Test 1: No auth (should return 401)
curl -X POST http://localhost:3008/api/your-endpoint

# Test 2: Wrong workspace (should return 403)
curl -X POST http://localhost:3008/api/your-endpoint \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "wrong-workspace-id"}'

# Test 3: Valid auth + workspace (should return 200)
curl -X POST http://localhost:3008/api/your-endpoint \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId": "correct-workspace-id"}'
```

---

## Import Statements

**Always include**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/api-auth";
// or
import { requireWorkspace, AuthError } from "@/lib/api-auth";
```

**Optional helpers**:
```typescript
import { validateContactAccess, validateCampaignAccess } from "@/lib/api-auth";
```

---

## Which Pattern to Use?

| Endpoint Type | Pattern | Example |
|---------------|---------|---------|
| User profile | Pattern 1 (requireAuth) | `/api/profile/update` |
| User settings | Pattern 1 (requireAuth) | `/api/settings/update` |
| Contacts | Pattern 2 (requireWorkspace) | `/api/contacts/*` |
| Campaigns | Pattern 2 (requireWorkspace) | `/api/campaigns/*` |
| Emails | Pattern 2 (requireWorkspace) | `/api/emails/*` |
| Integrations | Pattern 2 (requireWorkspace) | `/api/integrations/*` |
| Organizations | Pattern 1 (requireAuth) | `/api/organizations/*` |
| Webhooks | Pattern 5 (public) | `/api/webhooks/*` |
| Health check | Pattern 5 (public) | `/api/health` |

---

## Priority Order

Fix in this order:

1. **Contacts endpoints** (7 endpoints) - IMMEDIATE
2. **Gmail integration** (15 endpoints) - THIS WEEK
3. **Campaigns** (2 endpoints) - THIS WEEK
4. **Clients** (25 endpoints) - NEXT WEEK
5. **AI features** (31 endpoints) - NEXT WEEK
6. **Everything else** (20 endpoints) - WEEK 3-4

---

## Need Help?

**Full Documentation**:
- Implementation Guide: `API_AUTH_FIX_GUIDE.md`
- Executive Summary: `SECURITY_AUDIT_SUMMARY.md`
- Detailed Audit: `API_AUTH_AUDIT_REPORT.md`

**Tools**:
- Auditor: `node scripts/fix-api-auth.mjs`
- Fixer: `node scripts/apply-api-auth-fixes.mjs --dry-run`

**Code**:
- Middleware: `src/lib/api-auth.ts`

---

**TIP**: When in doubt, use **Pattern 2 (requireWorkspace)** - it's the safest default.

Good luck! 🔒
