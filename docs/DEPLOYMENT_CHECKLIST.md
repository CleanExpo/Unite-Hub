# Unite-Hub Production Deployment Checklist

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Phase**: 11 - Deployment Infrastructure

---

## Pre-Deployment Checklist

### 1. Environment Preparation

#### 1.1 Vercel Setup
- [ ] Create Vercel production project
- [ ] Link to GitHub repository
- [ ] Configure production domain
- [ ] Set up SSL certificate (automatic with Vercel)
- [ ] Configure custom domain DNS records

#### 1.2 Supabase Production
- [ ] Create production Supabase project
- [ ] Note new project URL and keys
- [ ] Configure connection pooling (pgBouncer)
- [ ] Set up database backups
- [ ] Configure PITR (Point-in-Time Recovery)

#### 1.3 Environment Variables
```bash
# Required Production Variables
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]

NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=[generate-new-secret]

ANTHROPIC_API_KEY=[production-api-key]

GOOGLE_CLIENT_ID=[production-oauth-client-id]
GOOGLE_CLIENT_SECRET=[production-oauth-secret]

# Email Service (production SendGrid/Resend)
SENDGRID_API_KEY=[production-key]
RESEND_API_KEY=[production-key]
EMAIL_FROM=contact@your-domain.com

# Monitoring
SENTRY_DSN=[production-sentry-dsn]
SENTRY_AUTH_TOKEN=[sentry-auth-token]
DD_API_KEY=[datadog-api-key]

# Payment
STRIPE_SECRET_KEY=[production-stripe-key]
STRIPE_WEBHOOK_SECRET=[production-webhook-secret]
```

**Checklist:**
- [ ] All variables set in Vercel dashboard
- [ ] No development/staging values mixed in
- [ ] Secrets rotated from development
- [ ] API keys are production-tier

---

### 2. Database Preparation

#### 2.1 Run Migrations
```sql
-- Execute in Supabase SQL Editor
-- File: supabase/migrations/CONSOLIDATED_400-403.sql

-- 1. Core foundation tables (400)
-- 2. Synthex tier management (401)
-- 3. Extended RLS policies (402)
-- 4. Rate limiting infrastructure (403)
```

**Checklist:**
- [ ] Migration 400 applied successfully
- [ ] Migration 401 applied successfully
- [ ] Migration 402 applied successfully
- [ ] Migration 403 applied successfully
- [ ] All tables verified in Schema tab
- [ ] RLS policies verified in Auth Policies

#### 2.2 Seed Data (if needed)
```sql
-- Seed default tier limits
INSERT INTO public.synthex_tier_limits (tier, max_contacts, max_campaigns_per_month, max_ai_requests_per_day, features)
VALUES
  ('starter', 500, 5, 50, '{"basic_ai": true}'),
  ('professional', 2500, 25, 200, '{"basic_ai": true, "advanced_ai": true}'),
  ('elite', 10000, -1, -1, '{"basic_ai": true, "advanced_ai": true, "api_access": true}')
ON CONFLICT (tier) DO NOTHING;
```

**Checklist:**
- [ ] Tier limits seeded
- [ ] Admin user created
- [ ] Test organization created

---

### 3. Third-Party Services

#### 3.1 Anthropic API
- [ ] Production API key generated
- [ ] Rate limits confirmed for tier
- [ ] Prompt caching enabled
- [ ] Usage alerts configured

#### 3.2 Google OAuth
- [ ] Production OAuth consent screen approved
- [ ] Production credentials created
- [ ] Authorized domains added
- [ ] Redirect URIs updated

#### 3.3 Email Service
- [ ] SendGrid production API key
- [ ] Domain verified (SPF, DKIM, DMARC)
- [ ] Sender identity confirmed
- [ ] Bounce/complaint handling configured

#### 3.4 Stripe
- [ ] Live mode API keys
- [ ] Webhook endpoint registered
- [ ] Price IDs updated for production
- [ ] Tax collection configured

#### 3.5 Monitoring
- [ ] Sentry project created
- [ ] Source maps uploaded
- [ ] Alert rules configured
- [ ] Team notification channels set

---

### 4. Security Audit

#### 4.1 API Security
- [ ] All routes have authentication (99%+ coverage)
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] CSP headers set

#### 4.2 Data Security
- [ ] RLS policies applied (100% coverage)
- [ ] Workspace isolation verified
- [ ] Admin endpoints protected
- [ ] Sensitive data encrypted

#### 4.3 Infrastructure Security
- [ ] SSL/TLS enforced
- [ ] Security headers configured
- [ ] No exposed credentials
- [ ] No debug endpoints in production

---

### 5. Performance Verification

#### 5.1 Load Testing
```bash
# Run k6 load test before deployment
npm run test:load
```

- [ ] Homepage loads < 2s
- [ ] API response < 500ms p95
- [ ] Database queries < 100ms p95
- [ ] No memory leaks detected

#### 5.2 Bundle Check
```bash
npm run build
# Check .next/analyze/client.html
```

- [ ] Main bundle < 500KB
- [ ] Total JS < 1MB initial load
- [ ] No duplicate dependencies
- [ ] Tree shaking working

---

## Deployment Steps

### Step 1: Final Build Verification
```bash
# Run full build locally
npm run build

# Verify no TypeScript errors
npm run type-check

# Run all tests
npm test

# Check for security vulnerabilities
npm audit --production
```

### Step 2: Create Release
```bash
# Create release tag
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0
```

### Step 3: Deploy to Vercel
1. Merge to `main` branch (auto-deploys)
2. Or manual deploy via Vercel CLI:
```bash
vercel --prod
```

### Step 4: Post-Deployment Verification
```bash
# Check deployment URL
curl -I https://your-domain.com

# Verify API health
curl https://your-domain.com/api/health

# Check authentication
curl https://your-domain.com/api/auth/session
```

### Step 5: Smoke Tests
- [ ] Homepage loads correctly
- [ ] Login with Google works
- [ ] Dashboard renders
- [ ] Contact list loads
- [ ] Campaign creation works
- [ ] Email sending works

---

## Rollback Procedure

### Immediate Rollback (< 5 min)
```bash
# Via Vercel dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
```

### Rollback with Data Changes
1. Stop writes (set maintenance mode)
2. Roll back Vercel deployment
3. Restore database from backup if needed
4. Verify data integrity
5. Resume operations

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Check Sentry for errors
- [ ] Monitor response times in Datadog
- [ ] Check Vercel analytics
- [ ] Review Supabase metrics
- [ ] Watch for unusual traffic patterns

### First Week
- [ ] Daily error rate review
- [ ] Performance trending
- [ ] User feedback collection
- [ ] Cost monitoring (API, hosting, database)

---

## Contact & Escalation

| Issue Type | Primary Contact | Escalation |
|------------|-----------------|------------|
| Deployment Failure | DevOps Lead | Platform Team |
| Database Issues | DBA | Cloud Support |
| Security Incident | Security Lead | CEO + Legal |
| Payment Issues | Finance | Stripe Support |
| AI Service Down | AI Lead | Anthropic Support |

---

## Appendix: Quick Commands

```bash
# Check deployment status
vercel ls

# View production logs
vercel logs --prod

# Check database connections
SELECT count(*) FROM pg_stat_activity;

# View active sessions
SELECT * FROM auth.sessions LIMIT 10;

# Check rate limit status
SELECT * FROM public.rate_limit_logs ORDER BY created_at DESC LIMIT 50;
```

---

*Last Updated: 2025-11-30*
*Next Review: Before each production deployment*
