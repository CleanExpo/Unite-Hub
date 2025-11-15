# RBAC System

**Role-Based Access Control for Unite-Hub**

Complete permission management system with 4 roles, 90+ permissions, and full TypeScript support.

---

## Quick Start

### 1. Import Everything

```typescript
import {
  // Server-side
  requirePermission,
  requireOwner,

  // Client-side
  PermissionGate,
  usePermissions,
  RoleBadge,

  // API calls
  apiDelete,
  isPermissionError,
} from '@/lib/rbac';
```

### 2. Protect API Route

```typescript
export async function DELETE(req: NextRequest) {
  const user = await requirePermission(req, 'contact:delete');
  // User has permission - proceed
}
```

### 3. Protect UI Component

```tsx
<PermissionGate permission="contact:delete">
  <DeleteButton />
</PermissionGate>
```

### 4. Make Authenticated Request

```typescript
try {
  await apiDelete('/api/contacts/delete', { contactId });
} catch (error) {
  if (isPermissionError(error)) {
    toast.error('Admin access required');
  }
}
```

---

## Roles

- **Owner** (Level 4) - Full access including billing
- **Admin** (Level 3) - Team management, no billing
- **Member** (Level 2) - Create/manage content
- **Viewer** (Level 1) - Read-only access

---

## Files

```
rbac/
├── index.ts                      # Central export (use this!)
├── README.md                     # This file
├── __tests__/
│   └── permissions.test.ts       # Unit tests
└── (imports from parent lib/)
```

**Related Files:**
- `../permissions.ts` - Permission matrix
- `../auth-middleware.ts` - API protection
- `../../components/PermissionGate.tsx` - UI gates
- `../../hooks/usePermissions.ts` - React hooks
- `../../components/RoleBadge.tsx` - Role display
- `../api-client.ts` - API client

---

## Documentation

- **Full Guide**: `/docs/RBAC_IMPLEMENTATION.md` (800+ lines)
- **Quick Reference**: `/docs/RBAC_QUICK_REFERENCE.md`
- **System Summary**: `/RBAC_SYSTEM_SUMMARY.md`

---

## Examples

### Protect with Permission

```typescript
// API route
export const DELETE = withAuth(async (req, user) => {
  return NextResponse.json({ success: true });
}, 'contact:delete');

// Component
<PermissionGate permission="billing:manage">
  <BillingSettings />
</PermissionGate>

// Hook
const { can } = usePermissions();
if (can('campaign:send')) {
  // Show send button
}
```

### Owner-Only Features

```typescript
// API route
const user = await requireOwner(req);

// Component
<OwnerOnlyGate>
  <DangerZone />
</OwnerOnlyGate>

// Hook
const { isOwner } = usePermissions();
if (isOwner) {
  // Show billing
}
```

### Display Role

```tsx
<RoleBadge role="owner" showIcon showTooltip />
<CurrentUserRole />
```

### Make API Call

```typescript
import { apiPost, handleAPIError } from '@/lib/rbac';

try {
  const result = await apiPost('/api/campaigns/send', { campaignId });
  toast.success('Campaign sent!');
} catch (error) {
  toast.error(handleAPIError(error, 'Failed to send campaign'));
}
```

---

## Testing

Run tests:
```bash
npm test src/lib/rbac
```

Run specific test:
```bash
npm test permissions.test.ts
```

---

## Common Patterns

### API Route Protection

```typescript
import { requirePermission, requireSameOrganization } from '@/lib/rbac';

export async function DELETE(req: NextRequest) {
  // 1. Check permission
  const user = await requirePermission(req, 'contact:delete');

  // 2. Get resource
  const { contactId } = await req.json();
  const contact = await fetchContact(contactId);

  // 3. Verify ownership
  requireSameOrganization(user, contact.org_id);

  // 4. Perform action
  await deleteContact(contactId);

  // 5. Return success
  return NextResponse.json({ success: true });
}
```

### Conditional UI Rendering

```tsx
import { PermissionGate, usePermissions } from '@/lib/rbac';

function ContactCard({ contact }) {
  const { can } = usePermissions();

  return (
    <Card>
      <h2>{contact.name}</h2>

      {/* Always show view button */}
      <ViewButton />

      {/* Show edit only if permitted */}
      <PermissionGate permission="contact:update">
        <EditButton />
      </PermissionGate>

      {/* Show delete only if permitted */}
      {can('contact:delete') && (
        <DeleteButton contactId={contact.id} />
      )}
    </Card>
  );
}
```

### Error Handling

```typescript
import { apiDelete, isAuthError, isPermissionError, handleAPIError } from '@/lib/rbac';

async function handleDelete(contactId: string) {
  try {
    await apiDelete('/api/contacts/delete', { contactId });
    toast.success('Contact deleted');
  } catch (error) {
    if (isAuthError(error)) {
      // Session expired - redirect to login
      router.push('/login');
    } else if (isPermissionError(error)) {
      // Show upgrade prompt
      toast.error('Admin access required. Please contact your organization owner.');
    } else {
      // Generic error
      toast.error(handleAPIError(error, 'Failed to delete contact'));
    }
  }
}
```

---

## Best Practices

✅ **Always protect API routes** - Never trust client
✅ **Verify organization ownership** - Prevent cross-org access
✅ **Use specific permissions** - Not just role checks
✅ **Provide fallback UI** - Show why action is unavailable
✅ **Log sensitive actions** - Audit trail for compliance
✅ **Handle errors gracefully** - User-friendly messages
✅ **Use TypeScript** - Type-safe permission strings

❌ **Don't hardcode roles** - Use permission checks
❌ **Don't skip org verification** - Security risk
❌ **Don't show broken UI** - Hide or disable unauthorized actions
❌ **Don't expose sensitive errors** - Generic messages to users

---

## Performance

- **Permission checks**: O(1) lookup
- **Client-side**: No network requests (uses cached role)
- **Server-side**: Single DB query (cached in session)
- **Type-safe**: Zero runtime overhead

---

## Support

**Issues?** Check the documentation:
1. `/docs/RBAC_QUICK_REFERENCE.md` - Quick answers
2. `/docs/RBAC_IMPLEMENTATION.md` - Detailed guide
3. Example route: `/src/app/api/contacts/delete/route.ts`

**Questions?** See the full system summary: `/RBAC_SYSTEM_SUMMARY.md`

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2025-11-15
