# Security Fix Implementation Plan

**Created**: 2025-12-02
**Status**: PLANNING
**Total Issues**: 24 (3 Critical, 6 High, 9 Medium, 6 Low)
**Current Score**: 7.2/10
**Target Score**: 9.0/10

---

## Executive Summary

This plan addresses all 24 security issues identified in the Unite-Hub security audit. Issues are organized into 4 phases by severity, with detailed implementation steps for each fix.

**Estimated Total Time**: 75-103 hours
**Recommended Timeline**: 2-3 weeks

---

## Phase 1: CRITICAL Fixes (24-48 hours)

### P0-1: Move Service Role Key to Server-Only Module
**Severity**: CRITICAL
**Time**: 2-3 hours
**Files**:
- `src/lib/supabase.ts` (modify)
- `src/lib/supabase/admin.ts` (create)

**Problem**: `SUPABASE_SERVICE_ROLE_KEY` is loaded in `src/lib/supabase.ts` which can be imported by client components, potentially exposing the key in client bundles.

**Solution**:
1. Create new server-only admin module:
   ```
   src/lib/supabase/admin.ts
   ```
2. Add `import 'server-only';` at top (prevents client import)
3. Move `getSupabaseAdmin()` function to this new file
4. Remove service role key references from `src/lib/supabase.ts`
5. Update all imports across codebase (search for `getSupabaseAdmin`)
6. Add runtime check to throw error if called from client

**Validation**:
- Build passes with `npm run build`
- `grep -r "SUPABASE_SERVICE_ROLE_KEY" src/` shows no client-accessible files
- Verify no service role key in client bundle

---

### P0-2: Enable Automated Dependency Scanning
**Severity**: CRITICAL
**Time**: 2-3 hours
**Files**:
- `.github/workflows/security.yml` (create)
- `package.json` (modify scripts)

**Problem**: No automated scanning for known vulnerabilities in 157 dependencies.

**Solution**:
1. Create GitHub Actions workflow for security scanning:
   ```yaml
   name: Security Scan
   on: [push, pull_request]
   jobs:
     audit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '22'
         - run: npm ci
         - run: npm audit --audit-level=high
         - run: npx snyk test --severity-threshold=high
   ```
2. Enable GitHub Dependabot alerts in repository settings
3. Add npm script: `"security:audit": "npm audit --audit-level=high"`
4. Create `dependabot.yml` for automated PRs

**Validation**:
- GitHub Actions workflow runs on push
- `npm audit` runs without critical/high vulnerabilities
- Dependabot alerts enabled in repo settings

---

### P0-3: Audit API Routes for Authentication
**Severity**: CRITICAL
**Time**: 8-12 hours
**Files**:
- All files in `src/app/api/**/*.ts`
- `docs/API_ROUTE_SECURITY_AUDIT.md` (create)

**Problem**: Only ~254 of 683 API routes have visible auth checks.

**Solution**:
1. Create audit script to list all API routes
2. Categorize each route:
   - `// AUTH: Public` - Intentionally public
   - `// AUTH: Protected` - Requires authentication
   - `// AUTH: Cron` - Requires CRON_SECRET
   - `// AUTH: Webhook` - Requires signature verification
3. Add missing authentication to protected routes
4. Document all routes in `docs/API_ROUTE_SECURITY_AUDIT.md`

**Routes requiring immediate attention**:
- `src/app/api/contact/submit/route.ts` - Should be public with rate limiting
- `src/app/api/cron/*` - Should check CRON_SECRET
- `src/app/api/webhooks/*` - Should verify signatures
- `src/app/api/public/*` - Intentionally public, document why

**Validation**:
- Every API route has auth comment
- No protected route missing auth check
- Audit document complete

---

## Phase 2: HIGH Priority Fixes (1 week)

### P1-1: Fix Middleware Fail-Open Behavior
**Severity**: HIGH
**Time**: 1-2 hours
**File**: `src/middleware.ts:204-208`

**Problem**: Middleware continues to destination on error (fail open), allowing unauthenticated access during database outages.

**Solution**:
```typescript
// Change from fail-open to fail-closed
} catch (error) {
  console.error('Error in RBAC middleware:', error);
  // FAIL CLOSED: Redirect to error page
  const errorUrl = req.nextUrl.clone();
  errorUrl.pathname = '/error';
  errorUrl.searchParams.set('code', 'auth_error');
  errorUrl.searchParams.set('message', 'Authentication service unavailable');
  return NextResponse.redirect(errorUrl);
}
```

