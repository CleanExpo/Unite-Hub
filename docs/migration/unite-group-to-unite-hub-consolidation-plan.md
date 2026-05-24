# Unite-Group to Unite-Hub Consolidation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Each task must start from CleanExpo/Unite-Hub, use a fresh branch, and remain independently verifiable.

**Goal:** Consolidate the useful work that was mistakenly split into CleanExpo/Unite-Group back into CleanExpo/Unite-Hub, while preserving links, API behaviour, Vercel configuration, Git history context, and testing safety.

**Architecture:** CleanExpo/Unite-Hub remains the canonical repository and production target. CleanExpo/Unite-Group becomes a read-only harvest source until all selected work is migrated, validated in branches/previews/sandboxes, and explicitly approved for retirement. No wholesale merge, no production database changes, and no repository deletion happen in this plan.

**Tech Stack:** Next.js App Router, React, Supabase, Vercel, Tailwind CSS, pnpm, GitHub PRs, Vercel preview deployments, Supabase sandbox migrations.

---

## Current state

Canonical target:

- Repo: `CleanExpo/Unite-Hub`
- Local path: `/Users/phillmcgurk/Unite-Hub`
- Remote: `https://github.com/CleanExpo/Unite-Hub.git`
- Role: canonical repo going forward

Harvest source:

- Repo: `CleanExpo/Unite-Group`
- Local path: `/Users/phillmcgurk/Unite-Group`
- Remote: `https://github.com/CleanExpo/Unite-Group.git`
- Role: read-only source until migration complete

Important source PRs already merged in Unite-Group:

- `#169` guarded CRM daily digest and activity timeline routes
- `#170` CRM create activity timeline events
- `#171` CRM timeline writes best-effort
- `#172` CCW product category topic brief
- `#173` Linear watch refresh after CCW category brief
- `#174` CCW machines category copy

Important source work not yet cleanly shipped:

- Unite-Group branch: `feat/crm-approval-lifecycle-helper`
- Current source worktree has uncommitted files:
  - `docs/margot/crm-operating-model.md`
  - `docs/margot/crm-test-coverage-matrix.md`
  - `src/lib/crm/approval-lifecycle.ts`
  - `tests/unit/lib/crm/approval-lifecycle.test.ts`

Initial repo audit result:

- Unite-Hub files checked: 1,917
- Unite-Group files checked: 964
- Common relative paths: 53
- Identical common files: 4
- Unite-Group-only paths: 911
- Unite-Hub-only paths: 1,864

Conclusion: this is not a simple rename or fast-forward. Treat it as a selective migration.

---

## Hard safety rules

- Do not delete CleanExpo/Unite-Group until a separate explicit approval after final verification.
- Do not merge Unite-Group main into Unite-Hub.
- Do not bulk-copy all Unite-Group-only files into Unite-Hub.
- Do not edit `.env`, secrets, or Vercel environment variables.
- Do not run production Supabase migrations.
- Do not change production Vercel routing/domains during migration.
- Do not promote sandbox database changes to production without separate approval.
- Do not introduce `workspace_id` scoping for founder-owned CRM data; Hub rules require `founder_id` scoping.
- Keep Supabase auth aligned with Hub's server-side PKCE pattern.
- Every PR must document source paths, source commits/PRs, intentional omissions, and verification results.

---

## Branch and sandbox model

Every migration slice uses this pattern:

```bash
cd /Users/phillmcgurk/Unite-Hub
git checkout main
git pull --ff-only origin main
git checkout -b migration/<small-slice-name>
```

Harvest only named files or named hunks from `/Users/phillmcgurk/Unite-Group`.

Do not use:

```bash
git merge <unite-group-branch>
```

Do not use:

```bash
cp -R /Users/phillmcgurk/Unite-Group/* /Users/phillmcgurk/Unite-Hub/
```

For database work:

- Apply migrations to sandbox only.
- Capture schema diff/output in the PR body.
- Include rollback notes.
- Defer production migration until the whole CRM/API surface is reviewed.

