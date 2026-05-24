---
name: dashboard-patterns
description: >-
  Real-time dashboard patterns codifying the project's Status Command
  Centre component library, timeline/orbital layout, Supabase Realtime
  integration, and Scientific Luxury design enforcement for all data
  visualisation surfaces.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Dashboard Patterns - Real-Time Data Visualisation

Codifies the project's existing dashboard architecture: the Status Command Centre component library, backend analytics APIs, and the Scientific Luxury design rules that govern every data surface. Enforces timeline layout, spectral colours, physics-based animations, and Australian locale formatting.

## Description

Codifies real-time dashboard patterns for NodeJS-Starter-V1 including the Status Command Centre component library, timeline/orbital layouts, Supabase Realtime integration, spectral colour mapping, and Scientific Luxury design enforcement for all data visualisation surfaces.

---

## When to Apply

### Positive Triggers

- Building new dashboard pages or metric displays
- Adding real-time data visualisation components
- Integrating Supabase Realtime for live updates
- Creating loading skeletons or empty states for dashboards
- Composing MetricTile, DataStrip, or ProgressOrb components
- Reviewing dashboard layouts for Scientific Luxury compliance
- User mentions: "dashboard", "metrics display", "real-time", "monitoring UI", "command centre"

### Negative Triggers

- Collecting or storing metrics data (use `metrics-collector` instead)
- Designing email templates (use `email-template` instead)
- Adding log statements (use `structured-logging` instead)
- Implementing non-dashboard UI components (use `scientific-luxury` instead)

## Core Directives

### The Three Laws of Dashboards

1. **Timeline, never grid**: No `grid-cols-2`/`grid-cols-4` layouts. Use vertical timelines, horizontal data strips, and orbital arrangements.
2. **Spectral, never static**: Every status maps to a spectral colour with breathing animation. No grey placeholder states.
3. **Real-time, never stale**: Live data via Supabase Realtime or 30-second polling. Always show connection status.

---

## Existing Project Infrastructure

### Component Library

**Location**: `apps/web/components/status-command-centre/`

| Category | Components |
|----------|-----------|
| **Main** | `StatusCommandCentre` (full/compact/minimal variants) |
| **Data Display** | `DataStrip` (horizontal metrics), `MetricTile` (stat tile with trends) |
| **Visualisation** | `ProgressOrb`, `ProgressRing`, `StatusPulse`, `StatusBadge` |
| **Activity** | `AgentNode`, `AgentActivityCard`, `ActivityTimeline`, `AgentThinkingIndicator` |
| **Utility** | `NotificationStream`, `ElapsedTimer` |
| **Hooks** | `useElapsedTime`, `useCountdown`, `useStatusTransitions`, `useStatusColourTransition` |
| **Utils** | `formatElapsedAU`, `formatTimestampAU`, `formatDateAU`, `getAustralianTimezone` |

### Dashboard Pages

| Page | Location | Data Source |
|------|----------|-------------|
| Agent Dashboard | `apps/web/app/(dashboard)/agents/page.tsx` | `/api/agents/stats`, `/api/agents/list` |
| Analytics Dashboard | `apps/web/app/dashboard-analytics/page.tsx` | `/api/analytics/metrics/overview` |
| Status Command Centre | Embedded component | Supabase Realtime (`agent_runs` table) |

### Backend APIs

| Route | Location | Returns |
|-------|----------|---------|
| `/analytics/metrics/overview` | `apps/backend/src/api/routes/analytics.py` | Runs, success rate, cost, tokens |
| `/analytics/metrics/agents` | Same file | Per-agent performance breakdown |
| `/analytics/metrics/costs` | Same file | Cost by model, token breakdown |
| `/api/agents/stats` | `apps/backend/src/api/routes/agent_dashboard.py` | Aggregate agent statistics |
| `/api/agents/{id}/health` | Same file | `AgentHealthReport` model |
| `/api/agents/performance/trends` | Same file | Time-series trend data |

---

## Layout Patterns

### BANNED: Card Grid

