# Coverage — Unite-Hub

Date: 2026-06-07T09:05:13Z
Branch: `feat/24h-verify-and-harden`
PR: https://github.com/CleanExpo/Unite-Hub/pull/93

## Method

I treated a journey as **verified** only when I had a real command, HTTP response, GitHub check result, or build log to cite.

- **PASS** = the journey behaved as expected with live evidence.
- **FAIL** = the journey produced an incorrect runtime result.
- **UNKNOWN** = I did not have enough credentials / context / runtime access to verify it honestly.

## Coverage snapshot

- **Unauthenticated/local smoke targets verified:** 15 / 15 = **100% of attempted smoke targets**
- **Critical product journey catalogue:** 3 PASS / 8 total = **37.5% proven**
- **Remaining critical product journeys:** 5 UNKNOWN
- UNKNOWN rows are excluded from any "works" claim.

## Critical journeys

| Journey | Status | Evidence |
|---|---:|---|
| Auth redirect + login page render | PASS | no-follow `GET /` → `307 /auth/login?redirectTo=%2F`; `GET /auth/login` → `200 OK` |
| Health check | PASS | `GET /api/health` with Supabase env intentionally empty → `503` JSON `{ "status": "degraded", "connections": { "supabase": "error" } }` |
| Protected API unauthenticated safety | PASS | no-follow smokes for contacts, dashboard stats, integrations, email, video, social, Hermes gateway, Xero routes returned `307` to login or explicit `401`, not 500 |
| Contact create/list/update with authenticated founder data | UNKNOWN | Not exercised with authenticated session / live Supabase data |
| Email sync (Gmail + Outlook OAuth → import → contact creation) | UNKNOWN | Not exercised; requires integration credentials and authenticated flow |
| Drip campaign create → step → enroll → process | UNKNOWN | Not exercised end-to-end |
| Lead scoring | UNKNOWN | Not exercised with real scoring data |
| Multimedia upload + transcription | UNKNOWN | Not exercised with upload/transcription provider access |

## Build / PR status coverage

| Item | Status | Evidence |
|---|---:|---|
| Local type-check | PASS | `pnpm type-check` exit code 0 |
| Local lint | PASS | `pnpm lint` exit code 0 |
| Local full unit/integration suite | PASS | `pnpm vitest run` → `118 passed` files / `843 passed` tests |
| Local production build | UNKNOWN / BLOCKED | `pnpm build` stops in `prebuild` because this local shell has 0/7 critical/required env vars set; no production secrets were available or printed |
| GitHub Build Application | PASS | PR #93 job `79946073153` completed successfully for commit `f41abce4` |
| PR merge checks | PASS | PR #93 final check rollup all success/skipped; `mergeStateStatus=CLEAN` after resolving review threads |

## Notes

The runtime blocker fixed here was the missing-Supabase-env crash path in middleware / root redirect / health / server auth helpers. That restored public and unauthenticated smoke verification without fabricating auth or integration credentials.

This PR does **not** prove the product is sellable. The authenticated founder CRUD and provider-backed journeys remain UNKNOWN until approved test credentials/session strategy are available.

## Fresh update — 2026-06-07T10:24Z

### Added verified coverage

- **Google OAuth callback missing-env safety:** PASS. Before the fix, unauthenticated `GET /api/auth/google/callback` on the local missing-env dev server returned `500`. After the fix, the same live request returns `307` to `http://localhost:3004/auth/login`.
- **Google OAuth redirect construction without `NEXT_PUBLIC_APP_URL`:** PASS in automated regression. `pnpm vitest run src/app/api/auth/google/__tests__/authorize.test.ts` passed `7/7` tests, including request-origin fallback for `authorize` and `callback`.

### Current honest coverage

- **Safe unauthenticated/local smoke targets verified:** 20 / 20 after the Google callback fix = **100% of attempted no-auth smoke targets**.
- **Critical product journey catalogue:** 3 PASS / 8 total = **37.5% proven end-to-end**.
- **Additional partial hardening:** Google OAuth no-auth/missing-env guard is verified, but full Gmail OAuth → import → contact creation remains **UNKNOWN** because no authenticated session or provider credentials were available.

### Still UNKNOWN, not sellable-proof

