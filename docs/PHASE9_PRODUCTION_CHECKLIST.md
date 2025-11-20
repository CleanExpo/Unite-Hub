# Phase 9 Production Readiness Checklist

**Version**: 1.0
**Date**: 2025-11-20

---

## Pre-Deployment Checklist

### Database

- [ ] **Migrations Applied**
  - [ ] `057_trusted_mode_foundation.sql` executed
  - [ ] `058_signature_requests.sql` executed
  - [ ] All tables created with correct schema
  - [ ] RLS policies enabled and tested

- [ ] **Indexes Created**
  - [ ] `idx_trusted_mode_client` on `trusted_mode_requests`
  - [ ] `idx_autonomy_proposals_client_status` on `autonomy_proposals`
  - [ ] `idx_autonomy_executions_proposal` on `autonomy_executions`
  - [ ] `idx_autonomy_audit_client` on `autonomy_audit_log`

- [ ] **Triggers Active**
  - [ ] `update_updated_at` trigger on `trusted_mode_requests`

### Environment Variables

- [ ] **Required Variables Set**
  ```env
  # Supabase (existing)
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # Signature Providers (at least one)
  DOCUSIGN_INTEGRATION_KEY=
  DOCUSIGN_USER_ID=
  DOCUSIGN_ACCOUNT_ID=
  DOCUSIGN_PRIVATE_KEY=
  DOCUSIGN_WEBHOOK_SECRET=

  # OR
  HELLOSIGN_API_KEY=
  HELLOSIGN_CLIENT_ID=
  ```

- [ ] **Optional Variables**
  ```env
  AUTONOMY_DAILY_LIMIT=50
  AUTONOMY_EXECUTION_WINDOW_START=09:00
  AUTONOMY_EXECUTION_WINDOW_END=18:00
  ```

### API Endpoints

- [ ] **Trust API Routes Tested**
  - [ ] POST `/api/trust/init` - Returns 200 with request object
  - [ ] POST `/api/trust/verify-ownership` - Returns 200 with status
  - [ ] POST `/api/trust/configure-scopes` - Returns 200 with scopes
  - [ ] GET `/api/trust/status` - Returns 200 with status
  - [ ] DELETE `/api/trust/status` - Returns 200 with revoked status
  - [ ] POST `/api/trust/signature/init` - Returns 200 with envelope
  - [ ] POST `/api/trust/signature/callback` - Returns 200
  - [ ] GET `/api/trust/audit` - Returns 200 with events
  - [ ] GET `/api/trust/report` - Returns 200 with report

- [ ] **Autonomy API Routes Tested**
  - [ ] POST `/api/autonomy/propose` - Returns 200 with proposal
  - [ ] GET `/api/autonomy/propose` - Returns 200 with list
  - [ ] GET `/api/autonomy/proposals/:id` - Returns 200 with details
  - [ ] PATCH `/api/autonomy/proposals/:id` - Returns 200 with result
  - [ ] POST `/api/autonomy/rollback` - Returns 200 with result
  - [ ] GET `/api/autonomy/rollback` - Returns 200 with availability

### Authentication

- [ ] **All Routes Protected**
  - [ ] Bearer token validation working
  - [ ] Session cookie fallback working
  - [ ] Unauthorized returns 401
  - [ ] Access denied returns 403

- [ ] **Role Requirements Enforced**
  - [ ] Trust init requires `owner` or `admin`
  - [ ] Proposal approval requires `owner` or `admin`
  - [ ] Rollback requires authenticated user

### Security

- [ ] **Webhook Verification**
  - [ ] DocuSign HMAC verification enabled
  - [ ] HelloSign HMAC verification enabled
  - [ ] Invalid signatures return 401

- [ ] **Data Isolation**
  - [ ] RLS policies tested with multiple clients
  - [ ] Cross-client data access blocked
  - [ ] Organization membership verified

- [ ] **Audit Trail**
  - [ ] All proposal actions logged
  - [ ] All execution actions logged
  - [ ] All rollback actions logged
  - [ ] All trust mode changes logged

### Testing

- [ ] **Unit Tests Pass**
  ```bash
  npm run test:unit
  ```
  - [ ] `trustModeService.test.ts` - 20/20 passing
  - [ ] `signatureProvider.test.ts` - 15/15 passing
  - [ ] `proposalEngine.test.ts` - 20/20 passing
  - [ ] `executionEngine.test.ts` - 15/15 passing
  - [ ] `rollbackEngine.test.ts` - 15/15 passing

