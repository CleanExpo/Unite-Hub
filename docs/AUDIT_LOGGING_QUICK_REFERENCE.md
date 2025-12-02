# Audit Logging Quick Reference

**Quick guide for developers on when and how to log audit events**

## When to Log Audit Events

### ✅ ALWAYS Log

- **Admin actions**: User/role/permission changes, workspace management
- **Data exports**: Bulk exports, CSV downloads, report generation
- **Security events**: Rate limits, unauthorized access, suspicious activity
- **Sensitive data access**: Viewing/accessing email addresses, phone numbers, financial data
- **Authentication**: Login, logout, password reset, MFA changes
- **System config changes**: Feature flags, billing settings, integrations

### ⚠️ SOMETIMES Log

- **Regular data access**: Only for sensitive resources (contacts, emails, campaigns)
- **API requests**: Only for high-value or admin endpoints
- **Agent operations**: Only workflow start/complete/fail events

### ❌ NEVER Log

- **Read-only operations** on non-sensitive data (e.g., viewing dashboard stats)
- **Health checks** and monitoring endpoints
- **Static asset requests**
- **Public page views**

---

## Quick Examples

### Admin Actions

```typescript
import { logAdminAction, logUserManagement, logRoleChange } from '@/lib/audit/audit-logger';

// User created
await logUserManagement(adminUserId, 'created', newUserId, { email, role });

// Role changed
await logRoleChange(adminUserId, targetUserId, 'member', 'admin', workspaceId);

// Generic admin action
await logAdminAction(adminUserId, 'system_config_changed', configKey, metadata);
```

### Data Access

```typescript
import { logDataAccess, logBulkExport, logSensitiveFieldAccess } from '@/lib/audit/audit-logger';

// Contact viewed
await logDataAccess(userId, 'contacts', contactId, 'viewed', workspaceId);

// Bulk export
await logBulkExport(userId, 'contacts', count, workspaceId, 'csv');

// Sensitive field accessed
await logSensitiveFieldAccess(userId, 'contacts', contactId, 'email', workspaceId);
```

### Authentication

```typescript
import { logAuthSuccess, logAuthFailure } from '@/lib/auth/audit-logger';

// Login success
await logAuthSuccess(userId, email, { method: 'google_oauth' });

// Login failure
await logAuthFailure(email, 'Invalid credentials');
```

### Security

```typescript
import { logRateLimitExceeded, logSuspiciousActivity, logUnauthorizedAccess } from '@/lib/audit/audit-logger';

// Rate limit exceeded
await logRateLimitExceeded(userId, endpoint, ipAddress, userAgent);

// Suspicious activity
await logSuspiciousActivity(userId, activityType, reason, metadata);

// Unauthorized access
await logUnauthorizedAccess(userId, resourceType, resourceId, reason, ipAddress);
```

---

## Severity Levels

| Level | When to Use | Auto-alerts? |
|-------|-------------|--------------|
| **DEBUG** | Development/troubleshooting | No |
| **INFO** | Normal operations | No |
| **WARN** | Important changes | Maybe |
| **ERROR** | Failed operations | Yes |
| **CRITICAL** | Security incidents | Yes |

---

## Common Patterns

### API Route with Audit Logging

```typescript
// src/app/api/admin/users/route.ts
import { logUserManagement } from '@/lib/audit/audit-logger';

export async function POST(req: Request) {
  const { email, role } = await req.json();
  const adminUserId = req.headers.get('x-user-id');

  try {
    const newUser = await createUser({ email, role });

    await logUserManagement(adminUserId!, 'created', newUser.id, { email, role });

    return Response.json({ user: newUser });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Middleware with Access Logging

```typescript
// src/middleware.ts
import { logAccessDenied } from '@/lib/auth/audit-logger';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    await logAccessDenied(undefined, 'api', req.nextUrl.pathname, 'No token');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}
```

### Server Action with Data Access Logging

```typescript
// src/app/actions/contacts.ts
'use server';

import { logDataAccess } from '@/lib/audit/audit-logger';

