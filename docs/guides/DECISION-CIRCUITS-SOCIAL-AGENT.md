# Decision Circuits v1.3.0 - Social Media Execution Agent

**Version**: 1.3.0
**Status**: Production-ready autonomous social media publisher
**Agent ID**: AGENT_SOCIAL_EXECUTOR
**Type**: Execution-only (no strategy, no content generation, no AI decisions)

---

## Overview

The Social Media Execution Agent (AGENT_SOCIAL_EXECUTOR) is the first autonomous execution agent in Decision Circuits. It publishes pre-approved, pre-generated social media content to Facebook, Instagram, and LinkedIn with zero human approval required.

**Key Characteristics**:
- ✅ **Execution-Only** — No strategy selection, no content modification, no AI model calls
- ✅ **Circuit-Bound** — Requires successful execution of all 6 required circuits (CX01-CX06)
- ✅ **Autonomous** — Zero human approval, fully automated scheduling and retry
- ✅ **Metrics-Aware** — Collects engagement metrics and binds them to circuit execution
- ✅ **Self-Correcting** — Triggers CX08_SELF_CORRECTION on repeated failure

---

## Required Decision Circuits

The agent **MUST** validate that all 6 circuits executed successfully before publishing:

| Circuit | Purpose | Required |
|---------|---------|----------|
| CX01_INTENT_DETECTION | Understand business intent | ✅ Yes |
| CX02_AUDIENCE_CLASSIFICATION | Segment target audience | ✅ Yes |
| CX03_STATE_MEMORY_RETRIEVAL | Load prior context | ✅ Yes |
| CX04_CONTENT_STRATEGY_SELECTION | Choose content approach | ✅ Yes |
| CX05_BRAND_GUARD | Validate brand rules | ✅ Yes |
| CX06_GENERATION_EXECUTION | Create final asset | ✅ Yes |

**Execution Flow**:
```
User Input
    ↓
CX01 → CX02 → CX03 → CX04 → CX05 → CX06 (all must succeed)
                                      ↓
                          AGENT_SOCIAL_EXECUTOR
                                      ↓
                              Publish to Platform
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
  "client_id": "uuid (mandatory)",
  "platform": "facebook | instagram | linkedin (required)",
  "final_asset": {
    "text_content": "string (required, non-empty)",
    "hashtags": "string[] (optional)",
    "media_urls": "string[] (optional, pre-uploaded only)",
    "scheduled_for": "ISO timestamp (optional)"
  },
  "publish_time": "immediate | ISO timestamp (required)"
}
```

### Validation Rules

**Hard Failures** (agent blocks and logs):
- ❌ Missing `circuit_execution_id`
- ❌ Missing `client_id`
- ❌ Invalid `platform` (must be facebook, instagram, or linkedin)
- ❌ Missing `final_asset.text_content`
- ❌ Any required circuit failed or missing
- ❌ No credentials configured for platform
- ❌ Content exceeds platform character limit

**Soft Failures** (retry with backoff):
- ⚠️ Platform API rate limit (429)
- ⚠️ Platform API server error (5xx)
- ⚠️ Network timeout

---

## API Endpoints

### 1. Publish Content

```bash
POST /api/circuits/agents/social/publish?workspaceId=<workspace-id>
```

**Request**:
```json
{
  "circuit_execution_id": "1702569600000_abc123def456",
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "facebook",
  "final_asset": {
    "text_content": "Check out our latest innovation! 🚀",
    "hashtags": ["#innovation", "#tech", "#business"],
    "media_urls": ["https://cdn.example.com/image1.jpg"],
    "scheduled_for": "2025-12-16T14:00:00Z"
  },
  "publish_time": "2025-12-16T14:00:00Z"
}
```

**Response** (Success):
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "execution_result": {
    "published": true,
    "platform_post_id": "123456789_987654321",
    "platform_url": "https://facebook.com/123456789_987654321",
    "published_at": "2025-12-16T14:00:00Z"
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

**Status Codes**:
- `200` — Publishing successful
- `400` — Missing required fields or invalid input
- `403` — Circuit validation failed (hard fail)
- `500` — Publishing failed after 2 retries

---

### 2. Get Engagement Metrics

```bash
GET /api/circuits/agents/social/metrics?workspaceId=<workspace-id>&circuitExecutionId=<execution-id>
```

**Response**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "circuit_execution_id": "1702569600000_abc123def456",
  "metrics_by_platform": {
    "facebook": {
      "impressions": 12500,
      "likes": 345,
      "shares": 89,
      "comments": 23,
      "clicks": 567,
      "engagement_rate": 0.087
    }
  },
  "total_engagement": {
    "impressions": 12500,
    "likes": 345,
    "shares": 89,
    "comments": 23,
    "clicks": 567
  }
}
```

---

### 3. Get Publishing History

```bash
GET /api/circuits/agents/social/metrics?action=history&workspaceId=<workspace-id>&clientId=<client-id>&platform=facebook&limit=50
```

**Response**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "executions": [
    {
      "circuit_execution_id": "1702569600000_abc123def456",
      "platform": "facebook",
      "published": true,
      "platform_url": "https://facebook.com/123456789_987654321",
      "published_at": "2025-12-16T14:00:00Z",
      "engagement_metrics": {
        "impressions": 12500,
        "likes": 345,
        "shares": 89,
        "comments": 23,
        "clicks": 567
      }
    }
  ],
  "total_count": 24
}
```

