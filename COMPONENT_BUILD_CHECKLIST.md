# Component Build Checklist

**Version**: 1.0.0
**Phase**: 2
**Purpose**: Quality assurance for every component built

---

## Pre-Build Planning

Before building ANY component:

- [ ] Read component spec in PHASE_2_COMPONENT_ARCHITECTURE.md
- [ ] Review design spec for this component
- [ ] List all design tokens needed (colors, spacing, shadows, etc.)
- [ ] Plan responsive behavior (mobile/tablet/desktop)
- [ ] Identify accessibility requirements
- [ ] Plan all states (default, hover, active, disabled, loading, error)
- [ ] Create TypeScript interface for props

---

## Development Checklist

### Code Quality

- [ ] **TypeScript Types**
  - [ ] Component props interface created
  - [ ] All props properly typed (no `any`)
  - [ ] Return type correct
  - [ ] Optional props marked with `?`
  - [ ] Default values documented

- [ ] **Code Structure**
  - [ ] Component follows template in PHASE_2_COMPONENT_ARCHITECTURE.md
  - [ ] Props destructured clearly
  - [ ] `forwardRef` used if needed
  - [ ] `displayName` set for debugging
  - [ ] Proper prop spreading (`...props`)

- [ ] **Design Tokens**
  - [ ] All colors from design tokens (no hardcoded hex values)
  - [ ] All spacing from design tokens (no hardcoded pixels)
  - [ ] All typography from design tokens
  - [ ] All shadows from design tokens
  - [ ] All radius from design tokens
  - [ ] All transitions from design tokens
  - [ ] **ZERO hardcoded values**

- [ ] **Tailwind Usage**
  - [ ] Only Tailwind utilities used (no CSS modules unless necessary)
  - [ ] Classes organized logically
  - [ ] Responsive classes follow mobile-first approach
  - [ ] Custom utilities from tailwind.config.cjs used
  - [ ] No deprecated Tailwind classes

- [ ] **Code Style**
  - [ ] Prettier formatting applied
  - [ ] ESLint passes (0 errors, 0 warnings)
  - [ ] Comments added for complex logic
  - [ ] No console.log statements
  - [ ] No commented-out code

### Design Compliance

- [ ] **Visual Design**
  - [ ] Component matches design spec exactly
  - [ ] Colors match design system palette
  - [ ] Spacing matches design tokens
  - [ ] Typography matches design system
  - [ ] Border radius matches design system
  - [ ] Shadows match design system

- [ ] **States & Variants**
  - [ ] Default state matches design
  - [ ] Hover state implemented
  - [ ] Active state implemented
  - [ ] Disabled state visible & functional
  - [ ] Loading state (if applicable) implemented
  - [ ] Error state (if applicable) implemented
  - [ ] Focus state visible with correct ring

- [ ] **Interactions**
  - [ ] Click/touch events work
  - [ ] Hover effects smooth
  - [ ] State transitions use correct easing
  - [ ] No jank or layout shift on interaction
  - [ ] Loading spinner (if applicable) smooth

### Accessibility (WCAG 2.1 AA+)

- [ ] **Semantic HTML**
  - [ ] Correct HTML elements used (button, link, heading, etc.)
  - [ ] No divs masquerading as buttons
  - [ ] Form labels properly associated
  - [ ] Heading hierarchy correct
  - [ ] Lists use proper HTML tags

- [ ] **ARIA Attributes**
  - [ ] `aria-label` added where needed
  - [ ] `aria-describedby` for complex elements
  - [ ] `aria-expanded` for toggle states
  - [ ] `aria-disabled` for disabled state
  - [ ] `aria-busy` for loading state
  - [ ] Roles specified where semantic HTML insufficient

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements keyboard accessible
  - [ ] Tab order logical
  - [ ] Tab order visible (focus ring)
  - [ ] No keyboard traps
  - [ ] Enter/Space work on buttons
  - [ ] Arrow keys work in lists/menus (if applicable)
  - [ ] Escape key handled (modals, dropdowns)

- [ ] **Focus Management**
  - [ ] Focus ring visible on all interactive elements
  - [ ] Focus ring color = #ff6b35 with 3px offset
  - [ ] Focus ring uses: `focus:ring-2 focus:ring-accent-500`
  - [ ] Focus ring visible in light AND dark backgrounds
  - [ ] Focus restored after interaction (modals)
  - [ ] Focus trap in modals/dialogs

