# Secrets Rotation Runbook

**Owner:** Phill McGurk (sole operator)
**Applies to:** Unite-Group Nexus 2.0 (Vercel + Supabase)
**Review cadence:** Every 90 days, or immediately after a suspected exposure

---

## Secrets Inventory

| Secret | Location | Where Used | Rotation Complexity |
|--------|----------|-----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Client-side Supabase init | Low (public, non-sensitive) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Client-side auth + RLS | Low (public, RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server-only) | Server-side bypass RLS | **High — rotate immediately if exposed** |
| `ANTHROPIC_API_KEY` | Vercel (server-only) | MACAS + all AI routes | **High** |
| `XERO_CLIENT_ID` | Vercel (server-only) | Xero OAuth2 | Medium |
| `XERO_CLIENT_SECRET` | Vercel (server-only) | Xero OAuth2 | Medium |
| `GITHUB_TOKEN` | Vercel (server-only) | Hub sweep — GitHub API reads | Low (read-only scopes) |
| `LINEAR_API_KEY` | Vercel (server-only) | Linear issues + KPI routes | Medium |
| `CRON_SECRET` | Vercel (server-only) | Validates cron route requests | **High — rotate if cron endpoints leak** |
| `FOUNDER_USER_ID` | Vercel (server-only) | Cron routes — sets founder context | Low (non-secret identifier) |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel + `.env.local` | Error monitoring | Low (public DSN) |

---

## Rotation Procedures

### Supabase Service Role Key

**Risk:** Full database access bypassing RLS. Rotate immediately if server logs or error messages expose this.

1. Go to Supabase Dashboard → Project Settings → API
2. Click **Regenerate** next to `service_role` key
3. Copy the new key
4. In Vercel Dashboard → Project → Settings → Environment Variables:
   - Update `SUPABASE_SERVICE_ROLE_KEY` for all environments (Production, Preview, Development)
5. Trigger a new Vercel deployment: `vercel deploy --prod` or push to `main`
6. Verify: `curl https://unite-group.in/api/health` returns 200
7. Verify MACAS cases still load at `/founder/advisory`

---

### Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Create a new key, then delete the old one
3. Update `ANTHROPIC_API_KEY` in Vercel Environment Variables
4. Trigger new deployment
5. Verify: Create a test MACAS advisory case and confirm AI firms respond

---

### Xero Client Secret

**Note:** Rotating the client secret will invalidate all existing Xero OAuth tokens.

1. Go to [developer.xero.com](https://developer.xero.com) → My Apps → Unite-Group
2. Generate a new client secret
3. Update `XERO_CLIENT_SECRET` in Vercel
4. Trigger new deployment
5. Re-authorise Xero for each connected business via `/founder/xero`
6. Run a manual bookkeeper trigger to confirm Xero data flows

---

### CRON_SECRET

**Note:** Changing this will block all scheduled cron jobs until Vercel is updated.

1. Generate a new random secret:
   ```bash
   openssl rand -base64 32
   ```
2. Update `CRON_SECRET` in Vercel Environment Variables
3. Trigger new deployment
4. Verify next scheduled cron run succeeds (check Vercel Functions logs)

---

### LINEAR_API_KEY

1. Go to Linear → Settings → API → Personal API Keys
2. Create a new key (label it `unite-group-nexus-prod-YYYY-MM`)
3. Delete the old key
4. Update `LINEAR_API_KEY` in Vercel
5. Trigger new deployment
6. Verify: `/api/linear/kpi` returns data

---

### GITHUB_TOKEN

1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Create a new fine-grained token with read-only access to:
   - Metadata (read)
   - Contents (read)
   - Issues (read)
   - Pull requests (read)
   - Commit statuses (read)
   - Limit to Unite-Group org repositories only
3. Update `GITHUB_TOKEN` in Vercel
4. Delete the old token from GitHub
5. Trigger new deployment

---

## Emergency Exposure Response

If a secret is suspected to have been exposed (e.g., committed to git, visible in logs, shared accidentally):

1. **Rotate immediately** — do not wait for the 90-day cycle
2. Check git history: `git log -p --all -S "SECRET_VALUE_FRAGMENT"` to confirm exposure scope
3. If committed to git history, contact GitHub support to purge the commit data
4. Review Vercel function logs for the exposure window to detect any unauthorised usage
5. For Supabase service role: check `auth.audit_log_entries` for suspicious activity during the window
6. For Anthropic key: check API usage dashboard for unexpected cost spikes

---

## Rotation Checklist (90-day cycle)

Run this every 90 days:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` — regenerated in Supabase dashboard
- [ ] `ANTHROPIC_API_KEY` — new key created, old key deleted
- [ ] `CRON_SECRET` — new `openssl rand -base64 32` value
- [ ] `LINEAR_API_KEY` — new personal API key, old deleted
- [ ] `GITHUB_TOKEN` — new fine-grained token, old deleted
- [ ] `XERO_CLIENT_SECRET` — regenerated (requires Xero re-auth)
- [ ] All changes deployed to Vercel production
- [ ] All cron jobs verified in Vercel logs
- [ ] MACAS case creation verified end-to-end
- [ ] `.env.local` on local machine updated to match

**Last rotation:** _Not yet performed_
**Next due:** _Set date after first rotation_
