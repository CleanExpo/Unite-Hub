# Production Deployment Guide

**Last Updated:** 06/01/2026
**Stack:** Next.js 15 (Vercel) + FastAPI (Railway) + Supabase (PostgreSQL)

---

## Overview

This guide deploys the full-stack Contractor Availability system to production:

- **Frontend:** Next.js app → Vercel (Sydney region)
- **Backend:** FastAPI app → Railway
- **Database:** Supabase PostgreSQL (Australia Southeast)

**Total Time:** 20-30 minutes

---

## Prerequisites

- [ ] GitHub account
- [ ] Vercel account (free tier)
- [ ] Railway account (free tier, $5 credit)
- [ ] Supabase account (already set up)
- [ ] Domain name (optional, Vercel provides free subdomain)

---

## Part 1: Production Supabase Setup (5 min)

### Step 1.1: Create Production Database

**Option A: Use Existing Supabase Project**

- Your development database can also serve production
- Just ensure it's not paused (free tier pauses after 1 week inactivity)

**Option B: Create Separate Production Project** (Recommended)

1. Go to https://supabase.com/dashboard
2. Create new project:
   ```
   Name: contractor-availability-prod
   Region: Australia Southeast (ap-southeast-2)
   Password: [Generate strong password]
   ```

### Step 1.2: Run Production Migrations

```bash
# Link to production project
supabase link --project-ref <production-ref>

# Push migrations
supabase db push

# Verify in dashboard: Table Editor should show 3 contractors, 9 slots
```

### Step 1.3: Get Production Credentials

```
Dashboard → Settings → API

Save these (you'll need them soon):
- Project URL: https://xxxxx.supabase.co
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Service role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 1.4: Update RLS Policies (Important!)

```sql
-- In Supabase SQL Editor, run:

-- Remove public insert/update/delete (keep read-only for now)
DROP POLICY "Allow public insert contractors" ON contractors;
DROP POLICY "Allow public update contractors" ON contractors;
DROP POLICY "Allow public delete contractors" ON contractors;

-- Keep public read (you can restrict this later with authentication)
-- Public read is OK for contractor listings
```

---

## Part 2: Deploy Backend to Railway (10 min)

### Step 2.1: Push Code to GitHub

```bash
cd "C:\NodeJS-Starter-V1 Upgrade Task List\NodeJS-Starter-V1"

# Ensure all changes committed
git add .
git commit -m "chore: Prepare for production deployment"

# Push to GitHub (create repo if needed)
git push origin main
```

### Step 2.2: Create Railway Project

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your repository
6. Select **root directory** (Railway will auto-detect monorepo)

### Step 2.3: Configure Railway

1. Railway should auto-detect Python
2. Click **"Variables"** tab
3. Add environment variables:

```bash
# Supabase (from Step 1.3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment
ENVIRONMENT=production
DEBUG=false

# CORS (will update after deploying frontend)
CORS_ORIGINS=["https://your-vercel-domain.vercel.app"]

# Python
PYTHON_VERSION=3.12
PORT=8000
```

### Step 2.4: Set Root Directory

1. Click **"Settings"** tab
2. Under **"Build"**, set:
   ```
   Root Directory: apps/backend
   ```
3. Under **"Deploy"**, set:
   ```
   Start Command: uv run uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
   ```

### Step 2.5: Deploy

1. Railway will automatically deploy
2. Wait 2-3 minutes for build
3. Click **"Deployments"** → Latest deployment
4. Copy your Railway URL: `https://your-app.up.railway.app`

### Step 2.6: Test Backend

```bash
# Test health endpoint
curl https://your-app.up.railway.app/health

# Should return:
# {"status": "healthy", "timestamp": "..."}

# Test contractors endpoint
curl https://your-app.up.railway.app/api/contractors/

# Should return 3 contractors from Supabase
```

✅ **Backend deployed!**

---

## Part 3: Deploy Frontend to Vercel (10 min)

### Step 3.1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 3.2: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: pnpm build
   Install Command: pnpm install
   ```

### Step 3.3: Configure Environment Variables

In Vercel project settings → **Environment Variables**, add:

```bash
# Backend API (from Part 2, Step 2.5)
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app

