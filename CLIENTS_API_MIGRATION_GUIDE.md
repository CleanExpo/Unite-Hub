# Clients API Migration Guide
**Status**: 8/25 Complete (32%)
**Priority**: Medium (after WhatsApp API)
**Estimated Time**: 2-3 hours for remaining 17 endpoints

---

## Progress Summary

### ✅ Migrated (8 endpoints)
1. `/api/clients/route.ts` - POST (create client)
2. `/api/clients/[id]/route.ts` - GET, PUT, DELETE (client CRUD)
3. `/api/clients/[id]/campaigns/route.ts` - GET, POST
4. `/api/clients/[id]/emails/route.ts` - GET
5. `/api/clients/[id]/persona/route.ts` - GET, POST
6. `/api/clients/[id]/strategy/route.ts` - GET, POST

### ⏳ Remaining (17 endpoints)

**High Priority** (core client functionality):
- `/api/clients/[id]/sequences/route.ts` - Email sequences
- `/api/clients/[id]/campaigns/[cid]/route.ts` - Campaign details
- `/api/clients/[id]/campaigns/duplicate/route.ts` - Campaign duplication

**Medium Priority** (AI features):
- `/api/clients/[id]/mindmap/route.ts` - GET, POST
- `/api/clients/[id]/mindmap/update/route.ts` - POST
- `/api/clients/[id]/mindmap/export/route.ts` - GET
- `/api/clients/[id]/persona/history/route.ts` - GET
- `/api/clients/[id]/persona/export/route.ts` - GET
- `/api/clients/[id]/strategy/platforms/route.ts` - GET
- `/api/clients/[id]/strategy/export/route.ts` - GET

**Low Priority** (asset management):
- `/api/clients/[id]/images/route.ts` - GET, POST
- `/api/clients/[id]/images/[imageId]/route.ts` - GET, DELETE
- `/api/clients/[id]/assets/route.ts` - GET
- `/api/clients/[id]/assets/upload/route.ts` - POST
- `/api/clients/[id]/assets/[assetId]/route.ts` - GET, DELETE
- `/api/clients/[id]/hooks/route.ts` - webhooks
- `/api/clients/[id]/social-templates/route.ts` - GET, POST
- `/api/clients/[id]/social-templates/seed/route.ts` - POST
- `/api/clients/[id]/landing-pages/route.ts` - GET, POST

---

## Migration Pattern

All Clients API endpoints follow the same security pattern:

### Step 1: Replace Imports
```typescript
// ❌ Remove
import { authenticateRequest } from "@/lib/auth";

// ✅ Add
import { validateUserAuth } from "@/lib/workspace-validation";
```

### Step 2: Replace Auth Logic
```typescript
// ❌ Before (INSECURE)
const authResult = await authenticateRequest(request);
if (!authResult) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const { userId } = authResult;

const { id } = await params;
const client = await db.contacts.getById(id);
if (!client) {
  return NextResponse.json({ error: "Client not found" }, { status: 404 });
}

// ✅ After (SECURE)
const { id } = await params;

// Validate user authentication
const user = await validateUserAuth(request);

// Check if client exists and verify workspace access
const client = await db.contacts.getById(id);
if (!client) {
  return NextResponse.json({ error: "Client not found" }, { status: 404 });
}

// Verify workspace access
if (client.workspace_id !== user.orgId) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

### Step 3: Update Error Handling
```typescript
// ❌ Before
} catch (error) {
  console.error("Error:", error);
  return NextResponse.json({ error: "Failed" }, { status: 500 });
}

// ✅ After
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }
  console.error("Error:", error);
  return NextResponse.json({ error: "Failed" }, { status: 500 });
}
```

### Step 4: Add User Tracking (Optional but Recommended)
```typescript
// In audit logs
await db.auditLogs.create({
  org_id: workspace.org_id,
  action: "action_name",
  resource: "resource_type",
  resource_id: id,
  agent: "user",
  status: "success",
  details: {
    ...existingDetails,
    user_id: user.userId  // ✅ Add this
  },
});

