# CSP Inline Scripts Migration Audit

**Task**: P2-8 - Harden Content Security Policy with Nonces
**Status**: Audit Complete, Migration Needed
**Date**: 2025-12-03

---

## Summary

**Total Files with Inline Scripts**: 7
**Total Inline Script Instances**: 17
**Migration Priority**: P0 (10), P1 (5), P2 (2)

---

## Files Requiring Nonce Migration

### P0 - CRITICAL (JSON-LD Schema Scripts)

These are safe (non-executable JSON data) but need nonces for CSP compliance.

#### 1. `src/components/seo/JsonLd.tsx`

**Instances**: 7 components, 7 inline scripts

**Components**:
1. `OrganizationSchema` (line 50-55)
2. `ServiceSchema` (line 129-134)
3. `ArticleSchema` (line 169-174)
4. `FAQSchema` (line 207-212)
5. `BreadcrumbSchema` (line 247-252)
6. `ProductSchema` (line 299-304)
7. `VideoSchema` (line 356-361)

**Current Pattern**:
```tsx
export function OrganizationSchema() {
  const schema = { ... };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Migration Required**:
```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export function OrganizationSchema() {
  const nonce = getNonceFromHeaders(headers());
  const schema = { ... };
  return <JsonLdScript nonce={nonce} data={schema} />;
}
```

**Risk**: LOW (JSON data only, not executable)
**Effort**: LOW (simple find-replace)
**Timeline**: 1-2 hours for all 7 components

---

#### 2. `src/components/StructuredData.tsx`

**Instances**: 2 components, 2 inline scripts

**Components**:
1. `UniteHubStructuredData` (line 183-188)
2. `PricingStructuredData` (line 354-359)

**Current Pattern**:
```tsx
export function UniteHubStructuredData() {
  const schema = { "@context": "https://schema.org", ... };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

**Migration Required**:
```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export function UniteHubStructuredData() {
  const nonce = getNonceFromHeaders(headers());
  const schema = { "@context": "https://schema.org", ... };
  return <JsonLdScript nonce={nonce} data={schema} />;
}
```

**Risk**: LOW (JSON data only)
**Effort**: LOW (2 components)
**Timeline**: 30 minutes

---

#### 3. `src/components/landing/FAQAccordion.tsx`

**Instances**: 1 component, 1 inline script

**Location**: Line 123-128

**Current Pattern**:
```tsx
function FAQSchemaScript() {
  const schemaData = { ... };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
```

**Migration Required**:
```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

function FAQSchemaScript() {
  const nonce = getNonceFromHeaders(headers());
  const schemaData = { ... };
  return <JsonLdScript nonce={nonce} data={schemaData} />;
}
```

**Risk**: LOW (JSON data only)
**Effort**: LOW (1 component)
**Timeline**: 15 minutes

---

### P1 - HIGH (HTML Content Rendering)

These render user-generated HTML content. Already uses `sanitizeEmailHtml()` for XSS protection, but nonces add defense-in-depth.

#### 4. `src/components/email/EmailThread.tsx`

**Instances**: 2 inline HTML renders

**Locations**:
1. Email body (line 96-100)
2. Auto-reply content (line 117-122)

**Current Pattern**:
```tsx
<div
  className="prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.messageBody) }}
/>
```

**Notes**:
- Already uses `sanitizeEmailHtml()` for XSS protection
- Renders user-generated content (email bodies)
- CSP nonces don't directly apply to HTML content in div elements
- This is using dangerouslySetInnerHTML for HTML content, NOT inline scripts
- **NO MIGRATION NEEDED** - CSP nonces only apply to `<script>` and `<style>` tags

**Risk**: MEDIUM (user content, but sanitized)
**Effort**: N/A (no migration needed)
**Timeline**: N/A

**Recommendation**: Keep existing sanitization, monitor for CSP violations. If violations occur, investigate alternative rendering methods.

---

#### 5. `src/components/email/AutoReplyPreview.tsx`

**Instances**: 1 inline HTML render

**Location**: Line 70-74

**Current Pattern**:
```tsx
<div
  className="prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(autoReply.autoReplyContent) }}
/>
```

**Notes**:
- Same as EmailThread.tsx - HTML content in div, not script tag
- **NO MIGRATION NEEDED**

**Risk**: MEDIUM (user content, but sanitized)
**Effort**: N/A
**Timeline**: N/A

---

### P2 - MEDIUM (Report/Content Rendering)

#### 6. `src/ui/components/ReportViewerModal.tsx`

**Instances**: 2 inline HTML renders

**Locations**:
1. Tabbed view (line 146-151)
2. Preview view (line 225-229)

**Current Pattern**:
```tsx
<div
  className="p-6 prose prose-sm dark:prose-invert max-w-none"
  dangerouslySetInnerHTML={{ __html: htmlContent }}
/>
```

**Notes**:
- Renders report HTML content
- No sanitization visible (check if htmlContent is sanitized elsewhere)
- **NO MIGRATION NEEDED** for CSP nonces (HTML content, not script)
- **ACTION REQUIRED**: Verify htmlContent is sanitized before rendering

**Risk**: MEDIUM (depends on htmlContent source)
**Effort**: N/A for CSP nonces, but verify sanitization
**Timeline**: 30 min to verify sanitization

---

#### 7. `src/app/client/dashboard/welcome-pack/page.tsx`

**Instances**: 1 inline HTML render

**Location**: Not visible in grep output (needs manual inspection)

**Notes**:
- File exists but grep didn't show context
- Likely HTML content rendering, not script
- **ACTION REQUIRED**: Manual inspection needed

**Risk**: UNKNOWN
**Effort**: TBD
**Timeline**: 15 min to inspect

---

## Migration Summary

### Scripts Requiring Nonce Migration (P0)

| File | Components | Effort | Timeline |
|------|-----------|--------|----------|
| `src/components/seo/JsonLd.tsx` | 7 | LOW | 1-2 hours |
| `src/components/StructuredData.tsx` | 2 | LOW | 30 min |
| `src/components/landing/FAQAccordion.tsx` | 1 | LOW | 15 min |
| **TOTAL** | **10** | **LOW** | **2-3 hours** |

### HTML Content (No CSP Nonce Migration Needed)

| File | Instances | Action Required |
|------|-----------|-----------------|
| `src/components/email/EmailThread.tsx` | 2 | ✅ Already sanitized |
| `src/components/email/AutoReplyPreview.tsx` | 1 | ✅ Already sanitized |
| `src/ui/components/ReportViewerModal.tsx` | 2 | ⚠️ Verify sanitization |
| `src/app/client/dashboard/welcome-pack/page.tsx` | 1 | ⚠️ Manual inspection |

---

## Migration Workflow

### Step 1: Update All JSON-LD Scripts (2-3 hours)

1. Install new components:
   ```bash
   # Already created:
   # - src/lib/security/csp.ts
   # - src/components/security/Script.tsx
   ```

2. Migrate `src/components/seo/JsonLd.tsx` (7 components):
   ```bash
   # Find-replace pattern:
   # Before: dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
   # After: Import JsonLdScript, use <JsonLdScript nonce={nonce} data={schema} />
   ```

3. Migrate `src/components/StructuredData.tsx` (2 components)

4. Migrate `src/components/landing/FAQAccordion.tsx` (1 component)

### Step 2: Verify HTML Sanitization (1 hour)

1. Check `src/ui/components/ReportViewerModal.tsx`:
   - Trace `htmlContent` source
   - Verify sanitization exists
   - Add sanitization if missing

2. Inspect `src/app/client/dashboard/welcome-pack/page.tsx`:
   - Verify dangerouslySetInnerHTML usage
   - Check sanitization

### Step 3: Test CSP Compliance (1 hour)

1. Start dev server: `npm run dev`
2. Check browser console for CSP violations
3. Verify all JSON-LD scripts have nonces
4. Test pages with inline content (email, reports)

### Step 4: Production Deployment

1. Deploy changes
2. Monitor `/api/csp-report` for violations
3. Fix any remaining violations
4. Update this audit document

---

## Testing Checklist

### Pre-Migration

- [ ] Identify all files with dangerouslySetInnerHTML
- [ ] Categorize by type (script vs HTML content)
- [ ] Prioritize by risk and effort

### During Migration

- [ ] Update each JSON-LD component
- [ ] Add nonce prop from headers()
- [ ] Replace dangerouslySetInnerHTML with JsonLdScript
- [ ] Test each component in isolation

### Post-Migration

- [ ] No CSP violations in browser console
- [ ] All JSON-LD scripts have nonce attribute
- [ ] Nonce values are random and unique per request
- [ ] HTML sanitization still works for email/reports
- [ ] No XSS vulnerabilities introduced
- [ ] Production monitoring shows no violations

---

## Migration Code Examples

### Example 1: Simple JSON-LD Migration

**Before**:
```tsx
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Unite-Hub"
  };

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
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Unite-Hub"
  };

  return <JsonLdScript nonce={nonce} data={schema} />;
}
```

### Example 2: Component with Multiple Scripts

**Before**:
```tsx
export function PageWithSchemas() {
  const orgSchema = { ... };
  const breadcrumbSchema = { ... };

  return (
    <div>
      <h1>My Page</h1>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
```

**After**:
```tsx
import { headers } from 'next/headers';
import { getNonceFromHeaders } from '@/lib/security/csp';
import { JsonLdScript } from '@/components/security/Script';

export default function PageWithSchemas() {
  const nonce = getNonceFromHeaders(headers());
  const orgSchema = { ... };
  const breadcrumbSchema = { ... };

  return (
    <div>
      <h1>My Page</h1>
      <JsonLdScript nonce={nonce} data={orgSchema} />
      <JsonLdScript nonce={nonce} data={breadcrumbSchema} />
    </div>
  );
}
```

---

## Next Steps

1. **Immediate** (P0): Migrate all 10 JSON-LD components (2-3 hours)
2. **Short-term** (P1): Verify HTML sanitization for reports (1 hour)
3. **Medium-term**: Monitor CSP violations in production
4. **Long-term**: Consider Content Security Policy Level 3 features

---

## References

- Main Documentation: [docs/CSP_NONCES.md](./CSP_NONCES.md)
- Implementation: [src/lib/security/csp.ts](../src/lib/security/csp.ts)
- Components: [src/components/security/Script.tsx](../src/components/security/Script.tsx)
- Middleware: [src/middleware.ts](../src/middleware.ts)

---

**Last Updated**: 2025-12-03
**Status**: ✅ Audit Complete, Ready for Migration
**Estimated Total Time**: 4-5 hours
