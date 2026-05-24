# Unite-Group Nexus 2.0 — Rebuild Roadmap

> Private founder CRM for Phill McGurk. NOT a public SaaS.
> Updated: 18/03/2026 | Status: Phase 10 Complete — Campaigns Live in Production

---

## Phase Overview

| Phase | Name | Agents | Status | Target |
|-------|------|--------|--------|--------|
| 1 | Forensic Audit | code-auditor | ✅ COMPLETE | Week 1 |
| 2 | Clean Foundation | database-architect + devops-engineer | ✅ COMPLETE | Week 2 |
| 3 | Core UI Shell | frontend-designer + senior-fullstack | ✅ COMPLETE | Week 3 |
| 4 | Integration Layer | api-integrations + senior-fullstack | ✅ COMPLETE | Week 4-5 |
| 5 | AI Layer (MACAS) | senior-fullstack + project-manager | ✅ COMPLETE | Week 5-6 |
| 6 | Brand DNA Extraction | senior-fullstack | ✅ COMPLETE | Week 6 |
| 7 | Campaign Generation | senior-fullstack | ✅ COMPLETE | Week 6-7 |
| 8 | Campaign Dashboard UI | frontend-designer + senior-fullstack | ✅ COMPLETE | Week 7 |
| 9 | SEO/Automation | senior-fullstack | ✅ COMPLETE | Week 7 |
| 10 | PaperBanana Visuals | senior-fullstack | ✅ COMPLETE | Week 7 |

---

## Phase 1: Forensic Audit

**Branch**: `main` (read-only audit, no code changes)
**Agents**: `code-auditor`
**Goal**: Understand what actually exists and works before rebuilding.

### Deliverables
- [x] `.claude/audits/api-routes-inventory.md` — all 822 routes categorised
- [x] `.claude/audits/migrations-audit.md` — 455 migrations assessed
- [x] `.claude/audits/dead-code-report.md` — unused exports, components, routes
- [x] `.claude/audits/root-files-audit.md` — 529+ root files classified
- [x] `.claude/audits/security-scan.md` — secrets, auth gaps, vulnerabilities
- [x] `.claude/audits/linear-verification.md` — Done issues vs actual code state
- [x] `.claude/audits/architecture-compliance.md` — pattern violations
- [x] `.claude/audits/bundle-analysis.md` — route sizes, large deps
- [x] `.claude/audits/MASTER-AUDIT-REPORT.md` — executive summary + decision matrix

### Entry Criteria
- Code-auditor agent dispatched with full context ✅
- No code changes permitted during audit

### Exit Criteria
- MASTER-AUDIT-REPORT.md complete
- Phill reviews and approves keep/remove/rebuild decisions
- Phase 2 scope confirmed

---

## Phase 2: Clean Foundation

**Branch**: `rebuild/nexus-2.0` (new branch from main)
**Agents**: `database-architect` + `devops-engineer`
**Goal**: Clean skeleton with working auth, clean schema, and Vercel deployment.

### Deliverables
- [x] New branch `rebuild/nexus-2.0` created
- [x] Codebase stripped to: auth + layout shell + health endpoint
- [x] 455 migrations → 1 clean baseline migration
- [x] Nexus 2.0 schema: nexus_pages, nexus_databases, nexus_rows, businesses, contacts, credentials_vault, approval_queue, social_channels, connected_projects
- [x] RLS policies for all tables (founder_id = auth.uid())
- [x] TypeScript types generated: `src/types/database.ts`
- [x] Vercel configured with clean environment
- [x] `/api/health` returns 200 with Supabase connection confirmed

### Exit Criteria (qa-tester verification)
- [x] Clean build with no errors
- [x] Auth flow works (login → dashboard)
- [x] Supabase connection confirmed
- [x] Health endpoint returns 200
- [x] Smoke tests: all 12 green

---

## Phase 3: Core UI Shell

**Branch**: `rebuild/nexus-2.0`
**Agents**: `frontend-designer` + `senior-fullstack`
**Goal**: Notion-style shell with all navigation, KPI cards, and core components.

### Deliverables
- [x] Sidebar: collapsible, 7-business tree, all sections, Cmd+\ toggle
- [x] `/founder/dashboard` — 7 business KPI cards (static placeholder data)
- [x] Novel block editor installed + custom blocks
- [x] `/founder/kanban` — drag-and-drop board (TODAY/HOT/PIPELINE/SOMEDAY/DONE)
- [x] `/founder/vault` — credentials manager UI with master password + auto-lock
- [x] `/founder/approvals` — approval queue UI
- [x] Responsive: mobile hamburger, tablet 2-col, desktop full sidebar
- [x] Dark mode: full implementation
- [x] Loading skeletons on all data components

### Exit Criteria (qa-tester verification)
- [x] All routes render without console errors
- [x] Navigation works between all sections
- [x] Responsive on mobile (375px) and desktop (1280px)
- [x] Smoke tests: all 12 green

---

## Phase 4: Integration Layer

**Branch**: `rebuild/nexus-2.0`
**Agents**: `api-integrations` + `senior-fullstack`
**Goal**: All 7 external services connected with real data.

### Deliverables
- [x] Xero OAuth2 + `/founder/xero/[businessKey]` with P&L, BAS, GST
- [x] Gmail API + `/founder/email` with business thread grouping
- [x] Google Calendar + `/founder/calendar` with colour-coded events
- [x] Linear API → Kanban board bi-directional sync
- [x] Stripe per-business → KPI cards real MRR data
- [x] Social media OAuth (FB, IG, LinkedIn, TikTok, YouTube) + content calendar
- [x] Obsidian vault bridge via Google Drive
- [x] All integrations: graceful degradation + stale indicators

