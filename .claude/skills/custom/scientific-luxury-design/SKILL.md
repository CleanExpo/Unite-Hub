---
name: scientific-luxury-design
description: |
  Apply this skill for ALL UI work in Unite-Group: components, pages, layouts, Tailwind classes,
  design decisions, CSS, visual styling, colour choices, spacing, typography. Also apply when
  reviewing or auditing existing UI, suggesting improvements, or building anything that will be
  rendered in a browser. If there is any visual or interactive element involved, this skill applies.
context: fork
---

# Scientific Luxury Design System

## What This Skill Replaces

Claude's defaults produce: white backgrounds, Inter/Roboto fonts, `slate-900` text, `blue-500` accents, `rounded-lg` borders, `shadow-md` depth, purple gradients, Tailwind's out-of-box palette. These are **banned** in Unite-Group.

The Scientific Luxury system is the aesthetic of precision instruments, observatory equipment, and bioluminescent ocean life. Think OLED screens at maximum brightness, cyan bioluminescence in absolute darkness, surgical precision in every measurement. Not "dark mode" — a completely different visual language where darkness is the signal and light is the data.

---

## ABSOLUTE RULES (Never Violate)

**NEVER use:**
- Any background lighter than `#111111` (white, off-white, light grey = absolute ban)
- `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` — only `rounded-sm`
- `Inter`, `Roboto`, `Arial`, `Helvetica` as explicit font families
- `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg` — no box shadows at all
- Generic Tailwind palette: `blue-500`, `slate-900`, `gray-700`, `purple-600`, etc.
- `gradient` in any form (no linear-gradient, no from-*/to-* Tailwind)
- Decorative elements, illustrations, icons for decoration, background patterns
- Semantic colours for non-semantic purposes (green for "active" state is fine; green as decoration is not)

**ALWAYS use:**
- `rounded-sm` as the single border radius for everything
- `transition-colors` on every interactive element
- `disabled:opacity-40` for all disabled states
- Borders defined as `border border-white/[0.06]` (not `border-gray-800`)
- `var(--color-*)` CSS variables from the design token system where available
- Explicit pixel sizes for text: `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[20px]`, etc.

---

## Color System

See `references/color-system.md` for the full token set.

**Core palette (memorise these):**
```
#050505   — Page background (OLED Black)
#0a0a0a   — Card surface (surface-card)
#111111   — Elevated surface (surface-elevated)
#00F5FF   — Primary accent (Cyan)
#22c55e   — Success / positive data
#ef4444   — Danger / negative data
#3b82f6   — Info / secondary action
rgba(255,255,255,0.06)  — Default border
rgba(255,255,255,0.40)  — Muted text
rgba(255,255,255,0.60)  — Secondary text
rgba(255,255,255,0.85)  — Primary text
```

**Accent application rules:**
- `#00F5FF` is used for: primary CTAs, active states, focus rings, key data callouts, progress indicators
- At reduced opacity: `#00F5FF/08` for hover backgrounds, `#00F5FF/30` for borders on accent elements
- Never use `#00F5FF` for decorative purposes — only where it conveys meaning

---

## Typography

See `references/typography-guide.md` for the full system.

**Core rules:**
- All labels: `text-[10px] uppercase tracking-widest font-medium` (metric labels, nav items, status badges)
- Body text: `text-[13px]` with `leading-relaxed`
- Data values: `font-mono text-[13px]` or `text-[14px]`
- Page titles: `text-[20px] font-semibold tracking-tight`
- Section headers: `text-[15px] font-semibold tracking-tight`
- Meta / timestamps: `text-[11px]`
- NEVER use `text-sm`, `text-base`, `text-lg`, `text-xl` Tailwind scale — always explicit pixel sizes

---

## Spacing & Layout

See `references/spacing-layout.md` for the full grid system.

**Core rules:**
- Page padding: `p-6` on all main content areas
- Gap scale: `gap-2`, `gap-3`, `gap-4`, `gap-6` only — never `gap-5`, `gap-7`, `gap-8`
- Grid columns: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- Never arbitrary margins — use gap on flex/grid parents instead

---

## Component Patterns

See `references/component-patterns.md` for full implementations.

**Card:**
```html
<div class="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4">
```

**Button (primary):**
```html
<button class="bg-[#00F5FF] text-black text-[13px] font-semibold rounded-sm px-4 py-2
               hover:bg-[#00F5FF]/90 transition-colors disabled:opacity-40">
```

**Button (secondary / ghost):**
```html
<button class="border border-white/[0.12] text-white/60 text-[13px] rounded-sm px-4 py-2
               hover:border-white/[0.20] hover:text-white/80 transition-colors disabled:opacity-40">
```

**Input:**
```html
<input class="bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-white
              placeholder-white/30 focus:border-[#00F5FF]/50 focus:outline-none transition-colors">
```

**Badge (status):**
```html
<span class="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border"
      style="color: #22c55e; border-color: rgba(34,197,94,0.25)">
```

---

## Interaction Language

Every UI element communicates its state through **colour opacity**, not shadow or elevation:

| State | Visual change |
|-------|--------------|
| Default | As specified |
| Hover | `hover:brightness-110` or `hover:bg-[color]/[opacity+5]` |
| Active / pressed | `active:opacity-80` |
| Disabled | `disabled:opacity-40 disabled:cursor-not-allowed` |
| Focus | `focus:border-[#00F5FF]/50 focus:outline-none` |
| Loading | `animate-pulse` on skeleton elements |

---

## The Aesthetic Test

Before delivering any UI code, ask: Does this look like it could be part of a $500/month SaaS dashboard used by people who care deeply about what they're looking at? If it looks like a tutorial project, a generic admin panel, or anything that could have come from a free Bootstrap template — revise.

The standard is: every component looks like it was designed by someone who has studied Bloomberg Terminal, Linear, Vercel, and Raycast — and synthesised something more precise than all of them.
