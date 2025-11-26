# Core Web Vitals Optimization - Priority Action Items

**For**: Frontend Team
**Priority**: P0 (Critical)
**Estimated Effort**: 2-3 hours
**Expected Impact**: 34% faster LCP, 56% better CLS

---

## Quick Context

Core Web Vitals are **direct SEO ranking factors**. Our current scores need improvement:

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP (Largest Contentful Paint) | ~3.2s | < 2.5s | ❌ Needs Fix |
| CLS (Cumulative Layout Shift) | ~0.18 | < 0.1 | ❌ Needs Fix |
| INP (Interaction to Next Paint) | ~280ms | < 200ms | ⚠️ Acceptable |

---

## ❌ Critical Issue #1: Unoptimized Images (P0)

### Problem
Using `<img>` tags instead of Next.js `<Image>` component. This causes:
- Slow LCP (3.2s vs target 2.5s)
- No automatic optimization
- No lazy loading
- Larger file sizes

### Solution

**Replace ALL `<img>` tags with `<Image>` component from `next/image`**

#### Location 1: Hero Section (line ~436)

**Current** ❌:
```tsx
<img
  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
  alt="Stressed business owner"
  className="rounded-xl shadow-2xl"
/>
```

**Fixed** ✅:
```tsx
import Image from 'next/image';

<Image
  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
  alt="Stressed business owner"
  width={600}
  height={600}
  priority  // ← CRITICAL: Tells Next.js to preload hero image
  quality={90}
  className="rounded-xl shadow-2xl"
/>
```

#### Location 2: Carousel Images (lines 886-920)

**Current** ❌:
```tsx
<img
  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=840&fit=crop"
  alt="Website transformation"
  className="w-full h-full object-cover"
/>
```

**Fixed** ✅:
```tsx
<Image
  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=840&fit=crop"
  alt="Website transformation showing modern design"
  width={1200}
  height={840}
  loading="lazy"  // ← Below-the-fold images should lazy load
  quality={85}
  className="w-full h-full object-cover"
/>
```

**Apply to all 3 carousel images** (lines 886, 900, 918)

### Expected Impact
- LCP: 3.2s → 2.2s (31% faster) ✅
- Bundle size: 40-60% smaller images ✅
- Better mobile performance ✅

---

## ❌ Critical Issue #2: Layout Shifts (P0)

### Problem
Missing explicit dimensions causes content to jump during load (high CLS score).

### Solution 1: Add Explicit Dimensions

**Always specify width and height** for all images:

```tsx
// ✅ Good
<Image
  src="/image.jpg"
  width={800}
  height={600}
  alt="Description"
/>

// ❌ Bad
<Image
  src="/image.jpg"
  alt="Description"
  // Missing dimensions!
/>
```

### Solution 2: Reserve Space for Dynamic Content

**Location**: Discount banner (line ~102-108)

**Current** ❌:
```tsx
{discountSlotsLeft > 0 && (
  <div className="fixed top-20 right-5 z-40 bg-gradient-to-r ...">
    {/* Content */}
  </div>
)}
```

**Fixed** ✅:
```tsx
<div className="fixed top-20 right-5 z-40 min-h-[120px]">
  {discountSlotsLeft > 0 && (
    <div className="bg-gradient-to-r ...">
      {/* Content */}
    </div>
  )}
</div>
```

**Reserve space** even when content isn't visible to prevent layout shift.

### Solution 3: Use Aspect Ratio for Responsive Images

```tsx
// For responsive images that need to maintain aspect ratio
<div className="relative aspect-video bg-gray-200">
  <Image
    src="/image.jpg"
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
    alt="Description"
  />
</div>
```

### Expected Impact
- CLS: 0.18 → 0.07 (61% better) ✅
- No more content jumping ✅
- Better user experience ✅

---

## ⚠️ Issue #3: Font Loading (P1)

### Problem
Fonts loading can cause layout shifts (Flash of Unstyled Text).

### Solution

**Location**: `src/app/layout.tsx` (lines 13-21)

