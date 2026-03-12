# KANBAN — Unite-Group Nexus 2.0
> Work tracking board. Updated manually or by agents at phase boundaries.
> Last updated: 12/03/2026

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

### Phase 5 — AI Layer (Partial) ✅
- [x] MACAS — Multi-Agent Competitive Accounting System (commit `65d90c25`)
  - 4 AI firms, 5 debate rounds, Judge (Opus), Accountant gate
  - Schema: `supabase/migrations/20260311000000_advisory_schema.sql`
  - Page: `/founder/advisory`
- [x] Command Bar — ⌘K/Ctrl+K palette (`src/components/layout/CommandBar.tsx`)
- [x] Unified Search — real-time across contacts, pages, approvals (`src/app/api/search/route.ts`)
- [x] Search bug fixes: AbortController, race condition, PostgREST injection sanitisation

---

## IN PROGRESS

### Phase 5 — AI Layer INTEGRATION Backlog
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

---

## TODO

### Other Active Linear Issues
- [ ] UNI-1478: WhatsApp bridge integration
- [ ] UNI-173: Invoicing module

### Phase 6 — Production Hardening ⏳
- [ ] E2E test suite (Playwright)
- [ ] Performance audit (Core Web Vitals)
- [ ] Security audit (OWASP top 10)
- [ ] Error monitoring (Sentry or Vercel)
- [ ] Rate limiting on API routes
- [ ] MACAS Phase 6: Xero journal entries + BAS updates in `/execute` route (via `xeroApiFetch()`)
- [ ] Secrets rotation procedure
- [ ] Backup and recovery runbook
- [ ] Production deployment checklist

---

## BACKLOG (Future / Unscheduled)
- [ ] Mobile responsive pass (Nexus is currently desktop-first)
- [ ] Offline support / PWA
- [ ] Social media scheduling UI (`social_channels` table populated, UI pending)
- [ ] Full `nexus_databases` / `nexus_rows` Notion-like database views
- [ ] Expanded contacts CRM features (pipeline, tags, notes)
