# 📊 Analytics & Reporting Agent

## Agent Overview

**Agent Name:** Analytics & Reporting Agent
**Agent ID:** `unite-hub.analytics-agent`
**Type:** Intelligence & Insights Agent
**Priority:** P1 (Core - Week 4)
**Status:** 🟡 Specification Complete - Implementation Pending
**Model:** `claude-sonnet-4-5-20250929` (standard analytics), `claude-opus-4-5-20251101` (predictive insights)

### Database Tables Used

This agent aggregates data from **15+ tables** across the platform:

**Campaign Tables:**
- `campaigns` - Email blast metrics
- `drip_campaigns` - Multi-step sequence metrics
- `campaign_steps` - Step-level performance
- `campaign_enrollments` - Enrollment status
- `campaign_execution_logs` - Event tracking

**Email Tables:**
- `sent_emails` - Email send history
- `email_opens` - Open tracking
- `email_clicks` - Click tracking
- `email_replies` - Reply tracking (future)

**Contact Tables:**
- `contacts` - Contact lifecycle data
- `interactions` - Engagement history
- `client_emails` - Inbound email analysis

**Content Tables:**
- `generated_content` - Content performance
- `calendar_posts` - Social media performance
- `content_performance` - Cross-channel metrics (to be created)

**Financial Tables:**
- `subscriptions` - Revenue data
- `invoices` - Payment tracking

---

## Purpose & Scope

### Responsibilities

The Analytics Agent is the **data intelligence engine** for Unite-Hub, providing:

#### 1. Campaign Performance Analytics
- **Email campaign metrics** - Sent, delivered, opened, clicked, replied, bounced
- **Drip campaign funnel analysis** - Step-by-step conversion rates
- **A/B test results** - Statistical significance testing
- **Campaign ROI** - Revenue attribution per campaign
- **Best-performing campaigns** - Top 10 by open rate, click rate, conversion
- **Worst-performing campaigns** - Bottom 10 for optimization

#### 2. Contact Lifecycle Analytics
- **Contact acquisition** - New contacts by source, channel, time period
- **Contact conversion funnel** - Prospect → Lead → Customer progression
- **Contact engagement scoring** - Distribution by score (cold, warm, hot)
- **Churn analysis** - Inactive contacts, churn risk prediction
- **Lifetime value (LTV)** - Average revenue per contact
- **Contact segmentation** - By industry, company size, job title

#### 3. Email Performance Analytics
- **Deliverability metrics** - Delivery rate, bounce rate, spam complaints
- **Engagement metrics** - Open rate, click rate, reply rate
- **Time-based analysis** - Best send times, day-of-week performance
- **Subject line performance** - Best-performing subject line patterns
- **Content performance** - Which content types drive most engagement
- **Provider performance** - SendGrid vs. Resend vs. SMTP comparison

#### 4. Content Performance Analytics
- **Generated content effectiveness** - Which AI-generated content converts best
- **Email sequence performance** - Drip campaign step analysis
- **Social media analytics** - Engagement by platform (LinkedIn, Twitter, etc.)
- **Content type ROI** - Follow-ups vs. proposals vs. case studies
- **Tone analysis** - Formal vs. casual vs. technical performance

#### 5. Revenue & ROI Analytics
- **Campaign revenue attribution** - Which campaigns drive revenue
- **Marketing-qualified leads (MQL)** - Contacts scoring 70+
- **Sales-qualified leads (SQL)** - Contacts ready for sales
- **Conversion rates** - MQL → SQL → Customer percentages
- **Customer acquisition cost (CAC)** - Total marketing spend / new customers
- **Return on investment (ROI)** - Revenue / marketing spend

#### 6. Predictive Analytics (AI-Powered)
- **Contact churn prediction** - Likelihood of contacts going cold
- **Optimal send time prediction** - Best time to email each contact
- **Campaign success prediction** - Forecast campaign performance before sending
- **Revenue forecasting** - Predict revenue for next 30/60/90 days
- **Next best action** - AI recommendations for each contact

---

## Database Schema Mapping

### TypeScript Interfaces