- Contact create/list/update with authenticated founder data.
- Gmail full OAuth callback token exchange, import, and contact creation.
- Outlook/Microsoft import: Microsoft OAuth route guards now exist, but live consent and Microsoft Graph mailbox import remain UNKNOWN / not connected.
- Drip campaign create → step → enrol → process: route inventory found email campaign draft/send routes, but no current drip/enrol/process API journey.
- Lead scoring from real ingestion: library scoring tests exist, but no API/app journey was found.
- Multimedia upload + transcription: upload/video routes exist, but no transcription endpoint was found.

### Fresh gate evidence

- `pnpm type-check` → PASS.
- `pnpm lint` → PASS.
- `pnpm vitest run` → PASS, `118` files / `847` tests.
- `pnpm build` → BLOCKED by local env validation (`0/3` critical, `0/4` required), before compilation.

## Core journey sweep — 2026-06-07T12:00Z

### Method

Each requested journey was counted as PASS only if exercised end-to-end as a real authenticated user with tagged throwaway data and cleanup proof. Partial route, unit, or unauthenticated evidence is listed but does not upgrade a journey to PASS.

### Coverage

- Requested journeys: `6`
- PASS: `0`
- FAIL: `0`
- UNKNOWN: `6`
- Overall verified percentage with UNKNOWN excluded: `0/0` = **N/A**. No requested journey had enough evidence to enter the PASS/FAIL denominator.

| Journey | Status | Evidence |
|---|---:|---|
| Contact CRUD + cross-user RLS isolation | UNKNOWN | `pnpm test:e2e:core-journeys` failed the provisioning precondition; `SUPABASE_SERVICE_ROLE_KEY` unavailable by effect. |
| Integrations status as authenticated user | UNKNOWN | `/api/integrations/status` route exists and fails closed before auth; unit tests pass, but no throwaway authenticated user could be created. |
| Lead scoring seeded-contact journey | UNKNOWN | `qualifyLead` deterministic unit tests pass, but no authenticated seeded-contact scoring API/app route was found or run. |
| Drip campaign create → add step → enroll → process | UNKNOWN | Route inventory found no `src/app/api/campaigns/drip` implementation; no provider/email send attempted. |
| Multimedia upload + transcription | UNKNOWN | `/api/files` route exists and fails closed before auth; no transcription endpoint found; external API credentials/cost path unavailable. |
| Gmail OAuth → import → contact creation | UNKNOWN | Google authorize/callback routes and tests exist; consent is human-gated, and Google env vars were unavailable to the runner by effect. |

### Partial Verified Evidence

- Runtime effect check reached production Supabase host `lksfwktwtmyznckodsau.supabase.co`; anon REST contacts probe returned `200 []`; service-role/admin provisioning key was unavailable.
- Protected endpoint shells for contacts, integrations, files, email campaigns, and email threads returned login redirects before auth, not 500s.
- `pnpm vitest run src/lib/crm/__tests__/qualify-lead.test.ts src/app/api/integrations/status/__tests__/route.test.ts src/app/api/auth/google/__tests__/authorize.test.ts` passed `16` tests.
- `vercel env run --environment production -- pnpm test:e2e:core-journeys` ran `4` tests: `3` passed, `1` failed on missing admin provisioning.

## Core journey sweep update — 2026-06-07T12:14Z

### Coverage

- Requested journeys: `6`
- PASS: `2`
- FAIL: `1`
- UNKNOWN: `3`
- Overall verified percentage with UNKNOWN excluded: `2/3` = **66.7%**.

| Journey | Status | Evidence |
|---|---:|---|
| Contact CRUD + cross-user RLS isolation | PASS | `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` passed `1/1` after provisioning two tagged auth users, creating contacts A/B, proving A cannot list/read B and B cannot list/read A, updating, deleting, and verifying cleanup. |
| Integrations status as authenticated user | PASS | `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` passed `5/5`; authenticated `/api/integrations/status` returned `200` with `14` providers and a matching summary. |
| Lead scoring seeded-contact journey | UNKNOWN | Deterministic `qualifyLead` logic is guarded in Playwright and unit tests, but no authenticated "seed contact -> run scoring -> persist score" API/app route was found or run. |
| Drip campaign create → add step → enroll → process | FAIL | Route inventory found no current `src/app/api/campaigns/drip` implementation for create/add step/enrol/process. The available email campaign route can create/list a campaign and blocks send with no recipients, but it is not the requested drip lifecycle. |
| Multimedia upload + transcription | UNKNOWN | Authenticated `/api/files` list returned `200`; tiny upload returned `500` with `ANTHROPIC_API_KEY` credential blocker; no transcription endpoint was found. |
| Gmail OAuth → import → contact creation | UNKNOWN | Google OAuth authorize/callback guards pass, but real OAuth consent is human-gated and no mock/test token import path was found. |

