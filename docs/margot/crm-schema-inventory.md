# Margot CRM Schema Inventory

Date: 2026-05-23 07:24 AEST
Project: Unite-Group
Owner: Margot
Scope: Existing local assets only: migrations, routes, helpers, and tests in this repository.

Read first: `docs/margot/CONNECTED-TEAMS-OPERATING-RULES.md`

## 1. Purpose and source-of-truth rule

This document is the current CRM schema inventory and source-of-truth map for the Unite-Group CRM spine. It exists to prevent drift while Margot expands from lead capture and client management into contacts, opportunities, approvals, timeline events, command-center UI, and daily digest reporting.

Source-of-truth rule:

- Supabase tables are the CRM system of record only where a local migration and current read/write path exist.
- External execution and finance systems remain authoritative for their own domains; the CRM stores links, mirrors, health summaries, tasks, and operator interpretation.
- Repo docs are the durable 2nd Brain and planning source until a production-backed CRM object exists and is verified.
- Service-role server routes may write CRM records when already scoped and tested. Browser/client code should not write sensitive CRM tables directly.
- Production writes, deployments, schema promotion, cross-client merges, billing/payment actions, and client-facing communications require explicit Phill/Board approval.

## 2. Inventory table

Column policy for this inventory:

- Tables with local migrations list the CRM-relevant columns in the table row or in the detailed column section below.
- Tables that are referenced by code but have no local migration (`tasks`, `voice_command_sessions`) are marked as schema-provenance gaps rather than treated as fully known.
- Integration mirror tables are grouped in the main map for readability and enumerated table-by-table in [Section 2A](#2a-integration-mirror-table-column-index).

| Object / table | Current role | Migration / source | Current writers | Current readers | Tests | Source-of-truth status | Gaps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public.businesses` | Portfolio business / operating-unit identity. Nexus migration adds CRM-facing keys and ARR field. | `supabase/migrations/20260510000001_nexus_businesses.sql` adds `pi_ceo_key`, `linear_project_id`, `website_url`, `arr_aud`; indexes `slug`, `status`; table comment says one row per business / empire source of truth. | No CRM writer inspected in this pass. Existing table pre-dates local migration. | Business 360 surface indirectly via seeded tiles plus health snapshots in `src/lib/empire/read-business-360.ts`; `crm_leads` can reference `matched_business_id`; `agent_actions.business_id` can reference it. | No focused business-table tests found in requested scope. | Source of truth for portfolio business identity when row exists; integrations enrich but should not overwrite identity. | Need explicit business create/update route and tests if Margot is to manage businesses; need identity-resolution rule for `pi_ceo_key`, slug, Linear project ID, and website domain. |
| `public.nexus_clients` | Paying/onboarding/active external client record. Core CRM client table. | `supabase/migrations/20260510000002_nexus_clients.sql` creates `id`, `slug`, company/contact/web/Stripe/plan/status/Linear/onboarding/`pi_ceo_key`/`brand_config` fields; RLS service-role full access and authenticated read. | `src/app/api/empire/clients/route.ts` POST inserts onboarding clients; `src/app/api/empire/clients/[slug]/route.ts` PATCH updates client fields/status/brand and portal content where present. Future conversion should write here only after identity/approval gates. | `src/lib/empire/list-nexus-clients.ts`; client edit route reads updated row; `crm_leads.matched_client_id` and `converted_client_id` reference it. | Client route unit tests under `src/app/api/empire/clients/__tests__/` and `[slug]/__tests__/`: validation, slug race, email/website validation, unique violation mapping, record-action, PATCH validation. | Current Supabase source of truth for external client lifecycle and client cockpit identity. | Contact model is embedded (`contact_name`, `contact_email`) not normalized; no lead conversion route; no opportunity/account-health history; migration lacks `updated_at`; plan/status set is narrow. |
| `public.agent_actions` | Append-oriented agent/audit timeline for Margot/Board/PM/orchestrator/system events, including client create/update audit entries. | `supabase/migrations/20260510000004_nexus_agent_actions.sql`; fields include `source`, `action_type`, `payload`, `idea_text`, `business_id`, legacy `client_id` reference to `public.clients`, `linear_ticket_id`, `status`, parent/created/resolved. | `src/app/api/empire/clients/_record-action.ts` writes `client_created` / `client_updated` after client POST/PATCH; failures are non-fatal and logged. | `src/lib/empire/read-client-activity.ts` reads client actions by `payload->>slug`; command-center ActivityLog / GlobalStatusBar referenced by comments. | `src/app/api/empire/clients/__tests__/record-action.test.ts`; client route tests cover audit behavior indirectly. | Current audit/event source for client mutations and agent pipeline events. | `client_id` FK targets legacy `public.clients`, not `nexus_clients`; no dedicated CRM timeline table; event taxonomy not formalized for leads/opportunities/tasks/approvals; no append-only guard beyond convention. |
| `public.crm_leads` | Public marketing lead intake persistence. First-class CRM lead record before qualification/conversion. | `supabase/migrations/20260523100000_crm_leads.sql`; columns: `id`, `first_name`, `last_name`, `email`, `phone`, `company`, `job_title`, `message`, `interests`, `referral_source`, `marketing_consent`, `email_list_id`, `source`, `status`, `qualification_score`, `assigned_owner`, `matched_client_id`, `matched_business_id`, `converted_client_id`, `ip_address`, `user_agent`, `additional_data`, `captured_at`, `created_at`, `updated_at`, `converted_at`; status and score checks; service-role-only RLS policy. | `src/app/api/marketing/leads/route.ts` POST validates public form data, optionally attempts SendGrid subscription, then inserts into `crm_leads` with `status='new'`, `source='website_form'`, `assigned_owner='Margot'`. | `src/app/api/crm/leads/route.ts` GET lists recent leads for admin/service-role callers with optional `status`, `owner`, `source`, and `limit` filters. | `tests/integration/api/marketing-leads.test.ts` covers valid persistence, SendGrid failure still capturing CRM lead, missing CRM env, insert failure. `tests/integration/api/crm-leads-list.test.ts` covers list success, missing env, read failure, and filters. | Local code/migration source of truth for website-form leads once the migration is applied to the target Supabase environment. SendGrid is side integration, not source of truth. | Need qualification helper, conversion flow, duplicate/identity handling, privacy retention decision for IP/user-agent, RLS/read role policy for command center. |
| `public.tasks` | Work queue for Margot/agent/human tasks created from voice commands; approval-required commands become blocked tasks. | No local migration containing `tasks` found under `supabase/migrations` during this pass. Table is inferred from route usage and existing app schema. | `src/app/api/pi-ceo/margot-voice/task/route.ts` inserts title, description, status, priority, assignee, tags, position, and `obsidian_path` after voice session insert. | Not inspected as a reader in requested files; task rows are intended for command center / daily digest. | `tests/integration/api/margot-voice-task.test.ts` covers auth, rate limit, env missing, invalid JSON/packet, voice insert failure, task insert failure, success, defaults/truncation, approval-required status. | Operational task queue source where schema exists in deployed/local DB, but not locally documented by migration. | Need local schema/migration inventory source for `tasks`; decide CRM task fields and ownership; connect leads/clients/opportunities; define approval subtype or relation. |
| `public.voice_command_sessions` | Durable capture of spoken operator requests and parsed intent before task creation. | No local migration containing `voice_command_sessions` found under `supabase/migrations` during this pass. Table is inferred from route usage and tests. | `src/app/api/pi-ceo/margot-voice/task/route.ts` inserts org/user/transcript/parsed intent/status/language. | Returned to caller as `crm_session_id`; future command center/digest should read by task/session relation. | `tests/integration/api/margot-voice-task.test.ts`; related signed-url coverage in `tests/integration/api/margot-voice-signed-url.test.ts`; failure taxonomy in `tests/unit/margot-voice-failure-taxonomy.test.ts`. | Source of truth for voice-command transcript/intent where table exists, but local migration is missing. | Need schema provenance; link sessions to tasks with explicit FK if possible; define retention/privacy for transcripts; surface approval-required sessions in digest. |
| `public.integration_sync_state` | Per-integration sync health metadata for read-only mirrors. | `supabase/migrations/20260513000200_integration_schema.sql`. | Integration-specific sync jobs/routes outside this pass; service-role write policy. | Empire dashboard / command center surfaces are intended readers. | Not audited in this pass. | Source of truth for CRM mirror freshness, not for external data itself. | Need digest health rollup and stale-sync thresholds. |
| `public.integration_github_*` | GitHub mirror: repos, PRs, commits, Actions runs, secret-name index. | `supabase/migrations/20260513000200_integration_schema.sql`. | GitHub sync writer path outside requested scope. | Command center / project portfolio can read. | Not audited in this pass. | GitHub remains source of truth; tables are Supabase mirrors. | Need client/business/project linking and alert rules. Secret index must remain names only. |
| `public.integration_vercel_*` | Vercel mirror: projects, deployments, env key index. | `supabase/migrations/20260513000200_integration_schema.sql`. | Vercel sync writer path outside requested scope. | Command center / project health readers. | Not audited in this pass. | Vercel remains source of truth; CRM mirror stores deployment/env health. | Env index stores metadata only; no value storage. Need production change approval gates and digest rules. |
| `public.integration_railway_*` | Railway mirror: services and deployments. | `supabase/migrations/20260513000200_integration_schema.sql`. | Railway sync writer path outside requested scope. | Project/runtime health readers. | Not audited in this pass. | Railway remains source of truth; CRM mirror is read-only health surface. | Need project/client mapping. |
| `public.integration_do_*` | DigitalOcean mirror: apps, droplets, databases, cost/status metadata. | `supabase/migrations/20260513000200_integration_schema.sql`. | DO sync writer path outside requested scope. | Runtime/cost health readers. | Not audited in this pass. | DigitalOcean remains source of truth; CRM mirror summarizes health/cost. | Need cost/risk thresholds and owner tasks. |
| `public.integration_supabase_*` | Supabase project/advisor mirror. | `supabase/migrations/20260513000200_integration_schema.sql`. | Supabase sync writer path outside requested scope. | Infra health / advisor readers. | Not audited in this pass. | Supabase dashboard/advisor remains source of truth; mirror feeds command center. | Need advisor triage and sandbox/prod separation in UI. |
| `public.integration_onepassword_index` | 1Password inventory index with vault/item/category names only. | `supabase/migrations/20260513000200_integration_schema.sql`. | 1Password sync writer path outside requested scope. | Access readiness / secret inventory readers. | Not audited in this pass. | 1Password remains source of truth. CRM stores names only, never secret values. | Need missing-access queue and least-privilege staging view. |
| `public.integration_linear_*` | Linear mirror: teams, projects, issues. Execution/project state. | `supabase/migrations/20260513000200_integration_schema.sql`. | Linear sync writer path outside requested scope. | Project portfolio, CRM tasks/digest, client activity surfaces. | Not audited in this pass. | Linear remains source of truth for execution state; CRM mirrors and interprets. | Need mapping from `nexus_clients.linear_project_id` / `businesses.linear_project_id` to Linear project/issue rows. |
| `public.integration_stripe_*` | Stripe mirror: subscriptions and monthly invoice rollup. | `supabase/migrations/20260513000200_integration_schema.sql`. | Stripe sync writer path outside requested scope. | Revenue/client health readers; `nexus_clients` stores customer/subscription IDs. | Not audited in this pass. | Stripe remains source of truth for billing/revenue. CRM stores links/status summaries. | Financial writes are out of bounds; need read-only revenue risk rules. |
| `public.integration_composio_connections` | Composio connection status mirror for future email/calendar/tooling integrations. | `supabase/migrations/20260513000200_integration_schema.sql`. | Composio sync writer path outside requested scope. | Access/integration readiness readers. | Not audited in this pass. | Composio remains source of truth; CRM mirror tracks connection health. | Need explicit use cases before writes or automation. |
| `public.pi_ceo_health_snapshots` | Business/project health snapshot source used by Business 360 helper. | Not in requested migration list; inferred from `src/lib/empire/read-business-360.ts`. | Writer not inspected. | `src/lib/empire/read-business-360.ts` reads recent snapshots and overlays seed Business 360 tiles. | Not audited in this pass. | Current health-snapshot source where present; not a CRM identity table. | Need migration/source provenance and mapping to `businesses` / Linear project IDs. |
| Draft `crm_contacts` | Canonical people/contact map for leads, clients, businesses, and stakeholders. | `supabase/migrations/20260523103000_crm_contacts_opportunities.sql` drafts `display_name`, first/last, email/phone, role/company, lead/client/business links, source/consent, owner/status, dedupe keys, privacy scope, retention/privacy notes, verification time, timestamps, conservative checks, indexes, RLS, and service-role-only policy. | None yet; future writes must go through server routes/service-role code after sandbox verification. | None yet. | `tests/unit/margot-crm-contacts-opportunities-migration.test.ts` asserts the draft table, privacy/consent fields, RLS, service-role policy, and safety comments. | Draft local migration only; not applied to sandbox/prod in this tick. | Need sandbox-wizard apply/diff before promotion, contact create/link route, dedupe policy implementation, client-mixing abort tests, and command-center/digest readers. |
| Draft `crm_opportunities` | Forecast-only qualified commercial opportunities with stage/value/probability/source. | `supabase/migrations/20260523103000_crm_contacts_opportunities.sql` drafts name, stage/status, forecast value/currency/probability, expected close, source/owner, lead/contact/client/business links, next action, decision/risk, campaign/source details, close/lost metadata, approval flags/status, timestamps, checks, indexes, RLS, and service-role-only policy. | None yet; future writes must not imply billing truth and must respect approval gates. | None yet. | `tests/unit/margot-crm-contacts-opportunities-migration.test.ts` asserts the draft opportunity table, forecast/approval fields, RLS, service-role policy, and sandbox-first/billing-separation comments. | Draft local migration only; Stripe remains billing truth and this table is forecast/pipeline truth only after sandbox application. | Need sandbox-wizard apply/diff before promotion, opportunity draft route, mocked link/identity tests, daily digest query, and explicit approval route before any client mutation or external comms. |
| Approval task subtype; future `crm_approvals` only if justified | Human decision/permission gates for production, billing, client-facing, identity, and cross-client decisions. | No dedicated migration/source found. Voice route currently uses `tasks.status='blocked'`, high priority, assignee `Phill approval`, approval tags/reason. `docs/margot/crm-approval-persistence-plan.md` now chooses the current task subtype as Stage 1 and defers a dedicated `crm_approvals` table until structured approval history/query needs are proven. | Voice task route creates approval-needed tasks. Local mapper `buildCrmApprovalLifecycleInputFromTaskEvidence` converts task evidence into approval lifecycle input for decision support only; future writes still need sanitized timeline events before any new table. | Future command center/digest surfaces can read blocked/high approval tasks; dedicated approval reads wait for Stage 2. | Margot voice task tests cover approval-required task behavior; `tests/unit/lib/crm/approval-lifecycle.test.ts` covers lifecycle classification, task-evidence mapping, status normalization, expiry, high-risk gates, and returned-reason redaction. | Partial via task convention plus documented Stage 1 persistence decision and local mapper, not dedicated table. | Add sanitized event-write tests before route writes; draft `crm_approvals` only through sandbox-first process if Stage 2 triggers are met. |
| Proposed dedicated activity timeline table | Unified timeline across leads, clients, contacts, opportunities, tasks, approvals, integrations, and voice. | No migration/source found. Current event/audit table is `agent_actions`. | Client audit helper writes `agent_actions`; voice route writes sessions/tasks. | Client activity helper reads `agent_actions`. | Client record-action tests; Margot voice tests. | Partial via `agent_actions`; broader timeline is a gap. | Need event taxonomy, object references, and retention policy before introducing a new table. |

## 2A. Integration mirror table column index

All tables in this section are created by `supabase/migrations/20260513000200_integration_schema.sql`. They are CRM evidence mirrors only: the external provider remains source of truth.

| Table | Key columns from local migration | CRM use |
| --- | --- | --- |
| `integration_sync_state` | `integration`, `last_sync_started_at`, `last_sync_completed_at`, `last_sync_status`, `last_sync_error`, `rows_upserted`, `next_sync_due_at` | Mirror freshness and stale-sync alerts. |
| `integration_github_repos` | `id`, `name`, `owner`, `default_branch`, `is_private`, `last_pushed_at`, `open_prs_count`, `open_issues_count`, `fetched_at` | Repo/project health. |
| `integration_github_prs` | `id`, `repo`, `number`, `title`, `state`, `author_login`, `author_email`, `head_ref`, `base_ref`, `created_at`, `updated_at`, `merged_at`, `mergeable`, `ci_state`, `fetched_at` | PR delivery status and blockers. |
| `integration_github_commits` | `sha`, `repo`, `author_login`, `author_email`, `committed_at`, `message_subject`, `branch`, `fetched_at` | Engineering activity evidence. |
| `integration_github_actions_runs` | `id`, `repo`, `workflow_name`, `head_branch`, `head_sha`, `status`, `conclusion`, `started_at`, `completed_at`, `fetched_at` | CI health. |
| `integration_github_secrets_index` | `repo`, `secret_name`, `updated_at`, `fetched_at` | Names-only secret inventory; never secret values. |
| `integration_vercel_projects` | `id`, `name`, `framework`, `git_repo`, `production_url`, `last_deployment_id`, `last_deployment_state`, `last_deployment_at`, `fetched_at` | Deployment surface. |
| `integration_vercel_deployments` | `id`, `project_id`, `url`, `state`, `target`, `commit_sha`, `commit_message`, `ready_at`, `created_at`, `fetched_at` | Deployment history/health. |
| `integration_vercel_env_index` | `project_id`, `env_target`, `key`, `is_empty`, `value_length`, `updated_at`, `fetched_at` | Env metadata only; no values. |
| `integration_railway_services` | `id`, `project_id`, `name`, `last_deployment_id`, `last_deployment_status`, `last_deployment_at`, `service_url`, `fetched_at` | Runtime service health. |
| `integration_railway_deployments` | `id`, `service_id`, `status`, `commit_sha`, `created_at`, `finished_at`, `fetched_at` | Railway deployment evidence. |
| `integration_do_apps` | `id`, `name`, `project_name`, `region`, `live_url`, `active_deployment_id`, `active_deployment_phase`, `last_deployment_phase`, `last_deployment_progress_at`, `fetched_at` | DigitalOcean app health. |
| `integration_do_droplets` | `id`, `name`, `region`, `size`, `status`, `ipv4`, `created_at`, `monthly_cost_usd`, `fetched_at` | Infra/cost watch. |
| `integration_do_databases` | `id`, `name`, `engine`, `version`, `status`, `region`, `monthly_cost_usd`, `fetched_at` | Database health/cost watch. |
| `integration_supabase_projects` | `ref`, `name`, `region`, `status`, `pg_version`, `total_advisor_findings`, `advisor_errors`, `advisor_warns`, `advisor_infos`, `fetched_at` | Supabase project health. |
| `integration_supabase_advisor_findings` | `id`, `project_ref`, `finding_name`, `severity`, `detail`, `resource_name`, `fetched_at` | Security/performance advisory queue. |
| `integration_onepassword_index` | `vault`, `item_name`, `category`, `last_modified`, `fetched_at` | Credential inventory by name only. |
| `integration_linear_teams` | `id`, `name`, `key`, `active_cycle_id`, `fetched_at` | Linear team identity. |
| `integration_linear_projects` | `id`, `name`, `team_id`, `state`, `progress`, `fetched_at` | Project execution mirror. |
| `integration_linear_issues` | `id`, `team_id`, `project_id`, `title`, `state_name`, `state_type`, `priority`, `assignee_id`, `assignee_name`, `created_at`, `updated_at`, `completed_at`, `fetched_at` | Task/ticket execution mirror. |
| `integration_stripe_subscriptions` | `id`, `customer_id`, `status`, `current_period_end`, `monthly_amount_aud`, `product_name`, `created_at`, `fetched_at` | Revenue/client-health mirror. |
| `integration_stripe_invoices_mtd` | `yyyymm`, `total_aud`, `paid_aud`, `outstanding_aud`, `fetched_at` | Monthly revenue/receivables mirror. |
| `integration_composio_connections` | `id`, `toolkit_slug`, `user_email`, `status`, `last_used_at`, `fetched_at` | Future email/calendar/tooling connection health. |

## 2B. `src/lib/empire/*` reader inventory

The requested helper scope was inspected and mapped as follows:

| Helper | Tables read | CRM relevance |
| --- | --- | --- |
| `src/lib/empire/list-nexus-clients.ts` | `nexus_clients` | Client index / cockpit client list. |
| `src/lib/empire/read-client-activity.ts` | `agent_actions` | Client activity by `payload->>slug`. |
| `src/lib/empire/read-activity-feed.ts` | `agent_actions` | Command-center activity feed. |
| `src/lib/empire/read-agent-topology.ts` | `agent_actions` | Agent topology / pipeline visibility. |
| `src/lib/empire/read-global-status.ts` | `agent_actions` | Global status bar counts. |
| `src/lib/empire/read-business-360.ts` | `pi_ceo_health_snapshots` | Business 360 health overlay. |
| `src/lib/empire/read-portfolio-summary.ts` | `pi_ceo_health_snapshots`, `businesses` | Portfolio summary. |
| `src/lib/empire/read-data-room-health.ts` | `data_room_documents` | Data-room evidence health; adjacent to CRM but not an identity source. |

## 3. Current CRM spine summary

Current working spine from local assets:

1. `businesses` is the portfolio/business identity anchor where rows exist. The Nexus migration adds keys needed for command-center mapping (`pi_ceo_key`, `linear_project_id`, website, ARR).
2. `nexus_clients` is the current client lifecycle source of truth. The create/update API routes write it through admin-gated server routes and emit audit entries.
3. `agent_actions` is the current audit/event surface. Client create/update events are written here and read back for client activity.
4. `crm_leads` is the local code/migration target for public website lead intake. The marketing lead route validates submissions, optionally calls SendGrid, then persists the CRM lead when the target Supabase environment has the migration applied. SendGrid failure is non-fatal; CRM persistence failure is fatal to the request. The admin/service-role CRM leads route now lists recent leads with status/owner/source filters for command-center visibility.
5. `voice_command_sessions` plus `tasks` form the current voice-to-work queue. The local migrations for these tables were not found, but the route and tests establish the current contract.
6. `integration_*` tables are read-only mirrors for GitHub, Vercel, Railway, DigitalOcean, Supabase, 1Password, Linear, Stripe, and Composio. Their providers remain source of truth; Supabase mirrors feed CRM/project/command-center visibility.
7. `pi_ceo_health_snapshots` feeds Business 360 but needs provenance captured if it becomes part of the formal CRM schema map.

The local CRM code path and documented schema are therefore ready for:

- website lead capture into `crm_leads` after target-environment migration application,
- client create/update into `nexus_clients`,
- client audit events in `agent_actions`,
- voice task creation into `voice_command_sessions` and `tasks`,
- read-only project/integration health mirrors.

The CRM is not yet complete for:

- tested lead qualification helper exists locally (`src/lib/crm/qualify-lead.ts`), but it remains recommendation-only and is not yet wired into lead capture, command-center UI, conversion, assignment, or outreach,
- canonical contacts,
- opportunities,
- durable approvals,
- unified timeline/event model,
- daily digest querying.

## 4. Known gaps queue ordered for next build lanes

1. Lead qualification helper
   - Local deterministic helper now exists at `src/lib/crm/qualify-lead.ts` with Vitest coverage in `src/lib/crm/__tests__/qualify-lead.test.ts`.
   - It returns score, band, transparent reasons, and `recommendationOnly: true` without AI, external calls, DB reads, DB writes, assignment, conversion, or outreach authority.
   - Next: wire it into a mocked read/list or digest lane only after command-center visibility is in place.
   - Recommendation-only until Board approves auto-assignment/conversion rules.

2. Conversion plan/tests
   - Draft state machine for lead -> contact/opportunity/client.
   - Add tests before route implementation.
   - Do not convert or merge identities without strong match or explicit approval.
   - Conversion should update `crm_leads.status`, `converted_client_id`, `converted_at`, and write an audit/timeline event.

3. Contacts
   - Draft `crm_contacts` migration now exists locally in `supabase/migrations/20260523103000_crm_contacts_opportunities.sql` and is guarded by `tests/unit/margot-crm-contacts-opportunities-migration.test.ts`.
   - Next: apply/diff through the sandbox wizard before any promotion, then add server-route/mocked tests for contact creation/linking.
   - Implement links to lead/client/business, role/title, consent/source, primary email/phone, dedupe keys, and privacy boundaries.
   - Add cross-client leakage abort rules.

4. Opportunities
   - Draft `crm_opportunities` migration now exists locally in `supabase/migrations/20260523103000_crm_contacts_opportunities.sql` and is guarded by `tests/unit/margot-crm-contacts-opportunities-migration.test.ts`.
   - Next: apply/diff through the sandbox wizard before any promotion, then add server-route/mocked tests for opportunity drafts.
   - Keep commercial forecasts separate from Stripe billing truth.

5. Approvals
   - Decide whether approvals remain task subtype or become `crm_approvals`.
   - Required states: requested, approved, rejected, expired/cancelled, executed.
   - Required links: requester, approver, reason, scope, risk, related object, audit event.

6. Timeline/event model
   - Route-level event-write tests must prove existing `agent_actions` can carry sanitized timeline events before any dedicated activity timeline table is reconsidered.
   - Must support lead/client/contact/opportunity/task/approval/integration/voice references.
   - Define event taxonomy before broad writes.

7. Command-center UI
   - Surface leads, approval-needed tasks, stale integrations, client activity, and health snapshots.
   - Avoid direct client-side writes to CRM tables.
   - Respect source-of-truth labels: CRM source vs mirror vs external provider.

8. Daily digest
   - Query CRM health, new leads, qualified leads, blocked approvals, task movement, client updates, integration risk, and decisions needed.
   - The digest should report facts from local/Supabase mirrors and mark unknowns rather than inventing external status.

## 5. Board/production boundaries

Allowed now by default:

- Local repo/code/doc inspection.
- Local documentation updates like this inventory.
- Local tests using mocks.
- Draft migrations and implementation plans.
- Safe local verification (`test -f`, `npm run type-check`, focused Jest tests where scoped).

Draft first or ask Phill/Board before action:

- Production database migrations or writes.
- Any `supabase db push`, direct `psql` write, or production schema change.
- Deployments or Vercel environment mutations.
- GitHub pushes/PR creation unless explicitly scoped.
- Client-facing communications.
- Billing, banking, refunds, payroll, payments, transfers, card changes.
- Cross-client data merges or permanent identity decisions.
- Permanent business rules for auto-conversion, auto-approval, or financial action.

Block immediately:

- Missing identity where client/context leakage is possible.
- Secret/token exposure.
- Destructive git/filesystem operations not explicitly approved.
- Any production-write path without explicit Board approval.

Sandbox rule:

- Any schema change must go through the repo sandbox wizard before production promotion: `./scripts/sandbox-wizard.sh apply <migration.sql>`.
- Do not apply migrations to production from this inventory task.

## 6. Verification commands

Lightweight verification for this document:

```bash
test -f docs/margot/crm-schema-inventory.md
npm run type-check
```

Additional focused checks available for adjacent code lanes, not run as part of this doc-only lane unless separately recorded in the progress log:

```bash
npx jest tests/integration/api/marketing-leads.test.ts --runInBand
npx jest tests/integration/api/margot-voice-task.test.ts tests/integration/api/margot-voice-signed-url.test.ts tests/unit/margot-voice-failure-taxonomy.test.ts --runInBand
```
