# Phase 6: Error Boundary Integration & Observability

**Status**: Planning
**Estimated Time**: 3-4 hours
**Goal**: Apply prevention-first architecture to existing codebase and add error observability

---

## Overview

Phase 6 focuses on **practical integration** of the error handling and validation patterns built in Phases 4-5. Rather than implementing new infrastructure, we'll:

1. Migrate 20-30 critical API routes to use error boundaries
2. Integrate error logging with Winston
3. Document error types for client consumption

This phase bridges the gap between **infrastructure (complete)** and **production readiness (in progress)**.

---

## Phase 6 Components

### 6.1 Apply Error Boundaries to Critical Routes (1.5 hours)

**Target Routes** (20-30 most critical):
```
/api/auth/login
/api/auth/logout
/api/auth/initialize-user

/api/contacts/create
/api/contacts/get
/api/contacts/update
/api/contacts/delete

/api/campaigns/create
/api/campaigns/get
/api/campaigns/execute
/api/campaigns/status

/api/integrations/gmail/callback
/api/integrations/gmail/sync

/api/agents/contact-intelligence
/api/agents/content-generation
/api/agents/orchestrator

/api/workspace/list
/api/workspace/validate

/api/workspace/settings/get
/api/workspace/settings/update
```

**Pattern for Each Route**:

```typescript
// BEFORE (with try-catch boilerplate)
export async function POST(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return errorResponse('workspaceId required', 400);
    }

    const validation = await validateRequestBody(req, ContactInsertSchema);
    if (!validation.success) {
      return errorResponse('Invalid data', 400, validation.errors);
    }

    const user = await workspaceValidationService.validateUserAuth(req);
    await workspaceValidationService.validateWorkspaceAccess(workspaceId, user.orgId);

    const result = await createContact(validation.data);
    return successResponse(result, null, 'Contact created', 201);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// AFTER (with error boundary)
export const POST = withErrorBoundary(async (req) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required');
  }

  const validation = await validateRequestBody(req, ContactInsertSchema);
  if (!validation.success) {
    throw new ValidationError('Invalid contact data', validation.errors);
  }

  const user = await workspaceValidationService.validateUserAuth(req);
  await workspaceValidationService.validateWorkspaceAccess(workspaceId, user.orgId);

  const result = await createContact(validation.data);
  return successResponse(result, null, 'Contact created', 201);
});
// ✅ Errors caught automatically, consistent response format
```

**Benefits**:
- 30% less code per route (no try-catch)
- Consistent error response format
- Automatic error logging
- Type-safe error throwing

**Deliverables**:
- [ ] Migrate 20-30 critical routes
- [ ] Verify build still passes (590/590 pages)
- [ ] Test error responses with sample requests
- [ ] Document migration pattern

### 6.2 Error Logging Integration (1 hour)

**Setup Error Logging with Winston**:

```typescript
// src/lib/errors/logging.ts
import winston from 'winston';

export const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/errors.log' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export function logError(error: ApiError, context: any) {
  errorLogger.error({
    code: error.code,
    status: error.status,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp,
    context, // API path, user ID, workspace ID, etc.
  });
}
```

**Integrate with Error Boundaries**:

```typescript
export function withErrorBoundaryLogging(
  handler: ApiHandler,
  context?: { route?: string; operationType?: string }
): ApiHandler {
  return withErrorBoundaryCustom(
    handler,
    (error, req) => {
      const apiError = normalizeError(error);
      logError(apiError, {
        route: context?.route || req.nextUrl.pathname,
        method: req.method,
        operationType: context?.operationType,
        timestamp: new Date().toISOString(),
      });
      return apiError;
    }
  );
}
```

**Deliverables**:
- [ ] Create error logging utility
- [ ] Update error boundaries to log errors
- [ ] Configure log rotation and retention
- [ ] Verify logs are written to disk

### 6.3 Client Error Type Documentation (1 hour)

**Generate Error Reference Document**:

```markdown
# Error Codes Reference

## Authentication (401)

### UNAUTHORIZED
- Code: `UNAUTHORIZED`
- Status: 401
- Message: "Unauthorized: Invalid token"
- Occurs when: User JWT is invalid or expired
- Client action: Re-authenticate user

## Validation (400)

### VALIDATION_ERROR
- Code: `VALIDATION_ERROR`
- Status: 400
- Message: "Invalid contact data"
- Details: Field-level errors
- Example:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid contact data",
      "details": {
        "email": "Invalid email format",
        "ai_score": "Must be between 0 and 100"
      }
    }
  }
  ```

## Database (500)

### DATABASE_ERROR
- Code: `DATABASE_ERROR`
- Status: 500
- Message: "Database operation failed"
- Occurs when: Query fails
- Client action: Retry with exponential backoff

...
```

**Deliverables**:
- [ ] Create comprehensive error codes reference
- [ ] Document error response format
- [ ] Add examples for each error type
- [ ] Publish to API documentation site

---

## Integration Patterns

### Pattern 1: Route Migration

```typescript
// Step 1: Identify route (choose from critical list)
// src/app/api/contacts/create/route.ts

