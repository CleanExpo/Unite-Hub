# Guardian Industry Pack: Education & Campus Operations

**Plugin Key**: `industry_education_campus_pack`
**Version**: 1.0.0
**Tier Requirement**: PROFESSIONAL, ENTERPRISE
**Feature Requirements**: `guardian_core`, `h06_intelligence_dashboard`

## Overview

The Education & Campus Operations Industry Pack provides aggregate-only operational oversight signals for educational institutions. Designed for campus administrators, compliance teams, and educational leadership, this plugin delivers real-time operational health indicators based on incident patterns, environmental factors, and resource utilization.

**Safety Assurance**: This plugin is strictly read-only, aggregate-only, and heuristic-based. It provides operational indicators only—never student safety certifications, institutional risk guarantees, or compliance validations.

## Signal Categories

### 1. Operational Disruption
**Description**: Elevated incident volumes indicating operational challenges or campus-wide issues.

**Detection**: Incidents 24h vs. 7-day baseline
- Triggers at >1.5x baseline volume
- HIGH severity if >2x baseline
- MEDIUM severity if 1.5-2x baseline

**Rationale**: Sudden spikes in operational incidents may indicate emerging issues or strained systems.

**Action**: Assess current operational pressures, review incident categorization, implement response protocols.

### 2. Environmental Risk
**Description**: Facility and environmental risk indicators suggesting infrastructure or safety-related concerns.

**Detection**: Facility issues and environmental alerts 24h vs. 7-day baseline
- Triggers at >1.8x baseline
- HIGH severity threshold

**Rationale**: Elevated facility issues may indicate maintenance backlogs or environmental challenges.

**Action**: Escalate to facilities management, implement preventive maintenance.

### 3. Repeat Pattern
**Description**: Clustered incidents occurring in similar contexts or timeframes.

**Detection**: Correlation analysis over 7 days
- Triggers at ≥3 correlated incidents
- HIGH severity if ≥5 incidents
- MEDIUM severity if 3-4 incidents

**Rationale**: Repeated incidents in clusters suggest systemic issues rather than random events.

**Action**: Investigate root cause, implement targeted mitigation.

### 4. Response Latency
**Description**: Average incident resolution time indicating resource constraints or complex issues.

**Detection**: Average resolution time over 30 days
- CRITICAL if >10 days
- MEDIUM if 5-7 days
- LOW if <5 days

**Rationale**: Extended resolution times may indicate stretched resources or increasingly complex incidents.

**Action**: Review resource allocation, assess staffing needs, prioritize backlog.

### 5. Afterhours Activity
**Description**: Elevated off-hours incident activity indicating extended operational stress.

**Detection**: Afterhours incidents vs. peak hour volume
- Triggers at >1.3x peak hour ratio
- MEDIUM severity

**Rationale**: Off-hours incidents may indicate system instability or extended operational pressure.

**Action**: Review afterhours staffing, assess incident types, improve automation.

### 6. Stability Indicator
**Description**: Overall operational stability assessment (positive indicator).

**Detection**: Combination of low volume, good response time, and minimal escalations
- LOW severity (positive signal)
- Indicates "stable" trend

**Rationale**: When volume is manageable, response times are good, and escalations are minimal, operations are stable.

**Action**: Maintain current practices and resource allocation.

## Data Model

### Input: AggregateCampusData

```typescript
interface AggregateCampusData {
  // Volume metrics (24h)
  incidents24h: number;
  alerts24h: number;
  correlations24h: number;

  // Volume metrics (7d, 30d)
  incidents7d?: number;
  incidents30d?: number;

  // Environmental metrics
  facilityIssues24h?: number;
  facilityIssues7d?: number;
  environmentalAlerts24h?: number;

  // Response metrics
  avgResolutionTime?: number; // days
  unresolved7d?: number;
  escalations24h?: number;

  // Activity patterns
  afterhoursIncidents24h?: number;
  afterhoursIncidents7d?: number;
  peakHourVolume?: number;

  // Risk/status
  currentRiskLabel?: 'low' | 'medium' | 'high';
  riskTrend?: 'up' | 'down' | 'stable';

  // Operational status
  systemAvailability?: number; // 0-100
  queueLength?: number;
  staffingLevel?: 'normal' | 'reduced' | 'critical';
}
```

### Output: CampusOversightSnapshot

```typescript
interface CampusOversightSnapshot {
  generatedAt: string;
  signals: CampusSignal[];
  overview: CampusOperationsOverview;
  warnings: string[];
  disclaimer: string;
}
```

## API Integration

### Enable Plugin

**Endpoint**: `POST /api/guardian/plugins/industry-education-campus-pack/enable`

**Query Parameters**:
- `workspaceId` (required): Workspace UUID

**Response**:
```json
{
  "message": "Plugin \"Industry Pack: Education & Campus Operations\" enabled for workspace",
  "plugin_key": "industry_education_campus_pack",
  "enabled": true,
  "enabled_at": "2025-12-13T10:30:00Z"
}
```

**Constraints**:
- Workspace tier must be PROFESSIONAL or ENTERPRISE
- Features `guardian_core` and `h06_intelligence_dashboard` must be enabled
- Returns 403 if constraints not met

### Disable Plugin

**Endpoint**: `POST /api/guardian/plugins/industry-education-campus-pack/disable`

