# Guardian Industry Pack: Insurance & Claims Oversight

**Classification:** 🟡 CUSTOMER-SAFE
**Version:** 1.0.0
**Status:** Stable (GA)
**Last Updated:** December 13, 2025

---

## Overview

The Insurance & Claims Oversight Industry Pack is a read-only Guardian plugin providing insurance-specific operational intelligence for claims processing, fraud detection, and adjuster workload management.

**Key Features:**
- Heuristic signal detection: claims velocity, fraud risk, adjuster load, SLA drift, severity trending
- PII-safe, aggregate-only data model (no claim numbers, policy data, no identifiers)
- SOP-aligned operational alerts for claims teams
- Governance-aware (respects external sharing and AI policies)
- Zero impact on Guardian runtime (plugin-based architecture)

---

## Use Cases

### 1. Claims Intake Surge Detection
Detect rapid claim intake spikes indicating capacity pressure.

**Signal:** Claims Velocity Spike
**Trigger:** Incident count 1.5x+ above 7-day baseline
**Action:** Increase adjuster availability, review intake workflows

### 2. Fraud Pattern Identification
Identify potential fraud clusters from anomaly spikes.

**Signal:** Fraud Risk Cluster
**Trigger:** 5+ high-severity anomalies detected
**Action:** Escalate to fraud investigation team

### 3. Adjuster Workload Management
Monitor triage queue to prevent bottlenecks.

**Signal:** Adjuster Load Overload
**Trigger:** 10+ claims awaiting assignment
**Action:** Balance workload or hire temporary adjusters

### 4. SLA Compliance Monitoring
Track extended queue backlogs indicating SLA risk.

**Signal:** SLA Breach Pattern
**Trigger:** 7+ claims in queue for extended period
**Action:** Escalate delayed claims, review response timing

### 5. Claim Severity Trending
Monitor increasing risk profile indicating reserve adjustments.

**Signal:** Severity Drift
**Trigger:** Risk label elevated with upward trend
**Action:** Review high-value claims, adjust reserves

---

## Technical Architecture

### Plugin Manifest

Located at `src/lib/guardian/plugins/industry-insurance-pack/manifest.ts`

```typescript
{
  key: 'industry_insurance_pack',
  name: 'Industry Pack: Insurance & Claims Oversight',
  version: '1.0.0',
  capabilities: ['ui_panel', 'report'],
  routes: [{
    path: '/guardian/plugins/industry/insurance',
    title: 'Insurance Ops Dashboard',
    role: 'admin'
  }],
  governance: {
    piiSafe: true,
    requiresExternalSharing: false
  },
  requiredTiers: ['PROFESSIONAL', 'ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'h06_intelligence_dashboard'],
  requiresAI: false
}
```

### Signal Types

**File:** `src/lib/guardian/plugins/industry-insurance-pack/types.ts`

```typescript
InsuranceOpsSignalKey:
- claims_velocity_spike (incident ratio spike)
- fraud_risk_cluster (anomaly count spike)
- adjuster_load_overload (triage backlog buildup)
- sla_breach_pattern (extended queue persistence)
- severity_drift (risk label trending up)

SignalSeverity: 'low' | 'medium' | 'high'
SignalWindow: '24h' | '7d' | '30d'
SignalTrend: 'up' | 'flat' | 'down'
```

### Signal Derivation Service

**File:** `src/lib/guardian/plugins/industry-insurance-pack/signalService.ts`

**Function:** `deriveInsuranceSignals(aggregateData)`

Accepts Guardian aggregate metrics:
- 24h/7d alerts and incidents
- 24h/7d correlations
- Current risk label
- Triage backlog count (H04)
- Anomaly counts (H02)
- Feature availability flags

Returns `InsuranceOpsSnapshot`:
```typescript
{
  generatedAt: ISO timestamp,
  signals: InsuranceOpsSignal[],
  totals: {
    alerts: number,
    incidents: number,
    correlations: number,
    riskLabel: 'low' | 'medium' | 'high' | 'unknown'
  },
  warnings: string[] (e.g., "H02 not available"),
  disclaimer: string
}
```

### Dashboard UI

**File:** `src/app/guardian/plugins/industry/insurance/page.tsx`

**Route:** `/guardian/plugins/industry/insurance?workspaceId=<id>`

**Features:**
- Status cards: 24h alerts, incidents, correlations, overall risk
- Signal table: detected signals with severity, trend, rationale, suggested action
- Risk summary: high-risk alert if elevated
- Data quality warnings: lists unavailable features (H02, H04, etc.)
- Related resources: quick links to intelligence dashboard, risk scoring, triage queue
- Clear disclaimer: signals are heuristic, not compliance determinations
- Governance watermarks: INTERNAL badge if external sharing disabled

---

## Data Model (PII Safety)

### Aggregate-Only

The plugin receives ONLY aggregate metrics, never raw records:

| Data Type | Received | Reason |
|-----------|----------|--------|
| Alert count (24h) | ✅ Yes | Aggregate metric |
| Incident count (24h) | ✅ Yes | Aggregate metric |
| Correlation clusters (count) | ✅ Yes | Aggregate metric |
| Risk label (low/med/high) | ✅ Yes | Classification, no PII |
| Anomaly count (high severity) | ✅ Yes | Aggregate metric |
| Triage backlog count | ✅ Yes | Aggregate metric |
| Claim IDs or numbers | ❌ No | PII-unsafe |
| Policy details | ❌ No | PII-unsafe |
| Claimant information | ❌ No | PII-unsafe |
| Adjuster identifiers | ❌ No | PII-unsafe |
| Claim amounts | ❌ No | PII-unsafe |
| Raw claims data | ❌ No | PII-unsafe |

### Signal Structure

All signals generated by the plugin include:
- Generic rationale (e.g., "Claims intake 250% above baseline")
- Suggested action (e.g., "Check intake workflows")
- No claim identifiers, policy numbers, or customer names

---

## Enablement & Gating

### Tier Gating

| Tier | Access |
|------|--------|
| STARTER | ❌ Not available |
| PROFESSIONAL | ✅ Available |
| ENTERPRISE | ✅ Available |

### Feature Gating

**Required:**
- `guardian_core` — Guardian must be running
- `h06_intelligence_dashboard` — H-series must be enabled

**Optional (graceful degradation):**
- `h02_anomaly_detection` — If missing, fraud risk signal shows warning
- `h04_incident_scoring` — If missing, adjuster load/SLA drift signals show warning

### Governance Gating

- **External Sharing:** Not required (plugin safe for internal only)
- **AI Usage:** Not required (AI not used in v1.0)

---

## Integration with PLUGIN-02 Marketplace

### Enablement via API

**Endpoint:** `POST /api/guardian/admin/plugins/industry_insurance_pack/enable?workspaceId=<id>`

**Body:**
```json
{
  "actor": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plugin \"industry_insurance_pack\" enabled for workspace"
}
```

**Constraint Checking:**
1. Workspace subscription tier checked (PROFESSIONAL or ENTERPRISE)
2. Required features validated (guardian_core, h06_intelligence_dashboard)
3. Governance policy enforced
4. Audit log entry created

### Disablement via API

**Endpoint:** `POST /api/guardian/admin/plugins/industry_insurance_pack/disable?workspaceId=<id>`

**Body:**
```json
{
  "actor": "admin@example.com"
}
```

---

## Configuration & Thresholds

**File:** `src/lib/guardian/plugins/industry-insurance-pack/types.ts`

**Default thresholds (adjustable):**

```typescript
claimsVelocityRatio: 1.5         // 1.5x 7d baseline = trigger
fraudClusterMinCount: 5          // 5+ high anomalies = trigger
adjusterLoadThreshold: 10        // 10+ triage items = trigger
slaBreachWindow: 7               // 7+ day backlog = trigger
severityDriftDelta: 2            // risk trending up = trigger
```

To customize, edit `src/lib/guardian/plugins/industry-insurance-pack/types.ts`:

```typescript
export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  claimsVelocityRatio: 2.0,  // Increase to 2.0x for less sensitivity
  fraudClusterMinCount: 10,  // Increase to 10 for more conservative detection
  // ...
};
```

---

## Examples

### Example 1: Claims Velocity Detection

**Input:**
```json
{
  "alerts24h": 45,
  "incidents24h": 12,
  "alerts7d": 70,
  "incidents7d": 20,
  "currentRiskLabel": "medium"
}
```

**Calculation:**
- Incident baseline: 20/7 = 2.9 per day
- Current 24h: 12 incidents
- Ratio: 12/2.9 = 4.1x baseline
- Result: **CLAIMS VELOCITY SPIKE signal (high severity)**

**Output:**
```json
{
  "key": "claims_velocity_spike",
  "severity": "high",
  "window": "24h",
  "count": 12,
  "rationale": "Claims intake 410% above 7-day baseline. Review processing capacity.",
  "suggestedAction": "Check adjuster availability and intake workflows"
}
```

### Example 2: Graceful Degradation

**Input:**
```json
{
  "anomalyCountHigh": 8,
  "hasH02Anomalies": false  // ← Feature unavailable
}
```

**Behavior:**
- Fraud risk signal returns `null`
- Warning added: "Anomaly detection (H02) not available; fraud risk signal limited"
- Dashboard shows warning in Data Quality Notes section

---

## Operational Workflow

### Daily Operations

1. **Morning Check (08:00):**
   - Open Insurance Ops Dashboard
   - Review signals (if any)
   - Note any high-severity items

2. **Throughout Day:**
   - Dashboard auto-refreshes
   - Alerts triggered for high-severity signals

3. **Weekly Review (Friday 17:00):**
   - Check signal trends (trending up/down)
   - Adjust thresholds if false positives observed
   - Review related Guardian features (H01-H04)

### Incident Response