- [ ] **Integration Tests Pass**
  ```bash
  npm run test:integration
  ```
  - [ ] `autonomy-lifecycle.test.ts` - 20/20 passing

### UI Components

- [ ] **Components Render**
  - [ ] `AutonomyGovernanceDashboard` renders without errors
  - [ ] `AuditViewer` renders without errors
  - [ ] `TrustedModeWizard` renders without errors

- [ ] **Component Functionality**
  - [ ] Proposals table displays correctly
  - [ ] Approve/reject buttons work
  - [ ] Filters apply correctly
  - [ ] Export to CSV works
  - [ ] Event details modal opens

### External Integrations

- [ ] **DocuSign (if using)**
  - [ ] Integration key valid
  - [ ] Webhook endpoint configured
  - [ ] Test envelope creation works
  - [ ] Webhook events received

- [ ] **HelloSign (if using)**
  - [ ] API key valid
  - [ ] Webhook endpoint configured
  - [ ] Test signature request works
  - [ ] Webhook events received

---

## Deployment Steps

### 1. Database Setup

```bash
# Apply migrations in Supabase SQL Editor
# 1. Copy 057_trusted_mode_foundation.sql
# 2. Copy 058_signature_requests.sql
# 3. Verify tables exist:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'trusted_mode_requests',
  'autonomy_scopes',
  'autonomy_proposals',
  'autonomy_executions',
  'autonomy_audit_log',
  'signature_requests'
);
```

### 2. Environment Configuration

```bash
# Set environment variables in Vercel/hosting provider
vercel env add DOCUSIGN_INTEGRATION_KEY
vercel env add DOCUSIGN_USER_ID
# ... etc
```

### 3. Webhook Configuration

**DocuSign**:
1. Go to DocuSign Admin → Connect
2. Add webhook URL: `https://your-domain.com/api/trust/signature/callback`
3. Select events: `envelope-completed`, `envelope-declined`, `envelope-voided`
4. Copy webhook secret to `DOCUSIGN_WEBHOOK_SECRET`

**HelloSign**:
1. Go to HelloSign → API Settings
2. Add callback URL: `https://your-domain.com/api/trust/signature/callback`
3. Enable events: `signature_request_signed`, `signature_request_declined`

### 4. Deploy

```bash
# Build and deploy
npm run build
vercel --prod
```

### 5. Verify

```bash
# Test API endpoints
curl -X GET https://your-domain.com/api/trust/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Monitoring

### Key Metrics

- [ ] **API Response Times**
  - Trust init < 500ms
  - Proposal creation < 200ms
  - Execution < 5000ms
  - Rollback < 1000ms

- [ ] **Error Rates**
  - API errors < 1%
  - Execution failures < 5%
  - Rollback failures < 1%

- [ ] **Business Metrics**
  - Proposals per day
  - Auto-approval rate
  - Rollback rate
  - Average risk level

### Alerts

- [ ] **Set Up Alerts For**
  - API 5xx errors > 5/min
  - Execution failures > 3/hour
  - Rollback failures
  - Trust mode suspensions

---

## Rollback Plan

### If Issues Occur

1. **Disable Autonomy Features**
   ```typescript
   // In config, set:
   AUTONOMY_ENABLED = false
   ```

2. **Revert to Manual Mode**
   - All proposals require manual approval
   - Disable auto-execution

3. **Database Rollback**
   ```sql
   -- If needed, truncate new tables
   TRUNCATE autonomy_audit_log CASCADE;
   TRUNCATE autonomy_executions CASCADE;
   TRUNCATE autonomy_proposals CASCADE;
   TRUNCATE autonomy_scopes CASCADE;
   TRUNCATE signature_requests CASCADE;
   TRUNCATE trusted_mode_requests CASCADE;
   ```

---

## Post-Deployment

### First Week

- [ ] Monitor error rates daily
- [ ] Review audit logs for anomalies
- [ ] Gather user feedback on wizard flow
- [ ] Check signature provider integration
- [ ] Verify rollback functionality

### First Month

- [ ] Generate first monthly report
- [ ] Review risk level distribution
- [ ] Analyze auto-approval effectiveness
- [ ] Optimize execution limits if needed
- [ ] Document any edge cases

---

## Support Contacts

- **Technical Issues**: Check `autonomy_audit_log` first
- **Signature Provider Issues**: Contact DocuSign/HelloSign support
- **Database Issues**: Check Supabase dashboard
- **API Issues**: Review API route logs in Vercel

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product | | | |
| DevOps | | | |

---

**Checklist Version**: 1.0
**Last Updated**: 2025-11-20
