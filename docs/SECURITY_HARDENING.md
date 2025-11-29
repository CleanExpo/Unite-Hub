# Unite-Hub Security Hardening Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Phase**: 11 - Deployment Infrastructure

---

## Security Overview

This document covers security hardening measures for Unite-Hub production deployment, aligned with OWASP best practices and Australian privacy requirements.

### Security Posture Summary

| Area | Status | Coverage |
|------|--------|----------|
| Authentication | ✅ Complete | PKCE OAuth, session validation |
| Authorization | ✅ Complete | RBAC with 4 roles |
| API Security | ✅ Complete | 99%+ route protection |
| Rate Limiting | ✅ Complete | Tier-based, 100% coverage |
| RLS Policies | ✅ Complete | 100% table coverage |
| Data Encryption | ✅ Partial | TLS in transit, RLS at rest |
| Security Headers | ⏳ Pending | Needs configuration |
| Penetration Testing | ⏳ Pending | Pre-launch requirement |

---

## 1. Security Headers Configuration

### 1.1 Next.js Security Headers

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://vercel.live;
      frame-ancestors 'self';
      form-action 'self';
      base-uri 'self';
    `.replace(/\s+/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 1.2 Verification

```bash
# Check headers
curl -I https://unite-hub.com | grep -E "^(X-|Strict|Content-Security|Referrer)"

# Use SecurityHeaders.com
# Visit: https://securityheaders.com/?q=https://unite-hub.com
# Target grade: A or A+
```

---

## 2. SSL/TLS Configuration

### 2.1 Vercel SSL (Automatic)

Vercel provides automatic SSL with:
- TLS 1.2 and 1.3 support
- Automatic certificate renewal
- HTTP to HTTPS redirect

### 2.2 Custom Domain SSL

```bash
# Verify SSL configuration
openssl s_client -connect unite-hub.com:443 -servername unite-hub.com 2>/dev/null | openssl x509 -noout -dates

# Check TLS version
curl -svo /dev/null --tlsv1.3 https://unite-hub.com 2>&1 | grep "SSL connection"
```

### 2.3 SSL Checklist

- [ ] TLS 1.3 enabled (primary)
- [ ] TLS 1.2 enabled (fallback)
- [ ] TLS 1.1/1.0 disabled
- [ ] Strong cipher suites only
- [ ] HSTS header with preload
- [ ] Certificate valid for 1+ year

---

## 3. API Security

### 3.1 Current Protection Status

```
Total API Routes: 666
Protected Routes: 636 (95.5%)
Public Routes: 30 (4.5% - health, auth callbacks, webhooks)
```

### 3.2 Authentication Middleware

```typescript
// src/core/auth/middleware.ts
import { withAuth } from '@/core/auth/with-auth';
import { withRole } from '@/core/auth/with-role';
import { withWorkspace } from '@/core/auth/with-workspace';

// Basic authentication
export const GET = withAuth(async (req, { user }) => {
  // User is authenticated
});

// Role-based access
export const POST = withRole(['ADMIN', 'STAFF'], async (req, { user, role }) => {
  // User has required role
});

// Workspace scoping
export const PUT = withWorkspace(async (req, { user, workspace }) => {
  // Workspace context available
});
```

### 3.3 Rate Limiting

```typescript
// Tier-based rate limits
const RATE_LIMITS = {
  public: { requests: 10, window: '1m' },
  webhook: { requests: 100, window: '1m' },
  client: { requests: 60, window: '1m' },
  staff: { requests: 120, window: '1m' },
  agent: { requests: 300, window: '1m' },
  admin: { requests: 500, window: '1m' },
};
```

### 3.4 CORS Configuration

```typescript
// next.config.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://unite-hub.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

---

## 4. Database Security

### 4.1 Row Level Security (RLS)

All tables protected with RLS policies:

```sql
-- Workspace isolation policy (example)
CREATE POLICY "workspace_isolation" ON contacts
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));
```

### 4.2 Connection Security

```typescript
// Use pooled connections
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false, // Server-side
  },
});
```

### 4.3 Query Safety

```typescript
// Always use parameterized queries
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId) // Parameterized
  .limit(100);

// Never use raw SQL interpolation
// ❌ BAD: `SELECT * FROM contacts WHERE id = '${id}'`
// ✅ GOOD: Use Supabase client or prepared statements
```

### 4.4 Sensitive Data Handling

```typescript
// Redact sensitive fields in logs
const sanitizeForLogs = (data: any) => {
  const redacted = { ...data };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn'];

  for (const field of sensitiveFields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
};
```

---

## 5. Authentication Security

### 5.1 PKCE OAuth Flow

Unite-Hub uses PKCE (Proof Key for Code Exchange) for OAuth:

```typescript
// Benefits:
// - No client secret exposure
// - Protection against authorization code interception
// - Server-side session validation
```

### 5.2 Session Management

```typescript
// Server-side validation
const { data: { user }, error } = await supabase.auth.getUser();

// Session timeout: 1 hour default
// Refresh token: 7 days
// Force re-auth for sensitive operations
```

### 5.3 Password Policy (if applicable)

```typescript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventPasswordReuse: 5, // Last 5 passwords
};
```

---

## 6. Input Validation

### 6.1 API Request Validation

```typescript
import { z } from 'zod';

// Define schema
const ContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

// Validate in route
export async function POST(req: Request) {
  const body = await req.json();
  const result = ContactSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.issues },
      { status: 400 }
    );
  }

  // Proceed with validated data
}
```

### 6.2 SQL Injection Prevention