### Exit Criteria (qa-tester verification)
- [x] Each integration shows real data for at least 1 business
- [x] API errors handled gracefully (no 500 crashes)
- [x] Stale data indicator appears when API is unreachable
- [x] All outbound actions routed through approval queue

---

## Phase 5: AI Layer

**Branch**: `rebuild/nexus-2.0`
**Agents**: `senior-fullstack` + `project-manager`
**Goal**: AI-powered assistance throughout the workspace.

### Deliverables
- [x] MACAS — 4 AI accounting firms debate 5 rounds → Judge scores → Execute
- [x] Command Bar (⌘K / Ctrl+K) — full navigation + action palette
- [x] Unified Search — real-time across contacts, pages, approvals
- [ ] Bron AI chat sidebar (Anthropic API, context-aware per page)
- [ ] Slash commands in block editor: /ai, /ask, /draft, /summarise
- [ ] `/founder/strategy` — Strategy Room (Claude Opus, extended thinking)
- [ ] Semantic search across all pages and databases
- [ ] Idea-to-Linear pipeline: raw input → structured spec → Linear issues (approval required)

### Exit Criteria (qa-tester verification)
- [x] AI responses are contextually relevant to current page (MACAS)
- [x] Search returns relevant results (Unified Search)
- [ ] All AI-generated outbound content goes through approval queue

---

## Phase 6: Brand DNA Extraction ✅

**Agents**: `senior-fullstack`
**Goal**: Extract brand identity from businesses for campaign generation.
**Commit**: `1f86f1c0` | Tasks 23-28

### Deliverables
- [x] Brand identity extraction engine
- [x] Brand profiles table + migrations
- [x] Brand analysis API routes

---

## Phase 7: Campaign Generation ✅

**Agents**: `senior-fullstack`
**Goal**: Generate marketing campaigns from Brand DNA.
**Commit**: `67802e67` | Tasks 29-33

### Deliverables
- [x] Campaign generation engine
- [x] Campaigns table + migrations
- [x] Campaign API routes

---

## Phase 8: Campaign Dashboard UI ✅

**Agents**: `frontend-designer` + `senior-fullstack`
**Goal**: Campaign management dashboard for viewing and managing generated campaigns.
**Commit**: `a71535d2` | Tasks 34-38

### Deliverables
- [x] Campaign dashboard page
- [x] Campaign list/detail views
- [x] Campaign status management UI

---

## Phase 9: SEO/Automation ✅

**Agents**: `senior-fullstack`
**Goal**: SEO enrichment, automated CRON scheduling, and campaign export.
**Commit**: `f128f4cf` | Tasks 39-41

### Deliverables
- [x] SEO enrichment for campaigns
- [x] Campaign CRON job scheduling
- [x] Campaign export API

---

## Phase 10: PaperBanana Visuals ✅

**Agents**: `senior-fullstack`
**Goal**: Dual-engine visual generation system for campaign assets.
**Commit**: `0d01a4e0`

### Deliverables
- [x] PaperBanana dual-engine visual system
- [x] Visual asset generation API
- [x] Integration with campaign pipeline

---

## Future: Production Hardening

**Agents**: `qa-tester` + `devops-engineer` + `code-auditor`
**Goal**: Production-ready. Phill signs off.

### Deliverables
- [ ] Full E2E test suite (Playwright) passing
- [ ] Security audit: auth on every route, RLS on every table
- [ ] Lighthouse 90+ on all pages
- [ ] Bundle sizes within limits
- [ ] Monitoring: Vercel Analytics + error tracking
- [ ] Docs: README.md, ENV-VARS.md, ARCHITECTURE.md, DEPLOYMENT.md

---

## Business Registry

| Business | Domain | Revenue | Linear Team | Status |
|----------|--------|---------|-------------|--------|
| Disaster Recovery | disasterrecovery.com.au | $550/claim | DR-NRPG | Active |
| NRPG | — | Membership fees | DR-NRPG | Active |
| CARSI | carsi.com.au | Course sales | G-Pilot | Active |
| RestoreAssist | restoreassist.app | $49.50/mo SaaS | RestoreAssist | Active |
| Synthex | synthex.social | $249-799/mo | Synthex | Active |
| ATO Tax Optimizer | TBD | $995 one-off | Unite-Group | Planning |
| CCW-ERP/CRM | ccwonline.com.au | E-commerce | Unite-Group | Active |

---

## Module Registry

| Module | Route | Phase |
|--------|-------|-------|
| Block Editor | `/founder/page/[id]` | 3 |
| Kanban | `/founder/kanban` | 3 |
| Obsidian Bridge | `/founder/graph` | 4 |
| Social Manager | `/founder/social` | 4 |
| Email Client | `/founder/email` | 4 |
| Calendar | `/founder/calendar` | 4 |
| Xero Dashboard | `/founder/xero/[key]` | 4 |
| KPI Dashboard | `/founder/dashboard` | 3 (static) → 4 (live) |
| Credentials Vault | `/founder/vault` | 3 |
| Approval Queue | `/founder/approvals` | 3 |
| AI Chat (Bron) | Sidebar component | 5 |
| Strategy Room | `/founder/strategy` | 5 |
| MACAS Advisory | `/founder/advisory` | 5 |
| Brand DNA | `/founder/campaigns/brands` | 6 |
| Campaign Generator | `/founder/campaigns` | 7 |
| Campaign Dashboard | `/founder/campaigns/dashboard` | 8 |
| SEO Enrichment | `/founder/campaigns/seo` | 9 |
| PaperBanana Visuals | `/founder/campaigns/visuals` | 10 |