```typescript
// ===== CAMPAIGN METRICS (Aggregated View) =====
interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  campaign_type: 'blast' | 'drip';

  // Enrollment metrics
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  unsubscribed_enrollments: number;

  // Email metrics
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;

  // Conversion rates (%)
  delivery_rate: number; // delivered / sent
  open_rate: number; // opened / delivered
  click_rate: number; // clicked / delivered
  click_to_open_rate: number; // clicked / opened
  reply_rate: number; // replied / delivered
  conversion_rate: number; // completed / enrolled

  // Revenue (if tracked)
  attributed_revenue?: number;
  revenue_per_contact?: number;

  // Time periods
  start_date: string; // ISO timestamp
  end_date?: string; // ISO timestamp
  avg_completion_time_hours?: number;
}

// ===== EMAIL PERFORMANCE METRICS =====
interface EmailPerformanceMetrics {
  workspace_id: string;
  time_period: {
    start: string; // ISO timestamp
    end: string; // ISO timestamp
  };

  // Sending metrics
  emails_sent: number;
  emails_delivered: number;
  emails_bounced: number;
  hard_bounces: number;
  soft_bounces: number;

  // Engagement metrics
  emails_opened: number;
  unique_opens: number;
  emails_clicked: number;
  unique_clicks: number;
  emails_replied: number;

  // Rates
  delivery_rate: number; // %
  bounce_rate: number; // %
  open_rate: number; // %
  click_rate: number; // %
  reply_rate: number; // %

  // Provider breakdown
  provider_stats: {
    sendgrid: { sent: number; delivered: number; bounced: number };
    resend: { sent: number; delivered: number; bounced: number };
    smtp: { sent: number; delivered: number; bounced: number };
  };

  // Time-based insights
  best_send_time: {
    hour: number; // 0-23 (e.g., 9 for 9 AM)
    day_of_week: number; // 0-6 (0 = Sunday)
    avg_open_rate: number;
  };
}

// ===== CONTACT LIFECYCLE METRICS =====
interface ContactLifecycleMetrics {
  workspace_id: string;
  time_period: {
    start: string;
    end: string;
  };

  // Contact counts by status
  total_contacts: number;
  prospects: number;
  leads: number;
  customers: number;
  contacts: number; // Generic status

  // New contacts
  new_contacts: number;
  new_contacts_by_source: {
    [source: string]: number; // e.g., { "website": 45, "referral": 23 }
  };

  // Conversion funnel
  prospect_to_lead_rate: number; // %
  lead_to_customer_rate: number; // %
  overall_conversion_rate: number; // %

  // Engagement distribution
  cold_contacts: number; // Score 0-39
  warm_contacts: number; // Score 40-69
  hot_contacts: number; // Score 70-100
  avg_contact_score: number;

  // Churn analysis
  inactive_contacts: number; // No interaction in 90+ days
  churn_risk_contacts: number; // Predicted to churn
}

// ===== CONTENT PERFORMANCE METRICS =====
interface ContentPerformanceMetrics {
  workspace_id: string;
  time_period: {
    start: string;
    end: string;
  };

  // Content generation
  total_generated: number;
  generated_by_type: {
    followup: number;
    proposal: number;
    case_study: number;
    cold_outreach: number;
    [key: string]: number;
  };

  // Content effectiveness
  content_sent: number;
  content_opened: number;
  content_clicked: number;
  content_replied: number;

  // Performance by type
  best_performing_type: {
    type: string;
    open_rate: number;
    click_rate: number;
  };

  // AI metrics
  avg_thinking_tokens: number;
  avg_generation_cost_usd: number;
  total_generation_cost_usd: number;

  // Quality scores
  avg_readability_score: number;
  avg_sentiment_score: number;
}

// ===== REVENUE & ROI METRICS =====
interface RevenueMetrics {
  workspace_id: string;
  time_period: {
    start: string;
    end: string;
  };

  // Revenue
  total_revenue: number; // USD
  recurring_revenue: number; // MRR
  one_time_revenue: number;

  // Customer metrics
  new_customers: number;
  churned_customers: number;
  net_new_customers: number;
  total_active_customers: number;

  // Marketing metrics
  marketing_spend: number; // USD (email costs + AI generation costs)
  customer_acquisition_cost: number; // CAC = spend / new customers
  lifetime_value: number; // LTV (avg revenue per customer × avg lifetime)
  ltv_to_cac_ratio: number; // Should be > 3.0

  // ROI
  roi_percentage: number; // (revenue - spend) / spend × 100

  // Attribution
  revenue_by_campaign: Array<{
    campaign_id: string;
    campaign_name: string;
    attributed_revenue: number;
    roi_percentage: number;
  }>;
}

// ===== ANALYTICS QUERY REQUEST (Input Type) =====
interface AnalyticsQueryRequest {
  workspace_id: string; // REQUIRED
  metric_type:
    | 'campaign_performance'
    | 'email_performance'
    | 'contact_lifecycle'
    | 'content_performance'
    | 'revenue_roi'
    | 'predictive_insights';

  // Time period
  time_period: {
    start: string; // ISO timestamp
    end: string; // ISO timestamp
    granularity?: 'hour' | 'day' | 'week' | 'month'; // For time-series data
  };

  // Filters
  filters?: {
    campaign_ids?: string[];
    contact_ids?: string[];
    content_types?: string[];
    industries?: string[];
    sources?: string[];
  };

  // Comparison (optional)
  compare_to_previous_period?: boolean; // Compare to previous time range
}

// ===== ANALYTICS QUERY RESULT (Output Type) =====
interface AnalyticsQueryResult {
  success: boolean;
  metric_type: string;
  data: any; // CampaignMetrics | EmailPerformanceMetrics | etc.

  // Time-series data (if granularity specified)
  time_series?: Array<{
    timestamp: string;
    value: number;
  }>;

  // Comparison data (if enabled)
  comparison?: {
    previous_period: any;
    change_percentage: number;
    trend: 'up' | 'down' | 'stable';
  };

  // Insights (AI-generated)
  insights: string[]; // Human-readable insights
  recommendations: string[]; // Actionable recommendations

  // Metadata
  generated_at: string; // ISO timestamp
  cache_hit: boolean; // Was this cached?
  query_time_ms: number;
}

// ===== PREDICTIVE INSIGHTS (AI-Powered) =====
interface PredictiveInsights {
  workspace_id: string;
  generated_at: string;

  // Contact churn prediction
  churn_predictions: Array<{
    contact_id: string;
    contact_name: string;
    churn_probability: number; // 0.0-1.0
    churn_risk: 'low' | 'medium' | 'high';
    reasons: string[];
    recommended_actions: string[];
  }>;

  // Revenue forecast
  revenue_forecast: {
    next_30_days: number; // Predicted revenue (USD)
    next_60_days: number;
    next_90_days: number;
    confidence: number; // 0.0-1.0
    trend: 'increasing' | 'decreasing' | 'stable';
  };

  // Campaign success prediction
  campaign_predictions: Array<{
    campaign_id: string;
    campaign_name: string;
    predicted_open_rate: number; // %
    predicted_click_rate: number; // %
    predicted_conversion_rate: number; // %
    confidence: number; // 0.0-1.0
    comparison_to_avg: string; // "20% above average"
  }>;

  // Next best actions
  next_best_actions: Array<{
    contact_id: string;
    contact_name: string;
    recommended_action: 'send_email' | 'schedule_call' | 'send_proposal' | 'nurture' | 'pause';
    reason: string;
    expected_outcome: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}
```

