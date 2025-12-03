# API Key Rotation Policy - Unite-Hub

**Last Updated**: 2025-12-02
**Version**: 1.0.0
**Owner**: Security Team

---

## Overview

### Why Key Rotation Matters

API key rotation is a critical security practice that:

- **Limits blast radius**: Compromised keys have a limited window of validity
- **Detects breaches**: Rotation failures can indicate unauthorized key usage
- **Prevents credential stuffing**: Old keys in leaked databases become useless
- **Meets compliance**: Many frameworks (SOC 2, ISO 27001) require regular rotation
- **Reduces insider threats**: Former employees/contractors lose access over time

**Key Security Principle**: Assume all secrets will eventually be exposed. Time-bound credentials minimize impact.

---

## Key Inventory

### Third-Party API Keys

| Key | Purpose | Risk Level | Rotation Frequency | Cost of Rotation |
|-----|---------|------------|-------------------|------------------|
| `ANTHROPIC_API_KEY` | Claude AI operations | **HIGH** | 90 days | Low - automatic retry |
| `OPENROUTER_API_KEY` | Multi-model routing | **HIGH** | 90 days | Low - automatic retry |
| `GEMINI_API_KEY` | Google AI (Nano Banana 2) | **MEDIUM** | 90 days | Low |
| `OPENAI_API_KEY` | Fallback AI operations | **MEDIUM** | 90 days | Low |
| `STRIPE_SECRET_KEY` | Payment processing | **CRITICAL** | 90 days | High - update webhook |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | **HIGH** | 90 days | High - coordinate timing |
| `RESEND_API_KEY` | Transactional email | **MEDIUM** | 90 days | Low |
| `SENDGRID_API_KEY` | Transactional email (backup) | **MEDIUM** | 90 days | Low |
| `PERPLEXITY_API_KEY` | SEO research | **LOW** | 90 days | Low |

### Infrastructure Keys

| Key | Purpose | Risk Level | Rotation Frequency | Cost of Rotation |
|-----|---------|------------|-------------------|------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Database admin operations | **CRITICAL** | 30 days | High - update all services |
| `SUPABASE_ANON_KEY` | Public client access | **MEDIUM** | 180 days | High - all clients update |
| `CRON_SECRET` | Cron job authentication | **HIGH** | 90 days | Medium - update Vercel |
| `NEXTAUTH_SECRET` | Session signing | **CRITICAL** | 90 days | High - invalidates sessions |

### OAuth Credentials

| Key | Purpose | Risk Level | Rotation Frequency | Cost of Rotation |
|-----|---------|------------|-------------------|------------------|
| `GOOGLE_CLIENT_SECRET` | OAuth authentication | **HIGH** | 180 days | High - all users re-auth |
| `GOOGLE_CLIENT_ID` | OAuth configuration | **LOW** | Manual only | Very high |

---

## Rotation Schedule

### Standard Rotation Windows

**90-Day Rotation** (Most third-party APIs):
- Rotate on: 1st of Jan, Apr, Jul, Oct
- Preparation window: 7 days before rotation
- Grace period: 7 days with dual-key support

**30-Day Rotation** (High-risk infrastructure):
- Rotate on: 1st of every month
- Preparation window: 3 days before rotation
- Grace period: 24 hours with dual-key support

**180-Day Rotation** (High-impact keys):
- Rotate on: 1st of Jan, Jul
- Preparation window: 14 days before rotation
- Grace period: 14 days with dual-key support

### Emergency Rotation

**Trigger Immediate Rotation If**:
- Key appears in public repository commit
- Key detected in leaked credential databases
- Suspicious API usage patterns detected
- Employee/contractor with key access departs
- Security audit flags key as compromised

**Emergency Rotation SLA**: 4 hours from detection to new key deployed

---

## Rotation Procedures

### Pre-Rotation Checklist

Before rotating ANY key:

1. ✅ Check `key-rotation-log.json` for last rotation date
2. ✅ Verify current key is working correctly
3. ✅ Review recent API usage for anomalies
4. ✅ Schedule rotation during low-traffic window
5. ✅ Notify team in #engineering Slack channel
6. ✅ Prepare rollback plan (keep old key for 24h)
7. ✅ Update monitoring to expect brief API errors

---

### 1. ANTHROPIC_API_KEY (Claude AI)

**Risk Level**: HIGH
**Rotation Frequency**: 90 days
**Downtime**: < 5 minutes (automatic retry handles transition)

#### Steps

1. **Generate New Key**
   ```bash
   # Go to: https://console.anthropic.com/settings/keys
   # Click "Create Key"
   # Name: "Unite-Hub Production - 2025-12-02"
   # Copy key immediately (shown once)
   ```

2. **Update Vercel Environment Variables**
   ```bash
   # Vercel Dashboard → Unite-Hub → Settings → Environment Variables
   # Edit ANTHROPIC_API_KEY
   # Paste new key
   # Click "Save"
   ```

3. **Trigger Deployment**
   ```bash
   # Option 1: Trigger re-deploy (recommended)
   vercel --prod

   # Option 2: Wait for next git push (max 24h grace period)
   ```

4. **Verify New Key**
   ```bash
   # Test endpoint
   curl -X POST https://unite-hub.com/api/agents/email-processor \
     -H "Content-Type: application/json" \
     -d '{"test": true}'

   # Should return 200 with processed result
   ```

5. **Deactivate Old Key**
   ```bash
   # Wait 24 hours after deployment
   # Go to: https://console.anthropic.com/settings/keys
   # Find old key by name
   # Click "Revoke"
   ```

6. **Update Rotation Log**
   ```bash
   node scripts/update-key-rotation.mjs ANTHROPIC_API_KEY
   ```

**Rollback Procedure**: If API calls fail after rotation, immediately revert `ANTHROPIC_API_KEY` in Vercel to previous value and redeploy.

---

### 2. OPENROUTER_API_KEY (Multi-Model Routing)

**Risk Level**: HIGH
**Rotation Frequency**: 90 days
**Downtime**: < 5 minutes

#### Steps

1. **Generate New Key**
   ```bash
   # Go to: https://openrouter.ai/keys
   # Click "Create New Key"
   # Name: "Unite-Hub Production - 2025-12-02"
   # Copy key
   ```

2. **Update Vercel Environment**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Edit OPENROUTER_API_KEY
   # Save and redeploy
   ```

3. **Verify**
   ```bash
   # Test social content generation
   curl -X POST https://unite-hub.com/api/content/social \
     -H "Content-Type: application/json" \
     -d '{"platform": "linkedin", "topic": "test"}'
   ```

4. **Deactivate Old Key** (after 24h)
   ```bash
   # OpenRouter Dashboard → Keys → Revoke old key
   ```

5. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs OPENROUTER_API_KEY
   ```

---

### 3. STRIPE_SECRET_KEY (Payments)

**Risk Level**: CRITICAL
**Rotation Frequency**: 90 days
**Downtime**: 0 minutes (dual-key support required)

⚠️ **WARNING**: This rotation requires careful coordination with webhook rotation.

#### Steps

1. **Create Restricted Key** (Best Practice)
   ```bash
   # Go to: https://dashboard.stripe.com/apikeys
   # Click "Create restricted key"
   # Name: "Unite-Hub Production - 2025-12-02"
   # Permissions:
   #   - Customers: Write
   #   - Subscriptions: Write
   #   - Payment Intents: Write
   #   - Invoices: Read
   # Click "Create key"
   ```

2. **Test New Key in Staging**
   ```bash
   # Update staging environment first
   # Vercel Dashboard → unite-hub-staging → Environment Variables
   # Update STRIPE_SECRET_KEY
   # Deploy to staging

   # Test payment flow
   npm run test:e2e:payments
   ```

