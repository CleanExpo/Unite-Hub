# Guardian Industry Pack: Healthcare & Aged Care Oversight

**Plugin Key**: `industry_healthcare_agedcare_pack`
**Version**: 1.0.0
**Status**: Production
**Last Updated**: 2025-12-13

---

## Overview

The Healthcare & Aged Care Oversight plugin provides read-only, governance-safe monitoring of care environment risk signals for healthcare and aged-care operators. The plugin detects heuristic indicators of operational stress, care quality risk, and environmental safety concerns through aggregate-only data analysis.

**Key Principles**:
- ✅ **PII-Safe**: Aggregate-only data, no patient/resident/staff identifiers
- ✅ **Read-Only**: No modifications to Guardian core or external systems
- ✅ **Heuristic**: Threshold-based signal detection, never clinical advice
- ✅ **Governance-Safe**: Explicit governance tagging, external sharing policies
- ✅ **Gracefully Degraded**: Continues operation when optional features unavailable

---

## Audience & Use Cases

### For Care Administrators
- Monitor care environment stability across facilities
- Detect operational stress before escalation
- Track incident patterns and response latency
- Assess staffing/resource pressure

### For Compliance & Quality Teams
- Identify care quality risk signals
- Track environmental safety concerns
- Monitor escalation and triage patterns
- Generate executive briefings for board-level oversight

### For Risk & Governance
- Assess operational risk exposure
- Track care environment trends
- Inform policy decisions around staffing, protocols
- Maintain audit trails of oversight activity

---

## Signal Categories

### 1. Environmental Risk Spike
**Key**: `environmental_risk_spike`

Detects surge in incident volume combined with rising risk indicators.

**Severity Calculation**:
- Baseline: `incidents7d / 7` = incidents per day
- Threshold: 1.5x baseline (trigger), 2x (medium), 3x+ (high)

**Rationale**: Spike in care incidents + rising risk suggests environmental stressors (staffing shortages, protocol changes, external factors).

**Suggested Actions**:
- Review recent operational changes
- Assess staffing/resource adequacy
- Evaluate care environment conditions
- Consider temporary protocol adjustments

**Example Data**:
```json
{
  "incidents24h": 25,      // 1.3x daily baseline (20/day)
  "incidents7d": 140,
  "currentRiskLabel": "medium"
}
```

---

### 2. Repeat Incident Pattern
**Key**: `repeat_incident_pattern`

Detects clusters of correlated incidents, suggesting systemic issues.

**Severity Calculation**:
- Cluster threshold: ≥3 correlated incidents (from `correlations24h` or higher window)
- Severity scales: 3-5 correlations (low), 6-8 (medium), 9+ (high)

**Rationale**: Repeated correlated incidents indicate recurring failure points, protocol gaps, or environmental hazards.

**Suggested Actions**:
- Analyze incident root causes
- Review related procedures/protocols
- Assess environmental factors (equipment, facilities)
- Train staff on identified gaps

**Example Data**:
```json
{
  "correlations24h": 8,
  "correlations7d": 15
}
```

---

### 3. Response Latency
**Key**: `response_latency`

Detects when incidents remain in triage backlog, suggesting operational overload.

**Severity Calculation** (requires H04 Triage feature):
- Latency threshold: ≥7 days in backlog (trigger), ≥10 days (medium), ≥14 days (high)
- Uses `triageBacklogCount` when available

**Rationale**: Growing backlog indicates overwhelmed triage capacity, delayed incident response.

**Suggested Actions**:
- Increase triage staff/capacity
- Prioritize critical incidents
- Review incident classification criteria
- Implement automated triage support

**Example Data**:
```json
{
  "triageBacklogCount": 12,
  "hasH04Triage": true
}
```

---

### 4. Afterhours Event Rate
**Key**: `afterhours_event_rate`

Detects elevated incident activity outside standard operating hours, suggesting inadequate staffing.

**Severity Calculation**:
- Expected afterhours rate: ~40% of daily activity (baseline)
- Threshold: >50% afterhours activity (trigger), >60% (medium), >70% (high)

**Rationale**: High afterhours activity suggests insufficient on-site staffing during off-hours.

**Suggested Actions**:
- Review afterhours staffing levels
- Assess on-call protocols
- Evaluate shift scheduling
- Consider 24/7 facility requirements

**Example Data**:
```json
{
  "alerts24h": 30,
  "incidents24h": 12
  // Afterhours rate inferred from spike timing
}
```

---

### 5. Care Environment Stability
**Key**: `care_environment_stability`

Positive indicator: stable incident volumes with declining risk.

**Calculation**:
- Condition: Flat incident trend + downward risk trend
- Indicates: Well-managed environment, effective protocols