---

## Core Functions

### 1. Get Campaign Performance Metrics

**Function:** `getCampaignMetrics(campaign_id: string, workspace_id: string): Promise<CampaignMetrics>`

**Purpose:** Comprehensive campaign analytics

**Input:**
```typescript
{
  campaign_id: "uuid",
  workspace_id: "uuid"
}
```

**Output:**
```typescript
{
  campaign_id: "uuid",
  campaign_name: "Product Launch Sequence",
  campaign_type: "drip",
  total_enrollments: 342,
  active_enrollments: 89,
  completed_enrollments: 245,
  total_sent: 1710, // 342 contacts × 5 steps
  total_delivered: 1692,
  total_opened: 1184,
  total_clicked: 487,
  delivery_rate: 98.9,
  open_rate: 70.0,
  click_rate: 28.8,
  click_to_open_rate: 41.1,
  conversion_rate: 71.6,
  avg_completion_time_hours: 168, // 7 days
  start_date: "2025-11-01T00:00:00Z"
}
```

**SQL Query:**
```sql
-- Aggregated metrics query
SELECT
  dc.id AS campaign_id,
  dc.name AS campaign_name,
  'drip' AS campaign_type,

  -- Enrollment metrics
  COUNT(DISTINCT ce.id) AS total_enrollments,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.status = 'active') AS active_enrollments,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.status = 'completed') AS completed_enrollments,

  -- Email metrics (from execution logs)
  COUNT(*) FILTER (WHERE cel.action = 'email_sent' AND cel.status = 'success') AS total_sent,
  COUNT(*) FILTER (WHERE cel.action = 'email_sent' AND cel.status = 'success')
    - COUNT(*) FILTER (WHERE cel.action = 'email_bounced') AS total_delivered,
  COUNT(*) FILTER (WHERE cel.action = 'email_opened') AS total_opened,
  COUNT(*) FILTER (WHERE cel.action = 'email_clicked') AS total_clicked,

  -- Calculated rates
  ROUND(
    (COUNT(*) FILTER (WHERE cel.action = 'email_sent') -
     COUNT(*) FILTER (WHERE cel.action = 'email_bounced'))::numeric /
    NULLIF(COUNT(*) FILTER (WHERE cel.action = 'email_sent'), 0) * 100,
    2
  ) AS delivery_rate,

  ROUND(
    COUNT(*) FILTER (WHERE cel.action = 'email_opened')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE cel.action = 'email_sent') -
           COUNT(*) FILTER (WHERE cel.action = 'email_bounced'), 0) * 100,
    2
  ) AS open_rate,

  ROUND(
    AVG(EXTRACT(EPOCH FROM (ce.completed_at - ce.started_at)) / 3600)
    FILTER (WHERE ce.status = 'completed'),
    2
  ) AS avg_completion_time_hours

FROM drip_campaigns dc
LEFT JOIN campaign_enrollments ce ON ce.campaign_id = dc.id
LEFT JOIN campaign_execution_logs cel ON cel.enrollment_id = ce.id
WHERE dc.id = $1 AND dc.workspace_id = $2
GROUP BY dc.id, dc.name;
```

