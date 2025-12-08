# Phase E38: Founder Observatory v1

**Status**: In Progress
**Migration**: 527
**Started**: 2025-12-09

---

## Overview

Meta-systems operational telemetry for Unite-Hub founder intelligence. Provides high-level observability across performance, load, friction, and decay signals.

---

## Components

### Database Schema (Migration 527)

**Tables**:
- `founder_observatory_events` — Operational signal events
- `observatory_aggregates` — Time-series aggregated metrics

**ENUMs**:
- `observatory_event_type` — performance_spike, load_spike, friction_detected, decay_signal, anomaly_detected, system_health, user_experience, other
- `observatory_severity` — critical, high, medium, low, info

**Functions**:
- `record_observatory_event()` — Records new telemetry event
- `list_observatory_events()` — Query events with filters
- `get_observatory_summary()` — Aggregate stats for time range

**RLS Policies**: Full tenant isolation on all tables

---

### Service Layer

**File**: `src/lib/founder/observatoryService.ts`

**Exports**:
- `listObservatoryEvents(tenantId, filters?)` — Query with event_type/severity/limit filters
- `recordObservatoryEvent(args)` — Create new event
- `getObservatorySummary(tenantId, days?)` — Get summary for N days (default 7)

**Types**:
- `ObservatoryEventType` — Event type enum
- `ObservatorySeverity` — Severity level enum

---

### API Routes

**Endpoint**: `/api/founder/observatory`

**GET**:
- `?workspaceId=X` — Required tenant ID
- `?action=summary&days=N` — Get summary for N days
- `?eventType=X&severity=X&limit=N` — List events with filters

**POST**:
- Body: `{ eventType, severity, value?, description?, metadata? }`
- Returns: `{ eventId }`

---

### UI Page

**Route**: `/founder/observatory`

**Features**:
- Summary cards (total events, critical events, performance spikes, avg value)
- Filters (event type, severity, time range)
- Events list with severity badges
- Real-time refresh
- Design system compliant (bg-bg-card, text-text-primary, accent-500)

---

## Usage Example

```typescript
import { recordObservatoryEvent, getObservatorySummary } from "@/src/lib/founder/observatoryService";

// Record performance spike
await recordObservatoryEvent({
  tenantId: "uuid",
  eventType: "performance_spike",
  severity: "high",
  value: 1500, // ms response time
  description: "API latency exceeded threshold",
  metadata: { endpoint: "/api/contacts", p95_latency: 1500 },
});

// Get 7-day summary
const summary = await getObservatorySummary("uuid", 7);
console.log(summary.critical_events); // Count of critical events
```

---

## Integration Points

- **Agents**: Email agent, content agent, orchestrator can emit observatory events
- **API Monitoring**: Middleware can log performance spikes
- **System Health**: Cron jobs can report system health signals
- **Founder Dashboard**: Real-time telemetry feed for founder awareness

---

## Next Steps

1. Integrate observatory events into existing agents
2. Add automated threshold detection for performance spikes
3. Build real-time WebSocket feed for critical events
4. Create observatory analytics dashboard with trend charts

---

## Migration Notes

- Idempotent: DROP IF EXISTS for clean re-runs
- RLS: All tables have tenant_id with FOR ALL policies
- Functions: SECURITY DEFINER for cross-tenant aggregation
- No breaking changes: Purely additive schema

---

**Related Phases**:
- E39: Drift Detector
- E40: Early Warning System
- E41: Governance Forecaster
