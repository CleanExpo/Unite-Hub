# Typography Guide — Scientific Luxury

## Font Stack

**Primary (UI text, labels, body):**
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
```
Monospace is the default for data-rich dashboards — it creates implicit grid alignment across values and provides the "precision instrument" quality of the aesthetic.

**Secondary (headings only, when distinct treatment needed):**
```css
font-family: 'DM Sans', 'Outfit', 'Space Grotesk', sans-serif;
```
Use only for page-level titles and marketing-facing text. Never for data values, labels, or body text in the app.

**Fallback (system mono):**
```css
font-family: ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', monospace;
```

**NEVER use:** `Inter`, `Roboto`, `Arial`, `Helvetica`, `system-ui`, `sans-serif` as an explicit choice.

---

## Size Scale

All sizes are explicit pixels — never Tailwind's `text-sm`/`text-base`/`text-lg` scale.

| Role | Size | Weight | Tracking | Case |
|------|------|--------|----------|------|
| Metric labels | `text-[10px]` | `font-medium` | `tracking-widest` | `uppercase` |
| Timestamps / meta | `text-[11px]` | `font-normal` | `tracking-normal` | normal |
| Body text | `text-[13px]` | `font-normal` | `tracking-normal` | normal |
| Data values | `text-[13px]` | `font-mono` | `tracking-tight` | normal |
| Large data values | `text-[14px]` | `font-semibold` | `tracking-tight` | normal |
| Nav items | `text-[11px]` | `font-medium` | `tracking-widest` | `uppercase` |
| Section headers | `text-[15px]` | `font-semibold` | `tracking-tight` | normal |
| Page titles | `text-[20px]` | `font-semibold` | `tracking-tight` | normal |
| Hero / splash | `text-[28px]` to `text-[36px]` | `font-bold` | `tracking-tighter` | normal |

---

## Hierarchy Construction

Hierarchy is established through **size + weight + opacity + case** — never through size alone.

**Example: KPI card header**
```
[10px uppercase tracking-widest text-white/40]  MONTHLY REVENUE
[20px font-semibold tracking-tight text-white/85]  $142,500
[11px text-white/40]  +12.4% vs last month
```

The 10px uppercase label, 20px value, and 11px delta create three distinct levels using size AND opacity, never relying on a single dimension.

---

## Line Height

| Text type | Line height |
|-----------|-------------|
| Labels, badges, single-line | `leading-none` |
| Compact body | `leading-snug` (1.375) |
| Standard body | `leading-relaxed` (1.625) |
| Long-form prose | `leading-7` (1.75) |

**Rule:** Data-dense areas use `leading-snug`. User-facing prose uses `leading-relaxed`.

---

## Letter Spacing

| Use case | Tailwind class |
|----------|---------------|
| Labels (UPPERCASE) | `tracking-widest` (0.1em) |
| Nav items (UPPERCASE) | `tracking-widest` (0.1em) |
| Page/section titles | `tracking-tight` (-0.025em) |
| Hero text | `tracking-tighter` (-0.05em) |
| Data values | `tracking-tight` (-0.025em) |
| Body text | `tracking-normal` (0) |

---

## Data Value Formatting

All numeric data values use `font-mono` with consistent alignment:

```tsx
// Currency
<span className="font-mono text-[14px] font-semibold text-white/85">
  $142,500
</span>

// Percentage
<span className="font-mono text-[13px] text-[#22c55e]">
  +12.4%
</span>

// Negative delta
<span className="font-mono text-[13px] text-[#ef4444]">
  −3.2%
</span>
```

**Always use monospace for numbers** — proportional fonts cause jitter when values update live.

---

## Prohibited Typography Patterns

| Pattern | Why banned |
|---------|-----------|
| `text-sm`, `text-base`, `text-lg` | Tailwind scale doesn't map to our precision system |
| `font-bold` on body text | Overloads the weight hierarchy |
| Mixed `text-gray-400`/`text-gray-600` | Not from our rgba-on-white system |
| `tracking-wide` on body text | Over-spaced, loses readability at small sizes |
| All-caps headings at large sizes | Looks like a poster, not an instrument |
| `font-light` or `font-thin` | On dark backgrounds: illegible at small sizes |
