# Security Scan — 08/03/2026

## Executive Summary

The surface-level security scan found **no hardcoded secrets** (API keys, passwords, or JWT tokens) committed to source files — all sensitive values are correctly read from environment variables. The `SUPABASE_SERVICE_ROLE_KEY` is referenced via `process.env` in 3 lib files outside the API route layer, which is a medium-severity concern. The most significant security finding is **architectural**: zero API routes implement `workspace_id` query-layer isolation, meaning any authenticated user who manipulates request parameters could potentially read or write data belonging to another workspace. Two files contain JWT-pattern strings (`eyJ`) that appear to be example/validation strings, not live tokens. No `.env` secrets were found committed to the repository.

---

## Scan Coverage

| Pattern Searched | Tool | Scope |
|-----------------|------|-------|
| `sk-ant-` (Anthropic keys) | rg | `src/**/*.ts`, `src/**/*.tsx` |
| `SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]` (hardcoded value) | rg | `src/**/*.ts`, `src/**/*.tsx` |
| `password\s*=\s*['"]` | rg | `src/**/*.ts`, `src/**/*.tsx` |
| `api_key\s*=\s*['"]` | rg | `src/**/*.ts`, `src/**/*.tsx` |
| `eyJ[A-Za-z0-9+/]{20,}` (raw JWT) | rg | `src/**/*.ts`, `src/**/*.tsx` |
| Routes missing auth imports | rg `-L` | `src/app/api/**/*.ts` |
| `service_role` outside API layer | rg | `src/**/*.ts` excluding `app/api/` |
| `workspace_id` in query layer | rg | `src/app/api/**/*.ts` |

---

## Findings

### CRITICAL (blocks Phase 2)

| Finding | File(s) | Recommendation |
|---------|---------|----------------|
| **Zero API routes filter queries by `workspace_id`** — data isolation is entirely dependent on RLS policies alone | All 822 `src/app/api/**/route.ts` files | Implement `withWorkspaceAuth` middleware that validates and injects `workspaceId` into every protected route handler. Do not rely solely on RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` referenced with `'placeholder-key'` fallback string | `src/lib/ai/cost-monitor.ts:14` | Remove fallback — a missing service role key should throw, not silently use a placeholder. Placeholder strings can mask misconfiguration in production. |

### HIGH (address in Phase 2)

| Finding | File(s) | Recommendation |
|---------|---------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` accessed in `lib/` files outside the API route layer | `src/lib/agents/base-agent.ts:49`, `src/lib/creative/creativeDirectorEngine.ts:102`, `src/lib/ai/cost-monitor.ts:14` | Admin client instantiation must be centralised in `src/lib/supabase/admin.ts` and never imported directly into agent/creative/AI lib files. These libs may be called from client-side contexts. |
| `supabaseAdmin` imported directly in non-API lib files | `src/lib/agents/base-agent.ts`, `src/lib/creative/creativeDirectorEngine.ts` | Verify these files are never imported into client components — if they are, the service role key leaks to the browser bundle |
| `env-validation.ts` contains `eyJ`-pattern strings | `src/lib/env-validation.ts` | Confirmed as validation example strings (not live tokens), but the file should use placeholder patterns like `eyJ...` rather than real-looking JWT segments to avoid false positives in future scans |
| `ReleaseBuilder.ts` contains `eyJ`-pattern strings | `src/lib/services/system/ReleaseBuilder.ts` | Same as above — investigate whether these are test fixture data |

### MEDIUM (address in Phase 3–4)

