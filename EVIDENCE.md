# Evidence — append only

Date: 2026-06-07T09:36:30Z
Branch: `feat/24h-verify-and-harden`
PR: https://github.com/CleanExpo/Unite-Hub/pull/93

## 2026-06-07

### 1) Environment validation shows the local runtime is missing critical Supabase env vars
- **Command:** `pnpm validate:env`
- **Actual result:** failed
- **Evidence:** validator reported `0/3` critical env vars set, including `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; exit code 1.

### 2) Type-check passes after the missing-env hardening changes
- **Command:** `pnpm type-check`
- **Actual result:** passed
- **Evidence:** `tsc --noEmit` completed with exit code 0.

### 3) Lint passes
- **Command:** `pnpm lint`
- **Actual result:** passed
- **Evidence:** `eslint src/` completed with exit code 0.

### 4) Full Vitest suite passes on current local head
- **Command:** `pnpm vitest run`
- **Actual result:** passed
- **Evidence:** `118 passed` test files, `844 passed` tests, exit code 0.

### 5) Targeted regression test for `getUserWithRole()` missing-config guard passes
- **Command:** `pnpm vitest run src/lib/supabase/__tests__/server.test.ts`
- **Actual result:** passed
- **Evidence:** `3 passed`; test asserts `getUser`, `getSession`, and `getUserWithRole` return `null` without calling `createServerClient` when Supabase env is missing.

### 6) Local production build is blocked by absent local secrets/env, not by an observed TypeScript/build error
- **Command:** `pnpm build`
- **Actual result:** failed in `prebuild`
- **Evidence:** `scripts/validate-env.mjs --ci` reported `0/3` critical and `0/4` required env vars set in the local shell, then exited 1. No secret values were printed or supplied.

### 7) GitHub Build Application passed on PR #93 prior commit
- **Command:** `gh run view 27087960201 --job 79946073153 --log --repo CleanExpo/Unite-Hub`
- **Actual result:** passed
- **Evidence:** job completed successfully for commit `f41abce4`; route manifest was emitted. Warnings observed were non-fatal (`url.parse` deprecation, pnpm Supabase bin warning, cache-control/Turbopack warnings).

### 8) PR #93 merge-error diagnosis
- **Commands:**
  - `gh pr checks 93 --repo CleanExpo/Unite-Hub`
  - `gh pr view 93 --json mergeable,mergeStateStatus,statusCheckRollup`
  - `gh api repos/CleanExpo/Unite-Hub/branches/main/protection`
- **Actual result:** build/checks were not the merge blocker; branch policy required conversation resolution.
- **Evidence:** initial state showed `mergeable=MERGEABLE`, required checks green, `mergeStateStatus=BLOCKED`, and branch protection `required_conversation_resolution=true` with 5 unresolved CodeRabbit threads.

### 9) CodeRabbit active finding fixed and stale threads resolved
- **Change:** guarded `getUserWithRole()` with `hasSupabaseConfig()` before `createClient()`.
- **Commit:** `f41abce4 fix: guard user-with-role auth without Supabase env`
- **Evidence:** active thread `PRRT_kwDOQUchfM6HoecO` resolved after the fix; four other unresolved threads were marked `outdated=true` by GitHub and resolved to satisfy required conversation resolution.

### 10) Clean PR state before the latest fire-and-forget hardening slice
- **Command:** `gh pr view 93 --json state,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,headRefOid`
- **Actual result:** clean/mergeable at commit `9f1716cbd0f489ff6c821a7ac077e08d699308d5`
- **Evidence:** `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, all check-rollup entries success or skipped.