**Query Parameters**:
- `workspaceId` (required): Workspace UUID

**Response**:
```json
{
  "message": "Plugin \"Industry Pack: Education & Campus Operations\" disabled for workspace",
  "plugin_key": "industry_education_campus_pack",
  "enabled": false,
  "disabled_at": "2025-12-13T10:31:00Z"
}
```

## Dashboard Components

### Executive Brief
AI-generated summary of campus operations status using Claude Haiku, gated by Z10 governance. Falls back to deterministic summary if AI unavailable.

### Status Cards
- **Incidents (24h)**: Current 24-hour incident count
- **Escalations**: Percentage of incidents escalated
- **Response Time**: On-track/delayed/critical status
- **Environmental Status**: Normal/elevated/critical

### Signals Table
Displays all detected signals with:
- Signal name
- Severity badge (low/medium/high)
- Detection count
- Rationale explanation
- Suggested action

### Operations Overview
- Total incidents (24h, 7d)
- Escalation rate percentage
- Response status
- Environmental status
- Afterhours activity percentage

## Use Cases

### 1. Daily Operations Monitoring
Campus administrators use the dashboard to monitor operational health and detect emerging issues early.

**Example**: A spike in facility issues on Monday morning may indicate weekend safety concerns.

### 2. Resource Planning
Operations leaders use afterhours and latency signals to plan staffing levels and budget allocation.

**Example**: Elevated afterhours incidents suggest need for extended coverage or automation improvements.

### 3. Root Cause Analysis
Repeat pattern detection helps identify systemic issues requiring targeted intervention.

**Example**: Three correlated incidents in the same building suggest localized facility or maintenance issues.

### 4. Trend Monitoring
Historical signal data helps track improvement or degradation over time.

**Example**: Declining response latency indicates successful staffing increases or process improvements.

## Governance and Safety

### PII Safety
- ✅ **Aggregate counts only**: Never individual incident details
- ✅ **No identifiers**: No student IDs, staff names, or location mapping
- ✅ **Trend analysis**: Temporal patterns only, no individual attribution
- ✅ **Operational indicators**: Heuristic signals, not individual assessments

### Compliance Limitations
- ⚠️ **Not a compliance tool**: Does not provide regulatory proof
- ⚠️ **Operational indicators only**: Not institutional safety certifications
- ⚠️ **Heuristic-based**: Threshold-based signals, not safety guarantees
- ⚠️ **For context only**: Always verify with official campus safety protocols

### Governance Controls
- **Read-only**: No write access to incident data
- **Aggregate-only**: Cannot drill down to individual cases
- **Z10 gated**: AI-powered brief requires governance approval
- **Audit logged**: All plugin lifecycle events logged

## Troubleshooting

### No Signals Detected
**Possible causes**:
- Insufficient data (need ≥24h of incident history)
- All metrics below detection thresholds
- Data source not configured

**Resolution**: Verify incident reporting is active and data is flowing correctly.

### Missing Environmental Data
**Warning**: "Response latency data not available"

**Cause**: Response time metrics not configured in data source.

**Resolution**: Configure incident resolution time tracking in incident management system.

### High Escalation Rate
**Interpretation**: >25% of incidents being escalated may indicate:
- Insufficient first-response training
- Complex incident types
- Inadequate triage processes

**Action**: Review escalation criteria and first-response procedures.

## FAQ

**Q: Can this plugin predict campus safety incidents?**
A: No. This plugin detects operational patterns and resource constraints, not safety events. Safety predictions require domain expertise and official risk assessment.

**Q: Is the transparency score a compliance metric?**
A: No. The transparency score is informational only, indicating governance artifact availability. It is not a regulatory assessment.

**Q: How often are signals updated?**
A: Signals are re-computed on each dashboard load, reflecting the most recent data available (typically <15 minutes old).

**Q: Can I export reports?**
A: The plugin supports report capability. Contact support for scheduled report configuration.

**Q: What happens if my workspace tier changes?**
A: If tier drops below PROFESSIONAL, the plugin becomes unavailable but data is preserved. Re-enabling on upgrade restores access.

## Technical Details

### Signal Detection Algorithm
1. Load aggregate data
2. For each signal type, check detection thresholds
3. Compute severity based on magnitude
4. Build operations overview
5. Infer overall risk label from signal count
6. Return snapshot with warnings and disclaimer

### Threshold Reference

| Signal | Threshold | Severity |
|--------|-----------|----------|
| Operational Disruption | >1.5x baseline | Medium |
| Operational Disruption | >2.0x baseline | High |
| Environmental Risk | >1.8x baseline | High |
| Repeat Pattern | ≥3 correlated | Medium |
| Repeat Pattern | ≥5 correlated | High |
| Response Latency | 5-7 days | Medium |
| Response Latency | >10 days | Critical |
| Afterhours Activity | >1.3x peak ratio | Medium |

## Support

For issues or questions about this plugin:
1. Check the FAQ section above
2. Review signal definitions and detection logic
3. Verify data source is configured correctly
4. Contact Guardian support with workspace ID and timestamp

---

**Disclaimer**: These are operational indicators and campus operations signals, not institutional safety certifications or compliance guarantees. Always verify with official campus safety protocols and institutional risk frameworks.
