# RBAC Patterns

> Role-based access control with permission hierarchies, middleware guards, and row-level security for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `rbac-patterns`                                          |
| **Category**   | Authentication & Security                                |
| **Complexity** | Medium                                                   |
| **Complements**| `input-sanitisation`, `audit-trail`, `api-contract`      |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies role-based access control patterns for NodeJS-Starter-V1: role and permission models extending the existing User table, FastAPI dependency-injection guards, Next.js middleware route protection, Supabase row-level security policies, and hierarchical role inheritance.

---

## When to Apply

### Positive Triggers

- Adding roles beyond the existing `is_admin` boolean
- Implementing granular permissions (e.g., `documents:write`, `agents:execute`)
- Protecting API endpoints by role or permission
- Adding row-level security policies to Supabase tables
- Building an admin panel with role management

### Negative Triggers

- JWT token creation and validation (use existing `auth/jwt.py`)
- Input sanitisation for auth forms (use `input-sanitisation` skill)
- Audit logging of permission changes (use `audit-trail` skill)
- API rate limiting per role tier (use `rate-limiter` skill)

---

## Core Principles

### The Three Laws of RBAC

1. **Deny by Default**: Every endpoint is protected unless explicitly marked public. Missing a guard must result in 403, never silent access.
2. **Roles Contain Permissions, Not Logic**: Roles are collections of permission strings. Business logic checks permissions, never role names directly.
3. **Enforce at Every Layer**: Guards in the API layer (FastAPI dependencies), the frontend layer (Next.js middleware), and the database layer (RLS policies). One layer failing must not grant access.

---

## Pattern 1: Role and Permission Models (Python)

### Extending the User Model

```python
from enum import Enum
from pydantic import BaseModel


class Role(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


# Permission format: resource:action
ROLE_PERMISSIONS: dict[Role, set[str]] = {
    Role.VIEWER: {
        "documents:read",
        "agents:read",
        "dashboard:read",
    },
    Role.EDITOR: {
        "documents:read",
        "documents:write",
        "documents:delete",
        "agents:read",
        "agents:execute",
        "dashboard:read",
    },
    Role.ADMIN: {
        "documents:*",
        "agents:*",
        "dashboard:*",
        "users:read",
        "users:update",
    },
    Role.SUPER_ADMIN: {
        "*",  # Wildcard — all permissions
    },
}


def has_permission(role: Role, permission: str) -> bool:
    """Check if a role grants a specific permission."""
    perms = ROLE_PERMISSIONS.get(role, set())
    if "*" in perms:
        return True

    if permission in perms:
        return True

    # Check wildcard for resource (e.g., "documents:*" covers "documents:read")
    resource = permission.split(":")[0]
    return f"{resource}:*" in perms
```

**Project Reference**: `apps/backend/src/auth/models.py:32` — the `User` model has `is_admin: bool`. To adopt RBAC: (1) add a `role: Role` column defaulting to `viewer`, (2) migrate existing `is_admin=True` users to `admin` role, (3) deprecate `is_admin` after migration.

### SQLAlchemy Column Addition

```python
from sqlalchemy import Column, Enum as SAEnum

class User(Base):
    # ... existing columns ...
    role: str = Column(
        SAEnum(Role, name="user_role", create_type=True),
        default=Role.VIEWER,
        nullable=False,
        index=True,
    )
```

---

## Pattern 2: FastAPI Permission Guards

### Dependency-Injection Authorisation

```python
from fastapi import Depends, HTTPException, status


def require_permission(permission: str):
    """FastAPI dependency that checks a specific permission."""

    async def guard(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            )
        return current_user

    return guard


# Usage on endpoints
@router.get("/documents")
async def list_documents(
    user: User = Depends(require_permission("documents:read")),
):
    """List documents — requires documents:read."""
    ...


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    user: User = Depends(require_permission("documents:delete")),
):
    """Delete document — requires documents:delete."""
    ...
```

**Rule**: Never check `if user.role == "admin"` in endpoint logic. Always use `require_permission()` so that adding a new role automatically inherits the correct access.

---

## Pattern 3: Next.js Middleware Route Protection

### Role-Based Route Guards