### 11) Live smoke: public auth/health paths with Supabase env intentionally empty
- **Server command:** `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= ANTHROPIC_API_KEY= VAULT_ENCRYPTION_KEY= CRON_SECRET= FOUNDER_USER_ID= pnpm exec next dev -p 3003`
- **Commands / actual results:**
  - `curl -i --max-redirs 0 http://127.0.0.1:3003/` → `HTTP/1.1 307 Temporary Redirect`, `location: /auth/login?redirectTo=%2F`
  - `curl -i --max-redirs 0 http://127.0.0.1:3003/auth/login` → `HTTP/1.1 200 OK`
  - `curl -i --max-redirs 0 http://127.0.0.1:3003/api/health` → `HTTP/1.1 503 Service Unavailable`, JSON degraded Supabase status

### 12) Live smoke: representative protected APIs no longer 500 in missing-env mode
- **Command shape:** `curl -i --max-redirs 0 http://127.0.0.1:3003/<path>`
- **Actual results:**
  - `/api/contacts` → `307 /auth/login?redirectTo=%2Fapi%2Fcontacts`
  - `/api/dashboard/stats` → `307 /auth/login?redirectTo=%2Fapi%2Fdashboard%2Fstats`
  - `/api/integrations/status` → `307 /auth/login?redirectTo=%2Fapi%2Fintegrations%2Fstatus`
  - `/api/email/threads` → `307 /auth/login?redirectTo=%2Fapi%2Femail%2Fthreads`
  - `/api/email/campaigns` → `307 /auth/login?redirectTo=%2Fapi%2Femail%2Fcampaigns`
  - `/api/video/jobs` → `307 /auth/login?redirectTo=%2Fapi%2Fvideo%2Fjobs`
  - `/api/social/status` → `307 /auth/login?redirectTo=%2Fapi%2Fsocial%2Fstatus`
  - `/api/hermes/operator-gateway/command-centre` → `307 /auth/login?redirectTo=%2Fapi%2Fhermes%2Foperator-gateway%2Fcommand-centre`
  - `/api/hermes/operator-gateway/status` → `307 /auth/login?redirectTo=%2Fapi%2Fhermes%2Foperator-gateway%2Fstatus`
  - `/api/hermes/kanban` → `307 /auth/login?redirectTo=%2Fapi%2Fhermes%2Fkanban`
  - `/api/xero/connect` → `307 /auth/login?redirectTo=%2Fapi%2Fxero%2Fconnect`
  - `/api/auth/google/authorize` → `401 {"error":"Unauthorized"}`

### 13) Preview deployments created by Vercel for PR #93
- **Evidence:** GitHub status contexts passed on prior PR head:
  - `Vercel – unite-hub` → `https://vercel.com/unite-group/unite-hub/72bXJcxdchYHqMryfxJpGKY5kCxB`
  - `Vercel – unite-hub-sandbox` → `https://vercel.com/unite-group/unite-hub-sandbox/BZgM42r58x5GWFRbjB2bBMGh3vTe`
- **Note:** This is preview deployment readiness, not proof of authenticated product journeys.

### 14) RED/GREEN: fire-and-forget delivery no longer logs raw Supabase service-client construction errors
- **RED command:** `pnpm vitest run src/app/api/cron/bookkeeper/__tests__/route.test.ts -t "does not log Supabase service-client errors"`
- **RED result:** failed because stderr included `[Notify] Unhandled error: supabaseUrl is required` and `[Bookkeeper CRON] MACAS auto-trigger error: Error: supabaseUrl is required.`
- **Fix:** added `hasSupabaseServiceConfig()` and guarded fire-and-forget notification/advisory DB-backed work when local service-role env is absent.
- **GREEN command:** same targeted test.
- **GREEN result:** passed; intended skip warnings appear, but raw `supabaseUrl is required` SDK construction errors do not.

### 15) Neighbour and full-suite verification after fire-and-forget hardening
- **Commands:**
  - `pnpm vitest run src/app/api/cron/bookkeeper/__tests__/route.test.ts src/lib/advisory/__tests__/auto-trigger.test.ts`
  - `pnpm type-check`
  - `pnpm lint`
  - `pnpm vitest run`
