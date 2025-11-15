# Role-Based Access Control (RBAC) Implementation Guide

**Created**: 2025-11-15
**Version**: 1.0.0
**Status**: ✅ Production Ready

---

## Overview

Unite-Hub implements a comprehensive Role-Based Access Control (RBAC) system with four user roles:

- **Owner** - Full access including billing and organization management
- **Admin** - Manage team, campaigns, and settings (except billing)
- **Member** - Create and manage contacts, campaigns, and content
- **Viewer** - Read-only access to contacts, campaigns, and analytics

---

## Architecture

### Components

```
RBAC System
├── src/lib/permissions.ts          # Permission matrix & utilities
├── src/lib/auth-middleware.ts      # API route protection
├── src/components/PermissionGate.tsx  # UI component protection
├── src/hooks/usePermissions.ts     # React hooks for permissions
├── src/components/RoleBadge.tsx    # Role display component
└── src/contexts/AuthContext.tsx    # Auth context with role utilities
```

### Database Schema

User roles are stored in the `user_organizations` table:

```sql
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  org_id VARCHAR NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW()
);
```

---

## Permission Matrix

### Organization Management

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| org:view | ✅ | ✅ | ✅ | ✅ |
| org:update | ✅ | ❌ | ❌ | ❌ |
| org:delete | ✅ | ❌ | ❌ | ❌ |
| org:invite | ✅ | ✅ | ❌ | ❌ |
| org:remove_members | ✅ | ✅ | ❌ | ❌ |
| org:change_roles | ✅ | ❌ | ❌ | ❌ |

### Contact Management

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| contact:view | ✅ | ✅ | ✅ | ✅ |
| contact:create | ✅ | ✅ | ✅ | ❌ |
| contact:update | ✅ | ✅ | ✅ | ❌ |
| contact:delete | ✅ | ✅ | ❌ | ❌ |
| contact:export | ✅ | ✅ | ✅ | ❌ |

### Campaign Management

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| campaign:view | ✅ | ✅ | ✅ | ✅ |
| campaign:create | ✅ | ✅ | ✅ | ❌ |
| campaign:send | ✅ | ✅ | ❌ | ❌ |
| campaign:delete | ✅ | ✅ | ❌ | ❌ |

### Billing & Settings

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| billing:manage | ✅ | ❌ | ❌ | ❌ |
| settings:update | ✅ | ✅ | ❌ | ❌ |
| integration:connect | ✅ | ❌ | ❌ | ❌ |

See `src/lib/permissions.ts` for the complete permission matrix (90+ permissions).

---

## Usage Guide

### 1. Protecting API Routes

Use middleware functions to protect API endpoints:

```typescript
// src/app/api/contacts/delete/route.ts
import { requirePermission } from '@/lib/auth-middleware';

export async function DELETE(req: NextRequest) {
  // Require specific permission - throws 401/403 if not authorized
  const user = await requirePermission(req, 'contact:delete');

  // User has permission - proceed with deletion
  // user.role, user.orgId, user.email are available
}
```

**Available Middleware Functions**:

```typescript
// Require authentication only
const user = await requireAuth(req);

// Require specific permission
const user = await requirePermission(req, 'campaign:send');

// Require ANY of multiple permissions (OR logic)
const user = await requireAnyPermission(req, ['campaign:create', 'campaign:update']);

// Require ALL permissions (AND logic)
const user = await requireAllPermissions(req, ['contact:view', 'contact:export']);

// Require owner role
const user = await requireOwner(req);

// Require admin or owner
const user = await requireAdminOrOwner(req);

// Verify same organization
requireSameOrganization(user, resourceOrgId);
```

**Using withAuth wrapper**:

```typescript
import { withAuth } from '@/lib/auth-middleware';

// With authentication only
export const GET = withAuth(async (req, user) => {
  return NextResponse.json({ data: '...' });
});

// With permission check
export const DELETE = withAuth(async (req, user) => {
  return NextResponse.json({ success: true });
}, 'contact:delete');
```

### 2. Protecting UI Components

Use `PermissionGate` to conditionally render UI based on permissions:

```tsx
import { PermissionGate } from '@/components/PermissionGate';

// Single permission
<PermissionGate permission="contact:delete">
  <Button onClick={handleDelete}>Delete Contact</Button>
</PermissionGate>

// Any permission (OR logic)
<PermissionGate anyPermission={['campaign:create', 'campaign:update']}>
  <CampaignEditor />
</PermissionGate>

// All permissions (AND logic)
<PermissionGate allPermissions={['contact:view', 'contact:export']}>
  <ExportButton />
</PermissionGate>

// With fallback content
<PermissionGate
  permission="billing:manage"
  fallback={<p>Owner access required</p>}
>
  <BillingSettings />
</PermissionGate>

// Hide when unauthorized (no fallback)
<PermissionGate permission="org:delete" hideOnUnauthorized>
  <DangerZone />
</PermissionGate>
```

