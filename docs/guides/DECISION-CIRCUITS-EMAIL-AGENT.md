# Decision Circuits v1.4.0 - Email Execution Agent

**Version**: 1.4.0
**Status**: Production-ready autonomous email execution agent
**Agent ID**: AGENT_EMAIL_EXECUTOR
**Type**: Execution-only (no strategy, no content generation, no AI decisions)

---

## Overview

The Email Execution Agent (AGENT_EMAIL_EXECUTOR) is the second autonomous execution agent in Decision Circuits. It sends pre-approved, pre-generated emails to recipients with zero human approval required.

**Key Characteristics**:
- ✅ **Execution-Only** — No strategy selection, no content modification, no AI model calls
- ✅ **Circuit-Bound** — Requires successful execution of all 6 required circuits (CX01-CX06)
- ✅ **Autonomous** — Zero human approval, fully automated scheduling and retry
- ✅ **Metrics-Aware** — Collects engagement metrics and binds them to circuit execution
- ✅ **Self-Correcting** — Triggers CX08_SELF_CORRECTION on repeated failure
- ✅ **Compliant** — CAN-SPAM compliant with automatic unsubscribe links

---

## Required Decision Circuits

The agent **MUST** validate that all 6 circuits executed successfully before sending:

| Circuit | Purpose | Required |
|---------|---------|----------|
| CX01_INTENT_DETECTION | Understand business intent | ✅ Yes |
| CX02_AUDIENCE_CLASSIFICATION | Segment target audience | ✅ Yes |
| CX03_STATE_MEMORY_RETRIEVAL | Load prior context | ✅ Yes |
| CX04_CONTENT_STRATEGY_SELECTION | Choose content approach | ✅ Yes |
| CX05_BRAND_GUARD | Validate brand rules | ✅ Yes |
| CX06_GENERATION_EXECUTION | Create final email asset | ✅ Yes |

**Execution Flow**:
```
User Input
    ↓
CX01 → CX02 → CX03 → CX04 → CX05 → CX06 (all must succeed)
                                        ↓
                            AGENT_EMAIL_EXECUTOR
                                        ↓
                                Send Email
                                        ↓
                    CX07_ENGAGEMENT_EVALUATION (optional)
                    CX08_SELF_CORRECTION (on failure)
```

---

## Input Validation

### Required Fields

```typescript
{
  "circuit_execution_id": "string (mandatory)",
  "workspace_id": "uuid (mandatory)",
  "client_id": "uuid (mandatory)",
  "recipient": "email address (mandatory)",
  "final_asset": {
    "subject": "string (required, non-empty)",
    "preheader": "string (optional)",
    "html_body": "string (required, non-empty)",
    "text_body": "string (optional, plain text fallback)",
    "cta_url": "url (optional, call-to-action)",
    "tags": "string[] (optional, email categorization)"
  },
  "scheduled_for": "ISO timestamp (optional, future use with Bull queue)"
}
```

### Validation Rules

**Hard Failures** (agent blocks and logs):
- ❌ Missing `circuit_execution_id`
- ❌ Missing `client_id` or `recipient`
- ❌ Missing `final_asset.subject` or `final_asset.html_body`
- ❌ Any required circuit failed or missing
- ❌ Recipient on suppression list (bounced, complained, unsubscribed)
- ❌ Email format invalid
- ❌ Rate limit exceeded (300/hour per workspace)
- ❌ Content exceeds 100,000 character limit

**Soft Failures** (retry with backoff):
- ⚠️ Email provider rate limit (429)
- ⚠️ Email provider server error (5xx)
- ⚠️ Network timeout

---

## API Endpoints

### 1. Send Email

```bash
POST /api/circuits/agents/email/send?workspaceId=<workspace-id>
```

**Request**:
```json
{
  "circuit_execution_id": "1702569600000_abc123def456",
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "recipient": "user@example.com",
  "final_asset": {
    "subject": "Important Update for Your Account",
    "preheader": "Read this important message",
    "html_body": "<h1>Hello!</h1><p>We have an important update...</p>",
    "text_body": "Hello!\n\nWe have an important update...",
    "cta_url": "https://example.com/action",
    "tags": ["account-update", "important"]
  },
  "scheduled_for": "2025-12-16T14:00:00Z"
}
```

