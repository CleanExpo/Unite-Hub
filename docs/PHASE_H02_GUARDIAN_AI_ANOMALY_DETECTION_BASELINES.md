# Guardian H02: AI Anomaly Detection — Complete Documentation

**Phase**: Guardian H02 (Meta-Only AI Anomaly Detection & Signal Baselines)
**Status**: ✅ Production Ready (All 9 Tasks Complete)
**Date**: 2025-12-12

---

## Overview

Guardian H02 delivers **aggregate-only anomaly detection** with baseline-driven statistical analysis. It enables admins to:

1. **Define anomaly detectors** for 6 aggregate metrics (alerts, incidents, clusters, failure rates, percentiles, activity)
2. **Compute rolling baselines** using three statistical methods (Z-Score, EWMA, IQR)
3. **Detect anomalies** when observations exceed baseline expectations
4. **Explain anomalies** via AI (Claude Sonnet, governance-gated) or deterministic fallback
5. **Review & acknowledge** events in Anomaly Detection Studio console
6. **Schedule automation** via Z13 meta task runner

**Non-Breaking**: Pure extension of Guardian meta stack. No changes to core G/H/I/X tables or behavior.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│ Guardian Aggregate Signals (per bucket)     │
│ - alerts_total, incidents_total, etc.       │
└──────────────────┬──────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ Metric Aggregator (anomalyMetricAggregator)  │
│ - getMetricSeries(metricKey, granularity)    │
│ - Returns: [{ bucket_time, value, count }]   │
└──────────────────┬──────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ Baseline Builder (anomalyBaselineService)    │
│ - computeBaseline(series, method, window)    │
│ - buildAndStoreBaseline(tenantId, detectorId)│
│ - Three methods: zscore, ewma, iqr            │
└──────────────────┬──────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ Anomaly Detector (anomalyDetectionService)   │
│ - evaluateDetector(tenantId, detectorId)     │
│ - runAllActiveDetectors(tenantId)            │
│ - Creates advisory-only events                │
└──────────────────┬──────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ AI Explainer (anomalyExplainerAiHelper)      │
│ - explainAnomaly(event, detector, stats)     │
│ - [Z10 Governance Gating: enabled/disabled]  │
│ - Uses Claude Sonnet (aggregate only)        │
│ - Fallback: deterministic template           │
└──────────────────┬──────────────────────────┘
                   ↓
        ┌──────────────────────┐
        │ Admin Review in UI    │
        │ (Acknowledge/Resolve) │
        └──────────────────────┘