# Supabase (same as backend)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3.4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Vercel will assign a URL: `https://your-project.vercel.app`

### Step 3.5: Update Backend CORS

Go back to Railway → Your backend project → Variables:

```bash
# Update CORS_ORIGINS to include your Vercel URL
CORS_ORIGINS=["https://your-project.vercel.app"]
```

Redeploy backend (Railway will auto-redeploy on variable change).

### Step 3.6: Test Frontend

1. Open `https://your-project.vercel.app/demo-live`
2. Should see contractor dropdown
3. Select contractor → see availability calendar
4. All data loaded from production Supabase!

✅ **Frontend deployed!**

---

## Part 4: Configure Custom Domain (Optional, 5 min)

### Step 4.1: Add Domain to Vercel

1. Vercel Dashboard → Your project → **Settings** → **Domains**
2. Add your domain (e.g., `contractoravailability.com.au`)
3. Vercel provides DNS records to add to your domain registrar

### Step 4.2: Update Backend CORS

Railway → Variables:

```bash
CORS_ORIGINS=["https://contractoravailability.com.au","https://your-project.vercel.app"]
```

### Step 4.3: Update Frontend Environment

Vercel → Environment Variables:

```bash
# Update API URL if using custom domain for backend
NEXT_PUBLIC_API_URL=https://api.contractoravailability.com.au
```

---

## Part 5: Verify Production Deployment (5 min)

### Checklist

- [ ] **Backend Health:** `curl https://your-app.up.railway.app/health`
- [ ] **Backend API:** `curl https://your-app.up.railway.app/api/contractors/`
- [ ] **Frontend Loads:** Open `https://your-project.vercel.app`
- [ ] **Demo Page:** Open `/demo-live` - see contractors
- [ ] **API Docs:** Open `https://your-app.up.railway.app/docs`
- [ ] **Supabase Data:** Dashboard → Table Editor → See 3 contractors

### Test Full Flow

1. **List Contractors:**
   - Frontend: http://your-project.vercel.app/demo-live
   - Should load 3 contractors from Supabase

2. **View Availability:**
   - Select John Smith
   - Should see availability calendar
   - Dates in DD/MM/YYYY format (Australian)
   - Times in 12-hour am/pm format

3. **Create Contractor (API):**

   ```bash
   curl -X POST https://your-app.up.railway.app/api/contractors/ \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Production Test",
       "mobile": "0498 765 432",
       "specialisation": "Test"
     }'
   ```

4. **Verify in Frontend:**
   - Refresh demo page
   - New contractor should appear in dropdown

---

## Monitoring & Maintenance

### Vercel Monitoring

1. **Analytics:**
   - Vercel Dashboard → Your project → **Analytics**
   - View page views, visitors, performance

2. **Logs:**
   - Vercel Dashboard → **Deployments** → Select deployment → **Logs**
   - Real-time function logs

### Railway Monitoring

1. **Metrics:**
   - Railway Dashboard → Your project → **Metrics**
   - CPU, Memory, Network usage

2. **Logs:**
   - Railway Dashboard → **Deployments** → **View Logs**
   - Application logs, errors

### Supabase Monitoring

1. **Database:**
   - Supabase Dashboard → **Database** → **Database**
   - Connection count, size, performance

2. **Logs:**
   - Supabase Dashboard → **Logs**
   - API requests, Postgres logs

---

## Security Hardening

### 1. Update RLS Policies

```sql
-- In Supabase SQL Editor:

-- Allow only authenticated users to create contractors
CREATE POLICY "Authenticated users can create contractors"
  ON contractors
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Contractors can update own records
CREATE POLICY "Contractors update own records"
  ON contractors
  FOR UPDATE
  USING (auth.uid() = id);

-- Only admins can delete
CREATE POLICY "Only admins can delete contractors"
  ON contractors
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');
```

### 2. Enable Rate Limiting

In `apps/backend/src/api/main.py`, RateLimitMiddleware is already configured.

Adjust in production:

```python
# src/middleware/rate_limit.py
RATE_LIMIT = "100/minute"  # Production: Lower limit
```

### 3. Enable API Key Authentication

Add to Railway environment:

```bash
BACKEND_API_KEY=your-secret-api-key-here
```

