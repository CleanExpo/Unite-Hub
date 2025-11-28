# Founder Intelligence OS - Roles and Routing

**Last Updated**: 2025-11-28
**Version**: 1.0.0

---

## Role Model

Unite-Hub uses a four-tier role model to control access to different areas of the platform:

| Role | Description | Default Dashboard |
|------|-------------|-------------------|
| **FOUNDER** | Full access to Founder OS, Cognitive Twin, AI Phill, Approvals, Strategies | `/founder` |
| **STAFF** | Access to Staff CRM and operational tools | `/staff/dashboard` |
| **CLIENT** | Access to client dashboard and AI consultation | `/client` |
| **ADMIN** | Superuser with full system access (future expansion) | `/founder` |

---

## Database Schema

### Migration 308: User Role Enum

```sql
CREATE TYPE user_role AS ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN');

ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role;

ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'CLIENT';
```

### Migration 309: Seed Founder Roles

```sql
UPDATE profiles
SET role = 'FOUNDER'
WHERE email = 'phill.mcgurk@gmail.com';
```

---

## Routing Rules

### Guest Users (No Session)
- Can see marketing and pricing pages (`/`, `/pricing`, `/landing`)
- Can access public support and terms pages
- Attempting to access protected routes redirects to `/login`

### FOUNDER
- Logging in redirects to `/founder`
- Visiting `/`, `/pricing`, or `/landing` while logged in redirects to `/founder`
- Full access to all platform areas
- Device trust verification for security (via `admin_trusted_devices` table)

### STAFF
- Logging in redirects to `/staff/dashboard`
- Visiting `/`, `/pricing`, or `/landing` while logged in redirects to `/staff/dashboard`
- Cannot access `/founder/*` routes (redirects to `/staff/dashboard`)
- Can access all `/staff/*` routes

### CLIENT
- Logging in redirects to `/client`
- Visiting `/founder/*` or `/staff/*` redirects to `/client`
- Can access `/client/*` routes and AI consultation features

### ADMIN
- Full access to all areas (same as FOUNDER currently)
- Reserved for future superuser functionality

---

## TypeScript Types

```typescript
// src/lib/auth/userTypes.ts

export type UserRole = 'FOUNDER' | 'STAFF' | 'CLIENT' | 'ADMIN';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
}

// Helper functions
export const isFounder = (role: UserRole | null | undefined): boolean => role === 'FOUNDER';
export const isStaff = (role: UserRole | null | undefined): boolean => role === 'STAFF';
export const isClient = (role: UserRole | null | undefined): boolean => role === 'CLIENT';
export const isAdmin = (role: UserRole | null | undefined): boolean => role === 'ADMIN';

export const hasElevatedAccess = (role: UserRole | null | undefined): boolean =>
  role === 'FOUNDER' || role === 'ADMIN';

export const canAccessStaffAreas = (role: UserRole | null | undefined): boolean =>
  role === 'STAFF' || role === 'FOUNDER' || role === 'ADMIN';
```

---

## Middleware Implementation

The middleware (`src/middleware.ts`) handles role-based routing:

1. **Session Check**: Verifies user authentication via Supabase
2. **Role Normalization**: Converts legacy roles (e.g., `admin`, `customer`) to new enum values
3. **Marketing Page Bypass**: Founders and staff skip pricing/marketing pages
4. **Access Control**: Clients cannot access founder/staff areas
5. **Device Trust**: Admin-level users require device verification

### Key Functions

```typescript
// Normalize legacy role strings to UserRole enum
function normalizeRole(role: string | null | undefined): UserRole {
  if (!role) return 'CLIENT';
  const upperRole = role.toUpperCase();
  if (upperRole === 'FOUNDER' || upperRole === 'ADMIN' || role === 'admin') return 'FOUNDER';
  if (upperRole === 'STAFF') return 'STAFF';
  if (upperRole === 'CLIENT' || upperRole === 'CUSTOMER') return 'CLIENT';
  return 'CLIENT';
}

// Get role-appropriate default dashboard
function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case 'FOUNDER': return '/founder';
    case 'STAFF': return '/staff/dashboard';
    case 'ADMIN': return '/founder';
    case 'CLIENT':
    default: return '/client';
  }
}
```

---

## Route Matcher Configuration

```typescript
export const config = {
  matcher: [
    "/",
    "/pricing",
    "/landing",
    "/dashboard/:path*",
    "/founder/:path*",
    "/staff/:path*",
    "/client/:path*",
    "/crm/:path*",
    "/auth/:path*",
    "/synthex/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
```

---

## Security Considerations

1. **Device Trust**: Founders/admins require trusted device verification
2. **Fail Open**: On database errors, middleware allows access (prevents lockouts)
3. **Role Normalization**: Legacy roles are safely converted to new enum
4. **Session Refresh**: Session is refreshed on every request

---

## Testing

Run role routing tests:

```bash
npm test -- tests/integration/auth/roleRouting.test.ts
```

---

## Troubleshooting

### Founder stuck on pricing page
1. Check `profiles.role` in Supabase is `FOUNDER` (uppercase)
2. Run migration 309 to seed correct role
3. Clear browser cookies and re-login

### Staff seeing founder content
1. Verify middleware matcher includes `/staff/:path*`
2. Check `profiles.role` is exactly `STAFF`

### New user has wrong role
1. Default is `CLIENT` - update in Supabase if needed
2. Use SQL: `UPDATE profiles SET role = 'STAFF' WHERE email = 'user@example.com';`

---

## Future Enhancements

- **ADMIN Role**: Separate admin dashboard for support/ops
- **Role Hierarchies**: Granular permissions within roles
- **Team Roles**: Organization-level role assignments
