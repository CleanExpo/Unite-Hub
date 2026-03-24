# Decision Memo: Unite-Group Hub Health & Business Connection Strategy

**Date:** 24/03/2026
**Brief:** `briefs/hub-health-and-connections-24-03-2026.md`
**Board:** CEO, Revenue, Product Strategist, Technical Architect, Contrarian, Compounder, Custom Oracle, Market Strategist, Moonshot
**Decision Type:** Strategic + Product Roadmap

---

## Executive Summary

Unite-Group Nexus 2.0 is functionally complete as a standalone CRM. The critical gap is that it operates as an island — no live data flows between the hub and its 7 satellites, and key internal loops (Xero → MACAS, Synthex → experiments) are manual. The board recommends a 3-sprint connection roadmap that closes the financial intelligence loop first, then makes it visible, then extends it to marketing performance.

---

## Situation Assessment

### What's Working
- Core infrastructure is solid: 37+ Supabase tables, 19 API route groups, MACAS fully built and tested, Xero integration live, bookkeeper running, 1,824 tests passing
- The `connected_projects` table exists in schema — zero implementation required to start building against it
- Linear integration is live — satellite project issues can be surfaced in Unite-Group without touching satellite codebases
- Synthex and Restore Assist are active Next.js projects with their own CLAUDE.md files — they are integration-ready

### What's Missing (in priority order)
1. **The Xero → MACAS pipeline** — bookkeeper runs but MACAS cases are still manually created. The most valuable internal loop is broken.
2. **The `connected_projects` UI** — the hub has no visual representation of its satellites. Phill cannot see all 7 businesses from one screen.
3. **The Synthex feedback loop** — Synthex generates content variants but performance data doesn't return to the experiments engine. A/B experiments never compound.
4. **A nightly intelligence sweep** — there is no scheduled event-routing engine that checks each connected system for notable events and dispatches the right AI pipeline.

### Current Hub Health Score

| Dimension | Status | Score |
|-----------|--------|-------|
| Infrastructure completeness | 10/10 phases done, 1,824 tests | ⭐⭐⭐⭐⭐ |
| Internal AI loops | MACAS manual trigger, no auto-pipeline | ⭐⭐ |
| Satellite visibility | 0 satellites shown in hub | ⭐ |
| Data quality | Xero connected, bookkeeper runs, not wired to advisory | ⭐⭐⭐ |
| Content performance feedback | No Synthex → experiments connection | ⭐ |
| **Overall Hub Connectivity** | **Conceptual hub, not operational hub** | **⭐⭐** |

---

## Board Decision

### Sprint 1 (Weeks 1–2): Close the Financial Intelligence Loop
**What:** Auto-trigger MACAS advisory cases when a bookkeeper run completes with reconciled Xero data.

**Architecture:**
```
bookkeeper_runs (completed)
  → Supabase database trigger / nightly cron
  → Data readiness gate (reconciled transactions > threshold)
  → advisory_cases.create({ source: 'auto-bookkeeper', business_id, period })
  → MACAS 4-firm debate runs
  → advisory_verdicts written
```

**Technical notes:**
- Modify `src/app/api/bookkeeper/` post-run handler to emit a MACAS trigger
- Add data readiness gate: if unreconciled_transactions > 10% of total, skip and flag for Phill review
- All auto-triggered cases must display "Auto-triggered from bookkeeper run — verify input data before acting on verdict" badge
- Start with Xero-connected businesses only (not all 7 simultaneously)
- Estimated complexity: Low — uses all existing infrastructure

**Success metric:** 3+ MACAS verdicts generated automatically in the first month without Phill manually setting up cases

---

### Sprint 2 (Weeks 3–4): Make the Hub Feel Like a Hub
**What:** Build the `connected_projects` API + monitoring dashboard widget showing all satellites.

**What to display per satellite:**
```
connected_projects record:
  - business_id (FK to businesses table)
  - repo_url (GitHub)
  - stack (next.js | fastapi | wordpress | static)
  - last_commit (pulled from GitHub API)
  - open_linear_issues (pulled from Linear API — already integrated)
  - last_macas_verdict_date
  - last_bookkeeper_run_date
  - health_status (green | yellow | red — calculated)
  - notes (free text)
```

**UI:**
- New "Hub Status" widget on the main dashboard showing all 7 satellites as cards
- Each card shows: business name + colour, last activity, open issues count, last MACAS verdict
- Cards link to the relevant Linear project and the latest MACAS verdict
- No satellite codebase changes required — pulls from GitHub API + Linear API (already live)

**Success metric:** Phill opens Unite-Group and sees all 7 businesses in one screen within 10 seconds of login

---

### Sprint 3 (Weeks 5–6): Nightly Intelligence Sweep (Business KPI Ingestion)

**Correction from initial deliberation:** Synthex is not a content pipeline feeding back into Unite-Group's experiment engine — it is a *business* under the Unite-Group umbrella with its own SaaS platform (synthex.social, 91 Prisma models, external clients). Sprint 3 treats all satellites uniformly: as businesses reporting KPIs to the hub.

