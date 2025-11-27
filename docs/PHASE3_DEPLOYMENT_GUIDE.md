# Phase 3: Production Deployment Guide

**Status**: Ready for Production | **Version**: 1.0.0 | **Date**: 2025-11-27

## Overview

This guide covers deploying the CONVEX Marketing Intelligence Module (Phase 2 completion) to production environments with monitoring, analytics, and advanced features (Phase 3).

## Pre-Deployment Checklist

### Database Setup
- [ ] Verify all migrations applied (240_convex_framework_tables.sql)
- [ ] Confirm RLS policies enabled on all tables
- [ ] Test workspace isolation with multiple users
- [ ] Backup production database
- [ ] Verify indexes created for performance

**Check:**
```bash
# In Supabase SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
AND tablename LIKE 'convex_%';
```

### Environment Variables
- [ ] Set ANTHROPIC_API_KEY for production
- [ ] Configure NEXT_PUBLIC_SUPABASE_URL (production)
- [ ] Set SUPABASE_SERVICE_ROLE_KEY (production)
- [ ] Enable CONVEX module feature flag
- [ ] Configure monitoring/logging endpoints

**Required vars:**
```env
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-prod-key
ANTHROPIC_API_KEY=sk-ant-prod-key
CONVEX_ENABLED=true
MONITORING_ENDPOINT=your-monitoring-url
```

### API Endpoints
- [ ] Verify /api/convex/generate-strategy works
- [ ] Test /api/convex/score-seo with real domain
- [ ] Check /api/convex/generate-roadmap returns milestones
- [ ] Confirm /api/convex/list returns paginated results
- [ ] Validate /api/convex/stats aggregates correctly

**Test command:**
```bash
curl -X POST http://localhost:3008/api/convex/generate-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Corp",
    "industry": "SaaS",
    "targetAudience": "Enterprise",
    "desiredOutcome": "Market leadership",
    "framework": "brand_positioning"
  }'
```

### Frontend Components
- [ ] ConvexStrategyDashboard renders correctly
- [ ] ConvexSEOScoringOverlay modal opens/closes
- [ ] ConvexExecutionPanel generates roadmaps
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout verified
- [ ] Form validation displays errors correctly

**Test in browser:**
```
http://localhost:3008/dashboard/convex
```

### Performance Requirements
- [ ] Dashboard loads <1 second (with stats)
- [ ] Strategy generation <2 seconds
- [ ] SEO scoring <200ms
- [ ] List endpoint <500ms for 50 items
- [ ] Stats endpoint <300ms
- [ ] No console errors in production build

**Measure:**
```bash
npm run build
npm run start
# Test with Chrome DevTools Network tab
```

### Security Audit
- [ ] RLS policies protect all queries
- [ ] No sensitive data in logs
- [ ] API keys not exposed in frontend
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] No SQL injection vectors
- [ ] Authentication enforced on protected routes

**Check RLS:**
```sql
SELECT * FROM pg_policies WHERE tablename LIKE 'convex_%';
```

### Error Handling
- [ ] API errors return 400/500 with descriptive messages
- [ ] Frontend displays user-friendly error alerts
- [ ] Failed API calls don't crash UI
- [ ] Logging captures all errors
- [ ] Email notifications for critical errors (setup in Phase 3)

### Data Validation
- [ ] Required fields enforced in forms
- [ ] Score validation (0-100 range)
- [ ] Framework enum validated
- [ ] Compliance status validated
- [ ] Metadata structure validated

## Deployment Steps

### 1. Database Migration
```bash
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy full content of: supabase/migrations/240_convex_framework_tables.sql
# 3. Paste and execute
# 4. Wait for success notification (may take 30-60 seconds)
# 5. Run verification query (see above)
```

### 2. Environment Configuration
```bash
# 1. Update .env.production with production values
# 2. Verify all required variables are set
# 3. Test with: npx dotenv -e .env.production node -e "console.log(process.env.SUPABASE_URL)"
```

### 3. Build and Deploy
```bash
# 1. Verify build succeeds
npm run build

# 2. Test production build locally
npm run start

# 3. Deploy to Vercel
git push origin main
# Vercel auto-deploys on main push

# 4. Verify deployment
curl https://your-domain.com/dashboard/convex
```

### 4. Smoke Testing
```bash
# Test critical paths in production

# 1. Dashboard loads
curl -s https://your-domain.com/dashboard/convex | grep "CONVEX"

# 2. Strategy generation works
curl -X POST https://your-domain.com/api/convex/generate-strategy \
  -H "Content-Type: application/json" \
  -d '{...}'

# 3. Stats endpoint responsive
curl -s "https://your-domain.com/api/convex/stats?workspaceId=test" | jq

# 4. List endpoint working
curl -s "https://your-domain.com/api/convex/list?workspaceId=test" | jq
```

### 5. Monitoring Setup

#### Log Aggregation
```bash
# Ensure Winston logging configured to aggregate to:
# - Datadog / New Relic / CloudWatch / Stackdriver
# - Logs stored with timestamps for debugging

# Test log output:
curl -X POST https://your-domain.com/api/convex/generate-strategy \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test",...}' 2>&1 | grep "CONVEX"
```

