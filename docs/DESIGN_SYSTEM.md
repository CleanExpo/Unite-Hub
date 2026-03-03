# Design System - Scientific Luxury Tier

> **Visual DNA for NodeJS-Starter-V1 Framework**
> Version 2.0.1 | Australian English (en-AU)

## Philosophy

This design system rejects generic SaaS aesthetics in favour of a **Scientific Luxury** approach - where precision meets elegance. Every pixel serves a purpose. Every animation communicates state. Every colour carries meaning.

**Core Principle**: If it looks like a Bootstrap template, it's wrong.

---

## Banned Elements

These patterns are explicitly **PROHIBITED** in this framework:

| Banned Element                                        | Why It's Banned                | Alternative                        |
| ----------------------------------------------------- | ------------------------------ | ---------------------------------- |
| Standard Bootstrap/Tailwind cards                     | Generic, overused              | Timeline nodes, data strips        |
| Generic neon borders (`border-cyan-500`)              | Cheap gaming aesthetic         | Single pixel borders with opacity  |
| Symmetrical grids (`grid-cols-2`, `grid-cols-4`)      | "The Bento Trap" - lazy layout | Asymmetrical splits (40/60, 30/70) |
| Standard rounded corners (`rounded-lg`, `rounded-xl`) | Soft, unprofessional           | Sharp (`rounded-sm`) or none       |
| Lucide/FontAwesome icons for status                   | Visual noise                   | Breathing orbs, pulse indicators   |
| Linear transitions (`transition: all 0.3s linear`)    | Mechanical, lifeless           | Physics-based easing curves        |
| White/light backgrounds                               | Generic SaaS look              | OLED Black (#050505)               |
| `text-muted-foreground`                               | Semantic but generic           | Explicit opacity (`text-white/40`) |

---

## Colour System

### OLED Black Foundation

```css
/* Primary Background */
--background-primary: #050505; /* True OLED black */
--background-elevated: rgba(255, 255, 255, 0.01);
--background-hover: rgba(255, 255, 255, 0.02);
```

### Spectral Colours

Status and state are communicated through a spectral colour system:

| Colour      | Hex       | HSL                   | Usage                                |
| ----------- | --------- | --------------------- | ------------------------------------ |
| **Cyan**    | `#00F5FF` | `hsl(183, 100%, 50%)` | Active, in-progress, primary actions |
| **Emerald** | `#00FF88` | `hsl(152, 100%, 50%)` | Success, completed, approved         |
| **Amber**   | `#FFB800` | `hsl(43, 100%, 50%)`  | Warning, verification, awaiting      |
| **Red**     | `#FF4444` | `hsl(0, 100%, 64%)`   | Error, failed, rejected              |
| **Magenta** | `#FF00FF` | `hsl(300, 100%, 50%)` | Escalation, human intervention       |
| **Grey**    | `#6B7280` | `hsl(220, 9%, 46%)`   | Pending, inactive, disabled          |

### Opacity Scale

```css
/* Text Hierarchy */
--text-primary: rgba(255, 255, 255, 0.9);
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.5);
--text-muted: rgba(255, 255, 255, 0.4);
--text-subtle: rgba(255, 255, 255, 0.3);
--text-ghost: rgba(255, 255, 255, 0.2);

/* Border Hierarchy */
--border-visible: rgba(255, 255, 255, 0.1);
--border-subtle: rgba(255, 255, 255, 0.06);
--border-ghost: rgba(255, 255, 255, 0.03);
```

### Spectral Colour Usage in Code

```typescript
// TypeScript constant for spectral colours
const SPECTRAL_COLOURS = {
  cyan: '#00F5FF',
  emerald: '#00FF88',
  amber: '#FFB800',
  red: '#FF4444',
  magenta: '#FF00FF',
  grey: '#6B7280',
} as const;

// Status to colour mapping
const STATUS_COLOURS: Record<Status, string> = {
  pending: SPECTRAL_COLOURS.grey,
  in_progress: SPECTRAL_COLOURS.cyan,
  awaiting_verification: SPECTRAL_COLOURS.amber,
  completed: SPECTRAL_COLOURS.emerald,
  failed: SPECTRAL_COLOURS.red,
  escalated: SPECTRAL_COLOURS.magenta,
};
```

### Glow Effects

Spectral colours should glow when active:

```css
/* Cyan glow */
box-shadow:
  0 0 20px rgba(0, 245, 255, 0.4),
  0 0 40px rgba(0, 245, 255, 0.2);

/* Emerald glow */
box-shadow:
  0 0 20px rgba(0, 255, 136, 0.4),
  0 0 40px rgba(0, 255, 136, 0.2);

/* Text glow */
text-shadow: 0 0 20px rgba(0, 245, 255, 0.6);
```

---

## Typography

### Font Stack

```css
/* Data/Technical Values */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;

/* Editorial/Names */
--font-sans: 'Inter', 'SF Pro Display', system-ui, sans-serif;
```

### Typography Hierarchy

| Element           | Font | Size    | Weight           | Tracking  | Example                 |
| ----------------- | ---- | ------- | ---------------- | --------- | ----------------------- |
| **Hero Title**    | Sans | 5xl-6xl | Extralight (200) | Tight     | "Command Centre"        |
| **Section Title** | Sans | 2xl-4xl | Light (300)      | Tight     | "Alan Turing"           |
| **Label**         | Sans | 10px    | Normal           | 0.2-0.3em | "REAL-TIME MONITORING"  |
| **Data Value**    | Mono | lg-xl   | Medium (500)     | Normal    | "87%"                   |
| **Timestamp**     | Mono | 10px    | Normal           | Normal    | "2 minutes ago"         |
| **Body**          | Mono | xs-sm   | Normal           | Normal    | "Processing request..." |

### Typography in Code

```tsx
// Hero title - Editorial
<h1 className="text-5xl font-extralight tracking-tight text-white lg:text-6xl">
  Command Centre
</h1>

// Section label - Uppercase tracking
<p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
  Real-Time Monitoring
</p>

// Data value - Monospace
<span className="font-mono text-lg font-medium tabular-nums">
  {percentage}%
</span>

// Agent name - Light editorial
<h3 className="text-2xl font-light tracking-tight">
  {agentName}
</h3>
```

---

## Borders

### Single Pixel Philosophy

All borders use **0.5px width** with low opacity:

```css
/* Standard border */
border: 0.5px solid rgba(255, 255, 255, 0.06);

/* Tailwind class */
className="border-[0.5px] border-white/[0.06]"
```

### Border Variants

```css
/* Subtle (default) */
border-[0.5px] border-white/[0.06]

/* Visible (hover/focus) */
border-[0.5px] border-white/[0.1]

/* Spectral (active state) */
border-[0.5px] border-cyan-500/30
style={{ borderColor: `${spectralColour}50` }}
```

### Rounded Corners

Only `rounded-sm` (2px) is permitted. No `rounded-lg`, `rounded-xl`, or `rounded-full` on containers.

Exception: Orbs and indicators can use `rounded-full`.

---

## Layout Patterns

### Timeline Layout

The primary layout pattern. Replaces card grids.

```tsx
<div className="relative pl-4">
  {/* Vertical spine */}
  <div className="absolute top-0 bottom-0 left-8 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

  {/* Timeline nodes */}
  <div className="space-y-8">
    {items.map((item, index) => (
      <TimelineNode key={item.id} item={item} index={index} />
    ))}
  </div>
</div>
```

### Data Strip Layout

Horizontal inline metrics. Replaces metric tile grids.

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

Avoid 50/50 splits. Use asymmetrical ratios:

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

---

## Animation Patterns

### Framer Motion Required

All animations must use Framer Motion. CSS animations are prohibited except for simple opacity/transform on non-interactive elements.

### Easing Curves

```typescript
// Approved easings
const EASINGS = {
  // Smooth deceleration - primary easing
  outExpo: [0.19, 1, 0.22, 1],

  // Gentle ease
  smooth: [0.4, 0, 0.2, 1],

  // Snappy
  snappy: [0.68, -0.55, 0.265, 1.55],

  // Standard ease in-out
  easeInOut: 'easeInOut',
};

// Usage
<motion.div
  transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
/>
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

### Glow Pulse Animation

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

For lists and grids:

```tsx
{
  items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.19, 1, 0.22, 1],
      }}
    />
  ));
}
```

### AnimatePresence for Lists

```tsx
<AnimatePresence mode="popLayout">
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    />
  ))}