---

### 2. Get Email Performance Analytics

**Function:** `getEmailPerformance(workspace_id: string, time_period: TimePeriod): Promise<EmailPerformanceMetrics>`

**Purpose:** Overall email deliverability and engagement metrics

**Input:**
```typescript
{
  workspace_id: "uuid",
  time_period: {
    start: "2025-11-01T00:00:00Z",
    end: "2025-11-30T23:59:59Z"
  }
}
```

**Output:**
```typescript
{
  workspace_id: "uuid",
  time_period: { start: "2025-11-01...", end: "2025-11-30..." },
  emails_sent: 5432,
  emails_delivered: 5321,
  emails_bounced: 111,
  hard_bounces: 45,
  soft_bounces: 66,
  emails_opened: 3724,
  unique_opens: 2890,
  emails_clicked: 1256,
  unique_clicks: 987,
  delivery_rate: 97.96,
  bounce_rate: 2.04,
  open_rate: 69.99,
  click_rate: 23.61,
  provider_stats: {
    sendgrid: { sent: 4123, delivered: 4089, bounced: 34 },
    resend: { sent: 987, delivered: 965, bounced: 22 },
    smtp: { sent: 322, delivered: 267, bounced: 55 }
  },
  best_send_time: {
    hour: 9, // 9 AM
    day_of_week: 2, // Tuesday
    avg_open_rate: 78.5
  }
}
```

