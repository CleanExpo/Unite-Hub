# Design System Agents & Skills

**Version**: 1.0.0
**Status**: In Progress
**Branch**: `design-branch`
**Last Updated**: 2025-11-30

---

## Overview

The design system implementation requires a coordinated team of specialized agents, each with specific responsibilities for different aspects of the redesign.

### Agent Hierarchy

```
Orchestrator (Design System Coordinator)
├── Design System Agent - Token & system management
├── Component Agent - Component library build
├── Page Redesign Agent - Landing & dashboard pages
├── Content Agent - Messaging & copy updates
├── QA Agent - Testing & validation
└── Documentation Agent - Docs & guides
```

---

## 1. Design System Agent

### Purpose
Maintain design tokens, Tailwind configuration, and system-wide design decisions.

### Responsibilities
- **Design Token Management**
  - Create and maintain `src/styles/design-tokens.ts`
  - Update `tailwind.config.cjs` with token values
  - Create CSS custom properties in `src/styles/globals.css`
  - Validate token values for consistency

- **Design System Documentation**
  - Create `docs/DESIGN_SYSTEM_TOKENS.md`
  - Create `docs/COLOR_PALETTE.md`
  - Create `docs/TYPOGRAPHY.md`
  - Create `docs/SPACING_SCALE.md`
  - Create `docs/SHADOWS_AND_BORDERS.md`

- **Token Testing**
  - Verify all colors meet WCAG AA contrast ratio
  - Test font sizes for readability
  - Validate spacing scale usage

### Key Files
```
src/styles/
├── design-tokens.ts        # TypeScript token definitions
├── design-tokens.css       # CSS custom properties
└── globals.css             # Global styles with design tokens

docs/
├── DESIGN_SYSTEM_TOKENS.md
├── COLOR_PALETTE.md
├── TYPOGRAPHY.md
├── SPACING_SCALE.md
└── SHADOWS_AND_BORDERS.md

tailwind.config.cjs          # Tailwind configuration
```

### Skills Required

**design-system-agent/token-management**
```markdown
# Token Management Skill

## Responsibilities
1. Create design token files with correct structure
2. Update Tailwind configuration with new tokens
3. Create CSS custom properties
4. Document all tokens with usage examples
5. Validate token consistency across files
6. Test color contrast ratios

## Tools Available
- File Read/Write
- Color contrast checker
- Token validator
- Documentation generator

## Success Criteria
- ✅ All 100+ tokens documented
- ✅ 100% WCAG AA color contrast
- ✅ Tailwind config complete
- ✅ CSS custom properties available
```

---

## 2. Component Agent

### Purpose
Build the component library aligned with the design system.

### Responsibilities
- **Primitive Components**
  - Button (primary/secondary, sm/md)
  - Input (text, textarea, focus states)
  - Badge (4 variants)
  - Card (with accent bar)
  - Link (with underline animation)
  - Icon (SVG wrapper)

- **Composite Components**
  - SectionHeader (tag + title + description)
  - HeroSection
  - BenefitsGrid
  - HowItWorksSteps
  - IndustriesGrid
  - PricingCards
  - CTASection

- **Layout Components**
  - Navigation (scrollable header)
  - Sidebar (collapsible)
  - DashboardLayout
  - Container (max-width wrapper)

- **Pattern Components**
  - Table (sortable/filterable)
  - Chart (bar chart)
  - StatsCard
  - ActivityFeed
  - Modal

### Key Files
```
src/components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Link.tsx
│   └── Icon.tsx
├── sections/
│   ├── SectionHeader.tsx
│   ├── HeroSection.tsx
│   ├── BenefitsGrid.tsx
│   ├── HowItWorksSteps.tsx
│   ├── IndustriesGrid.tsx
│   ├── PricingCards.tsx
│   └── CTASection.tsx
├── layout/
│   ├── Navigation.tsx
│   ├── Sidebar.tsx
│   ├── DashboardLayout.tsx
│   └── Container.tsx
└── patterns/
    ├── Table.tsx
    ├── Chart.tsx
    ├── StatsCard.tsx
    ├── ActivityFeed.tsx
    └── Modal.tsx
```

