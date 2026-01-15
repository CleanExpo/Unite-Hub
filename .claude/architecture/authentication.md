# Authentication Architecture

**Pattern**: PKCE OAuth Flow (Server-Side Session Validation)
**Status**: ⏳ To be migrated from CLAUDE.md
**Last Updated**: 2026-01-15 (Migrated from implicit to PKCE)

---

## Overview

Unite-Hub uses **PKCE (Proof Key for Code Exchange)** OAuth flow for enhanced security with server-side session validation.

## Benefits of PKCE

- Sessions stored in **cookies** (accessible server-side in middleware)
- Proper **server-side route protection**
- JWT validation with `getUser()` instead of just reading cookies
- No localStorage token exposure

## Key Files

- `src/lib/supabase/client.ts` - Browser client with cookie storage
- `src/lib/supabase/server.ts` - Server component client
- `src/lib/supabase/middleware.ts` - Middleware client
- `src/app/auth/callback/route.ts` - PKCE code exchange

## Server-Side Auth (Preferred)

Use in API routes and Server Components:

```typescript
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // User is authenticated, proceed
  const { data } = await supabase.from('table').select('*');
}
```

## Client-Side Auth

For client components:

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
```

## Middleware Protection

Automatic with PKCE:

```typescript
// src/middleware.ts uses getUser() for JWT validation
const { data: { user } } = await supabase.auth.getUser();
```

## Supabase Client Types

**Four client types** (use the right one):

1. **Browser Client** - Client-side React components (PKCE cookies)
2. **Server Client** - Server Components and API routes
3. **Middleware Client** - Next.js middleware only
4. **Admin Client** - Admin operations bypassing RLS

## Legacy Exports

Still available for backward compatibility:
```typescript
import { supabase, supabaseBrowser, getSupabaseServer } from "@/lib/supabase";
```

**CRITICAL**: For new code, prefer modular imports from `@/lib/supabase/client` and `@/lib/supabase/server`.

---

**Reference**: `src/middleware.ts`, `src/app/auth/callback/route.ts`
**To be migrated from**: CLAUDE.md lines 338-389
