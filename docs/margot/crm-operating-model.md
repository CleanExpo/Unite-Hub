# Margot CRM Operating Model

Date: 2026-05-23 11:29 AEST
Owner: Margot
Project: Unite-Group
Strategic lens: build the CRM into Phill's daily operating cockpit for a $2B Unite-Group business.

## Purpose

The Unite-Group CRM is not a generic contact list. It is the operating layer where Margot turns inbound signals into durable business memory, prioritized work, client/project visibility, marketing strategy, integration awareness, and verified next actions.

This model carries forward:

- `docs/margot/SENIOR-PROJECT-MANAGER-OPERATING-MODEL.md`
- `docs/margot/SECOND-BRAIN-CARRY-FORWARD.md`
- `docs/margot/high-level-crm-25-step-forecast.md`
- `docs/margot/access-and-data-requirements.md`

## Desired End State

Every important signal should become one or more of:

1. A CRM event or audit record.
2. A lead, contact, client, opportunity, task, approval, project, or artifact update.
3. A Linear/project-management action when execution is needed.
4. A 2nd Brain memory update when durable context changed.
5. A morning digest / command-center surface item when Phill needs awareness or decision-making.
6. A blocked item with a clear prerequisite when safe automation cannot continue.

## Canonical CRM Loop

```text
Inbound signal
  -> classify domain
  -> normalize payload
  -> resolve identity
  -> attach to CRM object(s)
  -> decide action class
  -> write event / task / draft / blocker
  -> sync execution system when needed
  -> verify output
  -> surface in command center + daily digest
  -> update 2nd Brain if context changed
```

Domains:

- CRM: leads, contacts, clients, opportunities, tasks, approvals, timeline.
- Project delivery: active projects, Linear issues, GitHub/Vercel/infra evidence, blockers.
- Client 2nd Brain: relationship history, decisions, brand voice, context, risks, artifacts.
- Marketing strategy: ICP, offers, content/SEO, campaign calendar, conversion path, performance signals.
- Integrations: Supabase, Linear, GitHub, Vercel, Stripe, 1Password index names, Composio, Google/Email when connected.
- AI/LLM enhancements: model/tool evaluations, workflow improvements, retrieval upgrades, safe adoption plans.

## Core CRM Objects

| Object | Plain-English definition | Current evidence | Target source of truth |
| --- | --- | --- | --- |
| Business | Unite-Group portfolio business or operating unit | `businesses` table extended by `20260510000001_nexus_businesses.sql`; Business 360 helper | Supabase `businesses` |
| Client | Paying/active/onboarding external client | `nexus_clients`; client create/update APIs | Supabase `nexus_clients` |
| Contact | Person tied to a business/client/lead | Draft `crm_contacts` migration exists locally; `src/app/api/crm/contacts/route.ts` and `tests/integration/api/crm-contacts-create.test.ts` cover guarded local contact creation with mocks | Proposed Supabase `crm_contacts` after sandbox-first application; local route/test contract exists now |
| Lead | Prospect or inbound form submission before qualification | `src/app/api/marketing/leads/route.ts` validates, optionally subscribes to SendGrid, and writes `crm_leads`; `src/app/api/crm/leads/route.ts` lists recent leads for command-center visibility; `src/lib/crm/qualify-lead.ts` provides recommendation-only scoring | Supabase `crm_leads` once the local migration is applied to the target environment; SendGrid remains a side integration |
| Opportunity | Qualified commercial possibility with value/stage/probability | Draft `crm_opportunities` migration exists locally; `src/app/api/crm/opportunities/route.ts` and `tests/integration/api/crm-opportunities-create.test.ts` cover guarded local forecast-only creation with mocks | Proposed Supabase `crm_opportunities` after sandbox-first application; local route/test contract exists now |
| Task | Work item for Margot, Phill, agent, or human owner | Margot voice route writes `tasks`; Linear mirror exists | Supabase `tasks` for app tasks, Linear for execution queue |
| Approval | Human decision or permission gate | Voice route blocks approval-required work by assignee/status; `src/lib/crm/approval-lifecycle.ts` provides pure local classification/recommendation for requested, approved, rejected, cancelled, expired, and executed states; no dedicated approval table yet | Proposed `crm_approvals` or task subtype |
| Project | Delivery initiative connected to client/business/revenue | Linear mirror tables; local project docs | Linear for execution status, Supabase mirror for cockpit |
| Ticket | Execution issue / engineering work item | `integration_linear_issues`; GitHub PR/issue mirrors | Linear/GitHub, mirrored into Supabase |
| Activity/Event | Timeline record of something that happened | `agent_actions` for client create/update and agent events; `src/lib/crm/activity-timeline.ts` now maps sanitized CRM timeline events to `agent_actions` insert payloads | Supabase `agent_actions` is the local next persistence target; a dedicated timeline table remains out of scope unless later query/RLS needs justify a separately reviewed migration |
| Integration Account | External-system identity or sync state | `integration_*` tables and `integration_sync_state` | Supabase integration mirrors |
| Voice Command | Spoken operator request converted to CRM task | `voice_command_sessions`, `tasks` writes in Margot route | Supabase voice/task tables |
| Document/Artifact | Durable file, report, plan, recovered file, client doc | `docs/margot/*`; recovered Mac Mini destination | Repo docs now; future Drive/Docs integration when scoped |

