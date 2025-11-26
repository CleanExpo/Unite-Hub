# Synthex.social MVP – Deployment Guide (Phase E & Beyond)

**Target**: DigitalOcean or Vercel Production Deployment
**Status**: Ready for Go-Live
**Last Updated**: 2025-11-26

---

## Phase E Checklist – Deployment & Go-Live Ops (2 hours)

### Step 1: Production Supabase Setup (30 minutes)

**If using existing Supabase project:**
```bash
# 1. Go to Supabase Dashboard
# 2. Select your project
# 3. Navigate to SQL Editor
# 4. Run the migration file
```

**SQL Migration to run:**
```sql
-- Execute the following migration
-- File: supabase/migrations/254_synthex_core_structure.sql

-- This creates:
-- ✓ synthex_tenants
-- ✓ synthex_brands
-- ✓ synthex_plan_subscriptions
-- ✓ synthex_project_jobs
-- ✓ synthex_job_results
-- ✓ synthex_offer_counters
-- ✓ 7 supporting tables

-- After running:
-- 1. Wait 1-5 minutes for Supabase cache refresh
-- 2. Verify tables exist: SELECT * FROM synthex_tenants LIMIT 1;
-- 3. Check RLS policies are enabled
```

**Verify Setup:**
```bash
# In Supabase Dashboard SQL Editor, run:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'synthex%';

# Expected: Should return 7+ rows
```

### Step 2: Vercel Deployment (if using Vercel)

**Option A: Automatic from GitHub**
```bash
# 1. Push code to GitHub
cd d:\Unite-Hub
git push origin main

# 2. Go to https://vercel.com/projects
# 3. Click "New Project"
# 4. Select your GitHub repository
# 5. Configure settings (see below)
# 6. Click "Deploy"
```

**Vercel Environment Variables:**
```
# Settings → Environment Variables
# Add these production values:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

ANTHROPIC_API_KEY=sk-ant-your-production-key

NEXTAUTH_URL=https://synthex.social
NEXTAUTH_SECRET=your-production-secret-key

GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-prod-client-secret
```

**Option B: Docker to DigitalOcean**

```dockerfile
# Dockerfile (if not using Vercel)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3008

# Start server
CMD ["npm", "run", "start"]
```

```bash
# Deploy to DigitalOcean
# 1. Install doctl: https://docs.digitalocean.com/reference/doctl/
# 2. Authenticate: doctl auth init
# 3. Create app.yaml

# 4. Deploy:
doctl apps create --spec app.yaml
```

**DigitalOcean app.yaml:**
```yaml
name: synthex-social
services:
  - name: api
    github:
      repo: YOUR_USERNAME/Unite-Hub
      branch: main
    build_command: npm run build
    run_command: npm run start
    envs:
      - key: NEXT_PUBLIC_SUPABASE_URL
        scope: RUN_TIME
        value: ${SUPABASE_URL}
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        scope: RUN_TIME
        value: ${SUPABASE_ANON_KEY}
      - key: SUPABASE_SERVICE_ROLE_KEY
        scope: RUN_TIME
        value: ${SUPABASE_SERVICE_ROLE_KEY}
      - key: ANTHROPIC_API_KEY
        scope: RUN_TIME
        value: ${ANTHROPIC_API_KEY}
    http_port: 3008
```

### Step 3: Domain Configuration (30 minutes)

**Option A: Using existing domain (if you have one)**
```bash
# 1. Go to your domain registrar
# 2. Find DNS settings
# 3. Update A record:
#    Name: @
#    Type: CNAME (if Vercel) or A (if DigitalOcean)
#    Value: [Vercel/DO provided]
# 4. Wait for DNS propagation (5-30 minutes)
```

**Option B: Purchase synthex.social domain**
```bash
# If using DigitalOcean:
# 1. Go to DigitalOcean → Manage → Domains
# 2. Add domain
# 3. Point nameservers to DigitalOcean

# If using Vercel:
# 1. Add domain in Vercel dashboard
# 2. Vercel provides DNS records
# 3. Add to domain registrar
```

**Verify DNS:**
```bash
# Test from terminal
nslookup synthex.social
# or
dig synthex.social

# Should return your server's IP
```

### Step 4: Post-Deployment Verification (30 minutes)

**Check application is running:**
```bash
# Test health endpoint
curl https://synthex.social/api/health
# or in browser: https://synthex.social

# Should return: "Application running"
```

**Test OAuth flow:**
1. Go to https://synthex.social
2. Click "Continue with Google"
3. Should redirect to Google login
4. After auth, should redirect back to dashboard