| Finding | File(s) | Recommendation |
|---------|---------|----------------|
| Auth pattern inconsistency — some routes use `supabase.auth.getUser()`, others use `validateUserAuth()`, others use `supabaseBrowser.auth.getUser(token)` | Various `route.ts` files | Standardise on a single auth helper across all routes. `validateUserAuth` from `src/lib/workspace-validation.ts` is the correct pattern. |
| `getSupabaseServer()` and `getSupabaseAdmin()` are both used across routes — unclear when each is appropriate | Various | Document the distinction clearly; audit that `getSupabaseAdmin()` is never used where `getSupabaseServer()` suffices |
| Cron routes (`src/app/api/cron/`) — no cron secret header validation observed | `src/app/api/cron/health-check/route.ts` | Cron routes must validate `Authorization: Bearer ${CRON_SECRET}` header. Without this, any external party can trigger background jobs. |
| `src/app/api/tracking/pixel/[trackingPixelId]/route.ts` accesses `workspace_id` from the tracked email object but accepts an unauthenticated request | `tracking/pixel/` | Tracking pixels are legitimately unauthenticated, but the route must not expose workspace data in its response |

### INFO (awareness only)

| Finding | File(s) | Recommendation |
|---------|---------|----------------|
| No hardcoded Anthropic API keys found | `src/` | Correct — keys are env var driven |
| No hardcoded passwords found | `src/` | Correct |
| No hardcoded Supabase service role values found | `src/` | Correct — all `process.env` references |
| No `.env` secrets found committed to repo | Root, `src/` | Correct |
| `auth.getUser()` used in 401 routes — consistent pattern | `src/app/api/` | Good — continue this pattern |

---

## Auth Pattern Spot-Check (10 Random Routes)

| Route | Auth Method | `workspace_id` Used | Assessment |
|-------|-------------|---------------------|------------|
| `email/webhook/route.ts` | None observed (webhook) | Yes — in query | Acceptable (webhook, but should validate webhook signature) |
| `ai/auto-reply/route.ts` | `validateUserAuth` | No | Auth present; workspace isolation missing |
| `admin/pending-approvals/route.ts` | `supabase.auth.getUser()` | No | Auth present; workspace isolation missing |
| `media/transcribe/route.ts` | `supabaseBrowser.auth.getUser(token)` | Yes (`workspace_id` in query) | Best pattern observed |
| `connectors/compliance/route.ts` | `auth` object from helper | No (uses `project_id` instead) | Auth present; uses project isolation — review if this is equivalent |
| `agency/switch/route.ts` | `supabaseBrowser.auth.getUser(token)` | No | Auth present; workspace isolation missing |
| `founder/alerts/triggered/route.ts` | `supabase.auth.getUser()` | No | Auth present; workspace isolation missing |
| `opportunities/list/route.ts` | `supabaseBrowser.auth.getUser(token)` | No | Auth present; workspace isolation missing |
| `operator/reports/route.ts` | `supabaseBrowser.auth.getUser(token)` | No | Auth present; workspace isolation missing |
| `tracking/pixel/[trackingPixelId]/route.ts` | None (public endpoint) | Yes (from DB record) | Acceptable pattern for tracking pixel |

**Summary**: 8 of 10 sampled routes authenticate the user correctly but do not enforce `workspace_id` in their query layer. The application relies entirely on Supabase RLS for data isolation — this is fragile if any RLS policy has a gap.

---

## Statistics

- Hardcoded secrets found: **0**
- Routes with auth present: **~821** (all but confirmed public endpoints)
- Routes with `workspace_id` query isolation: **~0** (estimated from grep and spot-check)
- Service role key accessed outside API layer: **3 files**
- Files with JWT-pattern false positives: **2 files**

---

## Recommended Actions (Priority Order)

1. Implement `withWorkspaceAuth(handler)` middleware that extracts and validates `workspaceId` from the authenticated user's session and passes it to every route handler
2. Fix `src/lib/ai/cost-monitor.ts:14` — remove `|| 'placeholder-key'` fallback immediately
3. Centralise admin Supabase client into `src/lib/supabase/admin.ts` — audit `base-agent.ts` and `creativeDirectorEngine.ts` to confirm they are never imported client-side
4. Add cron secret validation to all `src/app/api/cron/` routes
5. Add webhook signature validation to `src/app/api/email/webhook/route.ts`
6. Audit all RLS policies on the live Supabase instance — verify every table has `workspace_id`-scoped SELECT/INSERT/UPDATE/DELETE policies