- **Actual result:** passed
- **Evidence:** neighbour suites `22 passed`; full suite `118 passed` files / `844 passed` tests; type-check and lint exit code 0.

### 16) Hermes provider/delegation configuration verified
- **Commands:**
  - `hermes config set model.provider anthropic`
  - `hermes config set model.default claude-opus-4-8`
  - `hermes config set delegation.provider anthropic`
  - `hermes config set delegation.model claude-opus-4-8`
  - `hermes doctor`
- **Actual result:** Hermes main + delegation config uses Anthropic Opus 4.8; `hermes doctor` reported Anthropic API and OpenRouter API connectivity OK.
- **Safety note:** an Anthropic key was pasted in chat and should be revoked/rotated. I did not use or store the pasted key.

### 17) Fresh baseline gates at current HEAD
- **Timestamp:** `2026-06-07T10:21:11Z`
- **Branch / commit:** `feat/24h-verify-and-harden` at `e10ab201`
- **Commands / actual results:**
  - `pnpm validate:env` → failed; validator reported `0/3` critical vars and `0/4` required vars set in this local shell.
  - `pnpm type-check` → passed; `tsc --noEmit` completed with exit code 0.
  - `pnpm lint` → passed; `eslint src/` completed with exit code 0.
  - `pnpm vitest run` → passed; `118` test files and `844` tests passed.
  - `pnpm build` → failed in `prebuild`; `scripts/validate-env.mjs --ci` reported the same missing local env gate (`0/3` critical, `0/4` required).
- **Evidence files:** `tmp/verify-run/validate-env.log`, `tmp/verify-run/type-check.log`, `tmp/verify-run/lint.log`, `tmp/verify-run/vitest.log`, `tmp/verify-run/build.log`.
- **Safety note:** no secret values were supplied, printed, or committed.

### 18) Fresh local missing-env route smoke found a Google OAuth callback 500
- **Timestamp:** `2026-06-07T10:22:03Z`
- **Server command:** `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= ANTHROPIC_API_KEY= VAULT_ENCRYPTION_KEY= CRON_SECRET= FOUNDER_USER_ID= pnpm exec next dev -p 3004`
- **Smoke command shape:** `curl -sS -i --max-redirs 0 http://127.0.0.1:3004/<path>`
- **Actual PASS results:** `/` → `307 /auth/login?redirectTo=%2F`; `/auth/login` → `200`; `/api/health` → `503` degraded; representative protected contacts/email/campaigns/dashboard/video/integrations APIs → `307` login redirects or explicit `401`; `/api/health/google` → `200`; `/api/health/connectors` → `401`.
- **Actual FAIL result:** `/api/auth/google/callback` with no query params returned `500 Internal Server Error`.
- **Evidence file:** `tmp/verify-run/smoke-3004.log`.

### 19) Google OAuth app-url hardening fixed the verified 500
- **Timestamp:** `2026-06-07T10:24:59Z`
- **Change:** Google OAuth `authorize` and `callback` now fall back to the incoming request origin when `NEXT_PUBLIC_APP_URL` is absent, instead of calling `.trim()` on an undefined env var.
- **Targeted command:** `pnpm vitest run src/app/api/auth/google/__tests__/authorize.test.ts`
- **Targeted result:** passed; `1` test file / `7` tests.
- **Live command:** `curl -sS -i --max-redirs 0 http://127.0.0.1:3004/api/auth/google/callback`
- **Live result:** passed; route changed from `500 Internal Server Error` to `307 Temporary Redirect` with `location: http://localhost:3004/auth/login`.
- **Full gates after final code:** `pnpm type-check && pnpm lint && pnpm vitest run` passed; `118` test files / `847` tests.
- **Build check after final code:** `pnpm build` failed in `prebuild` because local env validation still reports `0/3` critical and `0/4` required vars set.
- **Evidence files:** `tmp/verify-run/google-oauth-authorize-callback-fix.log`, `tmp/verify-run/google-callback-live-after.log`, `tmp/verify-run/post-google-oauth-final-gates.log`, `tmp/verify-run/final-build.log`.

