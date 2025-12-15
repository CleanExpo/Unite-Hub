# Decision Circuits v1.5.0 - Multi-Channel Coordinator Agent

## Overview

The **Multi-Channel Coordinator Agent (AGENT_MULTICHANNEL_COORDINATOR)** is an orchestration-only agent that coordinates Email and Social execution agents under a single circuit-governed workflow. It enables sequential execution with multiple flow patterns, unified suppression logic, and aggregated cross-channel engagement metrics.

**Core Principle**: Coordinator CANNOT generate content, select strategies, or call AI models. It ONLY orchestrates existing execution agents.

---

## Architecture

### Flow Patterns

The coordinator supports 4 flow patterns:

- **EMAIL_THEN_SOCIAL**: Execute email first, then social (conditional on email success)
- **SOCIAL_THEN_EMAIL**: Execute social first, then email (conditional on social success)
- **EMAIL_ONLY**: Execute email only, skip social
- **SOCIAL_ONLY**: Execute social only, skip email

### Sequential Execution

Agents execute in defined order. The second agent only runs if the first succeeds (hard-fail pattern). If the first agent fails, the entire workflow aborts and triggers CX08_SELF_CORRECTION.

### Circuit Binding

**Hard requirement**: All 6 required circuits (CX01-CX06) must pass before ANY agent execution:

- `CX01_INTENT_DETECTION`
- `CX02_AUDIENCE_CLASSIFICATION`
- `CX03_STATE_MEMORY_RETRIEVAL`
- `CX04_CONTENT_STRATEGY_SELECTION`
- `CX05_BRAND_GUARD`
- `CX06_GENERATION_EXECUTION`

Circuit validation happens at the coordinator level and is re-validated by each execution agent.

### Shared Circuit Execution ID

Both execution agents **share the same `circuit_execution_id`** (derived from `context.request_id`):

```typescript
const context: CircuitExecutionContext = {
  workspace_id: 'workspace-123',
  client_id: 'client-456',
  request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,  // SHARED ID
  user_id: 'user-789',
};

// Both agents use SAME circuit_execution_id
await executeEmailSending({
  circuit_execution_id: context.request_id,  // Same ID
  ...
}, context);

await executeSocialPublishing({
  circuit_execution_id: context.request_id,  // Same ID
  ...
}, context);
```

### Unified Suppression

If a recipient is suppressed in ONE channel, execution is blocked in ALL channels. Suppression is checked before any agent execution:

- Email suppression reasons: `bounced`, `complained`, `unsubscribed`
- Social suppression: Future implementation

If suppression is detected, the workflow immediately fails with status `403 Forbidden`.

### Metrics Aggregation

Cross-channel engagement metrics are aggregated from:

- `email_agent_metrics` - Email deliverability and engagement
- `social_agent_metrics` - Social platform engagement
- Cross-channel engagement rate (placeholder for future implementation)

Metrics are stored separately and fetched asynchronously via the metrics endpoint.

### Auto-Correction

On repeated agent failures, CX08_SELF_CORRECTION is triggered automatically with:

- Failure reason
- Current flow strategy
- Performance metrics (agents executed, success rate)

---

## API Reference

### POST /api/circuits/agents/multichannel/execute

Execute a multi-channel workflow.

**Query Parameters**:
- `workspaceId` (required): Workspace UUID
- `action` (optional): Default `'execute'`

**Request Body**:

```typescript
{
  "circuit_execution_id": "string",  // MANDATORY
  "workspace_id": "uuid",
  "client_id": "uuid",
  "flow_id": "EMAIL_THEN_SOCIAL" | "SOCIAL_THEN_EMAIL" | "EMAIL_ONLY" | "SOCIAL_ONLY",
  "email": {
    "recipient": "user@example.com",
    "final_asset": {
      "subject": "string",
      "html_body": "string",
      "text_body": "string?",
      "cta_url": "string?",
      "preheader": "string?",
      "tags": "string[]?"
    }
  },
  "social": {
    "platform": "facebook" | "instagram" | "linkedin",
    "final_asset": {
      "text_content": "string",
      "hashtags": "string[]",
      "media_urls": "string[]?",
      "scheduled_for": "string?"
    }
  }
}
```

