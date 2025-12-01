# Phase 6.2 Route Migration Playbook

## Status: 8/20 Routes Complete (40%)

### Completed Routes
1. ✅ `/api/auth/initialize-user` (Commit: 368c7756)
2. ✅ `/api/contacts` GET/POST (Commit: b2da9d25)
3. ✅ `/api/auth/client-login` (Commit: 2e43312e)
4. ✅ `/api/auth/client-logout` (Commit: 2e43312e)
5. ✅ `/api/auth/staff-login` (Commit: 2e43312e)
6. ✅ `/api/campaigns` GET/POST (Commit: 3045bb6f)
7. ✅ `/api/agents/contact-intelligence` (Commit: 33c9515d)
8. ✅ `/api/agents/content-personalization` (Commit: 33c9515d)

### Next Priority Routes (9-20)

#### Tier 1: Cron/Agent Routes (Simpler, HIGH value)
- **Route 9**: `/api/agents/continuous-intelligence` (GET/POST) - Cron job handlers
  - Size: 193 lines
  - Complexity: Medium (2 handlers, cron auth)
  - Est. time: 15 min

- **Route 10**: `/api/agents/intelligence-extraction` (GET/POST)
  - Size: 151 lines
  - Complexity: Medium (2 handlers, rate limiting)
  - Est. time: 15 min

#### Tier 2: Dynamic ID Routes (Quick wins, MEDIUM value)
- **Route 11**: `/api/campaigns/blueprints/[id]` (GET/PATCH/DELETE)
  - Size: ~250 lines
  - Complexity: High (3 handlers, role-based)
  - Est. time: 20 min

- **Route 12**: `/api/approvals/[id]` (GET/PATCH)
  - Size: ~150 lines
  - Complexity: Medium (2 handlers)
  - Est. time: 15 min

#### Tier 3: Integration Routes (Important, MEDIUM-LOW value)
- **Route 13**: `/api/ai-consultations/[id]` (GET)
- **Route 14**: `/api/aido/clients/[id]` (GET)
- **Route 15**: `/api/autonomy/proposals/[id]` (GET/PATCH)
- **Route 16**: `/api/autopilot/actions/[id]/approve` (POST)
- **Route 17**: `/api/autopilot/actions/[id]/skip` (POST)
- **Route 18**: `/api/approvals/[id]/approve` (POST)
- **Route 19**: `/api/approvals/[id]/decline` (POST)
- **Route 20**: `/api/campaigns/drip` (GET/POST)

## Migration Template

### Step 1: Update Imports
```typescript
// ❌ Before
import { NextRequest, NextResponse } from "next/server";

// ✅ After
/* eslint-disable @typescript-eslint/no-explicit-any, no-undef */
import type { NextRequest } from "next/server";
import { withErrorBoundary, ValidationError, AuthenticationError, AuthorizationError, DatabaseError, ConflictError, NotFoundError, successResponse } from "@/lib/errors/boundaries";
```

### Step 2: Convert Handlers
```typescript
// ❌ Before
export async function GET(req: NextRequest) {
  try {
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase.from(...);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: ... }, { status: 500 });
  }
}

// ✅ After
export const GET = withErrorBoundary(async (req: NextRequest) => {
  if (!auth) throw new AuthenticationError("message");
  const { data, error } = await supabase.from(...);
  if (error) throw new DatabaseError("message");
  return successResponse({ success: true, data }, undefined, undefined, 200);
});
```

### Step 3: Error Type Mapping
| Scenario | Error Type | HTTP |
|----------|-----------|------|
| Missing/invalid auth token | `AuthenticationError` | 401 |
| User lacks permission/org/role | `AuthorizationError` | 403 |
| Required field missing | `ValidationError` | 400 |
| Email/ID already exists | `ConflictError` | 409 |
| Resource not found | `NotFoundError` | 404 |
| Database query fails | `DatabaseError` | 500 |
| Invalid input format | `ValidationError` | 400 |

### Step 4: Response Pattern
```typescript
// ✅ Successful responses
return successResponse(data, meta, message, 200);
return successResponse(data, undefined, "Created successfully", 201);
return successResponse({ id: 123 }, undefined, undefined, 204); // No content

// ✅ Error throwing (handled by boundary)
throw new ValidationError("Invalid input", { field: "message" });
throw new DatabaseError("Failed to fetch");
```

## Execution Checklist

For each route (9-20):

- [ ] Read route file completely
- [ ] Update imports (step 1)
- [ ] Convert all handlers (step 2)
- [ ] Replace error handling (step 3)
- [ ] Update return statements (step 4)
- [ ] Verify ESLint passes (pre-commit hook)
- [ ] Test build: `npm run build`
- [ ] Verify 590/590 pages compile
- [ ] Commit with message: `refactor: Phase 6.2 - Migrate /api/path to error boundaries`

## Time Estimates

| Routes | Complexity | Total Time | Per Route |
|--------|-----------|-----------|-----------|
| 9-10 | Medium | 30 min | 15 min |
| 11-12 | High | 40 min | 20 min |
| 13-20 | Medium | 60 min | 7.5 min |
| **TOTAL** | - | **~2 hours** | **Average 10 min** |

## Expected Outcomes

**Code Reduction**:
- Route 9: 193 → ~140 lines (-27%)
- Route 10: 151 → ~110 lines (-27%)
- Route 11: 250 → ~180 lines (-28%)

**Benefits**:
- ✅ Consistent error handling across all routes
- ✅ Proper HTTP status codes
- ✅ Centralized error logging
- ✅ Reduced boilerplate by 25-30% per route
- ✅ Type-safe error boundaries
- ✅ Automatic error context capture

## Common Pitfalls to Avoid

1. ❌ Don't keep `try-catch` blocks - error boundary handles all errors
2. ❌ Don't use `NextResponse.json()` directly - use `successResponse()`
3. ❌ Don't mix return statements - all success paths use `successResponse()`
4. ❌ Don't create new error types - use provided ones (ValidationError, DatabaseError, etc.)
5. ❌ Don't forget ESLint disable comment for `no-explicit-any, no-undef`

## Success Criteria

Each migrated route must:
- ✅ Pass ESLint pre-commit hook
- ✅ Build successfully (590/590 pages)
- ✅ Reduce lines by 20-30%
- ✅ Have no try-catch blocks
- ✅ Throw appropriate error types
- ✅ Use `successResponse()` for all success paths
- ✅ Have descriptive error messages

---

**Target**: Complete Routes 9-20 by end of session
**Phase 6.3**: Generate client error type documentation (after reaching 20 routes)