### Fresh proof commands

- `supabase projects api-keys --project-ref lksfwktwtmyznckodsau --output json` was parsed in memory; host/key presence only was printed, no key values.
- `pnpm type-check` -> PASS.
- `pnpm lint` -> PASS.
- `pnpm vitest run 'src/app/api/email/campaigns/[id]/send/__tests__/route.test.ts'` -> PASS, `3` tests.
- `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` -> PASS, `1` test.
- `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` -> PASS, `5` tests.

## Lead scoring targeted build — 2026-06-07T13:06Z

### Coverage

| Journey | Status | Evidence |
|---|---:|---|
| Lead scoring authenticated route with existing schema | PASS | `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` passed `1/1`; the route loaded a real tagged contact as an authenticated founder, ran `qualifyLead`, returned expected score `100`, re-read persisted `contacts.metadata.leadQualification.score = 100`, blocked cross-founder scoring with `404`, and verified cleanup. |
| Requested `contacts.ai_score` persistence | UNKNOWN / BLOCKED | Live Supabase effect probe returned `42703 column contacts.ai_score does not exist`; production schema changes were not authorised for this run. See `DECISIONS_NEEDED.md` item 24. |

### Fresh proof commands

- `node <service-role effect probe: contacts select id,ai_score limit 0>` -> BLOCKED by missing column, `42703`.
- `pnpm type-check` -> PASS.
- `pnpm lint` -> PASS.
- `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` -> PASS, `1` Playwright test.
- `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` -> PASS, `1` Playwright regression test.
- `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` -> PASS, `5` Playwright regression tests.
- `node <scoped cleanup audit for lead-scoring/contact-crud/core regression IDs>` -> PASS, `5/5` auth users gone, `0` contacts remain, `0` campaigns remain.
- `pnpm vitest run` -> PASS, `118` test files and `847` tests.
- `pnpm build` -> BLOCKED before compile by local `prebuild` env validation (`0/3` critical, `0/4` required set in this shell).
- `pnpm exec tsx e2e/support/run-with-supabase-admin.ts pnpm build` -> BLOCKED before compile with Supabase critical vars present (`3/3`) and required runtime names absent (`0/4`).

## Overnight confirmation — Lead scoring — 2026-06-07T13:28Z

| Journey | Status | Evidence |
|---|---:|---|
| Lead scoring authenticated route with existing schema | PASS | Fresh rerun `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` passed `1/1`; expected score `100` matched persisted `contacts.metadata.leadQualification.score`, cross-founder scoring returned `404`, cleanup verified. |
| Requested `contacts.ai_score` persistence | UNKNOWN / BLOCKED | Not fixed in Task 1 because live/generated schema has no `contacts.ai_score` column; adding it is a production schema decision. |

## Overnight Task 2 — Upload 500 — 2026-06-07T13:36Z

| Journey | Status | Evidence |
|---|---:|---|
| Authenticated upload raw-500 fix | PASS | `env FILE_UPLOAD_APPEND_EVIDENCE=1 pnpm test:e2e:file-upload` passed `1/1`; tagged throwaway user posted a tiny tagged file with the test mock provider path and received explicit `503 file_cache_not_configured` instead of raw `500`. Regression guard `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` passed `5/5` and now asserts explicit `503` config codes. |
| Persisted tiny file upload | UNKNOWN / BLOCKED | The existing repo migration `supabase/migrations/20260325000001_ai_file_cache.sql` is not applied in the verified live Supabase lane; Supabase returned `Could not find the table 'public.ai_file_cache' in the schema cache`. Persisted upload cannot be honestly marked PASS until that migration is applied and the guard returns `201` with an admin re-read of `ai_file_cache`. |

### Fresh proof commands

- `pnpm type-check` -> PASS.
- `pnpm lint` -> PASS.
- `env FILE_UPLOAD_APPEND_EVIDENCE=1 pnpm test:e2e:file-upload` -> PASS, `1` Playwright test.
- `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` -> PASS, `1` Playwright regression test.
- `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` -> PASS, `5` Playwright regression tests.
- `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` -> PASS, `1` Playwright regression test.
- `pnpm vitest run` -> PASS, `118` test files and `847` tests.
- `node <scoped cleanup audit for overnight task 2 exact IDs>` -> PASS, `7/7` auth users gone, `0` contacts remain, `0` campaigns remain, `ai_file_cache` table missing.
- `pnpm build` and the Supabase-injected build variant -> BLOCKED before compile by missing required runtime env names in this local shell.

