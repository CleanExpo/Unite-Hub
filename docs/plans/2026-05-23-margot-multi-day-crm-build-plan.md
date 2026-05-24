# Margot Multi-Day CRM Build Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Use strict existing-assets-first and Senior Project Manager control-loop rules before requesting any new access.

**Goal:** Continue building the Unite-Group CRM for multiple days by turning the current Margot/Senior PM operating model into a verified, task-driven CRM command system.

**Architecture:** Margot acts as Senior Project Manager and Board-bounded operator. Each autonomous tick reads the canonical rulebook, chooses one safe highest-leverage lane, executes locally or delegates via superpowers-style subagents, verifies the result, records evidence, and updates the command center/progress log. The CRM spine is Supabase-backed, with Next.js API routes, local tests/mocks, and docs as the durable 2nd Brain until production promotion is explicitly approved.

**Tech Stack:** Next.js App Router, TypeScript, Jest/ts-jest, Supabase migrations, Margot voice/task APIs, Linear-context docs, Hermes cron, Hermes subagents.

---

## 0. Authority and Board Boundaries

Margot has full authority to perform tasks inside the boundaries of the Board Members, with these active limits:

### Auto-execute allowed

- Local repo/code/doc inspection.
- Local documentation updates.
- Local tests using mocks.
- Local Supabase migration drafting.
- CRM schema inventories and matrices.
- Safe implementation behind tests.
- Progress logs, morning reports, command-center updates.
- Subagent delegation for scoped tasks and reviews.

### Draft first or ask Phill / Board before action

- Production database migrations or writes.
- Deployments.
- GitHub pushes/PR creation if not explicitly scoped.
- Vercel environment mutations.
- Client-facing communications.
- Billing, banking, refunds, payroll, payments, transfers, card changes.
- Cross-client data merging or identity decisions.
- Permanent business rules requiring Board judgment.

### Block immediately

- Missing identity where client/context leakage is possible.
- Secret/token exposure.
- Destructive git/filesystem operations.
- Any production-write path without explicit Board approval.

---

## 1. Current State Snapshot

Timestamp: 2026-05-23 07:19 AEST
Project root: `/Users/phillmcgurk/Unite-Group`

Verified current state:

- `node_modules=present`.
- Hermes Gateway is running; cron can fire automatically.
- Existing local Margot voice/test/docs changes are still uncommitted.
- CRM lead persistence has started:
  - `src/app/api/marketing/leads/route.ts` writes to `crm_leads`.
  - `supabase/migrations/20260523100000_crm_leads.sql` drafts the CRM lead table.
  - `tests/integration/api/marketing-leads.test.ts` covers happy path and failure paths.
  - `npx jest tests/integration/api/marketing-leads.test.ts --runInBand` passed.
  - `npm run type-check` passed.

Primary read-first files:

1. `docs/margot/CONNECTED-TEAMS-OPERATING-RULES.md`
2. `docs/margot/SENIOR-PROJECT-MANAGER-OPERATING-MODEL.md`
3. `docs/margot/SECOND-BRAIN-CARRY-FORWARD.md`
4. `docs/margot/high-level-crm-25-step-forecast.md`
5. `docs/margot/crm-operating-model.md`
6. `docs/margot/access-and-data-requirements.md`
7. `docs/margot/MARGOT-ORCHESTRATOR.md`
8. `docs/margot/MARGOT-COMMAND-CENTER.md`
9. `docs/margot/overnight-progress-log.md`
10. `docs/margot/morning-report.md`

---

## 2. Multi-Day Execution Method

Each tick must follow this loop:

1. Read the rulebook + Senior PM model + latest progress log.
2. Run a safe preflight:
   - `git status --short`
   - `test -d node_modules && echo node_modules=present || echo node_modules=missing`
   - check relevant files for the selected lane.
3. Pick exactly one highest-value safe lane.
4. Break the lane into 2-5 minute tasks.
5. For code tasks, follow TDD:
   - write failing test,
   - verify RED,
   - implement minimal code,
   - verify GREEN,
   - run focused regressions and type-check when feasible.
