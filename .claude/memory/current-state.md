# Current State
> Updated by agent. Session: d164e156

## Active Task
P0 security hardening — complete as of 19/03/2026.

## Recent Architectural Choices
See architectural-decisions.md for logged decisions.

## In-Progress Work
All P0 security blockers resolved across 2 commits:
- 895beccd — 11 vulnerabilities (middleware, OAuth CSRF, XSS, header injection, vault pw, open redirect, PATCH allowlist, CRON trim, error encoding)
- b990e94a — SSRF block + approval_queue founder_id

New file: src/lib/oauth-state.ts (HMAC-signed OAuth state, used by all 5 OAuth flows)

Remaining from full security audit (P1/P2 — not blockers):
- CI build job missing 5 env vars (ci.yml)
- Mutable @master action tags in security.yml
- Health check uses anon key (false positive risk)
- E2E tests target prod URL not PR preview
- error_log NOT NULL vs app sending null (bookkeeper migration)
- platform_analytics missing ON DELETE CASCADE
- Rate limiter X-Forwarded-For spoofable (use x-vercel-forwarded-for)
- Vault returns all plaintext entries in one response
- Social tokens not deleted on disconnect
- Raw Xero financial data stored unencrypted in bookkeeper_transactions.raw_xero_data
- No data deletion mechanism (AU Privacy Act APP 11)

## Next Steps
- Run pnpm vitest run to confirm tests pass
- Push to remote + Vercel deploy
- Re-authenticate all 6 Gmail accounts (new gmail.modify + gmail.send scopes)
- Consider P1 fixes above before go-live

## Last Updated
19/03/2026 03:15 AEST
