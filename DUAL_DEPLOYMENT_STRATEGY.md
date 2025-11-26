# Dual Deployment Strategy - Vercel + DigitalOcean

**Status**: 🚀 **EXECUTION IN PROGRESS**

**Date**: 2025-11-26
**Strategy**: Vercel (primary/immediate) + DigitalOcean (failover/scaling)
**Estimated Total Time to Full HA**: 30 minutes

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Synthex.social                           │
│                   (Dual Deployment)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌────────────┐              ┌──────────────┐
   │  VERCEL    │              │ DIGITALOCEAN │
   │ (Primary)  │              │ (Failover)   │
   ├────────────┤              ├──────────────┤
   │ Global CDN │              │ App Platform │
   │ Auto scale │              │ Auto-scaling │
   │ 99.9% SLA  │              │ 99.95% SLA   │
   │ $20/month  │              │ $5-15/month  │
   └─────┬──────┘              └──────┬───────┘
         │                            │
         └────────────┬───────────────┘
                      │
              ┌───────▼────────┐
              │   Supabase     │
              │  (Shared DB)   │
              │  PostgreSQL    │
              │   RLS Enabled  │
              └────────────────┘
```

---

## 🎯 Phase 1: Vercel Deployment (In Progress)

### Status: BUILDING

**Current**:
- Upload: ✅ Complete (8.3 MB)
- Build: 🟡 In progress (~2 min elapsed)
- Expected completion: 3-5 minutes

**Actions Needed** (after build completes):

### Step 1A: Verify Build Success
```bash
# After ~2-3 minutes, check status
vercel inspect unite-e4en9oiji-unite-group.vercel.app --logs

# Expected: "Build succeeded" message
```

### Step 1B: Add Environment Variables to Vercel
Go to: **https://vercel.com/unite-group/unite-hub/settings/environment-variables**

Add these 8 critical variables:

```env
# Supabase (copy from .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://lksfwktwtmyznckodsau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-7VD3pXTvJdqiyVVXBVOeHcu2VV11jJLglHrQsCd_VY92PrLL1lSSN_N_OxLbFJWEDuKlQsg113gx9wId8IOl0UCw-_TLITAAA

# NextAuth
NEXTAUTH_URL=https://unite-e4en9oiji-unite-group.vercel.app
NEXTAUTH_SECRET=ejtMMfOz/R/wniUWiSR+9JNh4dyNT+13SlNHuZRMUxM=

# Google OAuth
GOOGLE_CLIENT_ID=537153033593-ivf845sbehan86fjklf8p617rslnqov4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**For each variable**:
1. Name: (as listed above)
2. Value: (paste value from .env.local)
3. Environments: Select **Production** (and Preview if desired)
4. Click **Save**

### Step 1C: Redeploy from Vercel
```bash
# Redeploy with new environment variables
vercel --prod --yes

# Expected: New deployment with env vars
# Time: 3-5 minutes
```

### Step 1D: Test Vercel Deployment (5 minutes)
```
✅ Test checklist:
- [ ] Navigate to: https://unite-e4en9oiji-unite-group.vercel.app
- [ ] Click "Continue with Google" → Google OAuth login
- [ ] Complete onboarding form
- [ ] View dashboard
- [ ] Create a job
- [ ] Check job results
```

**Expected Result**: Vercel deployment live and tested ✅

---

## 🎯 Phase 2: DigitalOcean Deployment (via MCP)

### Status: READY TO DEPLOY

**Prerequisites**:
- ✅ DIGITALOCEAN_API_TOKEN configured in .env.local
- ✅ MCP server configured in .claude/mcp.json
- ✅ App name: synthex-social
- ✅ Region: nyc (New York, most reliable)

### Deployment via MCP (Automated)

I will use the DigitalOcean MCP server to automate the entire deployment. Here's what happens:

**Step 2A: Create DigitalOcean App**

```typescript
// This will be executed via MCP
doctl apps create --spec app.yaml
```