**SQL Queries:**
```sql
-- Email metrics by provider
SELECT
  provider,
  COUNT(*) AS sent,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'bounced') AS bounced
FROM sent_emails
WHERE workspace_id = $1
  AND sent_at >= $2
  AND sent_at <= $3
GROUP BY provider;

-- Best send time (by hour and day of week)
SELECT
  EXTRACT(HOUR FROM sent_at) AS send_hour,
  EXTRACT(DOW FROM sent_at) AS day_of_week,
  COUNT(*) AS sent,
  COUNT(*) FILTER (WHERE opens > 0) AS opened,
  ROUND(
    COUNT(*) FILTER (WHERE opens > 0)::numeric / COUNT(*) * 100,
    2
  ) AS open_rate
FROM sent_emails
WHERE workspace_id = $1
  AND sent_at >= $2
  AND sent_at <= $3
  AND status = 'delivered'
GROUP BY send_hour, day_of_week
ORDER BY open_rate DESC
LIMIT 1;
```

---

### 3. Get Contact Lifecycle Analytics

**Function:** `getContactLifecycle(workspace_id: string, time_period: TimePeriod): Promise<ContactLifecycleMetrics>`

**Purpose:** Contact acquisition, conversion funnel, engagement distribution

**Input:**
```typescript
{
  workspace_id: "uuid",
  time_period: {
    start: "2025-11-01T00:00:00Z",
    end: "2025-11-30T23:59:59Z"
  }
}
```

**Output:**
```typescript
{
  workspace_id: "uuid",
  total_contacts: 1245,
  prospects: 687,
  leads: 342,
  customers: 198,
  contacts: 18,
  new_contacts: 156,
  new_contacts_by_source: {
    "website": 78,
    "referral": 45,
    "trade_show": 23,
    "cold_outreach": 10
  },
  prospect_to_lead_rate: 49.8,
  lead_to_customer_rate: 57.9,
  overall_conversion_rate: 28.8,
  cold_contacts: 456, // 0-39 score
  warm_contacts: 512, // 40-69 score
  hot_contacts: 277, // 70-100 score
  avg_contact_score: 52.3,
  inactive_contacts: 189,
  churn_risk_contacts: 67
}
```

**SQL Queries:**
```sql
-- Contact status distribution
SELECT
  status,
  COUNT(*) AS count
FROM contacts
WHERE workspace_id = $1
GROUP BY status;

-- New contacts by source
SELECT
  source,
  COUNT(*) AS count
FROM contacts
WHERE workspace_id = $1
  AND created_at >= $2
  AND created_at <= $3
GROUP BY source
ORDER BY count DESC;

-- Engagement score distribution
SELECT
  CASE
    WHEN ai_score < 0.40 THEN 'cold'
    WHEN ai_score < 0.70 THEN 'warm'
    ELSE 'hot'
  END AS score_bucket,
  COUNT(*) AS count
FROM contacts
WHERE workspace_id = $1
GROUP BY score_bucket;

-- Conversion funnel
WITH funnel AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'prospect') AS prospects,
    COUNT(*) FILTER (WHERE status = 'lead') AS leads,
    COUNT(*) FILTER (WHERE status = 'customer') AS customers
  FROM contacts
  WHERE workspace_id = $1
)
SELECT
  prospects,
  leads,
  customers,
  ROUND(leads::numeric / NULLIF(prospects, 0) * 100, 2) AS prospect_to_lead_rate,
  ROUND(customers::numeric / NULLIF(leads, 0) * 100, 2) AS lead_to_customer_rate
FROM funnel;
```

---

### 4. Get Content Performance Analytics

**Function:** `getContentPerformance(workspace_id: string, time_period: TimePeriod): Promise<ContentPerformanceMetrics>`

**Purpose:** AI-generated content effectiveness analysis

**Input:**
```typescript
{
  workspace_id: "uuid",
  time_period: {
    start: "2025-11-01T00:00:00Z",
    end: "2025-11-30T23:59:59Z"
  }
}
```