export async function viewContact(contactId: string) {
  const userId = await getCurrentUserId();
  const workspaceId = await getCurrentWorkspaceId();

  const contact = await db.contacts.findUnique({ where: { id: contactId } });

  await logDataAccess(userId, 'contacts', contactId, 'viewed', workspaceId);

  return contact;
}
```

---

## Querying Audit Logs

```typescript
import { queryAuditLogs, getUserAuditLogs, getWorkspaceAuditLogs } from '@/lib/audit/audit-logger';

// Get user's audit logs
const userLogs = await getUserAuditLogs(userId, { limit: 50 });

// Get workspace audit logs
const workspaceLogs = await getWorkspaceAuditLogs(workspaceId, { limit: 100 });

// Get security events
const securityLogs = await queryAuditLogs({
  action: 'security.',
  severity: 'ERROR',
  startDate: new Date('2025-12-01'),
  limit: 50
});

// Get admin activity
const adminLogs = await queryAuditLogs({
  userId: adminUserId,
  action: 'admin.',
  limit: 100
});
```

---

## Checklist for New Features

When adding a new feature, ask:

- [ ] Does it involve admin actions? → Log with `logAdminAction` or specific admin function
- [ ] Does it access sensitive data? → Log with `logDataAccess` or `logSensitiveFieldAccess`
- [ ] Does it export data? → Log with `logBulkExport`
- [ ] Does it change user permissions? → Log with `logRoleChange`
- [ ] Does it modify system config? → Log with `logSystemConfigChange`
- [ ] Does it involve authentication? → Log with auth/audit-logger functions
- [ ] Could it be a security risk? → Log with security functions

---

## Performance Tips

1. **Don't await audit logs in critical path** - Fire and forget:
   ```typescript
   logDataAccess(userId, 'contacts', contactId, 'viewed', workspaceId).catch(console.error);
   ```

2. **Batch audit logs** for bulk operations:
   ```typescript
   // Instead of logging each item
   items.forEach(item => logDataAccess(...));

   // Log once for bulk operation
   await logBulkExport(userId, 'contacts', items.length, workspaceId);
   ```

3. **Use DEBUG level** for high-frequency events:
   ```typescript
   await logAuditEvent({
     action: 'data.contact_viewed',
     severity: 'DEBUG', // Low priority
     // ...
   });
   ```

---

## Testing Audit Logs

```typescript
// tests/integration/audit.test.ts
import { describe, it, expect } from 'vitest';
import { logAdminAction, queryAuditLogs } from '@/lib/audit/audit-logger';

describe('Audit Logging', () => {
  it('should log and retrieve admin action', async () => {
    await logAdminAction('admin-123', 'user_created', 'user-456', { email: 'test@example.com' });

    const logs = await queryAuditLogs({
      userId: 'admin-123',
      action: 'admin.user_created',
      limit: 1
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('admin.user_created');
    expect(logs[0].metadata).toMatchObject({ email: 'test@example.com' });
  });
});
```

---

## Common Mistakes

### ❌ Don't do this

```typescript
// Missing await - audit log might not be saved
logAdminAction(userId, 'user_deleted', targetId);

// Logging non-sensitive data access
await logDataAccess(userId, 'dashboard_stats', statsId, 'viewed'); // Too verbose

// Wrong severity
await logAuditEvent({
  action: 'security.unauthorized_access',
  severity: 'INFO', // Should be ERROR or CRITICAL
});
```

### ✅ Do this instead

```typescript
// Await or catch
await logAdminAction(userId, 'user_deleted', targetId);
// or
logAdminAction(userId, 'user_deleted', targetId).catch(console.error);

// Only log sensitive data
await logDataAccess(userId, 'contacts', contactId, 'viewed'); // Good

// Correct severity
await logAuditEvent({
  action: 'security.unauthorized_access',
  severity: 'ERROR', // Correct
});
```

---

## Need Help?

- **Full documentation**: `docs/SECURITY_ENV_VALIDATION_AND_AUDIT.md`
- **Auth-specific logging**: `src/lib/auth/audit-logger.ts`
- **Security-specific logging**: `src/core/security/audit-logger.ts`
- **Type definitions**: `src/lib/audit/audit-logger.ts`

---

**Last Updated**: 2025-12-03
