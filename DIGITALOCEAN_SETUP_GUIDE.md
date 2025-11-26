# DigitalOcean Setup Guide for Synthex.social

**Target**: Deploy Synthex.social MVP to DigitalOcean App Platform
**Time Estimate**: 45 minutes
**Difficulty**: Beginner-friendly

---

## Step 1: Create DigitalOcean Account (5 minutes)

### If you don't have an account:

1. Go to [digitalocean.com](https://digitalocean.com)
2. Click "Sign Up" (top right)
3. Enter email address
4. Create strong password
5. Choose "I'm here to deploy applications" (select this option)
6. Complete email verification
7. Add payment method (credit/debit card)

### If you already have an account:
- Just log in to your Dashboard

---

## Step 2: Create a New App (10 minutes)

### In DigitalOcean Dashboard:

1. **Navigate to Apps**
   - Click "Apps" in left sidebar
   - Click "Create Apps" (blue button)

2. **Connect GitHub**
   - Choose "GitHub" as source
   - Click "Authorize with GitHub"
   - Allow DigitalOcean to access your repos
   - Find and select `unite-hub` repository
   - Branch: `main`
   - Click "Next"

3. **Configure App**
   - App name: `synthex-social`
   - Region: Select closest to you (e.g., `nyc` for US, `lon` for EU)
   - Click "Next"

---

## Step 3: Configure Service (15 minutes)

### In the Service Configuration screen:

1. **Add Environment Variables**

Click "Edit" on the service, then scroll to "Environment Variables"

Add these variables (get values from your production setup):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-api-key
NEXTAUTH_URL=https://synthex-social-xxxxx.ondigitalocean.app
NEXTAUTH_SECRET=your-random-secret-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Where to get these values:**

| Variable | Source | How to Get |
|----------|--------|-----------|
| `SUPABASE_URL` | Supabase Dashboard | Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard | Settings → API → Anon public key |
| `SERVICE_ROLE_KEY` | Supabase Dashboard | Settings → API → Service role secret 🔒 |
| `ANTHROPIC_API_KEY` | Claude Console | https://console.anthropic.com → API Keys |
| `NEXTAUTH_URL` | DigitalOcean (see below) | Will be provided after creation |
| `NEXTAUTH_SECRET` | Generate yourself | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | OAuth 2.0 Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | OAuth 2.0 Credentials 🔒 |

2. **Check Build Configuration**
   - Build command: `npm run build`
   - Run command: `npm run start`
   - HTTP Port: `3008`
   - These should auto-fill correctly

3. **Review and Create**
   - Click "Next"
   - Review all settings
   - Click "Create Resources" (blue button)

---

## Step 4: Wait for Deployment (10 minutes)

### DigitalOcean will:
- Build your application
- Run tests
- Deploy to a live URL
- Show you the URL

**Monitor the deployment:**
1. Watch the "Logs" tab for build progress
2. Look for messages like:
   - ✅ "Build successfully started"
   - ✅ "Deploying application"
   - ✅ "Deployment complete"

**If you see errors:**
- Check logs for error messages
- Common issues: Missing env vars, build failures
- See troubleshooting section below

---

## Step 5: Get Your Live URL (Immediate)

Once deployment completes:

1. In the DigitalOcean Apps dashboard, find your app
2. Look for "Live App" URL at the top
3. It will look like: `https://synthex-social-xxxxx.ondigitalocean.app`

**Save this URL** - you'll need it for:
- Testing the app
- Setting up domain
- Updating OAuth redirects

---

## Step 6: Connect Custom Domain (Optional - 10 minutes)

### If you have `synthex.social` domain:

1. **In DigitalOcean App:**
   - Click "Settings" (bottom left)
   - Scroll to "Domains"
   - Click "Add Domain"
   - Enter: `synthex.social`
   - Click "Add Domain"

2. **Update Domain Registrar:**
   - DigitalOcean will show you 4 nameservers
   - Copy these nameservers
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Find "Nameservers" settings
   - Replace existing nameservers with DO ones
   - Wait 5-30 minutes for DNS propagation

3. **Verify Setup:**
   - Go to your domain
   - Should load your Synthex app
   - Check for SSL certificate (green lock)

---

## Step 7: Update Supabase OAuth Redirect (5 minutes)

### In your Supabase Dashboard:

1. Go to **Settings → Auth → OAuth Providers**
2. Find **Google**
3. Update redirect URI to:
   ```
   https://synthex-social-xxxxx.ondigitalocean.app/api/auth/callback/google
   ```
   (Replace `xxxxx` with your actual DigitalOcean app ID)

4. Save changes

---

## Step 8: Test Your Deployment (5 minutes)

### Critical tests to run:

**1. Application Loads**
```bash
curl https://synthex-social-xxxxx.ondigitalocean.app
# Should return HTML (no 404/500 errors)
```

**2. OAuth Login Works**
- Open app in browser
- Click "Continue with Google"
- Should redirect to Google login
- After auth, should load dashboard

**3. Create Test Tenant**
- Go to `/synthex/onboarding`
- Fill form and submit
- Should create tenant in Supabase
- Should redirect to dashboard

**4. Check Logs for Errors**
- In DigitalOcean Apps → Your App → Logs
- Look for any error messages
- Should see successful API calls

**5. Verify Database Connection**
- Check Supabase dashboard
- Should see new test tenant in `synthex_tenants`

---

## Monitoring Your App

### Daily Checks:

1. **Uptime Monitoring**
   - DigitalOcean → Apps → Your App → Metrics
   - Check CPU/Memory usage
   - Should be low (<20% CPU, <30% memory)

2. **Error Monitoring**
   - Logs tab → Look for 5xx errors
   - Should be minimal/none
   - If errors appear, click to see details

3. **Database Connection**
   - Test a simple query in Supabase SQL Editor
   - Verify synthex_* tables are accessible

### Weekly Checks:

1. Create a test job and verify execution
2. Check Anthropic API usage (console.anthropic.com)
3. Review DigitalOcean billing (shouldn't exceed $15/month for MVP)

---

## Scaling Later (If Needed)

If your app gets slow or crashes:

1. **Increase Resources**
   - DigitalOcean Apps → Settings → Instance Size
   - Choose larger tier (e.g., `XS` → `S` → `M`)
   - Auto-redeploys with new size

2. **Enable Auto-Scaling**
   - DigitalOcean Apps → Settings → Auto Scaling
   - Set min/max instances
   - Automatically spawns more instances under load

3. **Add Database Replicas**
   - Supabase Dashboard → Databases
   - Create read replica in different region
   - Automatically replicates data

---

## Troubleshooting

### Issue 1: Deployment Fails with "Build Error"

**Solution:**
1. Check Logs tab in DigitalOcean
2. Look for error message (usually about missing dependencies)
3. Common fixes:
   - Missing environment variable → Add it and redeploy
   - Build timeout → Increase timeout in Settings
   - npm install fails → Clear cache: `npm install --force`

**If stuck:**
```bash
# Delete and start over (nuclear option)
# In DigitalOcean: Apps → Delete App
# Fix the issue locally
# Redeploy
```

---

### Issue 2: "404 Not Found" When Loading App

**Solution:**
1. Verify app is fully deployed (green checkmark in dashboard)
2. Wait 2-3 minutes for DNS to propagate
3. Try incognito/private window (clears cache)
4. Check logs for startup errors

---

### Issue 3: "OAuth Redirect Failed" Error

**Solution:**
1. Get your live URL: `https://synthex-social-xxxxx.ondigitalocean.app`
2. Update Supabase OAuth redirect:
   - Settings → Auth → OAuth Providers → Google
   - Redirect URI: `https://synthex-social-xxxxx.ondigitalocean.app/api/auth/callback/google`
3. Wait 2 minutes and try again

---

### Issue 4: Database Connection Timeout

**Solution:**
1. Check Supabase status: https://status.supabase.com
2. Verify `SERVICE_ROLE_KEY` is correct (no extra spaces)
3. Check Supabase firewall:
   - Supabase → Settings → Network
   - Should allow "All IPV4 addresses" for MVP
4. Restart app (DigitalOcean → Apps → Restart)

---

### Issue 5: High CPU/Memory Usage

**Solution:**
1. Check if jobs are queued: Supabase → `synthex_project_jobs` table
2. Look for stuck jobs (status = 'running' for >10 minutes)
3. Cancel stuck jobs or restart app
4. Upgrade instance size if persistent

---

## Deployment Checklist (Before Going Live)

- [ ] DigitalOcean account created with payment method
- [ ] GitHub connected to DigitalOcean
- [ ] App created and deploying
- [ ] All 8 environment variables configured
- [ ] Supabase migration run (`synthex_core_structure.sql`)
- [ ] Deployment completes without errors
- [ ] Live URL loads without 500 error
- [ ] Google OAuth works (can login)
- [ ] Can create test tenant
- [ ] Can view test tenant in Supabase
- [ ] Logs show no critical errors
- [ ] Domain configured (optional, can use DigitalOcean URL)

---

## Cost Estimate (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean App Platform | $5-15 | Starter: $5, Baseline: $12 |
| Supabase Database | $0 | Free tier (500MB) |
| Anthropic API | $15-30 | ~100 jobs/month @ $0.20 avg |
| Domain (synthex.social) | $10-15 | One-time or annual |
| **Total** | **$30-60** | MVP cost |

*Note: First $10/month free on DigitalOcean if you're new*

---

## What to Do Next

1. **Immediately after deployment:**
   - Test the 5 critical tests above
   - Run SYNTHEX_VALIDATION_GUIDE.md

2. **First week:**
   - Monitor logs daily
   - Create 5-10 test jobs
   - Verify costs are accurate

3. **Ready to launch:**
   - Invite first 3 customers
   - Collect feedback
   - Monitor performance

---

## Support & Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
- **Status**: https://status.digitalocean.com
- **Supabase Docs**: https://supabase.com/docs
- **Claude Docs**: https://docs.anthropic.com

---

## Sign-Off

**DigitalOcean Setup Complete**: __________ (Date)

**Live URL**: https://synthex-social-____________.ondigitalocean.app

**Deployment Status**: ☐ Testing ☐ Ready ☐ Live

**First Test Completed**: ☐ Yes ☐ No

---

**Estimated time to complete: 45 minutes**
**You now have a production Synthex.social running on DigitalOcean!** 🚀