**Rationale**: Stable operations suggest effective care management, adequate resources, protocol compliance.

**Suggested Actions**:
- Maintain current protocols/staffing
- Document best practices
- Consider as model for other units/facilities
- Continue monitoring for early warning signs

**Example Data**:
```json
{
  "incidents24h": 8,
  "incidents7d": 56,
  "currentRiskLabel": "low",
  "riskTrend": "down"
}
```

---

### 6. Escalation Pressure
**Key**: `escalation_pressure`

Detects rising risk despite stable incident volume, suggesting underlying pressure.

**Calculation**:
- Condition: Steady incident count + rising risk indicators
- Delta threshold: ≥30% increase in risk score

**Rationale**: Risk rising while volumes stable suggests emerging environmental stress or quality degradation.

**Suggested Actions**:
- Investigate risk drivers (quality metrics, incidents severity)
- Assess emerging environmental hazards
- Review care protocols for degradation
- Increase monitoring frequency

**Example Data**:
```json
{
  "incidents24h": 8,    // Flat
  "incidents7d": 56,
  "currentRiskLabel": "high",
  "riskTrend": "up"     // Rising risk despite flat incidents
}
```

---

## Data Model & API

### Input: Aggregate Healthcare Data

```typescript
interface AggregateHealthcareData {
  // Required
  alerts24h: number;              // Total alerts in last 24h
  incidents24h: number;           // Total incidents in last 24h
  correlations24h: number;        // Correlated incident clusters in last 24h
  alerts7d: number;               // Total alerts in last 7d
  incidents7d: number;            // Total incidents in last 7d

  // Optional
  currentRiskLabel?: 'low' | 'medium' | 'high';  // Explicit risk from other systems
  riskTrend?: 'up' | 'down' | 'flat';             // Risk direction
  triageBacklogCount?: number;                    // Incidents awaiting triage (H04)
  hasH02Anomalies?: boolean;                      // H02 anomaly detection available
  hasH04Triage?: boolean;                         // H04 triage data available
}
```

### Output: Healthcare Snapshot

```typescript
interface HealthcareSnapshot {
  signals: HealthcareSignal[];
  totals: {
    alerts: number;
    incidents: number;
    correlations: number;
    riskLabel: 'low' | 'medium' | 'high';
    riskTrend?: 'up' | 'down' | 'flat';
  };
  warnings: string[];
  disclaimer: string;
}

interface HealthcareSignal {
  key: HealthcareSignalKey;
  severity: 'low' | 'medium' | 'high';
  window: '7d' | '30d' | '90d';
  trend?: 'up' | 'down' | 'flat';
  rationale: string;
  suggestedAction?: string;
}
```

### API Endpoint: Signal Derivation

```bash
# URL
POST /api/guardian/plugins/industry-healthcare-agedcare/signals

# Request
{
  "workspaceId": "ws-123",
  "aggregateData": {
    "alerts24h": 45,
    "incidents24h": 12,
    "correlations24h": 8,
    "alerts7d": 280,
    "incidents7d": 85,
    "hasH04Triage": true,
    "triageBacklogCount": 5
  }
}

# Response (200)
{
  "signals": [
    {
      "key": "environmental_risk_spike",
      "severity": "medium",
      "window": "7d",
      "trend": "up",
      "rationale": "Incident volume 1.8x baseline with rising risk indicators",
      "suggestedAction": "Review operational changes and resource allocation"
    }
  ],
  "totals": {
    "alerts": 45,
    "incidents": 12,
    "correlations": 8,
    "riskLabel": "medium",
    "riskTrend": "up"
  },
  "warnings": [],
  "disclaimer": "Heuristic indicators only. Not clinical advice. ..."
}
```

---

## Dashboard: Healthcare & Aged Care Oversight

**URL**: `/guardian/plugins/industry/healthcare`

### Components

**Executive Briefing Section**
- AI-powered narrative (Claude Haiku, when available)
- 2-3 sentence summary of key signals and recommended actions
- Graceful fallback if AI unavailable

**Status Cards** (4-column grid)
- 24h Alerts: Total alert count
- 24h Incidents: Total incident count
- Correlations: Correlated incident clusters
- Risk Level: Current risk label (low/medium/high)

**High-Risk Alert Banner** (conditional)
- Only shown when `riskLabel === 'high'`
- Color-coded warning with suggested escalation steps

**Signals Table** (6 columns)
- Signal: Key (environmental_risk_spike, repeat_incident_pattern, etc.)
- Severity: Badge (low/medium/high) with icon
- Window: Time window (7d, 30d, 90d)
- Trend: Direction indicator (up/down/flat)
- Rationale: Plain-English explanation
- Action: Suggested action step

