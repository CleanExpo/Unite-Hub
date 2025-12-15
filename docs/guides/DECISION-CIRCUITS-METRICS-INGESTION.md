# Decision Circuits v2.0.0 - Metrics Ingestion Guide

## Overview

The **Metrics Ingestion Engine** (Phase 5) creates a unified webhook endpoint for receiving engagement metrics from email providers (SendGrid, Resend) and social platforms (Facebook, Instagram, LinkedIn). Events are normalized, attributed to circuit executions, and aggregated into hourly rollups for real-time dashboard and CX09 consumption.

**Core Principle**: Ingest raw metrics → Normalize events → Map to circuit context → Aggregate metrics → Expose via dashboard API.

---

## Architecture Flow

```
Provider Webhook → Signature Verification → Normalize → Attribution Map → Rollup → Dashboard
                        (hard-fail)              ↓           ↓              ↓
                                            Raw Event      Circuit ID    Hourly Buckets
                                         (idempotent)    (unmapped OK)   (derived rates)
```

---

## Provider Setup

### SendGrid

**Webhook Configuration**:
1. Navigate to Settings → Mail Send Settings → Event Webhook
2. Webhook URL: `https://your-domain.com/api/webhooks/metrics?provider=sendgrid`
3. Events to enable:
   - Delivered
   - Bounce
   - Open
   - Click
   - Spam Report
   - Unsubscribe

**Authentication**:
- SendGrid signs webhooks with `X-Twilio-Email-Event-Webhook-Signature` header
- Signature algorithm: HMAC-SHA256
- Timestamp header: `X-Twilio-Email-Event-Webhook-Timestamp`
- Secret obtained from SendGrid console (Mail Send API key)

**Environment Variable**:
```bash
SENDGRID_WEBHOOK_SECRET=your-sendgrid-webhook-secret
```

**Test Webhook** (from SendGrid Dashboard):
```json
{
  "event": "delivered",
  "email": "user@example.com",
  "timestamp": 1640000000,
  "sg_message_id": "msg_12345",
  "sg_event_id": "evt_12345"
}
```

---

### Resend

**Webhook Configuration**:
1. Navigate to API keys and create a webhook endpoint
2. Webhook URL: `https://your-domain.com/api/webhooks/metrics?provider=resend`
3. Events: delivered, bounce, open, click, complaint, unsubscribe

**Authentication**:
- Resend uses Svix signing format
- Headers: `svix-signature`, `svix-timestamp`, `svix-id`
- Secret: Webhook signing secret (obtain from Resend console)

**Environment Variable**:
```bash
RESEND_WEBHOOK_SECRET=whsec_your_resend_secret
```

**Test Webhook**:
```json
{
  "type": "delivered",
  "created_at": "2024-12-15T10:00:00Z",
  "message_id": "msg_abc123",
  "email": "user@example.com"
}
```

---

### Meta (Facebook/Instagram)

**Webhook Configuration**:
1. Set up a Webhooks product in your Meta App
2. Webhook URL: `https://your-domain.com/api/webhooks/metrics?provider=facebook` (or `instagram`)
3. Subscribe to: Page Insights, Messaging (or use Ads Insights for campaign metrics)

**Authentication**:
- Meta uses `X-Hub-Signature-256` header
- Algorithm: SHA256
- Format: `sha256=<hex_encoded_signature>`
- Secret: App Secret (from Meta App console)

**Environment Variables**:
```bash
FACEBOOK_WEBHOOK_SECRET=your-facebook-app-secret
INSTAGRAM_WEBHOOK_SECRET=your-instagram-app-secret
```

**Test Webhook** (from Meta):
```json
{
  "entry": [
    {
      "id": "123456789",
      "messaging": [
        {
          "sender": { "id": "user_123" },
          "recipient": { "id": "page_456" },
          "timestamp": 1640000000,
          "message": { "text": "Hello" }
        }
      ]
    }
  ]
}
```

---

### LinkedIn

**Webhook Configuration**:
1. Set up Partner webhook in LinkedIn developer portal
2. Webhook URL: `https://your-domain.com/api/webhooks/metrics?provider=linkedin`
3. Subscribe to: Campaign performance metrics, audience engagement

