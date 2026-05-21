---
paths: src/**/*.{ts,tsx}, supabase/**/*.sql
---

# Supabase Rules — Unite-Group Nexus 2.0

> Authoritative rules for all Supabase usage: client setup, queries, RLS, migrations, types, and compliance.
> Companion to `rules/database/supabase-migrations.md` (migration patterns) and `agents/database-architect/agent.md` (schema ownership).

---

## Client Setup

### Two clients — never mix them

```typescript
// Server Components, API routes, middleware
import { createServerClient } from '@supabase/ssr'
// src/lib/supabase/server.ts

// Client Components only
import { createBrowserClient } from '@supabase/ssr'
// src/lib/supabase/client.ts
```

**Rule**: `createBrowserClient` NEVER appears in `src/app/api/`, `src/lib/`, or any server-side file.
**Rule**: `SUPABASE_SERVICE_ROLE_KEY` NEVER exposed to the client bundle. Server-side only.

### Project files

```
src/lib/supabase/
  client.ts      — createBrowserClient (browser only)
  server.ts      — createServerClient (server components, API routes)
  middleware.ts  — PKCE session refresh (src/middleware.ts imports this)
```

---

## Founder Isolation (Single-Tenant)

Every query MUST scope to `founder_id = auth.uid()`. No exceptions.

```typescript
// ✅ CORRECT — every query scoped
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('founder_id', founderId)   // REQUIRED

// ❌ WRONG — returns all rows (RLS may catch this, but don't rely on it alone)
const { data } = await supabase
  .from('businesses')
  .select('*')
```

**Why**: Defence in depth. RLS is the last line; application code is the first. Both must enforce isolation.

**founderId** is always `(await supabase.auth.getUser()).data.user?.id`. Never trust a client-supplied value.

---

## Row Level Security (RLS)

Every table in production MUST have RLS enabled with a `founder_id` policy. No table ships without RLS.

### Policy Templates

```sql
-- Enable RLS (required before any policy)
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_name FORCE ROW LEVEL SECURITY;

-- SELECT: founder reads own rows
CREATE POLICY "founder_select" ON public.table_name
  FOR SELECT USING (founder_id = auth.uid());

-- INSERT: founder inserts own rows (founder_id auto-set)
CREATE POLICY "founder_insert" ON public.table_name
  FOR INSERT WITH CHECK (founder_id = auth.uid());

-- UPDATE: founder updates own rows
CREATE POLICY "founder_update" ON public.table_name
  FOR UPDATE USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

-- DELETE: founder deletes own rows
CREATE POLICY "founder_delete" ON public.table_name
  FOR DELETE USING (founder_id = auth.uid());

-- SERVICE ROLE: agent API access (bypasses RLS by design)
-- No policy needed — service_role bypasses RLS automatically.
-- Only use service_role in server-side code with the SERVICE_ROLE_KEY.
```

### Shorthand (all operations at once)

```sql
CREATE POLICY "founder_all" ON public.table_name
  FOR ALL USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());
```

---

## Migration Patterns

See `rules/database/supabase-migrations.md` for the full pattern. Key rules:

- **Naming**: `YYYYMMDDHHMMSS_description.sql` — timestamp prefix is mandatory
- **Never modify applied migrations** — always create a new migration
- **Forward-only** — no destructive changes in the migration itself; provide a separate rollback if needed
- **RLS in the same migration** as the table creation

```bash
supabase migration new <description>   # creates YYYYMMDDHHMMSS_description.sql
supabase db push                       # apply to local
supabase db push --linked              # apply to remote (production)
```

---

## Type Generation

Run after **every** migration. Non-negotiable.

```bash
pnpm run db:types
# which is: supabase gen types typescript --local > src/types/database.ts
```

**Import pattern**:
```typescript
import type { Database } from '@/types/database'
import type { Tables } from '@/types/database'

type Business = Tables<'businesses'>
```

**Never** write manual TypeScript interfaces for database rows. Always derive from the generated types.

---

## pgsodium Vault Pattern (ADR-006)

Encrypted credentials use `vault.secrets` via SECURITY DEFINER RPCs. Never read `vault.secrets` directly from application code.

```sql
-- Create a secret (server-side RPC)
SELECT vault.create_secret(
  'my-api-key-value',
  'xero_client_secret',
  'Xero OAuth client secret for Disaster Recovery'
);

-- Read via SECURITY DEFINER wrapper (never expose vault directly)
CREATE OR REPLACE FUNCTION get_credential(credential_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  -- Verify caller is the founder
  IF auth.uid() != (SELECT founder_id FROM workspaces LIMIT 1) THEN
    RAISE EXCEPTION 'Unauthorised';
  END IF;

  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = credential_name;

  RETURN secret_value;
END;
$$;
```

**Reference**: `src/lib/vault/encryption.ts` for the application-side interface.

---

## Audit Logging (Privacy Act 1988 Compliance)

Sensitive operations require an audit log entry. Minimum 7-year retention for financial data.

```typescript
// After any state-changing operation on sensitive tables
await supabase.from('audit_log').insert({
  founder_id: founderId,
  action: 'UPDATE',
  resource_type: 'credentials_vault',
  resource_id: credentialId,
  performed_at: new Date().toISOString(),
  ip_address: request.headers.get('x-forwarded-for') ?? null,
})
```

Tables requiring audit: `credentials_vault`, `approval_queue`, `businesses` (financial fields).

---

## Connection Pooling

For serverless/edge environments (Vercel, Supabase Edge Functions):

- Use **transaction mode** pooling (`?pgbouncer=true`)
- Keep connection strings in env vars; never hardcode
- Server Components use the server client which manages pooling automatically via the SSR package

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------|
| `createBrowserClient` in API routes | Exposes session to server leak risk | Use `createServerClient` |
| Query without `.eq('founder_id', ...)` | Returns other founders' data (if RLS misconfigured) | Always scope queries |
| `service_role` key in client bundle | Full database bypass exposed to browser | Server-side only |
| Manual TypeScript row types | Drift from actual schema | `supabase gen types typescript` |
| Table without RLS | Data exposure risk | Always enable + force RLS |
| Raw SQL in application code | Bypasses type safety and RLS | Supabase query builder only |
| Modifying applied migrations | Breaks migration history, causes conflicts | New migration file always |

---

## Never

- Create a table without RLS policies
- Store encryption keys or master passwords in the database
- Use `service_role` key in any client-side code
- Skip type generation after migrations
- Bypass `founder_id` scoping — even in service-role contexts, write it explicitly