**Response** (Success):
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "execution_result": {
    "sent": true,
    "provider_message_id": "sg-1234567890abcdef",
    "provider": "sendgrid",
    "sent_at": "2025-12-16T14:00:00Z"
  },
  "circuit_validation": {
    "circuits_passed": [
      "CX01_INTENT_DETECTION",
      "CX02_AUDIENCE_CLASSIFICATION",
      "CX03_STATE_MEMORY_RETRIEVAL",
      "CX04_CONTENT_STRATEGY_SELECTION",
      "CX05_BRAND_GUARD",
      "CX06_GENERATION_EXECUTION"
    ],
    "all_required_passed": true
  }
}
```

**Response** (Circuit Validation Failed):
```json
{
  "success": false,
  "error": {
    "message": "Circuit validation failed",
    "missing_circuits": ["CX05_BRAND_GUARD"],
    "passed_circuits": [
      "CX01_INTENT_DETECTION",
      "CX02_AUDIENCE_CLASSIFICATION",
      "CX03_STATE_MEMORY_RETRIEVAL",
      "CX04_CONTENT_STRATEGY_SELECTION",
      "CX06_GENERATION_EXECUTION"
    ]
  }
}
```

**Response** (Recipient Blocked):
```json
{
  "success": false,
  "error": {
    "message": "Recipient validation failed: bounced_suppressed"
  }
}
```

**Status Codes**:
- `200` — Email sent successfully
- `400` — Missing required fields or invalid input
- `403` — Circuit validation failed OR recipient on suppression list OR rate limit exceeded
- `500` — Sending failed after 2 retries

---

### 2. Get Engagement Metrics

```bash
GET /api/circuits/agents/email/metrics?workspaceId=<workspace-id>&circuitExecutionId=<execution-id>
```

**Response**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "circuit_execution_id": "1702569600000_abc123def456",
  "metrics": {
    "delivered": true,
    "bounced": false,
    "opened": true,
    "clicked": true,
    "unsubscribed": false,
    "complained": false
  },
  "metrics_count": 1
}
```

---

### 3. Get Sending History

```bash
GET /api/circuits/agents/email/metrics?action=history&workspaceId=<workspace-id>&clientId=<client-id>&recipient=<email>&limit=50
```

**Response**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "executions": [
    {
      "circuit_execution_id": "1702569600000_abc123def456",
      "recipient": "user@example.com",
      "subject": "Important Update for Your Account",
      "sent": true,
      "sent_at": "2025-12-16T14:00:00Z",
      "provider": "sendgrid",
      "engagement_metrics": {
        "delivered": true,
        "opened": true,
        "clicked": false,
        "bounced": false,
        "unsubscribed": false,
        "complained": false
      }
    }
  ],
  "total_count": 24
}
```

---

### 4. Trigger Metrics Collection

```bash
POST /api/circuits/agents/email/metrics?action=collect-metrics&workspaceId=<workspace-id>
```

**Response**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics_collected": 0,
  "message": "Background metrics collection job triggered"
}
```

---

## Email Provider Support

### Multi-Provider with Automatic Fallback

The agent supports three email providers with intelligent fallback:

1. **SendGrid** — Primary (if configured)
2. **Resend** — Secondary (if primary fails)
3. **SMTP** — Tertiary fallback (Gmail, custom SMTP)

**Automatic Fallback Flow**:
```
Try SendGrid → Fail?
    ↓
Try Resend → Fail?
    ↓
Try SMTP → Fail?
    ↓
Return error (all providers exhausted)
```

**Provider Configuration**:
- SendGrid: Set `SENDGRID_API_KEY` environment variable
- Resend: Set `RESEND_API_KEY` environment variable
- SMTP: Set `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`

---

## Retry Logic

### Exponential Backoff Configuration

| Parameter | Value |
|-----------|-------|
| **Max Retries** | 2 attempts |
| **Initial Delay** | 2000 ms |
| **Backoff Multiplier** | 2x |
| **Retry On** | 429, 500, 502, 503, 504 |

### Example Timeline

```
Attempt 1: 00:00:00 — Send email → 429 Rate Limit (retry)
Attempt 2: 00:00:02 — Retry after 2s delay → 500 Server Error (retry)
Attempt 3: 00:00:06 — Retry after 4s delay → 500 Server Error (max retries)
Result: Max retries exceeded, trigger CX08_SELF_CORRECTION
```

---

## Autonomy & Self-Correction

### On Sending Success

✅ Email sent and logged in `email_agent_executions` table
✅ Provider message ID recorded for tracking
✅ Metrics placeholder created in `email_agent_metrics` table
✅ Optional: Trigger CX07_ENGAGEMENT_EVALUATION

### On Sending Failure After Max Retries

❌ Final attempt failed after 2 retries
❌ Automatic escalation: Trigger **CX08_SELF_CORRECTION**
❌ Correction inputs: Provider, failure reason, retry count
❌ Self-correction action: Switch provider, adjust timing, or escalate to admin
❌ Failure logged in `email_agent_executions.last_error`