## Source-of-Truth Matrix

| Data type | Source of truth | Mirror / surface | Conflict rule |
| --- | --- | --- | --- |
| Client identity and CRM client lifecycle | Supabase `nexus_clients` | Command Center, client portal, daily digest | Supabase wins over derived UI state; manual changes require audit event |
| Portfolio business identity | Supabase `businesses` | Business 360 / command-center tiles | Supabase wins; integrations enrich but do not overwrite identity |
| Lead intake | Proposed Supabase `crm_leads` | SendGrid subscription and command-center queue | CRM lead record must exist even if marketing email sync fails; migration remains sandbox-first before target-environment truth |
| Billing/revenue truth | Stripe | `integration_stripe_*` mirror | Stripe wins; CRM stores links/status summaries only |
| Engineering/project execution | Linear and GitHub | `integration_linear_*`, `integration_github_*` | Execution system wins for state; CRM stores operator interpretation and next action |
| Deployment/runtime health | Vercel/Railway/DigitalOcean/Supabase | `integration_vercel_*`, `integration_railway_*`, `integration_do_*`, `integration_supabase_*` | Provider wins; CRM surfaces risk and owner action |
| Credentials inventory | 1Password | `integration_onepassword_index` names only | Never store secret values in CRM/docs |
| Voice tasks | Supabase `voice_command_sessions` + `tasks` | Command Center / daily digest | Approval-required voice actions remain blocked until Phill approves |
| Agent audit | Supabase `agent_actions` | Activity log / GlobalStatusBar / digest | Append-only by default; failed audit write is reported but does not undo already-safe mutations |
| 2nd Brain context | Repo docs now; future semantic store | Retrieval wrappers and Margot docs | Exact docs win when semantic confidence is low |

## Identity Resolution Policy

Margot should resolve real-world identity using the strongest non-secret keys available:

1. `client_slug` / `nexus_clients.slug`
2. `business_slug` / `businesses.slug`
3. `contact_email`
4. `website_domain`
5. `stripe_customer_id` / `stripe_subscription_id`
6. `linear_project_id`
7. `pi_ceo_key`
8. `github_repo`
9. `vercel_project_id`
10. `voice_command_session.id` / `packet_id`

Rules:

- Do not merge across clients/businesses unless at least two strong identifiers align or Phill has explicitly scoped the merge.
- Email domain alone is a hint, not proof, for multi-brand clients or agencies.
- Stripe customer ID, Linear project ID, and Supabase UUIDs are strong keys.
- Voice `business_context` is an operator hint and must be verified before client-sensitive writes.
- Any unresolved identity should produce a blocked/draft task, not a guessed CRM mutation.

