# Vercel Deployment Guide for Unite Group

## Pre-Deployment Checklist

### 1. Environment Variables Required
These must be set in Vercel Dashboard → Settings → Environment Variables:

```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://uqfgdezadpkiadugufbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard]

# Required - Database
DATABASE_URL=[Get from Supabase Dashboard → Settings → Database]

# Optional - Error Tracking
NEXT_PUBLIC_SENTRY_DSN=[Your Sentry DSN if using]
SENTRY_DSN=[Your Sentry DSN if using]

# Optional - Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=[Your GA4 ID if using]

# Optional - Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[Your Stripe key if using]
STRIPE_SECRET_KEY=[Your Stripe secret if using]
STRIPE_WEBHOOK_SECRET=[Your Stripe webhook secret if using]
```

### 2. Verify Build Locally
```bash
cd Unite-Group
npm install
npm run build
```

### 3. GitHub Repository Status
✅ Repository: https://github.com/CleanExpo/Unite-Group.git
✅ All code pushed to main branch

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from Unite-Group directory
cd Unite-Group
vercel

# For production deployment
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard
1. Go to https://vercel.com/new
2. Import Git Repository
3. Select "CleanExpo/Unite-Group"
4. Configure Project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
5. Add Environment Variables (from list above)
6. Click "Deploy"

## Production Configuration

### Current vercel.json Settings:
- ✅ Region: Sydney (syd1)
- ✅ Security headers configured
- ✅ Caching rules optimized
- ✅ API routes cache disabled
- ✅ Static assets cached

### Domain Configuration
After deployment:
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Post-Deployment Verification

### 1. Test Critical Paths
- [ ] Homepage loads correctly
- [ ] Authentication works (login/signup)
- [ ] Supabase connection active
- [ ] API routes responding
- [ ] Static assets loading
- [ ] Environment variables working

### 2. Monitor Deployment
- Check Vercel Dashboard → Functions for errors
- Monitor build logs
- Verify all routes are accessible

### 3. Database Setup
Ensure your Supabase database has:
- [ ] All required tables created
- [ ] Row Level Security (RLS) policies applied
- [ ] Authentication configured
- [ ] Initial data seeded (if needed)

## Common Issues & Solutions

### Build Failures
- Check Node version matches: >=18.18.0
- Verify all dependencies installed
- Check for TypeScript errors: `npm run build`

### Environment Variable Issues
- Ensure no quotes in Vercel env vars
- Check variable names match exactly
- Verify all required vars are set

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure connection pooling is configured

## Quick Deploy Commands
```bash
# First time setup
cd Unite-Group
vercel

# Subsequent deployments
vercel --prod

# Preview deployment
vercel

# Check deployment status
vercel ls
```

## Support Resources
- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase + Vercel: https://supabase.com/docs/guides/integrations/vercel
