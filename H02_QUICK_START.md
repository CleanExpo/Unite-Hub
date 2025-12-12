# Guardian H02: AI Anomaly Detection — Quick Start

**Status**: Implementation In Progress
**Completion**: 55% (5 of 9 tasks complete)
**Date**: 2025-12-12

---

## What Is H02?

Guardian H02 adds **AI-assisted anomaly detection** on top of Guardian's aggregate metrics:

- **6 Supported Metrics**: alerts, incidents, correlation clusters, notification failure rate, risk P95, insights activity
- **3 Statistical Methods**: Z-Score, EWMA, IQR for flexible baseline computation
- **Aggregate-Only**: All data is PII-free (no raw payloads, no destinations)
- **Governance-Gated AI**: Claude explanations (optional, respects Z10 policy)
- **Advisory-Only**: Anomalies never auto-create incidents/rules; admins review and decide

---

## Implementation Status

### ✅ COMPLETED (Tasks 1-5)

**Schema** (Migration 612)
- `guardian_anomaly_detectors` — Detector configurations
- `guardian_anomaly_baselines` — Baseline statistics
- `guardian_anomaly_events` — Advisory-only anomaly records

**Services** (5 files, 1,200+ lines)
- `anomalyMetricAggregator.ts` — Fetch aggregate time series (6 metrics)
- `anomalyBaselineService.ts` — Compute/store baselines (zscore/ewma/iqr)
- `anomalyDetectionService.ts` — Evaluate detectors, create events
- `anomalyExplainerAiHelper.ts` — Generate AI explanations (Z10-gated)
- `metaGovernanceHelper.ts` — Access Z10 governance flags

**API Routes** (Started)
- ✅ `GET /api/guardian/ai/anomalies/detectors` — List detectors
- ✅ `POST /api/guardian/ai/anomalies/detectors` — Create detector

---

### 🟡 IN PROGRESS (Tasks 6-9)

**API Routes** (8 more needed)
- Detector detail/update/delete
- Rebuild baseline
- Run detection
- List/detail/ack-resolve anomalies
- AI explanation

**UI Console** (500+ lines)
- Detectors tab: create, configure, rebuild baseline
- Events tab: list, filter, detail, acknowledge, resolve
- Optional: "Explain with AI" button

**Z13 Automation** (Optional)
- Task types: rebuild baselines, run detection
- Scheduled cadence support

**Tests & Docs** (400+ lines each)
- Unit tests for baseline/anomaly scoring
- API endpoint tests
- UI interaction tests
- Full documentation

---

## Key Files

### Database
```
supabase/migrations/612_guardian_h02_anomaly_detection_baselines_and_events.sql
```

### Services
```
src/lib/guardian/ai/
  ├─ anomalyMetricAggregator.ts
  ├─ anomalyBaselineService.ts
  ├─ anomalyDetectionService.ts
  ├─ anomalyExplainerAiHelper.ts
  └─ metaGovernanceHelper.ts
```

### API Routes (In Progress)
```
src/app/api/guardian/ai/anomalies/
  ├─ detectors/route.ts ✅
  ├─ detectors/[id]/route.ts
  ├─ detectors/[id]/rebuild-baseline/route.ts
  ├─ run/route.ts
  ├─ events/route.ts
  ├─ events/[id]/route.ts
  └─ events/[id]/explain/route.ts
```

### UI (Planned)
```
src/app/guardian/admin/anomalies/page.tsx
```

---

## Supported Metrics

| Metric | Description | Typical Use |
|--------|-------------|------------|
| `alerts_total` | Count of alerts per bucket | Detect alert storms |
| `incidents_total` | Count of incidents per bucket | Identify incident spikes |
| `correlation_clusters` | Count of active clusters | Monitor correlation activity |
| `notif_fail_rate` | Notification failure % | Detect delivery issues |
| `risk_p95` | 95th percentile risk score | Track risk escalation |
| `insights_activity_24h` | Insights/activity count | Monitor system activity |

---

## Baseline Methods

| Method | Description | Best For |
|--------|-------------|----------|
| **Z-Score** | Mean ± N × stddev | Symmetric distributions |
| **EWMA** | Exponential moving average | Trending metrics |
| **IQR** | Interquartile range fences | Outlier detection |

---

## Anomaly Severity