3. **Update Production**
   ```bash
   # Vercel Dashboard → unite-hub-production → Environment Variables
   # Update STRIPE_SECRET_KEY
   # Deploy (triggers automatic rollout)
   ```

4. **Monitor Stripe Dashboard**
   ```bash
   # Watch for API errors for 30 minutes
   # https://dashboard.stripe.com/logs
   # Expect: No 401 errors, all requests succeed
   ```

5. **Deactivate Old Key** (after 24h)
   ```bash
   # Stripe Dashboard → API Keys → Roll old key
   ```

6. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs STRIPE_SECRET_KEY
   ```

**Rollback**: Stripe allows multiple live keys simultaneously. Keep old key active for 24h to allow instant rollback.

---

### 4. STRIPE_WEBHOOK_SECRET (Webhook Verification)

**Risk Level**: HIGH
**Rotation Frequency**: 90 days (coordinate with STRIPE_SECRET_KEY)
**Downtime**: 0 minutes (dual-secret support)

⚠️ **CRITICAL**: Rotate webhook secret BEFORE rotating API key.

#### Steps

1. **Create New Webhook Endpoint**
   ```bash
   # Go to: https://dashboard.stripe.com/webhooks
   # Click "Add endpoint"
   # URL: https://unite-hub.com/api/webhooks/stripe
   # Events to send:
   #   - customer.subscription.created
   #   - customer.subscription.updated
   #   - customer.subscription.deleted
   #   - invoice.payment_succeeded
   #   - invoice.payment_failed
   # Click "Add endpoint"
   ```

2. **Update Environment with BOTH Secrets**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Add: STRIPE_WEBHOOK_SECRET_NEW=whsec_...
   # Keep: STRIPE_WEBHOOK_SECRET=whsec_... (old)
   # Deploy
   ```

3. **Update Webhook Handler for Dual-Secret**
   ```typescript
   // src/app/api/webhooks/stripe/route.ts
   const sig = headers().get('stripe-signature')!;

   let event;
   try {
     event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET_NEW!);
   } catch (err) {
     // Fallback to old secret
     try {
       event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
     } catch (fallbackErr) {
       return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
     }
   }
   ```

4. **Monitor Webhook Delivery**
   ```bash
   # Stripe Dashboard → Webhooks → [your endpoint]
   # Verify successful deliveries for 1 hour
   ```

5. **Remove Old Secret**
   ```bash
   # After 24h of successful deliveries:
   # Stripe Dashboard → Webhooks → Delete old endpoint
   # Vercel → Environment Variables → Delete STRIPE_WEBHOOK_SECRET
   # Rename STRIPE_WEBHOOK_SECRET_NEW → STRIPE_WEBHOOK_SECRET
   # Deploy
   ```

6. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs STRIPE_WEBHOOK_SECRET
   ```

---

### 5. SUPABASE_SERVICE_ROLE_KEY (Database Admin)

**Risk Level**: CRITICAL
**Rotation Frequency**: 30 days
**Downtime**: < 1 minute

⚠️ **CRITICAL**: This key bypasses Row Level Security. Compromise = full database access.

#### Steps

1. **Generate New Service Role Key**
   ```bash
   # Go to: https://supabase.com/dashboard/project/[project-id]/settings/api
   # Under "Service Role Key" section
   # Click "Generate New Service Role Key"
   # Copy key immediately
   ```

2. **Update Local Environment** (Test First)
   ```bash
   # Update .env.local
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Test database operations
   npm run test:integration:db
   ```

3. **Update Production Environment**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Update SUPABASE_SERVICE_ROLE_KEY
   # Deploy immediately (critical path)
   ```

4. **Verify All Services**
   ```bash
   # Check each service that uses admin key:
   # 1. Email agent (background jobs)
   curl -X POST https://unite-hub.com/api/agents/email-processor

   # 2. Cron jobs (scheduled tasks)
   curl https://unite-hub.com/api/cron/daily-digest \
     -H "Authorization: Bearer $CRON_SECRET"

   # 3. Database migrations (if auto-run)
   npm run db:migrate:check
   ```

