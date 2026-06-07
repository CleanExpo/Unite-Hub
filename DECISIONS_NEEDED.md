# Decisions Needed — Unite-Hub

Date: 2026-06-07T06:01:51Z
Branch: `feat/24h-verify-and-harden`

## Awaiting Phill / operator input

1. **Provide real Supabase runtime env vars for local verification**
   - Needed values:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   - Without these, authenticated journeys cannot be verified honestly.

2. **Provide or approve an authenticated test session strategy**
   - Needed to verify protected routes and CRUD flows end-to-end.
   - Examples: Playwright auth state, seeded test user, or another approved test harness.

3. **Provide the integration credentials needed for the remaining unknown journeys**
   - Gmail / Outlook OAuth import verification
   - Drip campaign processing
   - Lead scoring
   - Multimedia upload + transcription
   - Any other provider-backed route that still depends on live credentials

## Not queued

- No deploy/promote/alias-change action was taken.
- No destructive DB action was taken.
- No secret values were printed, copied, or committed.

## Added 2026-06-07T10:24Z

4. **Decide the canonical `NEXT_PUBLIC_APP_URL` strategy per environment**
   - Finding: Google OAuth is now guarded with a request-origin fallback, but other OAuth routes still treat app URL as required operational config.
   - Needed decision: either set `NEXT_PUBLIC_APP_URL` in every Vercel environment and local verification env, or approve applying the same request-origin fallback across Meta, LinkedIn, TikTok, YouTube, Xero, and social OAuth routes.
   - No env values should be pasted into chat.

5. **Confirm whether Outlook import is in scope for the current CRM**
   - Finding: route inventory found Microsoft account metadata, but no Microsoft Graph/Outlook OAuth/import API route in the current app.
   - Needed decision: mark Outlook import as not connected for this production-hardening pass, or provide the intended current route/spec if it exists outside the inspected tree.

6. **Confirm whether drip campaigns and transcription are current product promises**
   - Finding: current routes show email campaign draft/send and video/file routes, but no verified drip enrol/process route and no transcription endpoint.
   - Needed decision: mark these as not connected/UNKNOWN in the product surface, or provide the intended current implementation path for verification.

## Added 2026-06-07T10:41Z — Contact CRUD verification precondition failed

7. **Provide a confirmed non-production Supabase verification lane**
   - Mission blocked before branch/test-data work.
   - Safe env check result: `.env.test` was not present, `NEXT_PUBLIC_SUPABASE_URL` was absent, and no Supabase host could be printed or compared against the known production ref `lksfwktwtmyznckodsau`.
   - Required missing env vars:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `PLAYWRIGHT_TEST_EMAIL`
     - `PLAYWRIGHT_TEST_PASSWORD`
   - Safety decision: no branch, seed, auth login, database write, teardown, PR, or Contact CRUD probe was attempted because non-production targeting could not be proven.

## Added 2026-06-07T10:58Z — Contact CRUD guard created, proof still blocked

8. **Point a verification environment at a non-production Supabase host**
   - Current verified host for Vercel development, preview, and production: `lksfwktwtmyznckodsau.supabase.co`.
   - That host matches the known production ref, so seed/create/update/delete are blocked by production-safe mode.
   - The new setup script refuses production writes and produced: `Refusing setup: lksfwktwtmyznckodsau.supabase.co is the known production Supabase host`.

9. **Provide test login credentials to the runtime that runs `pnpm test:e2e:contact-crud`**
   - The focused guard failed before authenticated list with: `PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_PASSWORD are unavailable to the authenticated Contact CRUD test`.
   - Without these, authenticated list and RLS scoping remain UNKNOWN.

10. **Choose whether to approve any production-write exception**
   - Default remains no production writes.
   - To prove create/update/delete without a non-production Supabase host, Phill would need to explicitly approve one throwaway create/update/delete cycle against production test data.
   - No such approval has been given, and no production write was attempted.

## Added 2026-06-07T11:12Z — Post-merge sandbox lane still points at production