**Also create**: `src/app/error/page.tsx` for graceful error display

**Validation**:
- Simulate DB error, verify redirect to /error
- No protected routes accessible during error state

---

### P1-2: Harden Cron Job Authentication
**Severity**: HIGH
**Time**: 2-3 hours
**Files**:
- `src/app/api/cron/health-check/route.ts`
- `src/app/api/cron/success-email/route.ts`
- `src/app/api/cron/success-insights/route.ts`
- `src/app/api/cron/success-score/route.ts`
- `src/lib/cron/auth.ts` (create)

**Problem**: Cron endpoints only check CRON_SECRET, no timestamp validation or replay prevention.

**Solution**:
1. Create shared cron auth helper:
   ```typescript
   // src/lib/cron/auth.ts
   export function validateCronRequest(req: NextRequest): { valid: boolean; error?: string } {
     const secret = req.headers.get('authorization');
     const timestamp = req.headers.get('x-cron-timestamp');

     // Validate secret
     if (!secret || secret !== `Bearer ${process.env.CRON_SECRET}`) {
       return { valid: false, error: 'Invalid cron secret' };
     }

     // Validate timestamp (5-minute window)
     if (timestamp) {
       const ts = parseInt(timestamp);
       if (Math.abs(Date.now() - ts) > 300000) {
         return { valid: false, error: 'Timestamp expired' };
       }
     }

     return { valid: true };
   }
   ```
2. Update all cron routes to use this helper
3. Document CRON_SECRET entropy requirements (min 32 chars)

**Validation**:
- Cron routes reject invalid/missing secrets
- Old timestamps rejected
- All 4 cron routes updated

---

### P1-3: Audit Workspace Isolation
**Severity**: HIGH
**Time**: 8-12 hours
**Files**: All files with Supabase queries

**Problem**: Some queries may be missing `.eq("workspace_id", workspaceId)` filter.

**Solution**:
1. Create ESLint rule or grep pattern to detect unfiltered queries:
   ```bash
   grep -rn "\.from\(" src/ | grep -v "workspace_id" | grep -v "organizations" | grep -v "user_profiles"
   ```
2. Audit each query and add workspace filter where needed
3. Create database constraints as backup:
   ```sql
   ALTER TABLE contacts ADD CONSTRAINT contacts_workspace_required
   CHECK (workspace_id IS NOT NULL);
   ```
4. Use `validateUserAndWorkspace()` helper consistently

**Key files to audit**:
- `src/app/dashboard/overview/page.tsx` - Known missing filter
- All files in `src/app/api/contacts/`
- All files in `src/app/api/campaigns/`
- All files in `src/app/api/emails/`

**Validation**:
- No unfiltered queries on tenant-scoped tables
- All queries use workspace filter
- Database constraints prevent null workspace_id

---

### P1-4: Implement AI API Key Sanitization
**Severity**: HIGH
**Time**: 4-6 hours
**Files**:
- `src/lib/ai/sanitize.ts` (create)
- `src/lib/anthropic/rate-limiter.ts` (modify)
- `src/lib/ai/openrouter-intelligence.ts` (modify)

**Problem**: AI API keys may appear in error logs or monitoring services.

**Solution**:
1. Create sanitization helper:
   ```typescript
   // src/lib/ai/sanitize.ts
   const SENSITIVE_PATTERNS = [
     /sk-ant-[a-zA-Z0-9-]+/g,  // Anthropic
     /sk-[a-zA-Z0-9]+/g,       // OpenAI
     /AIza[a-zA-Z0-9_-]+/g,    // Google
   ];

   export function sanitizeError(error: unknown): unknown {
     if (typeof error === 'string') {
       return SENSITIVE_PATTERNS.reduce((s, p) => s.replace(p, '[REDACTED]'), error);
     }
     // Handle Error objects, nested objects, etc.
   }
   ```
2. Wrap all AI API calls with sanitized error handling
3. Update Winston logger to auto-sanitize sensitive fields

**Validation**:
- API keys never appear in logs
- Errors are properly sanitized before logging
- Tests confirm redaction works

---

### P1-5: Implement API Key Rotation Policy
**Severity**: HIGH
**Time**: 4-6 hours
**Files**:
- `docs/SECURITY_KEY_ROTATION.md` (create)
- `scripts/check-key-age.mjs` (create)