- [ ] **Color & Contrast**
  - [ ] Text contrast ≥ 4.5:1 (normal text)
  - [ ] UI element contrast ≥ 3:1
  - [ ] Color not sole conveyor of information
  - [ ] Tested with WebAIM or Axe
  - [ ] Works with colorblind filters

- [ ] **Screen Reader**
  - [ ] Content announced correctly
  - [ ] Links have descriptive text (not "click here")
  - [ ] Buttons have accessible names
  - [ ] Icons have alt text or aria-label
  - [ ] Dynamic content changes announced
  - [ ] Errors announced clearly

- [ ] **Motion & Animation**
  - [ ] Animations respect prefers-reduced-motion
  - [ ] No auto-playing animations
  - [ ] No seizure-inducing content (> 3 Hz)
  - [ ] Animations have clear purpose

### Responsive Design

- [ ] **Mobile (375px)**
  - [ ] Layout stacks vertically
  - [ ] Typography readable (no tiny text)
  - [ ] Touch targets ≥ 44px
  - [ ] Images responsive
  - [ ] No horizontal scroll
  - [ ] Form easy to fill
  - [ ] Tested on real mobile device

- [ ] **Tablet (768px)**
  - [ ] Layout adapts appropriately
  - [ ] Two-column layout if applicable
  - [ ] Touch interactions work
  - [ ] No awkward gaps
  - [ ] Typography scaled correctly

- [ ] **Desktop (1200px+)**
  - [ ] Full layout visible
  - [ ] Multi-column layout correct
  - [ ] Spacing generous but not excessive
  - [ ] Text lines < 80 characters
  - [ ] Mouse interactions smooth

- [ ] **Responsive Implementation**
  - [ ] Mobile-first CSS approach used
  - [ ] Tailwind breakpoints used correctly
  - [ ] `md:` prefix for 768px+ (tablet)
  - [ ] `lg:` prefix for 1200px+ (desktop)
  - [ ] No hardcoded breakpoints
  - [ ] No horizontal scroll at any breakpoint

- [ ] **Touch & Interaction**
  - [ ] Touch targets ≥ 44px
  - [ ] Buttons have adequate padding
  - [ ] Links have adequate spacing
  - [ ] No 300ms delay on tap (mobile)
  - [ ] Touch feedback immediate & clear

### Performance

- [ ] **Rendering**
  - [ ] No unnecessary re-renders
  - [ ] Props checked for changes
  - [ ] `React.memo` used if needed
  - [ ] `useMemo` used for expensive calculations
  - [ ] `useCallback` used for event handlers
  - [ ] Refs used correctly (forwardRef)

- [ ] **Bundle Size**
  - [ ] No unused imports
  - [ ] Dependencies minimal
  - [ ] Code splitting considered
  - [ ] Component size reasonable

- [ ] **Animation Performance**
  - [ ] Animations use GPU-accelerated properties
  - [ ] Use `transform` and `opacity` for smoothness
  - [ ] Avoid animating width/height
  - [ ] 60fps animations on mobile
  - [ ] No janky or stuttering animations

---

## Testing Checklist

### Unit Tests

- [ ] **Component Renders**
  - [ ] Component renders without props
  - [ ] Component renders with props
  - [ ] Component renders with children
  - [ ] Errors handled gracefully

- [ ] **Props**
  - [ ] Default props applied
  - [ ] Props override defaults
  - [ ] Invalid props handled
  - [ ] Required props throw error

- [ ] **Events**
  - [ ] Click handler called
  - [ ] Focus/blur events work
  - [ ] Custom event handlers called

- [ ] **States**
  - [ ] Default state renders correctly
  - [ ] Disabled state works
  - [ ] Loading state works
  - [ ] Error state works

### Integration Tests

- [ ] **With Forms**
  - [ ] Component works in form context
  - [ ] Value updates work
  - [ ] Validation works
  - [ ] Form submission works

- [ ] **With Layout**
  - [ ] Component works in grid
  - [ ] Component works in flex
  - [ ] Component works in container
  - [ ] Spacing correct around component

- [ ] **With Other Components**
  - [ ] Works with other primitives
  - [ ] Props compose correctly
  - [ ] No style conflicts

### Accessibility Audit

