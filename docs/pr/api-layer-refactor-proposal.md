# PR: API Layer Refactor Proposal

**Branch**: `abacus/api-refactor`
**Source Map**: `docs/abacus/api-map.json`

---

## Summary

This PR refactors the API layer to provide:

1. Standardized response format across all 104+ endpoints
2. Consistent error codes and messages
3. Convenience methods for common responses
4. Built-in error handling wrapper
5. Request parsing utilities

## Changes

### New Files

- `src/lib/api/response.ts` - API response utilities

### Types Added

- `ApiSuccessResponse<T>` - Standard success response
- `ApiErrorResponse` - Standard error response
- `ApiResponse<T>` - Union type

### Error Codes

Standardized codes for all error types:

```typescript
ERROR_CODES = {
  // 401 - Auth
  UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED,

  // 403 - Authorization
  FORBIDDEN, INSUFFICIENT_PERMISSIONS, WORKSPACE_ACCESS_DENIED,

  // 404 - Not Found
  NOT_FOUND, RESOURCE_NOT_FOUND,

  // 400 - Validation
  BAD_REQUEST, VALIDATION_ERROR, INVALID_INPUT, MISSING_REQUIRED_FIELD,

  // 409 - Conflict
  CONFLICT, DUPLICATE_ENTRY,

  // 429 - Rate Limiting
  RATE_LIMITED, TOO_MANY_REQUESTS,

  // 500 - Server
  INTERNAL_ERROR, DATABASE_ERROR, EXTERNAL_SERVICE_ERROR,
}
```

### Response Methods

- `success(data, meta?)` - Success response
- `paginated(data, options)` - Paginated response
- `error(code, message, status, details?)` - Error response
- `errors.unauthorized()` - 401 response
- `errors.notFound(resource)` - 404 response
- `errors.validationError(message, details)` - 400 response
- `errors.internal()` - 500 response
- etc.

### Utilities

- `withErrorHandling(handler)` - Error boundary wrapper
- `parseBody(req, validator?)` - Parse and validate request body
- `getQueryParam(url, key, default?)` - Get query parameter
- `getNumericParam(url, key, default)` - Get numeric parameter

## Usage Example

### Before (inconsistent)

```typescript
export async function GET(req: NextRequest) {
  try {
    const data = await getData();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
```

### After (standardized)

```typescript
import { success, errors, withErrorHandling } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const data = await getData();
    return success(data);
  });
}
```

## Benefits

1. **Consistent client experience** - Same response shape everywhere
2. **Better error tracking** - Standardized error codes for monitoring
3. **Type safety** - Generic types for response data
4. **Less boilerplate** - Convenience methods reduce code
5. **Built-in error handling** - Automatic catch and format

## Migration Path

1. Import from `@/lib/api/response`
2. Replace `NextResponse.json({ data })` with `success(data)`
3. Replace manual error handling with `errors.xxx()`
4. Wrap handlers with `withErrorHandling()` for automatic error boundaries

## Validation Checklist

- [x] No protected files modified
- [x] Auth patterns preserved
- [x] Workspace isolation maintained
- [x] Documentation included
- [ ] Tests pass (to be verified)

---

**Risk Level**: Low
**Recommendation**: MERGE after test verification
