# Founder Intelligence OS - API Reference

**Status**: Production-Ready
**Last Updated**: 2025-11-28
**Version**: 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [AI Phill Endpoints](#ai-phill-endpoints)
3. [Founder Ops Endpoints](#founder-ops-endpoints)
4. [Cognitive Twin Endpoints](#cognitive-twin-endpoints)
5. [Business Registry Endpoints](#business-registry-endpoints)
6. [Journal Endpoints](#journal-endpoints)
7. [Signal Endpoints](#signal-endpoints)
8. [SEO Leak Engine Endpoints](#seo-leak-engine-endpoints)
9. [Multi-Channel Endpoints](#multi-channel-endpoints)
10. [Error Codes](#error-codes)

---

## Authentication

### Bearer Token Authentication

All API requests require a Bearer token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.founderos.io/api/founder/assistant
```

### Getting Your Access Token

```typescript
// In your frontend application
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Use in API calls
fetch('/api/founder/assistant', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Token Refresh

Tokens expire after 1 hour. Automatically handled by Supabase client.

```typescript
// If manually handling tokens
const { data, error } = await supabase.auth.refreshSession();
const newToken = data.session.access_token;
```

### Workspace Scoping

Most endpoints require `workspaceId` or `founder_business_id`:

```typescript
// Parameter in query string
GET /api/founder/assistant?workspaceId=workspace_123

// Parameter in request body
POST /api/founder/ops/tasks
{
  "workspaceId": "workspace_123",
  "title": "Review budget"
}
```

---

## AI Phill Endpoints

### GET /api/founder/assistant

Get all AI Phill assistant data at once.

**Parameters**:
```
GET /api/founder/assistant?action=[action]&organizationId=[orgId]
```

**Actions**:
- `briefing` - Get latest briefing
- `memory` - Get memory nodes
- `search` - Search memory (requires `?query=X`)
- `emails` - Get email summary
- `staff` - Get team overview
- `financials` - Get financial summary
- `commandHistory` - Get command history
- `dashboard` - Get all data at once

**Response (action: briefing)**:
```typescript
{
  "briefing": {
    "id": "brief_123",
    "created_at": "2025-11-28T14:00:00Z",
    "title": "Daily Briefing - Nov 28, 2025",
    "summary_markdown": "# Today's Briefing\n...",
    "insights": [
      {
        "id": "insight_1",
        "type": "opportunity",
        "title": "3 hot leads from yesterday",
        "priority": "high",
        "description": "..."
      }
    ],
    "alerts": [
      {
        "id": "alert_1",
        "type": "risk",
        "title": "CAC increasing 15%",
        "severity": "medium"
      }
    ]
  }
}
```

**Response (action: memory)**:
```typescript
{
  "nodes": [
    {
      "id": "mem_123",
      "node_type": "decision",
      "title": "Decision: Focus on Enterprise",
      "content_md": "Decided to...",
      "created_at": "2025-11-27T10:00:00Z"
    }
  ],
  "stats": {
    "total_nodes": 342,
    "nodes_by_type": {
      "decision": 45,
      "insight": 89,
      "risk": 23,
      "opportunity": 34
    }
  }
}
```

**Response (action: dashboard)**:
```typescript
{
  "briefing": { ... },
  "memory_stats": { ... },
  "email_summary": { ... },
  "staff_overview": { ... },
  "financial_summary": { ... }
}
```

**Error Responses**:
- `401` - Unauthorized (invalid/missing token)
- `404` - Action not found
- `500` - Server error

---

### POST /api/founder/assistant/search

Search AI Phill memory with natural language.

**Request**:
```typescript
POST /api/founder/assistant/search
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "query": "What decisions did we make about product roadmap?",
  "limit": 10,
  "node_types": ["decision", "strategy"]
}
```

**Response**:
```typescript
{
  "results": [
    {
      "id": "mem_123",
      "node_type": "decision",
      "title": "Pause Product B for 6 months",
      "relevance_score": 0.95,
      "created_at": "2025-10-15T09:00:00Z",
      "excerpt": "We decided to pause Product B development because..."
    }
  ],
  "total_results": 3
}
```

---

## Founder Ops Endpoints

### GET /api/founder/ops/overview

Get Founder Ops Hub overview metrics.

**Parameters**:
```
GET /api/founder/ops/overview?workspaceId=ws_123
```

**Response**:
```typescript
{
  "total_tasks": 45,
  "pending_approvals": 8,
  "scheduled_today": 5,
  "completed_today": 2,
  "overdue_tasks": 3,
  "queue_status": {
    "daily": {
      "total": 5,
      "completed": 2,
      "pending": 3,
      "progress_percentage": 40
    },
    "paused": false,
    "pause_reason": null
  },
  "workload_by_brand": [
    {
      "brand_id": "brand_123",
      "pending_tasks": 15,
      "capacity_percentage": 68,
      "overload_detected": false
    }
  ],
  "priority_distribution": {
    "critical": 2,
    "high": 8,
    "medium": 20,
    "low": 15
  }
}
```

---

### GET /api/founder/ops/queue/daily

Get daily task queue for specific date.

**Parameters**:
```
GET /api/founder/ops/queue/daily
  ?workspaceId=ws_123
  &date=2025-11-28
```

**Response**:
```typescript
{
  "queue_date": "2025-11-28",
  "tasks": [
    {
      "id": "task_123",
      "title": "Review campaign performance",
      "status": "pending",
      "priority": "high",
      "scheduled_time": "09:00",
      "estimated_duration_minutes": 30,
      "brand_workload": "marketing"
    }
  ],
  "summary": {
    "total_tasks": 5,
    "completed": 1,
    "pending": 4,
    "estimated_total_time": 180
  }
}
```

---

### POST /api/founder/ops/queue/pause

Pause daily queue processing.

**Request**:
```typescript
POST /api/founder/ops/queue/pause
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "reason": "CEO taking time off",
  "pause_until": "2025-12-03T00:00:00Z"
}
```

**Response**:
```typescript
{
  "success": true,
  "status": "paused",
  "pause_until": "2025-12-03T00:00:00Z",
  "message": "Queue paused until Dec 3. Pending tasks will resume then."
}
```

---

### POST /api/founder/ops/queue/resume

Resume daily queue processing.

**Request**:
```typescript
POST /api/founder/ops/queue/resume
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123"
}
```

**Response**:
```typescript
{
  "success": true,
  "status": "resumed",
  "message": "Queue resumed. Tasks will process normally."
}
```

---

### GET /api/founder/ops/tasks

List all tasks with filters.

**Parameters**:
```
GET /api/founder/ops/tasks
  ?workspaceId=ws_123
  &status=pending_review
  &priority=high
  &limit=20
  &offset=0
```

**Response**:
```typescript
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Review Q4 Budget",
      "description": "Review and approve quarterly budget allocation",
      "status": "pending_review",
      "priority": "high",
      "deadline": "2025-12-05T17:00:00Z",
      "assigned_to": "founder",
      "created_at": "2025-11-28T10:00:00Z",
      "requires_approval": true,
      "risk_level": "medium",
      "brand_workload": "operations"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### POST /api/founder/ops/tasks

Create new task.

**Request**:
```typescript
POST /api/founder/ops/tasks
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "title": "Hire VP Sales",
  "description": "Post job, review candidates, make offer",
  "priority": "high",
  "deadline": "2025-12-15T17:00:00Z",
  "brand_workload": "sales",
  "requires_approval": true,
  "risk_level": "medium"
}
```

**Response**:
```typescript
{
  "id": "task_456",
  "title": "Hire VP Sales",
  "status": "pending",
  "created_at": "2025-11-28T14:30:00Z",
  "message": "Task created and queued for processing"
}
```

---

### PUT /api/founder/ops/tasks/[taskId]

Update task.

**Request**:
```typescript
PUT /api/founder/ops/tasks/task_123
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "status": "in_progress",
  "notes": "Started implementation",
  "priority": "critical"
}
```

**Response**:
```typescript
{
  "id": "task_123",
  "status": "in_progress",
  "updated_at": "2025-11-28T15:00:00Z",
  "message": "Task updated"
}
```

---

## Cognitive Twin Endpoints

### GET /api/founder/memory/snapshot

Get business snapshot.

**Parameters**:
```
GET /api/founder/memory/snapshot
  ?workspaceId=ws_123
  &businessId=bus_123
```

**Response**:
```typescript
{
  "id": "snap_123",
  "timestamp": "2025-11-28T14:00:00Z",
  "business_health": {
    "overall_score": 74,
    "trend": "stable",
    "momentum": {
      "direction": "stable",
      "velocity": 0.2,
      "key_drivers": [
        "Strong sales growth",
        "Product stability improving"
      ]
    }
  },
  "domain_scores": {
    "marketing": 76,
    "sales": 85,
    "delivery": 72,
    "product": 68,
    "clients": 79,
    "engineering": 81,
    "finance": 62,
    "founder": 70,
    "operations": 75,
    "team": 73,
    "legal": 80,
    "partnerships": 55,
    "compliance": 88
  },
  "top_risks": [
    {
      "domain": "finance",
      "title": "Runway pressure",
      "severity": "high",
      "description": "At current burn rate, runway = 6 months"
    }
  ],
  "top_opportunities": [
    {
      "domain": "partnerships",
      "title": "Channel expansion",
      "impact": "high",
      "description": "3 potential partners identified"
    }
  ]
}
```

---

### GET /api/founder/memory/weekly-digest

Get weekly digest.

**Parameters**:
```
GET /api/founder/memory/weekly-digest
  ?workspaceId=ws_123
  &businessId=bus_123
  ?from=2025-11-21
  ?to=2025-11-28
```

**Response**:
```typescript
{
  "id": "digest_123",
  "period": {
    "start": "2025-11-21",
    "end": "2025-11-28"
  },
  "overall_health": 74,
  "domain_summary": {
    "marketing": {
      "score": 76,
      "change": "+2",
      "status": "good",
      "focus_area": "CAC optimization working"
    },
    // ... all 13 domains
  },
  "key_insights": [
    "Sales pipeline strengthening (+$100K)",
    "Product team stabilizing (bugs down 30%)",
    "Founder burnout risk rising (70 hours/week)"
  ],
  "recommendations": [
    {
      "priority": "high",
      "domain": "founder",
      "action": "Hire COO to manage operations",
      "expected_impact": "Reduce founder workload by 50%"
    }
  ],
  "action_items": [
    {
      "id": "action_1",
      "title": "Contact 5 potential COO candidates",
      "deadline": "2025-12-05",
      "owner": "founder"
    }
  ]
}
```

---

### POST /api/founder/memory/decision-scenarios

Create decision simulation.

**Request**:
```typescript
POST /api/founder/memory/decision-scenarios
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "businessId": "bus_123",
  "decision": "Raise Series A or bootstrap",
  "options": [
    {
      "id": "option_a",
      "name": "Raise Series A ($5M)",
      "details": {
        "amount": 5000000,
        "dilution": 0.45,
        "timeline_weeks": 12
      }
    },
    {
      "id": "option_b",
      "name": "Bootstrap another year",
      "details": {
        "additional_funding": 0,
        "timeline_months": 12,
        "growth_pace": "slower"
      }
    }
  ]
}
```

**Response**:
```typescript
{
  "id": "scenario_123",
  "decision": "Raise Series A or bootstrap",
  "scenarios": [
    {
      "id": "scenario_a",
      "option_id": "option_a",
      "name": "Raise Series A",
      "projected_outcomes": {
        "12_month_forward": {
          "sales_score": 92,
          "product_score": 78,
          "finance_score": 88,
          "founder_score": 65,
          "overall_health": 82
        },
        "runway": "unlimited (but growth pressure)",
        "key_metrics": {
          "projected_arr": 2500000,
          "projected_team_size": 25,
          "market_position": "strong"
        }
      },
      "risks": [
        {
          "title": "Board pressure",
          "severity": "medium",
          "description": "Board will expect aggressive growth targets"
        }
      ]
    },
    {
      "id": "scenario_b",
      "option_id": "option_b",
      "name": "Bootstrap",
      "projected_outcomes": {
        "12_month_forward": {
          "sales_score": 75,
          "product_score": 70,
          "finance_score": 62,
          "founder_score": 85,
          "overall_health": 73
        },
        "runway": "14 months",
        "key_metrics": {
          "projected_arr": 1200000,
          "projected_team_size": 12,
          "market_position": "moderate"
        }
      },
      "risks": [
        {
          "title": "Cash pressure",
          "severity": "high",
          "description": "Must reach profitability or raise at worse terms"
        }
      ]
    }
  ],
  "recommendation": {
    "recommended_option": "option_a",
    "reasoning": "Better risk-adjusted outcome given market timing"
  }
}
```

---

## Business Registry Endpoints

### GET /api/founder/businesses

List user's businesses.

**Request**:
```
GET /api/founder/businesses?workspaceId=ws_123
```

**Response**:
```typescript
{
  "businesses": [
    {
      "id": "bus_123",
      "name": "TechCorp Inc",
      "description": "SaaS sales platform",
      "website": "https://techcorp.io",
      "industry": "Software",
      "status": "active",
      "timezone": "America/New_York",
      "currency": "USD",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### POST /api/founder/businesses

Create new business.

**Request**:
```typescript
POST /api/founder/businesses
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "name": "NewCorp",
  "description": "Emerging startup",
  "website": "https://newcorp.io",
  "industry": "SaaS",
  "timezone": "America/Los_Angeles",
  "currency": "USD"
}
```

**Response**:
```typescript
{
  "id": "bus_456",
  "name": "NewCorp",
  "created_at": "2025-11-28T14:30:00Z",
  "message": "Business created successfully"
}
```

---

## Journal Endpoints

### POST /api/founder/journal/entries

Create journal entry.

**Request**:
```typescript
POST /api/founder/journal/entries
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "title": "Q4 Planning Session",
  "body": "# Q4 Planning\n\nWe decided to focus on...",
  "tags": ["planning", "strategy", "q4"],
  "businessId": "bus_123"
}
```

**Response**:
```typescript
{
  "id": "entry_789",
  "title": "Q4 Planning Session",
  "created_at": "2025-11-28T14:30:00Z",
  "message": "Journal entry created"
}
```

---

### GET /api/founder/journal/entries

List journal entries.

**Parameters**:
```
GET /api/founder/journal/entries
  ?workspaceId=ws_123
  &businessId=bus_123
  &tags=strategy
  &limit=20
  &offset=0
```

**Response**:
```typescript
{
  "entries": [
    {
      "id": "entry_789",
      "title": "Q4 Planning Session",
      "created_at": "2025-11-28T14:30:00Z",
      "tags": ["planning", "strategy"],
      "excerpt": "# Q4 Planning\n\nWe decided to..."
    }
  ],
  "total": 12
}
```

---

## Signal Endpoints

### POST /api/founder/signals/record

Record new business signal.

**Request**:
```typescript
POST /api/founder/signals/record
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "businessId": "bus_123",
  "signal_family": "revenue_signals",
  "metric_name": "Monthly Recurring Revenue",
  "metric_value": 50000,
  "previous_value": 45000,
  "confidence_score": 95,
  "data_sources": ["Stripe export"]
}
```

**Response**:
```typescript
{
  "id": "signal_890",
  "signal_family": "revenue_signals",
  "metric_value": 50000,
  "trend": "up",
  "velocity": 5,
  "anomaly_detected": false,
  "created_at": "2025-11-28T14:30:00Z",
  "message": "Signal recorded successfully"
}
```

---

### GET /api/founder/signals/aggregated

Get aggregated signals for business.

**Parameters**:
```
GET /api/founder/signals/aggregated
  ?workspaceId=ws_123
  &businessId=bus_123
  ?signal_families=revenue_signals,customer_signals
```

**Response**:
```typescript
{
  "aggregated_at": "2025-11-28T14:00:00Z",
  "business_id": "bus_123",
  "signals": [
    {
      "signal_family": "revenue_signals",
      "metric_name": "MRR",
      "current_value": 50000,
      "previous_value": 45000,
      "trend": "up",
      "velocity": 5,
      "confidence_score": 95,
      "timestamp": "2025-11-28T14:00:00Z"
    }
  ],
  "anomalies_detected": 0
}
```

---

## SEO Leak Engine Endpoints

### POST /api/seo-leak/audit

Create SEO audit job.

**Request**:
```typescript
POST /api/seo-leak/audit
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "url": "https://yoursite.com",
  "audit_type": "full",  // full, technical, content, backlinks
  "businessId": "bus_123"
}
```

**Response**:
```typescript
{
  "audit_job_id": "audit_123",
  "status": "pending",
  "url": "https://yoursite.com",
  "audit_type": "full",
  "created_at": "2025-11-28T14:30:00Z",
  "expected_completion": "2025-11-28T16:30:00Z",
  "message": "Audit queued. Results available when complete."
}
```

---

### GET /api/seo-leak/audit

Get audit results.

**Parameters**:
```
GET /api/seo-leak/audit
  ?auditId=audit_123
  &businessId=bus_123
```

**Response**:
```typescript
{
  "audit_id": "audit_123",
  "status": "completed",
  "url": "https://yoursite.com",
  "completed_at": "2025-11-28T16:30:00Z",
  "scores": {
    "q_star": 72,
    "p_star": 81,
    "t_star": 58,
    "overall_seo": 70
  },
  "gaps_identified": [
    {
      "gap_id": "gap_001",
      "type": "keyword",
      "keyword": "sales software for teams",
      "search_volume": 480,
      "your_position": null,
      "competitor_position": 3,
      "traffic_potential": 450,
      "difficulty": 42,
      "priority_score": 87
    }
  ],
  "quick_wins": [
    {
      "issue": "Missing alt text on 12 images",
      "impact": "+50 traffic potential",
      "effort": "30 minutes"
    }
  ]
}
```

---

## Multi-Channel Endpoints

### GET /api/multi-channel/social-inbox

Get social media messages.

**Parameters**:
```
GET /api/multi-channel/social-inbox
  ?workspaceId=ws_123
  &status=open
  &platform=linkedin
  &limit=20
```

**Response**:
```typescript
{
  "messages": [
    {
      "id": "msg_123",
      "platform": "linkedin",
      "sender": "john@company.com",
      "content": "How much does your software cost?",
      "timestamp": "2025-11-28T14:15:00Z",
      "category": "inquiry",
      "sentiment": "positive",
      "priority_score": 85,
      "status": "open"
    }
  ],
  "total": 23,
  "by_category": {
    "inquiry": 12,
    "support": 6,
    "feedback": 3,
    "spam": 2
  }
}
```

---

### POST /api/multi-channel/social-inbox/[messageId]/respond

Respond to social message.

**Request**:
```typescript
POST /api/multi-channel/social-inbox/msg_123/respond
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "workspaceId": "ws_123",
  "response": "Thanks for the question! Pricing starts at...",
  "use_template": false
}
```

**Response**:
```typescript
{
  "message_id": "msg_123",
  "status": "responded",
  "responded_at": "2025-11-28T14:30:00Z",
  "message": "Response posted successfully"
}
```

---

### GET /api/multi-channel/ads/performance

Get ads performance.

**Parameters**:
```
GET /api/multi-channel/ads/performance
  ?workspaceId=ws_123
  &date_from=2025-11-01
  &date_to=2025-11-28
  &platform=google  // google, meta, linkedin, all
```

**Response**:
```typescript
{
  "period": {
    "from": "2025-11-01",
    "to": "2025-11-28"
  },
  "total_spend": 8200,
  "total_clicks": 2847,
  "total_conversions": 248,
  "blended_cpa": 33.06,
  "blended_roas": 3.8,
  "by_platform": {
    "google": {
      "spend": 4200,
      "roas": 4.1,
      "status": "excellent"
    },
    "meta": {
      "spend": 3100,
      "roas": 3.2,
      "status": "good"
    },
    "linkedin": {
      "spend": 900,
      "roas": 1.5,
      "status": "fair"
    }
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Resolution |
|------|---------|-----------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Invalid/missing authentication token |
| 403 | Forbidden | No permission for this resource |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists or conflict |
| 429 | Rate Limited | Too many requests, retry later |
| 500 | Server Error | Internal server error |

### Error Response Format

```typescript
{
  "error": "Missing required parameter: workspaceId",
  "code": "MISSING_PARAMETER",
  "details": {
    "parameter": "workspaceId",
    "location": "query"
  },
  "timestamp": "2025-11-28T14:30:00Z"
}
```

### Common Errors

#### 401 Unauthorized
```json
{
  "error": "Invalid authentication token",
  "code": "INVALID_TOKEN",
  "resolution": "Get a new token from /auth/login"
}
```

#### 403 Forbidden
```json
{
  "error": "You do not have permission to access this business",
  "code": "FORBIDDEN",
  "resolution": "Verify businessId and your role"
}
```

#### 404 Not Found
```json
{
  "error": "Business not found",
  "code": "NOT_FOUND",
  "resolution": "Check businessId parameter"
}
```

#### 409 Conflict
```json
{
  "error": "A journal entry with this title already exists",
  "code": "DUPLICATE",
  "resolution": "Use a unique title or update existing entry"
}
```

#### 429 Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "retry_after": 60,
  "resolution": "Retry after 60 seconds"
}
```

---

## Rate Limits

### Public API Limits

- **Authenticated requests**: 1,000 per hour
- **Per-endpoint limits**: 100 per minute

### Handling Rate Limits

```typescript
// Retry with exponential backoff
async function apiCall(endpoint, options, attempt = 1) {
  try {
    return await fetch(endpoint, options);
  } catch (error) {
    if (error.status === 429 && attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiCall(endpoint, options, attempt + 1);
    }
    throw error;
  }
}
```

---

## Pagination

Large result sets are paginated:

```typescript
GET /api/founder/ops/tasks?limit=20&offset=0

Response:
{
  "tasks": [...],
  "limit": 20,
  "offset": 0,
  "total": 45,
  "has_more": true
}
```

### Pagination Best Practices

- Default limit: 20, max: 100
- Use `offset` to paginate through results
- Check `has_more` to know if more results exist

```typescript
// Fetch all pages
async function fetchAllTasks(workspaceId) {
  const allTasks = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `/api/founder/ops/tasks?workspaceId=${workspaceId}&limit=20&offset=${offset}`
    );
    const data = await response.json();

    allTasks.push(...data.tasks);
    offset += data.limit;
    hasMore = data.has_more;
  }

  return allTasks;
}
```

---

## Webhooks (Coming Soon)

Subscribe to events via webhooks:

```typescript
// Register webhook
POST /api/webhooks
{
  "url": "https://yoursite.com/webhook",
  "events": ["task.created", "signal.recorded", "insight.generated"],
  "secret": "webhook_secret_key"
}
```

---

## SDK & Libraries

### JavaScript/TypeScript

```typescript
import { FounderOS } from '@founderos/sdk';

const client = new FounderOS({
  token: 'your_token',
  workspaceId: 'ws_123'
});

// Create task
const task = await client.ops.createTask({
  title: 'Review budget',
  priority: 'high'
});

// Get briefing
const briefing = await client.phill.getBriefing();

// Record signal
const signal = await client.signals.record({
  family: 'revenue_signals',
  name: 'MRR',
  value: 50000
});
```

---

## Support

- **API Status**: https://status.founderos.io
- **Documentation**: https://docs.founderos.io
- **Support Email**: api-support@founderos.io
- **Issues**: https://github.com/founderos/api/issues

---

**Status**: Production-Ready
**Last Updated**: 2025-11-28
**Version**: 1.0.0