</AnimatePresence>
```

---

## Component Patterns

### Breathing Orb

The primary status indicator:

```tsx
interface BreathingOrbProps {
  colour: string;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function BreathingOrb({ colour, isActive, size = 'md' }: BreathingOrbProps) {
  const sizes = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };

  return (
    <motion.div
      className={cn(sizes[size], 'flex items-center justify-center rounded-full border-[0.5px]')}
      style={{
        borderColor: isActive ? `${colour}50` : 'rgba(255,255,255,0.1)',
        backgroundColor: isActive ? `${colour}10` : 'rgba(255,255,255,0.02)',
        boxShadow: isActive ? `0 0 30px ${colour}40, 0 0 60px ${colour}20` : 'none',
      }}
    >
      {/* Inner breathing core */}
      {isActive && (
        <motion.div
          className="absolute inset-2 rounded-full"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: `radial-gradient(circle, ${colour}40 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Centre indicator */}
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

### Timeline Node

```tsx
interface TimelineNodeProps {
  title: string;
  subtitle: string;
  status: Status;
  index: number;
}

function TimelineNode({ title, subtitle, status, index }: TimelineNodeProps) {
  const colour = STATUS_COLOURS[status];
  const isActive = status === 'in_progress';

  return (
    <motion.div
      className="relative flex items-start gap-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.19, 1, 0.22, 1],
      }}
    >
      {/* Orb */}
      <BreathingOrb colour={colour} isActive={isActive} />

      {/* Content */}
      <div className="flex-1 pt-1">
        <h3
          className="text-2xl font-light tracking-tight"
          style={{ color: isActive ? colour : 'rgba(255,255,255,0.7)' }}
        >
          {title}
        </h3>
        <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">{subtitle}</p>
      </div>
    </motion.div>
  );
}
```

### Connection Indicator

```tsx
function ConnectionIndicator({
  status,
}: {
  status: 'connected' | 'reconnecting' | 'disconnected';
}) {
  const config = {
    connected: { colour: '#00FF88', label: 'Live' },
    reconnecting: { colour: '#FFB800', label: 'Reconnecting' },
    disconnected: { colour: '#FF4444', label: 'Offline' },
  };

  const { colour, label } = config[status];

  return (
    <div className="flex items-center gap-2 rounded-sm border-[0.5px] border-white/10 px-3 py-1.5">
      <motion.span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colour }}
        animate={
          status === 'connected'
            ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }
            : status === 'reconnecting'
              ? { opacity: [1, 0.5, 1] }
              : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: colour }}>
        {label}
      </span>
    </div>
  );
}
```

---

## Empty States

Empty states use breathing animations to indicate "alive but waiting":

```tsx
function EmptyState({ message, submessage }: { message: string; submessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Breathing orb */}
      <motion.div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-[0.5px] border-white/10"
        animate={{
          boxShadow: [
            '0 0 0 rgba(255,255,255,0.1)',
            '0 0 30px rgba(255,255,255,0.05)',
            '0 0 0 rgba(255,255,255,0.1)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.div
          className="h-3 w-3 rounded-full bg-white/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Text */}
      <h3 className="mb-2 text-xl font-light text-white">{message}</h3>
      {submessage && <p className="font-mono text-xs text-white/40">{submessage}</p>}
    </div>
  );
}
```

---

## Australian Localisation

All dates, times, and content must follow Australian conventions:

| Element  | Format             | Example                         |
| -------- | ------------------ | ------------------------------- |
| Date     | DD/MM/YYYY         | 23/01/2026                      |
| Time     | H:MM am/pm         | 2:30 pm                         |
| Timezone | AEST/AEDT          | 2:30 pm AEDT                    |
| Currency | AUD ($)            | $1,234.56                       |
| Spelling | Australian English | colour, behaviour, organisation |

```typescript
// Date formatting
new Date().toLocaleDateString('en-AU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}); // "23/01/2026"

// Time formatting
new Date().toLocaleTimeString('en-AU', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}); // "2:30 pm"
```

---

## Quick Reference

### Tailwind Classes Cheatsheet

```tsx
// Container
className="bg-[#050505] border-[0.5px] border-white/[0.06] rounded-sm"

// Text hierarchy
className="text-5xl font-extralight tracking-tight text-white"  // Hero
className="text-[10px] uppercase tracking-[0.3em] text-white/30"  // Label
className="font-mono text-lg font-medium tabular-nums"  // Data value

// Spectral colour application
style={{ color: '#00F5FF' }}  // Cyan text
style={{ backgroundColor: '#00F5FF10' }}  // Cyan bg 10%
style={{ borderColor: '#00F5FF50' }}  // Cyan border 50%
style={{ boxShadow: '0 0 20px #00F5FF40' }}  // Cyan glow

// Timeline spine
className="absolute bottom-0 left-8 top-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"
```

### Framer Motion Patterns

```tsx
// Entry animation
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: index * 0.1, ease: [0.19, 1, 0.22, 1] }}