---

## Baseline verification commands

For docs-only PRs:

```bash
cd /Users/phillmcgurk/Unite-Hub
git diff --check
pnpm lint
```

For helper/code PRs:

```bash
cd /Users/phillmcgurk/Unite-Hub
pnpm type-check
pnpm lint
pnpm test
```

For targeted CRM helper tests once migrated:

```bash
cd /Users/phillmcgurk/Unite-Hub
pnpm vitest run tests/unit/lib/crm/activity-timeline.test.ts tests/unit/lib/crm/approval-lifecycle.test.ts
pnpm type-check
pnpm lint
```

For schema PRs:

```bash
cd /Users/phillmcgurk/Unite-Hub
git diff --check
pnpm type-check
```

Then run sandbox-only Supabase verification using the project-approved sandbox command and record the output in the PR.

---

# First five migration PRs

## PR 1: Migration control document and harvest inventory

**Objective:** Establish operating rails in Unite-Hub before importing functional work.

**Files:**

- Create: `docs/migration/unite-group-to-unite-hub-consolidation-plan.md`

**Steps:**

1. Create the plan document.
2. Record target repo, source repo, safety rules, and source PRs.
3. Commit as docs-only.
4. Open a PR against CleanExpo/Unite-Hub.

**Verification:**

```bash
git diff --check
pnpm lint
```

**Acceptance:**

- No runtime behaviour changes.
- A reviewer can see the exact migration strategy and safety rails.

---

## PR 2: Margot CRM documentation pack

**Objective:** Move CRM operating knowledge into the canonical repo before moving code.

**Files to review from source:**

- `/Users/phillmcgurk/Unite-Group/docs/margot/crm-operating-model.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/crm-test-coverage-matrix.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/crm-schema-inventory.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/crm-contacts-opportunities-model.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/daily-crm-digest-template.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/high-level-crm-25-step-forecast.md`
- `/Users/phillmcgurk/Unite-Group/docs/plans/2026-05-23-margot-multi-day-crm-build-plan.md`

**Important:** Preserve the uncommitted Unite-Group CRM docs before harvesting them.

**Target files:**

- Add or adapt under `docs/margot/` and `docs/plans/` in Unite-Hub.

**Verification:**

```bash
git diff --check
pnpm lint
```

**Acceptance:**

- CRM assumptions are visible in Unite-Hub.
- Any schema/API assumptions not yet validated against Hub are clearly marked.
- No code, env, Vercel, or DB behaviour changes.

---

## PR 3: CCW and Linear-watch documentation pack

**Objective:** Migrate recent non-runtime CCW and Linear documentation from Unite-Group.

**Source references:**

- Group PR `#172`: CCW product category topic brief
- Group PR `#173`: Linear watch refresh
- Group PR `#174`: CCW machines category copy

**Files to review from source:**

- `/Users/phillmcgurk/Unite-Group/docs/margot/ccw-product-category-topic-brief.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/ccw-carpet-cleaning-machines-category-copy.md`
- `/Users/phillmcgurk/Unite-Group/docs/margot/linear-watch-today.md`

**Verification:**

```bash
git diff --check
pnpm lint
```

**Acceptance:**

- Docs are available in Unite-Hub.
- No content is published or scheduled.
- No runtime behaviour changes.

---

## PR 4: CRM pure helpers and unit tests

**Objective:** Move low-risk CRM helper logic before API routes or DB writes.

**Source files:**

- `/Users/phillmcgurk/Unite-Group/src/lib/crm/activity-timeline.ts`
- `/Users/phillmcgurk/Unite-Group/src/lib/crm/approval-lifecycle.ts`
- `/Users/phillmcgurk/Unite-Group/tests/unit/lib/crm/activity-timeline.test.ts`
- `/Users/phillmcgurk/Unite-Group/tests/unit/lib/crm/approval-lifecycle.test.ts`

**Target files:**

