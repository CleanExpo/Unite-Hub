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
