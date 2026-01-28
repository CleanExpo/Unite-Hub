# Bundle Size Optimization & CDN Setup Plan

**Task**: UNI-104
**Priority**: P1 (Pre-Launch Essential)
**Estimate**: 8 hours
**Status**: In Progress
**Date**: 2026-01-28

---

## Executive Summary

Analyze and optimize production bundle size for Unite-Hub. Currently building 644 static pages. Target: Initial page load < 2 seconds, Lighthouse performance score > 90.

### Optimization Goals

- **Bundle Size**: Reduce initial bundle by 40%+
- **Page Load**: < 2 seconds for initial page load
- **Lighthouse Score**: > 90 for performance
- **First Content Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s

---

## Phase 1: Analysis & Baseline

### Current Build Status

**Build Stats** (from production build):
- **Total Static Pages**: 644 pages
- **Build Time**: ~74 seconds (compilation)
- **Next.js Version**: 16.0.3 (Turbopack)

**Heavy Dependencies Identified**:
1. **Reactflow** (~300KB) - Used in 17 files
   - Campaign builder (9 nodes)
   - Mindmap components (8 nodes)

2. **Framer-motion** (~100KB) - Used in 25 files
   - Visual components
   - SEO panels
   - Animation registry

3. **Recharts** (Listed in optimizePackageImports but no direct imports found)

4. **Other Large Dependencies**:
   - Anthropic SDK
   - Supabase client
   - Lucide React icons

### Current Optimizations (Already in Place)

✅ **Next.js Config Optimizations**:
- `optimizeCss: true`
- `compress: true`
- `optimizePackageImports` for 8 packages
- Webpack split chunks configuration
- Standalone output for Docker
- Sentry source map optimization

✅ **Image Optimizations**:
- Next.js Image component
- Quality settings: [75, 85]
- Remote patterns configured

✅ **Build Optimizations**:
- TypeScript transpilation
- SWC minification (default in Next.js 16)
- Module IDs: deterministic
- Runtime chunk: single
- Vendor chunk splitting

### Optimization Opportunities

🔴 **Critical** (High Impact, Quick Win):
1. Dynamic imports for heavy libraries (Reactflow, Framer-motion)
2. Code splitting by route
3. Remove unused dependencies

🟡 **Medium** (Moderate Impact):
4. Image optimization (WebP conversion)
5. Font optimization
6. Tree-shaking improvements

🟢 **Nice to Have** (Low Impact):
7. CSS purging
8. Inline critical CSS
9. Preload/prefetch optimization

---

## Phase 2: Dynamic Imports Implementation

### 2.1 Reactflow Components (17 files)

**Current State**: Static imports in all components
**Target**: Dynamic imports with loading states
**Expected Savings**: ~250-300KB from initial bundle

**Implementation Strategy**:

#### A. Campaign Builder Pages

Create wrapper component with dynamic import:

```typescript
// src/components/campaigns/builder/CampaignBuilderDynamic.tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CampaignBuilderClient = dynamic(
  () => import('./CampaignBuilderClient'),
  {
    loading: () => (
      <div className="h-screen w-full">
        <Skeleton className="h-full w-full" />
      </div>
    ),
    ssr: false, // Reactflow doesn't need SSR
  }
);

export default CampaignBuilderClient;
```

**Files to Update**:
- `src/components/campaigns/builder/nodes/*.tsx` (9 files)
- Move all nodes into a single client component
- Import dynamically in page component

#### B. Mindmap Components

Same pattern for mindmap:

```typescript
// src/components/mindmap/MindMapDynamic.tsx
import dynamic from 'next/dynamic';

const MindMapClient = dynamic(
  () => import('./MindMapClient'),
  {
    loading: () => <MindMapSkeleton />,
    ssr: false,
  }
);
```

**Files to Update**:
- `src/components/mindmap/nodes/*.tsx` (8 files)
- `src/components/mindmap/edges/CustomEdge.tsx`
- `src/components/mindmap/MindMapNode.tsx`

**Total Files to Refactor**: 17 files → 2 dynamic wrapper components

---

### 2.2 Framer-motion Components (25 files)

**Current State**: Direct imports throughout
**Target**: Lazy-loaded for non-critical animations
**Expected Savings**: ~80-100KB from initial bundle

**Implementation Strategy**:

#### A. Critical Path (Keep Static)
- Navigation animations (fast)
- Page transitions (immediate)

#### B. Non-Critical (Make Dynamic)
- Visual demos (`src/app/visual-experience-engine/page.tsx`)
- Inspiration page (`src/app/inspiration/page.tsx`)
- SEO panels (below the fold)

**Example**:

```typescript
// For visual demo page
const VideoDemoPlayer = dynamic(
  () => import('@/components/visual/VideoDemoPlayer'),
  {
    loading: () => <VideoSkeleton />,
  }
);

const AnimationStyleWizard = dynamic(
  () => import('@/components/visual/AnimationStyleWizard'),
  {
    loading: () => <div>Loading wizard...</div>,
  }
);
```

**Files to Make Dynamic** (13 low-priority files):
- `src/components/visual/*` (5 files)
- `src/app/visual-experience-engine/page.tsx`
- `src/app/inspiration/page.tsx`
- `src/app/demos/page.tsx`
- `src/app/wizard/animation-style/page.tsx`
- `src/components/visualDemo/AnimationSwitcher.tsx`

**Files to Keep Static** (12 critical files):
- SEO dashboard components (above fold)
- Core animations

---

### 2.3 Other Optimization Opportunities

#### Remove Unused Dependencies

Run analysis:
```bash
npx depcheck
npx npm-check -u
```

Likely candidates for removal:
- Unused charting libraries
- Duplicate utility libraries
- Legacy dependencies

#### Bundle Analyzer Setup

Already installed. Run with:
```bash
ANALYZE=true npm run build
```

Using `next.config.analyze.mjs` (already created).

---

## Phase 3: Route-Based Code Splitting

### 3.1 App Router Optimization

Next.js 16 with Turbopack handles automatic code splitting. Verify:

**Check Route Chunks**:
```bash
ls -lh .next/static/chunks/app/
```

**Large Routes to Monitor**:
- `/dashboard/*` - Likely largest chunk
- `/visual-experience-engine` - Heavy animations
- `/campaigns/builder` - Reactflow bundle

### 3.2 Shared Component Optimization

**Identify Shared Components**:
```bash
# Components imported by multiple routes
grep -r "import.*from.*@/components" src/app --include="*.tsx" | sort | uniq -c | sort -nr | head -20
```

**Strategy**:
- Keep frequently-used small components in shared chunk
- Lazy-load large rarely-used components

---

## Phase 4: Asset Optimization

### 4.1 Image Optimization

**Current State**: Using Next.js Image component
**Improvements Needed**:

1. **Convert to WebP** (30-40% smaller):
   ```typescript
   <Image
     src="/image.jpg"
     format="webp" // Add this
     quality={75}
   />
   ```

2. **Lazy Loading** (below fold):
   ```typescript
   <Image
     loading="lazy" // Add for below-fold images
   />
   ```

3. **Blur Placeholder**:
   ```typescript
   <Image
     placeholder="blur"
     blurDataURL="data:image/..." // Generate with sharp
   />
   ```

### 4.2 Font Optimization

**Current State**: Using Google Fonts
**Optimization**:

1. Self-host fonts:
```typescript
// app/layout.tsx
import localFont from 'next/font/local';

const inter = localFont({
  src: './fonts/Inter-Variable.woff2',
  display: 'swap',
  variable: '--font-inter',
});
```

2. Subset fonts (reduce size by 70%):
   - Only include Latin characters
   - Remove unused weights

### 4.3 Icon Optimization

**Current State**: Using Lucide React (already tree-shaken with optimizePackageImports)
**Additional**:
- Verify only used icons are bundled
- Consider icon sprite for static icons

---

## Phase 5: CDN Configuration

### 5.1 Static Asset CDN

**Provider**: Use existing infrastructure (no external CDN needed)

**Options**:
1. **DigitalOcean Spaces CDN** (if using DO)
   - $5/month for 250GB
   - Global CDN included

2. **Next.js Built-in** (via hosting provider)
   - Vercel: Automatic global edge caching
   - Docker: Use reverse proxy (Nginx) with caching

### 5.2 Caching Headers

**Update** `next.config.mjs`:

```typescript
headers: async () => [
  {
    source: '/static/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
  {
    source: '/_next/static/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
  {
    source: '/_next/image',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=3600, stale-while-revalidate=86400',
      },
    ],
  },
  {
    source: '/api/:path*',
    headers: [
      {
        key: 'Cache-Control',
        value: 'no-store, must-revalidate',
      },
    ],
  },
],
```

**Caching Strategy**:
- **Static assets** (`/_next/static/*`): 1 year, immutable
- **Images** (`/_next/image`): 1 hour, stale-while-revalidate 24h
- **HTML pages**: 1 hour for static, no-cache for dynamic
- **API routes**: No caching (use Redis instead)

### 5.3 Nginx Reverse Proxy (Docker)

If using Docker deployment, add Nginx for caching:

```nginx
# nginx.conf
upstream nextjs {
    server nextjs:3008;
}

proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=nextjs_cache:10m max_size=1g inactive=60m;

server {
    listen 80;

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://nextjs;
        proxy_cache nextjs_cache;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Cache images
    location /_next/image {
        proxy_pass http://nextjs;
        proxy_cache nextjs_cache;
        proxy_cache_valid 200 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Don't cache dynamic pages
    location / {
        proxy_pass http://nextjs;
        proxy_no_cache 1;
    }
}
```

---

## Phase 6: Performance Measurement

### 6.1 Lighthouse Audit

**Run Audit**:
```bash
npm install -g lighthouse
lighthouse http://localhost:3008 --view
```

**Target Metrics**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 95

**Key Performance Metrics**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

### 6.2 Bundle Size Report

**Generate Report**:
```bash
ANALYZE=true npm run build
```

Opens interactive visualizer in browser.

**Monitor**:
- Total bundle size
- Per-route bundle size
- Vendor chunk size
- Shared chunk size

### 6.3 Real User Monitoring (RUM)

Use existing Sentry for performance monitoring:

```typescript
// Already configured in sentry config
{
  tracesSampleRate: 0.1, // 10% of requests
  // Monitor Web Vitals
}
```

Check Sentry dashboard for:
- Page load times
- FCP, LCP, CLS metrics
- Slowest routes
- Performance trends

---

## Implementation Checklist

### Phase 1: Analysis (0.5 hours)
- [x] Install bundle analyzer
- [ ] Run production build
- [ ] Generate bundle analysis report
- [ ] Document baseline metrics

### Phase 2: Dynamic Imports (3 hours)
- [ ] Create Reactflow dynamic wrapper (0.5h)
- [ ] Refactor campaign builder components (1h)
- [ ] Refactor mindmap components (1h)
- [ ] Create Framer-motion dynamic wrappers (0.5h)
- [ ] Test dynamic loading UX

### Phase 3: Asset Optimization (1.5 hours)
- [ ] Convert images to WebP (0.5h)
- [ ] Add lazy loading to below-fold images (0.5h)
- [ ] Self-host fonts (0.5h)

### Phase 4: Caching Configuration (1 hour)
- [ ] Add aggressive caching headers
- [ ] Configure Nginx caching (if Docker)
- [ ] Test caching behavior

### Phase 5: Measurement & Validation (2 hours)
- [ ] Run Lighthouse audit
- [ ] Generate bundle size report
- [ ] Compare before/after metrics
- [ ] Document improvements

### Phase 6: Documentation (1 hour)
- [ ] Document all changes
- [ ] Update deployment guide
- [ ] Create performance baseline doc

**Total Estimated Time**: 8 hours

---

## Success Criteria

### Must Have (P0)
- [ ] Initial page load < 2 seconds
- [ ] Lighthouse performance score > 90
- [ ] Bundle size reduced by 30%+
- [ ] All dynamic imports working

### Should Have (P1)
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Images optimized to WebP

### Nice to Have (P2)
- [ ] Fonts self-hosted
- [ ] CDN configured (if applicable)
- [ ] RUM dashboard set up

---

## Risks & Mitigations

### Risk 1: Dynamic Imports Break UX
**Impact**: Medium
**Likelihood**: Low
**Mitigation**: Add proper loading states, test thoroughly

### Risk 2: Caching Issues in Production
**Impact**: High
**Likelihood**: Low
**Mitigation**: Test caching headers in staging first

### Risk 3: Build Time Increases
**Impact**: Low
**Likelihood**: Medium
**Mitigation**: Use Turbopack (already enabled), parallelize builds

---

## Expected Results

### Bundle Size Reduction

**Before** (Estimated):
- Initial bundle: ~800KB gzipped
- Total JavaScript: ~2.5MB
- Largest chunk: ~500KB (dashboard)

**After** (Target):
- Initial bundle: ~500KB gzipped (-40%)
- Total JavaScript: ~2MB (-20%)
- Largest chunk: ~300KB (-40%)

### Performance Improvements

**Before** (Estimated):
- Lighthouse: 70-80
- FCP: 2-3s
- LCP: 3-4s
- TTI: 4-5s

**After** (Target):
- Lighthouse: 90+
- FCP: 1-1.5s
- LCP: 2-2.5s
- TTI: 2.5-3s

---

## Next Steps

1. Wait for current build to complete
2. Analyze bundle with `ANALYZE=true`
3. Implement dynamic imports for Reactflow
4. Implement dynamic imports for Framer-motion
5. Configure caching headers
6. Run Lighthouse audit
7. Document results

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Status**: Phase 1 In Progress
**Next Review**: After Phase 2 completion