6. For implementation tasks, use subagent-driven-development where useful:
   - implementer subagent,
   - spec compliance reviewer,
   - code quality reviewer.
7. Append evidence to `docs/margot/overnight-progress-log.md`.
8. Update `docs/margot/morning-report.md` and `docs/margot/MARGOT-COMMAND-CENTER.md` when status changed.
9. Report: completed, files changed, verification, blockers, next lane.

Abort/escalation gates:

- Pre-flight gate: stop if working tree has conflicting edits in the same file.
- Revision gate: if tests/type-check fail, fix or record exact blocker before moving on.
- Escalation gate: if a lane needs Board judgment or production access, draft the decision and switch lanes.
- Abort gate: never proceed with secrets, destructive git, production writes, deployment, or cross-client merge risk.

---

## 3. Ranked Next Task Lanes

### Lane A — CRM schema inventory and source-of-truth map

**Why first:** It prevents drift as the CRM expands and gives every later build task a canonical object map.

**Output:** `docs/margot/crm-schema-inventory.md`

**Tasks:**

1. Inspect Supabase migrations for CRM-adjacent tables:
   - `nexus_clients`
   - `businesses`
   - `agent_actions`
   - `tasks`
   - `voice_command_sessions`
   - integration mirror tables
   - new `crm_leads`
2. Inspect API routes and helpers:
   - `src/app/api/empire/clients/route.ts`
   - `src/app/api/empire/clients/[slug]/route.ts`
   - `src/app/api/marketing/leads/route.ts`
   - `src/app/api/pi-ceo/margot-voice/task/route.ts`
   - `src/lib/empire/*`
3. Create table inventory with columns, current writers, current readers, gaps, tests, and source-of-truth rule.
4. Add a gap queue for `crm_contacts`, `crm_opportunities`, approvals, timeline, and lead conversion.
5. Verify by reading the file back and checking links/paths exist.

**Verification:**

```bash
test -f docs/margot/crm-schema-inventory.md
npm run type-check
```

---

### Lane B — Lead list/query API for the command center

**Why second:** Lead capture is now local, but Margot/Phill need visibility before conversion workflows.

**Output:** tested API for listing recent CRM leads.

**Likely files:**

- Create: `src/app/api/marketing/leads/list/route.ts` or `src/app/api/crm/leads/route.ts` after checking route conventions.
- Create: `tests/integration/api/crm-leads-list.test.ts`
- Modify docs: `docs/margot/crm-schema-inventory.md`

**Tasks:**

1. Write failing test for admin/authorized recent-lead listing using mocked Supabase.
2. Verify RED.
3. Implement route that reads `crm_leads` fields needed for command-center visibility.
4. Verify GREEN.
5. Add failure tests for missing Supabase env and Supabase read error.
6. Run focused test + type-check.

**Verification:**

```bash
npx jest tests/integration/api/crm-leads-list.test.ts --runInBand
npm run type-check
```

---

### Lane C — Lead qualification model and safe scoring draft

**Why third:** Qualification converts raw lead capture into CRM work without requiring production judgment.

**Output:** qualification helper + tests + docs.

**Likely files:**

- Create: `src/lib/crm/qualify-lead.ts`
- Create: `tests/unit/lib/crm/qualify-lead.test.ts`
- Modify: `docs/margot/crm-operating-model.md`

**Tasks:**

1. Write tests for safe deterministic scoring from existing lead fields.
2. Include no-AI/no-external-call behavior.
3. Implement minimal scoring bands:
   - `needs_review`
   - `qualified`
   - `nurture`
   - `spam_risk`
4. Add reasons array for operator transparency.
5. Verify tests + type-check.

**Board boundary:** scoring is recommendation-only until Board approves auto-assignment/conversion rules.

---

### Lane D — Lead-to-client conversion draft

**Why fourth:** This is the next CRM operating-loop milestone, but it must be guarded to avoid bad identity merges.