---

## Database Schema

### email_agent_executions

Audit trail for all sending attempts:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenant isolation |
| `circuit_execution_id` | TEXT | Links to circuit_execution_logs |
| `client_id` | UUID | Which client sent |
| `recipient` | TEXT | Email recipient |
| `subject` | TEXT | Email subject line |
| `preheader` | TEXT | Email preview text |
| `html_body` | TEXT | HTML email content |
| `text_body` | TEXT | Plain text fallback |
| `cta_url` | TEXT | Call-to-action URL |
| `tags` | TEXT[] | Email categorization |
| `sent` | BOOLEAN | Success status |
| `provider` | TEXT | sendgrid, resend, or smtp |
| `provider_message_id` | TEXT | Message ID from provider |
| `sent_at` | TIMESTAMPTZ | When sent |
| `scheduled_for` | TIMESTAMPTZ | Scheduled time (if scheduled) |
| `attempt_number` | INT | Which attempt (always 1 for first) |
| `retry_count` | INT | How many retries occurred (0-2) |
| `last_error` | TEXT | Error message if failed |
| `created_at` | TIMESTAMPTZ | When record created |

**Key Indexes**:
- `workspace_id` — Tenant isolation
- `circuit_execution_id` — Link back to circuits
- `client_id` — Per-client history
- `recipient` — Email recipient lookup
- `sent_at DESC` — Timeline queries

### email_agent_metrics

Engagement metrics per sent email:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenant isolation |
| `circuit_execution_id` | TEXT | Links to circuit_execution_logs |
| `provider_message_id` | TEXT | Which email |
| `provider` | TEXT | Which provider |
| `delivered` | BOOLEAN | Email delivered |
| `bounced` | BOOLEAN | Email bounced |
| `bounce_type` | TEXT | hard, soft, or blocked |
| `opened` | BOOLEAN | Email opened |
| `clicked` | BOOLEAN | Link clicked |
| `unsubscribed` | BOOLEAN | User unsubscribed |
| `complained` | BOOLEAN | User complained |
| Timestamps | TIMESTAMPTZ | When each event occurred |
| `collected_at` | TIMESTAMPTZ | When metrics were fetched |
| `created_at` | TIMESTAMPTZ | When record created |

---

### email_suppression_list

Suppression list for bounced, complained, and unsubscribed recipients:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenant isolation |
| `email` | TEXT | Email address |
| `reason` | TEXT | bounced, complained, unsubscribed |
| `bounce_type` | TEXT | hard, soft (for bounces only) |
| `suppressed_at` | TIMESTAMPTZ | When suppressed |
| `created_at` | TIMESTAMPTZ | When record created |

**Unique Constraint**: One entry per (workspace_id, email, reason)

---

## CRM Context (Read-Only)

The agent reads business context from Unite-Hub:

```typescript
interface CRMContext {
  lead_stage?: string;           // e.g., "prospect", "customer"
  last_contacted_at?: string;    // ISO timestamp
  service_category?: string;     // Service type
  location?: string;             // Geographic location
  brand_rules?: Record<string, unknown>;      // Brand guidelines
  historical_engagement?: Record<string, number>; // Past performance
}
```

**Tables Queried**:
- `contacts` (lead_stage, last_contacted_at)
- `organizations` (service_category, location)
- `campaigns` (historical_engagement)
- `synthex_tenant_profiles` (brand_rules)

All queries filtered by `workspace_id` for tenant isolation.

---

## CAN-SPAM Compliance

The agent automatically injects an unsubscribe link in every email:

```html
<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
<p style="font-size: 12px; color: #666; text-align: center; margin: 20px 0;">
  <a href="https://example.com/api/email/unsubscribe?token=...">
    Unsubscribe from these emails
  </a>
</p>
```

**HMAC-signed tokens** prevent tampering. When a user unsubscribes:
1. Email marked in `email_suppression_list` with reason='unsubscribed'
2. Future sends to that address are blocked with error
3. Complaint rate monitored for CX05_BRAND_GUARD tightening

---

## Rate Limiting

**Workspace-level rate limit**: 300 emails/hour per workspace

When limit exceeded:
- New send requests return `403 Forbidden`
- Error message: `Recipient validation failed: rate_limit_exceeded`
- No retry attempts made (hard fail)

---

## Troubleshooting

### "Circuit validation failed"

**Cause**: One or more required circuits didn't execute or failed
**Solution**:
1. Check which circuits are missing (returned in error response)
2. Re-run circuit chain from CX01
3. Ensure all circuits passed with `success: true`
4. Retry sending

