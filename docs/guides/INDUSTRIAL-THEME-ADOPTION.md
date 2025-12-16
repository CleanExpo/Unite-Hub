# Industrial Theme Adoption Guide

**Status**: Available for opt-in adoption
**Version**: 1.0.0
**Last Updated**: December 16, 2025

## Overview

The industrial design system provides a heavy metal aesthetic with rust accents. It is a **parallel, non-breaking** addition to the existing Synthex theme.

This guide helps teams decide whether and how to adopt the industrial theme for their features.

## Quick Decision Tree

```
Is this a new Guardian feature or admin surface?
  ├─ YES → Consider industrial theme
  │         (dashboards, readiness views, scorer, governance)
  │
  └─ NO → Stay on Synthex theme
          (marketing, onboarding, user-facing CRM, public pages)

Is the surface internal/operational?
  ├─ YES → Industrial fits well
  │         (exec dashboards, system status, alerts, operations)
  │
  └─ NO → Synthex is appropriate
          (customer-facing, marketing, brand pages)

Do you need explicit visual hierarchy and metal textures?
  ├─ YES → Industrial provides this
  │         (control panels, dense dashboards, status boards)
  │
  └─ NO → Synthex is lighter weight
          (lists, simple forms, informational pages)
```

## Eligible Surfaces

### ✅ RECOMMENDED for Industrial Theme

| Surface | Reason |
|---------|--------|
| Guardian dashboards | Admin/operational, needs visual hierarchy |
| Executive scorecards | Dense data, metal aesthetic fits |
| System readiness views | Status-focused, operational feel |
| Governance coaches (H-series) | Control-panel style operations |
| Incident scorers (H04) | Dense scoring matrices |
| Restoration signals (Plugin-03) | Industrial operations context |
| Advanced configuration panels | Technical/expert users |

### ⚠️ CONSIDER SYNTHEX (Existing)

| Surface | Reason |
|---------|--------|
| Synthex marketing pages | Brand consistency |
| Onboarding flows | Light, welcoming feel |
| CRM dashboards (primary) | User-facing, should match brand |
| Campaign managers | Functional, not operational |
| Contact lists | Lightweight, list-heavy |
| Public-facing pages | External audience |

## Implementation Path

### Step 1: Add ThemeProvider to Layout

```tsx
// app/guardian/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider';

export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme="industrial">
      {children}
    </ThemeProvider>
  );
}
```

**Effect**: All children will render with `data-theme="industrial"` on `<html>`

### Step 2: Use Industrial Components

Replace existing cards and buttons with industrial equivalents:

```tsx
// BEFORE
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

<Card className="p-6">
  <h3>Status</h3>
  <Button>Activate</Button>
</Card>

// AFTER
import { IndustrialCard, IndustrialButton } from '@unite-hub/ui-industrial/components';

<IndustrialCard title="Status">
  <IndustrialButton variant="primary">Activate</IndustrialButton>
</IndustrialCard>
```

### Step 3: Import Theme Styles

Ensure industrial CSS is available:

```tsx
// In layout.tsx or root component
import '@unite-hub/ui-industrial/styles';
```

Or via package.json:

```json
{
  "scripts": {
    "build": "next build && next-theme-injector"
  }
}
```

### Step 4: Verify Tailwind Colors

If using industrial colors directly in className:

```tsx
// Make sure Tailwind has industrial colors
<div className="bg-industrial-metal text-industrial-text">
  Content
</div>
```

**If colors are undefined**: Add preset to `tailwind.config.js`

```js
const industrialPreset = require('@unite-hub/ui-industrial/tailwind');

module.exports = {
  presets: [industrialPreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './packages/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest
};
```

### Step 5: Test in Development

```bash
npm run dev
# Navigate to your layout
# Verify data-theme="industrial" appears on <html>
# Check that cards render with metal texture and shadows
```

## Component API Reference

### IndustrialCard

```tsx
<IndustrialCard
  title="System Status"                    // Optional header
  topRightElement={<Icon />}              // Optional top-right action
  className="custom-class"                 // Additional CSS
  onClick={() => {}}                       // Optional click handler
  interactive={false}                      // Show hover effect if true
>
  <p>Card content goes here</p>
</IndustrialCard>
```

### IndustrialButton

```tsx
<IndustrialButton
  variant="primary"                        // 'primary' | 'secondary' | 'danger'
  size="md"                                // 'sm' | 'md' | 'lg'
  isLoading={false}                        // Show loading spinner
  onClick={() => {}}
  disabled={false}
>
  Button Text
</IndustrialButton>
```

### IndustrialBadge

```tsx
<IndustrialBadge variant="rust">         // 'rust' | 'metal' | 'success' | 'warning' | 'error'
  Active
</IndustrialBadge>
```

## Tailwind Class Reference

### Colors

