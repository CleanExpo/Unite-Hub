# Unite-Group Nexus 2.0 — Rebuild Roadmap

> Private founder CRM for Phill McGurk. NOT a public SaaS.
> Updated: 08/03/2026 | Status: Phase 1 — Forensic Audit

---

## Phase Overview

| Phase | Name | Agents | Status | Target |
|-------|------|--------|--------|--------|
| 1 | Forensic Audit | code-auditor | 🔄 IN PROGRESS | Week 1 |
| 2 | Clean Foundation | database-architect + devops-engineer | ⏳ Pending | Week 2 |
| 3 | Core UI Shell | frontend-designer + senior-fullstack | ⏳ Pending | Week 3 |
| 4 | Integration Layer | api-integrations + senior-fullstack | ⏳ Pending | Week 4-5 |
| 5 | AI Layer | senior-fullstack + project-manager | ⏳ Pending | Week 5-6 |
| 6 | Production Hardening | qa-tester + devops-engineer + code-auditor | ⏳ Pending | Week 6-7 |

---

## Phase 1: Forensic Audit

**Branch**: `main` (read-only audit, no code changes)
**Agents**: `code-auditor`
**Goal**: Understand what actually exists and works before rebuilding.

### Deliverables
- [ ] `.claude/audits/api-routes-inventory.md` — all 822 routes categorised
- [ ] `.claude/audits/migrations-audit.md` — 455 migrations assessed
- [ ] `.claude/audits/dead-code-report.md` — unused exports, components, routes
- [ ] `.claude/audits/root-files-audit.md` — 529+ root files classified
- [ ] `.claude/audits/security-scan.md` — secrets, auth gaps, vulnerabilities
- [ ] `.claude/audits/linear-verification.md` — Done issues vs actual code state
- [ ] `.claude/audits/architecture-compliance.md` — pattern violations
- [ ] `.claude/audits/bundle-analysis.md` — route sizes, large deps
- [ ] `.claude/audits/MASTER-AUDIT-REPORT.md` — executive summary + decision matrix

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
- [ ] New branch `rebuild/nexus-2.0` created
- [ ] Codebase stripped to: auth + layout shell + health endpoint
- [ ] 455 migrations → 1 clean baseline migration
- [ ] Nexus 2.0 schema: nexus_pages, nexus_databases, nexus_rows, businesses, contacts, credentials_vault, approval_queue, social_channels, connected_projects
- [ ] RLS policies for all tables (founder_id = auth.uid())
- [ ] TypeScript types generated: `src/types/database.ts`
- [ ] Vercel configured with clean environment
- [ ] `/api/health` returns 200 with Supabase connection confirmed

### Exit Criteria (qa-tester verification)
- [ ] Clean build with no errors
- [ ] Auth flow works (login → dashboard)
- [ ] Supabase connection confirmed
- [ ] Health endpoint returns 200
- [ ] Smoke tests: all 12 green

---

## Phase 3: Core UI Shell

**Branch**: `rebuild/nexus-2.0`
**Agents**: `frontend-designer` + `senior-fullstack`
**Goal**: Notion-style shell with all navigation, KPI cards, and core components.

### Deliverables
- [ ] Sidebar: collapsible, 7-business tree, all sections, Cmd+\ toggle
- [ ] `/founder/dashboard` — 7 business KPI cards (static placeholder data)
- [ ] Novel block editor installed + custom blocks
- [ ] `/founder/kanban` — drag-and-drop board (TODAY/HOT/PIPELINE/SOMEDAY/DONE)
- [ ] `/founder/vault` — credentials manager UI with master password + auto-lock
- [ ] `/founder/approvals` — approval queue UI
- [ ] Responsive: mobile hamburger, tablet 2-col, desktop full sidebar
- [ ] Dark mode: full implementation
- [ ] Loading skeletons on all data components

### Exit Criteria (qa-tester verification)
- [ ] All routes render without console errors
- [ ] Navigation works between all sections
- [ ] Responsive on mobile (375px) and desktop (1280px)
- [ ] Smoke tests: all 12 green

---

## Phase 4: Integration Layer

**Branch**: `rebuild/nexus-2.0`
**Agents**: `api-integrations` + `senior-fullstack`
**Goal**: All 7 external services connected with real data.

### Deliverables
- [ ] Xero OAuth2 + `/founder/xero/[businessKey]` with P&L, BAS, GST
- [ ] Gmail API + `/founder/email` with business thread grouping
- [ ] Google Calendar + `/founder/calendar` with colour-coded events
- [ ] Linear API → Kanban board bi-directional sync
- [ ] Stripe per-business → KPI cards real MRR data
- [ ] Social media OAuth (FB, IG, LinkedIn, TikTok, YouTube) + content calendar
- [ ] Obsidian vault bridge via Google Drive
- [ ] All integrations: graceful degradation + stale indicators

### Exit Criteria (qa-tester verification)
- [ ] Each integration shows real data for at least 1 business
- [ ] API errors handled gracefully (no 500 crashes)
- [ ] Stale data indicator appears when API is unreachable
- [ ] All outbound actions routed through approval queue

---

## Phase 5: AI Layer

**Branch**: `rebuild/nexus-2.0`
**Agents**: `senior-fullstack` + `project-manager`
**Goal**: AI-powered assistance throughout the workspace.

### Deliverables
- [ ] Bron AI chat sidebar (Anthropic API, context-aware per page)
- [ ] Slash commands in block editor: /ai, /ask, /draft, /summarise
- [ ] `/founder/strategy` — Strategy Room (Claude Opus, extended thinking)
- [ ] Semantic search across all pages and databases
- [ ] Idea-to-Linear pipeline: raw input → structured spec → Linear issues (approval required)

### Exit Criteria (qa-tester verification)
- [ ] AI responses are contextually relevant to current page
- [ ] Search returns relevant results
- [ ] All AI-generated outbound content goes through approval queue

---

## Phase 6: Production Hardening

**Branch**: `rebuild/nexus-2.0` → merge to `main`
**Agents**: `qa-tester` + `devops-engineer` + `code-auditor`
**Goal**: Production-ready. Phill signs off. Ship.

### Deliverables
- [ ] Full E2E test suite (Playwright) passing
- [ ] Security audit: auth on every route, RLS on every table
- [ ] Lighthouse 90+ on all pages
- [ ] Bundle sizes within limits
- [ ] Monitoring: Vercel Analytics + error tracking
- [ ] Docs: README.md, ENV-VARS.md, ARCHITECTURE.md, DEPLOYMENT.md
- [ ] Phill manual test sign-off
- [ ] Merge `rebuild/nexus-2.0` → `main`
- [ ] Production deployment confirmed

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
