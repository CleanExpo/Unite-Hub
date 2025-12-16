# Industrial Theme - Quick Start

**TL;DR**: Enable industrial dark metal aesthetic for your layout in 3 steps.

---

## 3-Minute Setup

### Step 1: Wrap Your Layout

```tsx
// app/guardian/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider';

export default function GuardianLayout({ children }) {
  return (
    <ThemeProvider theme="industrial">
      {children}
    </ThemeProvider>
  );
}
```

### Step 2: Replace Components

```tsx
// BEFORE
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  return (
    <Card>
      <Button>Click Me</Button>
    </Card>
  );
}

// AFTER
import { IndustrialCard, IndustrialButton } from '@unite-hub/ui-industrial/components';

export function Dashboard() {
  return (
    <IndustrialCard>
      <IndustrialButton variant="primary">Click Me</IndustrialButton>
    </IndustrialCard>
  );
}
```

### Step 3: Done ✅

Your layout now has:
- Heavy metal background (#1a1a1a)
- Metal-textured surfaces (#2a2a2a)
- Rust-orange accents (#a85a32)
- 3D metal shadows and effects

---

## Component Cheat Sheet

### Cards

```tsx
import { IndustrialCard } from '@unite-hub/ui-industrial/components';

// Basic
<IndustrialCard>Content</IndustrialCard>

// With title
<IndustrialCard title="Status">Content</IndustrialCard>

// With action
<IndustrialCard
  title="System"
  topRightElement={<Icon />}
>
  Content
</IndustrialCard>

// Interactive (hover effect)
<IndustrialCard interactive onClick={() => {}}>
  Click me
</IndustrialCard>
```

### Buttons

```tsx
import { IndustrialButton } from '@unite-hub/ui-industrial/components';

// Primary (rust gradient) - use for main CTAs
<IndustrialButton>Default Action</IndustrialButton>

// Primary sizes
<IndustrialButton size="sm">Small</IndustrialButton>
<IndustrialButton size="md">Medium</IndustrialButton>
<IndustrialButton size="lg">Large</IndustrialButton>

// Secondary (metal surface)
<IndustrialButton variant="secondary">Secondary</IndustrialButton>

// Danger (red rust)
<IndustrialButton variant="danger">Delete</IndustrialButton>

// Loading state
<IndustrialButton isLoading>Saving...</IndustrialButton>

// Disabled
<IndustrialButton disabled>Disabled</IndustrialButton>
```

### Badges

```tsx
import { IndustrialBadge } from '@unite-hub/ui-industrial/components';

<IndustrialBadge variant="rust">Active</IndustrialBadge>
<IndustrialBadge variant="metal">Neutral</IndustrialBadge>
<IndustrialBadge variant="success">Healthy</IndustrialBadge>
<IndustrialBadge variant="warning">Caution</IndustrialBadge>
<IndustrialBadge variant="error">Critical</IndustrialBadge>
```

---

## Tailwind Classes

**Colors** (if preset loaded):
```tsx
<div className="bg-industrial-metal text-industrial-text">
  Metal surface with gray text
</div>
<button className="bg-industrial-rust text-white">
  Rust button
</button>
```

**Shadows**:
```tsx
<div className="shadow-metal-outset">Raised effect</div>
<div className="shadow-metal-inset">Depressed effect</div>
<div className="shadow-rust-glow">Rust glow</div>
```

**Utilities**:
```tsx
<div className="textured-metal">Metal texture</div>
<span className="rust-label">Label</span>
```

---

## Theme Switching (Client-Only)

```tsx
'use client';

import { setTheme, getTheme, toggleTheme, useTheme } from '@/lib/theme/useTheme';

// Direct control
setTheme('industrial');    // Enable
setTheme('default');       // Disable

// Check current
console.log(getTheme());   // 'industrial' or 'default'

// Toggle
toggleTheme();             // Switch between themes

// In component
const { theme, toggleTheme } = useTheme();
return (
  <button onClick={toggleTheme}>
    Current: {theme}
  </button>
);
```

---

## Common Patterns

### Status Card with Badge

```tsx
<IndustrialCard title="Status">
  <div className="space-y-3">
    <p className="text-industrial-text">System Health</p>
    <IndustrialBadge variant="success">Nominal</IndustrialBadge>
  </div>
</IndustrialCard>
```

### Action Panel

```tsx
<IndustrialCard title="Actions" topRightElement={<Icon />}>
  <div className="space-y-3">
    <IndustrialButton variant="primary" className="w-full">
      Perform Check
    </IndustrialButton>
    <IndustrialButton variant="secondary" className="w-full">
      View Logs
    </IndustrialButton>
  </div>
</IndustrialCard>
```

### Dashboard Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <IndustrialCard title="Metric 1">
    <p className="text-2xl font-bold text-industrial-rust">92%</p>
  </IndustrialCard>

  <IndustrialCard title="Metric 2">
    <IndustrialBadge variant="warning">Investigating</IndustrialBadge>
  </IndustrialCard>
</div>
```

---

## Troubleshooting

**Components look plain?**
- Verify `data-theme="industrial"` on `<html>` element
- Hard refresh browser (Ctrl+Shift+R)
- Check that styles are imported

**Colors undefined in Tailwind?**
- Add industrial preset to `tailwind.config.js`
```js
const industrialPreset = require('@unite-hub/ui-industrial/tailwind');
module.exports = {
  presets: [industrialPreset],
  // ...
};
```

**Theme not switching?**
- Ensure component is marked `'use client'`
- Check browser DevTools for `data-theme` attribute

---

## Recommended Layouts

- ✅ Guardian dashboards
- ✅ Executive scorecards
- ✅ System status views
- ✅ Operations panels
- ✅ Admin dashboards

---

## Full Documentation

- **Setup Guide**: `docs/guides/INDUSTRIAL-THEME-ADOPTION.md`
- **API Reference**: `packages/ui-industrial/README.md`
- **Design Tokens**: `INDUSTRIAL-THEME-SUMMARY.md`

---

## Questions?

1. Check this Quick Start
2. Read `docs/guides/INDUSTRIAL-THEME-ADOPTION.md`
3. Review `packages/ui-industrial/README.md`
4. Ask in `#design-system` Slack

---

**You're all set!** 🚀

Start using industrial components in your layout now.