**Shorthand Components**:

```tsx
import { OwnerOnlyGate, AdminGate } from '@/components/PermissionGate';

// Owner only
<OwnerOnlyGate>
  <BillingSettings />
</OwnerOnlyGate>

// Admin or Owner
<AdminGate>
  <TeamManagement />
</AdminGate>
```

**Disable without permission**:

```tsx
import { DisableWithoutPermission } from '@/components/PermissionGate';

<DisableWithoutPermission
  permission="contact:delete"
  disabledMessage="Admin access required"
>
  <Button>Delete</Button>
</DisableWithoutPermission>
```

### 3. Using Hooks

Use hooks for permission checks in component logic:

```tsx
import { usePermissions, usePermission, useIsOwner } from '@/hooks/usePermissions';

function MyComponent() {
  // Full permissions object
  const {
    can,
    canAny,
    canAll,
    cannot,
    isOwner,
    isAdmin,
    role,
    getRoleName
  } = usePermissions();

  // Check single permission
  if (can('contact:delete')) {
    // User can delete contacts
  }

  // Check any permission
  if (canAny(['campaign:create', 'campaign:update'])) {
    // User can create OR update campaigns
  }

  // Check all permissions
  if (canAll(['contact:view', 'contact:export'])) {
    // User can view AND export
  }

  // Check if cannot
  if (cannot('billing:manage')) {
    // Show upgrade prompt
  }

  // Role checks
  if (isOwner) {
    // Show billing settings
  }

  return (
    <div>
      <p>Role: {getRoleName()}</p>
      {can('contact:delete') && <DeleteButton />}
    </div>
  );
}
```

**Simple hooks**:

```tsx
import { usePermission, useIsOwner, useRole } from '@/hooks/usePermissions';

function DeleteButton() {
  const canDelete = usePermission('contact:delete');

  if (!canDelete) return null;

  return <Button onClick={handleDelete}>Delete</Button>;
}

function BillingSettings() {
  const isOwner = useIsOwner();

  if (!isOwner) {
    return <p>Owner access required</p>;
  }

  return <BillingForm />;
}
```

### 4. Using in AuthContext

Access role utilities directly from AuthContext:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const {
    hasPermission,
    isOwner,
    isAdmin,
    isAdminOrOwner,
    getRole
  } = useAuth();

  const currentRole = getRole(); // 'owner' | 'admin' | 'member' | 'viewer'

  if (hasPermission('billing:manage')) {
    // User can manage billing
  }

  if (isOwner()) {
    // User is owner
  }

  if (isAdminOrOwner()) {
    // User is admin or owner
  }

  return <div>Role: {currentRole}</div>;
}
```

### 5. Displaying Role Badges

Use `RoleBadge` component to display user roles:

```tsx
import { RoleBadge } from '@/components/RoleBadge';

// Basic badge
<RoleBadge role="owner" />

// With icon
<RoleBadge role="admin" showIcon />

// With tooltip (shows role description on hover)
<RoleBadge role="member" showTooltip />

// Custom size
<RoleBadge role="viewer" size="lg" />

// All features
<RoleBadge role="owner" size="md" showIcon showTooltip />

// Current user's role
import { CurrentUserRole } from '@/components/RoleBadge';
<CurrentUserRole showIcon showTooltip />
```

**Role Indicator** (detailed view):

```tsx
import { RoleIndicator } from '@/components/RoleBadge';

<RoleIndicator role="admin" showDescription />
// Displays icon, role name, and full description
```

---

## Client-Side Authorization Flow

```
1. User logs in via Supabase OAuth
   ↓
2. AuthContext fetches user_organizations
   ↓
3. Sets currentOrganization with role
   ↓
4. Components use PermissionGate/usePermissions
   ↓
5. UI renders based on permissions
```

## Server-Side Authorization Flow

```
1. Client sends API request with Bearer token
   ↓
2. Middleware extracts token from Authorization header
   ↓
3. Verifies JWT with Supabase
   ↓
4. Fetches user's organization and role
   ↓
5. Checks permission against PERMISSIONS matrix
   ↓
6. Returns 401 if not authenticated
   ↓
7. Returns 403 if insufficient permissions
   ↓
8. Proceeds with request if authorized
```

---

## Authentication in API Calls

When making API requests from the client, include the access token:

```typescript
import { supabaseBrowser } from '@/lib/supabase';

async function deleteContact(contactId: string) {
  // Get current session token
  const { data: { session } } = await supabaseBrowser.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/contacts/delete', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contactId }),
  });

  if (response.status === 401) {
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    throw new Error('Insufficient permissions');
  }

  return response.json();
}
```

**Helper function** (recommended):

```typescript
// src/lib/api-client.ts
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabaseBrowser.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    const data = await response.json();
    throw new Error(data.error || 'Insufficient permissions');
  }

  return response;
}

