# Brief: Unite-Group Hub Health Assessment & Business Connection Strategy

**Date Submitted:** 24/03/2026
**Submitted By:** Phill McGurk
**Decision Needed By:** 07/04/2026
**Board Topic:** Strategic
**Affects Businesses:** All 8 (Unite-Group hub + 7 satellites)

---

## Situation

Unite-Group Nexus 2.0 is live in production (https://unite-group.in). All 10 build phases are complete — foundation, UI shell, integration layer (Xero, Gmail, Linear), AI advisory layer (MACAS), brand DNA, campaign generation, dashboard UI, SEO/CRON, and visual generation via PaperBanana. The hub is functional as a founder cockpit.

However, the hub currently operates as an island. Seven satellite business projects exist on disk (Synthex, CARSI, Disaster Recovery, Restore Assist, ATO Tax Optimizer, CCW-ERP, National Professional Group) with their own codebases — some actively developed with their own CLAUDE.md files, some static sites, some partial builds. There is no live data flowing from any satellite into Unite-Group, and no hub-generated content flowing out to satellites via automated pipelines.

The `connected_projects` table exists in the Nexus 2.0 schema but has no UI and no data. The `social_channels` table is populated but has no UI. MACAS provides AI accounting advisory but receives data manually — there is no automated pipeline pulling financial data from the Xero connections or satellite books into advisory cases. The AI Layer integration backlog (UNI-1499 to UNI-1510) represents 12 open Linear issues including MCP connector layer, Files API, memory persistence, and an AI orchestration router.

The core tension: we've built the world's best founder cockpit for one person, but it doesn't yet communicate with the businesses it's supposed to govern.

## Stakes

**Downside if we choose poorly:**
- Each satellite continues operating in isolation — no shared intelligence, no cross-business compounding
- MACAS produces advisory based on manually-entered snapshots rather than live financial data — lower quality, higher Phill time cost
- Synthex generates social content without performance feedback loops — A/B experiments never close, learnings never accumulate
- The `connected_projects` hub concept remains hypothetical; Unite-Group becomes an expensive CRM that manages contacts rather than a genuine multi-business nerve centre
- Phill context-switches 7+ times per day across separate tools/repos instead of operating from one cockpit

**Upside if we choose well:**
- Unite-Group becomes a genuine zero-context-switch command centre — one login, all businesses
- MACAS gets live financial data from Xero across all connected businesses → dramatically better advisory quality
- Synthex performance data (clicks, conversions, engagement) flows back to the hub → content strategy compounds
- Cross-business intelligence: NRPG lead data can inform DR campaign targeting; ATO optimiser findings surface for all businesses
- Linear/KANBAN for all satellite projects managed from one interface
- Long-term: position Unite-Group Nexus as a commercial product for other multi-business founders in AUS

---

## Constraints

- Constraint 1: **Solo operator** — Phill is the only developer and operator. Integration architecture must be low-maintenance, not require constant babysitting
- Constraint 2: **Stack diversity** — Satellites have different stacks (Restore Assist: Next.js; CARSI: appears to have FastAPI/Python; DR/NRPG: likely static/WordPress; Synthex: active Next.js with CLAUDE.md). No single integration pattern fits all
- Constraint 3: **Vercel + Supabase stack** — Unite-Group has no long-running server. Integrations must use webhooks, cron, or client-initiated fetch — not persistent WebSocket servers
- Constraint 4: **Budget** — No new paid SaaS without clear AUD ROI. Existing Supabase, Vercel, Xero, and Anthropic subscriptions are the palette
- Constraint 5: **Privacy Act 1988** — Aggregating business data (especially contacts, financials) across entities requires data handling consideration
- Constraint 6: **Time value** — The 12 Linear issues in the AI integration backlog are all valuable but cannot all be done at once

---

## Key Questions for the Board

1. **Sequencing** — Given the satellite diversity, what is the correct first integration to build? (Synthex performance data? MACAS live Xero feed? `connected_projects` UI?)
2. **Architecture pattern** — Should satellites PUSH data to Unite-Group (webhooks) or should Unite-Group PULL from satellites on demand (API/cron)? Or a hybrid?
3. **The `connected_projects` table** — What should this table actually contain, and what does the MVP UI need to show to make Unite-Group feel like a hub?
4. **MACAS data quality** — Is closing the gap between manual MACAS input and automated Xero data the single highest-ROI engineering task?
5. **Commercial viability** — At what point does Unite-Group's multi-business hub pattern become a sellable product for other AUS founders with multiple businesses?

---

## Background & Supporting Context

- **Hub API routes live today**: advisory, analytics, bookkeeper, campaigns, coaches, contacts, content, cron, dashboard, experiments, ideas, linear, search, social, strategy, vault, video, webhooks, xero
- **Satellites on disk**: `C:/Synthex/` (active — own CLAUDE.md + CONSTITUTION.md), `C:/Restore Assist/` (active — Next.js + PRODUCT-ROADMAP.md), `C:/CARSI/` (Python/FastAPI backend), `C:/Disaster Recovery/` (content/static), `C:/ATO/`, `C:/CCW Digital Operations Hub/`, `C:/CCW-Online ERP/`
- **`connected_projects` schema**: table exists in Supabase (created Phase 2), zero rows, no UI, no API routes for it
- **MACAS current data flow**: Phill manually creates advisory cases → 4 firms debate → verdict written. No automatic trigger from Xero data changes
- **Xero connection**: `xero_connections` table exists + `bookkeeper_runs` — Xero OAuth is live, bookkeeper runs execute, but MACAS and campaign strategy don't consume bookkeeper output
- **Linear integration**: API live at `src/app/api/linear/` — 12 open issues in AI layer backlog (UNI-1499 to UNI-1510)
- **Tests**: 1,824/1,824 passing | type-check ✓ | lint ✓ (24/03/2026)
- **Reference**: `.pi/ceo-agents/expertise/custom-oracle.md` — full 7-business context

---

## Proposed Options

### Option A: MACAS-First (Close the Financial Data Loop)
Build the pipeline from bookkeeper/Xero → automatic MACAS case creation. When a bookkeeper run completes, a new advisory case is auto-created with the financial delta. MACAS debates it, writes a verdict. Phill reviews, not creates.
- **Pros:** Highest ROI per hour — MACAS is already built and tested; this makes it autonomous. Direct AUD impact via better financial decisions
- **Cons:** Doesn't help connect satellite businesses — only improves the hub's internal advisory quality for businesses already Xero-connected

### Option B: connected_projects UI First (Make the Hub Feel Like a Hub)
Build the `connected_projects` table API + UI — a project registry showing all 7 satellites with status, latest activity, open Linear issues, and health scores. Satellites don't need to push anything; Unite-Group pulls from their GitHub repos + Linear
- **Pros:** Immediately visible value — Phill sees all businesses in one dashboard. Provides the psychological "hub" experience. Can be built without touching satellite codebases
- **Cons:** Mostly read-only intelligence; doesn't create bi-directional data flow. Synthex still generates content in isolation

### Option C: Synthex Feedback Loop (Close the Content Performance Loop)
Build the performance data ingestion from Synthex campaign results back to Unite-Group experiments engine. Synthex A/B variants complete → results written to `experiments` table → coach_reports analyse them → next Synthex run uses learnings
- **Pros:** Closes the most commercially visible loop — marketing spend compounds. Synthex is an active codebase (CLAUDE.md present) so integration is possible
- **Cons:** Social performance data requires platform API connections (Instagram, LinkedIn) that add complexity. Synthex stack compatibility unknown

---

**End of Brief**
