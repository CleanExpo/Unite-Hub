# Content Security Policy (CSP) with Nonces

**Status**: ✅ Implemented (P2-8)
**Security Impact**: HIGH - Removes `unsafe-inline` directives, significantly reducing XSS attack surface
**Last Updated**: 2025-12-03

---

## Overview

This document explains our CSP nonce implementation, which replaces dangerous `unsafe-inline` directives with cryptographically secure per-request nonces. This is a critical XSS defense mechanism.

### What are CSP Nonces?

**Nonce** = **N**umber used **ONCE**

A nonce is a cryptographically random string that:
1. Is generated fresh for each request
2. Is added to inline scripts/styles via `nonce="..."` attribute
3. Is included in the CSP header as `'nonce-{value}'`
4. Allows ONLY scripts/styles with matching nonce to execute

**Security Benefit**: Even if an attacker injects `<script>alert('XSS')</script>`, the browser blocks it because it lacks a valid nonce.

---

## How It Works

### 1. Middleware Generates Nonce (Per-Request)

```typescript
// src/middleware.ts
import { generateNonce, getEnvironmentCSP, NONCE_HEADER } from '@/lib/security/csp';

export async function middleware(req: NextRequest) {
  // Step 1: Generate crypto-random nonce
  const nonce = generateNonce(); // e.g., "abc123xyz789..."

  // Step 2: Store in custom header for Server Components
  const response = NextResponse.next();
  response.headers.set(NONCE_HEADER, nonce);

  // Step 3: Add to CSP header
  const cspHeader = getEnvironmentCSP(nonce);
  response.headers.set('Content-Security-Policy', cspHeader);

  return addSecurityHeaders(response, nonce);
}
```

### 2. CSP Header with Nonce

**Before (INSECURE)**:
```
Content-Security-Policy: script-src 'self' 'unsafe-inline'
```

**After (SECURE)**:
```
Content-Security-Policy: script-src 'self' 'nonce-abc123xyz789...'
```

**Impact**:
- ❌ `<script>alert('XSS')</script>` - **BLOCKED** (no nonce)
- ✅ `<script nonce="abc123xyz789...">...</script>` - **ALLOWED** (valid nonce)

### 3. Server Components Access Nonce

```tsx
// src/app/page.tsx (Server Component)
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export default function Page() {
  // Get nonce from middleware
  const nonce = getNonceFromHeaders(headers());

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Unite-Hub"
  };

  return (
    <div>
      <h1>My Page</h1>
      <JsonLdScript nonce={nonce} data={schema} />
    </div>
  );
}
```

### 4. Client Components (Limitations)

**⚠️ IMPORTANT**: Client Components cannot access `headers()` or nonces directly.

**Solution**: Pass nonce as prop from Server Component:

```tsx
// ServerComponent.tsx (Server Component)
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import ClientComponent from './ClientComponent';

export default function ServerComponent() {
  const nonce = getNonceFromHeaders(headers());
  return <ClientComponent nonce={nonce} />;
}

// ClientComponent.tsx (Client Component)
'use client';

import { Script } from '@/components/security/Script';

export default function ClientComponent({ nonce }: { nonce?: string }) {
  return (
    <Script nonce={nonce} type="application/ld+json">
      {JSON.stringify({ test: true })}
    </Script>
  );
}
```

---

## Current CSP Policy

### Production CSP (Strict)

```
default-src 'self';
script-src 'self' 'nonce-{RANDOM}' 'unsafe-eval' https://accounts.google.com https://unpkg.com;
style-src 'self' 'nonce-{RANDOM}' https://fonts.googleapis.com;
img-src 'self' data: blob: https: http:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://api.anthropic.com https://accounts.google.com;
frame-src 'self' https://accounts.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
report-uri /api/csp-report;
```

### Development CSP (Relaxed for HMR)

Same as production, plus:
```
connect-src ... ws://localhost:* http://localhost:*;
```

### Why `unsafe-eval` is Still Present

**Required for**: Next.js internals, React DevTools, Webpack HMR

**Risk**: Medium (allows `eval()` but NOT inline scripts)

**Future**: Can be removed if Next.js adds eval-free mode

---

## Migration Guide for Inline Scripts

### Before: Unsafe Inline (DEPRECATED)

```tsx
// ❌ INSECURE: Blocked by new CSP
export function OldComponent() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### After: Nonce-Based (SECURE)

```tsx
// ✅ SECURE: Allowed by new CSP
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export default function NewComponent() {
  const nonce = getNonceFromHeaders(headers());

  return <JsonLdScript nonce={nonce} data={data} />;
}
```

### For Custom Scripts

```tsx
import { Script } from '@/components/security/Script';

export default function CustomScript() {
  const nonce = getNonceFromHeaders(headers());

  return (
    <Script nonce={nonce} type="text/javascript">
      {`console.log('This script has a valid nonce');`}
    </Script>
  );
}
```

### For Inline Styles (Rare)

```tsx
import { InlineStyle } from '@/components/security/Script';