**Authentication**:
- LinkedIn uses HMAC-SHA256 with timestamp
- Headers: `X-LinkedIn-Signature`, `X-LinkedIn-Timestamp`
- Secret: Webhook signing secret

**Environment Variable**:
```bash
LINKEDIN_WEBHOOK_SECRET=your-linkedin-webhook-secret
```

---

## Webhook Endpoint

### POST /api/webhooks/metrics

**Unified endpoint** for all providers. Route provider context via query parameter.

**Request**:
```bash
curl -X POST "https://your-domain.com/api/webhooks/metrics?provider=sendgrid" \
  -H "X-Twilio-Email-Event-Webhook-Signature: base64_signature" \
  -H "X-Twilio-Email-Event-Webhook-Timestamp: 1640000000" \
  -H "X-Workspace-ID: workspace-uuid" \
  -H "Content-Type: application/json" \
  -d '{...provider-specific-payload...}'
```

**Required Headers**:
- `x-workspace-id` — Workspace UUID (required for attribution)
- Provider-specific signature headers (vary by provider)

**Response** (202 Accepted):
```json
{
  "success": true,
  "event_id": "uuid",
  "provider": "sendgrid",
  "message": "Webhook received and queued for processing",
  "timestamp": "2024-12-15T10:00:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Signature verification failed: Signature mismatch",
  "provider": "sendgrid",
  "timestamp": "2024-12-15T10:00:00Z"
}
```

### GET /api/webhooks/metrics

Health check endpoint.

**Request**:
```bash
curl "https://your-domain.com/api/webhooks/metrics"
```

**Response**:
```json
{
  "status": "ok",
  "supported_providers": ["sendgrid", "resend", "facebook", "instagram", "linkedin"],
  "message": "Metrics webhook endpoint ready"
}
```

---

## Idempotency & Duplicate Prevention

### Primary Key

Idempotency enforced via unique constraint on `metrics_webhook_events`:
```sql
UNIQUE (workspace_id, provider, provider_event_id)
```

**provider_event_id** is constructed per provider:
- **SendGrid**: `{sg_message_id}-{event_type}-{timestamp}`
- **Resend**: `{message_id}-{event_type}-{created_at}`
- **Meta**: `{sender_id}-{timestamp}`
- **LinkedIn**: `{campaign_id}-{action}-{timestamp}`

### Duplicate Handling

If the same event (same `provider_event_id`) arrives twice:
1. First attempt → inserted successfully
2. Second attempt → database UPSERT skips insert (duplicate key), logs event as processed
3. No double-counting in rollups (idempotent application)

---

## Attribution Mapping

### How Attribution Works

Events are linked to circuit execution context via `metrics_attribution_map`:
```sql
provider_object_id → circuit_execution_id, ab_test_id, variant_id, client_id
```

**Example**: SendGrid message ID → circuit execution tracking email campaign variant

### Attribution Sources

Mapping is populated by:
1. **Execution agents** (email-executor, social-executor) — register `provider_object_id` when sending
2. **Async fallback** — if mapping not found, event marked `status='unmapped'`

### Unmapped Events

If a provider object ID has no mapping:
- Event is **still persisted** (raw webhook ledger)
- `attribution_status` = `'unmapped'`
- Reprocessing job runs hourly to find mappings (24-hour grace period)
- If still unmapped after 24h → marked `'orphaned'`

**Health Check**:
```sql
SELECT * FROM metrics_attribution_health
WHERE workspace_id = 'your-workspace';
```

Returns: `total_mappings`, `mapped_count`, `unmapped_count`, `orphaned_count`, `mapped_percentage`

---

## Rollup Aggregation

### Time Buckets

Events aggregated into **1-hour buckets**:
- Bucket: `TRUNCATE(event.occurred_at, 'hour')`
- Grouping: `(workspace_id, circuit_execution_id, ab_test_id, variant_id, channel, time_bucket)`

### Metrics Collected

