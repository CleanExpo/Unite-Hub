# Production Build Ledger — Unite-Hub → /shipit

> **Purpose**: Persistent, honest source of truth for the section-by-section production build.
> Survives across turns/sessions. Update status as sections move RED→AMBER→GREEN.
> **Started**: 2026-05-29 | **Mode**: BUILD/MIGRATE swarm | **Locale**: en-AU
> **Honesty rule**: A section is GREEN only with PROOF (real data + auth + scope + loading/error + verify pass). 200 ≠ real.

---

## The one hard blocker to /shipit
Production Vercel project does **not exist** — `PORTFOLIO.yaml` → `unite-hub` production `project_id: TBD, project_name: TBD`. Only `unite-hub-sandbox` exists. Repo not linked locally (`.vercel/project.json` absent). **Human/infra step**, teed up at the end. Everything else is autonomous.

---

## Section status map (from recon swarm, 2026-05-29)

### RED — CORRECTED 2026-05-29 (recon over-classified: it only read page.tsx, missed client-component fetches)
**Re-verification proved 7 of 8 "facades" are actually WIRED to real APIs. Only 1 is a genuine facade.**
| Page | Real state (verified) |
|------|-----------------------|
| `/founder/advisory` | ✅ WIRED — 5 tabs fetch `/api/advisory/cases` |
| `/founder/boardroom` | ✅ WIRED — fetches `/api/boardroom/meetings` |
| `/founder/bookkeeper` | ✅ WIRED — every tab hits `/api/bookkeeper/*` or `/api/xero/invoices` |
| `/founder/strategy` | ✅ WIRED — fetches `/api/strategy/analyze`, `/api/pipeline/run` |
| `/founder/analytics` | ✅ WIRED — fetches `/api/analytics` |
| `/founder/kanban` | ✅ WIRED — fetches `/api/linear/issues` |
| `/founder/skills` | ✅ WIRED — fetches `/api/skills/health` |
| `/founder/approvals` | ❌ **GENUINE FACADE** — hardcoded `INITIAL_QUEUE` fake data, no fetch, no `/api/approvals` route, no live `approvals` table (only stale multi-tenant cruft in migrations_backup). FIXED to honest empty-state; backend is BACKLOG. |

**BACKLOG (product decision needed): Approvals vertical.** Needs: founder-scoped `approvals` table + RLS, `/api/approvals` (GET/POST approve-reject), and a decision on what feeds the queue (likely pending social-publisher/content-engine AI actions awaiting human sign-off). Do NOT build the schema blind.

**Lesson logged:** page→API audits MUST trace into client components and their tab children, not just page.tsx. Updated approach for future recon.

### AMBER — CORRECTED 2026-05-29 (Wave 3 verification)
| Item | Real state (verified) |
|------|-----------------------|
| `dashboard/kpi` | ✅ route surfaces `source: 'xero'\|'mock'` in response shape (BatchKPIEntry.source). Honest at API layer. |
| `xero/revenue`, `xero/client.ts` | ✅ proper `{ data, source: 'xero'\|'mock' }` discriminator. The reference-correct pattern. |
| `linear/kpi` | ✅ returns `{ activeCount, configured: false }` honestly when LINEAR_API_KEY unset. Linear is a single global key (no founder scope needed — single-tenant). Minor: conflates fetch-error with not-configured (both → configured:false). |
| `dashboard/stats` | ✅ FULLY REAL — founder-scoped Supabase counts, fails loud (500) on error. References live `approval_queue` + `advisory_cases` tables. |
| `gmail.ts`, `calendar.ts` | ✅ FIXED Wave 3 — were silent mock with NO discriminator. Now return `{ data, source: 'gmail'\|'google'\|'not_connected' }`; calendar page shows explicit "not connected" banner. getMock* kept for tests/life-coach AI context only. |
| `campaigns/[id]`, `campaigns/new`, `experiments/[id]`, `[businessKey]/page/[id]`, `[businessKey]/page/new` | ✅ FIXED Wave 1 — loading.tsx + error.tsx added. |