```tsx
// REJECTED — violates Scientific Luxury and Timeline law
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### REQUIRED: Timeline Layout

The `StatusCommandCentre` implements a vertical timeline spine with agent nodes:

```tsx
<div className="relative pl-4">
  {/* Vertical Timeline Spine */}
  <motion.div
    initial={{ scaleY: 0 }}
    animate={{ scaleY: 1 }}
    transition={{ delay: 0.3, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
    className="absolute top-0 bottom-0 left-8 w-px origin-top
               bg-gradient-to-b from-white/10 via-white/5 to-transparent"
  />
  {/* Agent Nodes along the spine */}
  <div className="space-y-8">
    {runs.map((run, index) => (
      <AgentNode key={run.id} run={run} index={index} />
    ))}
  </div>
</div>
```

### REQUIRED: Horizontal Data Strip

Replace metric grids with `DataStrip` — inline horizontal layout with spectral-coloured values:

```tsx
<DataStrip
  metrics={[
    { label: 'Total', value: runs.length },
    { label: 'Active', value: activeRuns.length, variant: 'info' },
    { label: 'Completed', value: completedRuns.length, variant: 'success' },
    { label: 'Failed', value: failedRuns.length, variant: 'error' },
  ]}
/>
```

DataStrip uses JetBrains Mono for values, `text-[10px] tracking-widest uppercase` for labels, pipe separators between metrics, and spectral glow on non-zero highlighted values.

---

## Spectral Colour Mapping

Every `AgentRunStatus` maps to a spectral colour defined in `constants.ts`:

| Status | Colour | HSL | Animation |
|--------|--------|-----|-----------|
| `pending` | Slate | `hsl(220 14% 46%)` | Pulse (idle) |
| `in_progress` | Blue | `hsl(217 91% 60%)` | Spin (active) |
| `awaiting_verification` | Amber | `hsl(38 92% 50%)` | Pulse (active) |
| `verification_in_progress` | Amber | `hsl(38 92% 50%)` | Spin (active) |
| `verification_passed` | Green | `hsl(142 76% 36%)` | None (idle) |
| `verification_failed` | Red | `hsl(0 84% 60%)` | Pulse (urgent) |
| `completed` | Emerald | `#00FF88` | None (idle) |
| `failed` | Red | `#FF4444` | Pulse (urgent) |
| `blocked` | Slate | Muted | None (idle) |
| `escalated_to_human` | Magenta | `#FF00FF` | Pulse (urgent) |

Access via `getStatusConfig(status)` from `constants.ts`. Each config includes `colour` (primary, glow, background), `icon`, `animation`, and `intensity`.

DataStrip variants use simplified spectral colours: `info=#00F5FF`, `success=#00FF88`, `warning=#FFB800`, `error=#FF4444`.

---

## Animation Patterns

All animations use Framer Motion. CSS transitions are **BANNED**.

### Staggered Entry

Components animate in sequence with delay offsets:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 * index, ease: [0.19, 1, 0.22, 1] }}
>
```

### Breathing Orbs

Status indicators use breathing animation for active states:

```tsx
<motion.span
  className="h-1.5 w-1.5 rounded-full"
  style={{ backgroundColor: config.colour.primary }}
  animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
/>
```

### Ambient Glow

Active agents trigger a radial gradient background glow:

```tsx
{activeRuns.length > 0 && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.1 }}
    className="pointer-events-none absolute inset-0"
    style={{ background: 'radial-gradient(ellipse at 20% 10%, hsl(217 91% 60% / 0.15) 0%, transparent 50%)' }}
  />
)}
```

### Status Transitions

Use `useStatusTransitions` hook to detect state changes and apply transition animations (success ripple, error shake).

---

## Data Fetching Patterns

### Server Components (Initial Load)

Use Next.js Server Components for initial data fetch with `cache: 'no-store'`:

```tsx
async function fetchAgentStats() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
  const res = await fetch(`${backendUrl}/api/agents/stats`, { cache: 'no-store' });
  if (!res.ok) return FALLBACK_STATS;
  return res.json();
}
```

Always provide fallback data so the page renders even when the backend is unavailable.

### Polling (Analytics Dashboard)

For non-realtime pages, poll at 30-second intervals:

```tsx
useEffect(() => {
  fetchMetrics();
  const interval = setInterval(fetchMetrics, 30_000);
  return () => clearInterval(interval);
}, []);
```

### Supabase Realtime (Command Centre)

For the Status Command Centre, subscribe to `agent_runs` table changes:

```tsx
const channel = supabase
  .channel('agent-runs')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_runs' },
    (payload: RealtimePayload) => {
      if (payload.eventType === 'INSERT') addRun(payload.new);
      if (payload.eventType === 'UPDATE') updateRun(payload.new);
    })
  .subscribe();
```

Types `RealtimeEvent`, `RealtimePayload`, and `ConnectionStatus` are defined in `types.ts`.

### Connection Status

Always display connection state using the `ConnectionIndicator` component:
- **Connected** (Emerald breathing dot + "Live" label)
- **Reconnecting** (Amber dot + "Reconnecting" label)
- **Disconnected** (Red dot + "Offline" label)

---

## Loading & Empty States

### Loading Skeleton

Every dashboard page must show a skeleton that matches the final layout structure:

```tsx
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <motion.div
        className="h-10 w-64 rounded-sm bg-white/5"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* More skeleton elements matching the real layout */}
    </div>
  );
}
```

Rules: Use `bg-white/5` for skeleton blocks, `rounded-sm` only, breathing opacity animation, staggered delays per element.

### Empty State

When no data is available, show a centred empty state with a breathing orb:

```tsx
<div className="flex flex-col items-center justify-center py-20">
  <motion.div
    className="h-3 w-3 rounded-full bg-white/20"
    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  />
  <h3 className="text-xl font-light text-white">No Active Agents</h3>
  <p className="font-mono text-xs text-white/40">Description text.</p>
