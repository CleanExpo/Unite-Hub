# Status — Unite-Hub verify-and-harden run

Date: 2026-06-07T09:36:30Z
Branch: `feat/24h-verify-and-harden`
PR: https://github.com/CleanExpo/Unite-Hub/pull/93

## Current PR state before this update

- PR #93 is open against `CleanExpo/Unite-Hub`.
- Latest clean server-read before the newest local hardening commit: `9f1716cbd0f489ff6c821a7ac077e08d699308d5`.
- Server read before the newest local hardening commit: `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`.
- All check-rollup entries were success or skipped.

## What I actually verified

### Public and unauthenticated runtime behaviour

With Supabase env intentionally empty in local dev:

- `/api/health` returns degraded JSON `503` instead of a 500 crash.
- `/` redirects to `/auth/login?redirectTo=%2F` instead of crashing in middleware.
- `/auth/login` renders with `200 OK`.
- Representative protected APIs return login redirects or explicit `401`, not 500s.

### Fire-and-forget side paths

The bookkeeper cron’s non-blocking notification/advisory side paths no longer emit raw Supabase service-client construction errors when local service-role env is missing.

- Before: tests passed but stderr included `supabaseUrl is required` from `notify()` / MACAS auto-trigger.
- Now: the path emits explicit skip warnings (`Supabase service config not set`) and continues without throwing or logging raw SDK construction errors.

### Quality gates

- `pnpm type-check` ✅
- `pnpm lint` ✅
- `pnpm vitest run` ✅ — `118` files / `844` tests passed
- GitHub Build Application ✅ — previously verified on PR #93; newest push must be re-checked after it runs.

## Fixes made

1. Existing PR hardening already guarded missing Supabase config for middleware, root redirect, health, `getUser()`, and `getSession()`.
2. Added the missing guard to `getUserWithRole()`.
3. Added service-role config detection for `createServiceClient()` consumers.
4. Guarded fire-and-forget `notify()` and MACAS auto-trigger so local missing service-role env degrades honestly instead of logging raw SDK errors.
5. Regression tests now prove:
   - `getUserWithRole()` returns `null` and does not construct a Supabase client when config is absent.
   - bookkeeper fire-and-forget delivery does not log `supabaseUrl is required` when service-role env is absent.

## Merge-error / build-log finding

The earlier problem was not a failing Build Application log. The actual merge blocker was branch protection requiring all review conversations to be resolved.

Evidence:

- Build Application logs passed both before and after the `getUserWithRole()` fix.
- PR initially showed `mergeable=MERGEABLE` but `mergeStateStatus=BLOCKED`.
- Branch protection showed `required_conversation_resolution=true`.
- There were 5 unresolved CodeRabbit threads: 1 still-active valid Supabase issue, 4 outdated threads from files no longer in the PR diff after main was merged.
- I fixed the active issue, resolved that thread, then resolved the outdated threads. Final state at `9f1716c`: `mergeStateStatus=CLEAN`.

## Hermes provider configuration note

Hermes main + delegation config was switched to Anthropic Opus 4.8 (`provider=anthropic`, `model/default=claude-opus-4-8`). `hermes doctor` showed Anthropic API and OpenRouter API connectivity OK. The pasted Anthropic key in chat should be revoked/rotated because chat history exposed it; I did not use or store the pasted value.

## What genuinely works now

- The app can boot locally without Supabase env vars and still serve public auth/health surfaces.
- Middleware no longer takes down public/protected routes just because Supabase config is absent.
- Health degrades honestly instead of throwing a 500 when env is incomplete.
- Representative protected APIs fail closed to login/401 in the missing-env case.
- Fire-and-forget notification/advisory paths now skip DB-backed delivery/case creation honestly when service env is absent.

## What is still broken or unverified

- Authenticated contact create/list/update flows: **UNKNOWN** until a real authenticated session and live Supabase data are available.
- Gmail / Outlook OAuth import flows: **UNKNOWN**.
- Drip campaign end-to-end flow: **UNKNOWN**.
- Lead scoring: **UNKNOWN**.
- Multimedia upload + transcription: **UNKNOWN**.
- Any provider-backed integration flow that depends on real credentials remains unverified locally.
- Local `pnpm build`: **BLOCKED** by absent local required env vars. GitHub CI Build Application passes with configured CI/Vercel env and must be re-checked after each push.