```tailwind
bg-industrial-bg           /* #1a1a1a - background */
bg-industrial-metal        /* #2a2a2a - surfaces */
bg-industrial-metal-light  /* #3a3a3a - hover state */
text-industrial-rust       /* #a85a32 - accent */
text-industrial-text       /* #c0c0c0 - text */
```

### Shadows

```tailwind
shadow-metal-outset   /* 6px outset, raised effect */
shadow-metal-inset    /* inset shadow, depression */
shadow-rust-glow      /* rust-colored glow effect */
```

### Backgrounds

```tailwind
bg-brushed-metal                /* gradient metal texture */
bg-rust-gradient                /* horizontal rust gradient */
bg-rust-gradient-vertical       /* vertical rust gradient */
```

### Utilities

```tailwind
.textured-metal      /* Apply brushed metal texture */
.rust-label          /* Styled rust-colored label */
.metal-shine         /* Metal highlight effect */
.metal-depression    /* Inset shadow effect */
.metal-raised        /* Outset shadow effect */
.rust-active         /* Rust glow effect */
```

## Troubleshooting

### Components look plain/not styled

**Check**:
1. Is `data-theme="industrial"` on `<html>` element?
   - Open DevTools → Elements → `<html>`
   - Should show `data-theme="industrial"`
2. Is `@unite-hub/ui-industrial/styles` imported?
3. Does browser cache need refresh? (Hard refresh: Ctrl+Shift+R)

**Fix**:
```tsx
// Ensure ThemeProvider wraps your content
<ThemeProvider theme="industrial">
  <YourLayout />
</ThemeProvider>
```

### Tailwind colors undefined

**Check**:
1. Is the industrial preset in `tailwind.config.js`?

**Fix**:
```js
// tailwind.config.js
const industrialPreset = require('@unite-hub/ui-industrial/tailwind');

module.exports = {
  presets: [industrialPreset],
  // ...
};
```

### Mixing Synthex and Industrial on same page

**This is allowed but not recommended.**

If you must mix:
- Keep industrial components in specific regions
- Avoid nested ThemeProviders with different themes
- Use `className` overrides to manage conflicts

**Better approach**:
- Choose one theme per layout/page
- Use different layouts for different themes

### Color contrast issues

**Check**:
- Industrial text (`#c0c0c0`) on metal (`#2a2a2a`) = 7:1 ratio ✅
- All combinations meet WCAG AA standards

If you see low contrast:
- Verify colors are not being overridden
- Check browser DevTools computed styles
- Report issue with screenshot

## Performance Considerations

### Bundle Size Impact

- `packages/ui-industrial/` adds ~5KB gzipped
- CSS imports on-demand, not duplicated
- No performance penalty when not activated

### Theme Switching

Theme switches are **instant** (DOM attribute update):

```tsx
// Near-zero latency
setTheme('industrial');  // Immediate, no layout recalculation
```

No localStorage persistence (theme resets on page reload).

## Future Roadmap

| Phase | Timeline | Action |
|-------|----------|--------|
| **Phase 1** | Now | Opt-in availability, Guardian dashboards |
| **Phase 2** | Q1 2026 | Selective adoption on executive views, scorecards |
| **Phase 3** | Q2 2026 | Optional full unification, single theme per app |

## Getting Help

**Questions or Issues?**

1. Check this guide
2. Review `packages/ui-industrial/README.md`
3. Check `DESIGN-SYSTEM.md` for context
4. Ask in `#design-system` Slack channel
5. File issue: `github.com/...` with label `industrial-theme`

## Examples

### Guardian Readiness Dashboard

```tsx
// app/guardian/readiness/page.tsx
'use client';

import { IndustrialCard, IndustrialButton } from '@unite-hub/ui-industrial/components';
import { useGuardianReadiness } from '@/hooks/useGuardianReadiness';

export default function ReadinessDashboard() {
  const { readiness } = useGuardianReadiness();

  return (
    <div className="grid gap-6">
      <IndustrialCard
        title="Guardian Readiness"
        topRightElement={<span>🔍</span>}
      >
        <div className="space-y-4">
          <p className="text-industrial-text">
            Overall Score: <span className="text-industrial-rust font-bold">{readiness.score}</span>
          </p>
          <IndustrialButton variant="primary">
            View Details
          </IndustrialButton>
        </div>
      </IndustrialCard>
    </div>
  );
}
```

### Executive Scorecard

```tsx
// app/executive/scorecard/page.tsx
import { IndustrialCard, IndustrialBadge } from '@unite-hub/ui-industrial/components';

export default function Scorecard() {
  return (
    <IndustrialCard title="Executive Scorecard">
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-industrial-text">Campaign Performance</span>
          <IndustrialBadge variant="rust">93%</IndustrialBadge>
        </div>
        <div className="flex justify-between">
          <span className="text-industrial-text">System Health</span>
          <IndustrialBadge variant="success">Nominal</IndustrialBadge>
        </div>
      </div>
    </IndustrialCard>
  );
}
```

---

**Ready to adopt?** Start with Step 1 and work through the implementation path above.

**Questions?** Reach out to the design system team.
