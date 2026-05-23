# Margot CRM Test Coverage Matrix

Date: 2026-05-23 19:22 AEST
Owner: Margot
Project: Unite-Group
Scope: Local repo evidence only. This matrix maps the current CRM operating loop to available mocked/local tests and the next safe coverage gaps. It does not imply production DB writes, deployment, GitHub push, Vercel env mutation, client-facing sends, or permanent business-rule approval.

## Purpose

Margot needs a durable CRM test matrix so the CRM build can keep moving without rediscovering coverage every run. The CRM must be verified as an operating cockpit across leads, contacts, opportunities, tasks, approvals, daily digest, voice ingress, client records, and integration mirrors.

This matrix carries forward:

- `docs/margot/CONNECTED-TEAMS-OPERATING-RULES.md`
- `docs/margot/SENIOR-PROJECT-MANAGER-OPERATING-MODEL.md`
- `docs/margot/SECOND-BRAIN-CARRY-FORWARD.md`
- `docs/margot/high-level-crm-25-step-forecast.md`
- `docs/margot/crm-operating-model.md`
- `docs/margot/crm-schema-inventory.md`

## Current focused CRM verification gate

Use this local, no-production-effects gate when CRM lead/contact/conversion/digest behavior changes:

```bash
npx jest tests/integration/api/marketing-leads.test.ts tests/integration/api/crm-leads-list.test.ts tests/unit/lib/crm/qualify-lead.test.ts tests/integration/api/crm-lead-conversion.test.ts tests/unit/margot-crm-contacts-opportunities-migration.test.ts tests/integration/api/crm-contacts-create.test.ts tests/integration/api/crm-opportunities-create.test.ts tests/unit/lib/crm/daily-digest.test.ts tests/integration/api/crm-daily-digest.test.ts tests/unit/lib/crm/activity-timeline.test.ts tests/unit/lib/crm/approval-lifecycle.test.ts --runInBand
npm run type-check
npm run security:routes-check
```

Voice ingress remains part of the CRM loop, but can be run as its own focused gate when voice code changes:

```bash
npx jest tests/integration/api/margot-voice-signed-url.test.ts tests/integration/api/margot-voice-task.test.ts tests/unit/margot-voice-failure-taxonomy.test.ts --runInBand
```

## Coverage matrix