## Highest-value next step

After this push, wait for PR #93 checks to settle again. Then use an approved authenticated test session strategy and real non-production Supabase/integration env to run end-to-end probes for contact CRUD, OAuth import, campaign processing, scoring, and transcription. Until then, those journeys must remain UNKNOWN.

## Fresh update — 2026-06-07T10:24Z

### What changed in this slice

- Fixed a verified local runtime failure in Google OAuth:
  - Before: `GET /api/auth/google/callback` returned `500` when `NEXT_PUBLIC_APP_URL` was absent.
  - After: the same live request returns `307` to login.
- Hardened both Google OAuth `authorize` and `callback` to use the request origin when `NEXT_PUBLIC_APP_URL` is absent.
- Added regression tests for:
  - Google authorize redirect URI fallback.
  - Google callback anonymous fallback.
  - Google callback missing-params fallback.

### Fresh verification

- `pnpm vitest run src/app/api/auth/google/__tests__/authorize.test.ts` → PASS, `7` tests.
- Live curl against `http://127.0.0.1:3004/api/auth/google/callback` → PASS, `307` to login instead of prior `500`.
- `pnpm type-check && pnpm lint && pnpm vitest run` → PASS, full suite `118` files / `847` tests.
- `pnpm build` → BLOCKED by missing local env vars in `prebuild`, not by an observed compile error.

### Updated risk map

- `NEXT_PUBLIC_APP_URL` is still a parity concern. The validator lists it as integration config, but many OAuth routes treat app URL as operationally important. Google is now guarded; Meta/LinkedIn/TikTok/YouTube/Xero/social OAuth paths still need the same review before those flows can be called production-hardened.
- Outlook import is not merely unverified; current route inventory did not find a Microsoft Graph/Outlook OAuth route. Treat Outlook import as absent/UNKNOWN, not working.
- Drip campaign lifecycle and transcription remain UNKNOWN; current routes do not prove those product journeys exist end-to-end.

### Single highest-value next step

Create an approved non-production authenticated verification setup: local/preview Supabase env, a test founder session, and explicit permission for provider sandbox credentials. Without that, the remaining founder CRUD and integration journeys cannot be honestly moved from UNKNOWN to PASS.

## Contact CRUD verification attempt — 2026-06-07T10:58Z

### Status

Contact CRUD is **UNKNOWN**, not PASS.

### Verified facts

- The configured Vercel development, preview, and production environments resolve to `lksfwktwtmyznckodsau.supabase.co`.
- That host matches the known production Supabase ref, so production-safe mode was required.
- The production env read-only Supabase REST check returned `200 []` for `/rest/v1/contacts?select=id&limit=1`.
- The verification setup script refused to seed against production with: `Refusing setup: lksfwktwtmyznckodsau.supabase.co is the known production Supabase host`.
- The focused guard `vercel env run --environment production -- pnpm test:e2e:contact-crud` failed before authenticated list because `PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_PASSWORD` were unavailable to the test process.

### RLS result

RLS scoping is **UNKNOWN** for this Contact CRUD mission. I could not create a second-founder fixture because the active host is production, and the authenticated read-only test could not log in without test credentials.

### Guard left behind

- `scripts/contact-crud-verification.mjs` provides status/setup/teardown commands and refuses production writes.
- `e2e/contact-crud.spec.ts` performs production-safe authenticated list/RLS checks on production hosts and full create/list/update/delete checks only on non-production hosts.
- `pnpm test:e2e:contact-crud` runs the focused Playwright guard.

### Next journey

The next highest-value journey remains Gmail import, but only after a real non-production Supabase lane or explicit production-write approval exists. For Contact CRUD specifically, the next step is to point preview/development at a separate non-production Supabase host and provide test login credentials to the runtime.

## Post-merge Contact CRUD lane check — 2026-06-07T11:12Z

