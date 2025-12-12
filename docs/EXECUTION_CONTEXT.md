# Execution Context (Canonical API Contract)

## Scope
This repo is **Next.js App Router** rooted at `src/app`.

There is **no Next.js middleware.ts** in use.

Therefore, the only guaranteed inbound execution surfaces for HTTP requests are:
- Route Handlers: `src/app/api/**/route.ts`

This document defines the **canonical, execution-proof contract** for resolving:
- `userId`
- `workspaceId`

at the **API route boundary**.

## Canonical module
`src/lib/execution-context.ts`

Export:
- `requireExecutionContext(req, args?, options?)`

## What `requireExecutionContext()` guarantees
If it returns `{ ok: true }`, you get:
- `ctx.user.id`
- `ctx.supabase` (server-side Supabase client in authenticated context)
- `ctx.workspace.id`
- `ctx.workspace.orgId`
- `ctx.workspace.role` (from `user_organizations.role` when available)

If it returns `{ ok: false }`, you get a deterministic JSON `NextResponse` with a stable status code.

## Auth resolution
Order:
1) If request has `Authorization: Bearer <jwt>`
   - uses `getSupabaseServerWithAuth(token)`
2) Else
   - uses `await getSupabaseServer()` (cookie session)

Failure:
- No user => `401 Unauthorized`

## Workspace resolution (no query params)
Workspace is **NOT** accepted from `?workspaceId=`.

Accepted sources:
1) `x-workspace-id` header
2) JSON body field `workspaceId` (POST/PUT/PATCH only)
3) Route param `params.workspaceId` (if route is defined that way)
4) Optional deterministic default (disabled by default)

Failure:
- Missing workspace when required => `400 Bad Request`
- Workspace not found => `404 Not Found`
- User not member of owning org => `403 Forbidden`

## Membership enforcement
The membership boundary is:
- `workspaces.org_id`
- `user_organizations (user_id, org_id, role, is_active)`

User is authorized for a workspace iff:
- workspace exists
- user has an active `user_organizations` row for `workspaces.org_id`

## Example usage (Route Handler)
```ts
import { NextRequest } from 'next/server'
import { requireExecutionContext } from '@/lib/execution-context'

export async function GET(req: NextRequest) {
  const ctxResult = await requireExecutionContext(req, undefined, {
    requireWorkspace: true,
    allowWorkspaceFromHeader: true,
  })

  if (!ctxResult.ok) return ctxResult.response

  const { user, workspace, supabase } = ctxResult.ctx

  // ... business logic ...
}
```

## Proof anchor
`src/app/api/admin/audit-events/route.ts` has been migrated to this contract.

It now requires `x-workspace-id` and no longer accepts `?workspaceId=`.
