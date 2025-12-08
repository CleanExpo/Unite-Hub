# Phase E39: Autonomous Drift Detector

**Status**: In Progress
**Migration**: 528
**Started**: 2025-12-09

---

## Overview

Autonomous detection of configuration, behavioral, and schema drift across Unite-Hub systems. Tracks expected vs actual values and status lifecycle.

---

## Components

### Database Schema (Migration 528)

**Tables**:
- `drift_events` — Detected drift events with lifecycle tracking
- `drift_baselines` — Expected baseline configurations

**ENUMs**:
- `drift_type` — configuration, behavioral, schema, performance, security, compliance, other
- `drift_severity` — low, medium, high, critical
- `drift_status` — detected, acknowledged, resolved, ignored

**Functions**:
- `record_drift_event()` — Records new drift event
- `update_drift_status()` — Update drift status (detected → acknowledged → resolved)
- `list_drift_events()` — Query events with filters
- `get_drift_summary()` — Aggregate stats

**RLS Policies**: Full tenant isolation on all tables

---

### Service Layer

**File**: `src/lib/founder/driftService.ts`

**Exports**:
- `listDriftEvents(tenantId, filters?)` — Query with driftType/status/severity filters
- `recordDriftEvent(args)` — Create new drift event
- `updateDriftStatus(eventId, status)` — Update event status
- `getDriftSummary(tenantId)` — Get aggregate statistics

**Types**:
- `DriftType` — Drift classification enum
- `DriftSeverity` — Severity level enum
- `DriftStatus` — Lifecycle status enum

---

### API Routes

**Endpoint**: `/api/founder/drift`

**GET**:
- `?workspaceId=X` — Required tenant ID
- `?action=summary` — Get drift summary
- `?driftType=X&status=X&severity=X` — List events with filters

**POST**:
- `?action=update-status` — Update drift status
  - Body: `{ eventId, status }`
- Otherwise: Record new drift event
  - Body: `{ driftType, severity, title, description?, expectedValue?, actualValue?, metadata? }`
  - Returns: `{ eventId }`

---

### UI Page

**Route**: `/founder/drift`

**Features**:
- Summary cards (total events, active events, critical events)
- Filters (drift type, status, severity)
- Events list with severity/status badges
- Status update actions (acknowledge, ignore, resolve)
- Expected vs actual value display
- Timeline tracking (detected, acknowledged, resolved timestamps)
- Design system compliant

---

## Usage Example

```typescript
import { recordDriftEvent, updateDriftStatus } from "@/src/lib/founder/driftService";

// Record configuration drift
const eventId = await recordDriftEvent({
  tenantId: "uuid",
  driftType: "configuration",
  severity: "high",
  title: "API rate limit changed",
  description: "Rate limit decreased from 1000 to 500 req/min",
  expectedValue: "1000 req/min",
  actualValue: "500 req/min",
  metadata: { service: "claude-api", changed_by: "auto-scale" },
});

// Acknowledge drift
await updateDriftStatus(eventId, "acknowledged");

// Resolve drift
await updateDriftStatus(eventId, "resolved");
```

---

## Drift Detection Scenarios

1. **Configuration Drift**: Environment variables, feature flags, service configs changed
2. **Behavioral Drift**: API response patterns, user behavior metrics deviate from baseline
3. **Schema Drift**: Database schema changes without migration tracking
4. **Performance Drift**: Response times, throughput degrade over time
5. **Security Drift**: Auth policies, permission changes, cert expirations
6. **Compliance Drift**: Data retention policies, audit log gaps

---

## Integration Points

- **Deployment Hooks**: Check for config drift on deploy
- **Migration System**: Detect schema drift from manual table changes
- **APM Integration**: Alert on behavioral drift from metrics
- **Security Scans**: Flag security policy drift
- **Compliance Engine**: Track regulatory compliance drift

---

## Next Steps

1. Build automated drift detection agents for each drift type
2. Integrate with deployment pipeline for config drift checks
3. Add baseline management UI for defining expected values
4. Create drift resolution workflows with approval gates
5. Build drift trends analytics dashboard

---

## Migration Notes

- Idempotent: DROP IF EXISTS for clean re-runs
- RLS: All tables have tenant_id with FOR ALL policies
- Lifecycle tracking: detected_at, acknowledged_at, resolved_at timestamps
- Status transitions: detected → acknowledged/ignored → resolved
- Functions: SECURITY DEFINER for cross-tenant aggregation
- No breaking changes: Purely additive schema

---

**Related Phases**:
- E38: Founder Observatory
- E40: Early Warning System
- E41: Governance Forecaster