**Problem**: No documented key rotation policy for Anthropic, OpenRouter, Stripe, Google keys.

**Solution**:
1. Create rotation policy document with:
   - 90-day rotation schedule for all third-party API keys
   - Step-by-step rotation procedures
   - Emergency rotation procedures
2. Create script to check key age and alert at 80 days
3. Add key rotation tracking to database:
   ```sql
   CREATE TABLE api_key_metadata (
     id UUID PRIMARY KEY,
     service VARCHAR(50),
     key_prefix VARCHAR(20),
     created_at TIMESTAMPTZ,
     expires_at TIMESTAMPTZ,
     last_rotated_at TIMESTAMPTZ
   );
   ```
4. Add monitoring alert for keys approaching expiration

**Validation**:
- Documentation complete
- Script detects old keys
- Alerts configured

---

### P1-6: Harden AI API Key Exposure Risk
**Severity**: HIGH
**Time**: 2-3 hours
**Files**: Same as P1-4

**Note**: This is combined with P1-4 (AI API Key Sanitization) as they address the same underlying issue.

---

## Phase 3: MEDIUM Priority Fixes (2-4 weeks)

### P2-1: Migrate Rate Limiting to Redis
**Severity**: MEDIUM
**Time**: 3-4 hours
**Files**:
- `src/lib/rate-limit.ts` (rewrite)
- `.env.example` (add UPSTASH vars)

**Problem**: In-memory rate limiting resets on deploy and doesn't work across serverless instances.

**Solution**:
```typescript
// Use existing @upstash/redis dependency
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  analytics: true,
});
```

**Environment variables needed**:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Validation**:
- Rate limits persist across deploys
- Works across multiple serverless instances
- Existing rate limit tests pass

---

### P2-2: Audit SQL Injection Risks
**Severity**: MEDIUM
**Time**: 4-6 hours
**Files**:
- `src/lib/seoEnhancement/seoAuditService.ts`
- `src/app/api/email/unsubscribe/route.ts`
- `src/lib/marketing/visualIntegrationService.ts`
- `src/lib/services/leviathan/DaisyChainService.ts`
- `src/lib/managed/SEOBaselineEngine.ts`
- `src/lib/analytics/dataForSEOWrapper.ts`
- `src/app/api/webhooks/stripe/[mode]/route.ts`

**Problem**: Some queries use string interpolation which could be vulnerable.

**Solution**:
1. Grep for dangerous patterns:
   ```bash
   grep -rn '\.from\(\`\${' src/
   grep -rn '\.eq\(\`' src/
   ```
2. Review each instance for user-controlled input
3. Replace with parameterized queries
4. Add ESLint rule to detect template literals in queries

**Validation**:
- No user-controlled input in query strings
- All dynamic table names from trusted sources
- ESLint catches future violations

---

### P2-3: Implement Comprehensive Zod Validation
**Severity**: MEDIUM
**Time**: 8-12 hours
**Files**:
- `src/lib/validation/schemas.ts` (extend)
- All API routes

**Problem**: Inconsistent input validation across API routes.

**Solution**:
1. Extend existing validation schemas:
   ```typescript
   // src/lib/validation/schemas.ts
   export const ContactCreateSchema = z.object({
     name: z.string().min(1).max(100),
     email: z.string().email(),
     phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
     workspaceId: z.string().uuid(),
   });

   export const EmailSchema = z.string().email();
   export const UUIDSchema = z.string().uuid();
   export const WorkspaceIdSchema = z.string().uuid();
   ```
2. Create validation middleware helper
3. Apply to all API routes systematically
4. Test with invalid inputs

**Validation**:
- All API routes use Zod validation
- Invalid inputs rejected with 400 status
- Error messages don't leak internals

---

### P2-4: Configure Session Timeouts
**Severity**: MEDIUM
**Time**: 2-3 hours
**Files**:
- `src/lib/supabase.ts`
- `src/lib/supabase/client.ts`

**Problem**: No session timeout configuration, sessions live indefinitely.

**Solution**:
1. Configure Supabase session settings
2. Implement idle timeout detection on client
3. Add session refresh handling

**Note**: Supabase handles session expiry server-side. Focus on:
- Client-side idle detection
- Graceful re-auth prompts
- "Remember me" vs session-only options

**Validation**:
- Sessions expire after configured time
- Users prompted to re-authenticate
- Idle users logged out

---

### P2-5: Audit Service Role Usage
**Severity**: MEDIUM
**Time**: 4-6 hours
**Files**: All files importing `getSupabaseAdmin`

