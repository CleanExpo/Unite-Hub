# Phase 2: Component Architecture & Build Strategy

**Status**: Planning Phase ⏳
**Branch**: `design-branch`
**Duration**: 2 weeks (Week 2-3)
**Date**: 2025-11-30
**Version**: 1.0.0

---

## 🎯 Phase 2 Goal

Build a **comprehensive, production-ready component library** (30+ components) that:
- Uses 100% design tokens (zero hardcoded values)
- Achieves WCAG 2.1 AA+ accessibility
- Supports responsive design (3 breakpoints)
- Provides consistent developer experience
- Enables fast page redesigns in Phase 3

---

## 📦 Component Inventory

### Primitives (6 components) - Week 2
```typescript
Button        // Primary/secondary, sm/md sizes
Input         // Text, textarea, error, disabled states
Badge         // 4 semantic variants
Card          // Base, hover, accent bar
Link          // Smooth underline animation
Icon          // SVG wrapper with consistent stroke
```

### Composite Sections (7 components) - Week 3
```typescript
SectionHeader    // Tag + title + description pattern
HeroSection      // Hero with CTA buttons and stats
BenefitsGrid     // 2x2 benefit cards with icons
HowItWorksSteps  // 4-step timeline
IndustriesGrid   // 3x2 industry cards
PricingCards     // 3-tier pricing with featured state
CTASection       // Call-to-action footer
```

### Layout (4 components) - Week 3
```typescript
Navigation       // Scrollable header with blur effect
Sidebar          // Collapsible side navigation
DashboardLayout  // Combined nav + sidebar + content
Container        // Max-width wrapper with padding
```

### Patterns (8+ components) - Week 3
```typescript
Table           // Sortable/filterable data table
Chart           // Bar chart with gradient
StatsCard       // Stat display with trends
ActivityFeed    // Activity list with timestamps
Modal           // Focus-trap modal with animations
Tooltip         // Hover tooltip
Tabs            // Tab navigation
Dropdown        // Dropdown menu
```

**Total: 30+ production-ready components**

---

## 🏗️ Build Strategy

### Design Token Integration (Core Principle)

**Every component uses ONLY design tokens. Zero exceptions.**

```typescript
// ✅ CORRECT: Using design tokens
export function Button() {
  return (
    <button className={`
      bg-accent-500
      text-white
      px-8 py-4
      rounded-md
      transition-all duration-normal ease-out
      hover:bg-accent-400
      focus:ring-2 focus:ring-accent-500
      shadow-button-primary
    `}>
    </button>
  );
}

// ❌ WRONG: Hardcoded values
<button style={{ backgroundColor: '#ff6b35' }} /> // NO!
<button className="bg-blue-500" /> // NO! (not in design system)
```

### Component Structure

Every component follows this structure:

```typescript
// src/components/[category]/ComponentName.tsx

import { forwardRef } from 'react';
import { designTokens } from '@/styles/design-tokens';
import styles from './ComponentName.module.css'; // Optional

export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  // ... other props
}

export const ComponentName = forwardRef<
  HTMLElement,
  ComponentNameProps
>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    // Component implementation
    return (
      <div
        ref={ref}
        className={`
          /* Design token classes from Tailwind */
          bg-card
          text-primary
          rounded-lg
          shadow-card
          transition-all duration-normal ease-out

          /* Variant styling */
          ${variant === 'primary' ? 'bg-accent-500' : 'bg-bg-card'}

          /* Size styling */
          ${size === 'sm' ? 'px-4 py-2' : 'px-8 py-4'}

          /* State styling */
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${loading ? 'animate-pulse' : ''}

          /* Custom classes */
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComponentName.displayName = 'ComponentName';