// Usage
const response = await authenticatedFetch('/api/contacts/delete', {
  method: 'DELETE',
  body: JSON.stringify({ contactId }),
});
```

---

## Permission Categories

Permissions are grouped into logical categories for easier management:

```typescript
import { PERMISSION_CATEGORIES } from '@/lib/permissions';

// Get all organization permissions
const orgPermissions = PERMISSION_CATEGORIES.organization;
// ['org:view', 'org:update', 'org:delete', ...]

// Get all billing permissions
const billingPermissions = PERMISSION_CATEGORIES.billing;
// ['billing:view', 'billing:manage', 'billing:view_invoices', ...]
```

Available categories:
- `organization` - Organization management
- `workspace` - Workspace management
- `contacts` - Contact management
- `campaigns` - Campaign management
- `ai` - AI agent access
- `billing` - Billing & subscription
- `integrations` - Third-party integrations

---

## Utility Functions

### Permission Checking

```typescript
import { hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/permissions';

// Check single permission
hasPermission('admin', 'contact:delete'); // true
hasPermission('viewer', 'contact:delete'); // false

// Check all permissions (AND)
hasAllPermissions('admin', ['contact:view', 'contact:update']); // true

// Check any permission (OR)
hasAnyPermission('member', ['billing:manage', 'contact:create']); // true
```

### Role Information

```typescript
import {
  getRoleDisplayName,
  getRoleDescription,
  getPermissionsForRole,
  hasRoleOrHigher
} from '@/lib/permissions';

// Get display name
getRoleDisplayName('owner'); // "Owner"

// Get description
getRoleDescription('admin');
// "Manage team members, campaigns, and settings (except billing)"

// Get all permissions for role
const adminPermissions = getPermissionsForRole('admin');
// ['org:view', 'org:invite', 'contact:view', ...]

// Check role hierarchy
hasRoleOrHigher('admin', 'member'); // true (admin >= member)
hasRoleOrHigher('member', 'admin'); // false (member < admin)
```

### Role Hierarchy

```typescript
import { ROLE_HIERARCHY } from '@/lib/permissions';

console.log(ROLE_HIERARCHY);
// { owner: 4, admin: 3, member: 2, viewer: 1 }
```

---

## Best Practices

### 1. Always Protect API Routes

**❌ Bad** - No protection:
```typescript
export async function DELETE(req: NextRequest) {
  // Anyone can delete!
  const { contactId } = await req.json();
  await deleteContact(contactId);
}
```

**✅ Good** - Permission check:
```typescript
export async function DELETE(req: NextRequest) {
  const user = await requirePermission(req, 'contact:delete');
  const { contactId } = await req.json();
  await deleteContact(contactId);
}
```

### 2. Verify Organization Ownership

**❌ Bad** - No org check:
```typescript
const user = await requirePermission(req, 'contact:delete');
// User could delete contacts from other organizations!
await deleteContact(contactId);
```

**✅ Good** - Verify ownership:
```typescript
const user = await requirePermission(req, 'contact:delete');
const contact = await fetchContact(contactId);
requireSameOrganization(user, contact.org_id);
await deleteContact(contactId);
```

### 3. Use Specific Permissions

**❌ Bad** - Too broad:
```typescript
<PermissionGate permission="contact:view">
  <DeleteButton />
</PermissionGate>
```

**✅ Good** - Specific permission:
```typescript
<PermissionGate permission="contact:delete">
  <DeleteButton />
</PermissionGate>
```

### 4. Provide Fallback UI

**❌ Bad** - Silent failure:
```typescript
<PermissionGate permission="billing:manage">
  <BillingSettings />
</PermissionGate>
```

**✅ Good** - Show message:
```typescript
<PermissionGate
  permission="billing:manage"
  fallback={<p>Owner access required to manage billing</p>}
>
  <BillingSettings />
</PermissionGate>
```

### 5. Log Sensitive Actions

```typescript
const user = await requirePermission(req, 'org:delete');

// Perform action
await deleteOrganization(orgId);

// Log to audit trail
await supabase.from('audit_logs').insert({
  org_id: user.orgId,
  action: 'organization_deleted',
  resource: 'organization',
  resource_id: orgId,
  agent: 'api',
  status: 'success',
  details: {
    user_id: user.id,
    user_email: user.email,
    user_role: user.role,
  },
});
```

---

## Testing Permissions

### Unit Testing

```typescript
import { hasPermission, hasAllPermissions } from '@/lib/permissions';

describe('Permissions', () => {
  it('should allow owner to delete contacts', () => {
    expect(hasPermission('owner', 'contact:delete')).toBe(true);
  });

  it('should deny viewer from deleting contacts', () => {
    expect(hasPermission('viewer', 'contact:delete')).toBe(false);
  });

  it('should allow admin to have multiple permissions', () => {
    expect(hasAllPermissions('admin', [
      'contact:view',
      'contact:create',
      'contact:update',
    ])).toBe(true);
  });
});
```

### Integration Testing

```typescript
import { requirePermission } from '@/lib/auth-middleware';

describe('API Protection', () => {
  it('should return 403 for member trying to delete', async () => {
    const mockReq = createMockRequest('member');

    await expect(
      requirePermission(mockReq, 'contact:delete')
    ).rejects.toThrow();
  });

  it('should allow admin to delete', async () => {
    const mockReq = createMockRequest('admin');

    const user = await requirePermission(mockReq, 'contact:delete');
    expect(user.role).toBe('admin');
  });
});
```

---

## Common Use Cases

### 1. Owner-Only Billing Section

```tsx
import { OwnerOnlyGate } from '@/components/PermissionGate';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>

      {/* Everyone can see */}
      <ProfileSettings />

      {/* Owner only */}
      <OwnerOnlyGate fallback={<p>Owner access required</p>}>
        <BillingSettings />
      </OwnerOnlyGate>
    </div>
  );
}
```

### 2. Conditional Delete Button

```tsx
import { usePermission } from '@/hooks/usePermissions';