**Problem**: Service role bypasses RLS, needs audit to ensure proper usage.

**Solution**:
1. Search all usages: `grep -rn "getSupabaseAdmin" src/`
2. For each usage, verify:
   - User is already authenticated
   - Service role is necessary (not just convenient)
   - Query is properly scoped
3. Add code comments explaining why service role needed
4. Consider scoped admin clients with limited permissions

**Valid uses**:
- Initial user/org setup
- Cross-tenant admin operations
- Webhook handlers (after signature verification)

**Validation**:
- All usages documented
- No unnecessary service role usage
- Code comments explain rationale

---

### P2-6: Implement MFA Support
**Severity**: MEDIUM
**Time**: 8-12 hours
**Files**:
- `src/app/settings/security/page.tsx` (create)
- `src/lib/auth/mfa.ts` (create)
- `src/middleware.ts` (modify)

**Problem**: No multi-factor authentication option.

**Solution**:
1. Enable Supabase MFA (TOTP-based)
2. Create MFA enrollment flow
3. Create MFA verification flow
4. Add MFA requirement for FOUNDER/STAFF roles
5. Implement recovery codes

**Validation**:
- Users can enable MFA
- MFA required for admin roles
- Recovery codes work

---

### P2-7: Add Webhook Replay Prevention
**Severity**: MEDIUM
**Time**: 2-3 hours
**Files**:
- `src/app/api/webhooks/stripe/[mode]/route.ts`
- `src/lib/webhooks/replay-prevention.ts` (create)

**Problem**: Webhooks can be replayed by attackers.

**Solution**:
```typescript
// Store processed webhook IDs in Redis with 24h TTL
const webhookKey = `webhook:${event.id}`;
const alreadyProcessed = await redis.get(webhookKey);

if (alreadyProcessed) {
  return NextResponse.json({ error: 'Already processed' }, { status: 409 });
}

// Process webhook
await handleWebhookEvent(event);

// Mark as processed
await redis.setex(webhookKey, 86400, 'processed');
```

**Validation**:
- Duplicate webhooks rejected
- Redis TTL prevents unbounded storage
- Idempotent processing

---

### P2-8: Harden CSP with Nonces
**Severity**: MEDIUM
**Time**: 6-8 hours
**Files**:
- `src/middleware.ts`
- `src/app/layout.tsx`
- All inline scripts

**Problem**: CSP uses `unsafe-eval` and `unsafe-inline` which reduces XSS protection.

**Solution**:
1. Generate nonce per request in middleware
2. Pass nonce to components via header
3. Add nonce to all inline scripts
4. Remove `unsafe-inline` from CSP
5. Verify `unsafe-eval` can be removed (no eval usage found)

**Validation**:
- CSP no longer uses unsafe-inline
- All inline scripts have nonce
- Application still functions correctly

---

### P2-9: Implement Log Sanitization
**Severity**: MEDIUM
**Time**: 3-4 hours
**Files**:
- `src/lib/logger.ts` (create or modify)

**Problem**: Sensitive data may appear in logs.

**Solution**:
```typescript
const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'secret', 'authorization', 'credit_card'];

const sanitizeLog = winston.format((info) => {
  const sanitized = { ...info };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
});
```

**Validation**:
- No sensitive data in logs
- Sanitization works for nested objects
- Performance impact minimal

---

## Phase 4: LOW Priority Fixes (When Convenient)

### P3-1: Startup Environment Validation
**Severity**: LOW
**Time**: 2 hours
**Files**:
- `scripts/validate-env-production.mjs` (create)
- `package.json` (add prestart script)

**Solution**: Create script that fails deployment if required vars missing.

---

### P3-2: Expand Audit Logging
**Severity**: LOW
**Time**: 4-6 hours
**Files**: Various API routes

**Solution**: Add audit logging to all admin operations, implement retention policy.

---

### P3-3: Package Update Schedule
**Severity**: LOW
**Time**: Ongoing

**Solution**: Run `npm outdated` monthly, update non-breaking changes.

---

### P3-4: CORS Documentation
**Severity**: LOW
**Time**: 1 hour

**Solution**: Document CORS configuration and when to use it.

---

### P3-5: Outdated Package Updates
**Severity**: LOW
**Time**: 2-4 hours

**Solution**: Update `@supabase/supabase-js`, `@anthropic-ai/sdk` to latest.

---

