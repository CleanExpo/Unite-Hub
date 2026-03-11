# Unite-Group Nexus 2.0 — Production Pathway Design

> **Date**: 12/03/2026
> **Status**: Approved
> **Author**: Phill McGurk + Claude
> **Goal**: Define the clearest path from current state to a production-ready Nexus 2.0

---

## What Nexus 2.0 Actually Is

A **private founder CRM** for Phill McGurk to oversee all 7 businesses from a single tool.

Two core jobs:

1. **See how every business is performing** — revenue, active work, KPIs — without opening seven separate tools
2. **Capture ideas and push them into action** — type a raw thought, have the AI understand it, structure it into a proper task, and create it in the right Linear project for the right business

Everything else (social management, Obsidian, Stripe) is secondary. The tool is useful the moment these two things work well.

---

## What's Already Built

| Area | Status |
|------|--------|
| UI Shell (sidebar, topbar, navigation) | ✅ Complete |
| Credentials Vault | ✅ Complete |
| Kanban Board | ✅ Complete |
| Approvals Queue | ✅ Complete |
| Block Editor | ✅ Complete |
| Settings (theme, vault password, account) | ✅ Complete |
| Xero OAuth2 (revenue, P&L, BAS, GST) | ✅ Complete |
| Gmail API (business thread grouping) | ✅ Complete |
| Google Calendar (colour-coded events) | ✅ Complete |
| Linear API (Kanban bi-directional sync) | ✅ Complete |
| Nightly Bookkeeper CRON | ✅ Complete |
| MACAS Advisory System | ✅ Complete |

**Not needed for MVP (deferred):**
- Social OAuth (5 platforms) — the businesses need social presence, not the CRM itself. Deferred post-launch.
- Obsidian bridge — useful but not core. Deferred.

---

## What Gets Built Next

### 1. Live KPI Dashboard

**What it does:** The 7 business cards on the dashboard currently show static placeholder data. This wires them to real data from Xero, Linear, and the bookkeeper — so when you open the dashboard you see actual revenue, active issues, and project velocity for each business.

**How it works (non-technical):** The data is already flowing in from connected services. This step connects the pipes to the display cards.

**Sources per business card:**
- Revenue + P&L → Xero
- Active issues + work velocity → Linear
- Last financial snapshot → Nightly bookkeeper CRON

**Graceful degradation:** If a source is temporarily unavailable, the card shows its last known value with a "stale" indicator rather than breaking.

---

### 2. Bron Capture — Idea → Linear Pipeline

**The most important feature.** This is how raw founder thoughts become structured Linear issues without requiring Phill to write specs.

#### How It Works

A small icon lives permanently in the top bar — accessible from any page in the app, regardless of which business you're looking at.

Click it → a panel slides out from the right side of the screen.

Type your raw idea in plain language. Anything. Stream of consciousness. Incomplete sentences. It doesn't matter.

Bron (the AI) reads it and asks **qualifying questions — one at a time — with a recommendation and its reasoning**. Exactly like this brainstorming session. It only asks what it genuinely can't figure out on its own.

Example:
```
Phill:  "I want RestoreAssist clients to be able to export their
         compliance history as a PDF"

Bron:   "I'd classify this as a Feature Request — it's a new
         capability rather than fixing something broken. Does
         that sound right, or is this urgent because a client
         is currently blocked?"

Phill:  "Feature, not urgent"

Bron:   "RestoreAssist is subscription-based ($49.50/mo).
         I'd suggest making this available to all plan tiers —
         compliance export is a basic expectation, not a
         premium feature. Agree?"

Phill:  "Yes"

Bron:   "Here's the issue I'd create in Linear
         (RestoreAssist team, Medium priority):

         Title: Add compliance history PDF export for all plan tiers
         Type: Feature Request
         Priority: Medium
         Labels: feature, client-facing, exports
         Description: Allow RestoreAssist clients to export their
                      full compliance history as a downloadable PDF
                      from the client portal...
         Acceptance criteria:
           - Export button visible to all plan tiers in client portal
           - PDF includes all compliance records with timestamps
           - Generated within 10 seconds for up to 2 years of history
           - Matches RestoreAssist brand colours

         → Create in Linear or Discard?"
```