---

### 4. Trigger Metrics Collection

```bash
POST /api/circuits/agents/social/metrics?action=collect-metrics&workspaceId=<workspace-id>
```

**Response**:
```json
{
  "workspace_id": "550e8400-e29b-41d4-a716-446655440000",
  "metrics_collected": 45,
  "message": "Background metrics collection job triggered"
}
```

---

## Platform-Specific Details

### Facebook

**Requirements**:
- Page ID and access token stored in `synthex_social_accounts`
- Content under 63,206 characters
- Supports scheduling (via `scheduled_publish_time`)
- Uses Graph API v19.0

**API Call**:
```
POST /v19.0/{page_id}/feed
```

### Instagram

**Requirements**:
- IG User ID and access token stored in `synthex_social_accounts`
- Caption under 2,200 characters
- 30 hashtags max
- Supports scheduling (via `scheduled_publish_time`)
- Uses Graph API v19.0

**API Call**:
```
POST /v19.0/{ig_user_id}/media
```

### LinkedIn

**Requirements**:
- Organization ID and access token stored in `synthex_social_accounts`
- Content under 3,000 characters
- 5 hashtags max
- Does NOT support scheduling (publishes immediately)
- Uses REST API v2

**API Call**:
```
POST /v2/ugcPosts
```

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
Attempt 1: 00:00:00 — Publish fails (429 Rate Limit)
Attempt 2: 00:00:02 — Retry after 2s delay, fails (500 Server Error)
Attempt 3: 00:00:06 — Retry after 4s delay, fails (500 Server Error)
Result: Max retries exceeded, trigger CX08_SELF_CORRECTION
```

---

## Autonomy & Self-Correction

### On Publishing Success

✅ Post published and metrics collected (async)
✅ Execution logged in `social_agent_executions` table
✅ Metrics tracked in `social_agent_metrics` table
✅ Optional: Trigger CX07_ENGAGEMENT_EVALUATION

### On Publishing Failure After Max Retries

❌ Final attempt failed after 2 retries
❌ Automatic escalation: Trigger **CX08_SELF_CORRECTION**
❌ Correction inputs: Platform, failure reason, retry count
❌ Self-correction action: Rotate strategy or escalate to admin
❌ Failure logged in `social_agent_executions.last_error`

---

## Database Schema

### social_agent_executions

Audit trail for all publishing attempts:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenant isolation |
| `circuit_execution_id` | TEXT | Links to circuit_execution_logs |
| `client_id` | UUID | Which client published |
| `platform` | TEXT | facebook, instagram, or linkedin |
| `published` | BOOLEAN | Success status |
| `platform_post_id` | TEXT | Post ID from platform |
| `platform_url` | TEXT | Direct URL to post |
| `published_at` | TIMESTAMPTZ | When published |
| `text_content` | TEXT | Content snapshot |
| `hashtags` | TEXT[] | Hashtags used |
| `media_urls` | TEXT[] | Media URLs |
| `scheduled_for` | TIMESTAMPTZ | Scheduled time (if scheduled) |
| `attempt_number` | INT | Which attempt (always 1 for first) |
| `retry_count` | INT | How many retries occurred (0-2) |
| `last_error` | TEXT | Error message if failed |
| `created_at` | TIMESTAMPTZ | When record created |

**Key Indexes**:
- `workspace_id` — Tenant isolation
- `circuit_execution_id` — Link back to circuits
- `client_id` — Per-client history
- `platform` — Platform filtering
- `published_at DESC` — Timeline queries

### social_agent_metrics

Engagement metrics per post:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Multi-tenant isolation |
| `circuit_execution_id` | TEXT | Links to circuit_execution_logs |
| `platform_post_id` | TEXT | Which post |
| `platform` | TEXT | Which platform |
| `impressions` | INT | Views |
| `likes` | INT | Reactions/likes |
| `shares` | INT | Shares |
| `comments` | INT | Comments |
| `clicks` | INT | Clicks |
| `engagement_rate` | FLOAT | (likes+shares+comments)/impressions |
| `collected_at` | TIMESTAMPTZ | When metrics were fetched |
| `created_at` | TIMESTAMPTZ | When record created |

---

## CRM Context (Read-Only)

The agent reads business context from Unite-Hub:

```typescript
interface CRMContext {
  business_type?: string;        // e.g., "SaaS", "E-Commerce"
  location?: string;              // e.g., "San Francisco, CA"
  brand_rules?: Record<string, unknown>;  // Brand guidelines
  posting_preferences?: Record<string, unknown>;  // Preferred times, etc.
  historical_engagement?: Record<string, number>;  // Past performance
}
```

**Tables Queried**:
- `contacts` (company, tags)
- `synthex_tenants` (business profile)
- `synthex_tenant_profiles` (brand info)
- `campaigns` (historical engagement)
- `social_messages` (sentiment, history)

All queries filtered by `workspace_id` for tenant isolation.

---

## Troubleshooting

### "Circuit validation failed"

**Cause**: One or more required circuits didn't execute or failed
**Solution**:
1. Check which circuits are missing (returned in error response)
2. Re-run circuit chain from CX01
3. Ensure all circuits passed with `success: true`
4. Retry publishing

### "Publishing failed after 2 retries"

**Cause**: Platform API unreachable or rate-limited
**Solution**:
1. Check platform API status dashboard
2. Verify access token is valid and not expired
3. Wait 1-2 minutes before retrying (platform rate limits)
4. Check `social_agent_executions.last_error` for details

### "No {platform} account configured"

**Cause**: Workspace doesn't have connected social account
**Solution**:
1. Connect social account via OAuth flow
2. Token should be stored in `synthex_social_accounts` table
3. Account status must be 'active'
4. Retry publishing

### "Content exceeds platform limit"

**Cause**: Text + hashtags exceed platform character limit
**Solution**:
1. Shorten text content in CX06 output
2. Reduce hashtag count or use shorter hashtags
3. Character limits by platform:
   - Facebook: 63,206 characters
   - Instagram: 2,200 characters
   - LinkedIn: 3,000 characters

---

## Best Practices

### ✅ Do

- Always chain CX01→CX06 before publishing
- Use realistic character limits (leave 10% buffer)
- Schedule posts during optimal engagement times
- Monitor engagement metrics post-publishing
- Set up CX08_SELF_CORRECTION for failure handling
- Store credentials encrypted in database
- Log all publishing attempts for audit trail

### ❌ Don't

- Publish without circuit validation (agent will block)
- Manually bypass circuit checks
- Reuse same final_asset for multiple platforms (re-run circuits)
- Store plaintext credentials in code
- Publish more than once per platform per minute
- Skip engagement metrics collection

---

## Integration Examples

### Manual Publishing Flow

```bash
# 1. Execute required circuits
POST /api/circuits/execute?workspaceId=<id>
{"circuit_id": "CX01_INTENT_DETECTION", "inputs": {...}}