// In create operations
const resource = await db.resources.create({
  ...fields,
  created_by: user.userId,  // ✅ Add this
});
```

---

## Quick Migration Checklist

For each endpoint:
- [ ] Update imports (replace `authenticateRequest` with `validateUserAuth`)
- [ ] Move `const { id } = await params;` before auth
- [ ] Replace auth check with `const user = await validateUserAuth(request);`
- [ ] Add workspace verification: `if (client.workspace_id !== user.orgId) { return 403; }`
- [ ] Update error handling (add 401/403 checks)
- [ ] Add `user_id` to audit logs (if applicable)
- [ ] Add `created_by` to create operations (if applicable)
- [ ] Test with:
  - Valid user in correct workspace (should succeed)
  - Valid user in wrong workspace (should return 403)
  - No auth (should return 401)

---

## Special Cases

### File Upload Endpoints
For endpoints with file uploads (`assets/upload`, `images` POST):
- Validate file size/type **after** workspace verification
- Store files with workspace-scoped paths
- Add workspace_id to file metadata

```typescript
// Validate workspace first
const user = await validateUserAuth(request);
const client = await db.contacts.getById(id);
if (client.workspace_id !== user.orgId) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}

// Then process file upload
const formData = await request.formData();
const file = formData.get("file") as File;
// ... upload logic with workspace context
```

### Export Endpoints
For export endpoints (`persona/export`, `strategy/export`, `mindmap/export`):
- Same pattern applies
- Generate export files with workspace-scoped data only
- No additional changes needed beyond standard pattern

### Webhook Endpoints
For `/api/clients/[id]/hooks/route.ts`:
- If webhooks are **outgoing** (client triggers external services):
  - Apply standard migration pattern
  - Validate workspace ownership

- If webhooks are **incoming** (external services call this endpoint):
  - **DO NOT** use user session validation
  - Use webhook secret validation instead
  - See `WORKSPACE_ISOLATION_PHASE2_PROGRESS.md` for webhook patterns

---

## Batch Migration Strategy

To complete remaining 17 endpoints efficiently:

### Approach 1: By Priority (Recommended)
1. **High Priority** (3 endpoints, ~30 min)
   - sequences, campaign details, campaign duplicate
2. **Medium Priority** (7 endpoints, ~1 hour)
   - mindmap (3), persona history/export (2), strategy platforms/export (2)
3. **Low Priority** (7 endpoints, ~1-1.5 hours)
   - assets/images (5), hooks (1), templates/landing (3)

### Approach 2: By Complexity
1. **Simple GETs** (6 endpoints, ~30 min)
   - All export/history endpoints follow same pattern
2. **GET/POST Pairs** (4 endpoints, ~45 min)
   - mindmap, assets, images, templates
3. **Complex Operations** (3 endpoints, ~45 min)
   - upload, duplicate, webhooks

---

## Testing After Migration

For each migrated endpoint, test:

```bash
# Test 1: Valid workspace access (should succeed)
curl -X GET "http://localhost:3008/api/clients/{clientId}/resource" \
  -H "Authorization: Bearer {valid_token}"

# Test 2: Wrong workspace (should return 403)
curl -X GET "http://localhost:3008/api/clients/{other_workspace_client_id}/resource" \
  -H "Authorization: Bearer {valid_token}"

# Test 3: No auth (should return 401)
curl -X GET "http://localhost:3008/api/clients/{clientId}/resource"
```

---

## Estimated Completion Time

| Group | Endpoints | Complexity | Time |
|-------|-----------|------------|------|
| High Priority | 3 | Low | 30 min |
| Medium Priority (AI) | 7 | Medium | 1 hour |
| Low Priority (Assets) | 7 | Medium-High | 1.5 hours |
| **Total** | **17** | - | **3 hours** |

**With testing**: Add 30 minutes = **3.5 hours total**

---

## Next Steps

**Recommended Priority Order**:
1. ✅ Complete WhatsApp API (4 endpoints, 30-45 min) - **CRITICAL** for customer communication
2. ⏳ Finish Clients API (17 endpoints, 3 hours)
3. ⏳ Review Integrations API (22 endpoints, selective migration)

**Alternative**: If Clients API completion is urgent, prioritize high-priority endpoints (sequences, campaigns) before switching to WhatsApp.

---

**Last Updated**: 2025-11-17
**Next Review**: After WhatsApp API migration

