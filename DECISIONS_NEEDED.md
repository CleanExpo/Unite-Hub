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
