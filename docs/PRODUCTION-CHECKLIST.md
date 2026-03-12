# Production Checklist

> One-time pre-launch verification for Unite-Group Nexus.

## Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Vercel
- [ ] `ANTHROPIC_API_KEY` set in Vercel — rate limits confirmed with Anthropic
- [ ] `VAULT_ENCRYPTION_KEY` set in Vercel — securely backed up offline
- [ ] `CRON_SECRET` rotated from development value
- [ ] `FOUNDER_USER_ID` set to production Supabase auth UUID
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://unite-group.in`
- [ ] `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` set (Phase 4)
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set (Phase 4)
- [ ] `GOOGLE_DRIVE_VAULT_FOLDER_ID` set (Phase 4)
- [ ] `LINEAR_API_KEY` / `LINEAR_WORKSPACE_ID` set (Phase 4)
- [ ] `DATABASE_URL` set (if using direct connection)

## Security

- [ ] Supabase RLS policies active on all tables
- [ ] `CRON_SECRET` is a strong random value (not a development placeholder)
- [ ] `VAULT_ENCRYPTION_KEY` is 64 hex characters generated via `openssl rand -hex 32`
- [ ] No placeholder or test API keys in production environment
- [ ] Supabase service role key restricted to server-side routes only

## Infrastructure

- [ ] Domain DNS verified (`unite-group.in` resolving to Vercel)
- [ ] SSL certificate auto-renewal confirmed (Vercel-managed)
- [ ] Vercel project linked to GitHub repo (auto-deploy on push to `main`)
- [ ] Vercel function timeouts configured in `vercel.json`

## CI/CD

- [ ] GitHub Actions secrets configured (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] CI pipeline passing on `main` branch
- [ ] Smoke tests passing against production URL (`https://unite-group.in`)
- [ ] Nightly health check cron active (`.github/workflows/nightly-healthcheck.yml`)

## Cron Jobs

- [ ] Bookkeeper cron running at 02:00 AEST (`0 16 * * *` UTC in `vercel.json`)
- [ ] `CRON_SECRET` matches between Vercel env and cron route authorisation check

## Verification

- [ ] `/api/health` returns 200 on production
- [ ] Login page loads at `/auth/login`
- [ ] Homepage redirects unauthenticated users to login (307)
- [ ] Static assets load (favicon, logo)
- [ ] No 5xx errors on auth pages

## Post-Launch

- [ ] Monitor nightly health check results for first 7 days
- [ ] Verify Vercel usage stays within plan limits
- [ ] Confirm Anthropic API usage tracking is working
- [ ] Test rollback procedure once (promote a previous deployment, then revert)