## File upload persisted proof — 2026-06-08T08:11+10:00

| Journey | Status | Evidence |
|---|---:|---|
| Persisted tiny file upload | PASS | Applied existing migration `supabase/migrations/20260325000001_ai_file_cache.sql`; `env FILE_UPLOAD_APPEND_EVIDENCE=1 pnpm test:e2e:file-upload` passed `1/1` with HTTP `201`, admin re-read of `ai_file_cache`, API cross-user isolation, direct authenticated RLS isolation, and cleanup. |

### Fresh proof commands

- `supabase db query --linked --workdir /tmp/unite-hub-ai-file-cache-migration --file ${REPO_ROOT}/supabase/migrations/20260325000001_ai_file_cache.sql` -> PASS, applied exact existing migration script.
- `supabase migration repair --linked --workdir /tmp/unite-hub-ai-file-cache-migration --status applied 20260325000001` -> PASS, migration history marked applied.
- `node <service-role effect check: select id from ai_file_cache limit 0>` -> PASS, table exists.
- `env FILE_UPLOAD_APPEND_EVIDENCE=1 pnpm test:e2e:file-upload` -> PASS, `1` Playwright test.
- `node <cleanup audit: ai_file_cache like __PW_TEST__UPLOAD__%>` -> PASS, `0` tagged upload rows remain.
- `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` -> PASS, `1` Playwright regression test.
- `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` -> PASS, `5` Playwright regression tests.
- `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` -> PASS, `1` Playwright regression test.
- `pnpm type-check`, `pnpm lint`, `pnpm vitest run`, `git diff --check` -> PASS.
- `pnpm build` and Supabase-injected build variant -> BLOCKED before compile by missing local required runtime env names.

## Transcription endpoint mocked-provider proof — 2026-06-08T08:32+10:00

### Coverage

- Requested target: `1`
- PASS: `1`
- FAIL: `0`
- UNKNOWN: `2` sub-steps
- Overall verified percentage with UNKNOWN excluded: `1/1` = **100%** for mocked transcription wiring.

| Journey | Status | Evidence |
|---|---:|---|
| Transcription endpoint mocked-provider wiring | PASS | `pnpm test:e2e:transcription` passed `2/2`; the guard proved `POST /api/files/transcribe` fails closed before auth, then provisioned two tagged throwaway auth users, uploaded a tagged file through `/api/files` with HTTP `201`, called `POST /api/files/transcribe`, asserted HTTP `200` and deterministic mocked transcript text, proved user B receives `404` for user A's cache key, and verified cleanup. |
| Durable transcript persistence | UNKNOWN / BLOCKED | No active additive transcript migration or existing `ai_file_cache` transcript/metadata column exists. The endpoint returns `persistence.persisted=false` and `persistence.status='unknown'` rather than inventing schema or pretending persistence. |
| Live transcription provider | UNKNOWN / BLOCKED | No live provider call was attempted; the run used `UNITE_HUB_TEST_MOCK_TRANSCRIPTION=1` to avoid provider cost/credential use. A live proof needs provider API key/cost approval and a storage design for retrievable source bytes/transcript output. |

### Fresh proof commands

- `pnpm run type-check` -> PASS.
- `pnpm run lint` -> PASS.
- `git diff --check` -> PASS.
- `pnpm test:e2e:transcription` -> PASS, `2` Playwright tests.
- `pnpm test:e2e:contact-crud` -> PASS, `1` Playwright regression test.
- `pnpm test:e2e:core-journeys` -> PASS, `5` Playwright regression tests, including integrations.
- `pnpm test:e2e:lead-scoring` -> PASS, `1` Playwright regression test.
- `pnpm test:e2e:file-upload` -> PASS, `1` Playwright regression test.
- `node <service-role cleanup audit: ai_file_cache like __PW_TEST__TRANSCRIPTION__%>` -> PASS, `0` tagged transcription upload rows remain.
- `pnpm vitest run` -> PASS, `118` files / `847` tests.
- `pnpm build` -> BLOCKED before compile by missing local required runtime env names.

## Core journey swarm follow-up — 2026-06-08T10:09+10:00

### Coverage