Phill clicks **Create in Linear** → issue appears in the RestoreAssist Linear project → panel closes.

No editing. No queue redirect. If the spec is wrong, Phill discards it and the conversation improves next time.

#### Business → Linear Team Mapping

| Business | Linear Team |
|----------|-------------|
| Disaster Recovery | DR-NRPG |
| NRPG | DR-NRPG |
| CARSI | G-Pilot |
| RestoreAssist | RestoreAssist |
| Synthex | Synthex |
| ATO Tax Optimizer | Unite-Group |
| CCW-ERP/CRM | Unite-Group |

#### Qualifying Question Topics (max 4 rounds)
1. Business/project identification (if ambiguous from the text)
2. Nature of the issue (feature / bug / improvement / new project)
3. Priority / urgency (with AI recommendation + reason)
4. Any constraint or scope detail not mentioned

---

### 3. Bron AI Sidebar

A persistent AI assistant that knows where you are in the app — which business you're viewing, which page, what data is on screen. General-purpose chat for questions, analysis, and quick lookups. Separate from the Capture panel.

---

### 4. Strategy Room

A dedicated page for deep thinking. Powered by Claude Opus with extended thinking enabled. Not quick questions — structured analysis: business strategy, financial decisions, competitive positioning. You write a prompt, it thinks, it returns a structured strategic output.

---

## Phase 6: Production Hardening

Before anything goes to production:

- **Security audit** — every page requires authentication, every database table has RLS policies (row-level security) so no data can leak
- **End-to-end tests** — automated tests that simulate real usage across all critical paths
- **Performance** — Lighthouse score 90+ on all pages (fast load, accessible, best practices)
- **Monitoring** — Vercel Analytics + error tracking so issues surface before they're reported
- **Documentation** — ENV variables guide, deployment guide, architecture notes

---

## Build Sequence

```
Step 1 — Live KPI Dashboard
         api-integrations agent + senior-fullstack agent
         Wire Xero + Linear + bookkeeper data to business cards

Step 2 — Bron Capture Panel (Idea → Linear)
         senior-fullstack agent
         Topbar icon + slide-out panel + Claude conversation engine + Linear API

Step 3 — Bron AI Sidebar
         senior-fullstack agent
         Context-aware chat sidebar throughout the app

Step 4 — Strategy Room
         senior-fullstack agent
         /founder/strategy page + Opus extended thinking

Step 5 — Security Audit
         code-auditor agent + database-architect agent
         Auth on every route, RLS on every table

Step 6 — End-to-End Tests
         qa-tester agent
         Playwright test suite covering all critical paths

Step 7 — Performance + Monitoring
         devops-engineer agent
         Lighthouse 90+, Vercel Analytics, error tracking

Step 8 — Production Deploy
         devops-engineer agent
         Vercel production environment, ENV vars locked, health confirmed
```

---

## What "Done" Looks Like

Phill opens Nexus 2.0 in a browser and can:

1. See live KPI data for all 7 businesses on the dashboard — no manual refreshing, no opening Xero separately
2. Click the capture icon, type a raw idea in plain English, answer 2-3 questions, and have a properly structured Linear issue created in the right project — in under 2 minutes
3. Ask Bron questions in the sidebar about any business and get context-aware answers
4. Open the Strategy Room for deep analysis when needed
5. Trust that the app is secure, tested, and monitored in production

Social OAuth and Obsidian bridge follow as Phase 4.5 post-launch.

---

## Deferred (Post-Launch)

| Feature | Reason Deferred |
|---------|----------------|
| Social OAuth (UNI-1517) | Platform approval processes (Instagram, TikTok) can take weeks — external dependency that blocks production |
| Obsidian bridge (UNI-1518) | Useful but not core. Deferred until post-launch. |