**Email Metrics**:
- `email_sent`, `email_delivered`, `email_bounced`, `email_complained`, `email_unsubscribed`
- `email_opened`, `email_clicked`

**Social Metrics**:
- `social_impressions`, `social_likes`, `social_comments`, `social_shares`, `social_clicks`

### Derived Rates

Automatically computed per rollup:

**Email**:
- `delivery_rate` = (delivered / sent) * 100
- `bounce_rate` = (bounced / sent) * 100
- `open_rate` = (opened / delivered) * 100
- `click_rate` = (clicked / delivered) * 100
- `engagement_rate` = ((opened + clicked) / delivered) * 100

**Social**:
- `social_engagement_rate` = ((likes + comments + shares + clicks) / impressions) * 100

### Query Rollups

**Latest rollups** (for dashboard):
```bash
curl "https://your-domain.com/api/circuits/metrics/rollups?workspaceId=uuid&abTestId=test_123&variantId=var_a" \
  -H "Authorization: Bearer token"
```

**Response**:
```json
{
  "workspace_id": "uuid",
  "ab_test_id": "test_123",
  "variant_id": "var_a",
  "rollups": [
    {
      "time_bucket": "2024-12-15T09:00:00Z",
      "channel": "email",
      "email_delivered": 1200,
      "email_opened": 340,
      "email_clicked": 98,
      "delivery_rate": 98.5,
      "open_rate": 28.3,
      "click_rate": 8.2,
      "engagement_rate": 36.5
    }
  ],
  "count": 1
}
```

---

## Backfill: Historical Data Retrieval

### Enqueue Backfill Job

**POST /api/circuits/metrics/backfill**

```bash
curl -X POST "https://your-domain.com/api/circuits/metrics/backfill?workspaceId=uuid" \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "sendgrid",
    "channel": "email",
    "date_start": "2024-12-01",
    "date_end": "2024-12-15"
  }'
```

**Constraints**:
- `date_start` and `date_end` must be YYYY-MM-DD format
- Date range cannot exceed 30 days per job
- Multiple jobs can be enqueued (they process sequentially)

**Response**:
```json
{
  "job_id": "backfill-uuid",
  "status": "pending",
  "provider": "sendgrid",
  "channel": "email",
  "date_start": "2024-12-01",
  "date_end": "2024-12-15",
  "message": "Backfill job enqueued",
  "note": "Historical data will be fetched asynchronously. Check job status for progress."
}
```

### Job Status

```bash
curl "https://your-domain.com/api/circuits/metrics/backfill?workspaceId=uuid&jobId=backfill-uuid" \
  -H "Authorization: Bearer token"
```

**Note**: Status endpoint returns job metadata. In production, integrate with job queue system (Bull/RabbitMQ) to track completion.

---

## PII & Security

### Email Hashing

Emails are **hashed** (SHA256) before storage:
```
recipient_hash = SHA256(email.toLowerCase().trim())
```

Actual email address stored only in:
- `metrics_attribution_map.recipient_identifier` (for deduplication)
- `recipient_hash` (for privacy-safe analytics)

### Row Level Security

All tables enforce workspace isolation:
```sql
WHERE workspace_id = get_current_workspace_id()
```

Cross-workspace queries fail at RLS layer (not application layer).

### Auditability

**Complete audit trail**:
- `metrics_webhook_events.raw_payload` — full provider payload
- `metrics_webhook_events.signature_verified` — boolean flag
- `metrics_attribution_map.mapped_at` — when attribution created
- `metrics_rollups.updated_at` — when rollup last modified

All changes timestamped and logged.

---

## Retention Policy

| Table | Retention | Notes |
|-------|-----------|-------|
| metrics_webhook_events | 30 days | Raw ledger; auto-deleted via cron |
| metrics_attribution_map | 365 days | Mapping reference; rarely deleted |
| metrics_rollups | 365 days | Aggregated data; long-term analytics |
| metrics_backfill_jobs | 90 days | Job audit trail; cleaned after completion |

---

## Troubleshooting

### Invalid Signature Error

**Symptom**: "Signature verification failed: Signature mismatch"