11. **Wire `unite-hub-sandbox` or another verification runtime to a non-production Supabase project**
   - Verified `unite-hub-sandbox` exists, but its production, preview, and development environments all resolved by effect to `lksfwktwtmyznckodsau.supabase.co`.
   - The sandbox deployment's public client chunks also reference only `https://lksfwktwtmyznckodsau.supabase.co`.
   - Supabase inventory shows a separate project named `Unite-Group Test` (`xgqwfwqumliuguzhshwv`), but the checked Unite-Hub Vercel environments are not currently wired to it.
   - Needed decision: point a verification runtime at a confirmed non-production Supabase host and provide the corresponding app runtime env, or approve a different safe verification lane.

12. **Provide Playwright test login credentials in the selected verification runtime**
   - Verified `unite-hub-sandbox` production, preview, and development envs expose the Supabase URL/anon envs but not `PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD` or the accepted `TEST_FOUNDER_EMAIL` / `TEST_FOUNDER_PASSWORD` aliases.
   - Needed decision: add test-only founder credentials to the selected non-production runtime, without pasting secrets into chat.

## Added 2026-06-07T11:40Z — Approved production-write exception blocked before provisioning

13. **Expose `SUPABASE_SERVICE_ROLE_KEY` to the approved test runner by effect**
   - Phill approved creating up to two tagged test auth users, test workspaces, and test contacts, then deleting them.
   - The self-cleaning Playwright guard now creates users itself, so pre-set `PLAYWRIGHT_TEST_*` credentials are no longer required.
   - Actual blocker: `vercel env run --environment production -- env CONTACT_CRUD_APPEND_EVIDENCE=1 pnpm test:e2e:contact-crud` failed before any write because `SUPABASE_SERVICE_ROLE_KEY` was unavailable to the local process.
   - `vercel env ls production` lists `SUPABASE_SERVICE_ROLE_KEY` as an encrypted production variable, but the local runner did not receive it by effect.
   - Needed decision: run the guard in an environment where the service-role key is available to the process without exposing it in chat/logs, or provide an equivalent safe admin-user provisioning mechanism.

14. **Decide whether a tagged test organization is also authorized for workspace creation**
   - Live metadata shows `workspaces.org_id` is required and references `organizations`.
   - The current production-write exception authorizes test users, test workspaces, and test contacts only; it does not explicitly authorize creating a throwaway organization.
   - Using any existing organization would touch pre-existing data and was not attempted.
   - Needed decision: either explicitly authorize a uniquely tagged throwaway organization solely as the required parent for the test workspaces, or accept that the current Contact API proof is founder-scoped rather than workspace-scoped.

## Added 2026-06-07T12:00Z — Core journey sweep blockers

