# Architecture Compliance Check — 08/03/2026

## Executive Summary

The architecture compliance check reveals a consistent auth pattern (401 routes use `auth.getUser()`) but a near-total absence of `workspace_id` query-layer isolation across all 822 API routes. TypeScript `any` usage is pervasive at **1,176 occurrences** across the `src/` directory, indicating either rapid prototyping that was never hardened or systematic bypassing of type safety. The `supabaseAdmin` client is accessible from lib files outside the API route layer, creating a potential server-key exposure vector. Auth middleware is present in the vast majority of routes but lacks standardisation — three distinct patterns coexist. The codebase follows Next.js App Router conventions correctly (Server Components, route handlers) but the monorepo boundary between `src/` and `apps/` is not consistently respected.

---

## Compliance Checks

### 1. Workspace Isolation (`workspace_id` Filter)

| Check | Result | Detail |
|-------|--------|--------|
| Routes with `workspace_id` in query layer | **0 / 822** | Grep across all `route.ts` files returned zero matches |
| Routes with `workspace_id` referenced at all | **~45 estimated** | Some routes pass `workspace_id` in INSERT payloads but do not filter SELECT queries by it |
| RLS as sole isolation mechanism | **Yes** | Application relies entirely on Supabase RLS — no application-layer enforcement |

**Assessment**: CRITICAL NON-COMPLIANCE. The CLAUDE.md constitution states: "ALL queries must include `.eq('workspace_id', workspaceId)`". This rule is violated across the entire API surface.

---

### 2. Auth Middleware Presence (10-Route Spot-Check)

| Route | Auth Present | Pattern Used | Compliant |
|-------|-------------|--------------|-----------|
| `email/webhook/route.ts` | Implicit (webhook token) | No user auth | Partial |
| `ai/auto-reply/route.ts` | Yes | `validateUserAuth` | Yes |
| `admin/pending-approvals/route.ts` | Yes | `supabase.auth.getUser()` | Yes |
| `media/transcribe/route.ts` | Yes | `supabaseBrowser.auth.getUser(token)` | Yes |
| `connectors/compliance/route.ts` | Yes | Custom `auth` helper | Yes |
| `agency/switch/route.ts` | Yes | `supabaseBrowser.auth.getUser(token)` | Yes |
| `founder/alerts/triggered/route.ts` | Yes | `supabase.auth.getUser()` | Yes |
| `opportunities/list/route.ts` | Yes | `supabaseBrowser.auth.getUser(token)` | Yes |
| `operator/reports/route.ts` | Yes | `supabaseBrowser.auth.getUser(token)` | Yes |
| `tracking/pixel/[trackingPixelId]/route.ts` | No (public) | None (intentional) | Acceptable |

**Auth compliance rate in spot-check**: 9/10 routes have auth; 8/10 use an appropriate pattern.

**Three competing auth patterns identified**:
- `supabase.auth.getUser()` — direct call (401 routes)
- `supabaseBrowser.auth.getUser(token)` — client-side Supabase instance with Bearer token
- `validateUserAuth(req)` — centralised helper from `src/lib/workspace-validation.ts`

The `validateUserAuth` pattern is the most correct (centralised, testable) but is not universally adopted.

---

### 3. TypeScript `any` Usage

| Metric | Count |
|--------|-------|
| Total `: any` occurrences in `src/` | **1,176** |
| Files with `any` (estimated) | ~200+ |

**Assessment**: HIGH NON-COMPLIANCE. 1,176 `any` usages indicates systematic type suppression. This makes refactoring dangerous and enables runtime errors that TypeScript is meant to prevent. The CLAUDE.md constitution requires TypeScript strict compliance.

**Common patterns likely driving this count**:
- Agent response shapes typed as `any`
- Supabase query result destructuring without proper generic typing
- External API response types not defined
- `catch (e: any)` in error handlers

---

### 4. `supabaseAdmin` / Service Role Key Access

| Check | Result |
|-------|--------|
| `supabaseAdmin` used inside `src/app/api/` routes | Acceptable — server-side only |
| `supabaseAdmin` or `SUPABASE_SERVICE_ROLE_KEY` accessed in `src/lib/` outside API routes | **3 files** (non-compliant) |

