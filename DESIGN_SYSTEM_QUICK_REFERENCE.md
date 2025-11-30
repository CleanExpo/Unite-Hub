# Design System Quick Reference

**Branch**: `design-branch` | **Status**: Phase 1 ✅ Complete | **Date**: 2025-11-30

---

## 🚀 Quick Start

### View Design Tokens
```typescript
// TypeScript definitions with full type safety
import { designTokens } from '@/styles/design-tokens';

designTokens.colors.accent.primary  // '#ff6b35'
designTokens.spacing.scale[6]       // '16px'
designTokens.typography.fontSizes.lg // '17px'
```

### Use in Tailwind
```html
<!-- All design tokens available as Tailwind utilities -->
<div class="bg-bg-card text-text-primary p-6 rounded-lg shadow-card">
  <h1 class="font-display text-5xl font-bold text-accent-500">
    Heading
  </h1>
</div>
```

### Use in CSS
```css
/* CSS custom properties available globally */
:root {
  --bg-base: #08090a;
  --text-primary: #f8f8f8;
  --accent-primary: #ff6b35;
  --spacing-6: 16px;
}

.card {
  background-color: var(--bg-card);
  color: var(--text-primary);
  border-radius: 14px;
}
```

---

## 🎨 Colors

### Backgrounds
| Name | Value | Use |
|------|-------|-----|
| base | #08090a | Page background |
| raised | #0f1012 | Elevated sections |
| card | #141517 | Card backgrounds |
| hover | #1a1b1e | Hover states |
| input | #111214 | Input backgrounds |

### Text
| Name | Value | Use |
|------|-------|-----|
| primary | #f8f8f8 | Main text |
| secondary | #9ca3af | Secondary text |
| muted | #6b7280 | Disabled/muted |

### Accent (Primary Brand)
| Name | Value | Use |
|------|-------|-----|
| primary | #ff6b35 | Buttons, focus |
| hover | #ff7d4d | Hover state |
| soft | rgba(255, 107, 53, 0.12) | Backgrounds |

### Semantic
```
Success:  #10b981 (dark green)
Warning:  #f59e0b (orange)
Info:     #3b82f6 (blue)
Error:    #ef4444 (red)
```

---

## 📝 Typography

### Fonts
- **Display**: Sora (headings)
- **Body**: DM Sans (body text)

### Sizes
```
xs:  11px    sm:   12px    base: 14px    md:  15px
lg:  17px    xl:   18px    2xl:  20px    3xl: 22px
4xl: 26px    5xl:  32px    6xl:  40px    7xl: 52px
```

### Weights
```
400 (Regular) | 500 (Medium) | 600 (Semibold)
700 (Bold)    | 800 (Extrabold)
```

### Line Heights
```
1.1 (tight)  | 1.2 (snug)  | 1.5 (normal)
1.6 (relaxed) | 1.7 (loose)
```

---

## 🎯 Spacing

### Scale (4px base increment)
```
0: 0px      1: 4px      2: 8px      3: 10px     4: 12px
5: 14px     6: 16px     7: 18px     8: 20px     9: 24px
10: 28px    11: 32px    12: 36px    13: 40px    14: 48px
15: 56px    16: 64px    17: 80px    18: 100px   19: 120px
20: 160px
```

### Container
```
Max Width: 1140px
Padding:   28px
```

### Sections
```
Desktop Mobile: 120px
Mobile:  80px
```

---

## 🎭 Borders & Radius

### Border Radius
```
sm:   6px    md:  10px    lg:  14px
xl:   20px   full: 100px (pill shape)
```

### Border Colors
```
subtle: rgba(255, 255, 255, 0.08)
medium: rgba(255, 255, 255, 0.14)
```

---

## ✨ Shadows

### Card Shadow
```css
0 20px 40px -12px rgba(0, 0, 0, 0.4),
0 0 0 1px rgba(255, 255, 255, 0.03) inset
```

### Button Shadow
```css
0 8px 24px -6px rgba(255, 107, 53, 0.35)
```

---

## ⚡ Transitions

### Easing Functions
```
ease-out:   cubic-bezier(0.16, 1, 0.3, 1)
ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Durations
```
fast:   0.2s
normal: 0.28s
slow:   0.35s
slower: 0.5s
```

---

## 📱 Responsive Breakpoints

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

---

## 🔤 Copy Guidelines

### Key Principles
✅ **Benefits first** - Focus on what customers gain
✅ **Positive psychology** - Growth & opportunity focused
✅ **Action-oriented** - Use power verbs
✅ **Specific > Generic** - Numbers & details matter
✅ **Customer-focused** - "You" and "your" language

### Forbidden Words
```
❌ "Stop", "Never", "No longer"
❌ "Pain", "Struggle", "Frustration"
❌ "Competitors", "Fear", "Worried"
❌ "Problem", "Issue", "Fix"
```

### Button CTAs
```
✅ "Start Your Free Trial"
✅ "See How It Works"
✅ "Get Started (No Credit Card)"
✅ "Book a Demo"

