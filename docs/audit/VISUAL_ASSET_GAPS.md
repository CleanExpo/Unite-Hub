# Visual Asset Gaps Report

**Generated**: 2025-11-28
**Status**: WARNING - Missing Production Assets

---

## Summary

This report identifies visual assets present and missing from the production build.

### Asset Inventory

| Category | Present | Required | Gap |
|----------|---------|----------|-----|
| Favicons | 5 | 5 | 0 |
| Logos | 3 | 5 | 2 |
| OG Images | 0 | 8 | 8 |
| Marketing Images | 0 | 10+ | 10+ |
| Demo Screenshots | 0 | 5 | 5 |
| Hero Images | 0 | 3 | 3 |

---

## Present Assets

### Favicons (Complete)

Location: `public/`

| File | Size | Status |
|------|------|--------|
| `favicon.png` | Present | OK |
| `favicon-16x16.png` | Present | OK |
| `favicon-32x32.png` | Present | OK |
| `android-chrome-192x192.png` | Present | OK |
| `android-chrome-512x512.png` | Present | OK |
| `apple-touch-icon.png` | Present | OK |

### Logos

Location: `public/logos/`

| File | Purpose | Status |
|------|---------|--------|
| `unite-hub-logo.png` | Primary logo | OK |
| `unite-hub-professional.png` | Pro tier | OK |
| `unite-hub-starter.png` | Starter tier | OK |

---

## Missing Assets (Action Required)

### 1. Open Graph Images (Critical for Social Sharing)

OG images are required for proper social media previews when links are shared.

**Required:**

| Page | Dimensions | Priority |
|------|------------|----------|
| Homepage | 1200x630 | P0 |
| Pricing | 1200x630 | P0 |
| Features | 1200x630 | P1 |
| About | 1200x630 | P1 |
| Blog posts | 1200x630 | P2 |
| Dashboard | 1200x630 | P2 |
| Login | 1200x630 | P3 |
| Onboarding | 1200x630 | P3 |

**File naming convention:**
```
public/og/
├── og-home.png
├── og-pricing.png
├── og-features.png
├── og-about.png
├── og-blog.png
├── og-dashboard.png
├── og-login.png
└── og-onboarding.png
```

### 2. Hero Images

Large background or hero section images for marketing pages.

**Required:**

| Location | Description | Dimensions |
|----------|-------------|------------|
| Homepage | Hero background | 1920x1080 |
| Pricing | Plans comparison | 1200x800 |
| Features | Feature showcase | 1200x800 |

### 3. Product Screenshots

For marketing and documentation purposes.

**Required:**

| Screenshot | Purpose | Dimensions |
|------------|---------|------------|
| Dashboard overview | Marketing | 1440x900 |
| Contact management | Marketing | 1440x900 |
| Campaign builder | Marketing | 1440x900 |
| AI insights panel | Marketing | 1440x900 |
| Mobile responsive | Marketing | 390x844 |

### 4. Tier/Plan Images

Visual representations for pricing tiers.

**Required:**

| Tier | Description | Status |
|------|-------------|--------|
| Starter | Basic tier visual | Missing |
| Professional | Pro tier visual | Present (logo only) |
| Elite | Elite tier visual | Missing |

### 5. Placeholder Images

For user-generated content areas.

**Required:**

| Image | Purpose | Dimensions |
|-------|---------|------------|
| Avatar placeholder | User profiles | 128x128 |
| Company logo placeholder | Organizations | 200x200 |
| Campaign image placeholder | Email campaigns | 600x400 |

---

## SEO Configuration Analysis

From `src/lib/seo/buildPageMetadata.ts`:

```typescript
// OG Image fallback
const ogImage = pageConfig?.og?.image || siteConfig.image;
```

The system has a fallback mechanism, but no images are configured in `seoConfig.ts`.

### Current SEO Config Check

The `seoConfig.ts` likely defines:
- `siteConfig.image` - Default OG image
- `pageConfig.og.image` - Page-specific OG images

**Action**: Verify these are pointing to actual files.

---

## Three.js Visual Components

The following Three.js components exist but need visual assets:

### Components Present

| Component | File | Purpose |
|-----------|------|---------|
| ThreeCanvas | `src/components/three/ThreeCanvas.tsx` | 3D rendering container |
| RotatingCard3D | `src/components/three/RotatingCard3D.tsx` | 3D card effect |
| BackgroundEffects | `src/components/three/BackgroundEffects.tsx` | Animated background |

### Textures/Assets Needed

- Card face textures
- Background particle sprites
- Environment maps (for reflections)

---

## Recommendations

### Priority 0 (Before Launch)

1. **Create OG Images**
   - Use Figma/Canva to create branded OG images
   - Dimensions: 1200x630px
   - Include logo, tagline, and visual elements

2. **Update SEO Config**
   - Point `siteConfig.image` to actual OG image
   - Configure page-specific OG images

### Priority 1 (First Week)

1. **Create Hero Images**
   - Commission or generate hero backgrounds
   - Optimize for web (WebP format preferred)

2. **Take Product Screenshots**
   - Use actual product for screenshots
   - Ensure clean, professional appearance

### Priority 2 (First Month)

1. **Implement Placeholder System**
   - Create branded placeholder images
   - Use for empty states and loading

2. **Three.js Assets**
   - Add textures for 3D components
   - Consider using procedural generation

---

## Tools for Asset Creation

### Recommended Tools

| Tool | Purpose | Cost |
|------|---------|------|
| Figma | OG images, logos | Free tier available |
| Canva | Marketing images | Free tier available |
| Unsplash | Stock photos | Free |
| Blush.design | Illustrations | Free/Paid |
| DALL-E | AI-generated images | API cost |

### Optimization Tools

| Tool | Purpose |
|------|---------|
| TinyPNG | PNG compression |
| Squoosh | WebP conversion |
| ImageOptim | General optimization |

---

## Implementation Checklist

- [ ] Create `public/og/` directory
- [ ] Design and export OG images
- [ ] Create `public/heroes/` directory
- [ ] Design hero backgrounds
- [ ] Create `public/screenshots/` directory
- [ ] Take product screenshots
- [ ] Create `public/placeholders/` directory
- [ ] Design placeholder images
- [ ] Update `seoConfig.ts` with image paths
- [ ] Test OG images with Facebook Debugger
- [ ] Test OG images with Twitter Card Validator

---

*Visual audit completed: 2025-11-28*