**Response (Success)**:

```json
{
  "workspace_id": "uuid",
  "execution_result": {
    "success": true,
    "flow_id": "EMAIL_THEN_SOCIAL",
    "email_result": {
      "sent": true,
      "provider_message_id": "string",
      "provider": "sendgrid",
      "sent_at": "ISO timestamp"
    },
    "social_result": {
      "published": true,
      "platform_post_id": "string",
      "platform_url": "string",
      "published_at": "ISO timestamp"
    },
    "metrics_summary": {
      "email_sent": true,
      "social_published": true,
      "total_reach": 0
    }
  }
}
```

**Response (Circuit Validation Failed)**: `403 Forbidden`

```json
{
  "error": {
    "message": "Circuit validation failed. Missing circuits: CX01, CX02"
  }
}
```

**Response (Unified Suppression Triggered)**: `403 Forbidden`

```json
{
  "error": {
    "message": "Unified suppression: email_bounced_suppressed"
  }
}
```

**Response (Workflow Failed)**: `400 Bad Request`

```json
{
  "error": {
    "message": "Multi-channel workflow failed",
    "error": "Email failed: Recipient validation failed: rate_limit_exceeded",
    "flow_id": "EMAIL_THEN_SOCIAL"
  }
}
```

---

### GET /api/circuits/agents/multichannel/status

Retrieve execution status for a multi-channel workflow.

**Query Parameters**:
- `workspaceId` (required): Workspace UUID
- `circuitExecutionId` (required): Circuit execution ID
- `action` (optional): Default `'status'` - Options: `'status'`, `'history'`, `'metrics'`

**Response (Status)**: `200 OK`

```json
{
  "workspace_id": "uuid",
  "circuit_execution_id": "string",
  "execution": {
    "flow_id": "EMAIL_THEN_SOCIAL",
    "agent_sequence": ["AGENT_EMAIL_EXECUTOR", "AGENT_SOCIAL_EXECUTOR"],
    "execution_status": "completed",
    "started_at": "ISO timestamp",
    "completed_at": "ISO timestamp",
    "failure_reason": null
  }
}
```

**Response (History)**: `200 OK`

```json
{
  "workspace_id": "uuid",
  "executions": [
    {
      "circuit_execution_id": "string",
      "flow_id": "EMAIL_THEN_SOCIAL",
      "execution_status": "completed",
      "started_at": "ISO timestamp",
      "completed_at": "ISO timestamp"
    }
  ],
  "total_count": 42
}
```

**Response (Metrics)**: `200 OK`

```json
{
  "workspace_id": "uuid",
  "circuit_execution_id": "string",
  "aggregated_metrics": {
    "email_metrics": {
      "delivered": true,
      "opened": true,
      "clicked": false,
      "bounced": false,
      "unsubscribed": false,
      "complained": false
    },
    "social_metrics": {
      "impressions": 1250,
      "likes": 45,
      "shares": 12,
      "comments": 3,
      "clicks": 89
    },
    "cross_channel_engagement_rate": 0.056
  }
}
```

---

## Integration Examples

### Example 1: EMAIL_THEN_SOCIAL Flow

