# Evidence — append only

Date: 2026-06-07T09:05:13Z
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

### 4) Full Vitest suite passes on current PR head
- **Command:** `pnpm vitest run`
- **Actual result:** passed
- **Evidence:** `118 passed` test files, `843 passed` tests, exit code 0.

### 5) Targeted regression test for `getUserWithRole()` missing-config guard passes
- **Command:** `pnpm vitest run src/lib/supabase/__tests__/server.test.ts`
- **Actual result:** passed
- **Evidence:** `3 passed`; test asserts `getUser`, `getSession`, and `getUserWithRole` return `null` without calling `createServerClient` when Supabase env is missing.

### 6) Local production build is blocked by absent local secrets/env, not by an observed TypeScript/build error
- **Command:** `pnpm build`
- **Actual result:** failed in `prebuild`
- **Evidence:** `scripts/validate-env.mjs --ci` reported `0/3` critical and `0/4` required env vars set in the local shell, then exited 1. No secret values were printed or supplied.

### 7) GitHub Build Application passed on PR #93 current commit
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

### 10) Final PR check and merge state
- **Command:** `gh pr view 93 --json state,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,headRefOid`
- **Actual result:** clean/mergeable
- **Evidence:** `headRefOid=f41abce4f507f2914f81c8fd3b8775aef4fcbae9`, `mergeable=MERGEABLE`, `mergeStateStatus=CLEAN`, all check-rollup entries success or skipped.

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
- **Evidence:** GitHub status contexts passed:
  - `Vercel – unite-hub` → `https://vercel.com/unite-group/unite-hub/4RAU9HFy6hrcbqx3QDtzLGruuDhQ`
  - `Vercel – unite-hub-sandbox` → `https://vercel.com/unite-group/unite-hub-sandbox/8Sj87vsVAM3kf28QB2wq3JbU19qL`
- **Note:** This is preview deployment readiness, not proof of authenticated product journeys.
