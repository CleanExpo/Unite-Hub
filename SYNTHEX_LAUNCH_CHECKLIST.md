# Synthex.social – Final Launch Checklist

**Current Status**: 98% Complete – Ready for Production
**Date**: 2025-11-26
**Target Launch**: This week

---

## Pre-Launch Checklist (Phase G & H)

### Phase G: Monitoring, Logs & Backups (3 hours)

#### Task 1: Enable Monitoring & Alerting
- [ ] Set up Vercel/DigitalOcean uptime monitoring
- [ ] Configure alerts for API errors (5xx on /api/synthex/*)
- [ ] Test alert notifications work
- [ ] Document alert escalation procedure

**Tools**:
- Vercel: Built-in monitoring dashboard
- DigitalOcean: Datadog integration recommended
- Slack: Integration for alerts

**Estimated time**: 1 hour

---

#### Task 2: Log Security Review
- [ ] Review API logs for sensitive data exposure
- [ ] Ensure API keys are not logged
- [ ] Mask user personal data in logs
- [ ] Verify Anthropic API calls don't log raw prompts
- [ ] Set log retention policy (30 days recommended)

**What to check**:
```bash
# Look for these in logs:
- ANTHROPIC_API_KEY=
- Bearer tokens
- User email addresses
- Raw prompt content
- Database connection strings
```

**Expected time**: 1 hour

---

#### Task 3: Backup & Rollback Plan
- [ ] Document Supabase backup schedule
- [ ] Export production database weekly
- [ ] Store backups in secure location
- [ ] Document how to revert last deploy
- [ ] Test rollback procedure once

**Backup checklist**:
```
Weekly:
  - Supabase → Export all synthex_* tables
  - Store in: secure/encrypted location
  - Retention: 4 weeks minimum

Rollback:
  - Vercel: Previous deployment in 1-click
  - DigitalOcean: Re-deploy previous commit
  - Database: Restore from weekly backup
```

**Expected time**: 1 hour

---

### Phase H: First-Customer Experience (3 hours)

#### Task 1: Founder Test Run ✅
- [ ] Deploy to production (Vercel or DigitalOcean)
- [ ] Create test account as "Phill McGurk"
- [ ] Run full onboarding flow
- [ ] Create 3 test jobs (content, email, SEO)
- [ ] Verify results display correctly
- [ ] Check costs calculated accurately
- [ ] View in founder portfolio
- [ ] Confirm no errors in logs

**Expected time**: 1 hour

---

#### Task 2: First 10 Customers Playbook
- [ ] Write 1-page onboarding guide
- [ ] Define target customer profile
- [ ] Plan offer allocation (50% / 25% / standard)
- [ ] Create feedback collection form
- [ ] Set success metrics
- [ ] Document support escalation

**Sample playbook section**:
```markdown
## First 10 Customers Onboarding

**Target**: Service-based businesses (trades, agencies, consulting)
**Timeline**: Week 1-2
**Offers**: Mix of 50% (2 slots) + 25% (3 slots) + standard (5 slots)

**Success Metrics**:
- Jobs created per customer: 2-5
- Content quality feedback: 4/5 or higher
- Plan upgrade rate: 10-20%
- Churn rate: 0% (retention)

**Support**:
- Email: support@synthex.social
- Response time: 24 hours
- Common issues: [collect as you go]
```

**Expected time**: 1.5 hours

---

#### Task 3: Support Contact & FAQ
- [ ] Set up support email address
- [ ] Create basic FAQ page (or link in dashboard)
- [ ] Add support link to footer
- [ ] Create 3-5 FAQ entries:
  - How do I create my first job?
  - When will my results be ready?
  - How much will this cost?
  - Can I upgrade my plan?
  - How do I contact support?

**Expected time**: 0.5 hours

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code committed and pushed to `main`
- [ ] Build passes: `npm run build` (no synthex errors)
- [ ] Environment variables documented
- [ ] Supabase migration file ready
- [ ] Domain registrar configured

### Deployment Steps

**For Vercel:**
```bash
1. [ ] Go to https://vercel.com/projects
2. [ ] Import GitHub repository
3. [ ] Add environment variables (see below)
4. [ ] Deploy
5. [ ] Add domain (synthex.social)
6. [ ] Wait for DNS propagation (5-30 min)
7. [ ] Test https://synthex.social loads
```

**For DigitalOcean:**
```bash
1. [ ] Create app.yaml with env vars
2. [ ] Push to GitHub
3. [ ] Run: doctl apps create --spec app.yaml
4. [ ] Configure domain DNS
5. [ ] Wait for propagation
6. [ ] Test application loads
```

### Post-Deployment

- [ ] Application loads without errors
- [ ] OAuth login works
- [ ] API endpoints respond (< 500ms)
- [ ] Supabase tables accessible
- [ ] Anthropic API calls succeed
- [ ] No critical errors in logs

---

## Environment Variables (Production)

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-production-key

# Auth
NEXTAUTH_URL=https://synthex.social
NEXTAUTH_SECRET=your-secret-key (generate: openssl rand -base64 32)

# OAuth
GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-prod-client-secret
```

### How to Get Each

| Variable | Source | How to Get |
|----------|--------|-----------|
| SUPABASE_URL | Supabase Dashboard | Settings → API |
| SUPABASE_ANON_KEY | Supabase Dashboard | Settings → API |
| SERVICE_ROLE_KEY | Supabase Dashboard | Settings → API (🔒 SECRET) |
| ANTHROPIC_API_KEY | Claude Console | https://console.anthropic.com |
| NEXTAUTH_SECRET | Generate | `openssl rand -base64 32` |
| GOOGLE_CLIENT_ID | Google Cloud | OAuth 2.0 credentials |
| GOOGLE_CLIENT_SECRET | Google Cloud | OAuth 2.0 credentials |

---

## Testing Checklist (After Deployment)

### Critical Path Tests

1. **Authentication**
   - [ ] Google OAuth login works
   - [ ] Session persists
   - [ ] Logout works

2. **Onboarding**
   - [ ] Form validates inputs
   - [ ] Offer displays correctly
   - [ ] Tenant created in database
   - [ ] Redirect to dashboard works

3. **Job Execution**
   - [ ] Can create content batch job
   - [ ] Job status updates in real-time
   - [ ] Results appear after completion
   - [ ] Costs calculated and stored

4. **Founder Dashboard**
   - [ ] All tenants visible
   - [ ] Health scores calculated
   - [ ] Revenue displayed
   - [ ] Quick actions available

### Performance Tests

- [ ] API response time < 500ms
- [ ] Dashboard loads < 3 seconds
- [ ] Jobs complete within 30 seconds
- [ ] No timeout errors

### Security Tests

- [ ] API requires authentication
- [ ] Cannot access other tenant data
- [ ] No API keys in logs
- [ ] HTTPS enforced
- [ ] RLS policies active

---

## Rollback Plan (If Something Breaks)

### Immediate Actions

1. **Vercel**: One-click redeploy to previous version
   - Go to Deployments → Find last working deploy → Click "Redeploy"
   - Time: 2-5 minutes

2. **DigitalOcean**: Revert to previous commit
   ```bash
   git revert HEAD
   git push
   # Automatically redeployed
   ```

3. **Database**: Restore from backup
   - Supabase → Backups → Restore from 24 hours ago
   - Time: 5-10 minutes

### Communication

If a critical issue occurs:
1. Immediately rollback to last known good version
2. Post update to customer (if applicable)
3. Investigate root cause
4. Deploy fix
5. Verify with testing checklist

---

## First Month Operations

### Week 1: Soft Launch
- [ ] Deploy to production
- [ ] Run full validation (1 hour)
- [ ] Invite 3 trusted businesses
- [ ] Monitor logs closely
- [ ] Collect early feedback

### Week 2: Iterate on Feedback
- [ ] Fix any bugs found
- [ ] Improve documentation
- [ ] Add FAQ entries
- [ ] Expand to 5-10 customers

### Week 3-4: Monitor & Optimize
- [ ] Track job execution success rate
- [ ] Monitor costs (should be $20-50/mo)
- [ ] Get customer testimonials
- [ ] Plan Phase 2 features

### Monthly Goals
- 10+ active tenants
- 50+ jobs executed
- 0 critical bugs
- <$500 total API spend
- Positive customer feedback

---

## Success Criteria

✅ **All tests pass**
✅ **No critical errors in logs**
✅ **Customers can onboard and create jobs**
✅ **Results display correctly**
✅ **Costs tracked accurately**
✅ **Performance < targets**
✅ **Ready for 10x growth**

---

## Contacts & Resources

### Key URLs (After Deployment)
- Production: https://synthex.social
- Onboarding: https://synthex.social/synthex/onboarding
- Dashboard: https://synthex.social/synthex/dashboard
- Portfolio: https://synthex.social/founder/synthex-portfolio

### Admin Dashboards
- Vercel: https://vercel.com/projects
- DigitalOcean: https://cloud.digitalocean.com
- Supabase: https://app.supabase.com
- Anthropic: https://console.anthropic.com

### Documentation
- Deployment: SYNTHEX_DEPLOYMENT_GUIDE.md
- Validation: SYNTHEX_VALIDATION_GUIDE.md
- Next Steps: SYNTHEX_NEXT_STEPS.md

---

## Launch Sign-Off

**Phase G (Monitoring) Completed**: __________ (Date)
**Phase H (First Customer) Completed**: __________ (Date)
**Production Deployment**: __________ (Date)
**Validation Complete**: __________ (Date)

**Ready to Launch**: ☐ Yes ☐ No

**Launched By**: __________________ (Name)
**Customer Count**: __________ (at launch)

---

**This is your final checklist. Follow it in order, and you'll have a production-ready MVP on Day 2. Good luck! 🚀**