```typescript
import { executeMultiChannelWorkflow, type MultiChannelInput } from '@/lib/decision-circuits';

const context = {
  workspace_id: 'ws-123',
  client_id: 'client-456',
  request_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
  user_id: 'user-789',
};

const input: MultiChannelInput = {
  circuit_execution_id: context.request_id,
  workspace_id: 'ws-123',
  client_id: 'client-456',
  flow_id: 'EMAIL_THEN_SOCIAL',
  email: {
    recipient: 'lead@example.com',
    final_asset: {
      subject: 'Check out this opportunity',
      html_body: '<p>Hi there...</p>',
      text_body: 'Hi there...',
      cta_url: 'https://example.com/offer',
    },
  },
  social: {
    platform: 'linkedin',
    final_asset: {
      text_content: 'Exciting news for our community!',
      hashtags: ['marketing', 'innovation'],
      media_urls: ['https://cdn.example.com/image.jpg'],
    },
  },
};

const result = await executeMultiChannelWorkflow(input, context);

if (result.success) {
  console.log('Workflow completed:', result.metrics_summary);
  // email_sent: true, social_published: true
} else {
  console.error('Workflow failed:', result.error);
}
```

### Example 2: Using API Endpoint

```typescript
// Execute workflow
const executeRes = await fetch('/api/circuits/agents/multichannel/execute?workspaceId=ws-123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    circuit_execution_id: context.request_id,
    workspace_id: 'ws-123',
    client_id: 'client-456',
    flow_id: 'EMAIL_THEN_SOCIAL',
    email: { recipient: 'user@example.com', final_asset: { ... } },
    social: { platform: 'facebook', final_asset: { ... } },
  }),
});

const executeData = await executeRes.json();

// Get status
const statusRes = await fetch(
  `/api/circuits/agents/multichannel/status?workspaceId=ws-123&circuitExecutionId=${executeData.execution_result.email_result.provider_message_id}&action=status`
);

const statusData = await statusRes.json();
console.log('Execution Status:', statusData.execution.execution_status);

// Get aggregated metrics
const metricsRes = await fetch(
  `/api/circuits/agents/multichannel/status?workspaceId=ws-123&circuitExecutionId=${context.request_id}&action=metrics`
);

const metricsData = await metricsRes.json();
console.log('Aggregated Metrics:', metricsData.aggregated_metrics);
```

### Example 3: SOCIAL_ONLY Flow

```typescript
const input: MultiChannelInput = {
  circuit_execution_id: context.request_id,
  workspace_id: 'ws-123',
  client_id: 'client-456',
  flow_id: 'SOCIAL_ONLY',  // Social only, skip email
  social: {
    platform: 'instagram',
    final_asset: {
      text_content: 'New product launch! 🚀',
      hashtags: ['productlaunch', 'innovation'],
      media_urls: ['https://cdn.example.com/promo.jpg'],
    },
  },
};

const result = await executeMultiChannelWorkflow(input, context);
// Only social_result will be populated
```

---

## Error Handling

### Hard Failures (Abort Workflow)

These errors cause immediate workflow abort and CX08_SELF_CORRECTION trigger:

- Circuit validation failed: `403 Forbidden`
- Unified suppression detected: `403 Forbidden`
- First agent failure: `400 Bad Request`

**Example Error Response**:

```json
{
  "error": {
    "message": "Circuit validation failed. Missing circuits: CX01, CX03, CX05"
  }
}
```

### Soft Failures (Agent Returns Error)

Email or social agent returns `{ sent: false, error: string }` or `{ published: false, error: string }`. The coordinator treats this as a hard failure and aborts.

### Recovery

When a hard failure occurs:

1. Orchestration log updated with `execution_status: 'failed'` and `failure_reason`
2. CX08_SELF_CORRECTION triggered with failure context
3. If correction fails, error is logged but workflow proceeds to return failure response

---

## Database Schema

### multichannel_executions Table

