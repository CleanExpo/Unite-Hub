# Component Patterns — Scientific Luxury

All patterns use Tailwind. All use explicit pixel sizes. All background values are explicit hex/rgba — never Tailwind palette names.

---

## Card

### Standard card
```tsx
<div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4">
  {children}
</div>
```

### Elevated card (modal, dropdown)
```tsx
<div className="bg-[#111111] border border-white/[0.10] rounded-sm p-4">
  {children}
</div>
```

### Accent card (active/selected state)
```tsx
<div className="bg-[#0a0a0a] border border-[#00F5FF]/30 rounded-sm p-4">
  {children}
</div>
```

### KPI card
```tsx
<div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4 flex flex-col gap-2">
  <span className="text-[10px] uppercase tracking-widest font-medium text-white/40">
    {label}
  </span>
  <span className="font-mono text-[20px] font-semibold tracking-tight text-white/85">
    {value}
  </span>
  <span className={`font-mono text-[11px] ${delta >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
    {delta >= 0 ? '+' : ''}{delta}% vs prior period
  </span>
</div>
```

---

## Buttons

### Primary button
```tsx
<button className="bg-[#00F5FF] text-black text-[13px] font-semibold rounded-sm px-4 py-2
                   hover:bg-[#00F5FF]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
  {label}
</button>
```

### Secondary / ghost button
```tsx
<button className="border border-white/[0.12] text-white/60 text-[13px] rounded-sm px-4 py-2
                   hover:border-white/[0.20] hover:text-white/80 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed">
  {label}
</button>
```

### Destructive button
```tsx
<button className="border border-[#ef4444]/30 text-[#ef4444]/80 text-[13px] rounded-sm px-4 py-2
                   hover:border-[#ef4444]/60 hover:text-[#ef4444] transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed">
  {label}
</button>
```

### Icon button
```tsx
<button className="w-8 h-8 flex items-center justify-center rounded-sm
                   text-white/40 hover:text-white/70 hover:bg-white/[0.04]
                   transition-colors disabled:opacity-40">
  <Icon size={14} />
</button>
```

---

## Inputs

### Text input
```tsx
<input
  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2
             text-[13px] text-white/85 placeholder-white/30
             focus:border-[#00F5FF]/50 focus:outline-none transition-colors
             disabled:opacity-40 disabled:cursor-not-allowed"
  placeholder="Enter value..."
/>
```

### Textarea
```tsx
<textarea
  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2
             text-[13px] text-white/85 placeholder-white/30 leading-relaxed
             focus:border-[#00F5FF]/50 focus:outline-none transition-colors resize-none
             disabled:opacity-40"
  rows={4}
/>
```

### Select
```tsx
<select
  className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2
             text-[13px] text-white/85 appearance-none
             focus:border-[#00F5FF]/50 focus:outline-none transition-colors">
  <option>Option</option>
</select>
```

### Input with label
```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-[10px] uppercase tracking-widest font-medium text-white/40">
    {label}
  </label>
  <input className="bg-[#111] border border-white/10 rounded-sm px-3 py-2
                    text-[13px] text-white/85 placeholder-white/30
                    focus:border-[#00F5FF]/50 focus:outline-none transition-colors" />
</div>
```

---

## Badges / Status Pills

### Status badge
```tsx
// success
<span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border"
      style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.08)' }}>
  ACTIVE
</span>

// danger
<span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border"
      style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)' }}>
  FAILED
</span>

// warning
<span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border"
      style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)' }}>
  PENDING
</span>

// neutral / info
<span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm border
                 text-white/40 border-white/[0.12] bg-white/[0.04]">
  DRAFT
</span>
```

---

## Table

```tsx
<div className="border border-white/[0.06] rounded-sm overflow-hidden">
  <table className="w-full text-[13px]">
    <thead>
      <tr className="border-b border-white/[0.06]">
        <th className="text-left text-[10px] uppercase tracking-widest font-medium text-white/40 px-4 py-3">
          Column
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
        <td className="px-4 py-3 text-white/70">
          Value
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Table rules:**
- Column headers: 10px uppercase tracking-widest text-white/40
- Body text: text-white/70 (never full white — contrast would overwhelm headers)
- Row hover: `bg-white/[0.02]` — barely visible, not a block highlight
- Row dividers: `border-white/[0.04]` — one step below default border opacity

---

## Modal / Dialog

```tsx
{/* Backdrop */}
<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
  {/* Panel */}
  <div className="bg-[#111111] border border-white/[0.10] rounded-sm p-6
                  w-full max-w-lg mx-4 flex flex-col gap-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-semibold tracking-tight text-white/85">
        Modal Title
      </h2>
      <button className="w-7 h-7 flex items-center justify-center rounded-sm
                         text-white/30 hover:text-white/60 hover:bg-white/[0.04]
                         transition-colors">
        <X size={14} />
      </button>
    </div>
    {/* Content */}
    <div className="text-[13px] text-white/60 leading-relaxed">
      {children}
    </div>
    {/* Actions */}
    <div className="flex gap-3 justify-end">
      <button className="border border-white/[0.12] text-white/60 text-[13px] rounded-sm px-4 py-2
                         hover:border-white/[0.20] hover:text-white/80 transition-colors">
        Cancel
      </button>
      <button className="bg-[#00F5FF] text-black text-[13px] font-semibold rounded-sm px-4 py-2
                         hover:bg-[#00F5FF]/90 transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Divider

```tsx
<hr className="border-0 border-t border-white/[0.06]" />
```

Never use `border-gray-*` for dividers.

---

## Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 gap-3">
  <div className="w-10 h-10 rounded-sm border border-white/[0.06] flex items-center justify-center
                  text-white/20">
    <Icon size={18} />
  </div>
  <p className="text-[13px] text-white/40">No items yet</p>
  <button className="text-[#00F5FF] text-[13px] hover:text-[#00F5FF]/80 transition-colors">
    + Add first item
  </button>
</div>
```

---

## Loading / Skeleton

```tsx
{/* Skeleton line */}
<div className="h-3 bg-white/[0.06] rounded-sm animate-pulse" style={{ width: '60%' }} />

{/* Skeleton card */}
<div className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm p-4 flex flex-col gap-3">
  <div className="h-2 bg-white/[0.06] rounded-sm animate-pulse w-1/3" />
  <div className="h-5 bg-white/[0.06] rounded-sm animate-pulse w-2/3" />
  <div className="h-2 bg-white/[0.06] rounded-sm animate-pulse w-1/2" />
</div>
```

**Never use** a spinner alone without accompanying text. Always show a skeleton that represents the eventual shape of the content.

---

## Tooltip

```tsx
<div className="bg-[#111] border border-white/[0.12] rounded-sm px-2.5 py-1.5
                text-[11px] text-white/70 whitespace-nowrap pointer-events-none">
  {content}
</div>
```

Tooltip background is `#111` (elevated), not `#0a0a0a` — it must float above the card surface.
