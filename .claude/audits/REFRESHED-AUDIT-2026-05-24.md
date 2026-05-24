# REFRESHED AUDIT — Unite-Group Nexus (Unite-Hub)
Date: 24/05/2026 (AEST)
Phase: 1.5 — Mid-cycle re-audit
Auditor: Claude Opus 4.7 (read-mostly, with one ESLint guard PR alongside)
Supersedes: `MASTER-AUDIT-REPORT.md` (08/03/2026, now 2.5 months stale)

---

## Why this exists

The Master Audit Report from 08/03/2026 has been **dramatically overtaken by reality**. Between that audit and today, the user has merged at least:

- Plans 01-05 ecosystem cleanup (commit `28bf5b97`, 32 commits squashed)
- Founder Workspace (#41), Unite-Group consolidation plan (#46)
- CI baseline restoration (#47, #48), Margot operating packs (#49-#52)
- CRM lead qualification (#53), portfolio templates (#54)

Without a refreshed snapshot, any future agent loading the Master Audit will plan against a state that no longer exists and waste cycles "fixing" things that are already done. This document is the new ground truth.

---

## Headline: cleanup is ~85% done

| Metric | Master Audit (08/03) | Today (24/05) | Δ |
|---|---:|---:|---|
| API route files | 822 | **126** | -85% ✓ |
| Top-level API domains | 155 | **33** | -79% ✓ |
| Test routes in production namespace | 5 | **0** | done ✓ |
| Root markdown files | 529 | **4** | done ✓ (kept: README, CHANGELOG, CLAUDE, ENG-FRAMEWORK) |
| TypeScript `any` (production code) | 1,176 | **3** | -99.7% ✓ |
| TypeScript `any` (test mocks) | included above | 16 | acceptable — test mocks for vi.mocked / framer-motion / cmdk |
| `cost-monitor.ts` placeholder-key fallback | 1 | **0** (file removed) | done ✓ |
| Service-role-key usages outside API | 3 | 3 (different files) | see § Service-Role Usage |
| Routes with `workspace_id`/`founder_id` filter | 0/822 | **72/126** (57%) | see § Tenant Isolation |
| Migration files (live) | 417 | **489** | regressed — see § Migrations |
| Duplicate migration sequence prefixes | 93 | **92** | unchanged ✗ |
| Hardcoded secrets in source | 0 | 0 | clean ✓ |

---

## What's actually outstanding (real list, prioritized)

### High signal, low effort — RECOMMENDED to action

1. **Service-role usage audit re-frame.** The Master Audit flagged "3 files outside API layer". Today's 3 are:
   - `src/lib/supabase/service.ts` — **this IS the canonical centralized service-role client**. The Master Audit's recommendation #6 was to create it; it exists. **Not a violation.**
   - `src/instrumentation.ts` — reads the env-var *name* for Sentry/observability validation, doesn't construct a client. **Not a violation.**
   - `src/lib/ai/features/mcp.ts` — uses the key as an `authToken` for the MCP server, not for a Supabase client. **Different use case; needs a judgment call** on whether to extract a `getMcpAuthToken()` helper or accept it.

   **Action:** add ESLint `no-restricted-imports` / `no-restricted-syntax` rule to block *future* `process.env.SUPABASE_SERVICE_ROLE_KEY` access outside this allow-list of 3 files. Effort: 15 min.

2. **The 3 production `any` usages are explicitly exempted** with `eslint-disable-next-line @typescript-eslint/no-explicit-any` — the team has accepted them:
   - `src/app/api/cron/engagement-monitor/route.ts:100` — `(row: any) => mapBrandRow(row)`
   - `src/app/api/cron/content-engine/route.ts:87` — same pattern
   - `src/lib/advisory/agents.ts:246` — `judgeParams: any` for Anthropic SDK ergonomics

   **Action:** none required. If desired, extract a shared `BrandRow` type from `mapBrandRow`'s implementations (currently defined locally in each cron file — DRY violation) into `src/lib/supabase/types.ts`. Effort: 30 min, low risk. Both cron files would import the same type and drop their eslint-disable comments.

3. **Tenant isolation audit re-frame.** The Master Audit's "workspace_id" framing is **wrong for this repo** — CLAUDE.md explicitly says: *"DB queries: always `.eq('founder_id', founderId)` — NEVER workspace_id"*. This is a single-tenant founder CRM, not a multi-tenant SaaS. The 54 "unfiltered" routes need to be re-audited against `founder_id`, not `workspace_id`. Some categories (e.g. `/api/cron/*` jobs that legitimately iterate all data, `/api/health`) **shouldn't** filter at all. **Action:** classify the 54 against the founder_id rule (~2-4h); the real exposure number is likely 10-20, not 54.

### High effort, HIGH RISK — STOP at human gate

4. **Migration baseline (Master Audit recommendation #1).** 489 live migrations with 92 duplicate-prefix collisions. The 397-file `supabase/migrations_backup/` directory suggests a prior baseline attempt started but didn't complete. **Action:** Run `supabase db dump --schema public` against prod, write `000_baseline_schema.sql`, archive the 489 live files. **Must be tested in sandbox first** (per CLAUDE.md sandbox-first rule + `scripts/sandbox-wizard.sh`). Effort: 4-8h. Risk: HIGH — any `db reset` after this point depends on getting it right.

5. **Domain consolidation** (Master Audit recommendation #7). Some overlapping namespaces persist. Re-audit needed against the current 33 top-level domains (was 155). Probably much smaller scope than the Master Audit implied. Effort: 2-4h to scope, then per-domain.

### Already done, no action needed

- ~~Schema baseline~~ — partially done (`migrations_backup/` exists)
- ~~Root cleanup~~ — done
- ~~Delete test routes~~ — done
- ~~Workspace auth middleware~~ — partially done (72/126 routes have a filter; the audit framing needs re-doing)
- ~~Fix cost-monitor placeholder-key~~ — done (file removed)
- ~~Centralise admin client~~ — done (`src/lib/supabase/service.ts`)
- ~~TypeScript `any` elimination~~ — done (1,176 → 3 production, all explicitly exempted)

---

## Service-Role Usage (detailed)

Current locations of `SUPABASE_SERVICE_ROLE_KEY` in `src/` outside `src/app/api/`:

| File | Usage | Verdict |
|---|---|---|
| `src/lib/supabase/service.ts:10` | `createClient(URL, SERVICE_ROLE_KEY)` — the canonical centralized client | KEEP — this is the SSOT |
| `src/instrumentation.ts:18` | Reads `'SUPABASE_SERVICE_ROLE_KEY'` as a string for env-var validation (Sentry/observability) | KEEP — validation, not client construction |
| `src/lib/ai/features/mcp.ts:35` | `authToken: process.env.SUPABASE_SERVICE_ROLE_KEY` — MCP server auth | KEEP or extract `getMcpAuthToken()` helper for symmetry |

Proposed ESLint guard (this PR adds it):

```js
// eslint.config.cjs
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: [
    "src/lib/supabase/service.ts",
    "src/instrumentation.ts",
    "src/lib/ai/features/mcp.ts",
    "src/app/api/**/*"  // API routes legitimately use the service role
  ],
  rules: {
    "no-restricted-syntax": ["error", {
      selector: "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='SUPABASE_SERVICE_ROLE_KEY']",
      message: "SUPABASE_SERVICE_ROLE_KEY must only be accessed via src/lib/supabase/service.ts (or the three documented exception files). See REFRESHED-AUDIT-2026-05-24.md § Service-Role Usage."
    }]
  }
}
```

---

## Tenant Isolation (re-framed for single-tenant)

**This is a single-tenant founder CRM**, not a multi-tenant SaaS. The Master Audit's `workspace_id` framing was wrong. Per CLAUDE.md: `.eq('founder_id', founderId)` — always `founder_id`, never `workspace_id`.

Sample of 10 routes lacking either filter (require classification, not blind addition):

| Route | Expected behaviour | Verdict |
|---|---|---|
| `src/app/api/strategy/analyze/route.ts` | Analyse for the single founder | Should `.eq('founder_id', ...)` — add |
| `src/app/api/strategy/insights/[id]/route.ts` | Insight by id, scoped to founder | Should filter — add |
| `src/app/api/strategy/insights/[id]/comments/route.ts` | Comments on insight | Should filter — add |
| `src/app/api/research/route.ts` | Research record | Should filter — add |
| `src/app/api/health/route.ts` | Service health check | **No filter needed** — public health |
| `src/app/api/files/route.ts` | Files for the founder | Should filter — add |
| `src/app/api/cron/bookkeeper/route.ts` | Cron job — iterates all bookkeeper records | **No filter needed** — cron iterates by design |
| `src/app/api/cron/synthex-monitor/route.ts` | Cron job — synthex monitoring | **No filter needed** — cron iterates by design |
| `src/app/api/settings/update/route.ts` | Update founder settings | Should filter — add |
| `src/app/api/pipeline/run/route.ts` | Pipeline execution | Should filter — add |

Rough estimate of real exposure: ~20-30 routes need a `founder_id` filter add (not 54). Per-route work: 5-15 min. Total: ~3-6h.

**This is the largest remaining single workstream.** Recommended scoping: one PR per domain (`strategy`, `research`, `files`, `settings`, etc.) for reviewability.

---

## Migrations (regressed by 72 since Master Audit)

The Master Audit said 417 live; today is 489 (+72). Net of cleanup, more migrations have been added than archived. The 92 duplicate-prefix collisions are essentially unchanged.

| Prefix | Collisions |
|---|---|
| `020` | 14 (RLS migration churn — known) |
| `038` | 12 |
| `039` | 4 |
| `100`, `148`, `150`, `151`, `152`, `153`, `FIX` | 3 each |

`supabase/migrations_backup/` has 397 files dated 2026-05-24 — strong evidence a baseline attempt was started today but not completed. **Action: resume the baseline. Use `scripts/sandbox-wizard.sh` per CLAUDE.md (NEVER touch prod directly).**

---

## What this PR includes

1. This `REFRESHED-AUDIT-2026-05-24.md` document.
2. ESLint guard for `SUPABASE_SERVICE_ROLE_KEY` placement (Action #1 above).

## What this PR deliberately does NOT include (held for human go)

- Migration baseline (HIGH risk — sandbox first; see CLAUDE.md sandbox-first rule).
- Domain consolidation pass (needs scoping).
- Founder-id filter additions to the ~20-30 unfiltered routes (per-domain PRs preferred for reviewability).
- Shared `BrandRow` type extraction (small but touches 2 cron files — separate PR for clean diff).

---

## Recommended next sessions (estimated effort)

| # | Work | Effort | Risk |
|---|---|---|---|
| 1 | Resume migration baseline via `sandbox-wizard.sh` | 4-8h | HIGH |
| 2 | Founder-id filter audit + add (~20-30 routes, per-domain PRs) | 3-6h | LOW-MEDIUM |
| 3 | Extract shared `BrandRow` type, remove 2 cron eslint-disables | 30 min | LOW |
| 4 | Re-audit 33 top-level domains for further consolidation | 2-4h scope only | MEDIUM |

Once #1 + #2 land, the codebase clears the bar for confident production scaling.

---

*Report generated by Claude Opus 4.7 under `anthropic-skills:self-improvement-charter` rails. No prod state was modified during this audit. ESLint guard added in same PR is the only code change.*
