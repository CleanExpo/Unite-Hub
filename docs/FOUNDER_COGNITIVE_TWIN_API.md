# Founder Cognitive Twin API Reference

## Authentication

All endpoints require authentication via Bearer token:

```bash
Authorization: Bearer <access_token>
```

All requests must include `workspaceId` as a query parameter or in the request body.

---

## Memory Snapshot API

### POST /api/founder/memory/snapshot

Create a new memory snapshot aggregating all business data.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "timeRangeDays": 30,
  "dataSources": ["crm", "email", "social", "ads"],
  "includeAIInsight": true
}
```

**Response:**
```json
{
  "success": true,
  "snapshot": {
    "id": "uuid",
    "snapshotAt": "2025-01-15T00:00:00Z",
    "timeRangeStart": "2024-12-15T00:00:00Z",
    "timeRangeEnd": "2025-01-15T00:00:00Z",
    "summary": {
      "totalContacts": 150,
      "activeClients": 45,
      "opportunities": 12,
      "risks": 3,
      "sentiment": { "positive": 0.65, "neutral": 0.25, "negative": 0.10 }
    },
    "dataSourcesIncluded": ["crm", "email", "social"],
    "confidenceScore": 0.85
  }
}
```

### GET /api/founder/memory/snapshot

Fetch latest or specific snapshot.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `snapshotId` (optional): Specific snapshot UUID

**Response:**
```json
{
  "success": true,
  "snapshot": { /* same as POST response */ }
}
```

---

## Momentum API

### GET /api/founder/memory/momentum

Get momentum scores across 7 business domains.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `includeHistory` (optional): `true` to include historical scores
- `historyLimit` (optional): Number of historical periods (default: 12)

**Response:**
```json
{
  "success": true,
  "momentum": {
    "id": "uuid",
    "periodStart": "2025-01-08T00:00:00Z",
    "periodEnd": "2025-01-15T00:00:00Z",
    "overallScore": 72,
    "scores": {
      "marketing": { "score": 75, "trend": "up" },
      "sales": { "score": 68, "trend": "stable" },
      "delivery": { "score": 82, "trend": "up" },
      "product": { "score": 70, "trend": "down" },
      "clients": { "score": 78, "trend": "up" },
      "engineering": { "score": 65, "trend": "stable" },
      "finance": { "score": 66, "trend": "down" }
    },
    "notes": { "marketing": "Campaign performance improving" }
  },
  "history": [
    {
      "periodStart": "2025-01-01T00:00:00Z",
      "periodEnd": "2025-01-08T00:00:00Z",
      "overallScore": 68
    }
  ]
}
```

---

## Patterns API

### GET /api/founder/memory/patterns

Get cross-client patterns detected by AI.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `patternTypes` (optional): Comma-separated types (`communication,buying_signal,churn_risk,opportunity,engagement,seasonal`)
- `minStrength` (optional): Minimum strength score (0-1)
- `status` (optional): `active`, `resolved`, `dismissed`
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "patterns": [
    {
      "id": "uuid",
      "patternType": "buying_signal",
      "title": "Q1 Budget Cycle Engagement",
      "description": "5 clients showing increased engagement ahead of Q1 budget approvals",
      "strengthScore": 0.82,
      "recurrenceCount": 3,
      "affectedClientIds": ["uuid1", "uuid2"],
      "affectedPreClientIds": ["uuid3"],
      "firstDetectedAt": "2024-12-01T00:00:00Z",
      "lastSeenAt": "2025-01-14T00:00:00Z",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

## Opportunities API

### GET /api/founder/memory/opportunities

Get consolidated opportunity backlog.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `status` (optional): `new`, `evaluating`, `pursuing`, `won`, `lost`, `deferred`
- `category` (optional): `upsell`, `cross_sell`, `new_business`, `partnership`, `expansion`, `referral`
- `minScore` (optional): Minimum confidence score
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "opportunities": [
    {
      "id": "uuid",
      "source": "email_analysis",
      "category": "upsell",
      "title": "Premium Tier Upgrade - Acme Corp",
      "description": "Client mentioned expanding team, good fit for premium tier",
      "potentialValue": 50000,
      "confidenceScore": 0.78,
      "urgencyScore": 65,
      "linkedContactIds": ["uuid1"],
      "linkedPreClientIds": [],
      "suggestedActions": ["Schedule call to discuss growth plans"],
      "status": "evaluating",
      "detectedAt": "2025-01-10T00:00:00Z",
      "expiresAt": "2025-02-10T00:00:00Z"
    }
  ],
  "count": 1
}
```

### PATCH /api/founder/memory/opportunities

Update opportunity status.

**Request Body:**
```json
{
  "opportunityId": "uuid",
  "workspaceId": "uuid",
  "status": "pursuing",
  "notes": "Scheduled discovery call for next week"
}
```

---

## Risks API

### GET /api/founder/memory/risks

