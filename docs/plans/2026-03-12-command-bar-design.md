# Command Bar — Design Document

**Date:** 12/03/2026
**Feature:** Phase 5 Priority 4 — AI Chat / Command Bar
**Scope:** ⌘K command palette (navigation + quick actions) + centralised keyboard shortcuts
**Approach:** Centred dialog overlay using existing `cmdk` components

---

## Context

The codebase already has:
- `src/components/ui/command.tsx` — fully styled cmdk primitives (Scientific Luxury, already themed)
- `src/store/ui.ts` — Zustand store with `bronOpen`, `captureOpen`, `toggleBron`, `toggleCapture`
- `src/components/layout/FounderShell.tsx` — keyboard handler pattern (`⌘\` for sidebar)
- `src/components/layout/Topbar.tsx` — ⌘K button stub (no handler, line 72–82)

This is a **wiring task**, not a greenfield build.

---

## Architecture

### New File: `src/components/layout/CommandBar.tsx`

Client component. Uses `CommandDialog` from `src/components/ui/command.tsx`. Reads `commandBarOpen` from Zustand, dispatches `toggleCommandBar` on close. On item select: calls `router.push()` for navigation items, Zustand toggles for action items, then closes the dialog.

### Zustand Store Changes: `src/store/ui.ts`

Add two fields to `UIStore`:
```typescript
commandBarOpen: boolean
toggleCommandBar: () => void
```

`commandBarOpen` is **not** persisted (always starts closed).

### Keyboard Shortcuts: `src/components/layout/FounderShell.tsx`

Expand the existing `useEffect` keyboard handler to cover all four shortcuts:

| Shortcut | Action |
|----------|--------|
| `⌘\` / `Ctrl+\` | Toggle sidebar (existing) |
| `⌘K` / `Ctrl+K` | Toggle command bar (new) |
| `⌘⇧B` / `Ctrl+Shift+B` | Toggle Bron chat (new) |
| `⌘I` / `Ctrl+I` | Toggle Idea Capture (new) |

All call `e.preventDefault()`. Handler checks `e.metaKey || e.ctrlKey`.

### Mount Point: `src/components/layout/FounderShell.tsx`

Add `<CommandBar />` alongside `<IdeaCapture />` and `<BronSidebar />`.

---

## Command Registry

Static array defined inside `CommandBar.tsx`. No API calls, no debouncing.

### Navigation Group

```
Dashboard     →  /founder/dashboard
Contacts      →  /founder/contacts
Vault         →  /founder/vault
Approvals     →  /founder/approvals
Advisory      →  /founder/advisory
Social        →  /founder/social
Settings      →  /founder/settings
```

### Actions Group

```
Open Bron Chat    →  toggleBron()
Capture Idea      →  toggleCapture()
```

Filtering is handled by cmdk's built-in fuzzy match — no custom search logic needed.

---

## Styling

`command.tsx` components are **already themed** for Scientific Luxury:
- Background: `bg-[#050505]`
- Border separator: `bg-white/[0.06]`
- Selected item: `data-[selected=true]:bg-white/[0.04]`
- Text: `text-white/90`
- Group heading: `text-white/50`
- Corners: `rounded-sm` throughout

The `DialogContent` wrapper in `CommandDialog` will inherit the existing dialog overlay styles. No additional CSS needed.

---

## Testing Strategy

### Unit Tests

**`src/components/layout/__tests__/CommandBar.test.tsx`**
- Renders `null` when `commandBarOpen` is false
- Renders dialog when `commandBarOpen` is true
- Shows all navigation items
- Filters items when input changes (mock `cmdk` value)
- Calls `router.push` with correct path on navigation item select
- Calls `toggleBron` on "Open Bron Chat" select
- Calls `toggleCommandBar` to close on item select

**`src/store/__tests__/ui.test.ts`** (extend existing)
- `commandBarOpen` defaults to false
- `toggleCommandBar` toggles the value
- `commandBarOpen` is NOT included in persisted state

**`src/components/layout/__tests__/FounderShell.test.tsx`** (extend existing)
- `⌘K` keydown event calls `toggleCommandBar`
- `⌘⇧B` keydown event calls `toggleBron`
- `⌘I` keydown event calls `toggleCapture`

### No E2E Needed

Purely client-side, no API calls, no database interaction.

---

## File Summary

| File | Action |
|------|--------|
| `src/store/ui.ts` | Modify — add `commandBarOpen` + `toggleCommandBar` |
| `src/components/layout/CommandBar.tsx` | Create — command dialog component |
| `src/components/layout/__tests__/CommandBar.test.tsx` | Create — unit tests |
| `src/components/layout/FounderShell.tsx` | Modify — add shortcuts + mount `<CommandBar />` |
| `src/store/__tests__/ui.test.ts` | Modify — extend with commandBar state tests |

---

## Out of Scope

- Live contact/vault search (no API queries)
- AI-powered command interpretation
- Bron streaming upgrade
- Chat message persistence
- Slash commands in block editor
