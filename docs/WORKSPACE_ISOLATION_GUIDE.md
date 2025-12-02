# Workspace Isolation Quick Reference

**Last Updated**: 2025-12-03
**Status**: MANDATORY for all database operations

## Critical Rule

**EVERY database query MUST include workspace_id filter for workspace-scoped tables.**

## Updated Function Signatures

### Contacts Module

```typescript
// ✅ UPDATED - Now requires workspaceId
db.contacts.getById(id: string, workspaceId: string)
db.contacts.update(id: string, workspaceId: string, data: any)
db.contacts.updateScore(id: string, workspaceId: string, score: number)
db.contacts.updateIntelligence(id: string, workspaceId: string, intelligence: any)
db.contacts.getWithEmails(id: string, workspaceId: string)

// ✅ Already workspace-scoped (no change)
db.contacts.listByWorkspace(workspaceId: string)
db.contacts.getHighestScored(workspaceId: string, limit?: number)
db.contacts.getByEmail(email: string, workspaceId: string)
db.contacts.createIfNotExists(data: { workspace_id: string, ... })
```

### Emails Module

```typescript
// ✅ UPDATED - Now requires workspaceId
db.emails.getById(id: string, workspaceId: string)
db.emails.getByContact(contactId: string, workspaceId: string)
db.emails.listByContact(contactId: string, workspaceId: string, limit?: number)

// ✅ Already workspace-scoped (no change)
db.emails.getUnprocessed(workspaceId: string)
```

## Common Usage Patterns