```

---

## Supported Metrics (Aggregate-Only)

All metrics are **counts, rates, or percentiles** — no raw payloads or PII:

| Metric | Type | Description | Typical Range |
|--------|------|-------------|----------------|
| `alerts_total` | Count | # alerts per bucket | 0-1000+ |
| `incidents_total` | Count | # incidents per bucket | 0-100+ |
| `correlation_clusters` | Count | # active clusters per bucket | 0-50 |
| `notif_fail_rate` | Rate (%) | Notification failure % | 0-100 |
| `risk_p95` | Percentile | 95th percentile risk score | 0-10 |
| `insights_activity_24h` | Count | Activity count (24h window) | 0-1000+ |

**Guarantees**:
- ✅ No raw alert payloads
- ✅ No raw incident data
- ✅ No correlation event details
- ✅ No notification bodies or URLs
- ✅ No emails, IPs, API keys, secrets

---

## Baseline Methods

### 1. Z-Score (Standard Deviation Bands)

**Best for**: Symmetric distributions, normally distributed metrics

**Algorithm**:
```
mean = sum(series) / count(series)
stddev = sqrt(sum((x - mean)^2) / count(series))
lower_bound = mean - (threshold * stddev)
upper_bound = mean + (threshold * stddev)
```

**Anomaly Score**: `|(observed - mean) / stddev|`

**Example**: With mean=100, stddev=10, threshold=3
- Normal range: [70, 130]
- Anomaly if observed > 130 or < 70

**Configuration**:
- `threshold`: Multiple of stddev (default: 3.0)
- `window_size`: Hours/days in window (default: 24)
- `baseline_lookback`: Historical hours/days (default: 168 = 7 days)

### 2. EWMA (Exponential Weighted Moving Average)

**Best for**: Trending metrics, time-series with drift

**Algorithm**:
```
alpha = 2 / (N + 1)  // where N = window size
ewma_t = alpha * observed_t + (1 - alpha) * ewma_(t-1)
variance = alpha * (1 - alpha) * variance_(t-1) + (1 - alpha)^2 * (observed_t - ewma_t)^2
```

**Anomaly Score**: `|observed - ewma_mean| / sqrt(variance)`

**Advantages**:
- Adapts to gradual trends
- Lower weight for old values
- Better for non-stationary metrics

**Configuration**:
- `threshold`: Deviation multiplier (default: 2.0)
- `window_size`: Smoothing parameter (default: 24)

### 3. IQR (Interquartile Range)

**Best for**: Outlier detection, skewed or bimodal distributions

**Algorithm**:
```
q1 = 25th percentile
q3 = 75th percentile
iqr = q3 - q1
lower_fence = q1 - (1.5 * iqr)
upper_fence = q3 + (1.5 * iqr)
```

**Anomaly Score**: Distance to nearest fence
- If observed > upper_fence: `observed - upper_fence`
- If observed < lower_fence: `lower_fence - observed`

**Robustness**: Not affected by extreme outliers

**Configuration**:
- `threshold`: Fence multiplier (default: 1.5)
- `window_size`: Not used (percentile-based)

---

## Anomaly Scoring & Severity Bands

### Score Calculation

Per baseline method:
- **Z-Score**: `|(observed - mean) / stddev|`
- **EWMA**: `|observed - mean| / sqrt(variance)`
- **IQR**: Distance to fence (upper or lower)

### Severity Bands

Derived from score magnitude relative to detector threshold:

| Severity | Condition | Example (threshold=2) |
|----------|-----------|----------------------|
| `info` | score < threshold | score = 1.5 |
| `warn` | threshold ≤ score < threshold × 1.5 | score = 2.0-3.0 |
| `high` | threshold × 1.5 ≤ score < threshold × 2.5 | score = 3.0-5.0 |
| `critical` | score ≥ threshold × 2.5 | score ≥ 5.0 |

### Noise Filtering

Detectors support `min_count` parameter:
- **Purpose**: Ignore low-volume observations
- **Example**: `min_count=5` ignores observations < 5 (e.g., < 5 alerts/hour)
- **Use case**: Avoid false positives on sparse metrics

---

## Governance Integration (Z10)

### Feature Flag: `ai_usage_policy`

Located in `guardian_meta_feature_flags` table:

```javascript
{
  tenant_id: "ws-123",
  ai_usage_policy: "enabled" | "disabled",  // Default: disabled
  external_sharing_policy: "internal_only" | "with_partners",
  ...
}
```

### Behavior

| Flag Value | AI Explanation | Fallback |
|----------|---|----------|
| `enabled` | Use Claude Sonnet (aggregate-only prompts) | N/A |
| `disabled` | Skip AI, use deterministic fallback | ✅ Deterministic |
| Missing (Z10 absent) | Skip AI, use deterministic fallback | ✅ Deterministic |

### AI Explainer (Claude Sonnet)

**Prompt Strategy**: Aggregate-only, no PII, strict guardrails

```markdown
You are explaining anomalies in Guardian system metrics (aggregates only).
Metric: alerts_total
Observed: 250 alerts/hour
Expected: 100 alerts/hour (baseline mean)
Score: 5.0 (zscore)
Severity: critical

Provide:
1. Explanation (2-3 sentences)
2. Possible causes (3-5 bullet points)
3. Next steps (2-3 recommended actions)

Constraints:
- No promises, no blame
- Focus on investigation steps
- Mention related metrics to check
- Recommend rule suggestions if appropriate
```

**Response Format**:
```json
{
  "explanation": "Alerts have spiked significantly above baseline...",
  "possibleCauses": [
    "Production issue triggered high-volume alerting",
    "New automation rule or webhook changed alert routing",
    "Third-party service experiencing errors"
  ],
  "nextSteps": [
    "Review recent rule changes",
    "Check correlation clusters for root cause",
    "Consider creating H01 rule suggestion to catch this pattern"
  ],
  "relatedRuleIdea": "alert_volume_surge"
}
```

### Deterministic Fallback

If AI disabled or Z10 absent:

```typescript
// Metric-specific possible causes
const fallbacks = {
  alerts_total: [
    'Increase in alert-triggering conditions',
    'New rules or integrations added',
    'Third-party system sending more events',
  ],
  incidents_total: [
    'Alert-to-incident auto-escalation activated',
    'Manual incident creation spike',
    'New incident detection rule enabled',
  ],
  // ... etc for each metric
};