| Severity | Condition | Example |
|----------|-----------|---------|
| **info** | Deviation < threshold | Gentle increase |
| **warn** | Deviation ≥ threshold | Notable anomaly |
| **high** | Deviation ≥ threshold × 1.5 | Significant anomaly |
| **critical** | Deviation ≥ threshold × 2.5 | Severe anomaly |

---

## Workflow

1. **Create Detector** via UI or API
   - Select metric (alerts_total, etc.)
   - Choose method (zscore, ewma, iqr)
   - Set threshold and window size

2. **Rebuild Baseline** (manual or scheduled via Z13)
   - Computes stats from historical lookback window
   - Stores in `guardian_anomaly_baselines`

3. **Run Detection** (manual or scheduled)
   - Evaluates all active detectors
   - Creates anomaly event if threshold exceeded
   - Records score, severity, PII-free context

4. **Review in UI**
   - Inspect anomaly details
   - View expected vs observed values
   - (Optional) Get AI explanation if governance allows

5. **Acknowledge/Resolve**
   - Mark event as acknowledged (in-progress investigation)
   - Resolve when issue addressed
   - Admin records notes/decision

---

## API Quick Reference

### Create Detector
```bash
POST /api/guardian/ai/anomalies/detectors?workspaceId=ws-123
{
  "name": "Alert Storm Monitor",
  "description": "Detect unusual alert volume",
  "metricKey": "alerts_total",
  "method": "zscore",
  "threshold": 3.0,
  "granularity": "hour",
  "windowSize": 24
}
```

### Run Detection Now
```bash
POST /api/guardian/ai/anomalies/run?workspaceId=ws-123
```

### List Anomalies
```bash
GET /api/guardian/ai/anomalies/events?workspaceId=ws-123&status=open
```

### Acknowledge Anomaly
```bash
PATCH /api/guardian/ai/anomalies/events/[id]?workspaceId=ws-123
{ "status": "acknowledged" }
```

### Get AI Explanation (If Allowed)
```bash
GET /api/guardian/ai/anomalies/events/[id]/explain?workspaceId=ws-123
```

---

## Governance Integration (Z10)

H02 respects Z10 `ai_usage_policy`:

```
if Z10.aiUsagePolicy === 'enabled'  → Use Claude Sonnet for explanations
if Z10.aiUsagePolicy === 'disabled' → Use deterministic explanations
if Z10 absent                        → Default to disabled (graceful)
```

All AI explanations use **aggregate data only** — no raw payloads, no PII.

---

## Non-Breaking Guarantees

✅ **H02 does NOT:**
- Modify Guardian core G-series tables
- Create incidents or rules automatically
- Send external notifications
- Store raw payloads or PII
- Weaken RLS or auth models

✅ **H02 ONLY:**
- Adds 3 new meta tables
- Reads aggregate metrics
- Stores advisory anomaly records
- Respects Z10 governance

---

## Testing Commands

Once implementation completes (tasks 6-9):

```bash
# Run H02 tests
npm run test -- tests/guardian/h02_anomaly_detection.test.ts

# TypeScript validation
npm run typecheck

# Build
npm run build
```

---

## Deployment Steps

1. **Apply Migration**
   ```sql
   \i supabase/migrations/612_guardian_h02_anomaly_detection_baselines_and_events.sql
   ```

2. **Deploy Services** (auto via Next.js)
   ```
   src/lib/guardian/ai/anomaly*.ts
   ```

3. **Deploy APIs** (auto via Next.js)
   ```
   src/app/api/guardian/ai/anomalies/**/*.ts
   ```

4. **Deploy UI** (auto via Next.js)
   ```
   src/app/guardian/admin/anomalies/page.tsx
   ```

5. **Verify**
   - Navigate to `/guardian/admin/anomalies`
   - Create a test detector
   - Rebuild baseline
   - Run detection
   - Check anomaly events in UI

---

## What's Next

### Remaining Tasks
- Complete API routes (T06)
- Build UI console (T07)
- Z13 automation (T08)
- Tests & documentation (T09)

### Future Enhancements (H03, H04, ...)
- H03: Anomaly correlation with rule suggestions
- H04: Feedback loops (train detector quality)
- H05: Multi-detector correlation (related anomalies)
- H06: Anomaly forecasting

---

**Full Plan**: [H02_IMPLEMENTATION_PLAN.md](H02_IMPLEMENTATION_PLAN.md)

**Status**: 55% complete, on track for full production readiness.
