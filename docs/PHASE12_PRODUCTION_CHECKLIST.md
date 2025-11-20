# Phase 12 Production Checklist

Use this checklist before deploying Phase 12 Enterprise Mode to production.

---

## Pre-Deployment

### Database
- [ ] Backup production database
- [ ] Run migration 068_enterprise_teams.sql
- [ ] Run migration 069_enterprise_billing.sql
- [ ] Run migration 070_enterprise_financial.sql
- [ ] Verify all tables created successfully
- [ ] Confirm RLS policies are enabled on all new tables
- [ ] Check indexes are created

### Environment
- [ ] Review Supabase connection pooling settings
- [ ] Verify API rate limits are configured
- [ ] Confirm audit log retention policy (default: 90 days)

### Testing
- [ ] All 103 unit/integration tests passing
- [ ] Manual testing of billing flow
- [ ] Manual testing of report generation
- [ ] Manual testing of enterprise dashboard

---

## Deployment

### Steps
1. [ ] Deploy database migrations to production
2. [ ] Deploy application code
3. [ ] Verify all API endpoints responding
4. [ ] Check logs for any startup errors

### Smoke Tests
- [ ] GET /api/billing/plans returns 4 plans
- [ ] GET /api/enterprise/summary returns health data
- [ ] POST /api/reports/financial generates report
- [ ] POST /api/reports/audit logs event

---

## Post-Deployment

### Verification
- [ ] Run enterprise readiness checks on test org
- [ ] Verify RLS isolation (test cross-org access blocked)
- [ ] Generate sample financial report
- [ ] Create test audit events

### Monitoring
- [ ] Set up alerts for:
  - [ ] Critical audit events
  - [ ] Billing failures
  - [ ] High usage warnings
  - [ ] API error rates > 1%

### Documentation
- [ ] Update API documentation
- [ ] Update user guides with enterprise features
- [ ] Brief support team on new features

---

## Rollback Plan

### If Issues Detected

1. **Application Rollback**
   ```bash
   # Revert to previous deployment
   vercel rollback
   ```

2. **Database Rollback** (if needed)
   ```sql
   -- Drop Phase 12 Week 9 changes
   DROP TABLE IF EXISTS audit_events CASCADE;
   DROP TABLE IF EXISTS cost_projections CASCADE;
   DROP TABLE IF EXISTS usage_rollups CASCADE;
   DROP TABLE IF EXISTS financial_reports CASCADE;

   -- Drop Phase 12 Week 5-6 changes
   DROP TABLE IF EXISTS plan_overages CASCADE;
   DROP TABLE IF EXISTS invoice_history CASCADE;
   DROP TABLE IF EXISTS metering_counters CASCADE;
   DROP TABLE IF EXISTS usage_events CASCADE;
   DROP TABLE IF EXISTS subscriptions CASCADE;
   DROP TABLE IF EXISTS billing_plans CASCADE;

   -- Drop Phase 12 Week 1-2 changes
   DROP TABLE IF EXISTS team_members CASCADE;
   DROP TABLE IF EXISTS teams CASCADE;
   ```

---

## Success Criteria

- [ ] Health score ≥ 95 for test organization
- [ ] All readiness checks pass
- [ ] No critical alerts in first 24 hours
- [ ] Billing engine correctly calculates usage
- [ ] Audit trail captures all required events

---

## Emergency Contacts

- **Database Issues**: DBA Team
- **Application Issues**: Engineering Team
- **Billing Issues**: Finance Team
- **Security Issues**: Security Team

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| QA Lead | | | |
| Product Owner | | | |
| DevOps | | | |

---

**Checklist Version**: 1.0
**Last Updated**: 2025-11-20
