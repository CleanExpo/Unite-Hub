# API Routes Inventory — 08/03/2026

## Executive Summary

The Unite-Group Nexus codebase contains **822 `route.ts` files** under `src/app/api/`, spread across **155 top-level domains**. The scale far exceeds what a single product typically requires — most SaaS platforms operate with 50–150 API routes. The domain list reveals a pattern of unbounded feature accumulation (e.g. `leviathan`, `arbitration`, `combat`, `signal-purity`) with no consolidation strategy. Of the 822 routes, **401 (~49%) use `auth.getUser()`** as their primary auth mechanism; the remainder use `validateUserAuth`, `createServerClient`, or `supabaseAdmin` patterns. Zero routes use `workspace_id` isolation in their query layer — this is the single most critical architectural gap.

---

## Scale Statistics

| Metric | Count |
|--------|-------|
| Total `route.ts` files | 822 |
| Top-level API domains | 155 |
| Routes using `auth.getUser()` | 401 |
| Routes using `validateUserAuth` | ~30 (estimated from grep sample) |
| Routes using `supabaseAdmin` directly | ~50 (estimated from grep sample) |
| Routes with `workspace_id` in query layer | **0** |

---

## Domain Breakdown (Routes per Domain)

| Rank | Domain | Route Count | Notes |
|------|--------|-------------|-------|
| 1 | `founder` | 103 | Largest single domain — bloated |
| 2 | `integrations` | 50 | Second largest |
| 3 | `aido` | 21 | Separate product namespace |
| 4 | `ai` | 20 | Core AI routes |
| 5 | `staff` | 18 | Internal tooling |
| 6 | `erp` | 18 | ERP feature set |
| 7 | `strategy` | 14 | |
| 8 | `evolution` | 14 | Unclear scope |
| 9 | `engines` | 14 | |
| 10 | `founder-os` | 13 | Overlaps with `founder` domain |
| 11 | `client` | 13 | |
| 12 | `social-templates` | 10 | |
| 13 | `seo` | 10 | |
| 14 | `loyalty` | 10 | |
| 15 | `nexus` | 9 | |
| 16 | `neo4j` | 9 | Graph DB integration |
| 17 | `campaigns` | 9 | |
| 18 | `calendar` | 9 | |
| 19 | `trust` | 8 | |
| 20 | `enterprise` | 8 | |
| 21 | `email-intel` | 8 | Overlaps with `email` domain |
| 22 | `email` | 8 | |
| 23 | `cron` | 8 | Background job triggers |
| 24 | `contacts` | 8 | Core CRM domain |
| 25 | `autonomy` | 8 | |
| 26 | `admin` | 8 | |
| 27–155 | (remaining 129 domains) | 1–7 each | See full list below |

### Single-Route Domains (High Fragmentation Risk)

The following domains have exactly **1 route each** — strong indicator of abandoned features or premature domain creation:

`voice`, `visual`, `trends`, `tracking`, `test-sentry`, `test-rate-limit`, `test-questionnaire`, `test-opus-4-5`, `test`, `system`, `signal-purity`, `security`, `report`, `production`, `privacy`, `predictions`, `playbooks`, `pipeline`, `performance`, `organization`, `narrative`, `mvp`, `metrics`, `load`, `insights`, `feedback`, `execution-logs`, `docs`, `deployment-check`, `demo`, `decisions`, `csrf-token`, `council`, `contact`, `coaching`, `clients`, `client-approvals`, `channels`, `audits`, `archive`, `arbitration`, `analyze`, `alignment`, `agent-mandates`

**44 single-route domains** — each represents a feature stub with no surrounding context.

### Test Routes in Production Namespace

Four domains are explicitly test routes sitting in the production API namespace:

- `src/app/api/test/` — 1 route
- `src/app/api/test-sentry/` — 1 route
- `src/app/api/test-rate-limit/` — 1 route
- `src/app/api/test-questionnaire/` — 1 route
- `src/app/api/test-opus-4-5/` — 1 route

**These must be removed before any production hardening.**

### Domain Overlap / Duplication Patterns

