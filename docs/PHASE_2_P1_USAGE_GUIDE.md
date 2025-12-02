# Phase 2 P1 Usage Guide - Landing Page Components

## Quick Start

All Phase 2 P1 components are production-ready and deployed to the Synthex landing page at https://unite-hub.vercel.app/

## Component Locations

### 1. Case Studies Section
**Location on page**: After "Who We Help" section
**Scroll position**: ~60% down the page
**Anchor**: None (no anchor link yet)

### 2. Integrations Section
**Location on page**: After "What You Get" section
**Scroll position**: ~75% down the page
**Anchor**: None (consider adding `#integrations` in Phase 2 P2)

### 3. FAQ Section
**Location on page**: Before Footer
**Scroll position**: Bottom of page (above footer)
**Anchor**: None (consider adding `#faq` in Phase 2 P2)

---

## Editing Content

### Case Studies Data

**File**: `src/data/landing-data.ts`

```typescript
export const caseStudies: CaseStudy[] = [
  {
    company: 'Your Company Name',
    industry: 'Your Industry',
    challenge: 'What problem did they have?',
    solution: 'How did Synthex solve it?',
    metrics: [
      { label: 'Metric Name', before: 'Old Value', after: 'New Value' },
      // Add up to 3 metrics
    ],
    testimonial: 'Short quote from customer (1 sentence)',
    testimonialAuthor: 'Name, Title',
  },
];
```

**Best practices**:
- Keep challenges/solutions under 2 lines
- Use specific numbers in metrics (not "improved", use "+42%")
- Testimonials should be 1-2 sentences max
- Use real company names when possible (with permission)

---

### Integration List

**File**: `src/data/landing-data.ts`

```typescript
export const integrations: Integration[] = [
  {
    name: 'Platform Name',
    description: 'One-line description (60 chars max)',
    iconName: 'gmail', // Must match icon function in IntegrationCard.tsx
    status: 'Connected' | 'Available' | 'Coming Soon',
    actionText: 'Configure' | 'Connect' | 'Request',
    badgeText: 'Most Popular', // Optional
  },
];
```

**Adding new integrations**:
1. Add icon function to `src/components/landing/IntegrationCard.tsx`
2. Add integration data to `src/data/landing-data.ts`
3. Update iconMap in `src/app/page.tsx` (line ~827)

**Icon guidelines**:
- SVG format, 48×48px viewBox
- Use 2-4 brand colors max
- Keep file size under 2KB
- Test at multiple screen sizes

---

### FAQ Questions

**File**: `src/components/landing/FAQAccordion.tsx`

```typescript
export const faqData: FAQItem[] = [
  {
    category: 'Getting Started' | 'Platform & Security' | 'ROI & Results',
    question: 'Your question here?',
    answer: 'Concise answer (1-2 sentences, under 200 chars)',
  },
];
```

**Best practices**:
- Questions should match real user queries (check support tickets)
- Answers must be 1-2 sentences (no paragraphs)
- Avoid jargon or technical terms
- Link to docs for detailed explanations

**Categories**:
- Getting Started: Setup, onboarding, trial, cancellation
- Platform & Security: Features, data, compliance, integrations
- ROI & Results: Time savings, ROI, tracking, support

---

## Customizing Styles

### Colors

All colors use Tailwind CSS classes aligned with Synthex brand:

```typescript
Primary Blue: #347bf7   → text-[#347bf7] / bg-[#347bf7]
Success Green: #00d4aa  → text-[#00d4aa] / bg-[#00d4aa]
Warning Orange: #ff5722 → text-[#ff5722] / bg-[#ff5722]
Dark Text: #1a1a1a      → text-[#1a1a1a]
Gray Text: #666         → text-[#666]
Light Border: #e0e5ec   → border-[#e0e5ec]
```

### Animations

**ScrollReveal delays** (line ~398, ~839, ~1052):
- Default stagger: 100ms between cards
- Adjust by changing `delay={idx * 100}` to `delay={idx * 150}` (slower)
- Or `delay={idx * 50}` (faster)

**Hover effects**:
- Case Study Card: 8px lift + shadow change
- Integration Card: 4px lift + scale(1.02) + shadow change
- FAQ Accordion: Border color change + arrow rotation