5. **Revoke Old Key**
   ```bash
   # After 24h verification:
   # Supabase Dashboard → Settings → API → Revoke old service role key
   ```

6. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs SUPABASE_SERVICE_ROLE_KEY
   ```

**Rollback**: Contact Supabase support to re-enable old key if issues arise (30-minute SLA).

---

### 6. CRON_SECRET (Vercel Cron Authentication)

**Risk Level**: HIGH
**Rotation Frequency**: 90 days
**Downtime**: 0 minutes

#### Steps

1. **Generate New Secret**
   ```bash
   # Generate cryptographically secure random string
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   # Example output: Kd8xJ2mP9vL4nQ5wR7tY1zA3bC6eF8gH0iJ2kL4mN6oP8qR0s==
   ```

2. **Update Vercel Environment**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Add: CRON_SECRET_NEW=[new value]
   # Keep: CRON_SECRET=[old value]
   # Deploy
   ```

3. **Update Cron Handlers for Dual-Secret**
   ```typescript
   // src/app/api/cron/[job]/route.ts
   const authHeader = headers().get('authorization');
   const token = authHeader?.replace('Bearer ', '');

   const validSecrets = [
     process.env.CRON_SECRET,
     process.env.CRON_SECRET_NEW
   ].filter(Boolean);

   if (!token || !validSecrets.includes(token)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

4. **Wait for Next Scheduled Runs**
   ```bash
   # Monitor logs for successful cron executions
   # Vercel Dashboard → Deployments → Functions → Logs
   # Verify no 401 errors for 24 hours
   ```

5. **Remove Old Secret**
   ```bash
   # After 24h successful runs:
   # Vercel → Environment Variables → Delete CRON_SECRET
   # Rename CRON_SECRET_NEW → CRON_SECRET
   # Deploy
   ```

6. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs CRON_SECRET
   ```

---

### 7. GOOGLE_CLIENT_SECRET (OAuth)

**Risk Level**: HIGH
**Rotation Frequency**: 180 days
**Downtime**: Requires all users to re-authenticate

⚠️ **HIGH IMPACT**: Rotating this key forces all users to sign in again. Schedule during maintenance window.

#### Steps

1. **Create New OAuth Client**
   ```bash
   # Go to: https://console.cloud.google.com/apis/credentials
   # Click "Create Credentials" → "OAuth client ID"
   # Application type: Web application
   # Name: "Unite-Hub Production - 2025-12-02"
   # Authorized redirect URIs:
   #   - https://unite-hub.com/api/auth/callback/google
   #   - https://unite-hub.com/auth/callback
   # Click "Create"
   # Copy Client ID and Client Secret
   ```

2. **Update Environment (Dual-Client Support)**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Add new credentials with _NEW suffix:
   GOOGLE_CLIENT_ID_NEW=[new client id]
   GOOGLE_CLIENT_SECRET_NEW=[new client secret]

   # Keep old credentials active
   # Deploy
   ```

3. **Update Auth Configuration**
   ```typescript
   // src/lib/auth.ts
   GoogleProvider({
     clientId: process.env.GOOGLE_CLIENT_ID_NEW || process.env.GOOGLE_CLIENT_ID,
     clientSecret: process.env.GOOGLE_CLIENT_SECRET_NEW || process.env.GOOGLE_CLIENT_SECRET,
   })
   ```

4. **Announce Maintenance Window**
   ```
   Subject: Scheduled Maintenance - Unite-Hub

   We'll be performing security updates on [DATE] at [TIME].
   You may need to sign in again after the update.

   Downtime: < 5 minutes
   Impact: Requires re-authentication
   ```

5. **Switch to New Client**
   ```bash
   # During maintenance window:
   # Vercel → Environment Variables
   # Delete GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   # Rename _NEW variables (remove _NEW suffix)
   # Deploy
   ```

6. **Deactivate Old OAuth Client**
   ```bash
   # After all users have re-authenticated (monitor for 7 days):
   # Google Cloud Console → Credentials → Delete old OAuth client
   ```

7. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs GOOGLE_CLIENT_SECRET
   ```