// Severity-based next steps
const nextSteps = {
  critical: [
    'Immediately review recent changes',
    'Check related metrics (correlation, failed notifications)',
    'Consider disabling problematic rules if blocking operations',
  ],
  high: [
    'Review what changed in the past hour',
    'Investigate related metrics',
    'Check for patterns in related data',
  ],
  // ... etc
};
```

---

## Detector Configuration

### Table: `guardian_anomaly_detectors`

```sql
CREATE TABLE guardian_anomaly_detectors (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,  -- RLS isolation
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Metric & window
  metric_key TEXT NOT NULL,  -- 'alerts_total', 'incidents_total', etc.
  granularity TEXT DEFAULT 'hour',  -- 'hour' | 'day'
  window_size INTEGER DEFAULT 24,  -- # of buckets in window
  baseline_lookback INTEGER DEFAULT 168,  -- # of hours/days for baseline

  -- Detection method & threshold
  method TEXT DEFAULT 'zscore',  -- 'zscore' | 'ewma' | 'iqr'
  threshold NUMERIC DEFAULT 3.0,  -- zscore: # of stddev, iqr: fence mult
  min_count INTEGER DEFAULT 0,  -- Noise filter (skip if < this)

  -- Extensibility
  config JSONB DEFAULT '{}'::jsonb,  -- method-specific params
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Create Detector (API)

```bash
POST /api/guardian/ai/anomalies/detectors?workspaceId=ws-123
{
  "name": "Alert Volume Spike",
  "description": "Detects unusual alert count per hour",
  "metric_key": "alerts_total",
  "granularity": "hour",
  "window_size": 24,
  "baseline_lookback": 168,
  "method": "zscore",
  "threshold": 3.0,
  "min_count": 0
}
```

### Update Detector

```bash
PATCH /api/guardian/ai/anomalies/detectors/{id}?workspaceId=ws-123
{
  "threshold": 2.5,  # Tighten threshold
  "is_active": false  # Disable detector
}
```

### Delete Detector

```bash
DELETE /api/guardian/ai/anomalies/detectors/{id}?workspaceId=ws-123
# Soft delete (is_active = false)
```

---

## Baseline Management

### Table: `guardian_anomaly_baselines`

```sql
CREATE TABLE guardian_anomaly_baselines (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  detector_id UUID NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Baseline stats (method-specific)
  stats JSONB NOT NULL,  -- { method, zscore?, ewma?, iqr?, datapoints, min/max }

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Compute Baseline

```bash
POST /api/guardian/ai/anomalies/detectors/{id}/rebuild-baseline?workspaceId=ws-123

Response:
{
  "baselineId": "baseline-xyz",
  "detectorId": "detector-abc",
  "datapoints": 168,  # # of historical buckets used
  "method": "zscore",
  "computedAt": "2025-01-12T10:00:00Z",
  "stats": {
    "method": "zscore",
    "zscore": {
      "mean": 105.5,
      "stddev": 12.3
    },
    "datapoints": 168,
    "min_value": 45,
    "max_value": 230
  }
}
```

### Refresh Cadence

**Recommendation**:
- **Daily metrics** (risk_p95, activity_24h): Rebuild every 24 hours
- **Hourly metrics** (alerts, incidents): Rebuild every 6-12 hours
- **Z13 Automation**: Schedule `anomaly_rebuild_baselines` task daily

---

## Anomaly Events

### Table: `guardian_anomaly_events`

```sql
CREATE TABLE guardian_anomaly_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  detector_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  observed_at TIMESTAMPTZ NOT NULL,

  -- Observation & score
  observed_value NUMERIC NOT NULL,
  expected_value NUMERIC NULL,  -- Baseline expectation
  score NUMERIC NOT NULL,

  -- Severity & status
  severity TEXT NOT NULL,  -- 'info' | 'warn' | 'high' | 'critical'
  status TEXT DEFAULT 'open',  -- 'open' | 'acknowledged' | 'resolved'

  -- Summary & context (PII-free)
  summary TEXT NOT NULL,  -- "Alerts exceeded baseline by 2.5x"
  details JSONB NOT NULL DEFAULT '{}',  -- { window_values, baseline_stats, trend, related_metrics }

  -- Admin actions
  acknowledged_at TIMESTAMPTZ NULL,
  acknowledged_by TEXT NULL,  -- email, actor
  resolved_at TIMESTAMPTZ NULL,
  resolved_by TEXT NULL,

  -- Optional link to H01 rule suggestion
  related_suggestion_id UUID NULL
);
```

### Event Details (PII-Free)

```json
{
  "window_values": [95, 102, 108, 110, 105],
  "window_average": 104,
  "baseline_mean": 100,
  "baseline_stddev": 5,
  "recent_trend": "rising",
  "related_metrics": {
    "incidents_total": 12,
    "notif_fail_rate": 0.02
  }
}
```

### Run Detection

```bash
POST /api/guardian/ai/anomalies/run?workspaceId=ws-123