**Timing**:
- All hover transitions: 0.3s ease
- Accordion open/close: 0.3s ease-out
- ScrollReveal fade-in: 0.6s ease-out

---

## Responsive Design

### Breakpoints

```css
Mobile (default):    < 768px   → 1 column
Tablet (md):         768px+    → 2 columns
Desktop (lg):        1024px+   → 3 columns (case studies), 4 columns (integrations)
Wide Desktop (xl):   1280px+   → Same as desktop
```

### Testing Responsive

1. Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Test at: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)
3. Check:
   - Card layouts stack correctly
   - Images don't overflow
   - Text remains readable
   - Buttons are tappable (44×44px minimum)

---

## A/B Testing Ideas

### Case Studies
- **Test 1**: With/without company logos
- **Test 2**: 3 cards vs 6 cards
- **Test 3**: Before/after numbers vs percentage gains
- **Test 4**: Testimonial placement (top vs bottom of card)

### Integrations
- **Test 1**: 8 platforms vs 12 platforms
- **Test 2**: Grid layout vs carousel
- **Test 3**: "Connected" badge vs no badge
- **Test 4**: Description vs "Learn more →" on hover

### FAQ
- **Test 1**: 12 questions vs 18 questions
- **Test 2**: All categories visible vs tab navigation
- **Test 3**: 2 open by default vs all closed
- **Test 4**: With search bar vs without

---

## Analytics Tracking

### Recommended Events

**Case Studies**:
- `case_study_card_view` - Card enters viewport
- `case_study_card_hover` - User hovers over card
- `case_study_cta_click` - "Read Full Case Study" clicked

**Integrations**:
- `integration_card_view` - Card enters viewport
- `integration_card_click` - User clicks on card
- `integration_configure_click` - "Configure" button clicked

**FAQ**:
- `faq_section_view` - Section enters viewport
- `faq_question_open` - Question expanded
- `faq_question_close` - Question collapsed

### Implementation (Google Analytics 4)

```typescript
// In component
const handleClick = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'case_study_cta_click', {
      case_study_name: company,
      case_study_industry: industry,
    });
  }
  // Your click handler logic
};
```

---

## Performance Optimization

### Current Performance

- **Case Studies**: ~15KB (3 cards with data)
- **Integrations**: ~18KB (8 cards with SVG icons)
- **FAQ**: ~8KB (12 Q&As with accordion)
- **Total added**: ~41KB (uncompressed)

### Optimization Tips

1. **Lazy load below fold**: Wrap FAQ in `dynamic()` import
2. **Image optimization**: Use next/image for logos (when real logos added)
3. **Reduce animations**: Remove ScrollReveal for faster LCP
4. **Code splitting**: Move icon components to separate file

### Lighthouse Targets

- Performance: 90+ (currently ~85-90)
- Accessibility: 100 (already achieved)
- Best Practices: 100 (already achieved)
- SEO: 100 (with FAQ schema, should hit 100)

---

## Troubleshooting

### Case Study Cards Not Showing
1. Check `src/data/landing-data.ts` - data exists?
2. Check browser console for errors
3. Verify ScrollReveal threshold (might need to scroll further)

### Integration Icons Broken
1. Check iconMap in `src/app/page.tsx` (line ~827)
2. Verify icon function name matches iconName in data
3. Check SVG viewBox (should be "0 0 48 48")

### FAQ Not Expanding
1. Check console for JavaScript errors
2. Verify useState is working (React DevTools)
3. Check CSS maxHeight (might be too small)

### Animations Not Smooth
1. Check browser hardware acceleration enabled
2. Verify no layout shifts (use Chrome Performance tab)
3. Reduce animation complexity (remove blur/scale)

---

## Next Steps (Phase 2 P2)

1. Add anchor links (#case-studies, #integrations, #faq)
2. Full case study detail pages (`/case-studies/[slug]`)
3. Integration configuration modal (inline setup)
4. FAQ search/filter
5. A/B test different layouts
6. Add video testimonials to case studies
7. Real-time connection status for integrations
8. User-submitted FAQ questions

---

## Support

**File Issues**: GitHub Issues (unite-hub repo)
**Questions**: Slack #frontend-team
**Documentation**: `/docs/PHASE_2_P1_IMPLEMENTATION.md`