### Status

Contact CRUD remains **UNKNOWN**, not PASS.

### Additional verified facts

- PR #96 is merged into `main` at merge commit `5a6e767062085c63a36e04b12bd9e107d5143198`.
- `unite-hub-sandbox` exists as a Vercel project (`prj_tNqIsHGY3kvw7zdO2bXVxFWTPIk0`) and serves `https://unite-hub-sandbox.vercel.app`.
- The sandbox deployment's public client chunks reference only `https://lksfwktwtmyznckodsau.supabase.co`.
- Safe `vercel env run` host/effect checks against the sandbox project's `production`, `preview`, and `development` environments all resolved to `lksfwktwtmyznckodsau.supabase.co`.
- The same sandbox env checks returned REST status `200` for `/rest/v1/contacts?select=id&limit=1`, proving the env can reach Supabase but also proving it reaches the known production host.
- The checked sandbox runtimes do not expose test-login variables to the guard (`hasPlaywrightEmail:false`, `hasPlaywrightPassword:false`).
- Supabase inventory shows a separate project named `Unite-Group Test` (`xgqwfwqumliuguzhshwv`), but the checked Unite-Hub Vercel environments are not wired to it.

### Current blocker

The objective cannot be completed safely with the current external state. Full Contact CRUD proof requires either:

- a Unite-Hub Vercel/local verification runtime pointed at a confirmed non-production Supabase host, with test login credentials available to Playwright, or
- explicit human approval for a tightly scoped production write exception using throwaway test data.

No such approval has been given, so create/update/delete were not attempted.

## Continuation blocker audit — 2026-06-07T11:18Z

Contact CRUD remains **UNKNOWN**.

Fresh effect checks against `unite-hub-sandbox` production, preview, and development still resolve to `lksfwktwtmyznckodsau.supabase.co`, and all three checks still report no Playwright test email/password in the runtime. PR #97 remains open with docs-only blocker evidence.

There is no safe next automated action that would complete the original objective without an external change: either wire a Unite-Hub verification runtime to a confirmed non-production Supabase project and provide test login credentials, or explicitly approve a tightly scoped production-write exception. No production writes were attempted.

## Approved production-write exception attempt — 2026-06-07T11:40Z

Contact CRUD remains **UNKNOWN**, not PASS.

Phill approved a scoped reversible production-write exception, so the guard was updated to create two throwaway Supabase auth users, log in as each, prove Contact CRUD through the authenticated app API, assert cross-user isolation both ways, and cleanup exact created IDs in `finally`.

Fresh verification stopped before any production write:

- `pnpm type-check` passed.
- `pnpm lint` passed.
- `vercel env run --environment production -- env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` failed before provisioning with `Contact CRUD production-write exception precondition failed; missing SUPABASE_SERVICE_ROLE_KEY`.
- `.env.local` is absent, so the allowed local source order also cannot provide the service-role key.
- `vercel env ls production` shows `SUPABASE_SERVICE_ROLE_KEY` exists as an encrypted production variable, but `vercel env run` did not expose it to the local runner by effect.

No test users, workspaces, contacts, schema changes, deploys, promotions, aliases, billing actions, or explicit email sends occurred.

Workspace note: the current Contact API is founder-scoped and has no `workspace_id`. Live metadata shows `workspaces.org_id` is required and references `organizations`; creating an organization is outside the approved write exception, and using an existing organization would touch pre-existing data. Workspace creation was therefore not attempted.

Current blocker: make `SUPABASE_SERVICE_ROLE_KEY` available to the approved test runner by effect, or provide another safe admin-user creation path that does not expose secrets. Then rerun `pnpm test:e2e:contact-crud` and record the create/list/update/delete/RLS/cleanup proof.

## Core journey sweep — 2026-06-07T12:00Z

### Status

All six requested currently-UNKNOWN journeys remain **UNKNOWN** after an autonomous sweep. None were promoted to PASS, and none produced a product-level FAIL, because the run could not provision throwaway authenticated users.

### What was genuinely verified