**Feature Availability Notices** (conditional)
- Warns when H02 Anomalies unavailable
- Warns when H04 Triage unavailable
- Explains impact on signal accuracy

**Related Resources** (footer links)
- Intelligence Dashboard
- Care Protocols
- Documentation

**Governance Watermark** (top-right, conditional)
- Shows "🔒 INTERNAL - Sharing Restricted" when external sharing disabled
- Removed when `allowExternal=true`

---

## Marketplace Integration

### Enablement Requirements

**Tier Constraint**:
- `PROFESSIONAL` tier minimum
- `ENTERPRISE` tier recommended

**Feature Constraints**:
- `guardian_core`: Core Guardian functionality (required)
- `h06_intelligence_dashboard`: Intelligence dashboard access (required)

**Governance Constraints**:
- External sharing policies enforced
- No special governance requirements (plugin is PII-safe)

### Marketplace Endpoints

**Enable Plugin**:
```bash
POST /api/guardian/plugins/industry-healthcare-agedcare-pack/enable?workspaceId=ws-123

# Validates tier, features, governance
# Updates workspace_plugins table
# Creates audit log entry
```

**Disable Plugin**:
```bash
POST /api/guardian/plugins/industry-healthcare-agedcare-pack/disable?workspaceId=ws-123

# Disables plugin for workspace
# Creates audit log entry
```

### Navigation Visibility

Plugin dashboard is conditionally visible based on:
1. Workspace tier (PROFESSIONAL+ required)
2. Features enabled (guardian_core + h06_intelligence_dashboard)
3. Plugin enabled status in workspace_plugins table

---

## Governance & Compliance

### PII Safety
✅ No patient identifiers
✅ No resident identifiers
✅ No staff member names or IDs
✅ Aggregate counts only
✅ Heuristic indicators only

### Data Classification
- **Input**: Public aggregate data (incident counts, trends)
- **Processing**: Heuristic threshold calculation (no ML, fully deterministic)
- **Output**: Risk signals (aggregate summaries, no PII)
- **Retention**: 90 days (aligned with healthcare audit requirements)

### Audit Trail
All enable/disable actions logged to `audit_logs` table:
```json
{
  "workspace_id": "ws-123",
  "action": "plugin_enabled",
  "details": { "plugin_key": "industry_healthcare_agedcare_pack" },
  "created_at": "2025-12-13T10:30:00Z"
}
```

### External Sharing Policy
- Default: Internal use only (🔒 watermark shown)
- If enabled: Can be shared with external stakeholders with explicit governance approval
- Audit trail required for all external access

---

## Testing & Validation

### Test Coverage
- 39+ unit tests for signal detection algorithms
- Edge case testing: zero baselines, extreme volumes
- Graceful degradation testing: missing H02/H04 features
- UI smoke tests: dashboard rendering, navigation
- Governance tests: tier/feature/governance constraint enforcement

### Validation Checklist
- [ ] Signal detection algorithms pass unit tests
- [ ] Dashboard UI renders correctly with mock data
- [ ] AI narrative generation works with graceful fallback
- [ ] Enable/disable endpoints enforce constraints
- [ ] Audit logging captures all plugin lifecycle events
- [ ] PII safeguards verified (aggregate-only data)
- [ ] Governance watermarks display correctly
- [ ] TypeScript compilation passes
- [ ] Integration tests pass with real Supabase data

---

## Frequently Asked Questions

**Q: Can this plugin provide clinical advice?**
A: No. The plugin provides heuristic operational indicators only. Any clinical decisions must involve qualified care professionals.

**Q: What if we don't have H04 Triage data?**
A: The plugin gracefully continues operation and adds a warning about reduced latency signal accuracy. Other signals remain functional.

**Q: Can we export this data?**
A: The plugin provides read-only access. Export capabilities depend on workspace tier and governance settings. Check with your admin.

**Q: How often are signals updated?**
A: Signals are derived on-demand when the dashboard loads. Real-time updates require Redis caching (optional upgrade).

**Q: Who should have access to this plugin?**
A: Care administrators, compliance teams, risk/quality officers. Not for individual care staff.

**Q: Can we customize signal thresholds?**
A: Not currently. Thresholds are built-in. Custom thresholds require a feature enhancement request.

---

## Support & Documentation

**Plugin Issues**: Check Guardian troubleshooting guide
**Feature Requests**: Submit via admin panel feedback
**Governance Questions**: Contact compliance team
**Technical Details**: See signal service implementation in `/src/lib/guardian/plugins/industry-healthcare-agedcare/signalService.ts`

---

## Changelog

### v1.0.0 (2025-12-13)
- Initial release with 6 heuristic signal categories
- Dashboard UI with executive briefing, status cards, signals table
- Marketplace integration (enable/disable)
- Audit logging and governance compliance