```typescript
// Always use Supabase client (parameterized)
const { data } = await supabase
  .from('contacts')
  .select('*')
  .textSearch('name', query); // Safe

// For raw SQL, use prepared statements
const { data } = await supabase.rpc('search_contacts', {
  search_term: query // Passed as parameter
});
```

### 6.3 XSS Prevention

```typescript
// React auto-escapes by default
// For dangerouslySetInnerHTML, sanitize first:
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userContent);
```

---

## 7. Secrets Management

### 7.1 Environment Variables

```bash
# Never commit secrets to git
# Use .env.local for development
# Use Vercel Environment Variables for production

# Rotate secrets regularly:
# - API keys: Every 90 days
# - Database passwords: Every 180 days
# - OAuth secrets: Every 365 days
```

### 7.2 Secret Rotation Procedure

1. Generate new secret
2. Add to Vercel as new variable
3. Deploy with both secrets active
4. Verify new secret works
5. Remove old secret from Vercel
6. Revoke old secret at provider

### 7.3 Audit Trail

```typescript
// Log secret access (not the secret itself)
logger.info({
  event: 'secret_accessed',
  secretName: 'ANTHROPIC_API_KEY',
  accessedBy: userId,
  timestamp: new Date().toISOString(),
});
```

---

## 8. Security Monitoring

### 8.1 Audit Logging

```typescript
// src/core/security/audit.ts
interface AuditEvent {
  action: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

// Log sensitive operations
await auditLog({
  action: 'USER_DATA_EXPORT',
  userId: user.id,
  resourceType: 'contacts',
  resourceId: workspaceId,
  metadata: { count: exportedRecords },
  ip: req.headers.get('x-forwarded-for'),
  userAgent: req.headers.get('user-agent'),
});
```

### 8.2 Anomaly Detection

Monitor for:
- Failed login attempts (> 5 in 5 minutes)
- Unusual API access patterns
- Large data exports
- Off-hours access from new locations
- Privilege escalation attempts

### 8.3 Security Alerts

```typescript
// Sentry for security alerts
import * as Sentry from '@sentry/nextjs';

// Security-specific alert
Sentry.captureException(new SecurityError('Unauthorized access attempt'), {
  level: 'error',
  tags: { security: true },
  extra: { userId, ip, attemptedResource },
});
```

---

## 9. Compliance

### 9.1 Australian Privacy Principles (APP)

- [ ] Privacy policy published
- [ ] Data collection consent
- [ ] Purpose limitation enforced
- [ ] Data retention policies
- [ ] Subject access request process
- [ ] Data breach notification ready

### 9.2 GDPR Readiness (for international users)

- [ ] Right to access implemented
- [ ] Right to erasure implemented
- [ ] Data portability (export)
- [ ] Consent management
- [ ] DPO contact available

### 9.3 Security Certifications

Consider for enterprise customers:
- SOC 2 Type II
- ISO 27001
- HIPAA (if handling health data)

---

## 10. Pre-Launch Security Checklist

### 10.1 Configuration
- [ ] Security headers configured
- [ ] HTTPS enforced (HSTS)
- [ ] Debug mode disabled
- [ ] Error messages generic
- [ ] Stack traces hidden

### 10.2 Authentication
- [ ] PKCE OAuth working
- [ ] Session management verified
- [ ] Password policy enforced
- [ ] MFA available (if applicable)

### 10.3 Authorization
- [ ] RLS policies verified
- [ ] Role permissions tested
- [ ] Workspace isolation tested
- [ ] Admin routes protected

### 10.4 Data Protection
- [ ] Encryption at rest
- [ ] Encryption in transit
- [ ] Backup encryption
- [ ] Key rotation scheduled

### 10.5 Monitoring
- [ ] Audit logging active
- [ ] Security alerts configured
- [ ] Anomaly detection enabled
- [ ] Incident response ready

### 10.6 Testing
- [ ] Dependency audit passed
- [ ] Static analysis (ESLint security plugins)
- [ ] Dynamic testing (OWASP ZAP)
- [ ] Penetration test scheduled

---

## 11. Penetration Testing Guide

### 11.1 Scope

| In Scope | Out of Scope |
|----------|--------------|
| unite-hub.com | Third-party services |
| api.unite-hub.com | Supabase infrastructure |
| All API endpoints | DDoS testing |
| Authentication flows | Physical security |

### 11.2 Testing Areas

1. **Authentication Testing**
   - OAuth flow bypass attempts
   - Session hijacking
   - Token manipulation

2. **Authorization Testing**
   - IDOR (Insecure Direct Object Reference)
   - Privilege escalation
   - Horizontal access

3. **Injection Testing**
   - SQL injection
   - NoSQL injection
   - Command injection

4. **API Testing**
   - Rate limiting bypass
   - Parameter tampering
   - Mass assignment

### 11.3 Reporting

Findings should include:
- Vulnerability description
- Severity (Critical/High/Medium/Low)
- Steps to reproduce
- Proof of concept
- Recommended fix
- CVSS score

---

## Quick Reference

### Security Contacts
| Role | Contact |
|------|---------|
| Security Lead | security@unite-group.in |
| DPO | privacy@unite-group.in |
| Incident Response | incidents@unite-group.in |

### Emergency Procedures
1. **Suspected breach**: Immediately notify security@unite-group.in
2. **Credential exposure**: Rotate all exposed secrets immediately
3. **Active attack**: Enable WAF rules, block suspicious IPs

### Useful Tools
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/
- **OWASP ZAP**: Dynamic security testing
- **npm audit**: Dependency vulnerability scanning

---

*Last Updated: 2025-11-30*
*Security Review: Quarterly*
*Next Pen Test: Before production launch*