export default ComponentName;
```

### Accessibility Standards (Every Component)

Every component MUST include:

✅ **Semantic HTML**
- Use correct HTML elements (button, link, heading, etc.)
- Avoid divs masquerading as buttons

✅ **ARIA Attributes**
- ARIA labels where needed
- ARIA roles for clarity
- ARIA states (disabled, expanded, etc.)

✅ **Keyboard Navigation**
- All interactive elements keyboard accessible
- Logical tab order
- Escape key handling where needed

✅ **Focus Management**
- Visible focus ring (using design token: `focus:ring-2 focus:ring-accent-500`)
- Focus trap in modals
- Focus restoration

✅ **Color Contrast**
- 4.5:1 minimum for text
- 3:1 minimum for UI elements
- Tested with WebAIM or Axe

### Responsive Design (Every Component)

Every component supports **3 breakpoints**:

```typescript
// Mobile-first approach
<div className={`
  /* Mobile (default) */
  flex flex-col gap-2 px-4 py-2

  /* Tablet (768px+) */
  md:flex-row md:gap-4 md:px-6 md:py-4

  /* Desktop (1200px+) */
  lg:gap-8 lg:px-8 lg:py-6
`}>
```

---

## 📝 Component Specification Template

For each component, create a specification following this template:

```markdown
# ComponentName

## Purpose
[What is this component for? When is it used?]

## Design Tokens Used
- **Colors**: List all color tokens
- **Spacing**: List all spacing tokens
- **Typography**: Font sizes, weights
- **Shadows**: Which shadow tokens
- **Radius**: Border radius used
- **Transitions**: Easing and duration

## Variants
### Primary Variant
- [Description and use case]

### Secondary Variant
- [Description and use case]

## Sizes
### Small (sm)
- Padding: 10px 20px
- Font size: 14px
- Use case: [when to use]

### Medium (md)
- Padding: 14px 28px
- Font size: 15px
- Use case: [when to use]

## States
- Default
- Hover
- Active
- Disabled
- Loading (if applicable)
- Error (if applicable)

## Accessibility
- Semantic HTML: [which elements]
- ARIA Attributes: [required attributes]
- Keyboard Support: [keys supported]
- Focus Management: [how focus is handled]
- Color Contrast: [ratio verified]

## Responsive
- Mobile: [layout changes]
- Tablet: [layout changes]
- Desktop: [layout changes]

## Code Example
\`\`\`typescript
<ComponentName variant="primary" size="md" disabled={false}>
  Click Me
</ComponentName>
\`\`\`

## Related Components
- [Link to related components]
```

---

## 🗓️ Week-by-Week Schedule

### Week 2: Primitive Components

**Monday-Wednesday: Core Primitives**
- [ ] Button (primary, secondary, sm/md sizes)
- [ ] Input (text, textarea, all states)
- [ ] Badge (4 variants)
- [ ] Card (base + hover + accent bar)

**Thursday-Friday: Secondary Primitives**
- [ ] Link (smooth underline animation)
- [ ] Icon (SVG wrapper)
- [ ] Testing & refinement
- [ ] Component documentation begins

**Deliverables**:
- 6 production-ready primitives
- Component specs for each
- Accessibility verified
- Responsive tested

### Week 3: Composite & Layout Components

**Monday-Tuesday: Section Components**
- [ ] SectionHeader
- [ ] HeroSection
- [ ] BenefitsGrid
- [ ] HowItWorksSteps

**Wednesday: Grid & Pricing**
- [ ] IndustriesGrid
- [ ] PricingCards
- [ ] CTASection

**Thursday: Layout Components**
- [ ] Navigation
- [ ] Sidebar
- [ ] DashboardLayout
- [ ] Container

**Friday: Pattern & Polish**
- [ ] Table
- [ ] Chart
- [ ] StatsCard
- [ ] ActivityFeed
- [ ] Modal
- [ ] Additional patterns as needed
- [ ] Documentation completion
- [ ] Storybook setup (optional)

**Deliverables**:
- 24+ production-ready components
- Component library documentation
- Storybook integration (optional)
- All components tested & accessible

---

## 🧪 Quality Assurance Per Component

### Before marking a component as "DONE":

**Code Quality**
- [ ] TypeScript types correct
- [ ] No ESLint warnings
- [ ] Props properly documented
- [ ] displayName set for debugging

