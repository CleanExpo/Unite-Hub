# Phase 8 Week 23: Scheduling Engine & Alert System - COMPLETE

**Branch:** `feature/phase8-week23-scheduling-alerts`
**Track:** C - Scheduling & Alerts
**Status:** Complete
**Date:** 2025-01-20

---

## Executive Summary

Week 23 delivers a complete **autonomous scheduling system** with anomaly detection and email alerting, enabling Unite-Hub to monitor SEO metrics 24/7 and notify staff of significant changes.

### Key Deliverables

- **SchedulingEngine.ts** (350+ lines) - Recurring job management
- **AnomalyDetector.ts** (380+ lines) - Threshold-based anomaly detection
- **AlertEmailService.ts** (420+ lines) - Email notifications with HTML templates
- **Cron API** (150+ lines) - Vercel Cron integration
- **Database Migration** (120+ lines) - Anomalies table with RLS
- **Zod Schemas** (180+ lines) - Type-safe validation
- **Unit Tests** (20 tests) - Anomaly detection coverage

---

## Architecture

### Scheduling Flow

```
Vercel Cron (hourly)
    ↓
POST /api/autonomy/cron
    ↓
SchedulingEngine.getDueSchedules()
    ↓
For each due schedule:
    ├─→ SchedulingEngine.executeJob()
    │       ├─→ WEEKLY_SNAPSHOT → ReportEngine (JSON only)
    │       ├─→ MONTHLY_FULL_AUDIT → ReportEngine (all formats)
    │       └─→ ANOMALY_CHECK → AnomalyDetector
    ├─→ Update next_run_at
    ├─→ Log execution
    └─→ Send email notifications
```

### Anomaly Detection Flow

```
Latest 2 Audits
    ↓
AnomalyDetector.detectAnomalies()
    ├─→ Check Health Score (15% drop threshold)
    ├─→ Check Backlinks (20% loss threshold)
    └─→ Check Delta Summary (keywords lost)
    ↓
For each anomaly:
    ├─→ Classify severity (LOW/MEDIUM/HIGH/CRITICAL)
    ├─→ Generate recommendations
    ├─→ Store in seo_anomalies table
    └─→ Send alert email (HIGH/CRITICAL only)
```

---

## Components Implemented

### 1. Scheduling Engine

**Job Types:**

| Type | Frequency Options | Description |
|------|-------------------|-------------|
| `WEEKLY_SNAPSHOT` | WEEKLY | Quick health check, JSON only |
| `MONTHLY_FULL_AUDIT` | MONTHLY | Complete audit, all formats |
| `ANOMALY_CHECK` | DAILY | Check for metric anomalies |

**Key Methods:**

```typescript
// Create a schedule
await SchedulingEngine.createSchedule({
  client_id: "uuid",
  job_type: "WEEKLY_SNAPSHOT",
  frequency: "WEEKLY",
  created_by: "user-uuid",
  client_consent: true,
});

// Get due schedules
const due = await SchedulingEngine.getDueSchedules();

// Execute a job
const result = await SchedulingEngine.executeJob(schedule);

// Get execution history
const history = await SchedulingEngine.getExecutionHistory(scheduleId, 10);
```

**Schedule Calculation:**
- DAILY: +1 day
- WEEKLY: +7 days
- FORTNIGHTLY: +14 days
- MONTHLY: +1 month
- All jobs run at 3 AM to avoid peak hours

---

### 2. Anomaly Detector

**Anomaly Types:**

| Type | Threshold | Trigger |
|------|-----------|---------|
| `HEALTH_SCORE_DROP` | -15% | Score decreases significantly |
| `HEALTH_SCORE_SPIKE` | +25% | Unusual increase (investigate) |
| `TRAFFIC_DROP` | -30% | Traffic decreases |
| `TRAFFIC_SPIKE` | +50% | Unusual traffic increase |
| `BACKLINKS_LOST` | -20% | Lost referring domains |
| `BACKLINKS_SPIKE` | +100% | Potential spam attack |
| `POSITION_DROP` | 5 keywords | Multiple keywords lost |
| `TOXIC_BACKLINKS` | 30% | Toxic score too high |
| `CRAWL_ERRORS` | 10+ | Too many crawl errors |
| `INDEX_DROP` | -20% | Indexed pages dropped |