</div>
```

---

## Component Composition

### New Dashboard Page Template

Every dashboard page follows this structure:

```tsx
// 1. Server Component wrapper (data fetch)
export default async function DashboardPage() {
  const data = await fetchData();
  return (
    <div className="relative min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-8 py-6">
        <p className="text-[10px] tracking-[0.3em] text-white/30 uppercase">Category Label</p>
        <h1 className="text-4xl font-extralight tracking-tight text-white">Page Title</h1>
        <DataStrip metrics={[...]} />
      </header>

      {/* Content — timeline or orbital, never grid */}
      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardContent data={data} />
      </Suspense>

      {/* Footer */}
      <footer className="px-8 py-4">
        <p className="font-mono text-[10px] text-white/20">
          {new Date().toLocaleDateString('en-AU')}
        </p>
      </footer>
    </div>
  );
}
```

### When to Use Each Component

| Need | Component | Import From |
|------|-----------|-------------|
| Inline metrics row | `DataStrip` | `status-command-centre` |
| Single stat with trend | `MetricTile` | `status-command-centre` |
| Agent execution status | `AgentNode` | `status-command-centre` |
| Circular progress | `ProgressOrb` or `ProgressRing` | `status-command-centre` |
| Status dot | `StatusPulse` | `status-command-centre` |
| Status label | `StatusBadge` | `status-command-centre` |
| Step timeline | `ActivityTimeline` | `status-command-centre` |
| Notification sidebar | `NotificationStream` | `status-command-centre` |
| Elapsed time counter | `ElapsedTimer` | `status-command-centre` |

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|---|---|---|
| `grid-cols-2` / `grid-cols-4` metric cards | Violates Scientific Luxury layout rules | `DataStrip` or timeline layout |
| Standard `<Card>` with `rounded-lg` | Wrong corners, wrong aesthetic | `rounded-sm border-[0.5px] border-white/[0.06]` |
| CSS `transition: all 0.3s linear` | Banned by Bezier (Council of Logic) | Framer Motion with physics-based easing |
| White/light background dashboards | Violates OLED black requirement | `bg-[#050505]` always |
| No loading skeleton | Layout shift on data load | Skeleton matching final layout structure |
| No connection indicator | Users cannot tell if data is live | `ConnectionIndicator` in every realtime page |
| Hardcoded status colours | Drift from spectral palette | `getStatusConfig(status).colour` |
| `setInterval` without cleanup | Memory leak on unmount | `useEffect` with `clearInterval` in cleanup |

---

## Checklist for New Dashboard Pages

### Layout

- [ ] OLED black background (`bg-[#050505]`)
- [ ] Timeline or orbital layout (no card grids)
- [ ] `DataStrip` for summary metrics (not metric grid)
- [ ] Single pixel borders (`border-[0.5px] border-white/[0.06]`)
- [ ] `rounded-sm` only (no `rounded-lg`, `rounded-xl`)
- [ ] JetBrains Mono for data values

### Data

- [ ] Server Component for initial fetch with fallback data
- [ ] Polling interval (30s) or Supabase Realtime subscription
- [ ] Connection status indicator shown
- [ ] Loading skeleton matching final layout
- [ ] Empty state with breathing orb

### Animation

- [ ] Framer Motion for all transitions (no CSS transitions)
- [ ] Staggered entry for list items
- [ ] Breathing animation for active status indicators
- [ ] Ambient glow when agents are active

### Integration

- [ ] Uses `metrics-collector` `MetricsRegistry` for data source
- [ ] Spectral colours from `STATUS_CONFIG` constants
- [ ] Australian locale formatting (`formatDateAU`, `formatTimestampAU`)
- [ ] Types imported from `status-command-centre/types.ts`

---

## Response Format

```
[AGENT_ACTIVATED]: Dashboard Patterns
[PHASE]: {Design | Implementation | Review}
[STATUS]: {in_progress | complete}

{dashboard analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Scientific Luxury

- OLED black background, spectral colours, single-pixel borders, physics-based animations
- All dashboard components enforce the design system automatically via `constants.ts`

### Metrics Collector

- `MetricsRegistry` provides the data layer (counters, gauges, histograms)
- Time-series aggregation powers trend charts
- Summary endpoint feeds `DataStrip` and `MetricTile` components

### State Machine

- `AgentRunStatus` (10 states) maps directly to `STATUS_CONFIG` colour/animation entries
- `useStatusTransitions` hook handles state change animations

### Structured Logging

- Dashboard pages log `dashboard_loaded`, `dashboard_error` events
- Connection status changes logged for debugging

### Cron Scheduler

- Cron job metrics displayed via `DataStrip` or `MetricTile`
- Daily report data powers the analytics dashboard trends

## Australian Localisation (en-AU)

- **Date Format**: DD/MM/YYYY via `formatDateAU()` utility
- **Time**: H:MM am/pm AEST/AEDT via `formatTimeAU()` and `getAustralianTimezone()`
- **Currency**: AUD ($) — `total_cost_usd` converted to AUD for display
- **Spelling**: colour, behaviour, analyse, optimise, centre
- **Footer**: Australian date format in dashboard footers