**Accessibility**
- [ ] Semantic HTML used
- [ ] ARIA attributes present where needed
- [ ] Keyboard navigation works
- [ ] Focus ring visible and correct color
- [ ] Color contrast ≥ 4.5:1

**Responsive Design**
- [ ] Mobile (375px) layout correct
- [ ] Tablet (768px) layout correct
- [ ] Desktop (1200px) layout correct
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥ 44px

**Design Tokens**
- [ ] All colors from design tokens
- [ ] All spacing from design tokens
- [ ] All typography from design tokens
- [ ] No hardcoded values
- [ ] No custom colors

**Design Compliance**
- [ ] Matches design spec exactly
- [ ] All hover states implemented
- [ ] All active states implemented
- [ ] Disabled state visible
- [ ] Loading state (if applicable)

**Testing**
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Visual regression test baseline set
- [ ] Performance acceptable

---

## 📂 File Structure After Phase 2

```
src/components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Link.tsx
│   └── Icon.tsx
│
├── sections/
│   ├── SectionHeader.tsx
│   ├── HeroSection.tsx
│   ├── BenefitsGrid.tsx
│   ├── HowItWorksSteps.tsx
│   ├── IndustriesGrid.tsx
│   ├── PricingCards.tsx
│   └── CTASection.tsx
│
├── layout/
│   ├── Navigation.tsx
│   ├── Sidebar.tsx
│   ├── DashboardLayout.tsx
│   └── Container.tsx
│
├── patterns/
│   ├── Table.tsx
│   ├── Chart.tsx
│   ├── StatsCard.tsx
│   ├── ActivityFeed.tsx
│   ├── Modal.tsx
│   ├── Tooltip.tsx
│   ├── Tabs.tsx
│   └── Dropdown.tsx
│
├── hooks/
│   ├── useMediaQuery.ts
│   ├── useClickOutside.ts
│   ├── useFocusTrap.ts
│   └── useScrollLock.ts
│
└── index.ts (barrel export)

docs/
├── COMPONENT_LIBRARY.md
├── components/
│   ├── BUTTON.md
│   ├── INPUT.md
│   ├── BADGE.md
│   ├── CARD.md
│   ├── LINK.md
│   ├── ICON.md
│   ├── SECTIONHEADER.md
│   ├── HEROSECTION.md
│   ├── ... (one per component)
│   └── STORYBOOK_SETUP.md (optional)
```

---

## 🔗 Integration Checklist

### With Design Tokens
- [ ] All components import from `@/styles/design-tokens`
- [ ] Tailwind utilities match token values exactly
- [ ] No color mismatches between design and code
- [ ] Spacing consistent across all components

### With Tailwind
- [ ] Tailwind utilities work in all components
- [ ] Custom utilities not needed
- [ ] Dark mode support (if applicable)
- [ ] Print styles (if applicable)

### With TypeScript
- [ ] All props typed
- [ ] Return types correct
- [ ] Generics used where applicable
- [ ] No `any` types

### With Accessibility
- [ ] Axe audit passes on all components
- [ ] WAVE browser extension shows no errors
- [ ] Screen reader navigation works
- [ ] Keyboard-only navigation works

### With Next.js
- [ ] Client components marked with `'use client'`
- [ ] Server components properly used
- [ ] Dynamic imports where needed
- [ ] Image optimization if applicable

---

## 🎯 Success Criteria for Phase 2

### Component Completeness
- ✅ 6/6 primitive components built
- ✅ 7/7 composite components built
- ✅ 4/4 layout components built
- ✅ 8+/8+ pattern components built
- **Total: 30+ components**

### Quality Metrics
- ✅ 100% TypeScript typed
- ✅ 0 ESLint errors/warnings
- ✅ 0 accessibility issues (WCAG AA+)
- ✅ 0 design token violations
- ✅ 100% design spec compliance

### Documentation
- ✅ Component library guide (COMPONENT_LIBRARY.md)
- ✅ Individual component specs (one per component)
- ✅ API documentation (props, types)
- ✅ Usage examples for each component
- ✅ Storybook setup (optional)