Response:
{
  "detectors_run": 8,
  "anomalies_detected": 2,
  "errors": [],
  "results_summary": {
    "total": 8,
    "with_anomalies": 2,
    "with_errors": 0,
    "successful": 8
  },
  "completed_at": "2025-01-12T10:05:00Z"
}
```

### View Events

```bash
GET /api/guardian/ai/anomalies/events?workspaceId=ws-123&status=open&severity=critical
# Optional filters: status, severity, detectorId, limit, offset
```

### Acknowledge Event

```bash
PATCH /api/guardian/ai/anomalies/events/{id}?workspaceId=ws-123
{
  "status": "acknowledged"
}
```

### Resolve Event

```bash
PATCH /api/guardian/ai/anomalies/events/{id}?workspaceId=ws-123
{
  "status": "resolved"
}
```

### Get Explanation

```bash
GET /api/guardian/ai/anomalies/events/{id}/explain?workspaceId=ws-123

Response:
{
  "eventId": "evt-xyz",
  "explanation": {
    "explanation": "Alert volume has increased significantly...",
    "possibleCauses": [...],
    "nextSteps": [...]
  },
  "generated_at": "2025-01-12T10:05:00Z"
}
```

---

## Anomaly Detection Studio (UI)

**Route**: `/guardian/admin/anomalies?workspaceId=ws-123`

### Tab 1: Detectors

**Features**:
1. **List** — All detectors with status, metric, method, threshold, last baseline
2. **Create** — Form to create new detector (metric selector, method dropdown, threshold slider)
3. **Actions per detector**:
   - "Rebuild Baseline Now" button → Immediately rebuild baseline
   - Delete button → Archive detector (soft delete)
4. **Status display** — Shows last baseline computed time, any error messages

### Tab 2: Events

**Features**:
1. **List** — All anomaly events with severity badge, status, metric, observed/expected values, time
2. **Filters**:
   - Status: open / acknowledged / resolved
   - Severity: info / warn / high / critical
   - Detector: dropdown of all detectors
   - Date range: (optional)
3. **Quick actions**:
   - Acknowledge button → Mark acknowledged
   - Resolve button → Mark resolved
4. **Detail drawer** (click event to expand):
   - Expected vs observed values
   - Recent window sparkline (simple chart)
   - Baseline stats summary (mean, stddev, etc.)
   - PII-free context (recent values, trend, related metrics)
   - "Explain with AI" button (disabled with tooltip if governance doesn't allow)
   - Acknowledge/resolve controls
5. **Top-level buttons**:
   - "Run Detection Now" → Trigger immediate evaluation
   - "Create Detector" → New detector form

---

## Z13 Automation Integration

### Task Types

#### `anomaly_rebuild_baselines`

**Purpose**: Rebuild all active detector baselines

**Configuration**:
```javascript
{
  anomaly_rebuild_baselines: {}
}
```

**Response**:
```javascript
{
  status: 'success' | 'error',
  count: 5,  // # of baselines rebuilt
  ids: ['baseline-1', 'baseline-2', ...],
  warnings: ['Detector X: insufficient data'],
  message: 'Rebuilt 5 baselines'
}
```

#### `anomaly_run_detectors`

**Purpose**: Run all active detectors against latest metrics

**Configuration**:
```javascript
{
  anomaly_run_detectors: {}
}
```

**Response**:
```javascript
{
  status: 'success' | 'error',
  count: 8,  // # of detectors run
  message: 'Ran 8 detectors, detected 2 anomalies',
  warnings: ['Detector Y: baseline not ready'],
  results_summary: {
    total: 8,
    with_anomalies: 2,
    with_errors: 0,
    successful: 8
  }
}
```

### Schedule Example

**Daily baseline rebuild + hourly detection**:

```javascript
// Automation config
{
  tasks: [
    {
      key: 'anomaly_rebuild_baselines',
      schedule: 'daily', // 00:00 UTC
      config: {}
    },
    {
      key: 'anomaly_run_detectors',
      schedule: 'hourly',  // Every hour
      config: {}
    }
  ]
}
```

---

## Testing

### Test Coverage

**Located**: `tests/guardian/h02_anomaly_detection.test.ts`

**Coverage**:
- ✅ Baseline computation (zscore/ewma/iqr) with fixed data
- ✅ Anomaly scoring and severity bands
- ✅ Min-count noise filtering behavior
- ✅ Metric aggregator (aggregate query validation)
- ✅ API endpoint tenant scoping and admin-only enforcement
- ✅ AI explainer governance gating (mocked Claude)
- ✅ UI interactions (create, rebuild, run, ack/resolve)
- ✅ Z13 automation task execution
- ✅ Non-breaking verification (no core Guardian changes)

**Run**:
```bash
npm run test -- tests/guardian/h02_anomaly_detection.test.ts
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Apply migration 612 (schema + RLS)
- [ ] Deploy services (`anomalyMetricAggregator`, `anomalyBaselineService`, etc.)
- [ ] Deploy API routes (all 9 endpoints)
- [ ] Deploy UI console (`src/app/guardian/admin/anomalies/page.tsx`)
- [ ] Update Z13 metaTaskRunner with anomaly tasks
- [ ] Run tests: `npm run test -- h02_anomaly_detection.test.ts`
- [ ] Run typecheck: `npm run typecheck` (0 errors expected)

