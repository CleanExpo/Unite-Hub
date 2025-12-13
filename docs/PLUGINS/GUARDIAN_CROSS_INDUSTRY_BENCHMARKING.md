# Guardian Cross-Industry Benchmarking & Peer Signals

**Plugin Key**: `cross_industry_benchmarking_pack`
**Version**: 1.0.0
**Tier Requirement**: ENTERPRISE only
**Feature Requirements**: `guardian_core`, `insights_dashboard`, `risk_engine`

## Overview

The Cross-Industry Benchmarking plugin provides privacy-preserving, aggregate-only benchmarking against anonymised peer cohorts. Designed for enterprise leadership and compliance teams, it delivers contextual operational comparisons without exposing tenant identities or competitive data.

**Safety Assurance**: K-anonymity enforced (k≥10), no tenant identifiers exposed, aggregate-only metrics, no reverse inference possible.

## Privacy Foundation: K-Anonymity

K-anonymity is the core privacy guarantee. **K ≥ 10 minimum** means:
- No cohort has fewer than 10 members
- Individual tenant cannot be identified from aggregate statistics
- Cohort membership never disclosed to tenant
- Industry labels generic only (no organization names)
- All values are aggregate statistics only

**Cohort Fallback**: If industry-specific cohort < 10 members, automatically falls back to global cohort (150+ members).

## Metric Categories

### 1. Alert Rate (alerts/day)
**30-day window baseline**
- Tenant value vs cohort median, P75, P90
- Indicates operational alert volume
- Elevated >15% above median: may indicate more complex environment
- Below -15% below median: more stable alert patterns

### 2. Incident Rate (incidents/day)
**30-day window baseline**
- Core operational incident frequency
- Comparable to cohort peer distribution
- Accounts for sustained operational activity

### 3. Correlation Density (% correlated)
**Correlation count / incident count**
- Percentage of incidents that are correlated (clustered)
- Higher % = more clustering, potentially systemic issues
- Lower % = more isolated incidents

### 4. Risk Label Distribution (% high-risk)
**Percentage of incidents labeled high-risk**
- Tenant high-risk % vs cohort distribution
- Reflects operational complexity assessment
- Elevated = more challenging incidents overall

### 5. Volatility Index (metric variance)
**0-100 scale based on variance over 30/90/180 day windows**
- Indicates operational stability over time
- Lower = more stable, predictable operations
- Higher = more variable, less predictable patterns

## Neutral Interpretation Language

Benchmarking uses strictly **neutral terminology**:

| Status | Meaning | Language |
|--------|---------|----------|
| **Typical** | Within ±15% of cohort median | "Aligns with peer baseline" |
| **Elevated** | >15% above median | "Higher than peer median" (not "better") |
| **Below** | <-15% below median | "Lower than peer median" (not "worse") |

**Forbidden Terms**: better/worse, superior/inferior, leading/trailing, ranking, score, performance comparison, competitive.

## Data Flow & Privacy Enforcement

```
┌─────────────────────────────┐
│ Guardian Aggregate Data      │
│ (alerts, incidents, etc)     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Compute Metrics             │
│ (no individual references)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Select Safe Cohort          │
│ (k-anonymity enforced)      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Compare to Cohort Aggregate │
│ (deltas only, no raw data)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ Return Benchmarks           │
│ (no identifiers, deltas)    │
└─────────────────────────────┘
```

## API Endpoints

### Enable Benchmarking

**Endpoint**: `POST /api/guardian/plugins/cross-industry-benchmarking-pack/enable`

**Query Parameters**:
- `workspaceId` (required): Workspace UUID

**Response**:
```json
{
  "message": "Plugin enabled for workspace",
  "plugin_key": "cross_industry_benchmarking_pack",
  "enabled": true,
  "enabled_at": "2025-12-13T10:30:00Z",
  "governance": {
    "privacy": "k-anonymity enforced (k>=10)",
    "dataSharing": "no raw tenant data exposed",
    "aiBrief": "gated by Z10 governance"
  }
}
```

**Constraints**:
- Workspace tier must be ENTERPRISE
- Features `guardian_core`, `insights_dashboard`, `risk_engine` must be enabled
- Returns 403 if constraints not met

### Disable Benchmarking

**Endpoint**: `POST /api/guardian/plugins/cross-industry-benchmarking-pack/disable`

**Query Parameters**:
- `workspaceId` (required): Workspace UUID

**Response**:
```json
{
  "message": "Plugin disabled for workspace",
  "plugin_key": "cross_industry_benchmarking_pack",
  "enabled": false,
  "disabled_at": "2025-12-13T10:31:00Z"
}
```

## Dashboard Components

### Cohort Summary
- Cohort type (industry or global)
- Member count (never disclosed as specific list)
- Benchmark window (30d, 90d, 180d)
- K-anonymity verification (✓ Verified)

