# Unite-Hub Incident Response Runbook

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Status**: Production Ready

---

## Quick Reference

| Severity | Response Time | Escalation | Examples |
|----------|---------------|------------|----------|
| **P0 Critical** | 15 min | Immediate | System down, data loss, security breach |
| **P1 High** | 1 hour | Within 2 hours | Major feature broken, significant performance degradation |
| **P2 Medium** | 4 hours | Next business day | Minor feature issues, non-critical bugs |
| **P3 Low** | 24 hours | Weekly review | UI glitches, minor improvements |

---

## 1. Database Issues

### 1.1 Connection Pool Exhaustion

**Symptoms:**
- API requests timing out
- "Connection pool exhausted" errors in logs
- Slow query responses across all endpoints

**Investigation:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check connection details
SELECT pid, usename, application_name, client_addr, state, query_start
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start;
```

**Resolution:**
1. Identify and terminate idle connections
2. Check for connection leaks in application code
3. Increase pool size if needed (Supabase Dashboard → Settings → Database)
4. Enable connection pooling via Supabase Pooler

**Rollback:**
```bash
# Restart application to reset connections
npm run restart
```

### 1.2 RLS Policy Blocking Access

**Symptoms:**
- Users seeing empty data
- "Permission denied" errors
- Data visible in admin but not for users

**Investigation:**
```sql
-- Check if user has workspace access
SELECT * FROM user_organizations
WHERE user_id = '[USER_ID]';

-- Test RLS policy
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "[USER_ID]"}';
SELECT * FROM contacts WHERE workspace_id = '[WORKSPACE_ID]';
```

**Resolution:**
1. Verify user is member of workspace
2. Check RLS policies are correctly defined
3. Run RLS diagnostics: `\i scripts/rls-diagnostics.sql`

### 1.3 Slow Queries

**Symptoms:**
- High latency on specific endpoints
- Database CPU spikes
- Timeouts on list queries

**Investigation:**
```sql
-- Check slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Check index usage
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_scan DESC;
```

**Resolution:**
1. Add missing indexes (see migration 026)
2. Optimize query with proper filters
3. Add pagination for large result sets

---

## 2. Authentication Issues

### 2.1 OAuth Token Expiry

**Symptoms:**
- Users logged out unexpectedly
- "Session expired" errors
- Redirect loops on login

**Investigation:**
1. Check browser dev tools → Application → Cookies
2. Verify Supabase session cookies present
3. Check server logs for auth errors

**Resolution:**
1. Clear browser cookies and re-authenticate
2. Check Supabase project JWT expiry settings
3. Verify refresh token flow is working

### 2.2 Google OAuth Callback Failures

**Symptoms:**
- "Error during sign in" after Google auth
- Stuck on callback page
- Missing user profile

**Investigation:**
1. Check `/api/auth/callback` logs
2. Verify Google OAuth credentials in Supabase
3. Check redirect URI matches exactly

**Resolution:**
```bash
# Verify environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check Supabase OAuth settings
# Dashboard → Authentication → Providers → Google
```

### 2.3 Missing User Profile

**Symptoms:**
- User authenticated but no profile data
- Empty dashboard
- "User not found" errors

**Resolution:**
1. Check `user_profiles` table for user record
2. Run user initialization: `POST /api/auth/initialize-user`
3. Verify trigger creates profile on signup

---

## 3. API Issues

### 3.1 Rate Limiting

**Symptoms:**
- 429 Too Many Requests errors
- Legitimate users being blocked
- API throttling affecting operations

**Investigation:**
```sql
-- Check rate limit logs
SELECT * FROM rate_limit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 100;

-- Check blocked IPs
SELECT * FROM blocked_ips WHERE is_active = true;
```

**Resolution:**
1. Add rate limit override for legitimate high-volume users
2. Whitelist internal service IPs
3. Adjust tier limits if needed

```sql
-- Add override
INSERT INTO rate_limit_overrides (user_id, tier, custom_limits)
VALUES ('[USER_ID]', 'admin', '{"requests_per_minute": 200}');
```

### 3.2 AI Agent Failures

**Symptoms:**
- Content generation failing
- Email processing stopped
- Orchestrator timeouts

**Investigation:**
1. Check Anthropic API status: https://status.anthropic.com
2. Review error logs for rate limits
3. Verify API key is valid

**Resolution:**
1. Implement exponential backoff (already in `src/integrations/anthropic/rate-limiter.ts`)
2. Switch to fallback model if primary unavailable
3. Queue failed requests for retry

### 3.3 WebSocket Connection Issues

**Symptoms:**
- Real-time alerts not appearing
- Disconnection loops
- High reconnection rate

**Investigation:**
```typescript
// Check WebSocket metrics
const metrics = alertWebSocketManager.getMetrics();
console.log(metrics);
```

**Resolution:**
1. Verify Redis is running for message queue
2. Check firewall allows WebSocket connections
3. Increase connection timeout if network is slow

---

## 4. Email Issues

### 4.1 Email Delivery Failures

**Symptoms:**
- Emails not being sent
- High bounce rate
- Provider errors in logs

**Investigation:**
1. Check email service logs
2. Verify provider API keys
3. Test provider connectivity

```bash
node scripts/test-email-config.mjs
```

**Resolution:**
1. Provider failover activates automatically (SendGrid → Resend → Gmail)
2. Check sender domain DNS records
3. Verify email templates are valid

### 4.2 Gmail OAuth Token Refresh

**Symptoms:**
- Gmail sync stopped working
- "Invalid credentials" errors
- Refresh token expired

**Resolution:**
1. User must re-authenticate Gmail integration
2. Check token expiry in `integrations` table
3. Verify OAuth scopes are correct

---

## 5. Performance Issues

### 5.1 High Memory Usage

**Symptoms:**
- OOM (Out of Memory) errors
- Server crashes
- Slow garbage collection

**Investigation:**
```bash
# Check Node.js memory
node --expose-gc -e "console.log(process.memoryUsage())"