### Skills Required

**component-agent/primitive-components**
```markdown
# Primitive Components Skill

## Responsibilities
1. Build Button with all variants and sizes
2. Build Input with focus and error states
3. Build Badge with 4 color variants
4. Build Card with accent bar and hover
5. Build Link with smooth underline
6. Build Icon wrapper for SVGs
7. Implement accessibility attributes
8. Write TypeScript interfaces

## Tools Available
- React component creation
- TypeScript type system
- Tailwind CSS utilities
- Storybook setup

## Success Criteria
- ✅ All primitives built
- ✅ Full TypeScript typing
- ✅ Accessibility attributes
- ✅ Responsive variants
```

**component-agent/composite-components**
```markdown
# Composite Components Skill

## Responsibilities
1. Build SectionHeader pattern
2. Build landing page sections (Hero, Benefits, etc.)
3. Implement responsive grids
4. Create reusable section layouts
5. Add animations and interactions
6. Implement content slots

## Tools Available
- React composition patterns
- Grid and layout utilities
- Animation components
- Content management

## Success Criteria
- ✅ All composite components built
- ✅ Responsive on all breakpoints
- ✅ Animations smooth and performant
- ✅ Content slots flexible
```

**component-agent/layout-components**
```markdown
# Layout Components Skill

## Responsibilities
1. Build Navigation with scroll detection
2. Build collapsible Sidebar
3. Build DashboardLayout combining nav + sidebar
4. Build Container with max-width
5. Implement responsive behavior
6. Handle mobile menu toggle

## Tools Available
- React hooks for state
- useEffect for scroll detection
- Mobile-first media queries
- Accessibility patterns

## Success Criteria
- ✅ Navigation scrolls smoothly
- ✅ Sidebar collapse/expand works
- ✅ Layout responsive
- ✅ Mobile menu accessible
```

---

## 3. Page Redesign Agent

### Purpose
Redesign all pages using the component library.

### Responsibilities

**Landing Pages**
- [ ] `/` (Homepage) - Hero + Benefits + How-It-Works + Industries + Pricing
- [ ] `/pricing` - Pricing comparison page
- [ ] `/industries/:slug` - Industry-specific pages (6 industries)

**Dashboard Pages**
- [ ] `/dashboard/overview` - Stats + Charts + Activity
- [ ] `/dashboard/analytics` - Analytics dashboard
- [ ] `/dashboard/local-seo` - SEO optimization
- [ ] `/dashboard/blog-posts` - Blog management
- [ ] `/dashboard/social-media` - Social scheduling
- [ ] `/dashboard/clients` - Client management

**Auth Pages**
- [ ] `/login` - Login page
- [ ] `/auth/callback` - Auth callback
- [ ] `/404` - Not found page
- [ ] `/500` - Server error page

### Key Files
```
src/app/
├── (landing)/
│   ├── page.tsx           # Homepage
│   ├── pricing/page.tsx   # Pricing page
│   └── industries/[slug]/page.tsx
├── dashboard/
│   ├── overview/page.tsx
│   ├── analytics/page.tsx
│   ├── local-seo/page.tsx
│   ├── blog-posts/page.tsx
│   ├── social-media/page.tsx
│   └── clients/page.tsx
├── login/page.tsx
└── error pages
```

### Skills Required

**page-redesign-agent/landing-pages**
```markdown
# Landing Pages Redesign Skill

## Responsibilities
1. Redesign homepage with all sections
2. Redesign pricing page with 3-tier layout
3. Create industry-specific landing pages
4. Implement smooth scrolling
5. Add section animations
6. Optimize for mobile

## Pages
- `/` (Homepage)
- `/pricing` (Pricing page)
- `/industries/:slug` (Industry pages - 6 total)

## Success Criteria
- ✅ All pages responsive
- ✅ All design tokens applied
- ✅ Smooth animations
- ✅ Mobile optimized
- ✅ Fast load times
```

