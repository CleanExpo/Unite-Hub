# Evidence — append only

Date: 2026-06-07T06:01:51Z
Branch: `feat/24h-verify-and-harden`

## 2026-06-07

### 1) Environment validation shows the local runtime is missing critical Supabase env vars
- **Command:** `pnpm validate:env`
- **Actual result:** failed
- **Evidence:** validator reported `0/3` critical env vars set, including `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; exit code 1.

### 2) Type-check passes after the missing-env hardening changes
- **Command:** `pnpm type-check`
- **Actual result:** passed
- **Evidence:** `tsc --noEmit` completed with exit code 0.

### 3) Lint passes after removing `any` escapes from the middleware fix
- **Command:** `pnpm lint`
- **Actual result:** passed
- **Evidence:** `eslint src/` completed with exit code 0.

### 4) Full Vitest suite passes
- **Command:** `pnpm vitest run`
- **Actual result:** passed
- **Evidence:** `118 passed` test files, `842 passed` tests, exit code 0.

### 5) Public health endpoint no longer hard-crashes when Supabase env is missing
- **Command:** `curl -i --max-time 10 http://127.0.0.1:3003/api/health`
- **Actual result:** `HTTP/1.1 503 Service Unavailable`
- **Body evidence:** `{"status":"degraded","timestamp":"2026-06-07T06:00:32.607Z","connections":{"supabase":"error"}}`

### 6) Root path now redirects cleanly instead of 500ing
- **Command:** `curl -i --max-time 10 http://127.0.0.1:3003/`
- **Actual result:** `HTTP/1.1 307 Temporary Redirect`
- **Body evidence:** redirect target `/auth/login?redirectTo=%2F`

### 7) Login page renders in the missing-env case
- **Command:** `curl -i --max-time 10 http://127.0.0.1:3003/auth/login`
- **Actual result:** `HTTP/1.1 200 OK`
- **Body evidence:** HTML contains the `Sign in` heading, Google button, email field, password field, and submit button.

### 8) Contacts route no longer hard-crashes in the missing-env case
- **Command:** `curl -i --max-time 10 http://127.0.0.1:3003/api/contacts`
- **Actual result:** `HTTP/1.1 307 Temporary Redirect`
- **Body evidence:** redirect target `/auth/login?redirectTo=%2Fapi%2Fcontacts`

### 9) Targeted unit tests for the hardening fix pass
- **Command:** `pnpm vitest run src/app/api/health/__tests__/route.test.ts src/lib/supabase/__tests__/server.test.ts src/lib/supabase/__tests__/middleware.test.ts src/app/__tests__/page.test.ts`
- **Actual result:** passed
- **Evidence:** `4 passed`, `11 passed`.