**IF signal triggered:**
1. Note timestamp and signal type
2. Jump to related Guardian dashboard (intelligence, risk, triage)
3. Verify signal with actual claims data
4. Activate SOP for signal type
5. Document in incident notes

**IF false positive:**
1. Note signal key and reason for false positive
2. Consider threshold adjustment
3. Contact Guardian support if systematic issue

---

## Limitations & Known Issues

### Heuristic Signals

Signals are **heuristic operational indicators**, not compliance determinations.

**They may:**
- Trigger on legitimate spikes (e.g., seasonal events)
- Miss anomalies if baseline is already elevated
- Have blind spots for rare event types

**They do NOT:**
- Replace human judgment
- Constitute compliance evidence
- Provide root cause analysis
- Include business context

### Feature Availability

If features unavailable:
- H02 (Anomaly) missing → Fraud risk signal disabled
- H04 (Triage) missing → Adjuster load/SLA drift signals disabled
- H06 (Intelligence) missing → Plugin requires h06_intelligence_dashboard

---

## Testing

### Unit Tests

**File:** `tests/guardian/plugin_04_insurance_signals.test.ts`

Coverage:
- Signal detection at thresholds
- Severity scaling (low/medium/high)
- Graceful degradation when H02/H04 unavailable
- Risk label computation
- Snapshot structure validation
- PII safety (no identifiers in output)

### Integration Tests

**File:** `tests/guardian/plugin_04_marketplace_gating.test.ts`

Coverage:
- Tier gating (PROFESSIONAL/ENTERPRISE allowed, STARTER denied)
- Feature gating (guardian_core + h06_intelligence_dashboard required)
- Governance gating (internal-only allowed)
- Registry integration (findable by tier/features/capability)
- Constraint violation messages
- Real-world scenarios

### Manual Testing Checklist

- [ ] Plugin enables/disables without error
- [ ] Dashboard loads and renders signals
- [ ] Signals derive correctly for test data
- [ ] Governance watermark shows for internal-only workspaces
- [ ] Graceful degradation when H02/H04 unavailable
- [ ] Links to related Guardian pages work correctly
- [ ] Disclaimer displays prominently
- [ ] TypeScript build passes
- [ ] Audit log entries created for enable/disable
- [ ] RLS prevents cross-tenant data leakage

---

## Future Enhancements (v2.0+)

### Additional Signal Types (v1.1)
- Repeat claimant clustering
- After-hours claim surge detection
- Equipment/vendor outage patterns

### AI-Powered Narrative Brief (v2.0)
- Claude-powered operations summary
- Narrative explanation of signal clusters
- Recommended SOP activations
- Governance-aware rendering

### Report Generation (v2.0)
- PDF/CSV export of signals
- 24h/7d/30d trending reports
- Threshold comparison tables
- SOP recommendations per signal

### Connector Plugins (Future)
- Slack (signal alerts → channel)
- Datadog (push signals to metric)
- PagerDuty (trigger incidents on high-severity)
- ServiceNow (create incidents)

---

## Related Documentation

- [Guardian v1.0 Architecture](GUARDIAN_V1_ARCHITECTURE_FREEZE.md) — Plugin boundaries
- [Guardian Plugin Definition](GUARDIAN_PLUGIN_DEFINITION.md) — What qualifies as plugin
- [PLUGIN-01: Plugin SDK](docs/GUARDIAN_PLUGIN_SDK.md) — Manifest & registry
- [PLUGIN-02: Plugin Marketplace](docs/GUARDIAN_PLUGIN_MARKETPLACE.md) — Enablement API
- [PLUGIN-03: Industry Pack - Restoration Operations](docs/GUARDIAN_INDUSTRY_PACK_RESTORATION_OPS.md) — Related plugin pattern
- [Guardian Intelligence Dashboard (H06)](docs/GUARDIAN_H06_INTELLIGENCE_DASHBOARD.md) — Related features

---

## Change Log

### v1.0.0 (Dec 13, 2025)

**Implemented:**
- Claims velocity spike signal (incident ratio)
- Fraud risk cluster signal (anomaly count + risk elevation)
- Adjuster load overload signal (triage backlog)
- SLA breach pattern signal (queue duration)
- Severity drift signal (risk trending)
- Insurance Ops Dashboard UI
- Plugin manifest and registry
- Marketplace enablement/disablement
- PII-safe aggregate-only data model
- Governance compliance (external sharing, AI gating)
- Complete documentation
- Comprehensive test coverage

**Known Limitations:**
- Signals are heuristic only (not compliance determinations)
- Limited to 5 signal types (additional types planned for v1.1)
- No AI narrative brief yet (planned v2.0)
- No report generation yet (planned v2.0)

---

**Disclaimer:** This document is for Insurance & Claims Oversight Industry Pack v1.0.0 (GA). Plugin signals are heuristic operational indicators, not compliance determinations. Always verify signals with your claims management system and standard operating procedures before acting on recommendations.