**page-redesign-agent/dashboard-pages**
```markdown
# Dashboard Pages Redesign Skill

## Responsibilities
1. Redesign dashboard overview
2. Create analytics dashboard
3. Build SEO optimization page
4. Create content management pages
5. Build client management (for agencies)
6. Implement interactive charts

## Pages
- `/dashboard/overview`
- `/dashboard/analytics`
- `/dashboard/local-seo`
- `/dashboard/blog-posts`
- `/dashboard/social-media`
- `/dashboard/clients`

## Success Criteria
- ✅ All dashboard pages redesigned
- ✅ Interactive charts working
- ✅ Tables sortable/filterable
- ✅ Real-time data updates
```

---

## 4. Content Agent

### Purpose
Update messaging to follow positive-psychology framework and ensure brand consistency.

### Responsibilities
- **Messaging Audit**
  - Identify all pain-point focused language
  - Find negative framing
  - Replace with benefit-focused copy

- **Copy Update**
  - Update all page headlines
  - Update all CTA buttons
  - Update form labels
  - Update error messages
  - Update success messages

- **Brand Consistency**
  - Ensure consistent tone across all pages
  - Validate all claims are accurate
  - Check for competitor criticism (remove)
  - Verify positive language throughout

### Key Files
```
docs/
├── MESSAGING_GUIDELINES.md
└── COPY_AUDIT_REPORT.md

src/
└── All component strings
```

### Skills Required

**content-agent/messaging-guidelines**
```markdown
# Messaging Guidelines Skill

## Responsibilities
1. Create comprehensive messaging guidelines
2. Provide before/after copy examples
3. Define positive psychology framework
4. Create messaging rules document
5. Provide editorial style guide

## Tools Available
- Messaging validator
- Copy optimizer
- A/B testing framework
- Accessibility checker

## Success Criteria
- ✅ Guidelines documented
- ✅ 100% benefit-focused copy
- ✅ No negative framing
- ✅ All claims accurate
```

---

## 5. QA Agent

### Purpose
Test and validate design compliance and accessibility.

### Responsibilities
- **Visual Testing**
  - Screenshot testing at 3 breakpoints
  - Color contrast verification
  - Typography hierarchy check
  - Spacing and alignment validation

- **Accessibility Testing**
  - WCAG 2.1 AA compliance audit
  - Keyboard navigation testing
  - Screen reader testing
  - Focus management verification

- **Responsive Testing**
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1200px+)

- **Cross-Browser Testing**
  - Chrome/Edge
  - Firefox
  - Safari
  - Mobile browsers

### Key Files
```
docs/
├── QA_CHECKLIST.md
├── ACCESSIBILITY_REPORT.md
└── RESPONSIVE_TEST_REPORT.md

scripts/
└── design-system-tests.mjs
```

### Skills Required

**qa-agent/design-compliance**
```markdown
# Design Compliance Testing Skill

## Responsibilities
1. Verify all design tokens applied correctly
2. Check color contrast ratios (WCAG AA)
3. Validate typography sizing
4. Verify spacing scale usage
5. Test responsive breakpoints
6. Screenshot testing

## Tools Available
- Accessibility auditor (Axe)
- Color contrast checker
- Responsive design tester
- Screenshot comparison

## Success Criteria
- ✅ 100% design token compliance
- ✅ All colors WCAG AA+
- ✅ Responsive on all breakpoints
- ✅ No visual regressions
```

**qa-agent/accessibility-testing**
```markdown
# Accessibility Testing Skill

## Responsibilities
1. Run automated accessibility audits
2. Manual keyboard navigation testing
3. Screen reader testing (NVDA/JAWS)
4. Focus management validation
5. ARIA label verification
6. Form accessibility check

## Tools Available
- Axe accessibility audit
- WAVE browser extension
- Screen reader testing
- Keyboard navigation test

## Success Criteria
- ✅ 0 automated accessibility issues
- ✅ All interactive elements keyboard accessible
- ✅ Screen reader compatible
- ✅ WCAG 2.1 AA+ compliant
```