# Monitor in production
# Check Vercel/hosting provider metrics
```

**Resolution:**
1. Identify memory leaks with heap snapshots
2. Implement pagination for large data fetches
3. Clear caches if oversized

### 5.2 Bundle Size Impact

**Symptoms:**
- Slow initial page load
- High TTFB (Time to First Byte)
- Poor Core Web Vitals

**Resolution:**
1. Use dynamic imports for heavy components:
   - `DynamicMindMapVisualization` for ReactFlow
   - `DynamicHealthTrendChart` for Recharts
2. Enable code splitting (already configured)
3. Review and remove unused dependencies

---

## 6. Deployment Issues

### 6.1 Build Failures

**Symptoms:**
- Deployment fails during build
- TypeScript errors
- Missing dependencies

**Resolution:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### 6.2 Environment Variable Missing

**Symptoms:**
- Features not working in production
- Undefined errors
- API calls failing

**Resolution:**
1. Verify all env vars in Vercel dashboard
2. Compare with `.env.example`
3. Redeploy after adding missing vars

### 6.3 Database Migration Failures

**Symptoms:**
- Schema mismatches
- Missing tables or columns
- RLS policy errors

**Resolution:**
1. Run consolidated migration: `CONSOLIDATED_400-403.sql`
2. Verify with diagnostics script
3. Check migration history

---

## 7. Security Incidents

### 7.1 Suspected Breach

**Immediate Actions:**
1. **Preserve evidence** - Don't modify logs
2. **Assess scope** - Determine affected systems/data
3. **Contain** - Revoke compromised credentials
4. **Notify** - Alert stakeholders per data breach procedures

**Investigation:**
```sql
-- Check recent auth failures
SELECT * FROM audit_logs
WHERE action LIKE '%auth%'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check unusual API access
SELECT user_id, COUNT(*) as requests
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
ORDER BY requests DESC
LIMIT 20;
```

### 7.2 API Key Exposure

**Immediate Actions:**
1. Rotate exposed key immediately
2. Audit usage during exposure window
3. Update all deployments with new key
4. Review access logs for misuse

---

## 8. Escalation Matrix

| Level | Contact | Method | Response |
|-------|---------|--------|----------|
| **L1** | On-call Engineer | Slack #incidents | 15 min |
| **L2** | Tech Lead | Phone | 30 min |
| **L3** | CTO | Phone + SMS | 1 hour |
| **Security** | Security Team | security@unite-group.in | Immediate |

---

## 9. Post-Incident

### Checklist
- [ ] Incident documented in incident tracker
- [ ] Root cause identified
- [ ] Remediation steps completed
- [ ] Monitoring updated to catch similar issues
- [ ] Post-mortem scheduled (for P0/P1)
- [ ] Communication sent to affected users

### Post-Mortem Template
```markdown
## Incident: [TITLE]
**Date**: [DATE]
**Duration**: [START] - [END]
**Severity**: P0/P1/P2/P3

### Summary
[Brief description]

### Impact
- Users affected: [NUMBER]
- Features impacted: [LIST]
- Business impact: [DESCRIPTION]

### Timeline
- [TIME] - [EVENT]
- [TIME] - [EVENT]

### Root Cause
[Analysis]

### Resolution
[Steps taken]

### Action Items
- [ ] [Action 1] - Owner: [NAME] - Due: [DATE]
- [ ] [Action 2] - Owner: [NAME] - Due: [DATE]
```

---

## 10. Useful Commands

```bash
# Health check
curl http://localhost:3008/api/v1/health

# Check logs
npm run docker:logs

# Restart services
npm run docker:restart

# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Clear Redis cache
redis-cli FLUSHDB

# Check disk space
df -h

# Monitor processes
pm2 status
pm2 logs
```

---

*This runbook is a living document. Update after each incident to capture new learnings.*