// Breathing
animate={{ opacity: [1, 0.6, 1], scale: [1, 1.05, 1] }}
transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}

// Glow pulse
animate={{ boxShadow: [`0 0 0 ${colour}00`, `0 0 20px ${colour}40`, `0 0 0 ${colour}00`] }}
transition={{ duration: 1.5, repeat: Infinity }}
```

---

## Component Inventory

### Refactored (Scientific Luxury Tier)

| Component             | Location                            | Purpose                           |
| --------------------- | ----------------------------------- | --------------------------------- |
| `CouncilOfLogic`      | `components/council-of-logic/`      | Mathematical validation interface |
| `CouncilNode`         | `components/council-of-logic/`      | Individual council member node    |
| `StatusCommandCentre` | `components/status-command-centre/` | Agent monitoring dashboard        |
| `AgentNode`           | `components/status-command-centre/` | Timeline agent status node        |
| `DataStrip`           | `components/status-command-centre/` | Horizontal metrics display        |
| `NotificationStream`  | `components/status-command-centre/` | Real-time event feed              |

### Deprecated (Generic)

These components remain for backwards compatibility but should not be used in new development:

| Component           | Replacement            |
| ------------------- | ---------------------- |
| `AgentActivityCard` | `AgentNode`            |
| `MetricTile`        | `DataStrip`            |
| `ProgressOrb`       | `BreathingOrb` pattern |

---

## Checklist for New Components

Before committing any new UI component, verify:

- [ ] Uses OLED Black (`#050505`) background
- [ ] Uses single pixel borders (`border-[0.5px] border-white/[0.06]`)
- [ ] Uses spectral colours for status (not semantic Tailwind colours)
- [ ] Uses Framer Motion for animations (not CSS transitions)
- [ ] Uses JetBrains Mono for data values
- [ ] Uses editorial typography for names/titles
- [ ] Uses physics-based easing (`[0.19, 1, 0.22, 1]`)
- [ ] Avoids card grids (uses timeline or data strip)
- [ ] Avoids Lucide icons for status (uses breathing orbs)
- [ ] Includes breathing/glow animations for active states
- [ ] Uses Australian date/time formats

---

**GENESIS PROTOCOL v2.0.1 - DESIGN SYSTEM LOCKED**
