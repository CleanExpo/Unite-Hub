# MASTER AUDIT REPORT — Unite-Group Nexus
Date: 08/03/2026
Phase: 1 — Forensic Audit
Auditor: code-auditor agent (READ ONLY)

---

## Executive Summary

Phase 1 forensic audit of the Unite-Group Nexus codebase confirms the scale estimates: **822 API routes**, **455 migration files**, and **529 root markdown files**. The codebase is the product of 1,112+ commits of AI-driven development without a cleanup discipline — every session produced new files, new routes, and new migrations without retiring the old ones. Three critical architectural violations exist that must be resolved before any Phase 2 work begins: (1) zero workspace isolation at the query layer across all 822 routes, (2) 93 duplicate-numbered migration files that make the schema history unsafe to replay, and (3) 1,176 TypeScript `any` usages that undermine type safety at scale. No hardcoded secrets were found in source code. The recommended Phase 2 approach is a structured consolidation: clean the root, baseline the schema, implement workspace auth middleware, then resume feature work on a stable foundation.

---

## Scale Statistics

| Metric | Count | Disposition |
|--------|-------|-------------|
| API route files (`route.ts`) | 822 | Keep ~520; consolidate ~250; delete ≥49 (test/stubs) |
| Top-level API domains | 155 | Reduce to ≤40 via domain taxonomy |
| Migration files (live) | 417 | Consolidate to 1 baseline + future incremental |
| Migration files (archived) | 38 | Archive permanently — do not replay |
| Duplicate migration prefixes (excess files) | 93 | Remove after baseline extraction |
| Root markdown files | 529 | Keep 5 (genuine docs); archive 519; delete 5 (malformed) |
| Loose SQL files (root) | 0 | Clean |
| TypeScript `any` usages | 1,176 | Eliminate systematically |
| Hardcoded secrets | 0 | Clean |
| Service role key outside API layer | 3 files | Fix immediately |

---

## Critical Findings (must address before Phase 2)

| Severity | Finding | Location | Blocking? |
|----------|---------|----------|-----------|
| CRITICAL | Zero `workspace_id` query-layer isolation — all 822 routes rely solely on RLS | All `src/app/api/**` | Yes — data integrity risk |
| CRITICAL | 93 duplicate migration sequence numbers — schema history cannot be safely replayed | `supabase/migrations/` | Yes — any `db reset` will produce unpredictable state |
| CRITICAL | `'placeholder-key'` fallback for `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/ai/cost-monitor.ts:14` | Yes — masks misconfiguration silently |
| CRITICAL | 5 test route domains live in production API namespace | `src/app/api/test*/` | Yes — must not ship to production |
| HIGH | 1,176 TypeScript `any` usages — type safety systematically bypassed | `src/` directory | Yes — refactoring is dangerous without type safety |
| HIGH | `supabaseAdmin` / service role key accessed in 3 lib files outside API layer | `src/lib/agents/`, `src/lib/creative/`, `src/lib/ai/` | Yes — potential client bundle leakage |
| HIGH | 529 root markdown files — 524 are AI session artefacts committed to git | Repo root | Yes — pollutes git history; cognitive overhead for all contributors |
| HIGH | `103` founder domain routes across 3 overlapping namespaces (122 total) | `src/app/api/founder*/` | No — but blocks any domain comprehension |
| HIGH | Three competing auth patterns — no standard middleware | All routes | No — but makes auditing impossible |

---

## Domain Hotspots

| Domain Cluster | Route Count | Issue |
|---------------|-------------|-------|
| `founder` + `founder-os` + `founder-intel` | 122 | 3 overlapping namespaces — merge required |
| `email` + `email-intel` + `emails` | 18 | 3 namespaces for one feature |
| `client` + `clients` + `client-agent` + `client-approvals` | 19 | 4 namespaces for one feature |
| `seo` + `seo-enhancement` + `seo-leak` | 21 | 3 namespaces for one feature |
| `agent` + `agents` + `agent-mandates` | 9 | 3 namespaces for one feature |
| Single-route domains (stubs) | 44 domains | Each has 1 route — likely abandoned |
| Test domains | 5 domains | `test`, `test-sentry`, `test-rate-limit`, `test-questionnaire`, `test-opus-4-5` |

---

## Migration Health

| Issue | Count | Risk |
|-------|-------|------|
| Live migrations with duplicate sequence numbers | 93 excess files | Schema replay is undefined |
| Archived NUCLEAR_RESET / FORCE_CLEAN scripts | 2 | Evidence of past instability |
| RLS migration variants (same prefix `020`) | 14 in archive | RLS was never stabilised |
| Missing sequence numbers (016, 017, 018) | 3 | History is incomplete |
| Migrations with test/debug names in live history | 2 (`TEST_ONE_POLICY`, `CREATE_FUNCTIONS_ONLY`) | Experimental SQL in permanent history |

