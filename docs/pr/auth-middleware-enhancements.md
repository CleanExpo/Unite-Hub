# PR: Auth Middleware Enhancements

**Branch**: `abacus/auth-enhancements`
**Source Map**: `docs/abacus/auth-map.json`

---

## Summary

This PR enhances authentication middleware with:

1. Rate limiting for API protection
2. Audit logging for security tracking
3. Utility functions for common auth patterns

## Changes

### New Files

- `src/lib/auth/rate-limiter.ts` - Rate limiting utilities
- `src/lib/auth/audit-logger.ts` - Audit logging utilities

### Rate Limiter Features

- In-memory rate limiting (Redis-ready interface)
- Configurable limits by endpoint type
- Automatic cleanup of expired entries
- Rate limit headers for responses

### Audit Logger Features

- Track auth events (login, logout, failures)
- Track access events (granted, denied)
- Track workspace switches
- Track admin actions
- Query logs by user or workspace

## Usage

### Rate Limiting

```typescript
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/auth/rate-limiter';

// In API route
const key = getRateLimitKey(auth.userId, req.ip, '/api/contacts');
const result = checkRateLimit(key, RATE_LIMITS.default);

if (!result.allowed) {
  return new Response('Too Many Requests', { status: 429 });
}
```

### Audit Logging

```typescript
import {
  logAuthSuccess,
  logAccessDenied,
  logApiRequest
} from '@/lib/auth/audit-logger';

// Log successful auth
await logAuthSuccess(userId, email);

// Log denied access
await logAccessDenied(userId, 'contact', contactId, 'Not in workspace');

// Log API request
await logApiRequest(userId, '/api/contacts', 'GET', workspaceId);
```

## Rate Limit Configurations

| Type | Requests | Window | Use Case |
|------|----------|--------|----------|
| default | 100 | 60s | General API endpoints |
| auth | 10 | 60s | Login/register endpoints |
| ai | 20 | 60s | AI generation endpoints |
| email | 50 | 60s | Email sending |
| webhook | 1000 | 60s | Webhook receivers |

## Audit Event Types

| Action | Description |
|--------|-------------|
| auth.login | Successful login |
| auth.logout | User logout |
| auth.token_refresh | Token refreshed |
| auth.failed_login | Failed login attempt |
| access.granted | Resource access allowed |
| access.denied | Resource access blocked |
| workspace.switch | User changed workspace |
| workspace.create | New workspace created |
| admin.action | Admin performed action |
| api.request | High-value API call |

## Benefits

1. **Security** - Protect against brute force and abuse
2. **Compliance** - Track all auth events for auditing
3. **Debugging** - Understand access patterns
4. **Monitoring** - Alert on suspicious activity
5. **Performance** - Prevent system overload

## Migration

No changes to existing middleware. Import and use new utilities as needed:

1. Add rate limiting to sensitive endpoints
2. Add audit logging to high-value operations
3. Use predefined configurations or customize

## Validation Checklist

- [x] Auth middleware preserved (not modified)
- [x] Workspace isolation maintained
- [x] No protected files modified
- [x] Documentation included
- [ ] Tests pass (to be verified)

---

**Risk Level**: Low
**Recommendation**: MERGE after test verification
