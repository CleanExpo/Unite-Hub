# PM Deep Dive — Unite-Group Nexus 2.0
**Date:** 24/03/2026 | **Type:** Senior PM Phase Assessment

## Summary
Project is at natural phase boundary. Phase 6 ~85% complete (Sentry ✓, E2E ✓, Social UI ✓ — KANBAN stale). 4 closure tasks to formally close Phase 6. Phase 7 (Hub Connectivity) is the correct next phase — 3 sprints, 6 weeks, achievable solo.

## Phase 6 Closure (3–5 days)
- 6.1 Rate limiting on high-risk API routes (1 day)
- 6.2 Performance baseline — Lighthouse on 3 pages (0.5 day)
- 6.3 Secrets rotation runbook at `.claude/runbooks/secrets-rotation.md` (0.5 day)
- 6.4 KANBAN update — move confirmed-done items, open Phase 7 (0.5 day)

## Phase 7 — Hub Connectivity (6 weeks)
- Sprint 7.1: MACAS auto-trigger from bookkeeper run
- Sprint 7.2: connected_projects API + hub dashboard widget
- Sprint 7.3: Nightly intelligence sweep cron

## Pre-Sprint Verification Required
- `SELECT COUNT(*) FROM xero_connections` — how many businesses connected?
- Does `advisory_cases` have `business_id` column?
- Mark CCW as `type: 'client'` in `businesses.ts` before satellite UI build

## Phase 8 (after Phase 7)
UNI-1499–1510 AI integration depth. Sequence: Structured Outputs → AI Router → Batch API → Memory Tool → Adaptive Thinking

## Full report: see conversation transcript 24/03/2026