```sql
CREATE TABLE multichannel_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  flow_id TEXT NOT NULL CHECK (flow_id IN ('EMAIL_THEN_SOCIAL', 'SOCIAL_THEN_EMAIL', 'EMAIL_ONLY', 'SOCIAL_ONLY')),

  -- Orchestration tracking
  agent_sequence TEXT[] DEFAULT '{}',  -- ['AGENT_EMAIL_EXECUTOR', 'AGENT_SOCIAL_EXECUTOR']
  execution_status TEXT NOT NULL CHECK (execution_status IN ('in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `idx_multichannel_executions_workspace` on `workspace_id`
- `idx_multichannel_executions_circuit` on `circuit_execution_id`
- `idx_multichannel_executions_client` on `(workspace_id, client_id)`
- `idx_multichannel_executions_flow` on `flow_id`
- `idx_multichannel_executions_started_at` on `started_at DESC`

### RLS Policy

All records isolated by `workspace_id` via `get_current_workspace_id()` function.

---

## Performance Characteristics

- **Circuit validation**: ~10-50ms (single Supabase query)
- **Unified suppression check**: ~5-20ms (single Supabase query)
- **Agent execution**: Email 500-2000ms, Social 1000-3000ms
- **Metrics aggregation**: ~10-50ms (two parallel Supabase queries)

**Total workflow latency**: EMAIL_THEN_SOCIAL typically 1500-5000ms depending on agent response times.

---

## Monitoring & Metrics

Query the `multichannel_performance` view for performance summaries:

```sql
SELECT * FROM multichannel_performance WHERE workspace_id = 'ws-123';

-- Returns:
-- workspace_id | flow_id | total_executions | successful_executions | success_rate | avg_duration_seconds
-- ws-123 | EMAIL_THEN_SOCIAL | 245 | 238 | 97.14 | 2.342
```

---

## Troubleshooting

### Circuit Validation Failed

**Issue**: Workflow returns `403 Forbidden` with missing circuits

**Solution**: Verify that all 6 required circuits (CX01-CX06) have executed successfully in the orchestration plan. Check `circuit_execution_logs` table:

```sql
SELECT circuit_id, success FROM circuit_execution_logs
WHERE execution_id = 'your-circuit-execution-id'
AND workspace_id = 'ws-123';
```

### Unified Suppression Blocking Workflow

**Issue**: Workflow blocked due to email suppression

**Solution**: Check suppression list and reason:

```sql
SELECT email, reason, suppressed_at FROM email_suppression_list
WHERE workspace_id = 'ws-123'
AND email = 'user@example.com';
```

If suppression is incorrect, remove via:

```sql
DELETE FROM email_suppression_list
WHERE workspace_id = 'ws-123'
AND email = 'user@example.com'
AND reason = 'bounced';
```

### Agent Failure (Email or Social)

**Issue**: Email or social agent fails after circuit validation passes

**Causes**:

- Email: Invalid recipient, rate limit exceeded, provider error
- Social: Missing platform credentials, invalid content, platform API error

**Solution**: Check execution logs:

```sql
-- Email execution logs
SELECT * FROM email_agent_executions
WHERE workspace_id = 'ws-123'
AND circuit_execution_id = 'your-id'
ORDER BY created_at DESC;

-- Social execution logs
SELECT * FROM social_agent_executions
WHERE workspace_id = 'ws-123'
AND circuit_execution_id = 'your-id'
ORDER BY created_at DESC;
```

---

## Deployment Checklist

- [x] Database migration applied (20251215_decision_circuits_multichannel_coordinator_v1_5.sql)
- [x] Module exports updated (src/lib/decision-circuits/index.ts)
- [x] API routes created and tested
- [x] TypeScript type checking passes
- [x] ESLint validation passes
- [x] RLS policies enforced on multichannel_executions table
- [ ] Integration tests passing (create in tests/ folder)
- [ ] E2E tests passing (create in tests/ folder)
- [ ] Production metrics collected and validated
- [ ] Runbook for common failure scenarios created
- [ ] Team training on multi-channel workflow patterns completed

---

## Future Enhancements

- **v1.6.0**: Parallel execution support (`PARALLEL` flow_id)
- **v1.6.0**: Social platform suppression rules
- **v1.7.0**: Intelligent flow routing based on client preferences
- **v1.7.0**: Advanced cross-channel engagement scoring
- **v2.0.0**: AI-driven channel selection and sequencing