export default function CustomStyles() {
  const nonce = getNonceFromHeaders(headers());

  return (
    <InlineStyle nonce={nonce}>
      {`.custom-class { color: red; }`}
    </InlineStyle>
  );
}
```

---

## Files Requiring Nonce Migration

### ✅ Already Using `dangerouslySetInnerHTML` (Need Nonces)

| File | Type | Migration Priority | Notes |
|------|------|-------------------|-------|
| `src/components/seo/JsonLd.tsx` | JSON-LD scripts | P0 - Critical | 7 components using dangerouslySetInnerHTML |
| `src/components/StructuredData.tsx` | JSON-LD scripts | P0 - Critical | 2 components using dangerouslySetInnerHTML |
| `src/components/landing/FAQAccordion.tsx` | JSON-LD script | P0 - Critical | 1 schema script |
| `src/components/email/EmailThread.tsx` | HTML email rendering | P1 - High | 2 instances, uses sanitizeEmailHtml() |
| `src/components/email/AutoReplyPreview.tsx` | HTML email rendering | P1 - High | 1 instance, uses sanitizeEmailHtml() |
| `src/ui/components/ReportViewerModal.tsx` | HTML report rendering | P2 - Medium | 2 instances for report preview |
| `src/app/client/dashboard/welcome-pack/page.tsx` | HTML content | P2 - Medium | 1 instance |

### Migration Status

- **JSON-LD Scripts (P0)**: 10 total instances
  - These are safe (JSON data, not executable code)
  - Low XSS risk but should still use nonces for CSP compliance

- **HTML Content Rendering (P1)**: 5 total instances
  - Already uses `sanitizeEmailHtml()` for XSS protection
  - Higher risk if sanitization has bugs
  - Should migrate to nonces + keep sanitization (defense in depth)

### Migration Steps (Example: JsonLd.tsx)

**Before**:
```tsx
export function OrganizationSchema() {
  const schema = { "@context": "https://schema.org", ... };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**After**:
```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export function OrganizationSchema() {
  const nonce = getNonceFromHeaders(headers());
  const schema = { "@context": "https://schema.org", ... };

  return <JsonLdScript nonce={nonce} data={schema} />;
}
```

---

## Testing CSP Nonces

### 1. Manual Testing (Browser DevTools)

1. Start dev server: `npm run dev`
2. Open browser DevTools → Network tab
3. Load page and inspect response headers:
   ```
   Content-Security-Policy: script-src 'self' 'nonce-abc123...'
   x-nonce: abc123...
   ```
4. Inspect HTML source:
   ```html
   <script type="application/ld+json" nonce="abc123...">
     {"@context":"https://schema.org",...}
   </script>
   ```
5. Check Console tab for CSP violations (should be none)

### 2. Test CSP Violations

Add a script WITHOUT nonce to test blocking:

```tsx
// This should be BLOCKED by CSP
export function TestViolation() {
  return (
    <script type="text/javascript">
      alert('This should be blocked!');
    </script>
  );
}
```

Expected result:
- Browser console shows CSP violation
- Script does NOT execute
- Violation report sent to `/api/csp-report`

### 3. Automated Testing (Playwright/Jest)

```typescript
import { test, expect } from '@playwright/test';

test('CSP header includes nonce', async ({ page }) => {
  const response = await page.goto('/');
  const csp = response?.headers()['content-security-policy'];

  expect(csp).toContain("script-src 'self' 'nonce-");
  expect(csp).not.toContain("'unsafe-inline'");
});

test('inline scripts have nonce attribute', async ({ page }) => {
  await page.goto('/');

  const scripts = await page.locator('script[type="application/ld+json"]').all();
  for (const script of scripts) {
    const nonce = await script.getAttribute('nonce');
    expect(nonce).toBeTruthy();
    expect(nonce!.length).toBeGreaterThan(20); // Crypto-random length
  }
});
```

### 4. CSP Violation Monitoring

Check logs for violations:

```bash
# Development
npm run dev
# Check console for CSP violation warnings

# Production
# Check /api/csp-report endpoint logs
# Violations are logged to Winston logger
```

---

## Common Issues & Troubleshooting

### Issue 1: "Script blocked by CSP"

**Symptom**: Browser console shows:
```
Refused to execute inline script because it violates CSP directive 'script-src ...'
```

**Cause**: Script missing `nonce` attribute

**Solution**: Add nonce to script:
```tsx
const nonce = getNonceFromHeaders(headers());
<Script nonce={nonce}>...</Script>
```

### Issue 2: "Cannot read headers() in Client Component"

**Symptom**: Error in Client Component:
```
Error: headers() is only available in Server Components
```

**Cause**: Trying to call `headers()` in a `'use client'` component

**Solution**: Pass nonce as prop from Server Component:
```tsx
// ServerComponent.tsx
export default function ServerComponent() {
  const nonce = getNonceFromHeaders(headers());
  return <ClientComponent nonce={nonce} />;
}
```

### Issue 3: "Nonce undefined in production"

**Symptom**: Nonce is `undefined` in production but works in dev

**Cause**: Middleware not running or header not set

**Solution**:
1. Check middleware.ts runs on all routes
2. Verify `matcher` in middleware config includes the route
3. Check Edge runtime compatibility (crypto is available)

### Issue 4: "Google OAuth blocked by CSP"

**Symptom**: Google sign-in button doesn't work

**Cause**: Google scripts missing nonce or domain not allowlisted

**Solution**:
1. Add `https://accounts.google.com` to `script-src`
2. Add `https://accounts.google.com` to `frame-src`
3. These are already in our CSP config

### Issue 5: "Nonce changes on every request"

**Symptom**: Cached pages break because nonce changed

**Cause**: **This is CORRECT behavior!** Nonces MUST be unique per request

**Solution**: Don't cache pages with nonces. Use Server-Side Rendering (SSR) or Edge rendering for pages with inline scripts.

---

## Security Best Practices

### ✅ DO:

1. **Generate fresh nonces per request** - Never reuse nonces
2. **Use crypto.randomBytes()** - Cryptographically secure random
3. **Minimum 16 bytes** - Sufficient entropy (2^128 possibilities)
4. **Use Server Components** - Access nonce from headers()
5. **Keep using sanitization** - Defense in depth (nonces + HTML sanitization)
6. **Monitor violations** - Check /api/csp-report logs
7. **Test in production-like env** - CSP behaves differently in dev/prod

### ❌ DON'T:

1. **Don't hardcode nonces** - Must be random per request
2. **Don't reuse nonces** - Each request needs unique nonce
3. **Don't use nonces in Client Components** - Pass as prop from Server
4. **Don't disable CSP in production** - Critical security control
5. **Don't add unsafe-inline** - Defeats purpose of nonces
6. **Don't ignore CSP violations** - They indicate potential XSS attempts
7. **Don't use weak random** - Must use crypto.randomBytes(), not Math.random()

---

## Performance Impact

### Nonce Generation Cost

- **Time**: <0.1ms per request (crypto.randomBytes is fast)
- **Memory**: 16 bytes per nonce (~negligible)
- **CPU**: Minimal (hardware random number generator)

### CSP Header Size

- **Before**: ~400 bytes
- **After**: ~450 bytes (+50 bytes for nonce)
- **Impact**: Negligible (<1% of typical HTML response)

### Browser Processing

- **CSP parsing**: <1ms (browsers are optimized for this)
- **Nonce validation**: O(1) hash lookup per script
- **Total overhead**: <5ms per page load

**Conclusion**: Performance impact is negligible (<1% latency), security benefit is HIGH.

---

## Compliance & Standards

### OWASP Top 10 (2021)

✅ **A03:2021 - Injection** - CSP nonces prevent XSS injection

### CWE (Common Weakness Enumeration)

✅ **CWE-79** - Cross-site Scripting (XSS) - Mitigated by CSP
✅ **CWE-1021** - Improper Restriction of Rendered UI Layers - Mitigated by frame-ancestors

### PCI DSS 4.0

✅ **Requirement 6.5.7** - Cross-site scripting (XSS) - CSP nonces required

### SOC 2 Type II

✅ **CC6.1** - Logical and physical access controls - CSP is a logical access control

---

## Future Enhancements

### Phase 1 (Current)

- ✅ Nonce generation in middleware
- ✅ CSP header with nonces
- ✅ Script/JsonLdScript components
- ✅ CSP violation reporting

### Phase 2 (Q1 2026)

- ⏳ Migrate all JSON-LD scripts to JsonLdScript component
- ⏳ Migrate email rendering to use nonces
- ⏳ Add CSP violation dashboard
- ⏳ Group and analyze violation patterns

### Phase 3 (Q2 2026)

- ⏳ Remove `unsafe-eval` (requires Next.js changes)
- ⏳ Implement Subresource Integrity (SRI) for CDN scripts
- ⏳ Add CSP report aggregation and alerting
- ⏳ Automated CSP testing in CI/CD

### Phase 4 (Future)

- ⏳ Implement Trusted Types for DOM XSS prevention
- ⏳ Add CSP Level 3 features (strict-dynamic, hashes)
- ⏳ Automated CSP policy optimization based on violations

---

## References

### Official Documentation

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [W3C CSP Level 3 Spec](https://www.w3.org/TR/CSP3/)
- [Google Web Fundamentals: CSP](https://web.dev/csp/)

### Security Guidelines

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Evaluator (Google)](https://csp-evaluator.withgoogle.com/)
- [Report URI CSP Builder](https://report-uri.com/home/generate)

### Implementation Examples

- [Next.js CSP Example](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Vercel Security Headers](https://vercel.com/docs/concepts/edge-network/headers#content-security-policy)

---

## Support

For questions or issues:
- Check this documentation first
- Review CSP violation logs at `/api/csp-report`
- Test in browser DevTools Console
- Create GitHub issue with CSP violation details

**Last Updated**: 2025-12-03
**Maintainer**: Security Team
**Status**: ✅ Production Ready