- Production Supabase host is reachable by anon REST effect check: `/rest/v1/contacts?select=id&limit=1` returned `200 []`.
- `SUPABASE_SERVICE_ROLE_KEY` is still unavailable to the local `vercel env run` process by effect, so test auth users cannot be created/deleted safely.
- Protected endpoint shells fail closed before auth: contacts, integrations status, files, email campaigns, and email threads redirect to login.
- Google OAuth authorize returns `401` before auth; callback without a session redirects to login.
- Deterministic lead-scoring library tests pass.
- Integration-status route unit tests pass.
- Google OAuth authorize/callback unit tests pass.

### Journey map

- Contact CRUD + cross-user RLS: **UNKNOWN**. Blocked before write by missing admin provisioning.
- Integrations status: **UNKNOWN** as a user journey. Route/unit shape verified, but no authenticated throwaway user could be created.
- Lead scoring: **UNKNOWN** as a user journey. Rule logic verified; no authenticated seeded-contact scoring endpoint found.
- Drip campaign: **UNKNOWN**. No current `src/app/api/campaigns/drip` route found for create/add step/enroll/process.
- Multimedia upload + transcription: **UNKNOWN**. Upload route exists; transcription endpoint was not found and provider credentials/cost path was unavailable.
- Gmail OAuth import/contact creation: **UNKNOWN**. OAuth consent is human-gated; Google env vars were unavailable to the runner by effect.

### Top 3 next fixes

1. Run the guards in an environment where `SUPABASE_SERVICE_ROLE_KEY` is available to the process without exposing it, so throwaway auth users can be provisioned and cleaned up.
2. Decide/implement the actual lead-scoring and drip-campaign API journeys, or mark them not connected in product docs until they exist.
3. Add a transcription endpoint/spec or clarify that `/api/files` upload is the current multimedia boundary; then wire a smallest-sample paid-provider test with explicit cost controls.

## Core journey sweep update — 2026-06-07T12:14Z

### What genuinely works now

- Contact CRUD as real authenticated users is **PASS** under the approved scoped production-write exception. The guard created two throwaway auth users, created contacts A/B, listed, updated, deleted, proved cross-user isolation both ways, and verified cleanup.
- Integrations status as a real authenticated user is **PASS**. `/api/integrations/status` returned `200` with `14` providers and a matching summary for a throwaway user.
- Email campaign create/list and the no-recipient send safety path are now guarded. A real schema mismatch (`name`/`categories` columns absent from `email_campaigns`) was found by e2e, fixed by storing labels/categories in `metadata`, and re-run green.

### Still broken or unknown

- Drip campaign create/add step/enrol/process is **FAIL** for the requested journey: there is no current `src/app/api/campaigns/drip` route implementation.
- Lead scoring as a seeded-contact user journey is **UNKNOWN**. The deterministic scoring rule is guarded, but no authenticated scoring API/app path was found.
- Multimedia transcription is **UNKNOWN**. Authenticated files list works; tiny upload is blocked by `ANTHROPIC_API_KEY`, and no transcription endpoint was found.
- Gmail OAuth import/contact creation is **UNKNOWN**. Consent needs a human Google account; no autonomous mock-token import path was found.

### Fresh verification

- `pnpm type-check` -> PASS.
- `pnpm lint` -> PASS.
- `pnpm vitest run 'src/app/api/email/campaigns/[id]/send/__tests__/route.test.ts'` -> PASS, `3` tests.
- `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` -> PASS, `1` Playwright test.
- `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` -> PASS, `5` Playwright tests.

### Top 3 next fixes

1. Decide whether to implement the missing drip lifecycle route or remove it from the product promise.
2. Add an authenticated lead-scoring route/path that persists/re-reads a score for a seeded contact, or mark scoring as library-only.
3. Wire the paid file/transcription path with explicit cost controls and a real cleanup story, or mark transcription not connected.

## Lead scoring targeted build — 2026-06-07T13:06Z

### What genuinely works now

