# Integrations — Context Node

> READ FIRST before editing any third-party integration under `src/lib/integrations/`.
> Child context node (intent-layer pattern). Inherits root `/CLAUDE.md` + `.claude/rules/`.

## What this area owns

All outbound third-party connections: `xero/` + `xero.ts` (accounting/revenue),
`gmail.ts` + `imap.ts` (email), `google.ts` / `google-oauth.ts` / `google-drive.ts` /
`calendar.ts`, `linear.ts` + `linear-board.ts` + `linear-monitor.ts`, `sendgrid.ts`,
`social/` + `social.ts`, `github.ts` + `github-board.ts`, `heygen.ts`, `reddit.ts`.

Out of scope: HTTP routing (`src/app/api/`), credential storage (the pgsodium Vault via
`src/lib/vault/`). Integrations read credentials through Vault RPCs, never raw env secrets
for per-business OAuth tokens.

## Non-negotiable invariants

1. **Real-vs-mock must be explicit.** Functions that can degrade return a `source`
   discriminator, e.g. `fetchRevenueMTD` → `{ data, source: 'xero' | 'mock' }`, backed by
   `getMockRevenueMTD`. **Callers MUST surface `source`. Never present mock data as real.**
   The same pattern exists in `gmail.ts` and `calendar.ts`. A $2B valuation dashboard fed
   silent mock revenue is the single worst failure mode in this codebase — fail loud, not fake.
2. **Founder/business scoping.** Credential lookups are keyed by `(founderId, businessKey)`.
   Business keys: `dr, nrpg, carsi, restore, synthex, ato, ccw` (see `src/lib/businesses.ts`).
   Xero token state (verified live 31/05/2026, `credentials_vault`): tokens stored ONLY for
   `dr` + `carsi`. No tokens for `nrpg, restore, synthex, ccw, ato`. Note: even the two stored
   tokens return `source: 'mock'` until the Xero client secrets are set in env —
   `isXeroConfigured()` is false in prod (only `GOOGLE_CLIENT_*` set). Activation needs
   `XERO_CLIENT_ID/SECRET` (carsi, restore, synthex, ccw) + `DR_CLIENT_ID/SECRET` (dr, nrpg).
3. **Graceful degradation.** A missing/expired integration must not crash a request.
   Catch, return an empty/`mock`-flagged result, and let the caller decide. CI builds run
   with placeholder keys — integrations must boot without real credentials.
4. **Token refresh.** OAuth integrations (Xero, Google) refresh expired tokens before the
   call (`refreshXeroToken`). Never assume a stored token is still valid.

## Patterns to follow

- One module per provider; shared OAuth helpers in `google-oauth.ts` / `xero/client.ts`.
- Tests live in `__tests__/` and mock the provider SDK, not our wrapper.
- Surface partial failure with `Promise.allSettled` when fanning out across businesses
  (see how `dashboard/kpi` aggregates Xero across keys).

## Audit relevance

When classifying routes GREEN/AMBER/RED for the portfolio build: a route backed by an
integration that can return `source: 'mock'` is **AMBER until proven connected**. The
remediation is always the same — make it GREEN (real data) or fail loudly (clear
"not connected" state), never a silent fake.