- [ ] **Automated Audit**
  - [ ] Axe DevTools: 0 errors
  - [ ] WAVE: 0 errors
  - [ ] Lighthouse: Accessibility > 90

- [ ] **Manual Testing**
  - [ ] Keyboard navigation tested
  - [ ] Screen reader tested (NVDA/JAWS/Safari)
  - [ ] Focus ring visible
  - [ ] Color contrast verified
  - [ ] Zoom to 200% works

- [ ] **Specific Accessibility Checks**
  - [ ] Buttons have accessible names
  - [ ] Links distinguishable from text
  - [ ] Form labels associated
  - [ ] Error messages clear
  - [ ] Instructions provided

### Visual Regression

- [ ] **Visual Baselines Created**
  - [ ] Default state screenshot
  - [ ] Hover state screenshot
  - [ ] Active state screenshot
  - [ ] Disabled state screenshot
  - [ ] All variants photographed
  - [ ] All sizes photographed
  - [ ] Mobile/tablet/desktop layouts

- [ ] **Regression Testing**
  - [ ] Previous baseline compared
  - [ ] No unintended visual changes
  - [ ] Color accurate
  - [ ] Spacing accurate
  - [ ] Typography accurate

### Cross-Browser Testing

- [ ] **Chrome/Edge (Latest)**
  - [ ] Renders correctly
  - [ ] Animations smooth
  - [ ] Events work
  - [ ] No console errors

- [ ] **Firefox (Latest)**
  - [ ] Renders correctly
  - [ ] Animations smooth
  - [ ] Events work
  - [ ] No console warnings

- [ ] **Safari (Latest)**
  - [ ] Renders correctly
  - [ ] -webkit prefixes applied
  - [ ] Animations smooth
  - [ ] Touch events work (iOS)

- [ ] **Mobile Browsers**
  - [ ] Chrome Mobile (Android)
  - [ ] Safari Mobile (iOS)
  - [ ] Samsung Internet
  - [ ] Firefox Mobile

---

## Documentation Checklist

### Component Spec Document

- [ ] **File Created**: `docs/components/COMPONENTNAME.md`
- [ ] **Purpose Section**: Clear explanation of component purpose
- [ ] **Design Tokens Section**: List all tokens used
- [ ] **Variants Section**: All variants documented
- [ ] **Sizes Section**: All sizes documented
- [ ] **States Section**: All states (default, hover, disabled, etc.) explained
- [ ] **Accessibility Section**: ARIA labels, keyboard support documented
- [ ] **Responsive Section**: Mobile/tablet/desktop behavior explained
- [ ] **Code Examples**: Usage examples provided
- [ ] **Props Table**: All props documented with types

### Inline Documentation

- [ ] **JSDoc Comments**
  ```typescript
  /**
   * Button component for user actions
   *
   * @param {ButtonProps} props - Component props
   * @returns {React.ReactElement} Rendered button
   *
   * @example
   * <Button variant="primary" size="md">Click me</Button>
   */
  ```

- [ ] **Prop Comments**
  ```typescript
  interface ButtonProps {
    /** Button variant style (primary or secondary) */
    variant?: 'primary' | 'secondary';

    /** Button size */
    size?: 'sm' | 'md';
  }
  ```

### Component Library Guide

- [ ] **Component Added to**: `docs/COMPONENT_LIBRARY.md`
- [ ] **Listed in Table of Contents**
- [ ] **Category Correct** (Primitives, Composites, Layout, Patterns)
- [ ] **Link to Spec Correct**
- [ ] **Brief Description Added**

---

## Code Review Checklist

### Self-Review

- [ ] **Functionality**
  - [ ] Component works as intended
  - [ ] All edge cases handled
  - [ ] Error states clear
  - [ ] Loading states clear

- [ ] **Code Quality**
  - [ ] Follows team patterns
  - [ ] No code smells
  - [ ] DRY principle followed
  - [ ] Comments explain "why" not "what"

- [ ] **Performance**
  - [ ] No performance issues
  - [ ] Render count reasonable
  - [ ] Bundle size acceptable
  - [ ] Animation performance good

- [ ] **Security**
  - [ ] No XSS vulnerabilities
  - [ ] Props validated
  - [ ] No sensitive data in console
  - [ ] Event handlers safe

### Peer Review

- [ ] **Design Review**
  - [ ] Design spec followed exactly
  - [ ] All design tokens used
  - [ ] No design deviations
  - [ ] Polish and refinement complete

