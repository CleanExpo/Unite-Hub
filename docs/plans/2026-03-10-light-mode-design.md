# Light Mode Design — Nexus 2.0

**Date:** 10/03/2026
**Status:** Approved — ready for implementation
**Approach:** CSS Variables (Option A)

---

## Summary

Add a manually-toggled light mode to Nexus 2.0 using the existing CSS custom property token system. Dark mode remains the default. The toggle persists to `localStorage` via Zustand. The design identity (Scientific Luxury) is preserved — the cyan accent `#00F5FF` is intentionally kept unchanged for a neon-on-platinum aesthetic.

---

## Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Activation | Manual toggle (Topbar button) | Single user, intentional preference |
| Light palette | Cool platinum (`#FAFAFA` canvas) | Premium precision feel, fits Scientific Luxury |
| Accent in light mode | Keep `#00F5FF` unchanged | Intentional neon-on-platinum contrast as brand signal |
| Implementation | CSS Variables overridden via `.light` class on `<html>` | Cleanest — one source of truth per token |
| State | Zustand `ui.ts` store (`theme: 'dark' \| 'light'`) | Already persisted, consistent with sidebar state |

---

## Section 1 — Token Layer

Add a `.light {}` block to `src/app/globals.css` overriding the surface stack and text colour tokens. Business dot colours, border radius, fonts, and `#00F5FF` are unchanged.

```css
.light {
  color-scheme: light;

  /* Surface stack — cool platinum */
  --surface-canvas:   #FAFAFA;
  --surface-sidebar:  #F4F4F5;
  --surface-card:     #FFFFFF;
  --surface-elevated: #FFFFFF;
  --surface-overlay:  #E4E4E7;
  --surface-selected: #D4D4D8;

  /* Text */
  --color-text-primary:   #0A0A0A;
  --color-text-secondary: #52525B;
  --color-text-muted:     #71717A;
  --color-text-disabled:  #A1A1AA;

  /* Borders */
  --color-border:        rgba(0, 0, 0, 0.08);
  --color-border-strong: rgba(0, 0, 0, 0.15);
}
```

Also update `body` in `globals.css`:
```css
body {
  background-color: var(--surface-canvas);   /* was #050505 */
  color: var(--color-text-primary);           /* was #f0f0f0 */
}
```

---

## Section 2 — State & Toggle

### `src/store/ui.ts`
Add `theme` field and `toggleTheme` action to the existing Zustand store:

```ts
interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]
  theme: 'dark' | 'light'          // new
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
  toggleTheme: () => void           // new
}
// default: theme: 'dark'
```

### `src/components/layout/ThemeProvider.tsx` (new file)
Client component that applies `.light` class to `<html>` reactively:

```tsx
'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore(s => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])
  return <>{children}</>
}
```

### `src/app/layout.tsx`
- Wrap root layout with `<ThemeProvider>`
- Add `suppressHydrationWarning` to `<html>` element

### `src/components/layout/Topbar.tsx`
Add `Sun` / `Moon` icon button (lucide-react) in right-side actions:
- Dark mode active → show `Sun` icon (click to switch to light)
- Light mode active → show `Moon` icon (click to switch to dark)

---

## Section 3 — Component Updates

Replace hardcoded hex values with CSS variable references using Tailwind's `text-[var(--token)]` syntax.

### Token mapping

| Hardcoded value | CSS variable | Semantic role |
|-----------------|--------------|---------------|
| `#f0f0f0`, `#ccc` | `var(--color-text-primary)` | Primary text |
| `#bbb`, `#aaa` | `var(--color-text-secondary)` | Secondary/hover text |
| `#888`, `#777`, `#666` | `var(--color-text-muted)` | Muted text |
| `#555`, `#333` | `var(--color-text-disabled)` | Disabled/dim text |
| `bg-[#161616]` | `var(--surface-elevated)` | Active/selected bg |
| `bg-[#111]` | `var(--surface-card)` | Hover bg |

### Files to update

| File | Hardcoded values to convert |
|------|-----------------------------|
| `globals.css` | `body` background + color |
| `Sidebar.tsx` | `text-[#f0f0f0]`, `text-[#555]`, `text-[#333]`, `text-[#666]` — **keep** `text-[#050505]` on avatar (text on cyan) |
| `SidebarNav.tsx` | `text-[#f0f0f0]`, `bg-[#161616]`, `bg-[#111]`, `text-[#888]`, `text-[#ccc]` |
| `SidebarBusinessItem.tsx` | `text-[#f0f0f0]`, `bg-[#161616]`, `text-[#777]`, `bg-[#111]`, `text-[#bbb]`, `text-[#666]`, `text-[#555]`, `text-[#aaa]` |
| `Topbar.tsx` | `text-[#f0f0f0]`, `text-[#555]`, `hover:text-[#888]` |

**Not changed:** Dashboard components (`KPICard`, `KPIGrid`, etc.) already use CSS variables correctly.

---

## Files Changed Summary

| File | Change type |
|------|-------------|
| `src/app/globals.css` | Add `.light {}` token block; update `body` |
| `src/store/ui.ts` | Add `theme` + `toggleTheme` |
| `src/components/layout/ThemeProvider.tsx` | **New** — applies class to `<html>` |
| `src/app/layout.tsx` | Wrap with `ThemeProvider`, add `suppressHydrationWarning` |
| `src/components/layout/Topbar.tsx` | Add Sun/Moon toggle button; convert hardcoded hex |
| `src/components/layout/Sidebar.tsx` | Convert hardcoded hex |
| `src/components/layout/SidebarNav.tsx` | Convert hardcoded hex |
| `src/components/layout/SidebarBusinessItem.tsx` | Convert hardcoded hex |

---

## Out of Scope

- Auth pages (`/auth/login`) — standalone dark layout, exempt from theme toggle
- `scrollbar-color` in globals — can remain dark (minor detail, not visible in light mode)
- shadcn/ui component variables — already have `.dark` overrides; `.light` uses their existing `:root` defaults