### Testing
- ✅ All components tested (unit + integration)
- ✅ Accessibility audits pass
- ✅ Responsive design verified (3 breakpoints)
- ✅ Visual regression baselines set

### Performance
- ✅ No unnecessary re-renders
- ✅ Proper memo/useMemo usage
- ✅ Event handler optimization
- ✅ Bundle size acceptable

---

## 📚 Component API Pattern

All components follow this API pattern for consistency:

```typescript
export interface BaseComponentProps {
  // Content
  children?: React.ReactNode;

  // Styling
  className?: string;

  // Behavior
  disabled?: boolean;

  // Events
  onClick?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;

  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;

  // HTML Props (via spread)
  [key: string]: any;
}
```

---

## 🚀 Phase 2 Execution Plan

### Daily Standup Template

```markdown
## Daily Update - [Date]

### Completed Today
- [Component 1] - Built & tested
- [Component 2] - Built & tested
- [Bug/Issue] - Fixed

### Working on Today
- [Component 3] - In progress
- [Testing] - QA phase

### Blockers
- [Any issues blocking progress]

### Next 24 Hours
- [Components to complete]
- [Testing planned]
```

### Component Completion Checklist

```markdown
## Component: [Name]

- [ ] Built (TypeScript, Tailwind, design tokens)
- [ ] Tested (unit + integration)
- [ ] Accessible (WCAG AA+)
- [ ] Responsive (3 breakpoints)
- [ ] Documented (spec + examples)
- [ ] Reviewed (code review + design review)
- [ ] Ready for Phase 3

Status: ✅ COMPLETE
```

---

## 🔄 Handoff to Phase 3

At the end of Phase 2, deliver:

### Deliverables
- ✅ 30+ production-ready components
- ✅ Component library documentation
- ✅ TypeScript types exported
- ✅ Tailwind utilities verified
- ✅ All accessibility standards met
- ✅ Responsive design verified

### Git Status
- Clean working directory
- All changes committed
- PR ready for review
- Changelog updated

### Documentation
- Component library guide complete
- Individual component specs (30+ documents)
- Usage examples for all components
- API reference complete

### Testing
- All components tested
- Accessibility audits passing
- Responsive design verified
- Visual regression baselines set

---

## ✅ Phase 2 Checklist

### Week 2
- [ ] Primitives planned & started
- [ ] Button component complete
- [ ] Input component complete
- [ ] Badge component complete
- [ ] Card component complete
- [ ] Link component complete
- [ ] Icon component complete
- [ ] Accessibility verified
- [ ] Documentation started

### Week 3
- [ ] Section components built (7 total)
- [ ] Layout components built (4 total)
- [ ] Pattern components built (8+ total)
- [ ] All components tested
- [ ] All accessibility audits passing
- [ ] All responsive design verified
- [ ] Documentation complete
- [ ] Ready for Phase 3

---

## 📞 Questions During Phase 2?

**Design Token Questions**
→ Reference: `src/styles/design-tokens.ts`
→ Reference: `DESIGN_SYSTEM_QUICK_REFERENCE.md`

**Component Spec Questions**
→ Reference: `docs/DESIGN_SYSTEM_IMPLEMENTATION.md`
→ Reference: Component specs (to be created)

**Accessibility Questions**
→ Reference: `docs/DESIGN_SYSTEM_QA_CHECKLIST.md`
→ Run: Axe accessibility audit

**Responsive Design Questions**
→ Reference: `docs/DESIGN_SYSTEM_QA_CHECKLIST.md`
→ Test: Mobile (375px), Tablet (768px), Desktop (1200px+)

---

## 🎉 Phase 2 Success Looks Like

After Phase 2:
- 30+ production-ready components ✅
- 100% design token integration ✅
- WCAG 2.1 AA+ compliance ✅
- 3-breakpoint responsive design ✅
- Comprehensive documentation ✅
- Ready for Phase 3 page redesigns ✅

---

**Version**: 1.0.0
**Status**: Ready to Execute
**Timeline**: 2 weeks (Week 2-3)
**Target Completion**: End of Week 3
**Next Phase**: Phase 3 - Page Redesigns

Ready to build! 🚀