**Output:** conversion plan and test-first route skeleton using mocks only.

**Likely files:**

- Create: `docs/margot/lead-to-client-conversion-plan.md`
- Create: `tests/integration/api/crm-lead-conversion.test.ts`
- Later create: `src/app/api/crm/leads/[id]/convert/route.ts`

**Tasks:**

1. Draft conversion state machine.
2. Define identity-resolution gates.
3. Write failing tests for:
   - no conversion without exact lead id,
   - no conversion if already converted,
   - no conversion if target client identity conflicts,
   - successful mock conversion updates `crm_leads.converted_client_id` and creates/links `nexus_clients`.
4. Stop before production DB use.

**Board boundary:** real conversion/matching rules require Board-approved identity policy.

---

### Lane E — Project portfolio index

**Why parallel/safe:** Senior PM mandate needs portfolio visibility while CRM code advances.

**Output:** `docs/margot/project-portfolio-index.md`

**Tasks:**

1. Inspect docs, migrations, known Linear context, and repo surfaces.
2. Create portfolio rows: project, business/client, status, next 3 actions, blockers, evidence, revenue/strategy impact.
3. Mark unknowns explicitly; do not invent external status.
4. Link to command-center report.

---

### Lane F — Client 2nd Brain model

**Output:** `docs/margot/client-second-brain-model.md`

**Tasks:**

1. Define canonical client profile shape.
2. Define durable decision-history format.
3. Define retrieval/source priority.
4. Define privacy boundaries and client-mixing abort rules.
5. Add example template for one client/business using placeholders only if identity is not verified.

---

### Lane G — Marketing strategy operating model

**Output:** `docs/margot/marketing-strategy-operating-model.md`

**Tasks:**

1. Define ICP/offer/content/campaign CRM fields.
2. Define how leads feed marketing follow-up.
3. Define how marketing outputs become CRM activities/tasks.
4. Keep CCW/RestoreAssist/Synthex/DR-NRPG/CARSI context separated.

---

### Lane H — AI enhancement pipeline

**Output:** `docs/margot/ai-enhancement-pipeline.md`

**Tasks:**

1. Define watch/triage/sandbox/evaluate/plan/implement/verify/adopt/retire flow.
2. Add privacy/cost/security gates.
3. Add local-only evaluation pattern before production adoption.
4. Link to CRM/2nd Brain value scoring.

---

## 4. First 3-Day Cadence

### Day 1 — Stabilize the CRM spine

1. Lane A: CRM schema inventory.
2. Lane B: lead list/query API.
3. Update command center and progress logs.
4. Run focused tests and type-check.

### Day 2 — Turn leads into operator work

1. Lane C: lead qualification helper.
2. Lane D: conversion plan and first conversion tests.
3. Draft Board decision list for conversion/identity policy.
4. Update CRM operating model.

### Day 3 — Senior PM operating surface

1. Lane E: project portfolio index.
2. Lane F: client 2nd Brain model.
3. Lane G: marketing strategy operating model.
4. Lane H: AI enhancement pipeline if time remains.
5. Produce daily digest template and next 7-day queue.

---

## 5. Definition of Done for This Multi-Day Run

The run is successful when these artifacts exist and have verification evidence:

- `docs/margot/crm-schema-inventory.md`
- tested lead-list/query surface
- tested lead qualification helper
- `docs/margot/lead-to-client-conversion-plan.md`
- first conversion tests or blocked Board decision note
- `docs/margot/project-portfolio-index.md`
- `docs/margot/client-second-brain-model.md`
- `docs/margot/marketing-strategy-operating-model.md`
- `docs/margot/ai-enhancement-pipeline.md`
- updated command center, progress log, and morning report

Required verification per code lane:

```bash
npx jest <focused-test-file> --runInBand
npm run type-check
```

Optional broader verification before handoff/PR:

```bash
npm run test:all -- --runInBand
npm run build
```

Do not run production migrations, deploy, push, or send external updates unless Phill/Board explicitly approves that action.