**Output:**
```typescript
{
  workspace_id: "uuid",
  total_generated: 342,
  generated_by_type: {
    "followup": 187,
    "proposal": 89,
    "case_study": 45,
    "cold_outreach": 21
  },
  content_sent: 298,
  content_opened: 223,
  content_clicked: 98,
  best_performing_type: {
    type: "proposal",
    open_rate: 82.4,
    click_rate: 41.2
  },
  avg_thinking_tokens: 6842,
  avg_generation_cost_usd: 0.09,
  total_generation_cost_usd: 30.78,
  avg_readability_score: 67.5,
  avg_sentiment_score: 0.78
}
```

---

### 5. Get Revenue & ROI Metrics

**Function:** `getRevenueMetrics(workspace_id: string, time_period: TimePeriod): Promise<RevenueMetrics>`

**Purpose:** Marketing attribution and ROI calculation

**Input:**
```typescript
{
  workspace_id: "uuid",
  time_period: {
    start: "2025-11-01T00:00:00Z",
    end: "2025-11-30T23:59:59Z"
  }
}
```

**Output:**
```typescript
{
  workspace_id: "uuid",
  total_revenue: 125000,
  recurring_revenue: 98000, // MRR
  one_time_revenue: 27000,
  new_customers: 18,
  churned_customers: 3,
  net_new_customers: 15,
  total_active_customers: 198,
  marketing_spend: 4250, // Email costs + AI generation
  customer_acquisition_cost: 236.11, // $4250 / 18
  lifetime_value: 15625, // Avg revenue × avg lifetime
  ltv_to_cac_ratio: 66.2, // Excellent (> 3.0)
  roi_percentage: 2841.2, // Phenomenal ROI
  revenue_by_campaign: [
    {
      campaign_id: "uuid1",
      campaign_name: "Product Launch Sequence",
      attributed_revenue: 67500,
      roi_percentage: 5940.0
    },
    {
      campaign_id: "uuid2",
      campaign_name: "Re-engagement Campaign",
      attributed_revenue: 32000,
      roi_percentage: 2400.0
    }
  ]
}
```

---

### 6. Generate Predictive Insights (AI-Powered)

**Function:** `generatePredictiveInsights(workspace_id: string): Promise<PredictiveInsights>`

**Purpose:** AI-powered predictions and recommendations using Claude Opus

**Input:**
```typescript
{
  workspace_id: "uuid"
}
```

**Output:**
```typescript
{
  workspace_id: "uuid",
  generated_at: "2025-11-18T10:00:00Z",

  churn_predictions: [
    {
      contact_id: "uuid1",
      contact_name: "John Smith",
      churn_probability: 0.78,
      churn_risk: "high",
      reasons: [
        "No interaction in 67 days",
        "Last 3 emails unopened",
        "Engagement score dropped 30 points in 90 days"
      ],
      recommended_actions: [
        "Send personalized re-engagement email",
        "Offer exclusive discount (15-20%)",
        "Schedule check-in call within 7 days"
      ]
    }
  ],

  revenue_forecast: {
    next_30_days: 135000,
    next_60_days: 287000,
    next_90_days: 445000,
    confidence: 0.82,
    trend: "increasing"
  },

  campaign_predictions: [
    {
      campaign_id: "uuid",
      campaign_name: "Black Friday Promotion",
      predicted_open_rate: 68.5,
      predicted_click_rate: 29.3,
      predicted_conversion_rate: 12.7,
      confidence: 0.76,
      comparison_to_avg: "18% above average"
    }
  ],

  next_best_actions: [
    {
      contact_id: "uuid2",
      contact_name: "Jane Doe",
      recommended_action: "send_proposal",
      reason: "Opened all 5 emails, clicked pricing link 3 times, AI score: 87",
      expected_outcome: "65% probability of conversion within 14 days",
      priority: "high"
    }
  ]
}
```

**Implementation (Extended Thinking):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

