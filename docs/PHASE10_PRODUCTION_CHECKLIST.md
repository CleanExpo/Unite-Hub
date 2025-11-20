# Phase 10: Operator Mode - Production Checklist

**Status**: Ready for Production Review
**Date**: 2025-11-20

---

## Pre-Deployment Checklist

### Database Migrations

- [ ] Apply migration 059_operator_profiles.sql
- [ ] Apply migration 060_collaborative_review.sql
- [ ] Apply migration 061_operator_insights.sql
- [ ] Apply migration 062_operator_playbooks.sql
- [ ] Verify all RLS policies are active
- [ ] Verify all indexes are created

### Environment Variables

- [ ] Verify SUPABASE_SERVICE_ROLE_KEY is set
- [ ] Verify NEXT_PUBLIC_SUPABASE_URL is correct
- [ ] Verify ANTHROPIC_API_KEY for AI features

### API Routes

- [ ] `/api/operator/queue` - Queue management
- [ ] `/api/operator/profile` - Profile management
- [ ] `/api/operator/review` - Review & consensus
- [ ] `/api/operator/insights` - Insights & scoring
- [ ] `/api/operator/playbooks` - Playbook management
- [ ] `/api/operator/reports` - Reporting

### Components

- [ ] OperatorApprovalQueue renders correctly
- [ ] ReviewThread loads comments
- [ ] OperatorInsightsDashboard shows metrics
- [ ] OperatorPlaybooksDashboard manages playbooks
- [ ] OperatorOnboardingWizard completes flow

---

## Security Checklist

### Authentication

- [ ] All API routes check auth header
- [ ] Token validation works with both client and server
- [ ] Unauthorized requests return 401

### Authorization

- [ ] RLS policies enforce organization scope
- [ ] Role checks prevent unauthorized actions
- [ ] OWNER-only actions are protected
- [ ] MANAGER-only actions are protected

### Data Protection

- [ ] No sensitive data in client-side logs
- [ ] Audit trail captures all decisions
- [ ] User IDs are never exposed unnecessarily

---

## Performance Checklist

### Database

- [ ] All foreign keys have indexes
- [ ] Commonly queried columns indexed
- [ ] No N+1 queries in services
- [ ] Pagination implemented for large datasets

### API

- [ ] Response times < 500ms for reads
- [ ] Response times < 1000ms for writes
- [ ] Error responses are consistent
- [ ] Validation errors are clear

### UI

- [ ] Components lazy load where appropriate
- [ ] Lists are virtualized for 100+ items
- [ ] Loading states are shown
- [ ] Error states are handled

---

## Testing Checklist

### Unit Tests

- [ ] ConsensusService tests pass (20 tests)
- [ ] OperatorInsightsService tests pass (20 tests)
- [ ] GuardrailPolicyService tests pass (18 tests)

### Integration Tests

- [ ] Operator lifecycle tests pass (25 tests)
- [ ] End-to-end flow works in staging

### Manual Testing

- [ ] Create operator profile
- [ ] Submit to approval queue
- [ ] Vote on item
- [ ] Post comment
- [ ] Run sandbox simulation
- [ ] View insights dashboard
- [ ] Create playbook
- [ ] Assign playbook to role
- [ ] Complete onboarding wizard
- [ ] Generate reports

---

## Monitoring Checklist

### Metrics to Track

- [ ] Operator review count per day
- [ ] Average review time
- [ ] Consensus rate
- [ ] Guardrail trigger rate
- [ ] Sandbox simulation count
- [ ] Bias detection rate

### Alerts to Configure

- [ ] API error rate > 1%
- [ ] Average response time > 2s
- [ ] Database connection failures
- [ ] Auth failures spike

### Logs to Review

- [ ] API route errors
- [ ] Database query errors
- [ ] Auth failures
- [ ] Guardrail blocks

---

## Documentation Checklist

- [ ] PHASE10_FINAL_OVERVIEW.md complete
- [ ] PHASE10_PRODUCTION_CHECKLIST.md complete
- [ ] API documentation updated
- [ ] User guide for operators
- [ ] Admin guide for playbook management

---

## Rollback Plan

### If Issues Occur

1. **Database Issues**
   - Keep previous migration backups
   - Document rollback SQL scripts

2. **API Issues**
   - Feature flags for new endpoints
   - Fallback to previous version

3. **UI Issues**
   - Feature flags for new components
   - Previous version deployable

### Rollback Steps

1. Disable feature flags
2. Revert API deployment
3. Run rollback migrations if needed
4. Notify users of temporary unavailability

---

## Post-Deployment Checklist

### Day 1

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify all endpoints work
- [ ] Test critical flows

### Week 1

- [ ] Review operator adoption rate
- [ ] Gather user feedback
- [ ] Identify performance bottlenecks
- [ ] Fix any bugs found

### Month 1

- [ ] Analyze usage patterns
- [ ] Review bias detection accuracy
- [ ] Assess playbook effectiveness
- [ ] Plan improvements

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product | | | |
| DevOps | | | |

---

## Notes

- All tests must pass before deployment
- Stage deployment required before production
- User communication needed for new features
- Support team briefed on new functionality
