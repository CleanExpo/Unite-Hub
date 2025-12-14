# Production Deployment Runbook
## Monday, December 25, 2025 | 6:00 AM EST

**Status**: 🟢 APPROVED FOR PRODUCTION
**Version**: v2.0 - AI-First Enhancement
**Decision**: GO FOR PRODUCTION

---

## 1. Pre-Deployment Checklist (5:30 AM - 6:00 AM)

### Team Preparation
- [ ] Technical Lead present and in war room
- [ ] QA Lead ready to verify post-deployment
- [ ] Deployment Lead ready to execute
- [ ] Product Lead monitoring for business impact
- [ ] On-call team notified and on standby

### Environment Verification
- [ ] Production database backups completed
- [ ] Staging environment fully validated (all 5 scenarios passing)
- [ ] All 116 automated tests passing
- [ ] TypeScript compilation successful (no errors)
- [ ] Monitoring dashboards open and ready
- [ ] Alerting system tested and active
- [ ] Rollback procedure reviewed and tested

### Code Verification
- [ ] Latest commit: `5db9d0d3` - Production build fixes
- [ ] Branch: `v2-ai-search-intelligence` merged to `main`
- [ ] No uncommitted changes
- [ ] All dependencies up to date

### Network & Infrastructure
- [ ] VPN connected (if required)
- [ ] Firewall rules verified
- [ ] Database connection pooling ready
- [ ] CDN cache warmed (if applicable)
- [ ] Load balancers configured

---

## 2. Deployment Execution (6:00 AM - 6:30 AM)

### Step 1: Pre-Flight Final Checks (5 min)
```bash
npm run validate:env
npm run typecheck
git status
git log -1 --oneline
```

**Expected Result**: All checks pass, no errors

### Step 2: Build & Deploy (10 min)
```bash
npm run build
du -sh .next
# Deploy to production (your CI/CD command)
```

**Expected Result**: Build completes successfully

### Step 3: Smoke Tests (5 min)
```bash
curl -X GET https://app.unite-hub.com/api/health
curl -X GET https://app.unite-hub.com/api/admin/health?action=checks
```

**Expected Results**:
- ✅ Health endpoint responds with 200
- ✅ Login works
- ✅ Job creation works
- ✅ No 500 errors

### Step 4: Database Validation (3 min)

**Verify RLS is enforced** and migrations are applied

**Expected Results**:
- ✅ All RLS policies enforced
- ✅ Latest migrations present
- ✅ Tenant isolation verified

---

## 3. Post-Deployment Monitoring (6:30 AM - 7:30 AM)

### 1-Hour Intensive Monitoring

**Every 5 minutes (first 15 min)**:
- [ ] Error rate dashboard (target: <1%)
- [ ] Response time p95 (target: <1000ms)
- [ ] Job completion rate (target: >99%)
- [ ] Review error logs
- [ ] Check database connection pool

**Every 10 minutes (next 30 min)**:
- [ ] System resource usage (CPU, memory)
- [ ] RLS policy enforcement
- [ ] API rate limiter status
- [ ] Application logs for warnings

**Every 15 minutes (final 15 min)**:
- [ ] No cascading failures
- [ ] User session stability
- [ ] Test scenarios passing
- [ ] Third-party service integrations

---

## 4. Success Criteria

### Deployment is SUCCESSFUL if:
✅ No errors in application logs
✅ Error rate < 1%
✅ Response times < 1000ms (p95)
✅ Job completion rate > 99%
✅ RLS policies enforced
✅ No authentication issues
✅ All 5 test scenarios pass
✅ Database connections stable

### Deployment is FAILED if:
❌ Error rate > 2%
❌ Response time p95 > 3000ms
❌ RLS violation detected
❌ Database connection issues
❌ Authentication failures
❌ Cascading failures

---

## 5. Rollback Procedure

If deployment fails, execute rollback immediately:

```bash
git log --oneline | head -5
# Last stable: e8c88805
git revert HEAD
npm run build
# Deploy previous build
npm run validate:env
npm run test:smoke
```

**Timeline**: Rollback should complete in < 10 minutes

---

## 6. 24-Hour Monitoring Plan

### First 4 Hours (7:30 AM - 11:30 AM)
- Monitoring frequency: Every 15 minutes
- Alert threshold: Standard production thresholds

### Hours 4-24 (11:30 AM - Dec 26, 6:00 AM)
- Monitoring frequency: Hourly
- Alert threshold: Standard production thresholds

### Key Metrics
```
Error Rate:           <1%
Response Time p95:    <1000ms
Job Success Rate:     >99%
Database Latency:     <50ms
RLS Violations:       0
Authentication Rate:  >99.9%
Cache Hit Ratio:      >80%
```

---

## 7. Incident Response

### If error rate exceeds 2%
1. Check error logs for pattern
2. Identify affected endpoints
3. Notify on-call team
4. Prepare rollback if needed

### If response time exceeds 3s
1. Check database slow queries
2. Check external API latency
3. Check server resource usage
4. Identify bottleneck

### If RLS violation detected
1. IMMEDIATE ALERT
2. Isolate affected requests
3. Check audit logs
4. Execute rollback

---

## 8. Post-Deployment Verification (After 24 Hours)

### Full System Test
```bash
npm run test
node scripts/run-manual-tests.mjs --all-tests
npm run bench
npm run audit:security
```

### Expected Results
- ✅ 100% test pass rate
- ✅ All 5 manual scenarios passing
- ✅ Performance within SLAs
- ✅ No new security issues

---

## 9. Communication Plan

### Before Deployment (5:30 AM)
- Notify: "Beginning production deployment at 6:00 AM EST"

### During Deployment
- Every 10 minutes: Status update

### After Deployment (6:30 AM)
- Success notification: "Production deployment successful"

---

## 10. Contact Information

**Technical Lead**: [NAME] - [PHONE]
**QA Lead**: [NAME] - [PHONE]
**Deployment Lead**: [NAME] - [PHONE]
**On-Call Engineer**: [NAME] - [PHONE]

**War Room**: [ZOOM LINK]
**Incident Slack**: #incident
**Production Slack**: #production-deployment

---

## 11. Pre-Deployment Sign-Off

- [ ] **Technical Lead**: Reviewed and approved runbook
- [ ] **QA Lead**: Staging validation complete
- [ ] **Deployment Lead**: Infrastructure ready
- [ ] **Product Lead**: Approved for launch

**Approved By**: ________________________
**Date**: December 25, 2025

---

🚀 Ready for Production Deployment