---

### 8. Email API Keys (RESEND_API_KEY / SENDGRID_API_KEY)

**Risk Level**: MEDIUM
**Rotation Frequency**: 90 days
**Downtime**: < 1 minute (fallback provider handles transition)

#### Steps

1. **Rotate Primary Provider (Resend)**
   ```bash
   # Go to: https://resend.com/api-keys
   # Click "Create API Key"
   # Name: "Unite-Hub Production - 2025-12-02"
   # Permissions: Send emails
   # Copy key
   ```

2. **Test New Key in Staging**
   ```bash
   # Update staging environment
   # Send test email
   curl -X POST https://staging.unite-hub.com/api/email/send \
     -H "Content-Type: application/json" \
     -d '{"to": "test@example.com", "subject": "Test", "body": "Test"}'
   ```

3. **Update Production**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Update RESEND_API_KEY
   # Deploy
   ```

4. **Verify Email Sending**
   ```bash
   # Trigger actual email (welcome email, password reset, etc.)
   # Check Resend dashboard for successful sends
   # https://resend.com/emails
   ```

5. **Rotate Backup Provider (SendGrid)** - Same Day
   ```bash
   # Go to: https://app.sendgrid.com/settings/api_keys
   # Create new key with same permissions
   # Update SENDGRID_API_KEY in Vercel
   # Deploy
   ```

6. **Deactivate Old Keys** (after 24h)
   ```bash
   # Resend Dashboard → API Keys → Revoke old key
   # SendGrid Dashboard → API Keys → Delete old key
   ```

7. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs RESEND_API_KEY
   node scripts/update-key-rotation.mjs SENDGRID_API_KEY
   ```

---

### 9. NEXTAUTH_SECRET (Session Signing)

**Risk Level**: CRITICAL
**Rotation Frequency**: 90 days
**Downtime**: All active sessions invalidated (users must sign in again)

⚠️ **HIGH IMPACT**: Schedule during low-traffic window. Notify users in advance.

#### Steps

1. **Generate New Secret**
   ```bash
   # Use cryptographically secure random string
   openssl rand -base64 32
   # Example output: Kd8xJ2mP9vL4nQ5wR7tY1zA3bC6eF8gH0iJ2kL4mN6oP8qR0s=
   ```

2. **Announce Maintenance**
   ```
   Subject: Scheduled Security Update - Unite-Hub
   Date: [DATE] at [TIME]

   We'll be performing a security update that requires all users to sign in again.

   Duration: < 5 minutes
   Impact: Active sessions will be ended
   Action Required: Sign in again after update
   ```

3. **Update Environment During Maintenance Window**
   ```bash
   # Vercel Dashboard → Environment Variables
   # Update NEXTAUTH_SECRET=[new secret]
   # Deploy immediately
   ```

4. **Clear Session Storage** (Optional)
   ```sql
   -- If using database sessions (not default for Unite-Hub):
   -- Supabase Dashboard → SQL Editor
   DELETE FROM sessions WHERE expires < NOW();
   ```

5. **Monitor Authentication**
   ```bash
   # Watch authentication logs for next hour
   # Vercel Dashboard → Logs
   # Filter by: /api/auth
   # Expect: Increased sign-in activity, no errors
   ```

6. **Update Log**
   ```bash
   node scripts/update-key-rotation.mjs NEXTAUTH_SECRET
   ```

**Rollback**: If critical authentication issues arise, immediately revert `NEXTAUTH_SECRET` to old value and redeploy.

---

## Emergency Rotation Procedure

### Incident Response Timeline

**T+0 (Detection)**:
- Security team alerted via PagerDuty/Slack
- Create incident channel: `#incident-key-compromise-YYYYMMDD`
- Assess scope: Which key(s)? Where exposed? For how long?

