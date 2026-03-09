# Phase 3: Core UI Shell — Design Document

> **Branch**: `rebuild/nexus-2.0`
> **Date**: 09/03/2026
> **Status**: Approved — ready for implementation
> **Approach**: Zustand sidebar + `(founder)` route group

---

## Design Direction

**Linear-Inspired Scientific Luxury** — the same compact density, surface elevation, and restraint as Linear's 2024 redesign, applied to the Nexus OLED-black + cyan design system. Every visual decision serves navigation or data clarity. No decoration.

---

## Route Architecture

```
src/app/
  (founder)/
    layout.tsx                          ← sidebar shell + Zustand provider
    founder/
      dashboard/page.tsx                → /founder/dashboard
      kanban/page.tsx                   → /founder/kanban
      vault/page.tsx                    → /founder/vault
      approvals/page.tsx                → /founder/approvals
      [businessKey]/
        page/
          [id]/page.tsx                 → /founder/[businessKey]/page/[id]
```

The `(founder)` route group applies the shared layout without adding a URL segment. `src/app/page.tsx` already redirects to `/founder/dashboard`.

---

## Design System Tokens

### Surface Stack (elevation via lightness — no shadows)

```css
--surface-canvas:    #050505;   /* OLED page base */
--surface-sidebar:   #0d0d0d;   /* sidebar, secondary panels */
--surface-card:      #111111;   /* cards, inputs, dropdowns */
--surface-elevated:  #161616;   /* active items, card hover */
--surface-overlay:   #1f1f1f;   /* modals, tooltips, popovers */
--surface-selected:  #2a2a2a;   /* selected rows, highlighted items */
```

### Colour Tokens

```css
--color-accent:         #00F5FF;
--color-accent-dim:     rgba(0, 245, 255, 0.08);
--color-accent-border:  rgba(0, 245, 255, 0.3);

--color-text-primary:   #f0f0f0;
--color-text-secondary: #999999;
--color-text-muted:     #555555;
--color-text-disabled:  #333333;

--color-border:         rgba(255, 255, 255, 0.06);
--color-border-strong:  rgba(255, 255, 255, 0.12);

--color-success:        #22c55e;
--color-danger:         #ef4444;
--color-warning:        #f97316;
```

### Business Dot Colours (immutable)

```css
--biz-dr:             #ef4444;   /* Disaster Recovery */
--biz-nrpg:           #f97316;   /* NRPG */
--biz-carsi:          #eab308;   /* CARSI */
--biz-restore:        #22c55e;   /* RestoreAssist */
--biz-synthex:        #a855f7;   /* Synthex */
--biz-ato:            #3b82f6;   /* ATO Tax Optimizer */
--biz-ccw:            #06b6d4;   /* CCW-ERP/CRM */
```

### Typography

```css
--font-ui:   'Geist Sans', system-ui, sans-serif;
--font-mono: 'Geist Mono', monospace;

/* Scale */
Display:   24px / weight 600 / tracking -0.02em   — page titles, modal headers
Heading:   18px / weight 600 / tracking -0.02em   — section headers
Body:      14px / weight 400                       — default body
UI:        13px / weight 500                       — nav, labels, buttons
Small:     12px / weight 400                       — metadata, timestamps
Micro:     10px / weight 500 / tracking 0.12em     — ALL-CAPS section labels, badges
Mono:      12px / weight 400                       — data values, IDs, P4 badges
```

### Spacing (8pt grid)

```
4px   — badge padding, inline gap
8px   — icon-to-label, small internal padding
12px  — card grid gap, list item horizontal padding
16px  — card padding (sides)
20px  — card padding (generous)
24px  — section vertical spacing
32px  — page section spacing
48px  — topbar height
```

### Motion

```css
--motion-instant:  0ms;
--motion-fast:     100ms ease-out;           /* hover bg, button states */
--motion-medium:   200ms cubic-bezier(0.4,0,0.2,1);  /* card lift, dropdown */
--motion-panel:    spring(stiffness:300, damping:30); /* sidebar, sheet */
--motion-entrance: 300ms cubic-bezier(0.19,1,0.22,1); /* modal, page load */
```

**Rule**: Only transition `background-color`, `opacity`, `transform`. Never `width`, `height`, `box-shadow`, `border`.

### Global Component Rules