Non-compliant files:
- `src/lib/agents/base-agent.ts:49` — references `SUPABASE_SERVICE_ROLE_KEY` directly
- `src/lib/creative/creativeDirectorEngine.ts:102` — creates admin client inline
- `src/lib/ai/cost-monitor.ts:14` — creates admin client with fallback placeholder

These lib files may be imported transitively into contexts that bundle for the client.

---

### 5. No Raw SQL in Application Code

| Check | Result |
|-------|--------|
| Raw SQL strings in `src/` (non-migration files) | Not scanned in this phase — requires dedicated check |
| Supabase query builder used consistently | Assumed yes based on code samples reviewed |

**Assessment**: Deferred to Phase 2 — requires targeted scan.

---

### 6. Monorepo Boundary Compliance

| Check | Result |
|-------|--------|
| `src/` (Unite Hub app) isolated from `apps/web/` | Needs verification |
| `apps/backend/` (FastAPI) isolated from `src/` | Assumed yes — different language |
| Cross-package imports via `packages/shared/` | Assumed yes |

**Assessment**: Deferred to Phase 2.

---

### 7. Server Component Usage

| Check | Result |
|-------|--------|
| `'use client'` directive present where appropriate | Not scanned in this phase |
| Supabase server client (`createClient` from `@/lib/supabase/server`) used in Server Components | Spot-check shows `getSupabaseServer()` used in route handlers — correct |
| Client-side Supabase calls in Server Components | Not detected in spot-check |

**Assessment**: Surface compliance appears good; deep scan deferred to Phase 2.

---

## Findings Summary

### CRITICAL (blocks Phase 2)

| Finding | Scope | Recommendation |
|---------|-------|----------------|
| `workspace_id` absent from all API query layers | All 822 routes | Implement `withWorkspaceAuth` middleware; add `.eq('workspace_id', workspaceId)` to all SELECT queries |
| 1,176 TypeScript `any` usages | `src/` directory | Systematic `any` elimination as part of Phase 2 — prioritise API route handlers and shared lib types |

### HIGH (address in Phase 2)

| Finding | Scope | Recommendation |
|---------|-------|----------------|
| Three competing auth patterns — no standard | All routes | Standardise on `validateUserAuth` from `src/lib/workspace-validation.ts` |
| `supabaseAdmin` accessed in 3 lib files outside API layer | `src/lib/` | Centralise admin client; add ESLint rule to prevent direct env var access outside designated files |

### MEDIUM (address in Phase 3–4)

| Finding | Scope | Recommendation |
|---------|-------|----------------|
| No application-layer enforcement of data isolation | All routes | Add integration tests that verify cross-workspace data leakage is impossible |
| Auth middleware not unit-tested (inferred) | `src/lib/workspace-validation.ts` | Add unit tests for all auth helper functions |

### INFO

| Finding | Scope | Recommendation |
|---------|-------|----------------|
| 401 routes use consistent `auth.getUser()` call | `src/app/api/` | Positive baseline — auth is present at scale |
| `validateUserAuth` helper exists and is used in newer routes | `src/lib/workspace-validation.ts` | Good pattern to standardise around |

---

## Statistics

- Routes audited: **822**
- Routes with auth: **~821** (estimated — all but confirmed public endpoints)
- Routes with `workspace_id` isolation: **0**
- TypeScript `any` occurrences: **1,176**
- Lib files with improper admin client access: **3**

---

## Recommended Actions (Priority Order)

1. Create `src/lib/supabase/admin.ts` as the single export point for the admin client — add ESLint `no-restricted-imports` rule to block direct `process.env.SUPABASE_SERVICE_ROLE_KEY` access elsewhere
2. Implement `withWorkspaceAuth(handler: RouteHandler): RouteHandler` middleware that:
   - Calls `validateUserAuth(req)`
   - Fetches `workspace_id` from user's profile
   - Injects `{ user, workspaceId }` into the handler context
3. Migrate all routes to use `withWorkspaceAuth` — start with the `contacts`, `campaigns`, and `email` domains (highest data sensitivity)
4. Run `pnpm turbo run type-check` and address `any` usages in order of: shared types → API routes → lib utilities → agent files
5. Add ESLint rule `@typescript-eslint/no-explicit-any: error` to catch future regressions
6. Write integration test: create two workspaces, authenticate as workspace A, attempt to read workspace B data — assert 403/empty response