### Pattern 1: API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // 1. Extract workspaceId from query params
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const contactId = req.nextUrl.searchParams.get("contactId");

  // 2. Validate workspaceId
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  // 3. Pass workspaceId to db function
  try {
    const contact = await db.contacts.getById(contactId, workspaceId);
    return NextResponse.json({ contact });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Pattern 2: Agent Code

```typescript
import { db } from "@/lib/db";

export async function processEmail(emailId: string, workspaceId: string) {
  // 1. Get email (already workspace-scoped)
  const email = await db.emails.getById(emailId, workspaceId);

  // 2. Get related contact
  const contact = await db.contacts.getById(email.contact_id, workspaceId);

  // 3. Update contact with new intelligence
  await db.contacts.updateIntelligence(
    contact.id,
    workspaceId,
    { analyzed_at: new Date() }
  );

  // 4. Update contact score
  await db.contacts.updateScore(contact.id, workspaceId, 85);

  return { email, contact };
}
```

### Pattern 3: React Components (Client-Side)

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function ContactDetail({ contactId }: { contactId: string }) {
  const { currentOrganization } = useAuth();
  const [contact, setContact] = useState(null);

  useEffect(() => {
    async function loadContact() {
      // 1. Get workspaceId from auth context
      const workspaceId = currentOrganization?.org_id;

      if (!workspaceId) {
        console.error("No workspace selected");
        return;
      }

      // 2. Call API with workspaceId
      const response = await fetch(
        `/api/contacts/detail?contactId=${contactId}&workspaceId=${workspaceId}`
      );

      const data = await response.json();
      setContact(data.contact);
    }

    loadContact();
  }, [contactId, currentOrganization]);

  return <div>{/* Render contact */}</div>;
}
```

### Pattern 4: Server Components (Next.js)

```typescript
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: { contactId: string };
  searchParams: { workspaceId?: string };
}) {
  // 1. Get workspaceId from searchParams or session
  const workspaceId = searchParams.workspaceId;

  if (!workspaceId) {
    return <div>Error: Workspace not selected</div>;
  }

  // 2. Fetch data with workspaceId
  const contact = await db.contacts.getById(params.contactId, workspaceId);
  const emails = await db.emails.getByContact(params.contactId, workspaceId);

  return (
    <div>
      <h1>{contact.name}</h1>
      <ul>
        {emails.map((email) => (
          <li key={email.id}>{email.subject}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Error Handling

### Missing workspaceId

```typescript
// Function will throw this error:
throw new Error('workspaceId is required for workspace isolation');

// Handle it like this:
try {
  const contact = await db.contacts.getById(contactId, workspaceId);
} catch (error) {
  if (error.message.includes('workspaceId is required')) {
    // Handle missing workspace error
    console.error("Workspace ID is missing - security violation prevented");
    return null;
  }
  throw error;
}
```

### Contact Not Found

```typescript
// Functions return null (not throw) when record not found
const contact = await db.contacts.getById(contactId, workspaceId);

if (!contact) {
  // Contact doesn't exist OR doesn't belong to this workspace
  return NextResponse.json(
    { error: "Contact not found" },
    { status: 404 }
  );
}
```

## Migration Checklist

When updating existing code:

- [ ] Add `workspaceId` parameter to function calls
- [ ] Extract workspaceId from request/context/session
- [ ] Add validation to ensure workspaceId is present
- [ ] Update error handling for null returns
- [ ] Test that cross-workspace access is blocked
- [ ] Update TypeScript types if using custom interfaces

## Common Mistakes

### ❌ Mistake 1: Not passing workspaceId

```typescript
// ❌ WRONG - Missing workspaceId
const contact = await db.contacts.getById(contactId);

// ✅ CORRECT
const contact = await db.contacts.getById(contactId, workspaceId);
```

### ❌ Mistake 2: Using hardcoded workspace

```typescript
// ❌ WRONG - Security bypass attempt
const contact = await db.contacts.getById(contactId, "some-workspace-id");

// ✅ CORRECT - Get from authenticated context
const workspaceId = currentOrganization?.org_id;
const contact = await db.contacts.getById(contactId, workspaceId);
```

### ❌ Mistake 3: Not validating workspaceId

```typescript
// ❌ WRONG - No validation
const contact = await db.contacts.getById(contactId, workspaceId);

// ✅ CORRECT - Validate first
if (!workspaceId) {
  throw new Error("Workspace ID is required");
}
const contact = await db.contacts.getById(contactId, workspaceId);
```

## Testing

### Unit Test Example

```typescript
import { db } from "@/lib/db";

describe("Workspace Isolation", () => {
  it("should block access to contacts from other workspaces", async () => {
    const workspace1 = "workspace-1";
    const workspace2 = "workspace-2";

    // Create contact in workspace 1
    const contact = await db.contacts.create({
      workspace_id: workspace1,
      email: "test@example.com",
    });

    // Try to access from workspace 2 - should return null
    const result = await db.contacts.getById(contact.id, workspace2);
    expect(result).toBeNull();

    // Access from workspace 1 - should succeed
    const result2 = await db.contacts.getById(contact.id, workspace1);
    expect(result2).not.toBeNull();
    expect(result2.id).toBe(contact.id);
  });

  it("should throw error when workspaceId is missing", async () => {
    await expect(
      db.contacts.getById("contact-id", null)
    ).rejects.toThrow("workspaceId is required");
  });
});
```

## FAQ

### Q: Do ALL database functions require workspaceId?

**A**: No. Only functions that access workspace-scoped tables (contacts, emails, campaigns, etc.). Organization and user functions don't need it.

### Q: What if I need to access data across workspaces (admin operations)?

**A**: Use a different approach:
1. Don't use these functions directly
2. Create admin-specific functions that explicitly bypass workspace filtering
3. Add proper authorization checks to ensure only admins can use them
4. Audit all admin operations

### Q: How do I get workspaceId in different contexts?

**A**:
- **API Routes**: `req.nextUrl.searchParams.get("workspaceId")`
- **React Client**: `useAuth().currentOrganization?.org_id`
- **Server Components**: `searchParams.workspaceId` or session
- **Agents**: From email/contact/message object that triggered the agent

### Q: What about performance?

**A**: Minimal impact. The additional `.eq("workspace_id", workspaceId)` filter:
- Uses indexed column (ensure index exists)
- Actually improves performance by reducing result set
- Adds ~0.1ms to query time

## Related Documentation

- **Security Audit**: `docs/API_ROUTE_SECURITY_AUDIT.md`
- **Fix Summary**: `WORKSPACE_ISOLATION_FIX_SUMMARY.md`
- **Schema Reference**: `.claude/SCHEMA_REFERENCE.md`
- **RLS Workflow**: `.claude/RLS_WORKFLOW.md`

---

**Remember**: Workspace isolation is a SECURITY feature, not just a data organization feature. Treat workspaceId with the same importance as authentication tokens.
