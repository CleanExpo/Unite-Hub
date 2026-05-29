# API Routes — Context Node

> READ FIRST before adding or editing any route under `src/app/api/`.
> Child context node (intent-layer pattern). Inherits root `/CLAUDE.md` + `.claude/rules/`.

## What this area owns

The complete HTTP surface of Unite-Hub: ~33 route groups (advisory, analytics, auth,
boardroom, bookkeeper, campaigns, coaches, contacts, content, cron, dashboard, email,
experiments, linear, social, strategy, vault, xero, …). Each `route.ts` is one endpoint.

Out of scope: business logic lives in `src/lib/` (services, integrations, orchestrators).
Routes are thin — auth, parse, delegate, respond. Do not put domain logic in a route.

## Non-negotiable invariants

1. **Auth on every route.** First lines:
   ```ts
   const user = await getUser()              // from '@/lib/supabase/server'
   if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
   ```
2. **Founder scoping.** Every Supabase query filters `.eq('founder_id', user.id)`.
   Single-tenant — never `workspace_id`, never trust a client-supplied id.
3. **`export const dynamic = 'force-dynamic'`** on every route (no static caching of
   founder data). This is why CI builds pass with placeholder secrets.
4. **Server client only.** `createClient` from `@/lib/supabase/server`. Never
   `createBrowserClient` here. `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
5. **CRON routes authenticate by `CRON_SECRET`, not session:**
   ```ts
   const authHeader = request.headers.get('authorization')
   if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) return 401
   const founderId = process.env.FOUNDER_USER_ID   // single-tenant cron actor
   ```
   Long jobs set `export const maxDuration = 300`. 15 crons are registered in `vercel.json`.

## Patterns to follow

- Validate required fields → `400` with a clear message (see `contacts/route.ts`).
- Whitelist enum inputs (e.g. status) rather than trusting the body.
- Errors → `NextResponse.json({ error: msg }, { status })`. No thrown errors leak to client.
- Sensitive mutations (vault, approvals, financial) → write an `audit_log` entry.

## Common confusion / false-green trap

- A route returning `200` does **not** mean its data is real. Several endpoints
  (e.g. `dashboard/kpi`) fall back to **mock** data from integrations when a provider
  isn't connected — see `src/lib/integrations/CLAUDE.md`. When auditing a route GREEN,
  verify it is wired to real data, not a silent mock fallback.