| Journey | Status | Evidence |
|---|---:|---|
| Gmail live thread/message import route | PASS (wiring) / UNKNOWN (live consent) | `pnpm vitest run src/app/api/email/contacts/import/__tests__/route.test.ts --config vitest.config.api.ts` passed `7/7`; `pnpm run test:e2e:email-import` passed `2/2` for the self-cleaning mocked path. Live Gmail still requires human OAuth consent and a real tagged thread/message. |
| Microsoft/Outlook OAuth foundation | PASS (route guards) / UNKNOWN (live consent/import) | `pnpm vitest run src/app/api/auth/microsoft/__tests__/authorize.test.ts --config vitest.config.api.ts` passed `8/8`; routes are auth-gated and store tokens founder-scoped in `credentials_vault` when consent is completed. Live Microsoft consent/import was not attempted. |
| Dedicated drip schema + route | UNKNOWN / SCHEMA-GATED | Migration `supabase/migrations/20260608000000_drip_lifecycle_schema.sql`, route, and e2e guard are ready. `pnpm exec supabase db push --dry-run --linked` did not apply schema and showed the new migration pending; `pnpm test:e2e:drip-campaign` is intentionally blocked until the migration is applied. |
| Durable transcript persistence | UNKNOWN / SCHEMA-GATED | Migration `supabase/migrations/20260607235936_ai_file_transcripts.sql`, route persistence, and e2e guard are ready. Live probe showed the table is absent; no schema change was applied. |

### Fresh proof commands

- `pnpm run type-check` -> PASS.
- `pnpm run lint` -> PASS.
- `pnpm vitest run` -> PASS, `120` files / `862` tests.
- `pnpm vitest run src/app/api/auth/microsoft/__tests__/authorize.test.ts src/app/api/email/contacts/import/__tests__/route.test.ts --config vitest.config.api.ts` -> PASS, `15` tests.
- `pnpm run test:e2e:email-import` -> PASS, `2` Playwright tests.
- `pnpm test:e2e:contact-crud` -> PASS, `1` Playwright test.
- `pnpm test:e2e:lead-scoring` -> PASS, `1` Playwright test.
- `pnpm test:e2e:file-upload` -> PASS, `1` Playwright test.
- `pnpm test:e2e:core-journeys` -> PASS, `5` Playwright tests.
- `git diff --check` -> PASS.
- `pnpm exec supabase db push --dry-run --linked` -> PASS as dry-run only; it reported pending migrations including the new transcript and drip migrations and did not apply anything.
- `pnpm build` -> BLOCKED before compile by local env validation (`0/3` critical, `0/4` required runtime vars in this shell).

## PR #106 review-fix swarm — 2026-06-08T10:42+10:00

### Coverage delta

| Journey | Status | Evidence |
|---|---:|---|
| Microsoft/Outlook OAuth foundation | PASS (route guards) / UNKNOWN (live consent/import) | Review fixes added founder-bound expiring signed state, authoritative Microsoft Graph sender lookup before vault write, business-key token retrieval, and refresh-token persistence. `pnpm vitest run src/app/api/auth/microsoft/__tests__/authorize.test.ts src/app/api/email/contacts/import/__tests__/route.test.ts --config vitest.config.api.ts` passed `21/21`. |
| Gmail import route hardening | PASS (mocked + live wiring) / UNKNOWN (live consent) | Route now rejects invalid sources and uses request-scoped Supabase. Focused tests passed in the `21/21` run; `pnpm run test:e2e:email-import` passed `2/2` with tagged cleanup. |
| Dedicated drip schema + route | UNKNOWN / SCHEMA-GATED | Review fixes moved the route to request-scoped Supabase, made unsafe/live sends terminal, and hardened the migration with composite founder constraints. No schema was applied; dedicated drip E2E remains blocked until `20260608000000_drip_lifecycle_schema.sql` is applied. |
| Transcription endpoint mocked-provider wiring | PASS (response wiring) / UNKNOWN (durable persistence) | Review fixes moved the route to request-scoped Supabase and normalized errors. With `ai_file_transcripts` absent, `pnpm run test:e2e:transcription` passed `2/2` by proving transcript content is still returned with `persistence.status='unknown'`, `persisted=false`, `reason='schema_missing'`. |

### Fresh proof commands

- `pnpm run type-check` -> PASS.
- `pnpm run lint` -> PASS.
- `pnpm vitest run` -> PASS, `120` files / `868` tests.
- Focused Microsoft/import Vitest -> PASS, `21` tests.
- `pnpm run test:e2e:email-import` -> PASS, `2` tests.
- `pnpm run test:e2e:transcription` -> PASS, `2` tests.
- Regression E2E -> PASS: contact-crud `1/1`, lead-scoring `1/1`, file-upload `1/1`, core-journeys `5/5`.
- `git diff --check` -> PASS.
- `pnpm exec supabase db push --dry-run --linked` -> PASS dry-run only; no schema was applied.
- `pnpm build` -> BLOCKED before compile by missing local runtime env (`0/3` critical, `0/4` required).

