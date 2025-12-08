# Phase E40: Critical Systems Early-Warning Engine

**Status**: In Progress
**Migration**: 529
**Started**: 2025-12-09

---

## Overview

Critical system telemetry and early warning signals for Unite-Hub founder intelligence. Threshold-based alerting for resource exhaustion, capacity limits, error spikes, security anomalies, and compliance breaches.

---

## Components

### Database Schema (Migration 529)

**Tables**:
- `early_warning_events` — Triggered warning events with lifecycle tracking
- `warning_thresholds` — Configurable threshold definitions

**ENUMs**:
- `warning_signal_type` — resource_exhaustion, capacity_threshold, error_rate_spike, latency_degradation, security_anomaly, compliance_breach, data_quality, system_degradation, other
- `warning_risk_level` — info, watch, alert, critical
- `warning_status` — active, acknowledged, mitigated, resolved

**Functions**:
- `record_warning_event()` — Records new warning event
- `update_warning_status()` — Update warning status (active → acknowledged → mitigated → resolved)
- `list_warning_events()` — Query events with filters
- `get_warning_summary()` — Aggregate stats

**RLS Policies**: Full tenant isolation on all tables

---

### Service Layer

**File**: `src/lib/founder/earlyWarningService.ts`

**Exports**:
- `listWarningEvents(tenantId, filters?)` — Query with signalType/riskLevel/status filters
- `recordWarningEvent(args)` — Create new warning event
- `updateWarningStatus(eventId, status)` — Update event status
- `getWarningSummary(tenantId)` — Get aggregate statistics

**Types**:
- `WarningSignalType` — Signal classification enum
- `WarningRiskLevel` — Risk severity enum
- `WarningStatus` — Lifecycle status enum

---

### API Routes

**Endpoint**: `/api/founder/early-warning`

**GET**:
- `?workspaceId=X` — Required tenant ID
- `?action=summary` — Get warning summary
- `?signalType=X&riskLevel=X&status=X` — List events with filters

**POST**:
- `?action=update-status` — Update warning status
  - Body: `{ eventId, status }`
- Otherwise: Record new warning event
  - Body: `{ signalType, riskLevel, title, details?, thresholdValue?, actualValue?, metadata? }`
  - Returns: `{ eventId }`

---

### UI Page

**Route**: `/founder/early-warning`

**Features**:
- Summary cards (total warnings, active warnings, critical, alert level)
- Filters (signal type, risk level, status)
- Events list with risk level icons and badges
- Status update actions (acknowledge, mitigate, resolve)
- Threshold vs actual value display
- Timeline tracking (triggered, acknowledged, mitigated, resolved timestamps)
- Design system compliant with risk level color coding

---

## Usage Example

```typescript
import { recordWarningEvent, updateWarningStatus } from "@/src/lib/founder/earlyWarningService";

// Record resource exhaustion warning
const eventId = await recordWarningEvent({
  tenantId: "uuid",
  signalType: "resource_exhaustion",
  riskLevel: "critical",
  title: "Database connection pool exhausted",
  details: "Active connections at 95% capacity, approaching max limit",
  thresholdValue: 100, // max connections
  actualValue: 95, // current connections
  metadata: { database: "primary", region: "us-east-1" },
});

// Acknowledge warning
await updateWarningStatus(eventId, "acknowledged");

// Mitigate warning
await updateWarningStatus(eventId, "mitigated");

// Resolve warning
await updateWarningStatus(eventId, "resolved");
```

---

## Early Warning Scenarios

1. **Resource Exhaustion**: DB connections, memory, disk space, rate limits approaching max
2. **Capacity Threshold**: User accounts, API requests, storage nearing plan limits
3. **Error Rate Spike**: 5xx errors, failed jobs, API errors exceed baseline
4. **Latency Degradation**: P95/P99 latency increasing beyond SLA thresholds
5. **Security Anomaly**: Failed auth attempts, unusual access patterns, cert expirations
6. **Compliance Breach**: Data retention violations, audit log gaps, GDPR issues
7. **Data Quality**: Missing data, duplicate records, schema validation failures
8. **System Degradation**: Service health checks failing, cascading failures

---

## Integration Points

- **APM System**: Emit warnings from Datadog/Sentry/New Relic alerts
- **Resource Monitors**: CPU, memory, disk, network threshold checks
- **API Gateway**: Rate limit warnings, quota exhaustion alerts
- **Database Monitors**: Connection pool, query performance, replication lag
- **Security Scans**: OWASP checks, dependency vulnerabilities, auth failures
- **Compliance Audits**: Automated compliance violation detection
- **Cron Jobs**: Scheduled health checks emit warnings

---

## Next Steps

1. Build automated threshold monitors for each signal type
2. Integrate with APM systems (Datadog, Sentry, New Relic)
3. Add threshold configuration UI for custom warnings
4. Create escalation workflows for critical warnings
5. Build warning trends analytics with forecasting
6. Add Slack/email notifications for critical warnings
7. Implement auto-mitigation for known warning patterns

---

## Migration Notes

- Idempotent: DROP IF EXISTS for clean re-runs
- RLS: All tables have tenant_id with FOR ALL policies
- Threshold management: warning_thresholds table stores configurable limits
- Lifecycle tracking: triggered_at, acknowledged_at, mitigated_at, resolved_at timestamps
- Status transitions: active → acknowledged → mitigated → resolved
- Functions: SECURITY DEFINER for cross-tenant aggregation
- Risk level hierarchy: info < watch < alert < critical
- No breaking changes: Purely additive schema

---

**Related Phases**:
- E38: Founder Observatory
- E39: Drift Detector
- E41: Governance Forecaster
