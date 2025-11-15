# Authentication Pattern Reference

**For Unite-Hub Backend Developers**

---

## Standard Authentication Pattern

Use this pattern for ALL API routes that handle user data:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (orgError || !userOrg) {
      return NextResponse.json({ error: "No active organization found" }, { status: 403 });
    }

    // 3. Get request data
    const { workspaceId, ...otherData } = await req.json();

    // 4. Validate workspace access (if workspaceId is provided)
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("id", workspaceId)
        .eq("org_id", userOrg.org_id)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json({ error: "Invalid workspace or access denied" }, { status: 403 });
      }
    }

    // 5. Continue with your business logic
    // ... your code here ...

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## When to Use This Pattern

✅ **Always use for**:
- Contact management endpoints
- Campaign management endpoints
- Content generation endpoints
- Email operations (send, sync, parse)
- User data access
- AI agent endpoints
- Analytics endpoints

❌ **Do NOT use for**:
- Public webhooks (use signature verification instead)
- OAuth callbacks (handle auth differently)
- Public tracking pixels
- Health check endpoints

---

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| `401 Unauthorized` | No valid authentication | `authError || !user` |
| `403 Forbidden` | Valid auth, insufficient permissions | Invalid workspace/org access |
| `400 Bad Request` | Missing required fields | Missing workspaceId when required |
| `500 Internal Server Error` | Server error | Unexpected exceptions |

---

## Common Mistakes

### ❌ WRONG: Skipping workspace validation
```typescript
// Don't do this - allows cross-workspace access!
const { workspaceId } = await req.json();
const data = await db.contacts.listByWorkspace(workspaceId);
```

### ✅ RIGHT: Always validate workspace ownership
```typescript
const { workspaceId } = await req.json();

// Verify workspace belongs to user's org
const { data: workspace, error } = await supabase
  .from("workspaces")
  .select("id")
  .eq("id", workspaceId)
  .eq("org_id", userOrg.org_id)
  .single();

if (error || !workspace) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}

const data = await db.contacts.listByWorkspace(workspaceId);
```

---

## Examples

### Example 1: GET endpoint with query params
```typescript
export async function GET(req: NextRequest) {
  const supabase = getSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!userOrg) {
    return NextResponse.json({ error: "No active organization" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");

  if (workspaceId) {
    // Validate workspace
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", workspaceId)
      .eq("org_id", userOrg.org_id)
      .single();

    if (error || !workspace) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // ... continue with logic
}
```

### Example 2: Multiple methods in one file
```typescript
export async function GET(req: NextRequest) {
  // Auth pattern here
  const { user, userOrg, workspace } = await authenticateRequest(req);
  // ... GET logic
}

export async function POST(req: NextRequest) {
  // Auth pattern here
  const { user, userOrg, workspace } = await authenticateRequest(req);
  // ... POST logic
}

export async function DELETE(req: NextRequest) {
  // Auth pattern here
  const { user, userOrg, workspace } = await authenticateRequest(req);
  // ... DELETE logic
}
```

### Example 3: Helper function (optional)
```typescript
// src/lib/auth-helpers.ts
export async function authenticateRequest(req: NextRequest, requireWorkspace = false) {
  const supabase = getSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: userOrg, error: orgError } = await supabase
    .from("user_organizations")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (orgError || !userOrg) {
    throw new Error("No active organization");
  }

  let workspace = null;
  if (requireWorkspace) {
    const body = await req.json();
    const { data: ws, error: wsError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", body.workspaceId)
      .eq("org_id", userOrg.org_id)
      .single();

    if (wsError || !ws) {
      throw new Error("Invalid workspace");
    }
    workspace = ws;
  }

  return { user, userOrg, workspace };
}

// Usage in route:
export async function POST(req: NextRequest) {
  try {
    const { user, userOrg, workspace } = await authenticateRequest(req, true);
    // ... business logic
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
```

---

## Testing Your Routes

### Manual Test with cURL
```bash
# Test without auth (should fail with 401)
curl -X POST http://localhost:3008/api/your-route \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"test"}'

# Test with auth (get token from browser dev tools)
curl -X POST http://localhost:3008/api/your-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{"workspaceId":"valid-workspace-id"}'

# Test with wrong workspace (should fail with 403)
curl -X POST http://localhost:3008/api/your-route \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{"workspaceId":"someone-elses-workspace"}'
```

### Automated Test
```typescript
import { describe, it, expect } from 'vitest';

describe('POST /api/your-route', () => {
  it('returns 401 without authentication', async () => {
    const res = await fetch('/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'test' })
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 with invalid workspace', async () => {
    const res = await authenticatedFetch('/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: 'invalid-workspace-id' })
    });
    expect(res.status).toBe(403);
  });

  it('succeeds with valid auth and workspace', async () => {
    const res = await authenticatedFetch('/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: validWorkspaceId })
    });
    expect(res.status).toBe(200);
  });
});
```

---

## Security Checklist

Before deploying a new API route, verify:

- [ ] Route has authentication check (`getUser()`)
- [ ] Route validates organization membership
- [ ] Route validates workspace ownership (if applicable)
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 403 for unauthorized access
- [ ] No hardcoded credentials or tokens
- [ ] Sensitive data is not logged
- [ ] Error messages don't leak sensitive info
- [ ] Rate limiting considered (for public-facing routes)
- [ ] Input validation implemented
- [ ] SQL injection prevented (using parameterized queries)

---

## Quick Reference: DO's and DON'Ts

### DO
✅ Always validate user authentication
✅ Always check organization membership
✅ Validate workspace ownership before data access
✅ Use consistent error messages
✅ Log auth failures for security monitoring
✅ Use proper HTTP status codes

### DON'T
❌ Skip authentication for "internal" routes
❌ Trust client-provided user IDs
❌ Allow cross-organization data access
❌ Return detailed error messages to clients
❌ Use commented-out auth code
❌ Mix NextAuth and Supabase auth patterns

---

**Last Updated**: 2025-11-15
**Maintained By**: Backend Security Team
