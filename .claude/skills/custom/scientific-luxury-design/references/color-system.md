# Color System — Scientific Luxury

## Backgrounds (layered depth through contrast, never shadows)

```
#050505   — Page background / OLED Black (surface-base)
#0a0a0a   — Card surface (surface-card) — 5-step above base
#111111   — Elevated surface (surface-elevated) — modals, dropdowns, active states
#1a1a1a   — Maximum elevation (surface-max) — use sparingly, tooltip bg alternative
```

**Layering rule:** Each layer must be distinguishable by contrast alone. Never use `box-shadow` to suggest depth — use a darker background beneath a lighter one.

---

## Borders

```
rgba(255,255,255,0.06)  — Default border (border-subtle)
rgba(255,255,255,0.10)  — Medium border (border-default) — cards, inputs unfocused
rgba(255,255,255,0.16)  — Strong border (border-strong) — hover states, dividers
rgba(255,255,255,0.24)  — Emphasis border — active panels, selected rows
```

**Never use:** `border-gray-700`, `border-gray-800`, `border-slate-700` — always rgba on white.

---

## Text

```
rgba(255,255,255,0.85)  — Primary text (text-primary) — headings, values, active labels
rgba(255,255,255,0.60)  — Secondary text (text-secondary) — body text, descriptions
rgba(255,255,255,0.40)  — Muted text (text-muted) — timestamps, placeholders, disabled labels
rgba(255,255,255,0.20)  — Faint text (text-faint) — ghost placeholders, watermarks
```

**Never use raw `#ffffff`** for body text — it creates harsh contrast. Reserve `#ffffff` for focused/selected elements only.

---

## Accent — Cyan `#00F5FF`

```
#00F5FF          — Primary accent (full saturation)
#00F5FF/90       — Hover on cyan elements
#00F5FF/60       — Secondary accent / inline highlights
#00F5FF/30       — Accent border (focus rings, active edges)
#00F5FF/15       — Accent tint (subtle background on active row)
#00F5FF/08       — Hover background on accent-adjacent elements
```

**Semantic rule:** `#00F5FF` means "active", "primary action", or "key data callout". Never used decoratively. If something glows cyan, it means the user can interact with it or it is the primary insight.

---

## Semantic Colors

```
#22c55e   — Success / positive delta / connected / approved
#ef4444   — Danger / error / negative delta / rejected / critical
#f59e0b   — Warning / pending / unverified
#3b82f6   — Info / secondary action / link
#a855f7   — AI-generated / ML-derived content marker (use sparingly)
```

**At reduced opacity for backgrounds:**
```
rgba(34,197,94,0.10)   — Success tint background
rgba(239,68,68,0.10)   — Danger tint background
rgba(245,158,11,0.10)  — Warning tint background
rgba(59,130,246,0.10)  — Info tint background
```

**Border variants for semantic badges:**
```
rgba(34,197,94,0.25)   — Success badge border
rgba(239,68,68,0.25)   — Danger badge border
rgba(245,158,11,0.25)  — Warning badge border
rgba(59,130,246,0.25)  — Info badge border
```

---

## CSS Custom Properties (use these where defined)

```css
--color-bg:               #050505;
--color-surface-card:     #0a0a0a;
--color-surface-elevated: #111111;
--color-accent:           #00F5FF;
--color-success:          #22c55e;
--color-danger:           #ef4444;
--color-warning:          #f59e0b;
--color-info:             #3b82f6;
--color-text-primary:     rgba(255,255,255,0.85);
--color-text-secondary:   rgba(255,255,255,0.60);
--color-text-muted:       rgba(255,255,255,0.40);
--color-border:           rgba(255,255,255,0.06);
--color-border-default:   rgba(255,255,255,0.10);
```

---

## Prohibited Colors

These colors are banned in Unite-Group UI:

| Banned | Reason |
|--------|--------|
| `#ffffff` as a background | Breaks dark visual language |
| Any color lighter than `#111111` as surface | Same |
| `blue-500` / `#3b82f6` as primary action | Reserved for info/secondary only |
| `purple-600` / any purple gradient | Cliché AI-generated aesthetic |
| `slate-900`, `gray-700`, `gray-800` | Tailwind defaults; not from our system |
| `#8884d8` (Recharts purple) | Default chart color, always replace |
| `#82ca9d` (Recharts green) | Default chart color, always replace |
| Any `from-*/to-*` gradient | Banned universally — no gradients |

---

## Colourblind Accessibility

The cyan/red/green palette creates issues for deuteranopia (red-green blindness). Always supplement color with:

- **Shape**: Use icons (✓ ✕ ⚠) alongside green/red indicators
- **Pattern**: Use different line styles (solid vs dashed) in charts
- **Label**: Never rely on color alone to convey data — always pair with text or value

Cyan `#00F5FF` is perceptually distinct from both red and green under all common colorblindness types. It is a safe primary accent for semantic data.