```typescript
import { NextRequest, NextResponse } from "next/server";

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin": "users:read",
  "/workflows/edit": "agents:execute",
  "/settings": "dashboard:*",
};

const ROLE_PERMISSIONS: Record<string, Set<string>> = {
  viewer: new Set(["documents:read", "agents:read", "dashboard:read"]),
  editor: new Set([
    "documents:read", "documents:write", "documents:delete",
    "agents:read", "agents:execute", "dashboard:read",
  ]),
  admin: new Set([
    "documents:*", "agents:*", "dashboard:*",
    "users:read", "users:update",
  ]),
  super_admin: new Set(["*"]),
};

function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.has("*")) return true;
  if (perms.has(permission)) return true;
  const resource = permission.split(":")[0];
  return perms.has(`${resource}:*`);
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Decode JWT (validation done by backend)
  const payload: JWTPayload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString(),
  );

  const path = request.nextUrl.pathname;
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path.startsWith(route) && !hasPermission(payload.role, permission)) {
      return NextResponse.redirect(new URL("/unauthorised", request.url));
    }
  }

  return NextResponse.next();
}
```

**Project Reference**: `apps/web/middleware.ts` — the existing middleware checks for a JWT cookie but does not inspect the role claim. Extend it with route-permission mapping.

---

## Pattern 4: Row-Level Security (Supabase)

### Database-Level Enforcement

```sql
-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Viewers can read all documents
CREATE POLICY "viewers_read_documents" ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('viewer', 'editor', 'admin', 'super_admin')
    )
  );

-- Editors can insert and update documents
CREATE POLICY "editors_write_documents" ON documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('editor', 'admin', 'super_admin')
    )
  );

-- Only admins can delete documents
CREATE POLICY "admins_delete_documents" ON documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

**Rule**: RLS is the last line of defence. Even if API guards fail, the database rejects unauthorised mutations.

---

## Pattern 5: Role Hierarchy and Inheritance

### Hierarchical Role Resolution

```python
ROLE_HIERARCHY: dict[Role, int] = {
    Role.VIEWER: 0,
    Role.EDITOR: 1,
    Role.ADMIN: 2,
    Role.SUPER_ADMIN: 3,
}


def role_at_least(user_role: Role, minimum_role: Role) -> bool:
    """Check if user's role meets the minimum level."""
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(minimum_role, 0)


def require_role(minimum: Role):
    """FastAPI dependency for hierarchical role checks."""

    async def guard(current_user: User = Depends(get_current_user)) -> User:
        if not role_at_least(current_user.role, minimum):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Minimum role required: {minimum.value}",
            )
        return current_user

    return guard
```

**Use case**: When permission granularity is overkill. For simple admin-only routes, `Depends(require_role(Role.ADMIN))` is cleaner than listing individual permissions.

---

## Pattern 6: React Permission Components

### Declarative UI Permission Gates

```tsx
"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { user } = useAuth();
  if (!user || !hasClientPermission(user.role, permission)) {
    return fallback ?? null;
  }
  return <>{children}</>;
}

// Usage
<PermissionGate permission="documents:delete">
  <DeleteButton documentId={doc.id} />
</PermissionGate>
```

**Rule**: Client-side permission gates are for UX only — hiding buttons the user cannot use. The actual enforcement happens in the API and database layers.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Checking `role === "admin"` in handlers | Adding a new role requires editing every handler | Check permissions via `has_permission()` |
| Frontend-only permission checks | Bypassed by direct API calls | Enforce at API + database layers |
| Boolean flags (`is_admin`, `is_editor`) | Doesn't scale past 2-3 roles | Role enum with permission mapping |
| Hardcoded permission lists per endpoint | Scattered, unmaintainable | Centralised `ROLE_PERMISSIONS` map |
| No RLS policies | Database accessible if API guard fails | Enable RLS as last-line defence |
| Role in JWT without validation | Stale role after admin change | Re-fetch role from database on sensitive operations |

---

## Checklist

Before merging rbac-patterns changes:

- [ ] `Role` enum with `viewer`, `editor`, `admin`, `super_admin` values
- [ ] `ROLE_PERMISSIONS` map with `resource:action` format
- [ ] `has_permission()` function with wildcard support
- [ ] `require_permission()` FastAPI dependency for endpoint guards
- [ ] Next.js middleware extended with route-permission mapping
- [ ] RLS policies on `documents` and sensitive tables
- [ ] `PermissionGate` React component for declarative UI hiding
- [ ] Migration to convert `is_admin` boolean to `role` column

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### RBAC Implementation

**Roles**: [viewer, editor, admin, super_admin]
**Permission Format**: [resource:action]
**API Guards**: [dependency injection / decorator]
**Frontend Guards**: [middleware + PermissionGate]
**Database Guards**: [RLS policies / none]
**Migration**: [is_admin → role column / greenfield]
```
