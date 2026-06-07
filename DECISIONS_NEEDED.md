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
