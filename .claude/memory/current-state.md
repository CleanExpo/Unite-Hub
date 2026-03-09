# Current State
> Updated: 09/03/2026 AEST

## Active Task
Phase 4 Integration Layer — COMPLETE

## What Was Done This Session
- ✅ Real Google OAuth flow: `/api/auth/google/authorize` + `/api/auth/google/callback`
- ✅ Real Gmail threads via `fetchGmailThreads()` — vault-backed, AES-256-GCM tokens
- ✅ Real Calendar events via `fetchCalendarEvents()` — vault-backed
- ✅ Real Stripe MRR via `subscriptions.list()` — `'2025-10-29.clover'` API version
- ✅ `src/lib/supabase/service.ts` — service role client (bypasses RLS)
- ✅ `src/lib/email-accounts.ts` — 11 email → businessKey map
- ✅ `.rgignore` updated — supabase/migrations + Python caches excluded
- ✅ `.env.example` updated — `VAULT_ENCRYPTION_KEY`
- ✅ Google Cloud Console OAuth client — 4 redirect URIs registered:
    - https://unite-group.in/api/google/callback (old)
    - http://localhost:3007/api/google/callback (old dev)
    - https://unite-group.in/api/auth/google/callback (new prod)
    - http://localhost:3007/api/auth/google/callback (new dev)
- ✅ Committed: `feat(integrations): real Google OAuth + Gmail + Stripe MRR — no more mocks`

## Remaining To Go Live
1. Generate `VAULT_ENCRYPTION_KEY`: `openssl rand -hex 32` → add to `.env.local`
2. Add to Vercel env vars: `VAULT_ENCRYPTION_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
3. Deploy to production

## Next Steps
- Test OAuth flow locally once `VAULT_ENCRYPTION_KEY` is in `.env.local`
- Phase 5: Linear integration (UNI-1516)
- Phase 5: Xero integration (UNI-1517)

## Key File Paths
- OAuth authorize: `src/app/api/auth/google/authorize/route.ts`
- OAuth callback: `src/app/api/auth/google/callback/route.ts`
- Google integration: `src/lib/integrations/google.ts`
- Stripe integration: `src/lib/integrations/stripe.ts`
- Vault encryption: `src/lib/vault.ts`
- Service client: `src/lib/supabase/service.ts`
- Email accounts: `src/lib/email-accounts.ts`

## Last Updated
09/03/2026 AEST
