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
- Outlook OAuth/import: route inventory found Microsoft account metadata but no current Outlook/Microsoft Graph OAuth route.
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