❌ "Click Here", "Submit", "Next"
❌ "Learn More" (too vague)
```

---

## 🧪 Component Checklist

### When Building Components

- [ ] Use design tokens (no hardcoded colors)
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Add focus ring (visible on all interactive)
- [ ] Include hover states
- [ ] Test on mobile/tablet/desktop
- [ ] Keyboard navigable
- [ ] Screen reader compatible
- [ ] No motion on prefers-reduced-motion

### Design Token Checklist

- [ ] Component background from color tokens
- [ ] Component text from color tokens
- [ ] Component padding from spacing tokens
- [ ] Component radius from radius tokens
- [ ] Component transitions from transition tokens
- [ ] No hardcoded pixel values
- [ ] No custom colors outside palette

---

## 📚 Documentation Files

### Main References
- **Tokens**: `src/styles/design-tokens.ts`
- **Config**: `tailwind.config.cjs`
- **Implementation**: `docs/DESIGN_SYSTEM_IMPLEMENTATION.md`
- **Roadmap**: `docs/DESIGN_SYSTEM_ROADMAP.md`

### Brand & Content
- **Messaging**: `docs/MESSAGING_GUIDELINES.md`
- **Copy Guidelines**: See messaging file
- **Forbidden Language**: See messaging file

### Quality & Testing
- **QA Checklist**: `docs/DESIGN_SYSTEM_QA_CHECKLIST.md`
- **Accessibility**: See QA checklist
- **Responsive Testing**: See QA checklist

### Agent Architecture
- **Agents**: `.claude/DESIGN_SYSTEM_AGENTS.md`
- **Skills**: Defined in agent file

---

## 🎬 Next Phase - Components

### Phase 2 Agents
- **Component Agent** - Builds all components
- **Documentation Agent** - Documents components
- **QA Agent** - Tests components

### Phase 2 Deliverables
- [ ] 6 Primitive components
- [ ] 7 Composite components
- [ ] 4 Layout components
- [ ] 8+ Pattern components
- [ ] Component documentation
- [ ] Storybook (optional)

### Phase 2 Timeline
- Week 2: Primitives
- Week 3: Composites & Layout

---

## 🐛 Common Tasks

### Add a New Color
1. Add to `src/styles/design-tokens.ts`
2. Update `tailwind.config.cjs`
3. Update documentation
4. Test contrast ratio

### Use a Token in JSX
```typescript
// ✅ Using Tailwind utility
<div className="bg-accent-500 text-white">

// ✅ Using CSS
<div style={{ backgroundColor: designTokens.colors.accent.primary }}>

// ✅ Using CSS custom property
<div style={{ color: 'var(--accent-primary)' }}>
```

### Create a Button
```typescript
// Use design tokens for all values
export function Button({ variant = 'primary' }) {
  const bgColor = variant === 'primary' ? 'bg-accent-500' : 'bg-bg-card';
  const hoverBg = variant === 'primary' ? 'hover:bg-accent-400' : 'hover:bg-bg-hover';

  return (
    <button className={`
      ${bgColor}
      text-white
      px-8 py-4
      rounded-md
      transition-all duration-normal ease-out
      hover:shadow-button-primary
      ${hoverBg}
      focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2
    `}>
    </button>
  );
}
```

---

## 📊 Accessibility Quick Check

### Color Contrast
- Text on background: 4.5:1 minimum
- UI elements: 3:1 minimum
- Use WebAIM Contrast Checker

### Focus States
- Visible on all interactive elements
- Use #ff6b35 with 3px offset
- `focus:ring-2 focus:ring-accent-500`

### Keyboard Navigation
- Tab through all elements
- Logical tab order
- No keyboard traps

### Screen Reader
- Semantic HTML (buttons, links, headings)
- ARIA labels where needed
- Form labels associated

---

## 🚀 Commands

```bash
# Build design tokens
npm run build

# Type check
npm run type-check

# Format code
npm run format

# Lint code
npm run lint

# QA tests (when ready)
npm run qa:full
```

---

## 📞 Help & Support

### Design Token Questions
→ See `src/styles/design-tokens.ts`
→ See `docs/DESIGN_SYSTEM_IMPLEMENTATION.md`

### Component Questions
→ See `.claude/DESIGN_SYSTEM_AGENTS.md`
→ See `docs/DESIGN_SYSTEM_IMPLEMENTATION.md`

### Copy/Messaging Questions
→ See `docs/MESSAGING_GUIDELINES.md`
→ Search for examples in document

### QA/Testing Questions
→ See `docs/DESIGN_SYSTEM_QA_CHECKLIST.md`
→ Follow checklist for validation

---

## ✅ Phase 1 Status

✅ Design tokens: Complete
✅ Tailwind config: Complete
✅ Documentation: Complete
✅ Agent architecture: Defined
✅ QA framework: Defined
✅ Messaging guidelines: Complete

⏳ Phase 2: Components (Ready to start)
⏳ Phase 3: Pages (Dependent on Phase 2)
⏳ Phase 4: Refinement (Dependent on Phase 3)

---

**Last Updated**: 2025-11-30
**Branch**: design-branch
**Status**: Phase 1 Complete ✅

Keep this guide handy while building components in Phase 2!