## Margot Decision Classes

| Class | Meaning | Examples | Allowed now? |
| --- | --- | --- | --- |
| Auto-execute | Safe local or already-scoped action | Local docs, mock tests, repo inspection, progress logs, safe health checks | Yes |
| Draft | Prepare output without external side effects | Migration proposal, Linear comment text, client email draft, schema plan | Yes |
| Delegate | Send focused scoped work to a subagent/tool | Code review, schema inventory, doc reconstruction, test analysis | Yes when scope is local/safe |
| Ask Phill | Needs business judgment or permission | pipeline stages, urgent thresholds, send action, client-facing communication | Only when genuinely blocked |
| Block | Missing access, identity, or safety prerequisite | Mac Mini auth, prod DB migration, Vercel env mutation, unclear client identity | Record blocker and switch lane |
| Never do | Disallowed action | print secrets, destructive git, production DB write without wizard/approval, deploy without approval | No |

## Lead Persistence Operating Plan

Current evidence as of 2026-05-23 07:35 AEST:

- `supabase/migrations/20260523100000_crm_leads.sql` drafts the local `crm_leads` table.
- `src/app/api/marketing/leads/route.ts` validates public lead submissions, optionally adds consenting users to SendGrid, and persists a CRM lead using the service-role server route.
- `src/app/api/crm/leads/route.ts` lists recent CRM leads for admin/service-role command-center visibility with `status`, `owner`, `source`, and `limit` filters.
- `tests/integration/api/marketing-leads.test.ts` covers lead capture/persistence paths.
- `tests/integration/api/crm-leads-list.test.ts` covers recent lead listing, filters, missing configuration, and read failures.

Safe default:

1. Treat website leads as first-class CRM records, not just email-list subscribers.
2. Keep the local `crm_leads` migration draft and code path behind sandbox-first discipline before any production application.
3. Run any schema change through `./scripts/sandbox-wizard.sh apply migration.sql` before promotion.
4. Preserve SendGrid as a side integration; CRM persistence must not depend on SendGrid success.
5. Keep tests around validation failure, rate limit, SendGrid failure with CRM capture, CRM insert failure, listing filters, missing env, read failure, and no secret leakage.

Candidate `crm_leads` fields for proposal:

- `id uuid primary key`
- `first_name text not null`
- `last_name text`
- `email text not null`
- `phone text`
- `company text`
- `job_title text`
- `message text`
- `interests text`
- `referral_source text`
- `marketing_consent boolean default false`
- `email_list_id text`
- `source text default 'website_form'`
- `status text default 'new'`
- `qualification_score integer`
- `assigned_owner text default 'Margot'`
- `matched_client_id uuid nullable`
- `matched_business_id uuid nullable`
- `converted_client_id uuid nullable`
- `additional_data jsonb default '{}'`
- `ip_address inet/text with privacy decision pending`
- `user_agent text with retention decision pending`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Privacy note: IP/user-agent storage needs a retention and privacy decision before production migration. Until decided, prefer either short-retention analytics logging or store hashed/truncated values.

## Lead Qualification and Conversion Flow

Lead qualification is recommendation-only. `src/lib/crm/qualify-lead.ts` returns deterministic `score`, `band`, `reasons`, and `operatorNotes` from existing lead fields. It performs no network calls, makes no database writes, and must not be treated as authority to auto-create, merge, overwrite, or convert a client record without explicit identity gates and operator-approved conversion intent.

Current bands:

- `qualified`: prioritize human review; not approval to create a client record.
- `needs_review`: useful signal exists, but identity/business context needs confirmation.
- `nurture`: incomplete or low-intent lead that should remain in CRM without urgent conversion work.
- `spam_risk`: possible abuse or low-quality submission; do not discard automatically and avoid external follow-up until identity is checked.