**Severity Levels:**

| Severity | % Change | Action |
|----------|----------|--------|
| LOW | < 20% | Monitor |
| MEDIUM | 20-30% | Investigate |
| HIGH | 30-50% | Urgent action |
| CRITICAL | > 50% | Emergency response |

**Recommendations:**
- Automatically generated based on anomaly type and severity
- Critical anomalies get extra recommendations (manual penalties, server logs)

---

### 3. Alert Email Service

**Email Types:**

| Type | When Sent | Content |
|------|-----------|---------|
| `ANOMALY_ALERT` | HIGH/CRITICAL anomaly | Metrics + recommendations |
| `WEEKLY_DIGEST` | After WEEKLY_SNAPSHOT | Health score + changes |
| `MONTHLY_REPORT` | After MONTHLY_FULL_AUDIT | Full report summary |
| `JOB_COMPLETED` | Any job completes | Duration + results |
| `JOB_FAILED` | Any job fails | Error message |

**Email Features:**
- HTML templates with inline CSS
- Plain text fallback
- Severity-based color coding
- Metric comparison display
- Recommendation list
- Automatic logging to `email_log` table

**Example Alert Email:**

```
┌─────────────────────────────────┐
│ [HIGH] HEALTH_SCORE_DROP        │
│ Client Name                     │
├─────────────────────────────────┤
│                                 │
│ Health score dropped 25% from   │
│ 80 to 60                        │
│                                 │
│ Previous: 80  Current: 60       │
│ Change: -25%                    │
│                                 │
│ Recommendations:                │
│ • Run technical SEO audit       │
│ • Check for algorithm updates   │
│ • Review recent site changes    │
│                                 │
└─────────────────────────────────┘
```

---

### 4. Cron API Endpoint

**POST /api/autonomy/cron**