Frontend will send this in headers:

```typescript
headers: {
  'X-API-Key': process.env.BACKEND_API_KEY
}
```

### 4. Configure Supabase Backups

1. Supabase Dashboard → **Database** → **Backups**
2. Enable **daily backups**
3. Set retention: 7 days

---

## Troubleshooting

### Frontend: "Failed to fetch contractors"

**Check:**

1. Backend URL correct in Vercel env vars
2. Backend is running (check Railway logs)
3. CORS configured correctly (Railway CORS_ORIGINS includes Vercel URL)

**Fix:**

```bash
# Railway → Variables
CORS_ORIGINS=["https://your-project.vercel.app"]

# Redeploy backend
```

### Backend: "Supabase credentials not configured"

**Check:**

1. Railway environment variables set correctly
2. NEXT_PUBLIC_SUPABASE_URL starts with https://
3. NEXT_PUBLIC_SUPABASE_ANON_KEY starts with eyJ

**Fix:**

```bash
# Railway → Variables → Re-add credentials
# Redeploy
```

### Database: "No contractors found"

**Check:**

1. Supabase migrations ran successfully
2. Table Editor shows data

**Fix:**

```bash
# Re-run migrations on production
supabase link --project-ref <production-ref>
supabase db push
```

### CORS Errors in Browser

**Error:** `Access to fetch at ... has been blocked by CORS policy`

**Fix:**

```bash
# Railway → Variables
CORS_ORIGINS=["https://your-exact-vercel-url.vercel.app"]

# Ensure no trailing slash
# Ensure exact match with frontend URL
```

---

## Cost Estimates

### Vercel (Frontend)

- **Free Tier:**
  - 100GB bandwidth/month
  - Unlimited deployments
  - Custom domain included
  - **Cost: $0/month**

### Railway (Backend)

- **Hobby Plan:**
  - $5 free credit/month
  - ~512MB RAM
  - 500GB bandwidth
  - **Cost: $0-5/month** (usually free)

### Supabase (Database)

- **Free Tier:**
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth
  - Pauses after 1 week inactivity (auto-resumes)
  - **Cost: $0/month**

**Total: $0-5/month** for full-stack production app!

---

## Scaling Considerations

### When to Upgrade

**Vercel:**

- Upgrade to Pro ($20/month) when:
  - Need >100GB bandwidth
  - Want advanced analytics
  - Need team collaboration

**Railway:**

- Upgrade to Team ($20/month) when:
  - Need >512MB RAM
  - High traffic (>500GB bandwidth)
  - Need custom domains for backend

**Supabase:**

- Upgrade to Pro ($25/month) when:
  - Database >500MB
  - Need daily backups
  - Auto-pause is disruptive

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code committed to GitHub
- [ ] Tests passing locally
- [ ] Environment variables documented
- [ ] Supabase production database ready

### Deployment

- [ ] Backend deployed to Railway
- [ ] Backend health check passing
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads successfully
- [ ] Environment variables configured

### Post-Deployment

- [ ] Test all API endpoints
- [ ] Verify frontend-backend integration
- [ ] Check Supabase data loads
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring
- [ ] Harden security (RLS, rate limits)

---

## Rollback Procedure

### Vercel Rollback

1. Vercel Dashboard → **Deployments**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

### Railway Rollback

1. Railway Dashboard → **Deployments**
2. Select previous deployment
3. Click **"Redeploy"**

### Database Rollback

1. Supabase Dashboard → **Database** → **Backups**
2. Select backup point
3. Click **"Restore"**

---

## Support & Resources

**Vercel:**

- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Railway:**

- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**Supabase:**

- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

## Quick Reference

**Frontend URL:** `https://your-project.vercel.app`
**Backend URL:** `https://your-app.up.railway.app`
**API Docs:** `https://your-app.up.railway.app/docs`
**Database:** Supabase Dashboard

**Environment Variables:**

```bash
# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Backend (Railway)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CORS_ORIGINS=["https://your-project.vercel.app"]
ENVIRONMENT=production
DEBUG=false
```

---

🚀 **Your Australian-first contractor availability system is now live in production!**

🦘 Brisbane contractors • Production database • Global CDN • 99.9% uptime