### Benchmark Table
- Metric name
- Tenant value
- Cohort median, P75, P90
- Status badge (typical/elevated/below — neutral color)
- Rationale explanation

### Interpretation Guide
Three neutral cards explain metric categories without ranking language.

### Governance Footer
- Privacy guarantee statement
- K-anonymity disclosure
- No-ranking affirmation
- Cohort membership privacy assurance

## Use Cases

### 1. Operational Context
Enterprise leaders use benchmarks to understand their operational complexity relative to peers.

**Example**: "We see alert rates elevated vs cohort median. This reflects our larger customer base, not system problems."

### 2. Resource Planning
Leadership use elevated metrics to justify resource allocation for high-volume environments.

**Example**: "Elevated incident clustering suggests need for better automation."

### 3. Trend Monitoring
Historical benchmarks show how operational metrics evolve over time.

**Example**: "Over 6 months, volatility decreased, indicating more stable operations."

### 4. Peer Learning (Non-Competitive)
Identify areas where peers achieve lower incident rates for process improvement insights.

**Example**: "Global cohort shows lower correlation density. What practices could we adopt?"

## Governance & Safety

### What K-Anonymity Guarantees
✅ Individual tenant cannot be identified from deltas
✅ Cohort size minimum (10) prevents small-cohort inference
✅ Membership never disclosed (no "peer names")
✅ All metrics aggregate-only (no time-series per tenant)

### What It Does NOT Guarantee
❌ Not a security audit or compliance certification
❌ Not a performance ranking or scorecard
❌ Not a competitive analysis tool
❌ Not a safety guarantee (operational indicators only)

### Compliance Controls
- **Read-only**: No write access to Guardian data
- **Aggregate-only**: Cannot drill down to individual incidents
- **Z10-gated**: AI brief requires governance approval
- **Audit logged**: All plugin lifecycle events tracked
- **Tier-locked**: ENTERPRISE only (no mass usage)

## Troubleshooting

### "Cohort too small for industry"
**Cause**: Industry-specific cohort has <10 members.
**Resolution**: Plugin falls back to global cohort. This is normal and safe.
**Message to user**: "Using global cohort (150+ members) for privacy. Industry cohort available when it grows."

### "No benchmarks available"
**Possible causes**:
- Insufficient operational history (need ≥30 days)
- Metrics not configured in data source
- Feature `insights_dashboard` not enabled

**Resolution**: Verify incident tracking is active and data is flowing.

### "K-anonymity verification failed"
**This should never happen** if plugin is working correctly. If it does:
1. Check workspace tier (must be ENTERPRISE)
2. Verify features enabled
3. Contact support

## FAQ

**Q: Can I see who else is in my cohort?**
A: No. Cohort membership is never disclosed. Only the cohort size and label (industry or global) are shown.

**Q: Are these metrics compared against my competitors?**
A: No. Benchmarks are contextual indicators against anonymised peers, not competitive comparisons. No organization names are disclosed.

**Q: Can benchmarks be used for compliance scoring?**
A: No. These are operational indicators only, not compliance metrics or certifications. Always use official audit frameworks.

**Q: What if my company is very large/small?**
A: Benchmarking still works via k-anonymity. If your company is anomalous, industry cohort may be small; global cohort is always available (150+ members).

**Q: Is the AI brief trustworthy?**
A: Yes. The AI brief uses deterministic templates and is gated by Z10 governance. No competitive or ranking language is allowed.

**Q: Can I export benchmarks?**
A: Exports are disabled by default for privacy. Request export capability via governance settings if needed.

## Technical Details

### Cohort Selection Logic
1. Tenant provides industry (optional)
2. If industry-specific cohort ≥ 10: use it
3. Else: fallback to global cohort
4. Return cohort metadata (size, label, window)
5. **Never expose cohort membership**

### Metric Computation
1. Compute tenant metrics from Guardian aggregate data
2. Fetch pre-aggregated cohort distributions (anonymised)
3. Calculate deltas: (tenant - cohort_median) / cohort_median * 100
4. Map delta to interpretation (below/typical/elevated)
5. Generate neutral rationale string

### Privacy Guarantees
- No tenant identifier in output
- No time-series or individual incident data
- No cohort member list
- No reverse inference possible (deltas only)
- K ≥ 10 enforced at all levels

## Support

For issues or questions:
1. Check FAQ above
2. Review privacy guarantee section
3. Verify tier/features are enabled
4. Contact support with workspace ID (no benchmark data required)

---

**Disclaimer**: Benchmarks are anonymised, aggregate-only operational indicators. Not a ranking, scorecard, compliance certification, or competitive analysis. Use for contextual understanding of operational patterns only. Always verify decisions with official audit frameworks and domain expertise.