function ContactCard({ contact }) {
  const canDelete = usePermission('contact:delete');

  return (
    <div>
      <h2>{contact.name}</h2>
      <ViewButton />
      {canDelete && <DeleteButton contactId={contact.id} />}
    </div>
  );
}
```

### 3. Protected API Route

```typescript
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, user) => {
  const { campaignId } = await req.json();

  // Verify campaign belongs to user's org
  const campaign = await fetchCampaign(campaignId);
  requireSameOrganization(user, campaign.org_id);

  // Send campaign
  await sendCampaign(campaignId);

  return NextResponse.json({ success: true });
}, 'campaign:send');
```

### 4. Role-Based Navigation

```tsx
import { PermissionGate } from '@/components/PermissionGate';

function Navigation() {
  return (
    <nav>
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/contacts">Contacts</NavLink>

      <PermissionGate permission="workspace:view">
        <NavLink href="/workspaces">Workspaces</NavLink>
      </PermissionGate>

      <PermissionGate permission="billing:view">
        <NavLink href="/billing">Billing</NavLink>
      </PermissionGate>
    </nav>
  );
}
```

---

## Troubleshooting

### Issue: Permission checks always fail

**Solution**: Verify `currentOrganization` is set in AuthContext:

```typescript
const { currentOrganization } = useAuth();
console.log('Current org:', currentOrganization);
// Should show: { role: 'owner', org_id: '...', ... }
```

### Issue: 401 Unauthorized on API calls

**Solution**: Include Bearer token in Authorization header:

```typescript
const { data: { session } } = await supabaseBrowser.auth.getSession();
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### Issue: Role badge not showing

**Solution**: Check if Tooltip component is installed:

```bash
npm install @radix-ui/react-tooltip
npx shadcn-ui@latest add tooltip
```

---

## Migration Guide

### Updating Existing API Routes

Before:
```typescript
export async function DELETE(req: NextRequest) {
  const { contactId } = await req.json();
  await deleteContact(contactId);
  return NextResponse.json({ success: true });
}
```

After:
```typescript
import { requirePermission } from '@/lib/auth-middleware';

export async function DELETE(req: NextRequest) {
  const user = await requirePermission(req, 'contact:delete');
  const { contactId } = await req.json();

  // Verify ownership
  const contact = await fetchContact(contactId);
  requireSameOrganization(user, contact.org_id);

  await deleteContact(contactId);
  return NextResponse.json({ success: true });
}
```

### Updating Existing Components

Before:
```tsx
<Button onClick={handleDelete}>Delete</Button>
```

After:
```tsx
<PermissionGate permission="contact:delete">
  <Button onClick={handleDelete}>Delete</Button>
</PermissionGate>
```

---

## Future Enhancements

- [ ] Custom role creation
- [ ] Fine-grained resource permissions
- [ ] Temporary permission grants
- [ ] Permission audit logs
- [ ] Role templates
- [ ] Permission inheritance

---

## Related Files

- `src/lib/permissions.ts` - Permission definitions
- `src/lib/auth-middleware.ts` - API middleware
- `src/components/PermissionGate.tsx` - UI component
- `src/hooks/usePermissions.ts` - React hooks
- `src/components/RoleBadge.tsx` - Role display
- `src/contexts/AuthContext.tsx` - Auth context
- `src/app/api/contacts/delete/route.ts` - Example protected route

---

**This RBAC system is production-ready and fully implemented across Unite-Hub.**
