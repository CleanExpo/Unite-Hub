# Unite-Hub Schema Reference

**CRITICAL: Check this file BEFORE writing any SQL migrations**

---

## Entity Hierarchy

```
auth.users
    ├── profiles (id = auth.users.id, has role column)
    ├── user_profiles (id = auth.users.id, NO role column)
    └── user_organizations (user_id -> auth.users.id, org_id -> organizations.id)
            └── organizations
                    └── workspaces (org_id -> organizations.id)
                            └── contacts, emails, campaigns, etc. (workspace_id -> workspaces.id)
```

---

## Core Tables & Columns

### `profiles` (migration 255, 308)
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT
role user_role  -- ENUM: 'FOUNDER', 'STAFF', 'CLIENT', 'ADMIN'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### `user_profiles` (migration 003)
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
email TEXT NOT NULL
full_name TEXT NOT NULL
avatar_url TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
-- NOTE: NO role column! Role is in profiles table.
```

### `user_organizations` (migration 003)
```sql
id UUID
user_id UUID REFERENCES auth.users(id)
org_id UUID REFERENCES organizations(id)
role TEXT  -- 'owner', 'admin', 'member', 'viewer'
is_active BOOLEAN
joined_at TIMESTAMPTZ
```

### `organizations` (migration 001)
```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
email TEXT NOT NULL
plan TEXT  -- 'starter', 'professional', 'enterprise'
status TEXT  -- 'active', 'trial', 'cancelled'
```

### `workspaces` (migration 001)
```sql
id UUID PRIMARY KEY
org_id UUID REFERENCES organizations(id)  -- PARENT ORG
name TEXT NOT NULL
description TEXT
```

---

## Tables With workspace_id

### Reference workspaces(id) (proper FK):
- `contacts` - workspace_id UUID REFERENCES workspaces(id)
- `emails` - workspace_id UUID REFERENCES workspaces(id)
- `campaigns` - workspace_id UUID REFERENCES workspaces(id)
- `drip_campaigns` - workspace_id UUID REFERENCES workspaces(id)
- `generated_content` - workspace_id UUID REFERENCES workspaces(id) (snake_case!)
- `email_integrations` - workspace_id UUID REFERENCES workspaces(id)

### UUID only (no FK, may be org_id):
- `leads` - workspace_id UUID NOT NULL (migration 312)
- `clients` - workspace_id UUID NOT NULL (migration 312)
- `integrations` - workspace_id UUID NOT NULL (migration 312)
- `client_actions` - references clients(id) (migration 312)

---

## Table Naming

| Wrong | Correct |
|-------|---------|
| `generatedContent` | `generated_content` |
| `integrations` | `integrations` OR `email_integrations` (check usage) |

---

## Custom Types

### `user_role` (migration 308)
```sql
CREATE TYPE user_role AS ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN');
```
- Used in: `profiles.role`
- NOT used in: `user_organizations.role` (that's TEXT)

---

## Supabase Restrictions

### Cannot Do:
- Create functions in `auth` schema (permission denied)
- Modify `auth.users` directly
- Use `service_role` in RLS policies

### Must Do:
- Create functions in `public` schema
- Use `SECURITY DEFINER` for functions needing elevated access
- Reference `auth.uid()` for current user

---

## Role Checks

### For FOUNDER/ADMIN access (uses profiles table):
```sql
EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid()
  AND p.role IN ('ADMIN', 'FOUNDER')
)
```

### For workspace membership (via user_organizations):
```sql
-- Use the helper function which handles both workspace IDs and org IDs
public.is_workspace_member(workspace_id)
```

### For workspace admin/owner:
```sql
public.is_workspace_admin(workspace_id)
```

---

## Pre-Migration Checklist

Before writing ANY migration:

1. [ ] Find table creation: `grep -rn "CREATE TABLE.*<tablename>" supabase/migrations/`
2. [ ] Read the FULL table definition
3. [ ] Check column types: `role` might be TEXT or user_role ENUM
4. [ ] Check foreign keys: Does workspace_id reference workspaces(id)?
5. [ ] Use `public` schema for functions, NOT `auth`
6. [ ] Use correct role values: 'FOUNDER', 'STAFF', 'CLIENT', 'ADMIN' (uppercase)
7. [ ] Use correct table names: `generated_content` not `generatedContent`

---

## Migration Numbers

| Number | Purpose |
|--------|---------|
| 001 | Initial schema (organizations, workspaces, contacts, emails, campaigns, generated_content) |
| 003 | user_profiles, user_organizations |
| 004 | email_integrations |
| 008 | drip_campaigns |
| 255 | profiles table with role, admin_approvals, admin_trusted_devices |
| 308 | user_role ENUM type, profiles.role migration |
| 309 | Seed FOUNDER/STAFF roles |
| 312 | leads, clients, integrations, client_actions |
| 313 | RLS on new tables |
| 314a | RLS helper functions (is_workspace_member, is_workspace_admin, is_org_member) |
| 314b | Workspace-scoped RLS policies (run AFTER 314a) |
| 315 | Observability tables |

### Migration 314 Split (Deadlock Prevention)

The original migration 314 was split into two parts to prevent deadlock errors:

1. **Run 314a FIRST**: Creates helper functions only (no table locks)
2. **Run 314b SECOND**: Applies policies table-by-table with exception handling

If 314b encounters a deadlock on a specific table:
- Wait 5-10 seconds for active queries to complete
- Re-run just the failing DO block for that table
- Each table's policies are independent

---

**Last Updated**: 2025-11-28