**T+30min (Containment)**:
- Immediately revoke compromised key at provider
- Deploy application with temporary placeholder (if API-dependent)
- Enable rate limiting on affected endpoints

**T+1h (Investigation)**:
- Review API usage logs for unauthorized access
- Check for data exfiltration or unusual patterns
- Determine if data breach occurred

**T+4h (Recovery)**:
- Generate new key following standard rotation procedure
- Deploy new key to production
- Verify all services operational
- Document incident in `key-rotation-log.json`

**T+24h (Post-Incident)**:
- Complete incident report
- Update monitoring to detect similar exposures
- Implement additional controls if needed

### Emergency Rotation Commands

```bash
# Quick emergency rotation script
./scripts/emergency-rotate-key.sh <KEY_NAME>

# Example:
./scripts/emergency-rotate-key.sh ANTHROPIC_API_KEY
```

Script will:
1. Revoke old key at provider (if supported via API)
2. Generate new key
3. Update Vercel environment
4. Trigger immediate deployment
5. Send Slack notification to #engineering
6. Create incident log entry

---

## Monitoring & Detection

### Key Usage Monitoring

**Monitor These Metrics**:

1. **API Error Rates**
   - Spike in 401/403 errors → potential key issue
   - Sudden increase in rate limit errors → potential abuse

2. **API Usage Patterns**
   - Requests from unexpected geolocations
   - Requests outside normal business hours
   - Unusual endpoint access patterns

3. **Cost Anomalies**
   - 3x spike in API costs → potential abuse
   - New high-cost operations → compromised key

**Alert Thresholds**:
```yaml
# Example Prometheus alerts
- alert: HighAPIErrorRate
  expr: rate(http_requests_total{status=~"4..|5.."}[5m]) > 0.05
  for: 5m
  severity: warning

- alert: UnexpectedAPILocation
  expr: http_requests_total{country!~"AU|US|GB"} > 10
  for: 1m
  severity: critical

- alert: APICostSpike
  expr: increase(api_cost_total[1h]) > 100
  for: 5m
  severity: warning
```

### Key Age Monitoring

```bash
# Run daily via cron
0 9 * * * cd /opt/unite-hub && node scripts/check-key-age.mjs

# Output sent to #security Slack channel
```

### Leaked Credential Detection

**Use These Services**:

1. **GitHub Secret Scanning** (Enabled for repo)
   - Automatically scans commits for leaked secrets
   - Sends alerts to security team

2. **GitGuardian** (Optional - $$$)
   - Real-time monitoring across all repositories
   - Public database scanning

3. **Have I Been Pwned API** (Free)
   - Check if keys appear in known breaches
   ```bash
   # Example check
   curl https://haveibeenpwned.com/api/v3/breach/[hash]
   ```

4. **Manual Checks**
   ```bash
   # Search GitHub for leaked keys (run monthly)
   # Replace with your actual key prefix
   site:github.com "sk-ant-api03-"
   site:github.com "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
   ```

---

## Compliance & Auditing

### Audit Log Requirements

Every key rotation MUST be logged with:
- Date/time of rotation
- Key name/identifier
- Person who performed rotation
- Reason for rotation (scheduled vs emergency)
- Old key last-used date
- New key first-used date
- Any incidents during rotation

Example log entry:
```json
{
  "date": "2025-12-02T09:30:00Z",
  "key": "ANTHROPIC_API_KEY",
  "rotatedBy": "security-team@unite-hub.com",
  "reason": "scheduled-90-day",
  "oldKeyLastUsed": "2025-12-02T09:29:45Z",
  "newKeyFirstUsed": "2025-12-02T09:30:15Z",
  "incidents": [],
  "verifiedBy": "automated-test-suite"
}
```

### Compliance Mappings

**SOC 2**:
- CC6.1: Key rotation demonstrates logical access controls
- CC6.6: Regular rotation shows monitoring of access