- `src/lib/crm/activity-timeline.ts`
- `src/lib/crm/approval-lifecycle.ts`
- `tests/unit/lib/crm/activity-timeline.test.ts`
- `tests/unit/lib/crm/approval-lifecycle.test.ts`

**Verification:**

```bash
pnpm vitest run tests/unit/lib/crm/activity-timeline.test.ts tests/unit/lib/crm/approval-lifecycle.test.ts
pnpm type-check
pnpm lint
```

**Acceptance:**

- Pure helper tests pass in Unite-Hub.
- Helpers do not import Unite-Group-only modules.
- No routes, DB writes, env changes, or production effects.

---

## PR 5: CRM schema migration files with sandbox verification only

**Objective:** Prepare CRM schema compatibility in Unite-Hub without touching production.

**Source files:**

- `/Users/phillmcgurk/Unite-Group/supabase/migrations/20260523100000_crm_leads.sql`
- `/Users/phillmcgurk/Unite-Group/supabase/migrations/20260523103000_crm_contacts_opportunities.sql`
- `/Users/phillmcgurk/Unite-Group/tests/unit/margot-crm-contacts-opportunities-migration.test.ts`

**Target files:**

- New timestamped migrations under `supabase/migrations/` in Unite-Hub, after reviewing Hub's existing migration order.
- Add or adapt the migration unit test only if it fits Hub's test setup.

**Verification:**

```bash
git diff --check
pnpm type-check
pnpm vitest run tests/unit/margot-crm-contacts-opportunities-migration.test.ts
```

Sandbox-only DB verification:

1. Apply migration to sandbox only.
2. Run schema diff.
3. Confirm founder scoping and RLS.
4. Record results in PR body.

**Acceptance:**

- Migration files are reviewable in Unite-Hub.
- Sandbox apply succeeds.
- No production DB changes.
- No API route depends on these tables yet.

---

# Follow-on PRs

## PR 6: CRM read/list APIs

Move low-risk read/list routes first, adapted to Hub auth/session helpers.

Candidate source files:

- `src/app/api/crm/leads/route.ts`
- `src/app/api/crm/daily-digest/route.ts`

Acceptance:

- Founder scoping verified.
- Integration tests pass.
- No write path yet unless already proven safe.

## PR 7: CRM create/convert APIs with best-effort timeline writes

Move create/convert routes after helpers and schema are in place.

Candidate source files:

- `src/app/api/crm/contacts/route.ts`
- `src/app/api/crm/opportunities/route.ts`
- `src/app/api/crm/leads/[id]/convert/route.ts`

Acceptance:

- Timeline writes are best-effort and non-blocking.
- Sanitised metadata only.
- Create path tests pass.

## PR 8: CRM timeline route/action integration

Wire activity timeline into Hub-native storage after API and schema compatibility are confirmed.

Acceptance:

- Failure in secondary timeline write does not fail primary CRM action.
- No secrets or excessive PII in timeline payloads.

## PR 9: CRM UI/navigation integration

Add UI only after APIs are working.

Acceptance:

- Uses Hub design system.
- Private founder CRM positioning only.
- No public SaaS positioning.

## PR 10: Final retirement audit

Before deleting or archiving Unite-Group:

1. Compare remaining Unite-Group-only paths against migration inventory.
2. Mark each path as migrated, intentionally rejected, obsolete, or deferred.
3. Confirm Unite-Hub CI/build/preview is green.
4. Confirm production migration/deploy plan separately.
5. Ask for explicit approval before deleting or archiving CleanExpo/Unite-Group.

---

## Retirement gate for CleanExpo/Unite-Group

CleanExpo/Unite-Group can only be deleted or archived after all conditions are true:

- All selected docs/code/schema/API/UI surfaces are migrated to Unite-Hub or explicitly rejected.
- Unite-Hub main is green.
- Vercel preview is green.
- Production route/domain/API assumptions are confirmed.
- Supabase production migration plan is separately approved and executed, if needed.
- Any external links/API callers are redirected or documented.
- A final backup tag or archive bundle exists.
- Phill gives explicit delete/archive approval.