The app spec will include:
```yaml
name: synthex-social
services:
  - name: api
    github:
      repo: unite-group/unite-hub
      branch: main
    build_command: npm run build
    run_command: npm start
    environment_slug: node-18
    http_port: 3000

    envs:
      - key: NEXT_PUBLIC_SUPABASE_URL
        value: https://lksfwktwtmyznckodsau.supabase.co
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        value: [from .env.local]
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: [from .env.local]
      - key: ANTHROPIC_API_KEY
        value: [from .env.local]
      - key: NEXTAUTH_URL
        value: https://synthex-social-xxxxx.ondigitalocean.app
      - key: NEXTAUTH_SECRET
        value: [from .env.local]
      - key: GOOGLE_CLIENT_ID
        value: [from .env.local]
      - key: GOOGLE_CLIENT_SECRET
        value: [from .env.local]
      - key: DIGITALOCEAN_API_TOKEN
        value: [from .env.local]

databases:
  - name: postgres-db
    engine: POSTGRESQL
    version: "14"

domains:
  - domain: synthex-social.ondigitalocean.app
    type: DEFAULT

alerts:
  - name: health-check
    spec:
      rule: CPU_UTILIZATION
      value: 80
    notifications:
      slack_channel: alerts
```

**Step 2B: Automated MCP Execution**

I will execute:
```bash
# Ask Claude to deploy via MCP
"Deploy synthex-social to DigitalOcean using the MCP server with:
- App name: synthex-social
- Region: nyc3
- GitHub repo: unite-group/unite-hub
- Build: npm run build
- Start: npm start
- All environment variables from .env.local"
```

**Result**:
- ✅ App created
- ✅ GitHub integration connected
- ✅ Environment variables configured
- ✅ Database provisioned
- ✅ Deployment triggered
- ✅ Live URL returned (e.g., `https://synthex-social-xxxxx.ondigitalocean.app`)

**Time**: 15 minutes

---

## 🎯 Phase 3: Dual Deployment Verification

### Vercel Testing (5 minutes)

After Vercel build completes:

```bash
# Test primary deployment
curl -I https://unite-e4en9oiji-unite-group.vercel.app

# Expected: HTTP 200
# Test critical endpoints:
# - GET /api/synthex/tenant (should return list)
# - POST /api/synthex/job (should create job)
```

### DigitalOcean Testing (5 minutes)

After DigitalOcean deployment completes:

```bash
# Test failover deployment
curl -I https://synthex-social-xxxxx.ondigitalocean.app

# Expected: HTTP 200
# Verify same endpoints work:
# - GET /api/synthex/tenant
# - POST /api/synthex/job
```

### Database Verification (2 minutes)

```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as tenant_count FROM synthex_tenants;
SELECT COUNT(*) as subscription_count FROM synthex_plan_subscriptions;
SELECT COUNT(*) as job_count FROM synthex_project_jobs;

-- Both deployments should read the same shared database
```

---

## 🎯 Phase 4: Failover Configuration (Optional but Recommended)

### DNS Setup (Point to Both)

If you own a custom domain (e.g., `synthex.social`):

```bash
# Add CNAME records pointing to both:

# Primary (Vercel)
synthex.social  CNAME  cname.vercel.com

# Failover (DigitalOcean) - comment out until needed
# failover.synthex.social  CNAME  synthex-social-xxxxx.ondigitalocean.app
```

### Monitoring & Alerts

```bash
# Set up Vercel alerts
# https://vercel.com/unite-group/unite-hub/settings/alerts

# Set up DigitalOcean alerts
# https://cloud.digitalocean.com/apps -> [app-id] -> Settings -> Alerts
```

---

## 📊 Deployment Comparison

| Factor | Vercel | DigitalOcean |
|--------|--------|--------------|
| **Speed** | ⚡⚡⚡ (instant) | ⚡⚡ (5 min) |
| **Cost** | $20/mo | $5-15/mo |
| **Scaling** | Automatic | Manual |
| **Uptime** | 99.9% | 99.95% |
| **Redundancy** | Global | Regional |
| **Setup** | Click-based | MCP automated |

**Recommended**: Use Vercel as primary (faster, global) + DigitalOcean as failover (cheaper, dedicated)

---

## 💰 Monthly Cost Breakdown (Dual Deployment)

```
Vercel:
  - Basic plan: $20/month
  - Bandwidth: Included
  - Database (Supabase): $25/month

DigitalOcean:
  - App Platform: $12/month (basic tier)
  - Database: Shared Supabase ($25/month)

Total: $57-65/month for full HA
Cost per customer: ~$5 (at 10 customers)
Margin: 95%+
```

---

## 🚀 Execution Timeline