15. **Provide an execution lane where admin provisioning is available by effect**
   - `vercel env run --environment production -- node <presence/effect check>` still reports `SUPABASE_SERVICE_ROLE_KEY:false` while `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are available.
   - Without this, no autonomous test can create/delete throwaway auth users, so all real authenticated journeys remain UNKNOWN.

16. **Clarify or implement the lead-scoring user journey**
   - Verified deterministic `qualifyLead` logic exists and tests pass.
   - No authenticated API/app path was found for "seed a contact -> run scoring path -> assert persisted score".

17. **Clarify or implement the drip-campaign lifecycle route**
   - `scripts/process-campaigns.mjs` points to `/api/campaigns/drip` with `process_pending`, but route inventory found no `src/app/api/campaigns/drip` implementation.
   - Needed decision: provide the intended current route or mark drip campaigns not connected.

18. **Clarify or implement multimedia transcription**
   - `/api/files` upload exists, but no transcription endpoint was found.
   - Needed decision: provide the intended transcription path and cost ceiling, or mark transcription not connected.

19. **Complete Gmail OAuth consent manually before import/contact proof**
   - Google OAuth consent requires a human and a real Google account.
   - The autonomous run verified route shells/unit tests only; import/contact creation remains UNKNOWN until consent and test tokens are available.

## Added 2026-06-07T12:06:14.611Z - Contact CRUD cleanup incomplete

Leftover test IDs for marker 2026-06-07T12:06:12.154Z: {"contacts":[],"workspaces":[],"users":[{"id":"73ff441d-71c4-4fc8-8270-f2986fb1e7ae","error":"post-delete re-query failed: User not found"},{"id":"2ba9df32-c892-4745-9070-b1800f83b76c","error":"post-delete re-query failed: User not found"}]}

## Added 2026-06-07T12:14Z — Decisions still needed after core sweep

20. **False-positive cleanup note above is resolved**
   - The `User not found` responses in item 12:06:14 mean the test users were already deleted. Later cleanup logic was corrected to treat that response as deletion proof.
   - Separate interrupted core run cleanup was verified for user `41746f1d-80a3-4af8-9525-a13318b749fe` and campaign `5ca0d9fe-303a-464c-b0ba-081a3def632a`: campaign count was `0` and user re-query after delete was gone.

21. **Decide the drip campaign product contract**
   - Current verification found no `src/app/api/campaigns/drip` route for create/add step/enrol/process.
   - Needed decision: implement the current drip lifecycle, or mark drip campaigns as not connected in the product surface.

22. **Decide the lead-scoring user journey**
   - `qualifyLead` logic is deterministic and guarded, but no authenticated "seed contact -> run score -> persist/re-read score" path was found.
   - Needed decision: provide/approve the intended endpoint or mark this as library-only until wired.

23. **Provide paid AI file/transcription execution settings**
   - Authenticated files list works, but tiny upload returned the `ANTHROPIC_API_KEY` credential blocker, and no transcription endpoint was found.
   - Needed decision: provide a cost-controlled transcription/upload test lane or mark transcription not connected.

## Added 2026-06-07T13:06Z — Lead scoring ai_score column blocker

24. **Approve an additive `contacts.ai_score` schema change, or accept metadata persistence as the current product contract**
   - Mission target requested persistence to `contacts.ai_score`.
   - Current generated schema and live Supabase effect probe both show `contacts.ai_score` does not exist. The live probe returned status `400`, error code `42703`, message `column contacts.ai_score does not exist`.
   - A production schema change is outside the scoped reversible test-data exception for this targeted run, so it was not applied.
   - Safe progress made: `POST /api/contacts/:id/score` now runs the existing `qualifyLead` logic as the authenticated founder, founder-scopes by `founder_id`, persists the score to `contacts.metadata.leadQualification`, and is guarded by `pnpm test:e2e:lead-scoring`.
   - Needed decision: either approve an additive migration for `contacts.ai_score` with generated type updates, or update the target contract so `contacts.metadata.leadQualification.score` is the accepted persistence field.

## Added 2026-06-07T13:36Z — Upload persistence blocked by unapplied existing migration

25. **Apply the existing `ai_file_cache` migration in the verified Supabase lane, or mark file upload persistence not connected**
   - The code path for `/api/files` persists uploads to `ai_file_cache`, and the repo already contains `supabase/migrations/20260325000001_ai_file_cache.sql`.
   - The verified live Supabase lane returned `Could not find the table 'public.ai_file_cache' in the schema cache`, so persisted upload cannot be honestly marked PASS.
   - Safe progress made: known upload blockers now return explicit `503` codes instead of raw `500`; `pnpm test:e2e:file-upload` proves the authenticated boundary and cleanup without making a live paid provider call.
   - Needed decision: apply `supabase/migrations/20260325000001_ai_file_cache.sql` through the normal migration process, then rerun `env FILE_UPLOAD_APPEND_EVIDENCE=1 pnpm test:e2e:file-upload` to prove `201` plus persisted admin re-read; or declare upload persistence not connected for the current production surface.

## Added 2026-06-08T08:11+10:00 — Upload persistence blocker resolved

26. **Resolved: `ai_file_cache` migration applied and persisted upload proved**
   - The existing migration `supabase/migrations/20260325000001_ai_file_cache.sql` was applied to `lksfwktwtmyznckodsau`.
   - `pnpm test:e2e:file-upload` now proves HTTP `201`, persisted `ai_file_cache` row, API cross-user isolation, direct authenticated RLS isolation, and cleanup.
   - No decision remains for this item unless Phill wants rollback. The rollback command is recorded in `EVIDENCE.md` and must not be run without explicit approval.