Get risk register.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `category` (optional): `client_churn`, `revenue_decline`, `delivery_delay`, `team_capacity`, `market_shift`, `competitive_threat`, `operational`
- `mitigationStatus` (optional): `unaddressed`, `monitoring`, `in_progress`, `mitigated`, `accepted`
- `minSeverity` (optional): Minimum severity score (1-100)
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "risks": [
    {
      "id": "uuid",
      "sourceType": "sentiment_analysis",
      "category": "client_churn",
      "title": "Declining Engagement - BigCo",
      "description": "Response times increasing, sentiment declining over 30 days",
      "severityScore": 75,
      "likelihoodScore": 60,
      "riskScore": 67,
      "linkedContactIds": ["uuid1"],
      "linkedPreClientIds": [],
      "mitigationStatus": "monitoring",
      "mitigationPlan": { "steps": ["Schedule check-in call"] },
      "detectedAt": "2025-01-05T00:00:00Z",
      "reviewDueAt": "2025-01-20T00:00:00Z"
    }
  ],
  "count": 1
}
```

### PATCH /api/founder/memory/risks

Update risk mitigation status.

**Request Body:**
```json
{
  "riskId": "uuid",
  "workspaceId": "uuid",
  "mitigationStatus": "in_progress",
  "mitigationPlan": { "steps": ["Scheduled call", "Offered discount"] },
  "notes": "Client responded positively to outreach"
}
```

---

## Forecast API

### POST /api/founder/memory/forecast

Generate a new strategic forecast.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "horizon": "12_week",
  "includeScenarios": true
}
```

**Horizons:** `6_week`, `12_week`, `1_year`

**Response:**
```json
{
  "success": true,
  "forecast": {
    "id": "uuid",
    "horizon": "12_week",
    "generatedAt": "2025-01-15T00:00:00Z",
    "baselineScenario": {
      "revenue": 125000,
      "clients": 48,
      "growth": 8.5,
      "keyMilestones": ["Close 3 pending deals", "Launch new feature"]
    },
    "optimisticScenario": {
      "revenue": 150000,
      "clients": 55,
      "growth": 15.0,
      "keyMilestones": ["Land enterprise client", "Referral program launch"]
    },
    "pessimisticScenario": {
      "revenue": 100000,
      "clients": 42,
      "growth": 2.5,
      "keyMilestones": ["Retain at-risk clients", "Cost optimization"]
    },
    "keyAssumptions": ["Market conditions stable", "No major competitor launches"],
    "confidenceScore": 0.72,
    "aiInsights": {
      "summary": "Growth trajectory positive with manageable risks",
      "opportunities": ["Q1 budget cycles favor new deals"],
      "risks": ["2 clients showing churn signals"]
    }
  }
}
```

### GET /api/founder/memory/forecast

Fetch existing forecasts.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `horizon` (optional): Filter by horizon
- `limit` (optional): Max results (default: 10)

---

## Decision Scenarios API

### POST /api/founder/memory/decision-scenarios