- **Border-radius**: `rounded-sm` (4px) everywhere — no exceptions
- **Borders**: always `1px solid var(--color-border)`
- **Shadows**: none — elevation via surface stack only
- **Scrollbars**: 2px width, `#333` thumb, transparent track
- **Focus ring**: `2px solid #00F5FF`, offset 2px (keyboard nav only)
- **Icons**: Lucide React, 16px, stroke outline only
- **Loading**: skeleton shimmer — `#111` → `#161616`, 1.5s infinite
- **Empty states**: centred 24px icon (`#333`) + muted text, no illustrations

---

## Zustand UI Store

```typescript
// src/store/ui.ts
interface UIStore {
  sidebarOpen: boolean
  expandedBusinesses: string[]          // ['dr', 'synthex']
  toggleSidebar: () => void
  toggleBusiness: (key: string) => void
}
// Persisted to localStorage via zustand/middleware persist
```

## Business Config

```typescript
// src/lib/businesses.ts
export const BUSINESSES = [
  { key: 'dr',      name: 'Disaster Recovery',  color: '#ef4444', status: 'active' },
  { key: 'nrpg',    name: 'NRPG',               color: '#f97316', status: 'active' },
  { key: 'carsi',   name: 'CARSI',              color: '#eab308', status: 'active' },
  { key: 'restore', name: 'RestoreAssist',       color: '#22c55e', status: 'active' },
  { key: 'synthex', name: 'Synthex',             color: '#a855f7', status: 'active' },
  { key: 'ato',     name: 'ATO Tax Optimizer',   color: '#3b82f6', status: 'planning' },
  { key: 'ccw',     name: 'CCW-ERP/CRM',         color: '#06b6d4', status: 'active' },
] as const
```

---

## Module Designs

### 1. Sidebar (240px open / 48px collapsed)

**Structure:**
- Workspace header row (44px): `◈ NEXUS` wordmark + `⌘\` hint + avatar
- `⌘K` search trigger (28px, `--surface-card`, `rounded-sm`)
- Global nav items: Dashboard, Kanban, Vault, Approvals
- Section label: `MY BUSINESSES` (10px mono, `tracking-widest`, `--color-text-disabled`)
- Business tree: each business has colour dot + chevron + sub-items

**Nav item states:**
- Inactive: text `#888`, no bg
- Hover: bg `#111`, text `#ccc`, `100ms ease-out`
- Active: `2px solid #00F5FF` left border, bg `#161616`, text `#f0f0f0`

**Collapsed rail (48px):** icons + business dots only. Radix tooltip on hover.

**Mobile:** off-canvas Sheet (Radix), same styling, hamburger in topbar.

**Keyboard:** `Cmd+\` global listener via Zustand `toggleSidebar`.

---

### 2. Topbar (universal — all pages)

48px height | bg `#050505` | `border-bottom: 1px solid var(--color-border)`

- Left: breadcrumb (13px UI, muted → current page `#f0f0f0`)
- Right: `⌘K` search trigger + help icon (Lucide, 16px, `#555`)

---

### 3. Dashboard (`/founder/dashboard`)

3-column grid (`repeat(3, 1fr)`), `gap: 12px`, tablet 2-col, mobile 1-col.

**KPI Card anatomy:**
- bg `--surface-card`, border `--color-border`, `rounded-sm`, padding `20px`
- Top: 8px business dot + business name (13px/500) + status badge
- Primary metric: 30px/600, `#f0f0f0`
- Metric label: 11px, `#555`
- Trend: `▲ +X%` green or `▼ −X%` red, 12px
- Divider: `1px solid rgba(255,255,255,0.04)`
- Secondary metrics: 11px, `#555`, `·` separator
- Hover: `translateY(-2px)`, bg `#111`, `200ms ease-out`
- Planning status: card at 50% opacity, `⬡ Not yet launched` message

**Static placeholder data** — real data wired in Phase 4.

---

### 4. Kanban (`/founder/kanban`)

5 columns: TODAY / HOT / PIPELINE / SOMEDAY / DONE