---

## 6. Documentation Agent

### Purpose
Create and maintain comprehensive design system documentation.

### Responsibilities
- **System Documentation**
  - Design System overview
  - Component library guide
  - Usage examples
  - Integration guide

- **Developer Guides**
  - How to use design tokens
  - How to use components
  - Customization guide
  - Common patterns

- **Brand Guidelines**
  - Color palette documentation
  - Typography guide
  - Icon system guide
  - Motion principles

### Key Files
```
docs/
├── DESIGN_SYSTEM.md
├── COMPONENT_LIBRARY.md
├── DESIGN_TOKENS.md
├── COLOR_PALETTE.md
├── TYPOGRAPHY.md
├── MESSAGING_GUIDELINES.md
├── ICON_SYSTEM.md
├── MOTION_PRINCIPLES.md
├── ACCESSIBILITY_GUIDE.md
└── DEVELOPER_GUIDE.md
```

---

## Implementation Workflow

### Phase 1: Foundation (Week 1)
1. **Design System Agent** creates design tokens and Tailwind config
2. **Documentation Agent** documents all tokens
3. **QA Agent** validates token system

### Phase 2: Components (Week 2-3)
1. **Component Agent** builds all components
2. **Documentation Agent** creates component guide
3. **QA Agent** tests component accessibility

### Phase 3: Pages (Week 3-4)
1. **Page Redesign Agent** implements all pages using components
2. **Content Agent** updates all copy and messaging
3. **QA Agent** conducts full system testing

### Phase 4: Refinement (Week 4)
1. **QA Agent** completes accessibility audit
2. **Documentation Agent** finalizes all guides
3. **Orchestrator** prepares for production merge

---

## Success Criteria

### Design System Agent
- ✅ 100% of design tokens created and documented
- ✅ Tailwind configuration complete
- ✅ CSS custom properties available
- ✅ All tokens tested for consistency

### Component Agent
- ✅ All 30+ components built and tested
- ✅ Full TypeScript typing
- ✅ Accessibility attributes implemented
- ✅ Responsive variants for all components

### Page Redesign Agent
- ✅ All landing pages redesigned
- ✅ All dashboard pages redesigned
- ✅ All auth pages redesigned
- ✅ Responsive on all breakpoints

### Content Agent
- ✅ 100% of copy audited
- ✅ 0 negative framing instances
- ✅ 100% benefit-focused language
- ✅ All claims accurate and verifiable

### QA Agent
- ✅ 0 accessibility issues (WCAG AA+)
- ✅ 0 design violations
- ✅ 100% responsive coverage
- ✅ Cross-browser compatibility verified

### Documentation Agent
- ✅ 10+ design system guides created
- ✅ Component library documented
- ✅ Developer guides complete
- ✅ Brand guidelines comprehensive

---

## Communication Protocol

### Agent Coordination Rules
1. **No direct peer-to-peer calls** - All communication through Orchestrator
2. **State management** - Use database/files for state sharing
3. **Dependency tracking** - Document dependencies between agents
4. **Conflict resolution** - Escalate conflicts to Orchestrator
5. **Status updates** - Regular progress reports to Orchestrator

### Dependency Map
```
Design System Agent (Week 1)
    ↓
Component Agent (Week 2-3) - Depends on design tokens
    ↓
Page Redesign Agent (Week 3-4) - Depends on components
    ↓
Content Agent (Week 3-4) - Can run in parallel
    ↓
QA Agent (Week 4) - Depends on all above
    ↓
Documentation Agent (All weeks) - Runs in parallel, final review in Week 4
```

---

## Next Steps

1. **Create agent skill files** in `.claude/skills/`
2. **Update orchestrator** to route design system tasks
3. **Set up parallel execution** for Week 3-4 tasks
4. **Create progress tracking** dashboard
5. **Begin Phase 1** with Design System Agent

---

**Status**: Ready for implementation
**Next Action**: Create individual agent skill files