**Causes**:
1. Wrong signing secret in environment variable
2. Request body modified in transit (CDN/proxy stripping/modifying data)
3. Provider regenerated webhook secret without updating env var

**Solution**:
1. Verify `SENDGRID_WEBHOOK_SECRET` (or provider equivalent) is set correctly
2. Check provider console for active webhook secrets
3. Re-generate secret if unsure, update env var, redeploy
4. Test with provider's webhook test tool (sends signed test payload)

### Unmapped Events

**Symptom**: Events ingested but `attribution_status='unmapped'`

**Causes**:
1. Execution agent didn't register `provider_object_id` before sending
2. Workspace ID mismatch in `x-workspace-id` header
3. Attribution mapping failed due to database error

**Diagnosis**:
```sql
SELECT COUNT(*) as unmapped_count
FROM metrics_attribution_map
WHERE workspace_id = 'your-workspace' AND status = 'unmapped';
```

**Solution**:
1. Check execution agent logs for registration errors
2. Verify `x-workspace-id` header in webhook request matches actual workspace UUID
3. Check database connectivity; run hourly reprocessing job manually

### Missing Rollup Data

**Symptom**: Rollups endpoint returns empty, but webhook events logged

**Causes**:
1. Attribution not found (see unmapped events above)
2. Event occurred outside 1-hour bucket (check timestamp)
3. Rollup aggregation failed due to database error

**Diagnosis**:
```sql
SELECT time_bucket, COUNT(*) as event_count
FROM metrics_rollups
WHERE workspace_id = 'your-workspace' AND ab_test_id = 'test_123'
GROUP BY time_bucket
ORDER BY time_bucket DESC
LIMIT 10;
```

**Solution**:
1. Verify attribution is mapped (`status='mapped'`)
2. Check event timestamps are recent (within last 24h)
3. Run manual rollup recalculation for specific test

### Backfill Job Stuck

**Symptom**: Backfill job status stays `'pending'` or `'processing'` forever

**Causes**:
1. Job queue worker not running
2. Provider API rate limiting or timeout
3. Database connection error during backfill

**Solution**:
1. Check job queue worker logs (Bull/RabbitMQ)
2. Monitor provider API rate limits (SendGrid: 100/sec, Resend: 50/sec)
3. Retry backfill job for same date range (idempotent)

---

## CX09 / Dashboard Integration

### Consuming Rollups in CX09

CX09 (A/B Test Evaluation) can query latest metrics via:

```typescript
const rollups = await getRollups({
  workspace_id: 'workspace-uuid',
  ab_test_id: 'test_123',
  variant_id: 'var_a',
  channel: 'email',
  limit: 100
});

// Use rollups to compute engagement rate for statistical test
const engagementRate = rollups[0]?.engagement_rate || 0;
```

### Dashboard Metrics Summary

Dashboard surfaces:
- Real-time rollup data (refresh every 5-10 minutes)
- Attribution health (% mapped vs unmapped)
- Backfill job status
- Rate limits and performance metrics

---

## Performance Notes

### Latency

- Webhook ingestion: **<50ms** (signature verification + persistence)
- Attribution lookup: **<20ms** (indexed query)
- Rollup application: **<30ms** (upsert with aggregation)
- **Total end-to-end**: **<100ms** for typical event

### Throughput

- Single endpoint handles **all providers**
- Idempotency via unique constraint (no deduplication latency)
- Rollup writes are batched hourly (not per-event)
- No rate limiting at application level (rely on provider webhook throttling)

### Scaling

- Index strategy: (workspace_id, provider, time_bucket) for common queries
- Partitioning: Consider partitioning `metrics_rollups` by month if >1B rows/month
- Archival: Implement cold storage for events >30 days old

---

## See Also

- [Decision Circuits Overview](./DECISION-CIRCUITS.md)
- [Release Notes v2.0.0](../DECISION_CIRCUITS_V2.0.0_RELEASE.md)
- [Schema Reference](./schema-reference.md)
- [CX09 A/B Testing](./DECISION-CIRCUITS-CX09-AB-TESTING.md)
