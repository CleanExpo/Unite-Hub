---
name: scientific-luxury
description: Design system enforcement for Scientific Luxury tier UI. Triggers on "design", "UI", "component", "styling", "animation", or when creating React components. Enforces OLED black backgrounds, spectral colours, single-pixel borders, physics-based animations, and timeline layouts.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '2.0.1'
  locale: en-AU
---

# Scientific Luxury Design System

Visual DNA for NodeJS-Starter-V1 Framework. Rejects generic SaaS aesthetics in favour of precision meets elegance.

## Description

Enforces the Scientific Luxury design tier across all React components and UI work. Mandates OLED black backgrounds, single-pixel borders, spectral colour mapping, physics-based Framer Motion animations, timeline/orbital layouts, and JetBrains Mono typography for data. Rejects Bootstrap card grids, Lucide icons for status, rounded corners, and linear transitions.

## When to Apply

### Positive Triggers

- Creating new React components
- Styling UI elements
- Implementing animations
- Reviewing designs for compliance
- User mentions: "design", "UI", "component", "style", "animation"

### Negative Triggers

- Writing backend-only logic, API routes, or database schemas
- Optimising algorithms or data structures (use `council-of-logic` instead)
- Configuring CI/CD, deployment, or infrastructure

## Core Principle

**If it looks like a Bootstrap template, it's wrong.**

## Banned Elements

These patterns are explicitly **PROHIBITED**:

| Banned Element                                        | Why                    | Alternative                        |
| ----------------------------------------------------- | ---------------------- | ---------------------------------- |
| Standard Bootstrap/Tailwind cards                     | Generic, overused      | Timeline nodes, data strips        |
| Generic neon borders (`border-cyan-500`)              | Cheap gaming aesthetic | Single pixel borders with opacity  |
| Symmetrical grids (`grid-cols-2`, `grid-cols-4`)      | "The Bento Trap"       | Asymmetrical splits (40/60, 30/70) |
| Standard rounded corners (`rounded-lg`, `rounded-xl`) | Soft, unprofessional   | Sharp (`rounded-sm`) or none       |
| Lucide/FontAwesome icons for status                   | Visual noise           | Breathing orbs, pulse indicators   |
| Linear transitions                                    | Mechanical, lifeless   | Physics-based easing curves        |
| White/light backgrounds                               | Generic SaaS look      | OLED Black (#050505)               |
| `text-muted-foreground`                               | Semantic but generic   | Explicit opacity (`text-white/40`) |

## Colour System

### OLED Black Foundation

```css
--background-primary: #050505; /* True OLED black */
--background-elevated: rgba(255, 255, 255, 0.01);
--background-hover: rgba(255, 255, 255, 0.02);
```

### Spectral Colours

| Colour      | Hex       | Usage                                |
| ----------- | --------- | ------------------------------------ |
| **Cyan**    | `#00F5FF` | Active, in-progress, primary actions |
| **Emerald** | `#00FF88` | Success, completed, approved         |
| **Amber**   | `#FFB800` | Warning, verification, awaiting      |
| **Red**     | `#FF4444` | Error, failed, rejected              |
| **Magenta** | `#FF00FF` | Escalation, human intervention       |
| **Grey**    | `#6B7280` | Pending, inactive, disabled          |

### Status Mapping

```typescript
const STATUS_COLOURS = {
  pending: '#6B7280',
  in_progress: '#00F5FF',
  awaiting_verification: '#FFB800',
  completed: '#00FF88',
  failed: '#FF4444',
  escalated: '#FF00FF',
} as const;
```

### Opacity Scale

```css
/* Text Hierarchy */
--text-primary: rgba(255, 255, 255, 0.9);
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);
--text-muted: rgba(255, 255, 255, 0.4);
--text-subtle: rgba(255, 255, 255, 0.3);

/* Border Hierarchy */
--border-visible: rgba(255, 255, 255, 0.1);
--border-subtle: rgba(255, 255, 255, 0.06);
```

## Typography

### Font Stack

```css
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* Data/Technical */
--font-sans: 'Inter', 'SF Pro Display', system-ui; /* Editorial/Names */
```

### Hierarchy

| Element       | Font | Size    | Weight           | Tracking  |
| ------------- | ---- | ------- | ---------------- | --------- |
| Hero Title    | Sans | 5xl-6xl | Extralight (200) | Tight     |
| Section Title | Sans | 2xl-4xl | Light (300)      | Tight     |
| Label         | Sans | 10px    | Normal           | 0.2-0.3em |
| Data Value    | Mono | lg-xl   | Medium (500)     | Normal    |
| Timestamp     | Mono | 10px    | Normal           | Normal    |

### Code Examples

```tsx
// Hero title
<h1 className="text-5xl font-extralight tracking-tight text-white">
  Command Centre
</h1>

// Label
<p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
  Real-Time Monitoring
</p>

// Data value
<span className="font-mono text-lg font-medium tabular-nums">
  {percentage}%
</span>
```

## Borders

### Single Pixel Philosophy

```css
border: 0.5px solid rgba(255, 255, 255, 0.06);
```

```tsx
className = 'border-[0.5px] border-white/[0.06]';
```

### Variants

```css
/* Subtle (default) */
border-[0.5px] border-white/[0.06]

/* Visible (hover/focus) */
border-[0.5px] border-white/[0.1]

/* Spectral (active state) */
border-[0.5px] border-cyan-500/30
```

### Corners

Only `rounded-sm` (2px) is permitted. No `rounded-lg`, `rounded-xl`.

Exception: Orbs and indicators can use `rounded-full`.

## Layout Patterns

### Timeline Layout (Primary)

Replaces card grids:

```tsx
<div className="relative pl-4">
  {/* Vertical spine */}
  <div className="absolute top-0 bottom-0 left-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

  <div className="space-y-8">
    {items.map((item, index) => (
      <TimelineNode key={item.id} item={item} index={index} />
    ))}
  </div>
</div>
```

### Data Strip Layout

Horizontal inline metrics:

```tsx
<div className="flex items-center gap-8 border-[0.5px] border-white/[0.06] bg-white/[0.01] px-6 py-3">
  {metrics.map((metric, index) => (
    <React.Fragment key={metric.label}>
      {index > 0 && <div className="h-4 w-px bg-white/10" />}
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] tracking-widest text-white/30 uppercase">{metric.label}</span>
        <span className="font-mono text-lg" style={{ color: metric.colour }}>
          {metric.value}
        </span>
      </div>
    </React.Fragment>
  ))}
</div>
```

### Asymmetrical Splits

Avoid 50/50. Use asymmetrical ratios:

```tsx
// 60/40 split
<div className="flex">
  <div className="flex-[3]">Main content</div>
  <div className="flex-[2]">Sidebar</div>
</div>

// 70/30 split
<div className="flex">
  <div className="flex-[7]">Main content</div>
  <div className="flex-[3]">Sidebar</div>
</div>
```

## Animation Patterns

### Framer Motion Required

All animations must use Framer Motion. CSS animations are prohibited.

### Approved Easings

```typescript
const EASINGS = {
  outExpo: [0.19, 1, 0.22, 1], // Primary - smooth deceleration
  smooth: [0.4, 0, 0.2, 1], // Gentle ease
  snappy: [0.68, -0.55, 0.265, 1.55], // Snappy with overshoot
};
```

### Breathing Animation

For active/live elements:

```tsx
<motion.div
  animate={{
    opacity: [1, 0.6, 1],
    scale: [1, 1.05, 1],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
/>
```

### Glow Pulse

For error or attention states:

```tsx
<motion.div
  animate={{
    boxShadow: [`0 0 0 ${colour}00`, `0 0 20px ${colour}40`, `0 0 0 ${colour}00`],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
  }}
/>
```

### Staggered Entry

For lists:

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{
    delay: index * 0.1,
    duration: 0.5,
    ease: [0.19, 1, 0.22, 1],
  }}