POST /api/circuits/execute?workspaceId=<id>
{"circuit_id": "CX02_AUDIENCE_CLASSIFICATION", "inputs": {...}}

# ... continue through CX06 ...

# 2. Publish content (circuits validated automatically)
POST /api/circuits/agents/social/publish?workspaceId=<id>
{
  "circuit_execution_id": "<from CX06 execution>",
  "client_id": "<client uuid>",
  "platform": "facebook",
  "final_asset": {
    "text_content": "...",
    "hashtags": [...],
  },
  "publish_time": "immediate"
}

# 3. Check metrics after 1 hour
GET /api/circuits/agents/social/metrics?workspaceId=<id>&circuitExecutionId=<id>
```

---

## Performance Metrics

### Target Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Publishing Success Rate** | > 95% | ✅ |
| **Avg Retries Per Post** | < 0.5 | ✅ |
| **Circuit Validation Time** | < 500ms | ✅ |
| **Platform API Response** | < 2s | ✅ |
| **Metrics Collection Latency** | < 30min | ✅ |

### Query Performance Summary

```sql
SELECT * FROM social_agent_performance
WHERE workspace_id = '<workspace_id>';

-- Result example:
-- platform | total_posts | successful_posts | success_rate
-- facebook | 45          | 43               | 95.56
-- instagram| 38          | 36               | 94.74
-- linkedin | 22          | 22               | 100.00
```

---

## Support & Questions

For issues or questions about the Social Media Execution Agent:

- **Documentation**: This guide (DECISION-CIRCUITS-SOCIAL-AGENT.md)
- **Release Notes**: DECISION_CIRCUITS_V1.3.0_RELEASE.md
- **API Reference**: See Endpoints section above
- **Troubleshooting**: See Troubleshooting section above

File issues with tag: `decision-circuits-social-agent-v1.3`

---

## Key Takeaways

✅ **Circuit-Bound**: Always validates required circuits
✅ **Execution-Only**: No strategy, no AI decisions, pure publishing
✅ **Autonomous**: Zero human approval, automatic retry and scheduling
✅ **Observable**: Full audit trail, metrics collection, performance tracking
✅ **Self-Healing**: CX08_SELF_CORRECTION on repeated failures
✅ **Production-Ready**: Multi-tenant isolation, RLS, full error handling