// Step 2: Replace try-catch with error boundary
import { withErrorBoundary } from '@/lib/errors';
import { ValidationError } from '@/lib/errors';

// Step 3: Throw errors instead of returning responses
export const POST = withErrorBoundary(async (req) => {
  const validation = await validateRequestBody(req, ContactInsertSchema);
  if (!validation.success) {
    throw new ValidationError('Invalid contact data', validation.errors);
  }
  // ... rest of logic
});

// Step 4: Test error cases
// - POST with invalid data → 400 with field errors
// - POST with no auth → 401
// - POST to invalid workspace → 403
```

### Pattern 2: Service Error Throwing

```typescript
// src/lib/services/contact.service.ts
export async function createContact(data: ContactInsert): Promise<Contact> {
  const supabase = await getSupabaseServer();

  try {
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to create contact');
    }

    return contact;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Failed to create contact');
  }
}

// Route using service
export const POST = withErrorBoundary(async (req) => {
  const data = await validateRequestBody(req, ContactInsertSchema);
  if (!data.success) {
    throw new ValidationError('Invalid data', data.errors);
  }

  // Service throws DatabaseError on failure
  // Error boundary catches and formats response
  const contact = await createContact(data.data);
  return successResponse(contact);
});
```

### Pattern 3: Cascading Validation

```typescript
export const POST = withErrorBoundary(async (req) => {
  // Step 1: Extract required fields
  const { workspaceId } = await validateRequired(req, {
    workspaceId: z.string().uuid(),
  });

  // Step 2: Validate request body
  const validation = await validateRequestBody(req, ContactInsertSchema);
  if (!validation.success) {
    throw new ValidationError('Invalid data', validation.errors);
  }

  // Step 3: Authenticate user
  const user = await workspaceValidationService.validateUserAuth(req);

  // Step 4: Validate workspace access
  await workspaceValidationService.validateWorkspaceAccess(workspaceId, user.orgId);

  // Step 5: Proceed with business logic
  const contact = await createContact(validation.data);
  return successResponse(contact);
});
// ✅ Any error at any step thrown and caught by boundary
```

---

## Success Criteria

### Code Quality
- [ ] 20-30 routes migrated to error boundaries
- [ ] Zero try-catch boilerplate in migrated routes
- [ ] All error types explicitly thrown
- [ ] No unhandled Promise rejections

### Testing
- [ ] Each migrated route tested with valid input
- [ ] Each migrated route tested with invalid input
- [ ] Each migrated route tested with auth errors
- [ ] Each migrated route tested with workspace errors
- [ ] Error response format verified
- [ ] HTTP status codes correct

### Observability
- [ ] Errors logged to file with context
- [ ] Log file rotated daily
- [ ] Error dashboard shows top errors
- [ ] Error trends tracked

### Documentation
- [ ] Error codes reference published
- [ ] Client error handling guide written
- [ ] Migration pattern documented
- [ ] Troubleshooting guide created

---

## Implementation Order

### Week 1 (Day 1-2): Route Migration
1. Select 5 auth routes (highest priority, easiest to test)
2. Migrate them using error boundary pattern
3. Test and verify error responses
4. Document patterns learned

### Week 1 (Day 3): More Routes
5. Migrate 10 contact management routes
6. Verify validation integration
7. Test error logging

### Week 1 (Day 4): Logging & Documentation
8. Set up error logging
9. Create error codes reference
10. Write client integration guide
11. Final testing and verification

---

## Migration Checklist per Route

For each route being migrated:

```typescript
// ✅ Pre-migration
- [ ] Route identified and ready
- [ ] Current error handling documented
- [ ] Test cases prepared

// ✅ During migration
- [ ] Replace try-catch with error boundary
- [ ] Replace errorResponse() calls with throw statements
- [ ] Update error types to use specific classes
- [ ] Ensure all error paths throw

// ✅ Post-migration
- [ ] Build passes (npm run build)
- [ ] ESLint passes (npm run lint)
- [ ] Tests pass (npm test)
- [ ] Error responses tested manually
- [ ] Logged changes in commit message
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing error response format | Test error responses match spec |
| Forgotten error paths | Use error boundary as catch-all |
| Performance regression | Error logging async, no blocking |
| Incomplete migration | Focus on critical routes first, then expand |

---

## Success Definition

✅ **Phase 6 Complete When**:
1. 20-30 critical routes migrated to error boundaries
2. Error logging integrated and verified
3. Error response format consistent across all routes
4. Error codes reference documented and published
5. Client integration guide written
6. Build passing (590/590 pages)
7. Zero regressions in error handling

---

## Next Phase (Phase 7 - Future)

After Phase 6:
- Migrate remaining 70+ API routes (can be done incrementally)
- Implement client SDK with auto-generated error types
- Set up error monitoring dashboard (Sentry, DataDog)
- Implement rate limiting error responses (429)
- Add error analytics

---

**Goal**: Make error handling explicit, observable, and maintainable across the entire codebase.
