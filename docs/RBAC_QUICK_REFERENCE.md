# RBAC Quick Reference Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-15

---

## Roles

| Role | Level | Description |
|------|-------|-------------|
| **Owner** | 4 | Full access including billing and org management |
| **Admin** | 3 | Manage team, campaigns, settings (no billing) |
| **Member** | 2 | Create/manage contacts, campaigns, content |
| **Viewer** | 1 | Read-only access to contacts, campaigns, analytics |

---

## Quick Usage Examples

### Protect API Route

```typescript
import { requirePermission } from '@/lib/auth-middleware';

export async function DELETE(req: NextRequest) {
  const user = await requirePermission(req, 'contact:delete');
  // User has permission - proceed
}
```

### Protect UI Component

```tsx
<PermissionGate permission="contact:delete">
  <DeleteButton />
</PermissionGate>
```

### Check Permission in Logic

```tsx
const { can } = usePermissions();

if (can('billing:manage')) {
  // Show billing settings
}
```

### Make Authenticated API Call

```typescript
import { apiDelete } from '@/lib/api-client';

try {
  await apiDelete('/api/contacts/delete', { contactId: '123' });
} catch (error) {
  if (isPermissionError(error)) {
    toast.error('You need admin access to delete contacts');
  }
}
```

### Display Role Badge

```tsx
<RoleBadge role="owner" showIcon showTooltip />
```

---

## Common Permissions

### Critical (Owner Only)
- `billing:manage` - Manage billing & subscriptions
- `org:delete` - Delete organization
- `integration:connect` - Connect integrations
- `api_key:create` - Create API keys

### Admin/Owner
- `org:invite` - Invite team members
- `campaign:send` - Send campaigns
- `contact:delete` - Delete contacts
- `settings:update` - Update settings

### Member
- `contact:create` - Create contacts
- `campaign:create` - Create campaigns
- `content:generate` - Generate AI content

### Everyone
- `contact:view` - View contacts
- `campaign:view` - View campaigns
- `analytics:view_dashboard` - View analytics

---

## Middleware Functions

```typescript
requireAuth(req)                    // Just authentication
requirePermission(req, 'permission') // Specific permission
requireOwner(req)                   // Owner only
requireAdminOrOwner(req)            // Admin or owner
requireSameOrganization(user, orgId) // Verify org ownership
```

---

## UI Components

```tsx
<PermissionGate permission="..." />
<OwnerOnlyGate />
<AdminGate />
<DisableWithoutPermission permission="..." />
<RoleBadge role="owner" />
<CurrentUserRole />
```

---

## Hooks

```typescript
usePermissions()      // Full permissions object
usePermission(perm)   // Check single permission
useIsOwner()          // Check if owner
useIsAdminOrOwner()   // Check if admin/owner
useRole()             // Get current role
```

---

## API Client

```typescript
// Simple requests
await apiGet('/api/contacts')
await apiPost('/api/contacts', { name: 'John' })
await apiPut('/api/contacts/123', { status: 'active' })
await apiDelete('/api/contacts/delete', { contactId: '123' })

// File upload
await apiUpload('/api/upload', file, { contactId: '123' })

// Error handling
try {
  await apiDelete('/api/contacts/123')
} catch (error) {
  if (isPermissionError(error)) {
    // Handle permission error
  }
}
```

---

## Error Codes

- **401** - Authentication required (not logged in)
- **403** - Forbidden (insufficient permissions)
- **404** - Resource not found
- **500** - Server error

---

## File Locations

```
src/lib/permissions.ts              # Permission matrix
src/lib/auth-middleware.ts          # API protection
src/lib/api-client.ts               # Client-side requests
src/components/PermissionGate.tsx   # UI protection
src/hooks/usePermissions.ts         # Permission hooks
src/components/RoleBadge.tsx        # Role display
src/contexts/AuthContext.tsx        # Auth with roles
```

---

## Example: Protected Delete Operation

### API Route (`src/app/api/contacts/delete/route.ts`)

```typescript
import { requirePermission, requireSameOrganization } from '@/lib/auth-middleware';

export async function DELETE(req: NextRequest) {
  // 1. Check permission
  const user = await requirePermission(req, 'contact:delete');

  // 2. Get contact ID
  const { contactId } = await req.json();

  // 3. Fetch contact
  const contact = await fetchContact(contactId);

  // 4. Verify ownership
  requireSameOrganization(user, contact.org_id);

  // 5. Delete
  await deleteContact(contactId);

  // 6. Audit log
  await logAuditEntry('contact_deleted', contactId);

  return NextResponse.json({ success: true });
}
```

### Component (`src/components/ContactCard.tsx`)

```tsx
import { PermissionGate } from '@/components/PermissionGate';
import { apiDelete, handleAPIError } from '@/lib/api-client';

function ContactCard({ contact }) {
  async function handleDelete() {
    try {
      await apiDelete('/api/contacts/delete', { contactId: contact.id });
      toast.success('Contact deleted');
    } catch (error) {
      toast.error(handleAPIError(error, 'Failed to delete contact'));
    }
  }

  return (
    <div>
      <h2>{contact.name}</h2>
      <PermissionGate permission="contact:delete">
        <Button onClick={handleDelete}>Delete</Button>
      </PermissionGate>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Owner can access billing
- [ ] Admin cannot access billing
- [ ] Member can create contacts
- [ ] Viewer cannot delete contacts
- [ ] API returns 403 for insufficient permissions
- [ ] UI hides unauthorized actions
- [ ] Role badge displays correctly
- [ ] Permission checks work in components
- [ ] Authenticated fetch includes Bearer token
- [ ] Audit logs record sensitive actions

---

**For detailed documentation, see `docs/RBAC_IMPLEMENTATION.md`**