**ISO 27001**:
- A.9.4.3: Password management system (applies to API keys)
- A.12.1.3: Capacity management (detect abuse via monitoring)

**PCI DSS** (if handling payments):
- Requirement 8.2.4: Change passwords/keys every 90 days
- Requirement 10.2: Audit trail of key changes

---

## Key Rotation Log Structure

### File: `key-rotation-log.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-12-02T09:30:00Z",
  "keys": {
    "ANTHROPIC_API_KEY": {
      "lastRotated": "2025-12-02",
      "nextRotation": "2026-03-02",
      "rotationFrequencyDays": 90,
      "riskLevel": "HIGH",
      "rotationHistory": [
        {
          "date": "2025-12-02",
          "rotatedBy": "security-team@unite-hub.com",
          "reason": "scheduled"
        },
        {
          "date": "2025-09-03",
          "rotatedBy": "security-team@unite-hub.com",
          "reason": "scheduled"
        }
      ]
    },
    "OPENROUTER_API_KEY": {
      "lastRotated": "2025-12-02",
      "nextRotation": "2026-03-02",
      "rotationFrequencyDays": 90,
      "riskLevel": "HIGH",
      "rotationHistory": []
    },
    "SUPABASE_SERVICE_ROLE_KEY": {
      "lastRotated": "2025-12-02",
      "nextRotation": "2026-01-01",
      "rotationFrequencyDays": 30,
      "riskLevel": "CRITICAL",
      "rotationHistory": []
    }
  }
}
```

---

## Best Practices

### DO ✅

- **Use restricted keys**: Only grant minimum required permissions
- **Store in secrets managers**: Use Vercel environment variables, never commit to git
- **Rotate proactively**: Don't wait for compromise
- **Test in staging first**: Always validate new keys before production
- **Monitor usage patterns**: Set up alerts for anomalies
- **Document every rotation**: Maintain audit trail
- **Use dual-key support**: Allow graceful transitions
- **Set calendar reminders**: Don't miss rotation windows

### DON'T ❌

- **Commit keys to git**: Use `.env.local` (in `.gitignore`)
- **Share keys via email/Slack**: Use secure secret sharing tools
- **Reuse keys across environments**: Separate keys for dev/staging/prod
- **Skip testing**: Always verify new key before revoking old
- **Rotate all keys at once**: Stagger rotations to reduce risk
- **Delete old keys immediately**: Keep 24h grace period
- **Ignore rotation warnings**: Expired keys are security incidents

---

## Appendix: Provider-Specific Notes

### Anthropic Claude
- Keys start with `sk-ant-api03-`
- Can create multiple keys per account
- Keys are scoped to workspace (not individual user)
- No automatic expiration - must rotate manually
- Rate limits apply per key, not per account

### OpenRouter
- Keys start with `sk-or-v1-`
- Free tier: 100 requests/day
- Paid tier: based on model usage
- Can revoke and regenerate instantly

### Stripe
- Secret keys start with `sk_live_` (prod) or `sk_test_` (dev)
- Restricted keys recommended (limit permissions)
- Multiple live keys allowed (great for rotation)
- Webhook secrets start with `whsec_`

### Supabase
- Service role keys are JWTs (long strings)
- CANNOT be rotated without contacting support
- Anon keys are safe to expose (RLS enforced)
- API keys found in: Project Settings → API

### Google Cloud (OAuth)
- Client secrets are ~30 characters
- Can create multiple OAuth clients per project
- Redirect URIs must match exactly (trailing slashes matter)
- No automatic expiration

---

## Support & Contact

**Security Team**: security@unite-hub.com
**On-Call**: PagerDuty → #security-oncall
**Slack Channel**: #security

**Key Rotation Questions**:
1. Check this documentation first
2. Search `#security` Slack channel
3. Create ticket in Jira (SEC project)
4. Escalate to security on-call if urgent

---

**Document Version**: 1.0.0
**Last Reviewed**: 2025-12-02
**Next Review**: 2026-03-02
**Owner**: Security Team