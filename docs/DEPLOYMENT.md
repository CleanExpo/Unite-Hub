# Deployment Playbook

> Unite-Group Nexus — single-user founder CRM deployed on Vercel.

## Architecture

```
GitHub (main branch)
  │
  ├─► GitHub Actions CI (.github/workflows/ci.yml)
  │     ├── Lint & type-check
  │     ├── Unit & integration tests
  │     ├── Build verification
  │     └── Security scan (pnpm audit + Trivy)
  │
  ├─► Vercel auto-deploy (GitHub integration)
  │     └── Production: unite-group.in
  │
  ├─► Smoke tests (.github/workflows/smoke-tests.yml)
  │     └── Triggered after CI succeeds on main (8 checks)
  │
  └─► Nightly health check (.github/workflows/nightly-healthcheck.yml)
        ├── API health + database connectivity
        ├── Response time metrics
        └── SSL certificate expiry check
```

Vercel deploys automatically on every push to `main`. There is no separate backend service — all API routes run as Vercel serverless functions under `src/app/api/`.

## Environment Variables

Set these in the Vercel dashboard under **Settings > Environment Variables**.

### Required (core)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Claude AI API key |
| `VAULT_ENCRYPTION_KEY` | AES-256-GCM key for credentials vault (64 hex chars) |
| `CRON_SECRET` | Shared secret for cron job authorisation |
| `FOUNDER_USER_ID` | Supabase auth UUID for the founder account |
| `NEXT_PUBLIC_APP_URL` | `https://unite-group.in` |

### Required (integrations — Phase 4)

| Variable | Purpose |
|----------|---------|
| `XERO_CLIENT_ID` / `XERO_CLIENT_SECRET` | Xero accounting OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Gmail, Calendar, Drive OAuth |
| `GOOGLE_DRIVE_VAULT_FOLDER_ID` | Drive folder for vault backups |
| `LINEAR_API_KEY` / `LINEAR_WORKSPACE_ID` | Linear project management |

### Optional (database pooling)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | — | Direct PostgreSQL connection string |
| `ENABLE_DB_POOLER` | `false` | Enable Supabase connection pooler |
| `DB_POOL_SIZE` | `10` | Pool size |
| `DB_POOLER_MODE` | `transaction` | Pooler mode |
| `DB_IDLE_TIMEOUT` | `30` | Idle timeout (seconds) |
| `DB_MAX_LIFETIME` | `3600` | Max connection lifetime (seconds) |

### Optional (social platforms)

| Variable | Purpose |
|----------|---------|
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook/Instagram publishing |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn publishing |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok publishing |

YouTube uses the existing Google OAuth credentials.

## Secrets Rotation

Rotate these periodically. After rotation, update the value in the Vercel dashboard and trigger a redeployment.

| Secret | Rotation method |
|--------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API > Regenerate |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API > Regenerate |
| `XERO_CLIENT_SECRET` | Xero Developer Portal > App > Configuration |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console > APIs & Services > Credentials |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` |
| `VAULT_ENCRYPTION_KEY` | Generate: `openssl rand -hex 32` — re-encrypt vault entries after rotation |
| `ANTHROPIC_API_KEY` | Anthropic Console > API Keys > Create new key |

**Important:** After rotating `VAULT_ENCRYPTION_KEY`, existing encrypted vault entries must be re-encrypted with the new key. Run the vault re-encryption script before deploying.

## Cron Jobs

Configured in `vercel.json`:

| Job | Schedule | Path | Status |
|-----|----------|------|--------|
| Bookkeeper | `0 16 * * *` (02:00 AEST) | `/api/cron/bookkeeper` | Active |
| Life Coach | `15 21 * * *` (07:15 AEST) | `/api/cron/coaches/life` | Active |
| Revenue Coach | `30 21 * * *` (07:30 AEST) | `/api/cron/coaches/revenue` | Active |
| Build Coach | `45 21 * * *` (07:45 AEST) | `/api/cron/coaches/build` | Active |
| Marketing Coach | `0 22 * * *` (08:00 AEST) | `/api/cron/coaches/marketing` | Active |

Cron routes are protected by `CRON_SECRET` — Vercel sends it in the `Authorization` header automatically.

## Rollback Procedure

1. Open the Vercel dashboard: **Deployments** tab
2. Find the last known-good deployment
3. Click the **"..."** menu on that deployment
4. Select **Promote to Production**

The rollback is instant — Vercel serves the previous build immediately. No rebuild required.

## Domain & SSL

- **Domain:** `unite-group.in`
- **DNS:** Managed through Vercel (nameservers delegated)
- **SSL:** Auto-provisioned and auto-renewed by Vercel (Let's Encrypt)
- **Nightly check:** `.github/workflows/nightly-healthcheck.yml` verifies SSL expiry and alerts if < 30 days remaining

## Manual Deploy Script

For manual deployments (bypassing the GitHub push workflow):

```bash
./scripts/deploy.sh
```

This runs type-check, lint, and build locally before deploying via the Vercel CLI.

## Future: Multi-Project Onboarding

When additional projects (Synthex, CARSI, etc.) become separate repositories:

1. Create a new Vercel project linked to the repo
2. Copy the relevant env vars from the template above
3. Configure the domain in Vercel > Settings > Domains
4. Add the repo to the CI workflow matrix if shared workflows are needed
5. Set up smoke test and health check workflows per the patterns in `.github/workflows/`
