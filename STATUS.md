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