Create a new decision simulation.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "scenarioType": "pricing_change",
  "title": "Increase prices by 15%",
  "description": "Evaluate impact of 15% price increase across all tiers",
  "assumptions": {
    "churnRate": 0.05,
    "newCustomerImpact": -0.10,
    "implementationDate": "2025-03-01"
  }
}
```

**Scenario Types:** `pricing_change`, `new_product`, `hiring`, `marketing_campaign`, `partnership`, `market_expansion`, `cost_reduction`, `other`

**Response:**
```json
{
  "success": true,
  "scenario": {
    "id": "uuid",
    "scenarioType": "pricing_change",
    "title": "Increase prices by 15%",
    "description": "...",
    "assumptions": { /* ... */ },
    "simulatedOutcomes": [
      {
        "scenario": "best",
        "description": "Minimal churn, revenue increase",
        "probability": 0.25,
        "revenueImpact": 45000,
        "timeToRealize": "3 months",
        "keyRisks": ["Early adopter pushback"],
        "keyBenefits": ["Higher margins", "Premium positioning"]
      },
      {
        "scenario": "expected",
        "description": "Moderate churn, net positive",
        "probability": 0.55,
        "revenueImpact": 28000,
        "timeToRealize": "6 months",
        "keyRisks": ["5% churn", "Longer sales cycles"],
        "keyBenefits": ["Improved profitability"]
      },
      {
        "scenario": "worst",
        "description": "High churn, revenue decline",
        "probability": 0.20,
        "revenueImpact": -15000,
        "timeToRealize": "3 months",
        "keyRisks": ["12% churn", "Competitive pressure"],
        "keyBenefits": ["None significant"]
      }
    ],
    "aiRecommendation": "Consider phased rollout starting with new customers",
    "confidenceScore": 0.75,
    "status": "simulated",
    "createdAt": "2025-01-15T00:00:00Z"
  }
}
```

### PATCH /api/founder/memory/decision-scenarios/[id]

Update scenario status or record actual outcome.

**Request Body (update status):**
```json
{
  "workspaceId": "uuid",
  "status": "decided",
  "notes": "Decision made to proceed with 10% increase"
}
```

**Request Body (record outcome):**
```json
{
  "workspaceId": "uuid",
  "actualOutcome": {
    "scenario": "expected",
    "actualRevenueImpact": 32000,
    "actualChurnRate": 0.04,
    "lessons": "Phased rollout reduced pushback"
  }
}
```

---

## Weekly Digest API

### POST /api/founder/memory/weekly-digest

Generate a new weekly digest.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "weekStartDate": "2025-01-13T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "digest": {
    "id": "uuid",
    "weekStart": "2025-01-13T00:00:00Z",
    "weekEnd": "2025-01-19T23:59:59Z",
    "executiveSummary": "Strong week with 3 new deals closed...",
    "wins": [
      {
        "title": "Closed Acme Corp deal",
        "description": "12-month enterprise contract",
        "impact": "$48,000 ARR"
      }
    ],
    "risks": [
      {
        "title": "BigCo engagement declining",
        "severity": "high",
        "description": "Response times up 50%",
        "recommendedAction": "Schedule executive check-in"
      }
    ],
    "opportunities": [
      {
        "title": "Upsell potential - TechStart",
        "potentialValue": 25000,
        "description": "Team growing, mentioned capacity issues",
        "nextStep": "Send premium tier comparison"
      }
    ],
    "recommendations": [
      {
        "priority": 1,
        "title": "Contact BigCo executive",
        "reasoning": "High-value client showing risk signals",
        "expectedOutcome": "Understand concerns, retain account"
      }
    ],
    "momentumSnapshot": {
      "overall": 72,
      "marketing": 75,
      "sales": 68,
      "delivery": 82,
      "product": 70,
      "clients": 78,
      "engineering": 65,
      "finance": 66
    },
    "keyMetrics": {
      "newLeads": 45,
      "newLeadsChange": 12,
      "dealsWon": 3,
      "dealsWonChange": 50,
      "revenue": 48000,
      "revenueChange": 25,
      "avgResponseTime": 4.2,
      "responseTimeChange": -15
    },
    "generatedAt": "2025-01-20T00:00:00Z"
  }
}
```

### GET /api/founder/memory/weekly-digest

Fetch digest history.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `digestId` (optional): Specific digest UUID
- `limit` (optional): Max results (default: 12)

---

## Next Actions API

### GET /api/founder/memory/next-actions

Get recommended next actions.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID
- `category` (optional): `client_outreach`, `follow_up`, `proposal`, `meeting`, `revenue`, `risk_mitigation`, `opportunity`, `growth`
- `urgency` (optional): `immediate`, `today`, `this_week`, `next_week`, `this_month`
- `limit` (optional): Max results (default: 10)

**Response:**
```json
{
  "success": true,
  "actions": [
    {
      "id": "uuid",
      "category": "risk_mitigation",
      "urgency": "today",
      "title": "Call BigCo executive",
      "description": "Address declining engagement before it becomes churn",
      "reasoning": "High-value client ($60K ARR) showing 3 risk signals",
      "estimatedImpact": "high",
      "estimatedEffort": "low",
      "linkedOpportunityId": null,
      "linkedRiskId": "uuid",
      "linkedContactIds": ["uuid"],
      "linkedPreClientIds": [],
      "suggestedDueDate": "2025-01-15T17:00:00Z",
      "status": "pending",
      "createdAt": "2025-01-15T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /api/founder/memory/next-actions

Generate fresh recommendations.

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "maxActions": 10,
  "focusCategories": ["revenue", "risk_mitigation"]
}
```

**Response includes:**
- `actions`: Array of recommended actions
- `summary`: AI-generated prioritization summary
- `overloadWarning`: Boolean if founder appears overloaded

---

## Overload API

### GET /api/founder/memory/overload

Get current overload analysis.

**Query Parameters:**
- `workspaceId` (required): Workspace UUID

**Response:**
```json
{
  "success": true,
  "analysis": {
    "overallSeverity": "moderate",
    "overallScore": 58,
    "indicators": [
      { "name": "activeTasks", "value": 12, "threshold": 10, "status": "warning" },
      { "name": "responseBacklog", "value": 8, "threshold": 15, "status": "ok" },
      { "name": "meetingLoad", "value": 6, "threshold": 8, "status": "ok" },
      { "name": "decisionFatigue", "value": 5, "threshold": 5, "status": "warning" }
    ],
    "recommendations": [
      "Consider delegating 2-3 lower-priority tasks",
      "Block focus time for pending decisions",
      "Review task prioritization framework"
    ],
    "analyzedAt": "2025-01-15T00:00:00Z"
  }
}
```

### POST /api/founder/memory/overload

Run fresh overload detection.

**Request Body:**
```json
{
  "workspaceId": "uuid"
}
```

---

## Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `401`: Unauthorized - invalid or missing token
- `400`: Bad Request - missing required parameters
- `404`: Not Found - resource doesn't exist
- `500`: Internal Server Error