### Lucide debt — HONEST CORRECTION 2026-05-29
Wave 1 was logged as "Lucide removal complete". **FALSE.** Only 3 page.tsx files were swept. **41 component files still `import ... from 'lucide-react'`** (grep-verified): all of vault/, boardroom/, strategy/, experiments/, most layout/ + dashboard/ (incl. FounderStats.tsx), advisory CasesTab, etc. This is a **design-standard violation (rule: custom SVG only), NOT a functional /shipit blocker** — Lucide renders fine. Tracked as its own dedicated sweep wave; NOT blind-swept tonight (41-file change = high visual blast-radius, violates surgical-change discipline right before ship). Decide deliberately, not reflexively.

### Approvals — CORRECTION 2026-05-29
`approval_queue` table DOES exist (dashboard/stats counts `status='pending'` rows from it, founder-scoped). Earlier ledger note "no live approvals table" was wrong. What's missing is the `/api/approvals` route (GET queue / POST approve-reject) + UI wiring. ApprovalQueue.tsx fixed to honest empty-state Wave 2. Wiring it to `approval_queue` is a real, scoped backlog item now (table exists) — but still needs the product decision on what *populates* the queue (pending AI actions).

### GREEN — verified real (spot-check before trusting)
dashboard (page), campaigns, experiments, contacts, invoices, settings, vault, social, notes, email, calendar, xero (page), `[businessKey]`, health, auth.

### Cron pull gaps — sections with NO scheduled sync (stale-data risk)
- **contacts** — no external sync
- **pipeline** — no deal-stage refresh
- **campaign ad-metrics** — only organic social pulled; no paid-ads (FB/Google/LinkedIn) spend/ROI
- **research** — no external research/competitor pull
- **ideas** — no ingestion cron
22 existing crons all have working handlers + auth (4 skip FOUNDER_USER_ID legitimately; `synthex-monitor` maxDuration=30s is low).

### False-green CI — FIXED Wave 3 (2026-05-29)
- `security.yml`: ✅ phantom `snyk-backend` (apps/backend Python) deleted; `snyk-frontend`→`snyk` now gated on `secrets.SNYK_TOKEN != ''` (honest skip, not silent-skip-on-unset-var) and scans root package.json; `npm-audit` gate now runs `pnpm audit --audit-level=critical --prod` with **no `|| true`** — a critical advisory now fails the job; security-summary reports real job results instead of unconditional `[PASS]`. Green tick now means "no critical prod npm advisories".

---

## Skill gaps (build the ones used immediately; backlog the rest)
**Built this op:** `mock-vs-real-detector` (P2), `section-finaliser` (P2), `cron-pull-template` (P3).
**Backlog:** regression-guard (P1), rls-coverage-audit (P2), migration-safety (P2), api-route-hardening (P2), integration-oauth-wiring (P3), pull-sync-reconciler (P3), cron-health-monitor (P2).
**Index fixes:** add `rate-limiter` to P2; resolve `scientific-luxury` vs `scientific-luxury-design` duplicate; document P1 skills live in `.claude/skills/custom/`.

---

## Wave plan
- **Wave 1 (mechanical, zero-merge-risk):** loading/error boundary files + Lucide→SVG. ✅/⏳
- **Wave 2 (facade wiring):** RED pages → existing APIs, one section per agent.
- **Wave 3 (false-green kill):** mock-vs-real surfacing + security.yml repair.
- **Wave 4 (cron pulls):** contacts/pipeline/research/ideas/ad-metrics sync crons.
- **Deep verify loop:** type-check + lint + test + build after every wave until stable.
- **/shipit prep:** prod Vercel project + 7 critical env vars (human-gated).

## Verification command (the "100x" loop)
```
pnpm run type-check && pnpm run lint && pnpm run test && pnpm build
```
Run after every section change. A section is not done until this passes AND its page shows real data.