```
NOW
 ├─ Vercel build (5 min) ─────────────────┐
 │                                        │
 ├─ Add env vars to Vercel (3 min) ───────┤
 │                                        │
 ├─ Redeploy Vercel (3 min) ──────────────┤
 │                                        │
 ├─ Test Vercel (5 min) ──────────────────┤
 │                                        │
 ├─ Deploy to DigitalOcean via MCP (15 min)
 │                                        │
 ├─ Test DigitalOcean (5 min) ────────────┤
 │                                        │
 ├─ Configure failover (5 min) ───────────┤
 │                                        │
 └─ ✅ FULLY OPERATIONAL (45-50 min) ────┘
```

---

## 📋 Checklist for Dual Deployment

### Vercel Phase
- [ ] Build completes (monitor next 2-3 minutes)
- [ ] Add 8 environment variables
- [ ] Redeploy with env vars
- [ ] Test OAuth login
- [ ] Test onboarding
- [ ] Test job creation
- [ ] Test dashboard

### DigitalOcean Phase
- [ ] Ask me to deploy via MCP
- [ ] Monitor deployment (15 min)
- [ ] Verify app is running
- [ ] Test critical endpoints
- [ ] Check logs for errors
- [ ] Verify database connection

### Failover Phase
- [ ] DNS configured (if using custom domain)
- [ ] Both deployments tested independently
- [ ] Shared Supabase database verified
- [ ] Alerts configured on both platforms

---

## 🎯 After Dual Deployment (Phase F+)

Once both deployments are live:

1. **Phase F: Validation** (1-2 hours)
   - Run SYNTHEX_VALIDATION_GUIDE.md (10 test cases)
   - Verify both deployments can access shared database
   - Test failover (bring down Vercel, verify DO works)

2. **Phase G: Monitoring** (3 hours)
   - Set up uptime monitoring
   - Configure alerting
   - Document runbook for outages

3. **Phase H: Launch** (3 hours)
   - Prepare first customer playbook
   - Set up support channels
   - Create FAQ

4. **Go Live**: Invite first 5-10 customers

---

## 🔑 Critical Environment Variables

**REQUIRED** (same for both):
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

**DEPLOYMENT-SPECIFIC**:
```env
# Vercel
NEXTAUTH_URL=https://unite-e4en9oiji-unite-group.vercel.app

# DigitalOcean
NEXTAUTH_URL=https://synthex-social-xxxxx.ondigitalocean.app
```

Both point to the same Supabase database for data consistency.

---

## ⚠️ Troubleshooting

### Vercel Build Fails
```bash
# Check build logs
vercel logs https://unite-e4en9oiji-unite-group.vercel.app --follow

# Common issues:
# - Missing env vars → Add to Vercel dashboard
# - Type errors → Run: npm run build locally
# - Dependency issues → Run: npm install && npm run build
```

### DigitalOcean Deployment Fails
```bash
# Check via MCP
"Show me the deployment logs for synthex-social"

# Common issues:
# - Invalid API token → Regenerate at cloud.digitalocean.com
# - Missing env vars → Passed during MCP creation
# - Port conflict → Use 3000 (default) or 3008
```

### Database Connection Issues
```sql
-- In Supabase SQL Editor
SELECT now();  -- Test connection

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'synthex_tenants';
```

---

## 📞 Support Resources

**Vercel**:
- Dashboard: https://vercel.com/unite-group/unite-hub
- Docs: https://vercel.com/docs
- Community: https://vercel.com/support

**DigitalOcean**:
- Dashboard: https://cloud.digitalocean.com/apps
- Docs: https://docs.digitalocean.com/products/app-platform/
- API Docs: https://docs.digitalocean.com/reference/

**Supabase**:
- Dashboard: https://app.supabase.com
- Docs: https://supabase.com/docs

---

## ✅ Success Criteria

Both deployments are successful when:

1. **Vercel**:
   - ✅ Build succeeds
   - ✅ All env vars present
   - ✅ OAuth login works
   - ✅ Jobs execute and return results
   - ✅ Database queries return data

2. **DigitalOcean**:
   - ✅ App deployed successfully
   - ✅ All env vars configured
   - ✅ Endpoints respond (HTTP 200)
   - ✅ Same OAuth and jobs work
   - ✅ Reads from shared Supabase

3. **Failover**:
   - ✅ Both URLs work independently
   - ✅ Switching between them doesn't lose data
   - ✅ Alerts configured on both

---

**Status**: 🚀 **READY TO EXECUTE**

**Next Step**: Monitor Vercel build, then follow Phase 1 steps above.

**Time to Revenue**: 45-50 minutes from now

**Current Time Remaining**: ~2-3 minutes until Vercel build completes
