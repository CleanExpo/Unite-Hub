# Guardian Industry Pack: Restoration Operations

**Classification:** 🟡 CUSTOMER-SAFE
**Version:** 1.0.0
**Status:** Stable (GA)
**Last Updated:** December 13, 2025

---

## Overview

The Restoration Operations Industry Pack is a read-only Guardian plugin providing industry-specific operational intelligence for water damage, mould contamination, and fire cleanup workflows.

**Key Features:**
- Heuristic signal detection: water spikes, mould risk, fire events, SLA drift
- PII-safe, aggregate-only data model (no raw records, no identifiers)
- SOP-aligned operational alerts for restoration teams
- Governance-aware (respects external sharing and AI policies)
- Zero impact on Guardian runtime (plugin-based architecture)

---

## Use Cases

### 1. Water Damage Response
Detect rapid alert/incident surges indicating water damage events.

**Signal:** Water Spike
**Trigger:** Alert or incident count 1.5x+ above 7-day baseline
**Action:** Escalate water damage response team, activate containment protocols

### 2. Mould Risk Detection
Identify mould contamination risk from anomaly spikes and elevated risk labels.

**Signal:** Mould Risk Spike
**Trigger:** 5+ high-severity anomalies + medium/high risk label
**Action:** Verify containment protocols, conduct air quality assessment

### 3. Fire Event Management
Detect fire-related incident surges triggering immediate response.

**Signal:** Fire Event Spike
**Trigger:** Incident count 2x+ baseline for 24h window
**Action:** Check fire response workflows, verify equipment availability

### 4. SLA and Triage Management
Track triage queue backlog to prevent response delays.

**Signal:** SLA Drift
**Trigger:** 3+ incidents awaiting triage
**Action:** Review queue capacity, adjust response timing

---

## Technical Architecture

### Plugin Manifest

Located at `plugins/industry-restoration-pack/manifest.ts`

```typescript
{
  key: 'industry_restoration_pack',
  name: 'Industry Pack: Restoration Operations',
  version: '1.0.0',
  capabilities: ['ui_panel', 'report'],
  routes: [
    {
      path: '/guardian/plugins/industry/restoration',
      title: 'Restoration Ops Dashboard',
      role: 'admin'
    }
  ],
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

**File:** `plugins/industry-restoration-pack/types.ts`

```typescript
RestorationOpsSignalKey:
- water_spike (alert/incident ratio spike)
- mould_risk_spike (anomaly count spike + risk elevation)
- fire_event_spike (incident count doubling)
- sla_drift (triage backlog buildup)
- equipment_overload (optional future)
- repeat_incident_cluster (optional future)
- afterhours_surge (optional future)