Triggered by Vercel Cron (configure in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/autonomy/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Response:**

```json
{
  "message": "Cron execution complete",
  "executed": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "client_id": "uuid",
      "job_type": "WEEKLY_SNAPSHOT",
      "success": true,
      "duration_ms": 3500
    }
  ],
  "timestamp": "2025-01-20T03:00:00Z"
}
```

**GET /api/autonomy/cron**

Returns current status and due schedules.

---

### 5. Database Migration (055)

**New Table: seo_anomalies**

```sql
CREATE TABLE seo_anomalies (
  anomaly_id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  metric_name TEXT NOT NULL,
  previous_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL,
  threshold_exceeded NUMERIC NOT NULL,
  message TEXT NOT NULL,
  recommendations TEXT[],
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ
);
```

**RLS Policies:**
- Staff can view/update anomalies for their organization's clients
- Service role can insert anomalies

**New Column:**
- `seo_client_profiles.notification_email` - Where to send alerts

---

## Unit Tests

### Anomaly Detector Tests (20)

**Health Score Detection:**
- Detect HEALTH_SCORE_DROP for significant drops
- Detect CRITICAL severity for 50%+ drops
- Detect HIGH severity for 30-50% drops
- Detect HEALTH_SCORE_SPIKE for unusual increases
- Return null for normal changes
- Handle zero previous value

**Backlink Detection:**
- Detect BACKLINKS_LOST for significant drops
- Detect BACKLINKS_SPIKE for sudden increases
- Return null for normal changes

**Delta Summary Detection:**
- Detect POSITION_DROP for many keywords lost
- Detect MEDIUM severity for 5-10 keywords lost
- Return empty for small losses

**Severity Classification:**
- CRITICAL for 50%+ drops
- HIGH for 30-50% drops
- MEDIUM for 20-30% drops
- LOW for under 20% drops

**Recommendations:**
- Basic recommendations for small drops
- Critical recommendations for large drops

**Custom Thresholds:**
- Use custom thresholds when provided
- Merge with defaults

**Edge Cases:**
- Handle negative values
- Handle equal values

---

## Files Created

### Core Engines
- `src/lib/seo/schedulingEngine.ts` (350 lines)
- `src/lib/seo/anomalyDetector.ts` (380 lines)
- `src/lib/seo/alertEmailService.ts` (420 lines)

### API
- `src/app/api/autonomy/cron/route.ts` (150 lines)

### Validation
- `src/lib/validation/schedulingSchemas.ts` (180 lines)

### Database
- `supabase/migrations/055_anomaly_detection_tables.sql` (120 lines)

### Tests
- `src/lib/__tests__/anomalyDetector.test.ts` (250 lines)

### Documentation
- `docs/PHASE8_WEEK23_SCHEDULING_ALERTS_COMPLETE.md` (THIS FILE)

**Total: ~1,850 lines of code**

---

## Integration Points

### Vercel Cron Setup

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/autonomy/cron",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Set environment variable:
```
CRON_SECRET=your-secret-token
```

### Staff Dashboard Integration

Add anomaly alerts panel:

```tsx
<AnomalyAlertPanel clientId={clientId}>
  {anomalies.map((anomaly) => (
    <AnomalyCard
      key={anomaly.anomaly_id}
      anomaly={anomaly}
      onAcknowledge={() => acknowledgeAnomaly(anomaly.anomaly_id)}
    />
  ))}
</AnomalyAlertPanel>
```

Add schedule management:

```tsx
<ScheduleManager clientId={clientId}>
  <ScheduleCard type="WEEKLY_SNAPSHOT" />
  <ScheduleCard type="MONTHLY_FULL_AUDIT" />
  <ScheduleCard type="ANOMALY_CHECK" />
</ScheduleManager>
```

### Email Service Configuration

Uses existing `src/lib/email/email-service.ts` with multi-provider failover (SendGrid → Resend → Gmail SMTP).

---

## Success Criteria Status

| Criteria | Status |
|----------|--------|
| Extend autonomyEngine.ts for recurring jobs | Complete (SchedulingEngine) |
| Create anomalyDetector.ts | Complete |
| Wire Vercel Cron to /api/autonomy/cron | Complete |
| Create MJML email templates | Complete (HTML templates) |
| Add emailService wrapper | Complete (AlertEmailService) |
| Unit tests | 20 tests complete |

---

## Security Considerations

1. **Cron Authentication**: Uses CRON_SECRET for Vercel Cron verification
2. **Client Consent**: Jobs only run if `client_consent = true`
3. **RLS Policies**: Anomalies only visible to organization staff
4. **Email Logging**: All emails tracked for audit trail

---

## Known Limitations

1. **No retry logic**: Failed jobs are logged but not retried
2. **No queue system**: Jobs run sequentially (parallel would require queue)
3. **Fixed thresholds**: Global thresholds (per-client customization in Week 24)
4. **No SMS/Slack**: Email only (other channels in V2)

---

## Next Steps

### Week 24: Interactive Dashboards & Strategy Layer (Track D)

- Create chart components (HealthTrendChart, KeywordMovementChart)
- Add Strategy & Signoff tab
- Implement signoff workflow (APPROVED/REJECTED/MODIFIED)
- Client portal Strategy Snapshot section
- Per-client threshold customization

---

## Summary

Phase 8 Week 23 delivers a **production-ready autonomous monitoring system** that runs 24/7 without human intervention. The Scheduling Engine manages recurring jobs, the Anomaly Detector watches for significant metric changes, and the Alert Email Service notifies staff of issues requiring attention.

**Key Features:**
- Three job types (snapshot, full audit, anomaly check)
- Configurable frequencies (daily to monthly)
- Severity-based alerting (LOW to CRITICAL)
- Rich HTML email templates
- Full audit trail (execution logs + email logs)
- RLS-protected anomaly storage

---

**Status:** COMPLETE - READY FOR WEEK 24