### Production Rollout

1. **Database**: Apply migration 612
2. **Code**: Deploy all H02 files
3. **Verification**:
   - Create test detector in UI
   - Run detection manually
   - Verify baseline computed
   - Acknowledge/resolve test event
   - Check "Explain" button (respects Z10 flag)
4. **Z13 Integration**: Enable automated baseline rebuild & detection runs
5. **Monitoring**: Watch Guardian logs for errors, baseline rebuild logs

### Rollback Plan

If issues occur:
1. Disable `anomaly_rebuild_baselines` and `anomaly_run_detectors` tasks in Z13
2. Set all detectors `is_active = false` in UI (soft delete)
3. Migration is non-breaking; can remain deployed

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| No detectors visible | Tenant ID in URL? User has admin access? |
| Baseline not computing | 7+ days of metric history available? Metrics granularity correct? |
| No anomalies detected | Threshold too high? Recent spike in metrics? |
| AI disabled | Check Z10 `ai_usage_policy` flag (defaults to disabled) |
| Events not stored | Detector `is_active = true`? Baseline exists? |
| Slow detection runs | Too many detectors (>20)? Consider Z13 caching |

---

## Non-Breaking Guarantees

✅ **H02 does NOT**:
- Modify core Guardian G-series tables (alerts, incidents, rules, network)
- Export raw payloads or PII
- Create incidents or rules automatically
- Send external notifications without approval
- Weaken RLS or auth

✅ **H02 ONLY**:
- Adds 3 new meta tables (detectors, baselines, events)
- Reads aggregate metrics (counts, rates, percentiles)
- Stores advisory records (admins review and decide)
- Respects Z10 governance (AI usage policy)
- Extends meta stack non-invasively

---

## Production Readiness

**Status**: ✅ Production Ready

**Metrics**:
- 1,600+ lines of core services
- 200+ lines of API routes
- 600+ lines of UI console
- 100+ lines of Z13 integration
- 400+ lines of tests
- Full RLS enforcement
- TypeScript strict mode compliance
- Comprehensive documentation

**Next Steps**:
1. Deploy to production environment
2. Enable Z13 automation tasks
3. Configure baseline rebuild cadence (daily)
4. Configure detection run cadence (hourly or on-demand)
5. Monitor baseline quality & anomaly signal-to-noise ratio
6. Gather feedback from admin users

---

**Documentation Version**: 1.0
**Last Updated**: 2025-12-12
**Maintained By**: Guardian Meta Team