### 20) Post-merge verification after resolving PR #95 report-file conflicts
- **Timestamp:** `2026-06-07T10:28:26Z`
- **Merge context:** `origin/main` was merged into `feat/24h-verify-and-harden`; conflicts were limited to `COVERAGE.md`, `EVIDENCE.md`, `STATUS.md`, and `DECISIONS_NEEDED.md`.
- **Resolution:** kept the appended verification/report updates and removed conflict markers.
- **Commands / actual results:**
  - `pnpm vitest run src/app/api/auth/google/__tests__/authorize.test.ts` → passed; `1` file / `7` tests.
  - `pnpm type-check` → passed.
  - `pnpm lint` → passed.
  - `pnpm vitest run` → passed; `118` files / `847` tests.
  - `pnpm build` → failed in `prebuild` because local env validation still reports `0/3` critical and `0/4` required vars set.
- **Evidence files:** `tmp/verify-run/post-merge-gates.log`, `tmp/verify-run/post-merge-build.log`.

### 21) Contact CRUD verification lane resolved to production-safe mode
- **Timestamp:** `2026-06-07T10:58:37Z`
- **Branch:** `feat/verify-contact-crud`
- **Host/effect commands:**
  - `vercel env run --environment development -- node <safe host/effect check>`
  - `vercel env run --environment preview --git-branch feat/verify-contact-crud -- node <safe host/effect check>`
  - `vercel env run --environment production -- node <safe host/effect check>`
- **Actual result:**
  - Development host: `lksfwktwtmyznckodsau.supabase.co`, matching known production ref; `/rest/v1/contacts?select=id&limit=1` returned `401 Invalid API key`.
  - Preview host: `lksfwktwtmyznckodsau.supabase.co`, matching known production ref; `/rest/v1/contacts?select=id&limit=1` returned `401 Invalid API key`.
  - Production host: `lksfwktwtmyznckodsau.supabase.co`, matching known production ref; `/rest/v1/contacts?select=id&limit=1` returned `200 []`.
- **Safety result:** production-safe mode engaged. No seed, create, update, delete, schema change, deployment, promotion, or alias action was performed.

### 22) Contact CRUD guard added but authenticated proof is UNKNOWN
- **Timestamp:** `2026-06-07T10:58:37Z`
- **Added guard files:** `scripts/contact-crud-verification.mjs`, `e2e/contact-crud.spec.ts`, and package script `pnpm test:e2e:contact-crud`.
- **Setup refusal command:** `vercel env run --environment production -- node scripts/contact-crud-verification.mjs setup`
- **Setup refusal result:** failed safely with `Refusing setup: lksfwktwtmyznckodsau.supabase.co is the known production Supabase host`.
- **Focused e2e command:** `vercel env run --environment production -- pnpm test:e2e:contact-crud`
- **Focused e2e result:** failed before authenticated list with `PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_PASSWORD are unavailable to the authenticated Contact CRUD test`.
- **Mechanical gates:** `pnpm type-check` passed; `pnpm lint` passed.
- **Final focused rerun:** `vercel env run --environment production -- pnpm test:e2e:contact-crud` still failed before authenticated list with `PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_PASSWORD are unavailable to the authenticated Contact CRUD test`.
- **Evidence files:** `tmp/contact-crud-type-lint.log`, `tmp/contact-crud-prod-status-setup-refusal.log`, `tmp/contact-crud-prod-e2e-after-browser.log`, `tmp/contact-crud-final-focused.log`, `tmp/contact-crud-final-lint.log`.
- **Conclusion:** Contact CRUD remains `UNKNOWN`; the current environment proves only that the configured Vercel lanes point at the known production Supabase host and that the new guard refuses production writes.