- `POST /api/contacts/:id/score` exists and is authenticated.
- The route reuses `qualifyLead` as the single source of truth.
- Contact access is founder-scoped with `.eq('founder_id', user.id)`.
- The e2e guard proved a real authenticated user can score a tagged contact, persist the expected score `100` to `contacts.metadata.leadQualification`, re-read it, and cannot score another founder's tagged contact.
- Cleanup was verified for the throwaway auth users and contacts.

### What remains blocked

- The exact requested `contacts.ai_score` persistence is **UNKNOWN / BLOCKED** because the current live `contacts` table has no `ai_score` column. A service-role effect probe returned `42703 column contacts.ai_score does not exist`.
- No schema change was applied because this run authorised scoped reversible test data only, not production schema changes.

### Fresh verification

- `pnpm type-check` -> PASS.
- `pnpm lint` -> PASS.
- `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` -> PASS, `1` Playwright test.
- `env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` -> PASS, `1` Playwright regression test.
- `env CORE_JOURNEYS_APPEND_EVIDENCE=1 pnpm test:e2e:core-journeys` -> PASS, `5` Playwright regression tests.
- `node <scoped cleanup audit for lead-scoring/contact-crud/core regression IDs>` -> PASS, `5/5` auth users gone, `0` contacts remain, `0` campaigns remain.
- `pnpm vitest run` -> PASS, `118` test files and `847` tests.
- `pnpm build` -> BLOCKED before compile by local `prebuild` env validation (`0/3` critical, `0/4` required set in this shell).
- `pnpm exec tsx e2e/support/run-with-supabase-admin.ts pnpm build` -> BLOCKED before compile with Supabase critical vars present (`3/3`) and required runtime names absent (`0/4`).

### Next decision

Approve an additive `contacts.ai_score` migration and generated type update, or accept `contacts.metadata.leadQualification.score` as the product persistence field.

## Overnight Task 1 — Lead scoring confirmation — 2026-06-07T13:28Z

Task 1 did not produce a new PR because PR #101 is already merged and the only missing part is a schema decision. Fresh guard proof still passes for current-schema persistence: `env LEAD_SCORING_APPEND_EVIDENCE=1 pnpm test:e2e:lead-scoring` passed `1/1`, including expected score `100`, persisted `contacts.metadata.leadQualification.score = 100`, cross-founder `404`, and cleanup.

Exact `contacts.ai_score` persistence remains **UNKNOWN / BLOCKED** until an additive schema change is approved, or the product contract accepts metadata persistence.

## Overnight Task 2 — Upload 500 — 2026-06-07T13:36Z

What genuinely works now: authenticated `/api/files` no longer exposes known configuration blockers as raw `500`s. Missing Anthropic config returns `503 provider_not_configured`; missing upload cache storage returns `503 file_cache_not_configured`. The new `pnpm test:e2e:file-upload` guard proves this as a real signed-in throwaway user and verifies cleanup.

What remains blocked: persisted tiny-file upload is still **UNKNOWN / BLOCKED** because the repo's existing `ai_file_cache` migration is not applied in the verified live Supabase lane. Once `supabase/migrations/20260325000001_ai_file_cache.sql` is applied, rerun `env FILE_UPLOAD_APPEND_EVIDENCE=1 pnpm test:e2e:file-upload`; the same guard will require `201` plus an admin re-read when the table exists.

Fresh verification: type-check PASS, lint PASS, file-upload e2e PASS, contact-crud regression PASS, core-journeys regression PASS, lead-scoring regression PASS, Vitest PASS (`118` files / `847` tests), whitespace check PASS. Build remains blocked before compile by missing local required runtime env names.

## File upload persistence — 2026-06-08T08:11+10:00

What genuinely works now: persisted file upload is **PASS**. The existing migration `supabase/migrations/20260325000001_ai_file_cache.sql` has been applied to `lksfwktwtmyznckodsau`, and `pnpm test:e2e:file-upload` now requires and proves HTTP `201`, persisted `ai_file_cache` admin re-read, API cross-user isolation, direct authenticated RLS isolation, and cleanup.

Schema note: `supabase db push` could not safely apply only this migration because the live project has legacy short migration versions whose history does not sort/match cleanly in the CLI. To avoid applying unrelated pending migrations, the exact existing migration file was run through `supabase db query --file`, then `supabase migration repair --status applied 20260325000001` recorded the migration version.