| CRM area | Current source files | Current tests | Covered locally | Current status | Next safe gap |
| --- | --- | --- | --- | --- | --- |
| Marketing lead capture | `src/app/api/marketing/leads/route.ts`; `supabase/migrations/20260523100000_crm_leads.sql` | `tests/integration/api/marketing-leads.test.ts` | Valid lead persistence to `crm_leads`; consenting SendGrid subscribe attempt; SendGrid failure still captures CRM lead; missing CRM config; insert failure. | Covered with mocks/local route tests. | Add explicit invalid-payload/rate-limit assertions if this route changes again; decide privacy retention for IP/user-agent before production migration. |
| CRM lead list | `src/app/api/crm/leads/route.ts` | `tests/integration/api/crm-leads-list.test.ts` | Admin/service-role recent lead listing; safe missing-config error; safe read failure; invalid query rejected before Supabase; status/owner/source/limit filters. | Covered with mocks/local route tests. | Add auth-denial test if auth helper behavior changes; add pagination/cursor test before larger command-center lead queue. |
| Lead qualification helper | `src/lib/crm/qualify-lead.ts` | `tests/unit/lib/crm/qualify-lead.test.ts` | Deterministic scoring; qualified business lead; free-email needs-review path; nurture path; spam-risk path; purity/stability. | Covered as recommendation-only helper. | Add fixtures from real anonymized lead categories once approved; do not convert scores into auto-actions without Board rule. |
| Guarded lead-to-client conversion | `src/app/api/crm/leads/[id]/convert/route.ts`; `docs/margot/lead-to-client-conversion-plan.md` | `tests/integration/api/crm-lead-conversion.test.ts` | Exact UUID required; Board approval required before Supabase access; identity conflict; already-converted guard; exact conversion-field update when gates pass; best-effort sanitized `crm_timeline_lead_converted` `agent_actions` write after primary conversion success; timeline insert failure does not fail primary success; blank-company timeline labels use the lead UUID instead of raw email. | Covered as local guarded route/test contract; focused suite currently passes 7 tests and expanded CRM matrix passes 101 tests. | Add `nexus_clients` existence/identity verification before any production promotion; keep Board approval IDs out of persistence and route responses under review. |
| Contacts schema draft | `supabase/migrations/20260523103000_crm_contacts_opportunities.sql`; `docs/margot/crm-contacts-opportunities-model.md` | `tests/unit/margot-crm-contacts-opportunities-migration.test.ts` | Contact table exists in draft; identity/privacy/consent fields; RLS enabled; service-role policy; dedupe index; sandbox-first and no-secrets safety comments. | Covered as draft migration only; not applied here. | Apply/diff through `scripts/sandbox-wizard.sh` before any production path; add RLS/role tests if local DB harness becomes available. |
| Contacts create API | `src/app/api/crm/contacts/route.ts` | `tests/integration/api/crm-contacts-create.test.ts` | Lead-scoped contact creation; identity derivation; email/domain dedupe keys; safe defaults; blank default handling; missing identity; multi-link operator approval; no approval ID storage; invalid short approval; missing env; insert failure; invalid JSON. | Covered with mocks/local route tests. | Add duplicate contact conflict/read-before-write behavior before production use; add cross-client leakage abort fixtures. |
| Opportunities schema draft | `supabase/migrations/20260523103000_crm_contacts_opportunities.sql`; `docs/margot/crm-contacts-opportunities-model.md` | `tests/unit/margot-crm-contacts-opportunities-migration.test.ts` | Opportunity table exists in draft; forecast-only fields; stage/status/probability checks; linked contact/client/business/lead fields; approval fields; RLS/service-role policy; billing-truth separation comments. | Covered as draft migration only; not applied here. | Apply/diff through `scripts/sandbox-wizard.sh` before any production path; add RLS/role tests if local DB harness becomes available. |
| Opportunities create API | `src/app/api/crm/opportunities/route.ts` | `tests/integration/api/crm-opportunities-create.test.ts` | Admin and authenticated non-admin gates before CRM Supabase access; safe config/invalid JSON/invalid payload failures; snake_case opportunity insert; value currency defaults; explicit safe select columns; additionalData sensitive/oversize rejection; won/conversion-like opportunities require approval flags and Board approval id; Board approval id is not persisted; insert failure. | Covered with mocks/local route tests as forecast/pipeline truth only. | Add duplicate/conflict policy and activity/timeline event tests before broader use. |
| Daily CRM digest helper | `src/lib/crm/daily-digest.ts`; `docs/margot/daily-crm-digest-template.md` | `tests/unit/lib/crm/daily-digest.test.ts` | Summarizes leads, opportunities, tasks, blockers, approvals, verification, markdown, safety disclaimer, and empty-state copy without external calls. | Covered as pure helper. | Add integration mirror/project health sections after read contracts exist. |
| Daily CRM digest route | `src/app/api/crm/daily-digest/route.ts` | `tests/integration/api/crm-daily-digest.test.ts` | Lead digest for admin/service-role caller; blocked/high task inclusion; workspace-scoped task query; skip task reads when workspace scope missing; opportunity digest rows when `UNITE_CRM_OPPORTUNITIES_DIGEST_ENABLED=true`; safe lead/task/opportunity read failures; missing config; invalid query. | Covered with mocks/local route tests; latest progress log records 10-test focused route pass and 57-test expanded CRM gate pass. Opportunity reads are feature-flagged so deployments do not touch draft-only `crm_opportunities` until schema promotion/readiness is approved. | Add contacts digest section once contact read contract exists; add stale-integration summary after thresholds are defined. |
| Margot voice signed URL | `src/app/api/pi-ceo/margot-voice/signed-url/route.ts`; `src/components/command-center/voice/MargotVoicePanel.tsx` | `tests/integration/api/margot-voice-signed-url.test.ts`; `tests/unit/margot-voice-failure-taxonomy.test.ts` | Rate limit; missing ElevenLabs config; upstream non-OK; upstream unreachable; success no-store; operator-safe failure copy. | Covered in focused voice gate. | Add UI component-level regression if command-center voice panel rendering changes. |
| Margot voice-to-task ingress | `src/app/api/pi-ceo/margot-voice/task/route.ts`; `docs/margot/voice-task-schema-provenance.md` | `tests/integration/api/margot-voice-task.test.ts` | Bearer auth; rate limit; missing token/env; invalid JSON/packet; voice session insert failure; task insert failure; success no-store; summary truncation; defaults; approval-required blocked task behavior; repo-local generated type provenance for `tasks` and `voice_command_sessions`. | Covered in focused voice gate; latest refresh passed 3 voice suites / 28 tests. Migration provenance remains missing from repo-local SQL, so generated types are evidence, not production migration authority. | Add digest reader linkage test once command-center read surface is wired; recover or reconstruct sandbox-only migrations before schema-affecting work. |
| Client create/update | `src/app/api/empire/clients/route.ts`; `src/app/api/empire/clients/[slug]/route.ts`; `_record-action.ts` | `src/app/api/empire/clients/__tests__/`; `src/app/api/empire/clients/[slug]/__tests__/` | Existing route unit tests cover validation, slug race, email/website validation, unique violation mapping, audit action behavior, and PATCH validation. | Present but not re-run in this matrix lane. | Include client route suites in a wider CRM regression before touching `nexus_clients` conversion. |
| Activity/timeline | `src/lib/crm/activity-timeline.ts`; `supabase/migrations/20260510000004_nexus_agent_actions.sql`; `src/lib/empire/read-client-activity.ts`; `_record-action.ts`; `src/app/api/crm/leads/[id]/convert/route.ts` | `tests/unit/lib/crm/activity-timeline.test.ts`; `tests/integration/api/crm-lead-conversion.test.ts`; `src/app/api/empire/clients/__tests__/record-action.test.ts` plus client route tests | Local CRM timeline taxonomy now normalizes lead captured, lead qualified, lead converted, contact created, opportunity created, approval requested, task completed, and integration stale events; rejects unknown event types/missing identity; redacts secret-like metadata/values and Board approval ids; defensively re-sanitizes manually constructed events; maps sanitized events to the existing `agent_actions` insert payload without guessing UUID links. Local policy pins existing `agent_actions` as the next persistence target; no new dedicated timeline table or migration is in scope for this slice. The guarded lead conversion route is now wired to a best-effort sanitized `crm_timeline_lead_converted` row after primary conversion succeeds. | Covered as a pure local taxonomy/insert-mapping helper plus one local mocked route write contract; remaining mutation route writes are not broadly wired. | Add route-level event-write tests before wiring contact/opportunity/other CRM mutation routes to `agent_actions` timeline rows. |
| Integration mirrors | `supabase/migrations/20260513000200_integration_schema.sql`; `src/app/api/empire/sources/*`; `src/lib/empire/*` readers | Existing integration/source tests not audited in this lane. | Mirror schema exists for Linear/GitHub/Vercel/Railway/DO/Supabase/1Password/Stripe/Composio. | Partial; source-of-truth labels documented but not fully tested here. | Add stale-sync threshold tests and command-center/digest rollup tests; never store secret values. |
| Approvals | Voice task convention: `tasks.status='blocked'`, assignee `Phill approval`; opportunity draft fields; `src/lib/crm/approval-lifecycle.ts`; `docs/margot/crm-approval-persistence-plan.md` | Voice task tests; daily digest route/helper tests; migration draft tests; `tests/unit/lib/crm/approval-lifecycle.test.ts` | Approval-required voice tasks become blocked; daily digest surfaces blocked/high tasks; opportunities include approval fields in draft schema; local helper classifies requested, approved, rejected, cancelled, expired, and executed lifecycle states without writes or auto-execution authority; local task-evidence mapper converts Stage 1 approval tasks into lifecycle input without treating completed tasks as executed and without echoing approval references, Board IDs, approvers, rejection reasons, or malformed enum values in operator-facing reasons. Persistence plan keeps current task subtype as Stage 1 and defers a dedicated `crm_approvals` table until structured approval history/query needs are proven. | Covered as pure local decision support plus documented persistence decision and task-evidence mapper; no dedicated approval migration created or applied. | Add sanitized approval event-write tests before route writes; draft `crm_approvals` only after sandbox-first triggers are met. |
| Command-center CRM UI | Command-center components/routes to be mapped in later lane | Not currently matrixed | N/A | Gap. | Add component/API tests once CRM lead/digest surfaces are wired into UI. |
| Mac Mini recovery artifacts | `docs/margot/recovered-from-mac-mini/` | Health-check/progress-log evidence only | Directory exists; currently only `.gitkeep`; SMB reachable, SSH unavailable, no mounted share. | Blocked on authenticated transport. | Retry safe mount/SSH checks each run; copy only approved target files when authenticated access exists. |

