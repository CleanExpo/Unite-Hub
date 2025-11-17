# Schema Validation Checklist

## Unite-Hub Schema Validation

### Pre-Deployment Validation

Before deploying to production, validate the Schema.org structured data implementation:

---

## Step 1: Local Development Test

### Start Development Server
```bash
npm run dev
```

### Access Pages to Test
1. **Homepage**: http://localhost:3008/
   - Should include: Organization, WebSite, SoftwareApplication, Service schemas

2. **Pricing Page**: http://localhost:3008/pricing
   - Should include: Product schema with 2 Offer objects (Starter + Professional)

---

## Step 2: View Source Validation

### Check Homepage Schema
```bash
# Open browser dev tools (F12)
# Go to Elements tab
# Search for: application/ld+json
# Verify JSON-LD script tag exists in <head>
```

**Expected Structure**:
```html
<head>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", ... },
        { "@type": "WebSite", ... },
        { "@type": "SoftwareApplication", ... },
        { "@type": "Service", ... }
      ]
    }
  </script>
</head>
```

### Check Pricing Page Schema
**Expected Structure**:
```html
<div>
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "offers": [
        { "name": "Starter Plan", "price": "249.00", ... },
        { "name": "Professional Plan", "price": "549.00", ... }
      ]
    }
  </script>
</div>
```

---

## Step 3: Google Rich Results Test

### Test Homepage
1. Go to: https://search.google.com/test/rich-results
2. Enter URL: `https://unite-hub.com/` (after deployment)
3. Click "Test URL"

**Expected Results**:
- ✅ Organization schema detected
- ✅ WebSite schema detected
- ✅ SoftwareApplication schema detected
- ✅ No errors
- ⚠️ Warnings acceptable (optional properties)

### Test Pricing Page
1. Go to: https://search.google.com/test/rich-results
2. Enter URL: `https://unite-hub.com/pricing` (after deployment)
3. Click "Test URL"

**Expected Results**:
- ✅ Product schema detected
- ✅ 2 Offer objects detected
- ✅ Price information visible
- ✅ No errors

---

## Step 4: Schema Markup Validator

### Validate JSON-LD Syntax

1. Go to: https://validator.schema.org/
2. Copy JSON-LD from browser dev tools
3. Paste into validator
4. Click "Run Test"

**What to Check**:
- ✅ Valid JSON syntax (no parse errors)
- ✅ All `@type` values are recognized schema.org types
- ✅ All required properties present
- ✅ URLs are absolute (not relative)
- ✅ Dates are in ISO 8601 format
- ✅ Prices are formatted correctly (e.g., "249.00" not "$249")

---

## Step 5: Google Search Console Monitoring

### After Deployment

1. Add property to Google Search Console
2. Wait 3-7 days for Google to crawl pages
3. Check "Enhancements" section
4. Monitor these reports:
   - **Unparsable structured data** (should be 0)
   - **Valid items** (should show detected schemas)
   - **Product** (should show pricing page)

---

## Common Issues & Fixes

### Issue 1: Schema Not Detected
**Symptom**: Rich Results Test shows "No structured data detected"
**Causes**:
- JSON-LD script not in page source
- JavaScript error preventing component render
- Schema wrapped in client-side only component

**Fix**:
```typescript
// ✅ CORRECT (renders on server)
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <UniteHubStructuredData />
      </head>
      <body>{children}</body>
    </html>
  );
}

// ❌ WRONG (only renders on client)
'use client';
export default function RootLayout({ children }) {
  // ...
}
```

### Issue 2: Invalid JSON Syntax
**Symptom**: "Parsing error: Unexpected token" in validator
**Causes**:
- Trailing commas in JSON
- Single quotes instead of double quotes
- Unescaped special characters

**Fix**:
```typescript
// ✅ CORRECT
const schema = {
  "@type": "Organization",
  "name": "Unite-Hub",
  "description": "AI-first CRM" // No trailing comma on last property
};

// ❌ WRONG
const schema = {
  '@type': 'Organization', // Single quotes
  'name': 'Unite-Hub',
  'description': 'AI-first CRM', // Trailing comma
};
```

### Issue 3: Relative URLs
**Symptom**: Warning about relative URLs
**Causes**:
- Using `/logos/logo.png` instead of full URL
- Missing protocol (`https://`)

**Fix**:
```typescript
// ✅ CORRECT
"logo": "https://unite-hub.com/logos/unite-hub-logo.png"

// ❌ WRONG
"logo": "/logos/unite-hub-logo.png"
```

### Issue 4: Price Format Errors
**Symptom**: Price not detected in Product schema
**Causes**:
- Including currency symbol in price value
- Using comma as decimal separator
- Missing .00 for whole numbers

**Fix**:
```typescript
// ✅ CORRECT
"price": "249.00",
"priceCurrency": "AUD"

// ❌ WRONG
"price": "$249", // Don't include currency symbol
"price": "249,00", // Use period not comma
"price": "249" // Include .00
```

---

## Verification Checklist

### Before Git Commit
- [ ] Schema component renders without errors (check browser console)
- [ ] JSON-LD script visible in page source (view source)
- [ ] No JavaScript errors in dev tools console
- [ ] All URLs are absolute (not relative)
- [ ] All required @type properties present

### Before Deployment
- [ ] Tested with Google Rich Results Test
- [ ] Tested with Schema.org validator
- [ ] No errors in validation tools
- [ ] Resolved all critical warnings
- [ ] Verified schema appears on all intended pages

### After Deployment
- [ ] Re-test with production URLs
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor Search Console for schema errors
- [ ] Check back in 7-14 days for rich results appearance

---

## Schema Monitoring

### Weekly Checks (First Month)
1. Google Search Console → Enhancements
2. Check for new "Unparsable structured data" errors
3. Verify "Valid items" count matches expected pages

### Monthly Checks (Ongoing)
1. Re-validate with Rich Results Test
2. Check for schema.org updates to standards
3. Update schema if new properties recommended

---

## Performance Impact

### Expected Impact
- **Page Load Time**: +0-5ms (JSON-LD is lightweight)
- **HTML Size**: +2-4KB per page (negligible)
- **SEO Benefit**: 20-30% CTR increase from rich results

### Monitoring
```bash
# Check bundle size impact
npm run build

# Look for structured data in output
# Should be minimal (2-4KB total)
```

---

## Next Steps After Validation

### If All Tests Pass ✅
1. Commit changes to repository
2. Deploy to production
3. Submit sitemap to Google Search Console
4. Monitor for rich results (7-14 days)

### If Tests Fail ❌
1. Review error messages carefully
2. Check syntax with validator
3. Compare against working examples
4. Fix errors and re-test
5. Do not deploy until validation passes

---

## Resources

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Validator**: https://validator.schema.org/
- **Schema.org Documentation**: https://schema.org/
- **Google Search Console**: https://search.google.com/search-console

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
