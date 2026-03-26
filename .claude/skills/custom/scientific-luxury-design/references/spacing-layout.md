# Spacing & Layout — Scientific Luxury

## Gap Scale

Only these gap values are used. No odd-numbered gaps. No gaps above 6 in component interiors.

```
gap-2   (8px)   — tight: between icon and label, between badge items
gap-3   (12px)  — compact: between form fields, between list items
gap-4   (16px)  — standard: between card sections, between related components
gap-6   (24px)  — loose: between unrelated sections, between grid cards
```

**Never use:** `gap-1`, `gap-5`, `gap-7`, `gap-8`, `gap-10`, `gap-12` — these break the rhythm.

---

## Padding Scale

```
p-2     (8px)   — tight container: icon buttons, compact chips
p-3     (12px)  — compact container: small cards, inline inputs
p-4     (16px)  — standard container: cards, panels
p-6     (24px)  — main content areas: page sections, large modals
```

**Never mix padding and gap** for the same structural purpose. Use `gap` on flex/grid parents. Use `p` for the container's interior breathing room.

---

## Page Structure

```tsx
{/* Root page */}
<div className="min-h-screen bg-[#050505] text-white">
  {/* Page content */}
  <div className="p-6 flex flex-col gap-6">
    {/* Page header */}
    <div className="flex items-center justify-between">
      <h1 className="text-[20px] font-semibold tracking-tight text-white/85">
        Page Title
      </h1>
      {/* Actions */}
    </div>
    {/* Sections */}
    <section className="flex flex-col gap-4">
      {/* Section content */}
    </section>
  </div>
</div>
```

---

## Grid System

### Standard responsive grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```

### 4-column grid (KPI cards, metrics)
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

### 2-column split (form + preview, list + detail)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
```

**Rule:** Grid column counts must match the content. Never use a 3-column grid for 4 items — use 4 columns or a 2×2.

---

## Section Rhythm

Sections within a page follow this rhythm:

```
Page header               gap-6
├── Section A             gap-4
│   ├── Card grid         gap-4
│   └── Table             —
├── Divider               —
└── Section B             gap-4
    └── Form              gap-3
```

**Section header pattern:**
```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-[15px] font-semibold tracking-tight text-white/85">
    Section Name
  </h2>
  <button className="text-[#00F5FF] text-[13px] hover:text-[#00F5FF]/80 transition-colors">
    + Add
  </button>
</div>
```

---

## Sidebar Layout

```tsx
<div className="flex min-h-screen bg-[#050505]">
  {/* Sidebar */}
  <aside className="w-56 border-r border-white/[0.06] flex flex-col p-4 gap-1">
    {/* Nav items */}
  </aside>
  {/* Main */}
  <main className="flex-1 p-6 overflow-auto">
    {/* Page content */}
  </main>
</div>
```

**Sidebar width:** Always `w-56` (224px) — never arbitrary pixel widths.

---

## Sidebar Nav Item

```tsx
<a className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-[11px] uppercase
               tracking-widest font-medium transition-colors
               ${isActive
                 ? 'bg-[#00F5FF]/08 text-[#00F5FF] border border-[#00F5FF]/20'
                 : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
               }`}>
  <Icon size={13} />
  {label}
</a>
```

---

## Content Max Width

For long-form content (documents, settings pages):
```tsx
<div className="max-w-3xl mx-auto p-6">
```

For dashboards: no max-width — use full width with grid.

---

## Spacing Anti-Patterns

| Pattern | Why banned |
|---------|-----------|
| `m-5`, `p-5` | Breaks the 2/3/4/6 rhythm |
| `px-3 py-1.5` vs `px-4 py-2` | Inconsistent button padding |
| `mt-8 mb-4` on sections | Use gap on the parent instead |
| `space-y-*` | Prefer explicit gap on flex column |
| `w-[400px]` on a sidebar | Use Tailwind's `w-*` scale or define in theme |
| `min-h-[500px]` on cards | Cards should grow with content, not be fixed |