### P3-6: Environment Variable Validation Enhancement
**Severity**: LOW
**Time**: 2 hours

**Solution**: Enhance existing validation to be more comprehensive.

---

## Implementation Order

### Week 1 (Critical + High Priority)
| Day | Task | Time | Issues |
|-----|------|------|--------|
| 1 | P0-1: Server-only admin module | 3h | CRITICAL #1 |
| 1 | P0-2: Dependency scanning | 2h | CRITICAL #3 |
| 2-3 | P0-3: API route auth audit | 10h | CRITICAL #2 |
| 4 | P1-1: Fix middleware fail-open | 2h | HIGH #2 |
| 4 | P1-2: Cron auth hardening | 3h | HIGH #4 |
| 5 | P1-4: AI key sanitization | 5h | HIGH #6 |

### Week 2 (High + Start Medium)
| Day | Task | Time | Issues |
|-----|------|------|--------|
| 1-2 | P1-3: Workspace isolation audit | 10h | HIGH #5 |
| 3 | P1-5: Key rotation policy | 5h | HIGH #1 |
| 4 | P2-1: Redis rate limiting | 4h | MEDIUM #3 |
| 5 | P2-2: SQL injection audit | 5h | MEDIUM #4 |

### Week 3 (Medium Priority)
| Day | Task | Time | Issues |
|-----|------|------|--------|
| 1-2 | P2-3: Zod validation | 10h | MEDIUM #6 |
| 3 | P2-4: Session timeouts | 3h | MEDIUM #1 |
| 3 | P2-7: Webhook replay prevention | 3h | MEDIUM #7 |
| 4 | P2-5: Service role audit | 5h | MEDIUM #5 |
| 5 | P2-9: Log sanitization | 4h | MEDIUM #9 |

### Week 4 (Medium + Low)
| Day | Task | Time | Issues |
|-----|------|------|--------|
| 1-2 | P2-6: MFA support | 10h | MEDIUM #2 |
| 3-4 | P2-8: CSP nonces | 7h | MEDIUM #8 |
| 5 | P3-1 to P3-6: Low priority | 8h | LOW #1-6 |

---

## Testing Strategy

### After Each Phase

1. **Automated Tests**: Run `npm test` and `npm run test:e2e`
2. **Security Tests**: Run `npm audit` and manual penetration tests
3. **Build Verification**: Run `npm run build` to ensure no regressions
4. **Integration Tests**: Test auth flows, API routes, webhooks

### Security Test Checklist

- [ ] Authentication bypass attempts
- [ ] Workspace isolation verification
- [ ] Rate limit bypass attempts
- [ ] XSS injection attempts
- [ ] SQL injection attempts
- [ ] CSRF verification
- [ ] Webhook replay attempts
- [ ] Cron endpoint security

---

## Success Criteria

### Phase 1 Complete
- [ ] Service role key in server-only module
- [ ] Dependency scanning enabled
- [ ] All API routes audited and documented
- **Expected Score**: 8.0/10

### Phase 2 Complete
- [ ] Middleware fails closed
- [ ] Cron endpoints hardened
- [ ] Workspace isolation verified
- [ ] AI key sanitization working
- [ ] Key rotation policy documented
- **Expected Score**: 8.5/10

### Phase 3 Complete
- [ ] Redis rate limiting deployed
- [ ] SQL injection risks mitigated
- [ ] Zod validation on all routes
- [ ] Session timeouts configured
- [ ] MFA available
- [ ] Webhook replay prevention
- [ ] CSP hardened
- [ ] Log sanitization
- **Expected Score**: 9.0/10

### Phase 4 Complete
- [ ] All low priority items addressed
- **Expected Score**: 9.5/10

---

## Risk Mitigation

### Rollback Plan
Each fix should be:
1. Implemented in a feature branch
2. Tested thoroughly
3. Deployed with feature flag if possible
4. Monitored for 24h before marking complete

### Communication
- Update `SECURITY_AUDIT_REPORT.md` as issues are fixed
- Document any breaking changes
- Notify team of required action (e.g., new env vars)

---

## Dependencies

### Required Environment Variables (New)
```env
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Required Packages (Already Installed)
- `@upstash/redis` - Already in package.json
- `zod` - Already in package.json
- `winston` - Already in package.json

### No New Dependencies Required
All fixes use existing packages.

---

**Plan Status**: Ready for Approval
**Next Step**: User approval, then begin Phase 1 implementation