## Drip campaign compatibility lifecycle proof — 2026-06-08T08:54+10:00

### Coverage

- Requested target: `1`
- PASS: `1`
- FAIL: `0`
- UNKNOWN: `2` sub-steps
- Overall verified percentage with UNKNOWN excluded: `1/1` = **100%** for dry-run compatibility lifecycle.

| Journey | Status | Evidence |
|---|---:|---|
| Drip create -> add step -> enrol contact -> process_pending dry-run | PASS | `DRIP_CAMPAIGN_APPEND_EVIDENCE=1 pnpm test:e2e:drip-campaign` passed `2/2`; the guard proved `POST /api/campaigns/drip` fails closed before auth, then provisioned two tagged throwaway auth users, created a tagged contact, created a drip campaign, added a step, enrolled the contact, dry-ran `process_pending` with `processed=1`, `failed=0`, `providerSend='not_attempted'`, proved user B receives `404` for user A's campaign, and verified cleanup. |
| Dedicated drip schema | UNKNOWN / BLOCKED | Active migrations do not include `drip_campaigns`, `campaign_steps`, `campaign_enrollments`, or execution logs. This pass uses existing `email_campaigns.metadata.drip` and `recipient_list`, which is a compatibility path, not the final clean schema. |
| Live provider sending | UNKNOWN / BLOCKED | No live email provider send was attempted. `process_pending` defaults to dry-run and only processes safe test-domain recipients in this implementation. |

### Fresh proof commands

- `pnpm run type-check` -> PASS.
- `pnpm run lint` -> PASS.
- `DRIP_CAMPAIGN_APPEND_EVIDENCE=1 pnpm test:e2e:drip-campaign` -> PASS, `2` Playwright tests.
- `pnpm test:e2e:drip-campaign` -> PASS, `2` Playwright tests after support-script update.
- `node <service-role cleanup audit: email_campaigns/contacts tagged __PW_TEST__DRIP>` -> PASS, `0` tagged campaigns and `0` tagged contacts remain.

## Email import-to-contact mocked proof — 2026-06-08T08:59+10:00

### Coverage

- Requested target: `1`
- PASS: `1`
- FAIL: `0`
- UNKNOWN: `2` sub-steps
- Overall verified percentage with UNKNOWN excluded: `1/1` = **100%** for mocked email sender import.

| Journey | Status | Evidence |
|---|---:|---|
| Mocked Gmail sender -> contact import | PASS | `EMAIL_IMPORT_APPEND_EVIDENCE=1 pnpm test:e2e:email-import` passed `2/2`; the guard proved `POST /api/email/contacts/import` fails closed before auth, then provisioned two tagged throwaway auth users, imported a mocked Gmail sender into one founder-scoped contact, proved duplicate import returns the existing contact, proved user B cannot list user A's imported contact, and verified cleanup. |
| Live Gmail thread import | UNKNOWN / HUMAN-GATED | Google OAuth consent and a real Gmail account are required before live thread fetch/import can be proved. The route returns `503 gmail_live_import_not_connected` for live mode instead of faking it. |
| Outlook/Microsoft import | PASS (OAuth route guards) / UNKNOWN (live consent/import) | Microsoft authorize/callback route guards exist and unit tests pass; live Microsoft consent and Graph mailbox import were not attempted, and no live import is proved. |

### Fresh proof commands

- `pnpm run type-check` -> PASS.
- `pnpm run lint` -> PASS.
- `EMAIL_IMPORT_APPEND_EVIDENCE=1 pnpm test:e2e:email-import` -> PASS, `2` Playwright tests.
- `node <service-role cleanup audit: contacts like playwright+gmail-import+%@unite-hub.test>` -> PASS, `0` tagged contacts remain.
- Final chained e2e gate -> PASS: drip `2/2`, email-import `2/2`, contact-crud `1/1`, core-journeys `5/5`, lead-scoring `1/1`, file-upload `1/1`, transcription `2/2`.
- `pnpm vitest run` -> PASS, `118` files / `847` tests.
- `pnpm build` -> BLOCKED before compile by missing local required runtime env names.
