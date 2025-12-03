# CSP Nonces - Quick Reference Guide

**Last Updated**: 2025-12-03
**For**: Developers adding inline scripts/styles to Unite-Hub

---

## TL;DR

**Rule**: Never use `dangerouslySetInnerHTML` for inline scripts without nonces.

**Solution**: Use our CSP-safe components from `@/components/security/Script`.

---

## Quick Start (30 seconds)

### For JSON-LD Scripts (Most Common)

```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export default function MyPage() {
  const nonce = getNonceFromHeaders(headers());
  const schema = { "@context": "https://schema.org", ... };

  return <JsonLdScript nonce={nonce} data={schema} />;
}
```

### For Custom Inline Scripts

```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { Script } from '@/components/security/Script';

export default function MyPage() {
  const nonce = getNonceFromHeaders(headers());

  return (
    <Script nonce={nonce} type="text/javascript">
      {`console.log('My inline script');`}
    </Script>
  );
}
```

### For Inline Styles (Rare - Prefer Tailwind)

```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { InlineStyle } from '@/components/security/Script';

export default function MyPage() {
  const nonce = getNonceFromHeaders(headers());

  return (
    <InlineStyle nonce={nonce}>
      {`.custom-class { color: red; }`}
    </InlineStyle>
  );
}
```

---

## Common Patterns

### Pattern 1: Single JSON-LD Script

```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export default function ProductPage() {
  const nonce = getNonceFromHeaders(headers());

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Unite-Hub CRM",
    "offers": { "@type": "Offer", "price": "495" }
  };

  return (
    <div>
      <h1>Product</h1>
      <JsonLdScript nonce={nonce} data={productSchema} />
    </div>
  );
}
```

### Pattern 2: Multiple Schemas

```tsx
export default function HomePage() {
  const nonce = getNonceFromHeaders(headers());

  const orgSchema = { "@context": "https://schema.org", ... };
  const websiteSchema = { "@context": "https://schema.org", ... };

  return (
    <div>
      <h1>Home</h1>
      <JsonLdScript nonce={nonce} data={orgSchema} />
      <JsonLdScript nonce={nonce} data={websiteSchema} />
    </div>
  );
}
```

### Pattern 3: Client Component (Pass Nonce as Prop)

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

import { JsonLdScript } from '@/components/security/Script';

export default function ClientComponent({ nonce }: { nonce?: string }) {
  const schema = { "@context": "https://schema.org", ... };
  return <JsonLdScript nonce={nonce} data={schema} />;
}
```

---

## Checklist for New Scripts

When adding inline scripts, check:

- [ ] Script is in Server Component (can access `headers()`)
- [ ] Import `getNonceFromHeaders` from `@/lib/security/csp`
- [ ] Import appropriate component from `@/components/security/Script`
- [ ] Get nonce: `const nonce = getNonceFromHeaders(headers());`
- [ ] Pass nonce to Script component
- [ ] Test in browser: verify nonce attribute exists
- [ ] Check console: no CSP violations

---

## What NOT to Do

### ❌ DON'T: Use dangerouslySetInnerHTML without nonce

```tsx
// ❌ BAD: CSP will block this
export function BadExample() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### ❌ DON'T: Use headers() in Client Component

```tsx
'use client';

// ❌ BAD: Will throw error
export function BadClientComponent() {
  const nonce = getNonceFromHeaders(headers()); // ERROR!
  return <Script nonce={nonce}>...</Script>;
}
```

### ❌ DON'T: Hardcode or reuse nonces

```tsx
// ❌ BAD: Nonces must be unique per request
const HARDCODED_NONCE = 'abc123'; // NEVER DO THIS

export function BadExample() {
  return <Script nonce={HARDCODED_NONCE}>...</Script>;
}
```

---

## Troubleshooting

### "Script blocked by CSP"

**Error**: `Refused to execute inline script because it violates CSP...`

**Fix**: Add nonce attribute
```tsx
const nonce = getNonceFromHeaders(headers());
<Script nonce={nonce}>...</Script>
```

### "headers() not available"

**Error**: `headers() is only available in Server Components`

**Fix**: Use Server Component or pass nonce as prop
```tsx
// In Server Component
export default function Page() {
  const nonce = getNonceFromHeaders(headers());
  return <ClientComponent nonce={nonce} />;
}
```

### "Nonce is undefined"

**Cause**: Middleware not running or headers not accessible

**Fix**:
1. Check if route is in middleware matcher
2. Verify you're in a Server Component
3. Pass nonce as prop if in Client Component

---

## API Reference

### `generateNonce(length?: number): string`

Generate cryptographically secure nonce.

```typescript
import { generateNonce } from '@/lib/security/csp';

const nonce = generateNonce(); // Default 16 bytes
const longNonce = generateNonce(32); // 32 bytes
```

### `getNonceFromHeaders(headers: Headers): string | undefined`

Get nonce from request headers (for Server Components).

```typescript
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';

export default function Page() {
  const nonce = getNonceFromHeaders(headers());
  // ...
}
```

### `<JsonLdScript>`

Render JSON-LD structured data with nonce.

```typescript
interface JsonLdScriptProps {
  nonce?: string;
  data: any;
}
```

### `<Script>`

Render inline script with nonce.

```typescript
interface ScriptProps {
  nonce?: string;
  type?: string;
  children: string;
}
```

### `<InlineStyle>`

Render inline style with nonce.

```typescript
interface InlineStyleProps {
  nonce?: string;
  children: string;
}
```

---

## File Locations

```
src/
├── lib/
│   └── security/
│       └── csp.ts              # Nonce generation, CSP builder
├── components/
│   └── security/
│       └── Script.tsx          # CSP-safe Script components
└── middleware.ts               # Nonce generation per request

docs/
├── CSP_NONCES.md              # Full documentation
├── CSP_QUICK_REFERENCE.md     # This file
└── CSP_INLINE_SCRIPTS_AUDIT.md # Migration guide
```

---

## Testing Your Changes

### 1. Local Testing

```bash
npm run dev
# Open http://localhost:3008
# Check browser console for CSP violations (should be none)
```

### 2. Inspect Headers

Open DevTools → Network → Select page → Response Headers:
```
Content-Security-Policy: script-src 'self' 'nonce-abc123...'
x-nonce: abc123...
```

### 3. Inspect HTML

View page source, find your script:
```html
<script type="application/ld+json" nonce="abc123...">
  {"@context":"https://schema.org",...}
</script>
```

### 4. Check for Violations

Console should NOT show:
```
Refused to execute inline script because it violates CSP...
```

---

## Migration Examples

### Migrate: OrganizationSchema

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

## Additional Resources

- [Full CSP Documentation](./CSP_NONCES.md)
- [Inline Scripts Audit](./CSP_INLINE_SCRIPTS_AUDIT.md)
- [MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

---

**Questions?** Check [CSP_NONCES.md](./CSP_NONCES.md) or create GitHub issue.

**Last Updated**: 2025-12-03