#### Error Tracking
```bash
# Setup Sentry/Rollbar for error tracking
# Configure in: src/lib/monitoring.ts

# Errors will be captured and alerting set to:
# - Slack #alerts channel
# - Email to dev@company.com
# - PagerDuty for critical issues
```

#### Performance Monitoring
```bash
# Setup APM (Application Performance Monitoring)
# Tools: Datadog / New Relic / Elastic

# Key metrics to track:
# - API response times (p50, p95, p99)
# - Database query times
# - Frontend page load times
# - Error rates and types
# - User session duration
```

## Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Dashboard load | <1s | <2s | >3s |
| Strategy generation | <2s | <3s | >5s |
| SEO scoring | <200ms | <500ms | >1s |
| List endpoint | <500ms | <1s | >2s |
| Stats endpoint | <300ms | <500ms | >1s |
| Error rate | <0.1% | <1% | >5% |
| Uptime | 99.9% | 99% | <99% |

## Database Scaling

### Current Configuration
- **Strategies per workspace**: 0-1,000 (no issue)
- **Storage**: ~500 bytes per strategy (~500MB for 1M strategies)
- **Queries**: <100 per second per user

### Scaling Strategy

**Phase 1-2 (0-10k strategies)**
- Keep single database
- Maintain daily backups
- Monitor index performance

**Phase 3+ (10k-100k strategies)**
- Consider read replicas for analytics
- Implement caching layer (Redis)
- Archive old strategies to cold storage

**Phase 4+ (100k+ strategies)**
- Partition by workspace_id
- Separate analytics database
- Implement query optimization

## Monitoring Dashboard

Create a monitoring dashboard with these key metrics:

### Uptime
```
- API availability: 99.9%+
- Database availability: 99.99%+
- Dashboard availability: 99.9%+
```

### Performance
```
- API response time p95: <500ms
- Database query time p95: <200ms
- Frontend load time: <1s
```

### Errors
```
- Error rate: <0.1%
- 5xx errors: 0 in normal operation
- Failed database queries: <0.01%
```

### Usage
```
- Active workspaces: [real-time]
- Strategies created (daily): [metric]
- API calls (daily): [metric]
- Users online: [real-time]
```

## Rollback Plan

If issues occur in production:

### 1. Immediate Rollback (if critical)
```bash
# Revert to previous Vercel deployment
# Go to: Vercel Dashboard → Deployments → Select previous → Promote

# Or revert code:
git revert HEAD
git push origin main
```

### 2. Database Rollback (if needed)
```bash
# Restore from backup in Supabase Dashboard
# Timeline: Last backup available
# Data loss: Acceptable based on backup frequency
```

### 3. Feature Flag Disable
```bash
# Set in environment:
CONVEX_ENABLED=false

# Hides CONVEX module from UI
# Keeps other features working
# Allows debugging before re-enable
```

### 4. Communication Plan
- [ ] Notify users via status page
- [ ] Update Slack #incidents channel
- [ ] Send email to support@company.com
- [ ] Document incident in Notion/Wiki
- [ ] Schedule post-mortem meeting

## Post-Deployment

### Day 1 Monitoring
- [ ] Monitor error logs continuously
- [ ] Check performance metrics every hour
- [ ] Verify user adoption (analytics)
- [ ] Collect user feedback
- [ ] Stand by for critical fixes

### Week 1 Review
- [ ] Analyze usage patterns
- [ ] Identify bottlenecks
- [ ] Optimize slow queries
- [ ] Gather feature requests
- [ ] Plan Phase 3 advanced features

### Month 1 Assessment
- [ ] Full performance analysis
- [ ] Cost optimization review
- [ ] Security audit
- [ ] Scalability assessment
- [ ] Phase 3 planning

## Phase 3 Advanced Features (Post-Deployment)

Once Phase 2 is stable in production:

### Week 1-2: Strategy Versioning
```
- Save strategy versions
- Compare versions side-by-side
- Restore previous versions
- Track changes and changelog
```

### Week 3-4: Team Collaboration
```
- Share strategies with team members
- Comments and feedback on strategies
- Permission-based access control
- Activity logging and notifications
```

### Week 5-6: Advanced Search & Filtering
```
- Full-text search across strategies
- Filter by score range, date, framework
- Saved search filters
- Advanced query builder
```

## Support & Escalation

### Tier 1: Operations Team
- Monitor alerts
- Check logs for errors
- Restart services if needed
- Contact Tier 2 for issues

### Tier 2: Engineering Team
- Debug API issues
- Optimize queries
- Deploy patches
- Contact Tier 3 for architecture changes

### Tier 3: Architecture Team
- Redesign systems
- Plan scaling
- Implement major features
- Budget and timeline planning

## Contact Information

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | [Slack] #convex-oncall | 24/7 |
| Engineering Lead | [Email] | Business hours |
| Product Manager | [Email] | Business hours |
| DevOps Team | [Slack] #infrastructure | Business hours |

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Deployment**: https://vercel.com/docs
- **Anthropic API**: https://docs.anthropic.com
- **Monitoring Setup**: See docs/MONITORING_SETUP.md (Phase 3)

---

**Last Updated**: 2025-11-27
**Next Review**: After production deployment stabilization