**What:** A nightly cron job that reads each connected satellite's key business metrics and writes them to `connected_projects` rows, enabling the Sprint 2 dashboard to show live data rather than static status.

**Architecture:**
```
Vercel cron (nightly, 11pm AEST):
  For each connected_projects record:
    → GitHub API: last commit, open PRs (for code-based satellites)
    → Linear API: open issues count, last closed issue (all satellites)
    → Xero API: monthly revenue delta (for Xero-connected satellites)
    → Write summary to connected_projects.last_sweep_data (JSONB)
  → Dashboard widget reads last_sweep_data on next load
```

**Per-satellite KPI sources:**
| Satellite | KPI Source | Key Metrics |
|-----------|-----------|-------------|
| Synthex | Synthex Supabase API (read-only) | MRR, active orgs, campaigns run |
| CARSI | GitHub + Linear | Build status, open issues |
| Restore Assist | GitHub + Linear | Build status, open issues |
| DR / NRPG | Linear only | Open jobs/issues (no code repo) |
| ATO / CCW | Linear + Xero | Open issues, revenue |

**Technical notes:**
- Synthex integration requires a read-only API key or Supabase service role for Synthex DB — coordinate with Synthex codebase to expose a `/api/internal/kpis` endpoint
- Start with GitHub + Linear only (no external API calls needed) — add Xero and Synthex KPIs in a follow-up iteration

---

## Answers to Key Questions

**Q1: Sequencing** — A → B → C. Financial intelligence closes the highest-ROI loop. Hub UI makes it visible and changes operating behaviour. Synthex feedback compounds content performance last.

**Q2: Architecture pattern** — Hybrid. Internal loops (Xero → MACAS) use cron/trigger (no satellite involvement). Satellite-to-hub communication uses webhooks (push). Hub-to-satellite reading uses pull (GitHub API, Linear API). Do not build persistent server-to-server connections on Vercel serverless.

**Q3: `connected_projects` table** — Contains: business_id, repo_url, stack, last_commit, open_linear_issues, last_macas_verdict_date, health_status, notes. MVP UI is a dashboard widget with 7 satellite cards — readable, clickable, no manual dispatch required. Automated processes write to it; Phill reads it.

**Q4: MACAS data quality** — Yes, Xero → MACAS automation is the single highest-ROI task. Add a data readiness gate (less than 10% unreconciled transactions) as a guard. Auto-trigger with a human review badge on every auto-created case.

**Q5: Commercial viability** — The commercial threshold is: when Unite-Group works beautifully for Phill for 90 days with live financial data, the pattern is de-risked. The commercial pitch is "one dashboard, all businesses, AI advisory across your portfolio" — which requires Sprint 1 + Sprint 2 to be functional. Target commercial proof-of-concept: Q3 2026.

---

## What NOT to Build Yet

- **Social platform APIs for Synthex** (Instagram, LinkedIn rate limits and instability make this a time sink)
- **Satellite-side agents or AI** (don't add AI capabilities to satellites before the hub data loop is working)
- **Universal satellite integration framework** (different stacks need different approaches — build case-by-case, not a platform)
- **WhatsApp bridge (UNI-1478)** and **Invoicing module (UNI-173)** — backlog until Sprint 1-3 are done

---

## The North Star (Moonshot Anchor)

The nightly intelligence sweep — a cron job that:
1. Checks each satellite for notable events (new Xero period close, new Linear issues, Synthex campaign complete)
2. Routes each event to the right AI pipeline (MACAS for financial, coach_reports for content, advisory for strategy)
3. Produces a morning briefing card in the Unite-Group dashboard

This is not a short-term task. But every Sprint 1–3 feature should be built with this event-dispatch model in mind. Don't build manual triggers that can't later become automatic routes.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Xero data quality gates blocking all auto-MACAS runs | Medium | Set generous threshold initially (>20% unreconciled), tighten over time |
| Synthex not stable enough for Sprint 3 | Medium | Substitute nightly intelligence sweep cron as Sprint 3 alternative |
| Sprint scope expanding beyond 2 weeks each | High (solo operator) | Use /finished-audit gate at end of each sprint before starting next |
| DR/NRPG have no digital systems to integrate | High | Use Linear issues only as their satellite signal — no Xero required for non-digital businesses |

---

## Immediate Next Actions (This Week)

1. **Check Xero connection status**: How many of the 7 businesses currently have active `xero_connections` rows? This determines Sprint 1 scope.
2. **Check Synthex PROGRESS.md** at `C:/Synthex/PROGRESS.md` to assess build stability before planning Sprint 3.
3. **Add 3 tasks to KANBAN**: Sprint 1 (bookkeeper → MACAS auto-trigger), Sprint 2 (connected_projects API + widget), Sprint 3 (Synthex webhook or nightly sweep).
4. **Verify advisory layer business_id coverage**: Confirm `advisory_cases` records include `business_id` so auto-triggered MACAS cases are correctly attributed to the right business entity.

---

*Memo by: CEO Board (9 personas) — first deliberation*
*Custom Oracle decision history updated*
*Next review recommended: after Sprint 2 completion (~14/04/2026)*