```text
Lead captured
  -> CRM lead row created
  -> optional SendGrid subscription attempted
  -> Margot qualifies with source/interests/message/company/email
  -> identity match against existing clients/businesses/contacts
  -> if existing client: create follow-up task/activity
  -> if new opportunity: create opportunity and contact
  -> if approved/won: create or update nexus_clients row
  -> write agent_actions event
  -> sync Linear/project tasks if delivery is needed
  -> surface in daily digest
```

Conversion guardrails:

- Never overwrite an existing client from a lead without strong identity match.
- Do not create a paying client from a lead without Phill-approved business rule or explicit action.
- Keep original lead record immutable enough for attribution; use status/conversion fields instead of deleting.
- Record failed SendGrid sync as a non-fatal integration issue if CRM persistence succeeds.

## CRM Test Matrix

The detailed CRM coverage map now lives in:

`docs/margot/crm-test-coverage-matrix.md`

Use that matrix as the current local verification contract for lead capture, lead listing, qualification, guarded conversion, contacts, opportunities, daily digest, voice ingress, client audit, approvals, integration mirrors, command-center UI gaps, and Mac Mini recovery evidence.

Current focused CRM verification gate from the matrix:

```bash
npx jest tests/integration/api/marketing-leads.test.ts tests/integration/api/crm-leads-list.test.ts tests/unit/lib/crm/qualify-lead.test.ts tests/integration/api/crm-lead-conversion.test.ts tests/unit/margot-crm-contacts-opportunities-migration.test.ts tests/integration/api/crm-contacts-create.test.ts tests/integration/api/crm-opportunities-create.test.ts tests/unit/lib/crm/daily-digest.test.ts tests/integration/api/crm-daily-digest.test.ts tests/unit/lib/crm/activity-timeline.test.ts tests/unit/lib/crm/approval-lifecycle.test.ts --runInBand
npm run type-check
npm run security:routes-check
```

Voice ingress focused gate remains:

```bash
npx jest tests/integration/api/margot-voice-signed-url.test.ts tests/integration/api/margot-voice-task.test.ts tests/unit/margot-voice-failure-taxonomy.test.ts --runInBand
```

## Next Implementation Lanes

1. Add route-level event-write tests for lead/contact/opportunity/approval events using the local `agent_actions` mapping in `src/lib/crm/activity-timeline.ts`.
2. Decide the approval persistence shape (`crm_approvals` vs task subtype) before route writes; the pure local approval lifecycle helper/test now covers requested, approved, rejected, expired/cancelled, and executed states.
3. Add command-center CRM UI read-surface tests for leads, approvals, opportunities, and daily digest.
4. Add integration stale-sync threshold tests for Linear/GitHub/Vercel/Supabase mirrors.
5. Add a digest reader linkage test for voice-created `tasks` once the command-center read surface is wired.
6. Run wider existing client route regression before any `nexus_clients` conversion work.
7. Recover original migrations or reconstruct sandbox-only migration proposals for `tasks` and `voice_command_sessions` before schema-affecting work.
8. Keep the focused CRM matrix gate, Margot voice gate when touched, `npm run type-check`, and `npm run security:routes-check` green.
9. Continue Mac Mini recovery only through authenticated SMB/SSH or manual approved export.

## Evidence From This Pass

- Read Margot read-first docs and current reports.
- Inspected current CRM lead code and docs; lead persistence, lead list, and deterministic qualification helper are now present locally.
- Inspected `nexus_clients`, `agent_actions`, `businesses`, and integration schema migrations.
- Inspected client creation/audit route and Margot voice task route.
- Ran focused Margot voice verification:
  `npx jest tests/integration/api/margot-voice-signed-url.test.ts tests/integration/api/margot-voice-task.test.ts tests/unit/margot-voice-failure-taxonomy.test.ts --runInBand`
- Result: 3 suites passed, 28 tests passed.
