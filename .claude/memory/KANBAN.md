# KANBAN — Unite-Group Nexus 2.0
> Work tracking board. Updated manually or by agents at phase boundaries.
> Last updated: 24/03/2026

---

## DONE

### Phase 1 — Forensic Audit ✅
- [x] Full codebase audit (822 routes, 455 migrations, 529 .md artefacts)
- [x] MASTER-AUDIT-REPORT.md written
- [x] Decision made: Full rebuild (Option A)

### Phase 2 — Clean Foundation ✅
- [x] New `rebuild/nexus-2.0` branch created (later merged to main)
- [x] 524 root .md AI artefacts deleted
- [x] 455 v1 migrations archived
- [x] 5 test route directories removed
- [x] Placeholder API key fix (`src/lib/ai/cost-monitor.ts`)
- [x] Clean 9-table schema created with RLS
- [x] `/api/health` endpoint
- [x] GitHub Actions CI workflow
- [x] `.env.example` updated

### Phase 3 — Core UI Shell ✅
- [x] Design tokens in `src/app/globals.css`
- [x] `src/lib/businesses.ts` — 7 businesses config
- [x] `src/lib/store.ts` — Zustand UI store
- [x] `src/app/(founder)/layout.tsx` — shared layout
- [x] Sidebar (`Sidebar.tsx`, `SidebarItem.tsx`, `BusinessTree.tsx`)
- [x] Topbar (`Topbar.tsx`)
- [x] Dashboard KPI cards
- [x] Kanban board (dnd-kit)
- [x] Vault (VaultLock, VaultEntry, VaultGrid)
- [x] Approvals queue (Framer Motion)
- [x] Block editor (Novel 1.0.2)
- [x] All 12 tasks passing, pushed to remote

### Phase 4 — Integration Layer ✅
- [x] Xero OAuth2 integration
- [x] Gmail integration
- [x] Google Calendar integration
- [x] Linear API integration
- [x] Stripe integration
- [x] bookkeeper_runs, bookkeeper_transactions, xero_connections tables

### Phase 5 — AI Layer ✅
- [x] MACAS — Multi-Agent Competitive Accounting System (commit `65d90c25`)
  - 4 AI firms, 5 debate rounds, Judge (Opus), Accountant gate
  - Schema: `supabase/migrations/20260311000000_advisory_schema.sql`
  - Page: `/founder/advisory`
- [x] Command Bar — ⌘K/Ctrl+K palette (`src/components/layout/CommandBar.tsx`)
- [x] Unified Search — real-time across contacts, pages, approvals (`src/app/api/search/route.ts`)
- [x] Search bug fixes: AbortController, race condition, PostgREST injection sanitisation

### Phase 6 — Production Hardening ✅ (25/03/2026)
- [x] E2E test suite (Playwright) — confirmed complete
- [x] Error monitoring (Sentry) — confirmed complete
- [x] Social UI — confirmed complete
- [x] Rate limiting on API routes — `src/lib/middleware/rate-limit.ts` (sliding window, tiered)
- [x] Secrets rotation runbook — `.claude/runbooks/secrets-rotation.md`
- [x] CCW marked as `type: 'client'` in `src/lib/businesses.ts`
- [x] **6.2** Lighthouse baseline — `.claude/audits/lighthouse-baseline-25-03-2026.md` (Perf 92, A11y 91, BP 93, SEO 92)
- [x] **6.2** Performance fixes — removed duplicate Google Fonts `@import` (`globals.css`), added `display:"swap"` to Inter, `htmlFor` labels on login form, footer contrast `white/30→white/50`, `robots.txt` updated for `unite-group.in`

### Phase 7 — Hub Connectivity ✅ (24/03/2026)

#### Sprint 7.1: MACAS Auto-Trigger from Bookkeeper Run ✅
- [x] Migration: `advisory_cases.source` column (`20260324000000`)
- [x] Data readiness gate — `src/lib/advisory/readiness-gate.ts`
- [x] `src/lib/advisory/auto-trigger.ts` — auto case creation
- [x] Wire bookkeeper trigger + cron → auto-create MACAS cases
- [x] Auto-triggered badge in advisory cases UI (`CaseCard.tsx`)
- [x] Tests: `readiness-gate.test.ts` + `auto-trigger.test.ts`

#### Sprint 7.2: Connected Projects API + Hub Dashboard Widget ✅
- [x] Migration: `hub_satellites` table (`20260324000001`)
- [x] `src/app/api/connected-projects/route.ts` (GET + POST/upsert)
- [x] `src/app/api/connected-projects/[id]/route.ts` (PATCH)
- [x] `src/components/founder/dashboard/HubStatusWidget.tsx`
- [x] HubStatusWidget added to dashboard page (above CoachBriefs)

#### Sprint 7.3: Nightly Intelligence Sweep Cron ✅
- [x] `src/lib/integrations/github.ts` — `fetchLastCommit`, `parseRepoUrl` added
- [x] `src/app/api/cron/hub-sweep/route.ts` — nightly sweep (11pm AEST)
- [x] `vercel.json` — `"0 13 * * *"` cron entry + `maxDuration: 60`
- [x] Tests: `hub-sweep/route.test.ts`

---

## IN PROGRESS

*(nothing — Phase 6 and 7 both closed)*

---

## TODO

### Phase 6 — Deferred Backlog
- [ ] MACAS Phase 6: Xero journal entries + BAS updates in `/execute` route (via `xeroApiFetch()`)
- [ ] Backup and recovery runbook
- [ ] Production deployment checklist

### Phase 8 — AI Integration Depth (after Phase 7 complete)
> UNI-1499–1510. Sequence: Structured Outputs → AI Router → Batch API → Memory Tool → Adaptive Thinking.

- [ ] UNI-1499: Enable Adaptive Thinking on Claude Opus 4.6
- [ ] UNI-1500: Implement MCP Connector Layer
- [ ] UNI-1501: Implement Files API for Persistent Document Storage
- [ ] UNI-1502: Implement Memory Tool for Cross-Session Persistence
- [ ] UNI-1503: Enable Web Search and Web Fetch Server-Side Tools
- [ ] UNI-1504: Enable Batch API for Cost Optimisation
- [ ] UNI-1505: Enable Citations for Verifiable Agent Outputs
- [ ] UNI-1506: Enable Structured Outputs for Type-Safe Agent Communication
- [ ] UNI-1507: Enable Code Execution Sandbox
- [ ] UNI-1508: Build AI Orchestration Router
- [ ] UNI-1509: Build AI Pipeline Coordinator
- [ ] UNI-1510: Build Macro Coaches

### Other Active Linear Issues
- [ ] UNI-1478: WhatsApp bridge integration (backlog — after Phase 7)
- [ ] UNI-173: Invoicing module (backlog — after Phase 7)

---

## BACKLOG (Future / Unscheduled)
- [ ] Mobile responsive pass (Nexus is currently desktop-first)
- [ ] Offline support / PWA
- [ ] Full `nexus_databases` / `nexus_rows` Notion-like database views
- [ ] Expanded contacts CRM features (pipeline, tags, notes)