SignalSeverity: 'low' | 'medium' | 'high'
SignalWindow: '24h' | '7d' | '30d'
SignalTrend: 'up' | 'flat' | 'down'
```

### Signal Derivation Service

**File:** `plugins/industry-restoration-pack/signalService.ts`

**Function:** `deriveRestorationSignals(aggregateData)`

Accepts Guardian aggregate metrics:
- 24h alerts, incidents, correlations
- 7d baseline for trending
- Current risk label
- Optional triage backlog count
- Optional anomaly counts (H02)
- Feature availability flags

Returns `RestorationOpsSnapshot`:
```typescript
{
  generatedAt: ISO timestamp,
  signals: RestorationOpsSignal[],
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

**File:** `src/app/guardian/plugins/industry/restoration/page.tsx`

**Route:** `/guardian/plugins/industry/restoration?workspaceId=<id>`

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
| Alert IDs or names | ❌ No | PII-unsafe |
| Incident details | ❌ No | PII-unsafe |
| User information | ❌ No | PII-unsafe |
| Raw logs or events | ❌ No | PII-unsafe |

### Signal Structure

All signals generated by the plugin include:
- Generic rationale (e.g., "Incident count 250% above baseline")
- Suggested action (e.g., "Check water damage workflows")
- No customer names, user IDs, or identifiers

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
- `h02_anomaly_detection` — If missing, mould risk signal shows warning
- `h04_incident_scoring` — If missing, SLA drift signal shows warning

### Governance Gating

- **External Sharing:** Not required (plugin safe for internal only)
- **AI Usage:** Optional (AI only used for narrative ops brief, future enhancement)

---

## Integration with PLUGIN-02 Marketplace

### Enablement via API

**Endpoint:** `POST /api/guardian/admin/plugins/industry_restoration_pack/enable?workspaceId=<id>`

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
  "message": "Plugin \"industry_restoration_pack\" enabled for workspace"
}
```

**Constraint Checking:**
1. Workspace subscription tier checked (PROFESSIONAL or ENTERPRISE)
2. Required features validated (guardian_core, h06_intelligence_dashboard)
3. Governance policy enforced
4. Audit log entry created

### Disablement via API

**Endpoint:** `POST /api/guardian/admin/plugins/industry_restoration_pack/disable?workspaceId=<id>`

**Body:**
```json
{
  "actor": "admin@example.com"
}
```

### Database Schema

**Table:** `guardian_plugin_enablement`

Tracks per-tenant plugin state:
- `tenant_id`, `plugin_key` (unique constraint)
- `enabled` boolean
- `enabled_at`, `enabled_by` timestamp/actor
- `disabled_at`, `disabled_by` timestamp/actor
- RLS policy enforces tenant isolation

---

## Configuration & Thresholds

**File:** `plugins/industry-restoration-pack/types.ts`

**Default thresholds (adjustable in types.ts):**

```typescript
waterSpikeRatio: 1.5         // 1.5x 7d baseline = trigger
mouldRiskMinCount: 5         // 5+ high anomalies = trigger
slaBacklogThreshold: 3       // 3+ triage items = trigger
clusterWindow: 7             // 7-day window for clustering
clusterRepetitionThreshold: 3 // 3+ repeats = cluster
```

To customize, edit `plugins/industry-restoration-pack/types.ts`:

```typescript
export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  waterSpikeRatio: 2.0,  // Increase to 2.0x for less sensitivity
  mouldRiskMinCount: 10, // Increase to 10 for more conservative detection
  // ...
};
```

---

## Examples

### Example 1: Water Damage Detection

**Input:**
```json
{
  "alerts24h": 45,
  "incidents24h": 8,
  "alerts7d": 70,
  "incidents7d": 12,
  "currentRiskLabel": "high"
}
```

**Calculation:**
- Incident baseline: 12/7 = 1.7 per day
- Current 24h: 8 incidents
- Ratio: 8/1.7 = 4.7x baseline
- Result: **WATER SPIKE signal (high severity)**

**Output:**
```json
{
  "key": "water_spike",
  "severity": "high",
  "window": "24h",
  "count": 8,
  "rationale": "Incident count 470% above 7-day baseline. Check water damage workflows.",
  "suggestedAction": "Escalate water damage response team"
}
```

### Example 2: Graceful Degradation

**Input:**
```json
{
  "anomalyCountHigh": 7,
  "hasH02Anomalies": false  // ← Feature unavailable
}
```

**Behavior:**
- Mould risk signal returns `null`
- Warning added: "Anomaly detection (H02) not available; mould risk signal limited"
- Dashboard shows warning in Data Quality Notes section

---

## Operational Workflow

### Daily Operations

1. **Morning Check (08:00):**
   - Open Restoration Ops Dashboard
   - Review signals (if any)
   - Note any high-severity items

2. **Throughout Day:**
   - Dashboard auto-refreshes (optional real-time if WebSocket enabled)
   - Alerts triggered for high-severity signals

3. **Weekly Review (Friday 17:00):**
   - Check signal trends (trending up/down)
   - Adjust thresholds if false positives observed
   - Review related Guardian features (H01-H04)

### Incident Response

**IF signal triggered:**
1. Note timestamp and signal type
2. Jump to related Guardian dashboard (intelligence, risk, triage)
3. Verify signal with actual data
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
- Trigger on legitimate spikes (e.g., planned maintenance)
- Miss anomalies if baseline is already elevated
- Have blind spots for rare event types

**They do NOT:**
- Replace human judgment
- Constitute compliance evidence
- Provide root cause analysis
- Include business context

### Feature Availability

If features unavailable:
- H02 (Anomaly) missing → Mould risk signal disabled
- H04 (Triage) missing → SLA drift signal disabled
- H06 (Intelligence) missing → Plugin requires h06_intelligence_dashboard

---

## Future Enhancements (v2.0+)

### Optional: AI-Powered Narrative Brief

**T05 - Not Yet Implemented**

Would add:
- Claude-powered operations summary (if AI enabled)
- Narrative explanation of signal clusters
- Recommended SOP activations
- Governance-aware rendering (watermark if INTERNAL)

**Gating:** Requires `h05_governance_coach` + AI policy permit

### Optional: Report Generation

**Future Enhancement**

Would add:
- PDF/CSV export of signals + trend analysis
- 24h/7d/30d trending reports
- Threshold comparison tables
- SOP recommendations per signal

### Connector Plugins

**Future:** Integrations with:
- Slack (signal alerts → channel)
- Datadog (push signals to metric)
- PagerDuty (trigger incidents on high-severity)
- ServiceNow (create incidents)

---

## Testing

### Unit Tests

**File:** `tests/guardian/plugin_03_restoration_signals.test.ts`

```typescript
describe('RestorationOpsSignals', () => {
  it('should detect water spike at 1.5x baseline', () => {
    const snapshot = deriveRestorationSignals({
      alerts24h: 45,
      incidents24h: 8,
      alerts7d: 70,
      incidents7d: 12
    });
    expect(snapshot.signals).toContainEqual(
      expect.objectContaining({ key: 'water_spike', severity: 'high' })
    );
  });

  it('should skip mould risk signal if H02 unavailable', () => {
    const snapshot = deriveRestorationSignals({
      anomalyCountHigh: 10,
      hasH02Anomalies: false
    });
    expect(snapshot.signals).not.toContainEqual(
      expect.objectContaining({ key: 'mould_risk_spike' })
    );
    expect(snapshot.warnings).toContain('Anomaly detection (H02) not available');
  });
});
```

### Integration Tests

**File:** `tests/guardian/plugin_03_marketplace_gating.test.ts`

```typescript
describe('RestorationPack Gating', () => {
  it('should allow enable for PROFESSIONAL tier', async () => {
    const result = await enablePlugin('tenant-1', 'industry_restoration_pack', 'admin', 'PROFESSIONAL', ['guardian_core', 'h06_intelligence_dashboard'], { allowExternal: false });
    expect(result.success).toBe(true);
  });

  it('should deny enable for STARTER tier', async () => {
    const result = await enablePlugin('tenant-1', 'industry_restoration_pack', 'admin', 'STARTER', [], { allowExternal: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('PROFESSIONAL');
  });
});
```

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

## Support & Maintenance

### Troubleshooting

**Problem:** "Plugin not available in marketplace"
**Cause:** Workspace tier < PROFESSIONAL or features missing
**Solution:** Check workspace tier (gtm_05_subscription_tiers table) and enabled features

**Problem:** "Mould risk signal missing"
**Cause:** H02 anomaly detection not enabled
**Solution:** Enable h02_anomaly_detection feature or review governance policy

**Problem:** "Dashboard shows no signals"
**Cause:** Baseline is normal (no spikes)
**Solution:** Expected behavior. Signals only appear when heuristic thresholds crossed

### Escalation

- Report bugs to Guardian team
- Request threshold changes via support ticket
- Suggest new signals for future versions

### Versioning

- **1.0.0** (Dec 2025) — Initial GA release
- **1.1.0** (planned) — Additional signal types, threshold customization UI
- **2.0.0** (planned) — AI narrative brief, report generation

---

## Related Documentation

- [Guardian v1.0 Architecture](GUARDIAN_V1_ARCHITECTURE_FREEZE.md) — Plugin boundaries
- [Guardian Plugin Definition](GUARDIAN_PLUGIN_DEFINITION.md) — What qualifies as plugin
- [PLUGIN-01: Plugin SDK](docs/GUARDIAN_PLUGIN_SDK.md) — Manifest & registry
- [PLUGIN-02: Plugin Marketplace](docs/GUARDIAN_PLUGIN_MARKETPLACE.md) — Enablement API
- [Guardian Intelligence Dashboard (H06)](docs/GUARDIAN_H06_INTELLIGENCE_DASHBOARD.md) — Related features

---

## Change Log

### v1.0.0 (Dec 13, 2025)

**Implemented:**
- Water spike signal (alert/incident ratio)
- Mould risk spike signal (anomaly count + risk elevation)
- Fire event spike signal (incident surge)
- SLA drift signal (triage backlog)
- Restoration Ops Dashboard UI
- Plugin manifest and registry
- Marketplace enablement/disablement
- PII-safe aggregate-only data model
- Governance compliance (external sharing, AI gating)
- Complete documentation

**Known Limitations:**
- Signals are heuristic only (not compliance determinations)
- Limited to 4 signal types (7 planned for v2)
- No AI narrative brief yet (planned T05)
- No report generation yet (planned enhancement)

---

**Disclaimer:** This document is for Restoration Operations Industry Pack v1.0.0 (GA). Plugin signals are heuristic operational indicators, not compliance determinations. Always verify signals with your monitoring tools and standard operating procedures before acting on recommendations.
