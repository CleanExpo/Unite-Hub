# @unite-hub/ui-industrial

Industrial Design System for Unite-Hub and Synthex

Heavy metal aesthetic with rust accents. Explicit opt-in, production-safe, non-breaking parallel design system.

## Overview

The industrial theme provides:
- **Dark metal surfaces** (#1a1a1a - #3a3a3a)
- **Rust accents** (#a85a32 - #7a3e21)
- **Metal textures** with gradients and shadows
- **3D visual depth** via metal-outset and metal-inset shadows
- **Explicit opt-in** via `data-theme="industrial"` attribute

## Installation

Already included in the monorepo at `packages/ui-industrial/`.

## Components

### IndustrialCard
Heavy metal-inspired card component with outset shadow and top shimmer.

```tsx
import { IndustrialCard } from '@unite-hub/ui-industrial/components';

<IndustrialCard
  title="System Status"
  topRightElement={<span>⚙️</span>}
>
  <p>All systems nominal</p>
</IndustrialCard>
```

### IndustrialButton
Rust gradient button with metal outset shadow and uppercase text.

```tsx
import { IndustrialButton } from '@unite-hub/ui-industrial/components';

<IndustrialButton variant="primary" size="lg">
  Activate System
</IndustrialButton>
```

**Variants:**
- `primary` - Rust gradient (default)
- `secondary` - Metal surface
- `danger` - Red rust tones

### IndustrialBadge
Status indicator with industrial aesthetic.

```tsx
import { IndustrialBadge } from '@unite-hub/ui-industrial/components';

<IndustrialBadge variant="rust">Active</IndustrialBadge>
```

**Variants:** `rust`, `metal`, `success`, `warning`, `error`

## Tailwind Integration

The industrial theme extends Tailwind with new colors, shadows, and backgrounds:

```js
// tailwind.config.js
const industrialPreset = require('@unite-hub/ui-industrial/tailwind');

module.exports = {
  presets: [industrialPreset],
  // ... rest of config
};
```

**New Tailwind Classes:**
- Colors: `industrial-bg`, `industrial-metal`, `industrial-rust`, etc.
- Shadows: `shadow-metal-outset`, `shadow-metal-inset`, `shadow-rust-glow`
- Backgrounds: `bg-brushed-metal`, `bg-rust-gradient`, `bg-rust-gradient-vertical`
- Utilities: `.textured-metal`, `.rust-label`, `.metal-shine`, `.metal-depression`

## Theme Switching

### Via ThemeProvider (Recommended)

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

### Via setTheme (Direct)

```tsx
import { setTheme } from '@/lib/theme/useTheme';

// Enable industrial theme
setTheme('industrial');

// Disable (revert to default)
setTheme('default');
```

### Via useTheme Hook

```tsx
'use client';

import { useTheme } from '@/lib/theme/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  );
}
```

## CSS Custom Properties

When `data-theme="industrial"` is active:

```css
--background: 0 0% 10%;          /* Very dark gray */
--foreground: 0 0% 95%;          /* Light text */
--primary: 24 55% 43%;           /* Rust color */
--border: 0 0% 20%;              /* Metal border */
--radius: 1rem;                  /* Border radius */
```

## Adoption Strategy

### Phase 1: Opt-In Discovery (Current)
- Industrial components available for new features
- Guardian dashboards, executive views eligible
- Existing pages unchanged

### Phase 2: Gradual Migration (Future)
- Select dashboards convert to industrial theme
- Page-level adoption decisions
- No automatic conversion

### Phase 3: Full Unification (Optional)
- Once Guardian + Synthex unified visually
- All new pages use industrial default
- Legacy pages maintain Synthex theme if needed

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `industrial-bg` | #1a1a1a | Background surfaces |
| `industrial-metal` | #2a2a2a | Card, panel surfaces |
| `industrial-metal-light` | #3a3a3a | Hover, active states |
| `industrial-rust` | #a85a32 | Primary accent, CTAs |
| `industrial-rust-dark` | #7a3e21 | Secondary accent |
| `industrial-text` | #c0c0c0 | Primary text |
| `industrial-text-muted` | #707070 | Secondary text |

## Production Safety

✅ **Non-breaking**: Coexists with Synthex design
✅ **Opt-in only**: No implicit overrides
✅ **Isolated**: Separate package, separate styles
✅ **Reversible**: Can disable at any time
✅ **No backend changes**: Frontend-only implementation

## Troubleshooting

**Components don't look industrial?**
- Ensure `data-theme="industrial"` is set on `<html>` element
- Check that `globals.css` is imported
- Verify Tailwind preset is included

**Conflicts with existing styles?**
- Industrial theme only applies when `data-theme="industrial"`
- Default theme is unaffected
- No color token collisions due to `industrial-` prefix

**Need to customize colors?**
- Edit `packages/ui-industrial/tailwind.preset.js`
- Export preset is composable with existing config
- Colors are namespaced to `industrial-*`

## Contributing

New industrial components:
1. Create file in `packages/ui-industrial/components/`
2. Add `'use client'` directive
3. Export from `components/index.ts`
4. Document in this README

Ensure components:
- Use `data-theme="industrial"` attribute
- Reference `industrial-*` color tokens
- Follow Tailwind best practices
- Include JSDoc comments

## License

MIT