- Column bg: `--surface-sidebar`, border `--color-border`, `rounded-sm`
- Column width: `240px` fixed, horizontal scroll
- Column header: 10px mono, `tracking-widest`, `#555` + item count badge
- Card bg: `--surface-card`, border, `rounded-sm`, padding `12px`
- Card hover: bg `--surface-elevated`, `translateY(-1px)`, `100ms`
- Card drag ghost: `opacity: 0.5`, `scale(1.02)`
- Drop zone: `border: 1px dashed --color-accent-border`, bg `--color-accent-dim`
- DONE column: cards at `opacity: 0.5`, strikethrough title
- Library: `@dnd-kit/core` (not react-beautiful-dnd)

---

### 5. Vault (`/founder/vault`)

**Locked state:** full-screen `--surface-sidebar` overlay, centred password input.

**Unlocked state:**
- Auto-lock countdown badge in topbar (`#f97316` < 5 min)
- Credentials grouped by business (section headers: 10px mono)
- Row: `--surface-sidebar`, `32px` height, `border-bottom --color-border`
- Row hover: bg `--surface-card`, reveal [👁] + [Copy] buttons
- Secret value: `········` Geist Mono — never shown until [👁]
- Copy feedback: `#00F5FF` flash `800ms`, tooltip "Copied!"
- Add credential: modal from `--surface-overlay`, Framer spring entrance

---

### 6. Approvals (`/founder/approvals`)

- Queue list: rows on `--surface-sidebar`
- Row: `border-bottom --color-border`, `16px` vertical padding
- Row hover: bg `--surface-card`
- Approve: `#22c55e` text + border, hover bg `rgba(34,197,94,0.08)`, `rounded-sm`
- Reject: `#ef4444` text + border, hover bg `rgba(239,68,68,0.08)`, `rounded-sm`
- On approve: slide out `opacity:0, translateX(16px)`, `200ms`
- On reject: slide out `opacity:0, translateX(-16px)`, `200ms`
- Approved section: collapsed default, `opacity: 0.5`

---

### 7. Block Editor (`/founder/[businessKey]/page/[id]`)

- Canvas: `#050505` — full page, no card wrapper
- Prose width: `720px` centred
- Toolbar: `48px`, `--surface-sidebar`, `border-bottom --color-border`
- H1: 30px/600, `#f0f0f0`, `letter-spacing: -0.02em`
- H2: 22px/600, `#e0e0e0`
- Body: 15px/400, `#c4c4c4`, `line-height: 1.7`
- Slash menu: `--surface-overlay`, `rounded-sm`, `border --color-border`, Framer spring
- `/ai` block: inline `--surface-card` with `2px solid #00F5FF` left border
- Library: Novel.sh (Tiptap-based)

---

## Component File Map

```
src/
  store/
    ui.ts                       ← Zustand sidebar store
  lib/
    businesses.ts               ← BUSINESSES config constant
  app/
    (founder)/
      layout.tsx                ← shell layout
      founder/
        dashboard/page.tsx
        kanban/page.tsx
        vault/page.tsx
        approvals/page.tsx
        [businessKey]/page/[id]/page.tsx
  components/
    layout/
      Sidebar.tsx
      SidebarBusinessItem.tsx
      SidebarNav.tsx
      Topbar.tsx
    founder/
      dashboard/
        KPICard.tsx
        KPIGrid.tsx
      kanban/
        KanbanBoard.tsx
        KanbanColumn.tsx
        KanbanCard.tsx
      vault/
        VaultLock.tsx
        VaultEntry.tsx
        VaultGrid.tsx
      approvals/
        ApprovalItem.tsx
        ApprovalQueue.tsx
      editor/
        NovelEditor.tsx
```

---

## Dependencies to Add

```json
"zustand": "^5.0",
"@dnd-kit/core": "^6.3",
"@dnd-kit/sortable": "^8.0",
"novel": "^0.5",
"lucide-react": "already installed (verify)"
```

---

## Exit Criteria (Phase 3 complete when)

- [ ] All 5 routes render without console errors
- [ ] Sidebar collapses/expands via `Cmd+\` and persists state
- [ ] Business tree expands/collapses per business
- [ ] Dashboard shows 7 KPI cards with static data
- [ ] Kanban supports drag-and-drop between all 5 columns
- [ ] Vault locks/unlocks with master password (local state only in Phase 3)
- [ ] Approvals queue renders with working approve/reject animations
- [ ] Block editor loads Novel, `/` slash menu works
- [ ] Responsive: mobile (375px) hamburger works, tablet 2-col grid
- [ ] Loading skeletons on all data components
- [ ] `pnpm turbo run type-check lint` passes