**Test onboarding:**
1. Create new account (if not already)
2. Go to /synthex/onboarding
3. Fill form → Select plan → Activate
4. Should create tenant in Supabase

**Test job creation:**
1. Go to /synthex/dashboard
2. Click "New Job"
3. Create test job
4. Check synthex_project_jobs table

**Test API endpoints:**
```bash
# Get session token first, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://synthex.social/api/synthex/tenant?tenantId=YOUR_TENANT_ID

# Should return tenant data
```

**Monitor logs:**
- Vercel: Dashboard → Project → Deployments → View Logs
- DigitalOcean: Dashboard → Apps → Select App → Logs

---

## Phase E Rollback (if needed)

**If deployment fails:**

```bash
# Vercel: Automatic rollback to previous deployment
# 1. Go to Vercel dashboard
# 2. Select project
# 3. Deployments
# 4. Click "Redeploy" on previous working version

# DigitalOcean: Redeploy previous image
doctl apps get YOUR_APP_ID
doctl apps update YOUR_APP_ID --spec app.yaml # uses previous commit
```

---

## Phase E Environment Variables Checklist

| Variable | Required | Production | Notes |
|----------|----------|------------|-------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ | From Supabase Dashboard |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | ✅ | From Supabase Dashboard |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ | KEEP SECRET - don't share |
| ANTHROPIC_API_KEY | ✅ | ✅ | From Anthropic console |
| NEXTAUTH_URL | ✅ | https://synthex.social | Must match deployment domain |
| NEXTAUTH_SECRET | ✅ | ✅ | Generate: `openssl rand -base64 32` |
| GOOGLE_CLIENT_ID | ✅ | ✅ | From Google Cloud Console |
| GOOGLE_CLIENT_SECRET | ✅ | ✅ | From Google Cloud Console |

---

## Troubleshooting Phase E

### Issue: "Supabase tables not found"
**Solution:**
1. Run migration again in SQL Editor
2. Wait 5 minutes for cache
3. Try: `SELECT * FROM synthex_tenants LIMIT 1;`
4. If still fails: Check migration file executed without errors

### Issue: "OAuth redirect fails"
**Solution:**
1. Check NEXTAUTH_URL matches deployment domain
2. Update GOOGLE_CLIENT_ID to allow new domain
3. Add https://synthex.social/api/auth/callback/google to Google OAuth

### Issue: "API returns 401 Unauthorized"
**Solution:**
1. Verify ANTHROPIC_API_KEY is set
2. Check Supabase keys in environment variables
3. Test with valid session token

### Issue: "Build fails on Vercel"
**Solution:**
1. Check build logs in Vercel dashboard
2. Common: Missing environment variables
3. Run locally: `npm run build` to reproduce

---

## Post-Deployment: What's Next (Phase F)

After Phase E deployment is successful:

1. **Phase F: Internal Dogfooding (1 hour)**
   - Create test tenant
   - Run through full onboarding
   - Create 3+ test jobs
   - Verify results appear
   - Check portfolio metrics

2. **Soft Launch (2-4 weeks)**
   - Invite 5-10 early customers
   - Collect feedback
   - Monitor job execution
   - Track costs

3. **Public Launch**
   - Remove "Early Access" labels
   - Increase marketing
   - Monitor performance
   - Prepare support

---

## Success Criteria for Phase E

✅ Application deployed to production
✅ Domain https://synthex.social accessible
✅ Supabase tables created and populated
✅ OAuth login working
✅ API endpoints responding
✅ Jobs execute successfully
✅ Results stored in database
✅ No critical errors in logs
✅ Performance acceptable (<5s API response)

---

## Estimated Cost

| Service | Cost/Month | Notes |
|---------|-----------|-------|
| Supabase (Free tier) | $0 | 500MB DB, sufficient for MVP |
| Vercel (Pro) | $20 | Or DigitalOcean $6-12 |
| Anthropic API | Variable | $0.05-0.10/job (~$15-30/mo for 100 jobs) |
| Domain | $10-15 | synthex.social registration |
| **Total** | **$30-55/mo** | Affordable MVP cost |

---

## References

- [Vercel Deployment Docs](https://vercel.com/docs)
- [DigitalOcean App Platform](https://docs.digitalocean.com/products/app-platform/)
- [Supabase Production Setup](https://supabase.com/docs/guides/self-hosting)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)

---

**Ready to deploy? Start with Step 1: Production Supabase Setup**
