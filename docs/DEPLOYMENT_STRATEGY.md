# 🚀 Zero-Downtime Deployment Strategy

**Version**: 1.0.0  
**Last Updated**: 2025-11-25  
**Target**: 99.9% uptime during deployments  
**Platform**: Vercel

---

## 📋 OVERVIEW

This document defines Unite-Hub'''s zero-downtime deployment process for production updates.

### Key Principles:
1. **Blue-Green Deployments**: New version runs alongside old
2. **Health Check Gating**: Only promote healthy deployments
3. **Instant Rollback**: <2 minute recovery from failures
4. **Database Compatibility**: Backward-compatible migrations only
5. **Monitoring**: Real-time health tracking during deployment

---

## 🏗️ DEPLOYMENT ARCHITECTURE

### Vercel Deployment Model

```
Production (Blue)              Preview (Green)
    ↓                              ↓
Current version            New version builds
unite-hub.vercel.app      feat-xyz.vercel.app
    ↓                              ↓
Serving traffic            Health checks pass?
    ↓                              ↓
100% traffic               0% traffic (testing)
                                  ↓
                           Promote to production
                                  ↓
                           Gradual traffic shift
                           (10% → 50% → 100%)
                                  ↓
                           Old version auto-retired
```

### Health Check Flow

```
Deployment starts
    ↓
Next.js build completes
    ↓
Container starts
    ↓
Health check: /api/health
    ├─→ 200 OK → Continue
    └─→ 503 Error → ABORT DEPLOYMENT
            ↓
    Automatic rollback
```

---

## 📝 DEPLOYMENT PROCESS

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Database migrations backward-compatible (see SAFE_MIGRATIONS.md)
- [ ] Environment variables updated in Vercel dashboard
- [ ] Rollback plan documented
- [ ] Team notified in Slack/Discord

### Step 1: Create Preview Deployment (2-3 minutes)

```bash
# Push feature branch
git checkout -b feature/your-feature
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

**Vercel automatically**:
- Detects push
- Runs `npm run build`
- Deploys to preview URL

### Step 2: Verify Preview Health (5 minutes)

```bash
# Check health endpoint
curl https://unite-hub-git-feature-your-feature.vercel.app/api/health
```

**Critical Checks**:
- [ ] Status is "healthy" (not degraded/unhealthy)
- [ ] Database latency <100ms
- [ ] Redis latency <50ms
- [ ] All checks passing

### Step 3: Smoke Test Preview (10 minutes)

Test critical user flows on preview URL.

### Step 4: Promote to Production (2-3 minutes)

```bash
# Merge to main branch
git checkout main
git merge feature/your-feature
git push origin main
```

### Step 5: Monitor Production Deployment (15 minutes)

```bash
# Watch health during deployment
while true; do
  curl -s https://unite-hub.vercel.app/api/health | jq '''.status'''
  sleep 5
done
```

**Alert Thresholds**:
- 🚨 **Critical**: Health check returns "unhealthy" → ROLLBACK
- ⚠️ **Warning**: Health check returns "degraded" → INVESTIGATE
- ✅ **Success**: Health check "healthy" for 10+ minutes → COMPLETE

---

## 🔄 ROLLBACK PROCEDURE

### When to Rollback

Rollback immediately if ANY of these occur:
- 🚨 Health check returns "unhealthy"
- 🚨 Error rate >1% sustained for 2+ minutes
- 🚨 Critical functionality broken (auth, payments, AI)
- 🚨 Database connection failures

### Manual Rollback (<2 minutes)

**Via Vercel Dashboard (Fastest)**:
1. Go to Vercel dashboard → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"
4. Wait 30-60 seconds
5. Verify health: `curl https://unite-hub.vercel.app/api/health`

**Via Git Revert**:
```bash
git revert HEAD
git push origin main
```

---

## 🗄️ DATABASE MIGRATION STRATEGY

### Backward-Compatible Migrations Only

**NEVER do this in a single deployment**:
```sql
-- ❌ DANGEROUS: Renames column, breaks old code
ALTER TABLE contacts RENAME COLUMN email TO email_address;
```

**ALWAYS use multi-phase approach**:

#### Phase 1: Add new column (backward-compatible)
```sql
ALTER TABLE contacts ADD COLUMN email_address TEXT;
UPDATE contacts SET email_address = email WHERE email_address IS NULL;
```

#### Phase 2: Deprecate old column (after Phase 1 deployed)
```sql
ALTER TABLE contacts ALTER COLUMN email_address SET NOT NULL;
```

#### Phase 3: Remove old column (after Phase 2 stable)
```sql
ALTER TABLE contacts DROP COLUMN email;
```

---

## 📊 MONITORING DURING DEPLOYMENT

### Key Metrics to Watch

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Health Check Status | "healthy" | "degraded" or "unhealthy" |
| API Response (p95) | <200ms | >500ms |
| Error Rate | <0.1% | >1% |
| Database Latency | <100ms | >300ms |
| Redis Latency | <50ms | >200ms |

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Immediate (0-15 minutes)
- [ ] Health check "healthy" for 10+ minutes
- [ ] Zero 5xx errors in logs
- [ ] API response times <200ms
- [ ] Critical user flows tested manually

### Short Term (1-4 hours)
- [ ] Error rate <0.1% sustained
- [ ] No user-reported issues
- [ ] Background jobs running

### Long Term (24 hours)
- [ ] Uptime maintained >99.9%
- [ ] Performance metrics within targets
- [ ] No memory leaks detected

---

## 🚨 INCIDENT RESPONSE

### P0: Production Down

**Action**: Rollback immediately (<2 minutes)

1. Verify issue
2. Rollback via Vercel dashboard
3. Verify recovery
4. Notify team
5. Create incident report

### P1: Degraded Performance

**Action**: Investigate before rollback (5-10 minutes)

1. Check logs
2. Check database/Redis
3. If unresolvable → Rollback
4. If resolvable → Apply hotfix

---

## 🎯 SUCCESS METRICS

### Deployment Quality
- **Deployment Success Rate**: >95%
- **Rollback Rate**: <5%
- **Mean Time to Deploy**: <5 minutes
- **Mean Time to Rollback**: <2 minutes

### Production Stability
- **Uptime During Deployments**: >99.9%
- **Error Rate During Deployments**: <0.1%

---

**Status**: Production-Ready ✅  
**Owner**: DevOps Team