async function generatePredictiveInsights(
  workspace_id: string
): Promise<PredictiveInsights> {
  // 1. Gather historical data
  const contacts = await getContacts(workspace_id);
  const campaigns = await getCampaigns(workspace_id);
  const interactions = await getInteractions(workspace_id);
  const revenue = await getRevenueHistory(workspace_id);

  // 2. Build comprehensive context for AI
  const systemPrompt = `You are a predictive analytics AI for Unite-Hub, a marketing CRM platform.

**Your Task:** Analyze historical data and generate predictions for:
1. Contact churn risk (who is likely to go cold?)
2. Revenue forecast (next 30/60/90 days)
3. Campaign success predictions (expected performance)
4. Next best actions (recommended actions per contact)

**Context:**
- Total contacts: ${contacts.length}
- Active campaigns: ${campaigns.filter(c => c.status === 'active').length}
- Last 90 days revenue: $${revenue.last_90_days}

**Historical Performance Averages:**
- Average open rate: 68.5%
- Average click rate: 27.3%
- Average conversion rate: 11.2%
- Average customer lifetime: 18 months

**Output Format:**
Return JSON object with:
- churn_predictions (array)
- revenue_forecast (object)
- campaign_predictions (array)
- next_best_actions (array)
`;

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // 3. Call Claude Opus for predictions
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this data and generate predictive insights:\n\n${JSON.stringify({ contacts, campaigns, interactions }, null, 2)}`,
      },
    ],
  });

  // 4. Parse AI response
  const textBlock = message.content.find((block) => block.type === 'text');
  const insights = JSON.parse(textBlock?.text || '{}');

  return {
    workspace_id,
    generated_at: new Date().toISOString(),
    ...insights,
  };
}
```

---

## API Endpoints

### 1. Get Campaign Metrics

**Endpoint:** `GET /api/analytics/campaigns/:campaign_id`

**Query Params:**
```
?workspaceId=uuid
```

**Response (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "campaign_id": "uuid",
    "open_rate": 70.0,
    "click_rate": 28.8,
    ...
  }
}
```

---

### 2. Get Email Performance

**Endpoint:** `GET /api/analytics/email-performance`

**Query Params:**
```
?workspaceId=uuid
&start=2025-11-01T00:00:00Z
&end=2025-11-30T23:59:59Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "delivery_rate": 97.96,
    "open_rate": 69.99,
    ...
  }
}
```

---

### 3. Get Contact Lifecycle

**Endpoint:** `GET /api/analytics/contact-lifecycle`

**Response (200 OK):**
```json
{
  "success": true,
  "metrics": {
    "total_contacts": 1245,
    "conversion_rate": 28.8,
    ...
  }
}
```

---

### 4. Get Predictive Insights

**Endpoint:** `GET /api/analytics/predictive-insights`

**Response (200 OK):**
```json
{
  "success": true,
  "insights": {
    "churn_predictions": [...],
    "revenue_forecast": {...},
    "next_best_actions": [...]
  }
}
```

---

## Integration Points

### Inputs
- **Campaign Agent:** Campaign metrics data
- **Email Agent:** Email performance data
- **Contact Agent:** Contact lifecycle data
- **Content Agent:** Content effectiveness data

### Outputs
- **Dashboard UI:** Real-time analytics charts
- **Report Generation:** Scheduled reports (daily/weekly/monthly)
- **Alerts:** Performance threshold alerts

---

## Performance Requirements

| Operation | Target | Max |
|-----------|--------|-----|
| Get campaign metrics | < 500ms | 1.5s |
| Get email performance | < 300ms | 1s |
| Generate predictive insights | < 5s | 10s |

---

## Error Codes

| Code | Error | Status |
|------|-------|--------|
| `ANALYTICS_001` | Missing workspace_id | 400 |
| `ANALYTICS_002` | Invalid time period | 400 |
| `ANALYTICS_003` | Campaign not found | 404 |
| `ANALYTICS_004` | Insufficient data | 400 |

---

## Future Enhancements

### Phase 2
- Cohort analysis
- Attribution modeling (first-touch, last-touch, multi-touch)
- Advanced segmentation (RFM analysis)

### Phase 3
- Custom dashboards
- Automated insights (daily AI summary emails)
- Competitive benchmarking

---

**Status:** ✅ Specification Complete
**Implementation:** 2-3 weeks
**Dependencies:** Campaign Agent, Email Agent, Contact Agent, Content Agent

---

**Version:** 1.0.0
**Last Updated:** 2025-11-18
**Author:** Claude (Sonnet 4.5)
