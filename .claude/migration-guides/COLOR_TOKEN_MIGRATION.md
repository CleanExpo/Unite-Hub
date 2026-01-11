# Color Token Migration Guide - Week 1 Task 2

**Goal**: Replace legacy teal colors + hardcoded Tailwind colors with design tokens
**Status**: Phase 1 - Teal migration (52 files)
**Owner**: Claude Code 2.1.4 with hot-reload skills

---

## Color System Overview

### Current State (globals.css)
**Light Mode**: Gray/white palette
**Dark Mode (Active)**: Synthex dark theme with orange accent

### Synthex Color System (Active)
From `globals.css` lines 194-204:

```css
/* Accent Colors (Primary Brand - Orange) */
--color-accent-50: rgba(255, 107, 53, 0.08);
--color-accent-100: rgba(255, 107, 53, 0.12);
--color-accent-200: rgba(255, 107, 53, 0.2);
--color-accent-300: #ff8860;
--color-accent-400: #ff7d4d;    /* hover/interactive */
--color-accent-500: #ff6b35;    /* primary brand */
--color-accent-600: #ff5c1a;
--color-accent-700: #e85a1a;
--color-accent-800: #cc4f15;
--color-accent-900: #994012;
```

---

## Phase 1: Teal Color Migration (52 Files)

### Legacy Teal Colors to Replace
```
teal-50    → accent-50    (rgba(255, 107, 53, 0.08))
teal-100   → accent-100   (rgba(255, 107, 53, 0.12))
teal-200   → accent-200   (rgba(255, 107, 53, 0.2))
teal-300   → accent-300   (#ff8860)
teal-400   → accent-400   (#ff7d4d)
teal-500   → accent-500   (#ff6b35)
teal-600   → accent-600   (#ff5c1a)      [also in globals.css line 74]
teal-700   → accent-700   (#e85a1a)      [also in globals.css line 75]
teal-800   → accent-800   (#cc4f15)
teal-900   → accent-900   (#994012)
```

### Files to Update (52 total)

**src/app/** (20 files):
- dashboard/overview/page.tsx
- founder/audit/page.tsx
- guardian/admin/knowledge-hub/page.tsx
- [18 more founder/* and guardian/* pages]

**src/ui/** (8 files):
- components/VoiceNavButton.tsx
- components/SectionHeader.tsx
- components/ReviewPackCard.tsx
- components/PerformanceCard.tsx
- [4 more]

**src/components/** (20+ files):
- workspace/WorkspaceSidebar.tsx
- workspace/NexusAssistant.tsx
- video/ExplainerVideo.tsx
- [17 more workspace, video, showcases, client, loyalty]

**src/app/globals.css** (1 file):
- Line 74: `--link-color: #0d9488;` → `--color-accent-500` or new link token
- Line 75: `--link-hover: #0f766e;` → `--color-accent-600`

---

## Phase 2: Hardcoded Tailwind Colors (883 Files)

### Mapping Table

| Hardcoded Class | Design Token | Tailwind Class | CSS Variable |
|---|---|---|---|
| `bg-gray-50` | Light background | `bg-accent-50` | `--color-accent-50` |
| `bg-gray-100` | Subtle background | `bg-accent-100` | `--color-accent-100` |
| `bg-gray-600` | Medium text | `text-text-secondary` | `--color-text-secondary` |
| `bg-gray-900` | Dark text | `text-text-primary` | `--color-text-primary` |
| `text-gray-600` | Secondary text | `text-text-secondary` | `--color-text-secondary` |
| `text-red-*` | Error state | `text-error-*` | `--color-error-*` |
| `bg-red-*` | Error background | `bg-error-*` | `--color-error-*` |
| `text-blue-*` | Info/link | `text-info-*` | `--color-info-*` |
| `bg-blue-*` | Info background | `bg-info-*` | `--color-info-*` |
| `border-slate-*` | Border | `border-border-*` | `--color-border-*` |

### High-Priority Files to Fix (10 critical components)

1. `src/components/ui/badge.tsx` - Uses `text-gray-600`
2. `src/components/ui/button.tsx` - Check for hardcoded colors
3. `src/components/ui/card.tsx` - Card backgrounds
4. `src/components/ui/input.tsx` - Input borders/text
5. `src/app/dashboard/layout.tsx` - Dashboard colors
6. `src/app/page.tsx` - Landing page (3 versions)
7. `src/app/dashboard/overview/page.tsx` - Uses `bg-slate-950`
8. `src/components/synthex/design-studio/DesignStudio.tsx` - Large component
9. `src/components/ui/table.tsx` - Table colors
10. `src/components/ui/dialog.tsx` - Modal/dialog colors

---

## Implementation Strategy

### Step 1: Fix globals.css (Link Colors)
**File**: `src/app/globals.css` lines 74-75

```css
/* BEFORE */
--link-color: #0d9488;            /* teal-600: 5.2:1 contrast ratio */
--link-hover: #0f766e;            /* teal-700 */

/* AFTER */
--link-color: var(--color-accent-500);      /* ff6b35 */
--link-hover: var(--color-accent-600);      /* ff5c1a */
```

### Step 2: Replace Teal Colors in 52 Files
**Batch script** (for Claude Code 2.1.4 hot-reload skill):
```bash
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | \
  xargs sed -i 's/teal-50/accent-50/g' && \
  xargs sed -i 's/teal-100/accent-100/g' && \
  # ... (repeat for all teal variants)
  xargs sed -i 's/teal-900/accent-900/g'
```

### Step 3: Identify & Fix Hardcoded Colors (883 Files)
**Phase**: Week 1 Task 4 (separate)
- Use aXe/Lighthouse for contrast validation
- Prioritize critical components first
- Use batch regex replacement tool

---

## Validation Checklist

- [ ] globals.css link colors updated
- [ ] All 52 teal-* files migrated to accent-*
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (235+ tests)
- [ ] Lighthouse accessibility score ≥ 90 on 10 pages
- [ ] All Tailwind classes valid (no unknown colors)
- [ ] Visual regression tests pass (Percy.io)

---

## Unresolved Questions

1. **Light mode support**: Should we maintain light mode, or deprecate it?
   - Current: Dark theme primary, light theme secondary
   - Recommendation: Keep light for accessibility, test both modes

2. **Link color contrast**: Is orange accent (#ff6b35) WCAG AA on dark background?
   - Current: teal-600 (#0d9488) has 5.2:1 contrast
   - Orange (#ff6b35) on #08090a: ~5.8:1 contrast ✅ WCAG AA

3. **Gray palette deprecation**: Remove all gray-*, slate-* classes?
   - Recommendation: Keep for testing, but prefer design tokens in production

4. **Industrial theme**: 883 hardcoded colors might include Guardian industrial theme
   - Decision needed: Keep both Synthex + Industrial or unify on Synthex?

---

**Next Step**: Execute Phase 1 (globals.css + 52 teal files) by EOD