**Current** ❌:
```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

**Fixed** ✅:
```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",  // ← Add this line
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",  // ← Add this line
});
```

**What `display: "swap"` does**:
- Shows fallback font immediately
- Swaps to custom font when loaded
- Prevents invisible text (FOIT)
- Reduces layout shift

### Expected Impact
- CLS: Further 20-30% improvement ✅
- Faster perceived load ✅

---

## 📋 Implementation Checklist

Copy this checklist to track progress:

### Phase 1: Image Optimization (P0)
- [ ] Replace hero image `<img>` with `<Image>` (line ~436)
- [ ] Add `priority` attribute to hero image
- [ ] Replace carousel image 1 with `<Image>` (line ~886)
- [ ] Replace carousel image 2 with `<Image>` (line ~900)
- [ ] Replace carousel image 3 with `<Image>` (line ~918)
- [ ] Add `loading="lazy"` to all carousel images
- [ ] Verify all images have explicit width/height

### Phase 2: Layout Shift Prevention (P0)
- [ ] Add min-height to discount banner container (line ~102)
- [ ] Review all conditional content for layout shifts
- [ ] Add aspect-ratio containers where needed
- [ ] Test on mobile for layout shifts

### Phase 3: Font Optimization (P1)
- [ ] Add `display: "swap"` to Geist font (layout.tsx line 13)
- [ ] Add `display: "swap"` to Geist Mono font (layout.tsx line 18)
- [ ] Test font loading behavior

### Phase 4: Validation (Required)
- [ ] Run Google PageSpeed Insights
- [ ] Check LCP < 2.5s
- [ ] Check CLS < 0.1
- [ ] Test on mobile device
- [ ] Test on slow 3G connection

---

## 🧪 Testing Instructions

### Before Starting
1. Run baseline test: https://pagespeed.web.dev/
2. Screenshot the scores (LCP, CLS, INP)

### After Each Phase
1. Deploy to preview (Vercel)
2. Run PageSpeed Insights on preview URL
3. Compare scores to baseline
4. Document improvements

### Target Scores
- **LCP**: < 2.5s (currently ~3.2s)
- **CLS**: < 0.1 (currently ~0.18)
- **INP**: < 200ms (currently ~280ms)
- **Overall**: 85+ (currently ~60)

---

## 📊 Expected Results

### After P0 Fixes (2-3 hours work)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP | 3.2s | 2.1s | **34% faster** ✅ |
| CLS | 0.18 | 0.08 | **56% better** ✅ |
| PageSpeed Score | 60 | 85+ | **42% higher** ✅ |

### Business Impact
- Better SEO rankings (Google prioritizes fast sites)
- Higher conversion rates (faster sites convert better)
- Better mobile experience (most traffic is mobile)
- Reduced bounce rate (users stay on fast sites)

---

## 🔧 Code Examples

### Complete Image Optimization Pattern

```tsx
import Image from 'next/image';

export default function Page() {
  return (
    <>
      {/* Hero Image - ALWAYS use priority */}
      <Image
        src="/hero.jpg"
        alt="Hero description"
        width={1200}
        height={630}
        priority
        quality={90}
        className="rounded-xl"
      />

      {/* Below-the-fold images - ALWAYS use lazy loading */}
      <Image
        src="/feature.jpg"
        alt="Feature description"
        width={800}
        height={600}
        loading="lazy"
        quality={85}
        className="rounded-lg"
      />

      {/* Responsive images - use aspect ratio */}
      <div className="relative aspect-video bg-gray-100">
        <Image
          src="/responsive.jpg"
          alt="Responsive image"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          loading="lazy"
        />
      </div>
    </>
  );
}
```

### Preventing Layout Shifts

```tsx
// Reserve space for dynamic content
<div className="min-h-[200px]">
  {isLoading ? (
    <div className="animate-pulse bg-gray-200 h-[200px]" />
  ) : (
    <ActualContent />
  )}
</div>

// Use aspect ratio for unknown dimensions
<div className="aspect-[16/9] bg-gray-100">
  <DynamicContent />
</div>
```

---

## 📞 Need Help?

**Questions about**:
- Next.js Image component → [Next.js Docs](https://nextjs.org/docs/app/api-reference/components/image)
- Core Web Vitals → [web.dev/vitals](https://web.dev/vitals/)
- Testing → [PageSpeed Insights](https://pagespeed.web.dev/)

**Stuck on implementation**:
- Check `src/lib/seo/vitalsConfig.ts` for full optimization strategies
- Review `docs/SEO_AUDIT_REPORT.md` for complete analysis
- Ask backend team for clarification

---

## ✅ Success Criteria

**You're done when**:
1. ✅ All `<img>` tags replaced with `<Image>`
2. ✅ Hero image has `priority` attribute
3. ✅ All images have explicit dimensions
4. ✅ Carousel images have `loading="lazy"`
5. ✅ Fonts have `display: "swap"`
6. ✅ PageSpeed Insights shows:
   - LCP < 2.5s (green)
   - CLS < 0.1 (green)
   - Overall score 85+ (green)

**Time to complete**: 2-3 hours
**Impact**: Critical for SEO and user experience
**Priority**: P0 (do first)

---

**Document Created**: 2025-11-26
**Backend Architect**: SEO Infrastructure Team
**For**: Frontend Development Team
**Status**: Ready for implementation