### "Email sending failed" / "All email providers failed"

**Cause**: All configured providers (SendGrid, Resend, SMTP) are down or misconfigured
**Solution**:
1. Check provider status dashboards
2. Verify API keys/SMTP credentials in environment
3. Check `email_agent_executions.last_error` for details
4. Wait 1-2 minutes before retrying (rate limits)

### "Recipient validation failed: bounced_suppressed"

**Cause**: Email is on the suppression list (hard bounce)
**Solution**:
1. Check `email_suppression_list` table
2. Verify recipient email address is correct
3. Update database if address was incorrect
4. Retry sending (agent will allow retry if removed from suppression list)

### "Recipient validation failed: rate_limit_exceeded"

**Cause**: Workspace has sent 300+ emails in the last hour
**Solution**:
1. Wait 1 hour for rate limit window to reset
2. Or contact support to increase workspace rate limit
3. Stagger email sends over time

### "Content exceeds email limit"

**Cause**: Subject + HTML body exceed 100,000 character limit
**Solution**:
1. Shorten email subject in CX06 output
2. Reduce HTML body content
3. Remove unnecessary HTML/styling
4. Retry sending with shorter content

---

## Best Practices

### ✅ Do

- Always chain CX01→CX06 before sending
- Use realistic character limits (leave 10% buffer)
- Test email templates before production use
- Monitor engagement metrics post-sending
- Set up CX08_SELF_CORRECTION for failure handling
- Store credentials encrypted in database
- Log all sending attempts for audit trail
- Clean up suppression list periodically (hard bounces expire after 30 days)

### ❌ Don't

- Send without circuit validation (agent will block)
- Manually bypass circuit checks
- Reuse same final_asset for multiple recipients (re-run circuits)
- Store plaintext credentials in code
- Send more than once per recipient per minute
- Skip engagement metrics collection
- Override suppression list manually (use api/email/unsubscribe)

---

## Integration Examples

### Manual Email Sending Flow

```bash
# 1. Execute required circuits
POST /api/circuits/execute?workspaceId=<id>
{"circuit_id": "CX01_INTENT_DETECTION", "inputs": {...}}

POST /api/circuits/execute?workspaceId=<id>
{"circuit_id": "CX02_AUDIENCE_CLASSIFICATION", "inputs": {...}}

# ... continue through CX06 ...

# 2. Send email (circuits validated automatically)
POST /api/circuits/agents/email/send?workspaceId=<id>
{
  "circuit_execution_id": "<from CX06 execution>",
  "client_id": "<client uuid>",
  "recipient": "user@example.com",
  "final_asset": {
    "subject": "Welcome to our service!",
    "html_body": "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  }
}

# 3. Check metrics after 1 hour (when provider webhooks deliver metrics)
GET /api/circuits/agents/email/metrics?workspaceId=<id>&circuitExecutionId=<id>
```

---

## Performance Metrics

### Target Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Sending Success Rate** | > 95% | ✅ |
| **Avg Retries Per Email** | < 0.5 | ✅ |
| **Circuit Validation Time** | < 500ms | ✅ |
| **Email Provider Response** | < 2s | ✅ |
| **Metrics Collection Latency** | < 30min | ✅ |

### Query Performance Summary

```sql
SELECT * FROM email_agent_performance
WHERE workspace_id = '<workspace_id>';

-- Result example:
-- provider | total_emails | successful_sends | success_rate
-- sendgrid | 450          | 427              | 94.89
-- resend   | 120          | 117              | 97.50
-- smtp     | 30           | 29               | 96.67
```

---

## Support & Questions

For issues or questions about the Email Execution Agent:

- **Documentation**: This guide (DECISION-CIRCUITS-EMAIL-AGENT.md)
- **Release Notes**: DECISION_CIRCUITS_V1.4.0_RELEASE.md
- **API Reference**: See Endpoints section above
- **Troubleshooting**: See Troubleshooting section above

File issues with tag: `decision-circuits-email-agent-v1.4`

---

## Key Takeaways

✅ **Circuit-Bound**: Always validates required circuits
✅ **Execution-Only**: No strategy, no AI decisions, pure sending
✅ **Autonomous**: Zero human approval, automatic retry and scheduling
✅ **Observable**: Full audit trail, metrics collection, performance tracking
✅ **Self-Healing**: CX08_SELF_CORRECTION on repeated failures
✅ **Compliant**: CAN-SPAM compliant with automatic unsubscribe links
✅ **Production-Ready**: Multi-tenant isolation, RLS, full error handling