/>
```

## Component Patterns

### Breathing Orb (Status Indicator)

```tsx
function BreathingOrb({ colour, isActive, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };

  return (
    <motion.div
      className={cn(sizes[size], 'flex items-center justify-center rounded-full border-[0.5px]')}
      style={{
        borderColor: isActive ? `${colour}50` : 'rgba(255,255,255,0.1)',
        backgroundColor: isActive ? `${colour}10` : 'rgba(255,255,255,0.02)',
        boxShadow: isActive ? `0 0 30px ${colour}40` : 'none',
      }}
    >
      <motion.div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: colour }}
        animate={isActive ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}
```

## Australian Localisation

| Element  | Format             | Example           |
| -------- | ------------------ | ----------------- |
| Date     | DD/MM/YYYY         | 23/01/2026        |
| Time     | H:MM am/pm         | 2:30 pm           |
| Timezone | AEST/AEDT          | 2:30 pm AEDT      |
| Currency | AUD ($)            | $1,234.56         |
| Spelling | Australian English | colour, behaviour |

```typescript
// Date formatting
new Date().toLocaleDateString('en-AU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}); // "23/01/2026"
```

## Anti-Patterns

| Pattern | Problem | Correct Approach |
| ------- | ------- | ---------------- |
| Bootstrap/Tailwind card grids (`grid-cols-2`, `grid-cols-4`) | Generic SaaS aesthetic, "The Bento Trap" | Timeline nodes, data strips, or asymmetrical splits (40/60, 30/70) |
| Lucide/FontAwesome icons for status indicators | Visual noise, lacks scientific precision | Breathing orbs with spectral colours and glow pulse animations |
| White or light backgrounds | Violates OLED black foundation | Use `#050505` as primary background with `rgba(255,255,255,0.01)` elevation |
| `rounded-lg` or `rounded-xl` corners | Soft, unprofessional appearance | Only `rounded-sm` (2px) permitted; `rounded-full` for orbs only |
| Linear CSS transitions (`transition: all 0.3s linear`) | Mechanical, lifeless motion | Framer Motion with physics-based easing (`[0.19, 1, 0.22, 1]`) |

## Checklist for New Components

Before committing any new UI component, verify:

- [ ] Uses OLED Black (`#050505`) background
- [ ] Uses single pixel borders (`border-[0.5px] border-white/[0.06]`)
- [ ] Uses spectral colours for status (not semantic Tailwind)
- [ ] Uses Framer Motion for animations (not CSS transitions)
- [ ] Uses JetBrains Mono for data values
- [ ] Uses editorial typography for names/titles
- [ ] Uses physics-based easing (`[0.19, 1, 0.22, 1]`)
- [ ] Avoids card grids (uses timeline or data strip)
- [ ] Avoids Lucide icons for status (uses breathing orbs)
- [ ] Includes breathing/glow animations for active states
- [ ] Uses Australian date/time formats

## Response Format

```
[AGENT_ACTIVATED]: Scientific Luxury
[PHASE]: {Audit | Implementation | Review}
[STATUS]: {in_progress | complete}

{design analysis or component guidance}

[NEXT_ACTION]: {what to do next}
```

---

**SCIENTIFIC LUXURY DESIGN SYSTEM - LOCKED**