---

## Security Posture

| Check | Status |
|-------|--------|
| Hardcoded API keys | CLEAN |
| Hardcoded passwords | CLEAN |
| Committed `.env` values | CLEAN |
| Raw JWT tokens in source | CLEAN (2 false positives confirmed) |
| `workspace_id` query isolation | CRITICAL FAILURE — 0/822 routes |
| Admin key outside API layer | 3 violations |
| Test routes in production namespace | 5 violations |
| Cron route secret validation | Not confirmed present |
| Webhook signature validation | Not confirmed present |

---

## Architecture Compliance

| Rule (from CLAUDE.md) | Status | Violation Count |
|-----------------------|--------|-----------------|
| All queries must filter by `workspace_id` | VIOLATED | 822 routes |
| TypeScript strict — no `any` | VIOLATED | 1,176 usages |
| Admin client only in API layer | VIOLATED | 3 lib files |
| Single auth pattern | VIOLATED | 3 competing patterns |
| Workspace isolation in Server Components | Not verified (Phase 2) |

---

## Phase 2 Recommendations

1. **Schema baseline** — Run `supabase db dump --schema public` on the live instance; write `000_baseline_schema.sql`; archive the 417 live migrations; enforce timestamp-based naming going forward. This is the single highest-priority action.

2. **Root cleanup** — Run `git rm` on all root `*.md` files except README, CHANGELOG, CLAUDE.md, ARCHITECTURE.md, and SPEC.md. Delete the 5 malformed `d:Unite-Hub*.md` files. Add `.gitignore` patterns to prevent recurrence.

3. **Delete test routes** — Remove `src/app/api/test/`, `src/app/api/test-sentry/`, `src/app/api/test-rate-limit/`, `src/app/api/test-questionnaire/`, `src/app/api/test-opus-4-5/` immediately.

4. **Workspace auth middleware** — Implement `withWorkspaceAuth(handler)` in `src/lib/middleware/workspace-auth.ts`. This middleware must: authenticate the user, extract their `workspace_id`, and pass it to the handler. Migrate all routes in order: `contacts` → `campaigns` → `email` → `admin` → remaining domains.

5. **Fix `cost-monitor.ts` placeholder key** — Remove `|| 'placeholder-key'` from `src/lib/ai/cost-monitor.ts:14`. This is a one-line fix with zero risk.

6. **Centralise admin client** — Create `src/lib/supabase/admin.ts` as the sole export point. Add ESLint `no-restricted-imports` rule to block direct `process.env.SUPABASE_SERVICE_ROLE_KEY` access outside this file.

7. **Domain taxonomy** — Define a formal API domain taxonomy (e.g. core CRM, AI, integrations, admin, internal) and audit the 44 single-route domains for live usage. Consolidate overlapping namespaces (`founder*/`, `email*/`, `agent*/`, `client*/`).

8. **TypeScript hardening** — Enable `@typescript-eslint/no-explicit-any: error` in ESLint config. Work through the 1,176 `any` usages starting with shared types and API route handlers.

---

## Audit Reports Index

| Report | Location | Status |
|--------|----------|--------|
| API Routes Inventory | `.claude/audits/api-routes-inventory.md` | Complete |
| Migration Audit | `.claude/audits/migrations-audit.md` | Complete |
| Root Files Audit | `.claude/audits/root-files-audit.md` | Complete |
| Security Scan | `.claude/audits/security-scan.md` | Complete |
| Architecture Compliance | `.claude/audits/architecture-compliance.md` | Complete |
| Dead Code Report | `.claude/audits/dead-code-report.md` | Deferred to Phase 2 (requires live build) |
| Bundle Analysis | `.claude/audits/bundle-analysis.md` | Deferred to Phase 2 (requires `pnpm build`) |
| Linear Verification | `.claude/audits/linear-verification.md` | Deferred to Phase 2 (requires Linear API access) |

---

## Effort Estimate for Phase 2 Remediation

| Task | Estimated Effort | Risk |
|------|-----------------|------|
| Schema baseline + migration cleanup | 4–8 hours | HIGH — test in staging first |
| Root file cleanup (git rm + .gitignore) | 1–2 hours | LOW |
| Delete test routes | 30 minutes | LOW |
| Fix `placeholder-key` in cost-monitor | 5 minutes | LOW |
| Centralise admin client + ESLint rule | 2–3 hours | LOW |
| Workspace auth middleware | 4–6 hours | HIGH — touches all 822 routes |
| Domain consolidation (founder, email, agent, client) | 8–16 hours | MEDIUM |
| TypeScript `any` elimination | 16–32 hours | MEDIUM |

**Total Phase 2 remediation estimate**: 35–68 hours of focused engineering work.

---

*Report generated by code-auditor agent — READ ONLY. No files were modified during this audit.*
*Next action: Human review of this report, then authorise Phase 2 execution.*