## Required gates before specific changes

| Change type | Minimum local gate | Extra boundary |
| --- | --- | --- |
| Lead capture/list/qualification/digest helper/route change | Current focused CRM verification gate above | No production DB write; route remains server-side/service-role only. |
| Lead conversion change | `crm-lead-conversion`, lead-list, marketing-leads, qualify-lead, daily-digest tests plus type-check | Board approval semantics must stay explicit; no client overwrite without strong identity match. |
| Contact API/schema change | `crm-contacts-create`, contacts/opportunities migration guard, lead conversion tests, type-check, security route check | Sandbox wizard before any schema application; no multi-client merge without approval. |
| Opportunity schema/route change | Migration guard plus new route tests written RED first | Keep opportunity as forecast/pipeline truth; Stripe remains billing truth. |
| Voice ingress change | Focused voice gate plus daily digest if task output shape changes | No real ElevenLabs/Supabase production calls in tests. |
| Command-center UI change | Component/route tests for the touched surface plus CRM route/helper gate if data contract changes | Avoid direct browser writes to sensitive CRM tables. |
| Schema migration | Migration guard tests plus `./scripts/sandbox-wizard.sh apply <migration.sql>` and `./scripts/sandbox-wizard.sh diff` before promotion | Production promotion requires explicit typed approval through the wizard. |

## Ordered next coverage gaps

1. Command-center CRM UI read surface tests for leads, approvals, opportunities, and daily digest.
2. Integration stale-sync threshold tests for Linear/GitHub/Vercel/Supabase mirrors.
3. Digest reader linkage test for voice-created `tasks` once command-center read surface is wired.
4. Wider regression including existing `src/app/api/empire/clients/**/__tests__` before any `nexus_clients` conversion work.
5. Recover original migrations or reconstruct sandbox-only migration proposals for `tasks` and `voice_command_sessions`; do not apply directly to production.

## Safety notes

- This matrix is a local planning/test artifact.
- Do not apply migrations directly to production.
- Do not use `psql`, `supabase db push`, or Supabase production migration tools outside the sandbox wizard path.
- Do not print or store secrets.
- Do not post Linear/GitHub/Vercel/client-facing updates automatically from this matrix.
- Treat all scoring and digest output as operator decision support, not autonomous approval.