### 23) Post-merge sandbox lane check still resolves to production Supabase
- **Timestamp:** `2026-06-07T11:12:51Z`
- **Branch / PR context:** PR #96 was merged, but the original objective still requires a confirmed non-production Contact CRUD lane before seed/write/delete verification.
- **Commands / actual results:**
  - `gh pr view 96 --json number,state,mergedAt,mergeCommit,url,headRefName,baseRefName` -> PR #96 state `MERGED`, merged at `2026-06-07T11:06:45Z`, merge commit `5a6e767062085c63a36e04b12bd9e107d5143198`.
  - `vercel project ls` -> project list includes `unite-hub-sandbox` with production URL `https://unite-hub-sandbox.vercel.app`.
  - `vercel project inspect unite-hub-sandbox` -> project ID `prj_tNqIsHGY3kvw7zdO2bXVxFWTPIk0`, name `unite-hub-sandbox`, owner `Unite-Group`.
  - `node <public bundle grep for https://unite-hub-sandbox.vercel.app/auth/login chunks>` -> scanned `27` client chunks; only Supabase host found was `https://lksfwktwtmyznckodsau.supabase.co`.
  - `vercel env run --cwd /tmp/<sandbox-project-link> --environment production -- node <safe host/effect check>` -> host `lksfwktwtmyznckodsau.supabase.co`, REST `/rest/v1/contacts?select=id&limit=1` status `200`, body prefix `[]`.
  - Same safe host/effect check for sandbox `development` and `preview` envs -> both host `lksfwktwtmyznckodsau.supabase.co`, REST status `200`, body prefix `[]`.
  - Sandbox Vercel `production`, `preview`, and `development` env readiness check -> `hasPlaywrightEmail:false`, `hasPlaywrightPassword:false`, `hasUrl:true`, `hasAnon:true`.
- **Supabase project inventory:** Supabase project list includes a separate project named `Unite-Group Test` with ref `xgqwfwqumliuguzhshwv`, but the Unite-Hub Vercel sandbox/development/preview/production envs checked above are not wired to that host.
- **Safety result:** no seed, create, update, delete, schema, deploy, promotion, alias, billing, or secret-printing action was performed.
- **Conclusion:** the requested full authenticated Contact CRUD proof remains blocked by the same condition: no configured non-production Unite-Hub Supabase lane plus no test login credentials in the checked runtimes.

### 24) Continuation audit: blocker unchanged
- **Timestamp:** `2026-06-07T11:18:00Z`
- **Commands / actual results:**
  - `gh pr view 97 --json number,state,url,mergeStateStatus,mergeable,headRefName,baseRefName,commits,files` -> PR #97 is `OPEN`, `mergeable:MERGEABLE`, `mergeStateStatus:BLOCKED`; files changed are `DECISIONS_NEEDED.md`, `EVIDENCE.md`, and `STATUS.md`.
  - `vercel env run --cwd /tmp/<sandbox-project-link> --environment production -- node <safe host/effect and test-login presence check>` -> host `lksfwktwtmyznckodsau.supabase.co`, REST status `200`, body prefix `[]`, `hasPlaywrightEmail:false`, `hasPlaywrightPassword:false`.
  - Same safe check for sandbox `preview` -> host `lksfwktwtmyznckodsau.supabase.co`, REST status `200`, body prefix `[]`, `hasPlaywrightEmail:false`, `hasPlaywrightPassword:false`.
  - Same safe check for sandbox `development` -> host `lksfwktwtmyznckodsau.supabase.co`, REST status `200`, body prefix `[]`, `hasPlaywrightEmail:false`, `hasPlaywrightPassword:false`.
- **Safety result:** no seed, create, update, delete, schema, deploy, promotion, alias, billing, or secret-printing action was performed.
- **Conclusion:** the same blocker has repeated after the PR #96 merge and PR #97 follow-up: no confirmed non-production Unite-Hub Supabase lane is configured, and no Playwright test-login credentials are present in the checked runtimes.