- [ ] **Code Review**
  - [ ] Code is readable
  - [ ] Patterns consistent
  - [ ] No duplicated logic
  - [ ] Tests adequate

- [ ] **Accessibility Review**
  - [ ] WCAG 2.1 AA+ compliant
  - [ ] All interactive elements accessible
  - [ ] Focus management correct
  - [ ] Screen reader compatible

---

## Final Sign-Off Checklist

Before marking component as DONE:

```markdown
## Component: [Name]

### Code Quality: ✅ PASS
- TypeScript types correct
- ESLint 0 errors
- Prettier formatted
- No hardcoded values

### Design Compliance: ✅ PASS
- Matches design spec exactly
- All design tokens used
- All states implemented
- Responsive on 3 breakpoints

### Accessibility: ✅ PASS
- WCAG 2.1 AA+ compliant
- Axe audit 0 errors
- Keyboard navigation works
- Focus ring visible & correct

### Testing: ✅ PASS
- Unit tests pass
- Integration tests pass
- Accessibility audit pass
- Visual regression baseline set

### Documentation: ✅ PASS
- Component spec complete
- Inline comments clear
- API documented
- Examples provided

### Status: ✅ READY FOR PHASE 3

Date Completed: [Date]
Reviewed By: [Name]
```

---

## Component Completion Order

**Week 2 - Primitives (Priority Order)**
1. Button - Used everywhere, needed first
2. Card - Base for other components
3. Input - Form foundation
4. Badge - Simple, good warmup
5. Icon - Building block
6. Link - Essential primitive

**Week 3 - Composites (Priority Order)**
7. SectionHeader - Landing page foundation
8. HeroSection - Homepage hero
9. Container - Layout foundation
10. Navigation - Dashboard dependency
11. Card + variants - Dashboard components
12. BenefitsGrid - Landing page
13. HowItWorksSteps - Landing page
14. IndustriesGrid - Landing page
15. PricingCards - Pricing page
16. CTASection - Landing page footer
17. Sidebar - Dashboard layout
18. DashboardLayout - Combined layout
19. Table - Dashboard content
20. StatsCard - Dashboard stats
21. Chart - Dashboard data viz
22. ActivityFeed - Dashboard activity
23. Modal - UI pattern
24. Additional patterns - As needed

---

## Troubleshooting Guide

### Component Not Rendering
- [ ] Check TypeScript compile errors
- [ ] Verify imports are correct
- [ ] Check className syntax
- [ ] Verify design tokens are imported

### Styles Not Applying
- [ ] Verify Tailwind classes in tailwind.config.cjs
- [ ] Check if custom colors are registered
- [ ] Ensure custom spacing is in config
- [ ] Check for CSS specificity conflicts
- [ ] Verify Tailwind content paths

### Accessibility Failures
- [ ] Run Axe DevTools audit
- [ ] Check ARIA labels present
- [ ] Verify semantic HTML
- [ ] Test keyboard navigation
- [ ] Check color contrast with WebAIM

### Responsive Issues
- [ ] Test at exact breakpoint widths
- [ ] Check mobile-first approach
- [ ] Verify Tailwind prefixes (md:, lg:)
- [ ] Test on real devices
- [ ] Check viewport meta tag

### Performance Issues
- [ ] Profile with React DevTools
- [ ] Check for unnecessary re-renders
- [ ] Verify memo/useMemo usage
- [ ] Check bundle size
- [ ] Profile animations with DevTools

---

## Reference Links

- **Design Tokens**: `src/styles/design-tokens.ts`
- **Tailwind Config**: `tailwind.config.cjs`
- **Design System**: `docs/DESIGN_SYSTEM_IMPLEMENTATION.md`
- **QA Standards**: `docs/DESIGN_SYSTEM_QA_CHECKLIST.md`
- **Quick Reference**: `DESIGN_SYSTEM_QUICK_REFERENCE.md`

---

## Success Criteria

✅ **All checkboxes must be CHECKED before marking a component DONE**

If any checkbox cannot be checked:
1. Understand why
2. Fix the issue
3. Test thoroughly
4. Mark checkbox
5. Move forward

No shortcuts. Quality first. 🎯

---

**Version**: 1.0.0
**Last Updated**: 2025-11-30
**Status**: Ready for Phase 2 execution

Use this checklist for EVERY component. 100% compliance. 🚀