Rollback command recorded in `EVIDENCE.md`: `drop table if exists public.ai_file_cache cascade;` followed by marking migration `20260325000001` reverted. Do not run it unless Phill explicitly asks for rollback.

Fresh verification: file-upload e2e PASS, contact-crud regression PASS, core-journeys regression PASS, lead-scoring regression PASS, type-check PASS, lint PASS, Vitest PASS (`118` files / `847` tests), whitespace check PASS. Local build remains blocked before compile by missing required runtime env names in this shell.

## Transcription endpoint — 2026-06-08T08:32+10:00

What genuinely works now: `POST /api/files/transcribe` exists and is authenticated. It looks up the uploaded file through the existing founder-scoped `ai_file_cache` path, supports a test-only mocked provider, returns deterministic transcript text, and fails closed for another founder's cache key. The self-cleaning guard `pnpm test:e2e:transcription` proved unauthenticated fail-closed behaviour, upload `201`, transcription `200`, cross-user `404`, and cleanup with tagged throwaway users.

What remains blocked: durable transcript persistence is **UNKNOWN / BLOCKED** because no active additive transcript migration or existing `ai_file_cache` transcript/metadata column exists. Live provider transcription is **UNKNOWN / BLOCKED** because this run intentionally avoided paid provider calls and there is no approved key/cost/source-byte retrieval path for live transcription.

Fresh verification: type-check PASS, lint PASS, whitespace check PASS, transcription e2e PASS (`2/2`), contact-crud PASS (`1/1`), core-journeys PASS (`5/5`), lead-scoring PASS (`1/1`), file-upload PASS (`1/1`), cleanup audit PASS (`0` tagged transcription rows remain), Vitest PASS (`118` files / `847` tests). Local build remains blocked before compile by missing required runtime env names in this shell.

## Drip campaign lifecycle — 2026-06-08T08:54+10:00

What genuinely works now: `POST /api/campaigns/drip` exists and is authenticated. It supports `create_campaign`, `add_step`, `enroll_contact`, and `process_pending` over the existing founder-scoped `email_campaigns` and `contacts` tables. The self-cleaning guard `pnpm test:e2e:drip-campaign` proved unauthenticated fail-closed behaviour, create, add step, enrol, dry-run process, cross-user `404`, and cleanup with tagged throwaway users.

Safety behaviour: `process_pending` defaults to dry-run and records `providerSend='not_attempted'`; it does not call SendGrid or any real provider.

What remains blocked: this is a compatibility lifecycle using `email_campaigns.metadata.drip`, not a final dedicated drip schema. Clean GREEN drip still needs approved active tables for steps, enrollments, scheduling/retry state, and execution logs.

Fresh verification: type-check PASS, lint PASS, drip e2e PASS (`2/2`), cleanup audit PASS (`0` tagged drip campaigns and contacts remain). Full regression run still needs to happen before PR handoff.

## Email import to contacts — 2026-06-08T08:59+10:00

What genuinely works now: `POST /api/email/contacts/import` exists and is authenticated. In `gmail_mock` mode it converts a tagged non-deliverable sender into a founder-scoped contact, avoids duplicate contacts by founder/email, and fails closed for another founder's contact list. The self-cleaning guard `pnpm test:e2e:email-import` proved unauthenticated fail-closed behaviour, import `201`, duplicate import `200 created=false`, cross-user isolation, and cleanup.

What remains blocked: live Gmail thread import is **UNKNOWN / HUMAN-GATED** until Google OAuth consent and real thread fetch are available. Outlook/Microsoft import is **UNKNOWN / NOT BUILT** because no active Microsoft OAuth/Graph route exists.

Fresh verification: type-check PASS, lint PASS, email-import e2e PASS (`2/2`), cleanup audit PASS (`0` tagged email-import contacts remain), final chained e2e gate PASS, Vitest PASS (`118` files / `847` tests). Local build remains blocked before compile by missing required runtime env names in this shell.
