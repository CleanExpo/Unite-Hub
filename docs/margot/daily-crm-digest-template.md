# Daily CRM Digest Template

Date: 2026-05-23
Owner: Margot
Project: Unite-Group
Status: local-only template and pure helper; no production DB read/write is implied.

## Purpose

This template defines the minimum daily CRM digest that Margot should surface to Phill once CRM data is available through safe read paths. It carries forward:

- `docs/margot/CONNECTED-TEAMS-OPERATING-RULES.md`
- `docs/margot/SENIOR-PROJECT-MANAGER-OPERATING-MODEL.md`
- `docs/margot/SECOND-BRAIN-CARRY-FORWARD.md`
- `docs/margot/high-level-crm-25-step-forecast.md`
- `docs/margot/crm-operating-model.md`
- `docs/margot/crm-contacts-opportunities-model.md`

The digest should help Phill answer:

1. What needs attention today?
2. Which leads/opportunities are highest leverage?
3. Which approvals or blocked tasks require Phill?
4. Which project/client/marketing/AI lanes moved forward?
5. What was verified, and what remains blocked?

## Local Helper

Implemented helper:

- `src/lib/crm/daily-digest.ts`

Focused test:

- `tests/unit/lib/crm/daily-digest.test.ts`

Current behavior:

- Pure TypeScript function only.
- No network calls.
- No Supabase calls.
- No production DB writes.
- No client-facing sends.
- Produces structured summary, digest sections, and markdown output.

## Digest Inputs

### Leads

Minimum fields:

- `id`
- `name`
- `company`
- `email`
- `status`
- `qualificationBand`
- `score`
- `nextAction`

Source path when wired later:

- Supabase `crm_leads`, read through a guarded server/admin route.
- Qualification can use `src/lib/crm/qualify-lead.ts`, but remains recommendation-only.

Safety:

- Do not auto-convert from digest output.
- Do not overwrite client identity from digest output.
- Do not expose unnecessary PII in broad channels.

### Opportunities

Minimum fields:

- `id`
- `name`
- `stage`
- `valueEstimate`
- `probability`
- `requiresApproval`
- `nextAction`

Source path when wired later:

- Draft table `crm_opportunities` from `supabase/migrations/20260523103000_crm_contacts_opportunities.sql` after sandbox verification and explicit approval.

Safety:

- Stripe remains billing truth.
- Opportunity values are forecasts, not invoices, revenue recognition, or cash truth.
- Commercial commitments require Board/Phill approval.

### Tasks and approvals

Minimum fields:

- `id`
- `title`
- `owner`
- `status`
- `priority`

Source path when wired later:

- Supabase `tasks` for app/Margot tasks.
- Linear mirror for execution status.
- Approval-required work remains blocked until Phill approves.

### Blockers

Minimum fields:

- `area`
- `detail`
- `neededFrom`

Examples:

- Mac Mini recovery blocked by no authenticated SMB mount or SSH session.
- Vercel production readiness blocked by missing local link/token.
- Schema promotion blocked until sandbox apply/diff passes and Board approves promotion.

### Verification

Minimum fields:

- `command`
- `status`

Examples:

- `npx jest tests/unit/lib/crm/daily-digest.test.ts --runInBand`
- `npm run type-check`
- `npm run security:routes-check`

## Output Sections

The digest must include:

1. Summary counts
   - leads
   - qualified leads
   - opportunities
   - approval-required items
   - blocked tasks
   - blockers

2. Operator priorities
   - high-signal leads
   - active opportunities
   - high/urgent tasks

3. Approvals / Board decisions
   - opportunity commitments needing approval
   - Phill-owned or blocked tasks
   - conversion/identity decisions

4. Blockers
   - exact area
   - exact blocker
   - what unlocks it

5. Verification
   - commands run
   - pass/fail/blocked status

6. Safety note
   - no production DB writes
   - no deploys
   - no env mutations
   - no secret printing
   - no GitHub push
   - no client-facing sends

## Example Skeleton

```text
# Daily CRM Digest

Generated: <timestamp>

## Summary
- Leads: <count>
- Qualified leads: <count>
- Opportunities: <count>
- Approval-required items: <count>
- Blocked tasks: <count>
- Blockers: <count>

## Operator Priorities
- Lead <id> (<name/company>): <band/score>. Next: <next action>
- Opportunity <id> (<name>): stage <stage>, <value>, <probability>. Next: <next action>
- Task <id> (<title>): owner <owner>, status <status>, priority <priority>

## Approvals / Board Decisions
- Opportunity <id>: approval required before commercial commitment. Next: <next action>
- Task <id>: blocked for Phill. Priority: <priority>

## Blockers
- <area>: <detail>. Needed: <unlock>

## Verification
- <status>: <command>

## Safety Note
No production DB writes, deploys, env mutations, secret printing, GitHub push, or client-facing sends are implied by this digest.
```

## Next Wiring Path

1. Keep the pure helper covered by unit tests.
2. Later add a server-only digest route or command-center loader that reads existing CRM routes/tables with admin gating.
3. Use mocked tests before connecting live Supabase reads.
4. If schema changes are needed, apply only to sandbox through `./scripts/sandbox-wizard.sh` first.
5. Keep digest delivery local until a user-visible channel is explicitly configured and verified.