| Group | Domains | Issue |
|-------|---------|-------|
| Founder | `founder` (103), `founder-os` (13), `founder-intel` (6) | 122 routes across 3 namespaces — should be 1 |
| Email | `email` (8), `email-intel` (8), `emails` (2) | 18 routes across 3 namespaces |
| Agent | `agent` (4), `agents` (4), `agent-mandates` (1) | 9 routes across 3 namespaces |
| Client | `client` (13), `clients` (1), `client-agent` (4), `client-approvals` (1) | 19 routes across 4 namespaces |
| SEO | `seo` (10), `seo-enhancement` (7), `seo-leak` (4) | 21 routes across 3 namespaces |
| Orchestration | `orchestrator` (3), `orchestration` (2) | 5 routes across 2 namespaces |
| Organisation | `organizations` (2), `organization` (1) | 3 routes — US/AU spelling split |

---

## Findings

### CRITICAL (blocks Phase 2)

| Finding | Location | Recommendation |
|---------|----------|----------------|
| Zero routes filter by `workspace_id` at the query layer | All 822 routes | Implement workspace isolation middleware before Phase 2 |
| 5 test routes in production API namespace | `src/app/api/test*/` | Delete immediately |
| `founder` domain has 103 routes — no single feature warrants this | `src/app/api/founder/` | Audit and collapse to ≤20 routes |
| `founder` + `founder-os` + `founder-intel` = 122 routes in 3 overlapping namespaces | Multiple | Merge into single `founder` domain |

### HIGH (address in Phase 2)

| Finding | Location | Recommendation |
|---------|----------|----------------|
| 44 single-route domains — likely abandoned stubs | Various | Audit for live usage; delete unused |
| `email`, `email-intel`, `emails` split across 3 domains | `src/app/api/email*/` | Consolidate to single `email` domain |
| `organizations` vs `organization` spelling split | `src/app/api/organization*/` | Merge; pick one canonical spelling |
| `agent`, `agents`, `agent-mandates` fragmentation | `src/app/api/agent*/` | Merge into single `agents` domain |
| `supabaseAdmin` used directly in agent lib files (not just API routes) | `src/lib/agents/base-agent.ts`, `src/lib/creative/creativeDirectorEngine.ts`, `src/lib/ai/cost-monitor.ts` | Admin client must only be instantiated in API route layer |

### MEDIUM (address in Phase 3–4)

| Finding | Location | Recommendation |
|---------|----------|----------------|
| 155 top-level domains — no domain taxonomy | `src/app/api/` | Define domain taxonomy (core, integrations, admin, internal) |
| `cron` domain with 8 routes — no rate protection evident | `src/app/api/cron/` | Add cron secret header validation |
| `neo4j` domain (9 routes) — second graph DB alongside Supabase | `src/app/api/neo4j/` | Verify if live; if not, remove |

### INFO

| Finding | Location | Recommendation |
|---------|----------|----------------|
| 401 routes use `auth.getUser()` consistently | Various | Auth pattern is correct; continue |
| `validateUserAuth` helper used in newer routes | `src/lib/workspace-validation.ts` | Good pattern — standardise across all routes |

---

## Statistics

- Total routes audited: **822**
- Routes recommended for removal (test + clear stubs): **≥49** (5 test + 44 single-route candidates)
- Routes recommended for consolidation: **~250** (founder cluster + email cluster + client cluster + SEO cluster)
- Routes to keep as-is: **~520** (pending deeper audit)

---

## Recommended Actions (Priority Order)

1. Delete the 5 test route domains from `src/app/api/test*/` immediately
2. Implement a `withWorkspaceAuth` middleware that injects `workspaceId` and gates all non-public routes
3. Audit all 44 single-route domains for live usage — delete any with no frontend callers
4. Merge `founder`, `founder-os`, `founder-intel` into a single `founder` domain (target: ≤30 routes)
5. Merge `email`, `email-intel`, `emails` into a single `email` domain
6. Merge `agent`, `agents`, `agent-mandates` into a single `agents` domain
7. Define a formal domain taxonomy and enforce it via directory structure linting
