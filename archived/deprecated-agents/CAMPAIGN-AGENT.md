# 📧 Campaign Management Agent

## Agent Overview

**Agent Name:** Campaign Management Agent
**Agent ID:** `unite-hub.campaign-agent`
**Type:** Specialized Marketing Automation Agent
**Priority:** P1 (Core - Week 3)
**Status:** 🟡 Specification Complete - Implementation Pending
**Model:** `claude-sonnet-4-5-20250929` (standard operations), `claude-opus-4-5-20251101` (complex analytics)

### Database Tables Used

This agent manages 6 core campaign automation tables:

1. **`campaigns`** - Simple email blast campaigns (legacy)
2. **`drip_campaigns`** - Multi-step automated sequences
3. **`campaign_steps`** - Individual steps within drip campaigns
4. **`campaign_enrollments`** - Contact enrollment tracking
5. **`campaign_execution_logs`** - Step-by-step execution history
6. **`email_variants`** - A/B testing variants (external table)

### Related Tables (Read-Only Access)

- **`contacts`** - Contact data for enrollment
- **`sent_emails`** - Email sending service integration
- **`email_opens`** - Open tracking metrics
- **`email_clicks`** - Click tracking metrics
- **`email_replies`** - Reply tracking metrics

---

## Purpose & Scope

### Responsibilities

The Campaign Agent is responsible for **all marketing automation workflows** in Unite-Hub:

#### 1. Campaign Creation & Management
- Create, update, and delete campaigns (both simple and drip)
- Campaign status management (draft → active → paused → completed)
- Campaign cloning and templating
- Campaign archival and cleanup

#### 2. Multi-Step Automation
- Build sequential drip campaigns with time delays
- Conditional branching (if contact opened email → path A, else → path B)
- Step types: email, wait, tag update, score update, webhook
- A/B testing via email variants

#### 3. Contact Enrollment Management
- Manual enrollment (single or bulk)
- Automated enrollment triggers (form submission, tag added, score threshold)
- Re-enrollment rules and controls
- Enrollment pause, resume, and cancellation
- Unsubscribe handling

#### 4. Campaign Execution Engine
- Step-by-step execution with delay handling
- Scheduled execution (specific dates/times)
- Real-time execution tracking
- Retry logic for failed steps
- Circuit breaker for email service failures

#### 5. Performance Tracking & Analytics
- Campaign-level metrics (sent, opened, clicked, replied)
- Step-level performance analysis
- Enrollment conversion tracking
- A/B test result analysis
- Funnel analysis (drop-off detection)

#### 6. Integration Orchestration
- **Email Agent** → Send campaign emails
- **Contact Agent** → Enroll contacts, update scores
- **Analytics Agent** → Performance reporting
- **Workflow Agent** → Trigger-based automation

---

## Database Schema Mapping

### TypeScript Interfaces

```typescript
// ===== CAMPAIGNS TABLE (Legacy simple campaigns) =====
interface Campaign {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  sent_count: number; // Total emails sent
  opened_count: number; // Total opens
  clicked_count: number; // Total clicks
  replied_count: number; // Total replies
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== DRIP CAMPAIGNS TABLE (Advanced multi-step sequences) =====
interface DripCampaign {
  id: string; // UUID
  workspace_id: string; // UUID - REQUIRED for multi-tenancy
  name: string;
  description?: string;
  sequence_type: 'cold_outreach' | 'lead_nurture' | 'onboarding' | 're_engagement' | 'custom';
  goal?: string; // Campaign objective (e.g., "Book 10 demo calls")
  status: 'draft' | 'active' | 'paused' | 'archived';
  total_steps: number; // Auto-calculated from campaign_steps
  is_template: boolean; // True if this is a reusable template
  template_category?: string; // e.g., "Sales", "Marketing", "Customer Success"
  tags: string[]; // Array of tags for categorization
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    converted: number; // Reached goal
  };
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ===== CAMPAIGN STEPS TABLE (Individual automation steps) =====
interface CampaignStep {
  id: string; // UUID
  campaign_id: string; // UUID - References drip_campaigns.id
  step_number: number; // Sequential order (1, 2, 3, ...)
  step_name: string; // Human-readable name
  day_delay: number; // Days to wait after previous step (0 = immediate)
  subject_line: string; // Email subject
  preheader_text?: string; // Email preheader (preview text)
  email_body: string; // Plain text version
  email_body_html?: string; // HTML version
  cta: {
    text: string; // e.g., "Book a Demo"
    url?: string; // Call-to-action link
    type: 'button' | 'link' | 'none';
  };
  ai_generated: boolean; // True if content was AI-generated
  ai_reasoning?: string; // Claude's reasoning for content choices
  personalization_tags: string[]; // Available merge tags (e.g., ["{{first_name}}", "{{company}}"])
  alternatives: Array<{
    variant_id: string; // References email_variants.id
    subject_line: string;
    email_body: string;
    weight: number; // A/B test traffic split (0-100)
  }>;
  conditional_logic?: {
    condition: 'opened' | 'clicked' | 'replied' | 'score_above' | 'tag_has';
    value?: string | number;
    true_path: number; // Step number to go to if true
    false_path: number; // Step number to go to if false
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
  };
  created_at: string;
  updated_at: string;
}

// ===== CAMPAIGN ENROLLMENTS TABLE (Contact enrollment tracking) =====
interface CampaignEnrollment {
  id: string; // UUID
  campaign_id: string; // UUID - References drip_campaigns.id
  contact_id: string; // UUID - References contacts.id
  contact_email: string; // Denormalized for quick access
  contact_name?: string; // Denormalized for quick access
  current_step: number; // Current step number (0 = not started)
  status: 'active' | 'paused' | 'completed' | 'unsubscribed' | 'bounced';
  started_at: string; // ISO timestamp - When enrollment began
  last_email_sent_at?: string; // ISO timestamp - Last step execution
  next_email_scheduled_at?: string; // ISO timestamp - When next step should execute
  completed_at?: string; // ISO timestamp - When campaign completed
  interaction_history: Array<{
    step_number: number;
    action: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  personalization_data?: Record<string, string>; // Contact-specific merge tag values
  created_at: string;
  updated_at: string;
}

// ===== CAMPAIGN EXECUTION LOGS TABLE (Audit trail) =====
interface CampaignExecutionLog {
  id: string; // UUID
  campaign_id: string; // UUID - References drip_campaigns.id
  enrollment_id: string; // UUID - References campaign_enrollments.id
  step_id: string; // UUID - References campaign_steps.id
  contact_id: string; // UUID - References contacts.id
  action: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied' |
          'email_bounced' | 'unsubscribed' | 'paused' | 'resumed' | 'completed';
  status: 'success' | 'failed' | 'pending';
  error_message?: string; // If status = 'failed'
  metadata: {
    email_id?: string; // References sent_emails.id
    variant_id?: string; // If A/B test
    ip_address?: string; // For opens/clicks
    user_agent?: string; // For opens/clicks
    retry_count?: number; // Number of retries
    [key: string]: unknown;
  };
  created_at: string; // ISO timestamp
}

// ===== CAMPAIGN METRICS (Aggregated Analytics) =====
interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_unsubscribed: number;
  open_rate: number; // Percentage (0-100)
  click_rate: number; // Percentage (0-100)
  reply_rate: number; // Percentage (0-100)
  conversion_rate: number; // Percentage (0-100)
  avg_time_to_complete: number; // Hours
  step_performance: Array<{
    step_number: number;
    step_name: string;
    sent: number;
    opened: number;
    clicked: number;
    open_rate: number;
    click_rate: number;
  }>;
}
```

---

## Core Functions

### 1. Create Drip Campaign

**Function:** `createDripCampaign(data: DripCampaignInput): Promise<DripCampaign>`

**Purpose:** Create a new multi-step drip campaign

**Input:**
```typescript
interface DripCampaignInput {
  workspace_id: string; // REQUIRED
  name: string;
  description?: string;
  sequence_type: 'cold_outreach' | 'lead_nurture' | 'onboarding' | 're_engagement' | 'custom';
  goal?: string;
  is_template?: boolean;
  template_category?: string;
  tags?: string[];
}
```

**Output:**
```typescript
{
  success: true,
  campaign: DripCampaign,
  message: "Drip campaign created successfully"
}
```

**Business Rules:**
- Campaign name must be unique per workspace
- Status defaults to 'draft'
- total_steps starts at 0 (incremented when steps are added)
- Metrics initialize to all zeros

**SQL Example:**
```sql
INSERT INTO drip_campaigns (
  workspace_id, name, description, sequence_type, goal,
  status, is_template, template_category, tags
) VALUES (
  $1, $2, $3, $4, $5, 'draft', $6, $7, $8
) RETURNING *;
```

**Error Codes:**
- `CAMPAIGN_001` - Invalid workspace_id
- `CAMPAIGN_002` - Duplicate campaign name in workspace
- `CAMPAIGN_003` - Invalid sequence_type

---

### 2. Add Campaign Step

**Function:** `addCampaignStep(campaign_id: string, step: CampaignStepInput): Promise<CampaignStep>`

**Purpose:** Add a new step to a drip campaign

**Input:**
```typescript
interface CampaignStepInput {
  campaign_id: string;
  step_name: string;
  day_delay: number; // 0-365 days
  subject_line: string;
  preheader_text?: string;
  email_body: string;
  email_body_html?: string;
  cta?: {
    text: string;
    url?: string;
    type: 'button' | 'link' | 'none';
  };
  conditional_logic?: ConditionalLogic;
  alternatives?: EmailVariant[]; // For A/B testing
}
```

**Output:**
```typescript
{
  success: true,
  step: CampaignStep,
  step_number: number, // Auto-assigned sequential number
  message: "Campaign step added successfully"
}
```

**Business Rules:**
- Steps are auto-numbered sequentially (1, 2, 3, ...)
- day_delay is cumulative from campaign start (not from previous step)
- Subject line max 100 characters (Australian spam law compliance)
- Email body must include unsubscribe link placeholder: `{{unsubscribe_url}}`
- CTA URL must be absolute (https://)
- A/B test weights must sum to 100

**SQL Example:**
```sql
-- Get next step number
SELECT COALESCE(MAX(step_number), 0) + 1 AS next_step
FROM campaign_steps WHERE campaign_id = $1;

-- Insert step
INSERT INTO campaign_steps (
  campaign_id, step_number, step_name, day_delay,
  subject_line, email_body, cta
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- Update total_steps count
UPDATE drip_campaigns
SET total_steps = total_steps + 1, updated_at = NOW()
WHERE id = $1;
```

**Error Codes:**
- `CAMPAIGN_004` - Campaign not found
- `CAMPAIGN_005` - Campaign is not in 'draft' status (can't modify active campaigns)
- `CAMPAIGN_006` - Invalid day_delay (negative or > 365)
- `CAMPAIGN_007` - Missing unsubscribe link placeholder
- `CAMPAIGN_008` - A/B test weights don't sum to 100

---

### 3. Enroll Contacts in Campaign

**Function:** `enrollContacts(campaign_id: string, contact_ids: string[], options?: EnrollmentOptions): Promise<EnrollmentResult>`

**Purpose:** Enroll one or more contacts into a drip campaign

**Input:**
```typescript
interface EnrollmentOptions {
  start_immediately?: boolean; // Default: false (wait for scheduler)
  skip_if_already_enrolled?: boolean; // Default: true
  personalization_data?: Record<string, Record<string, string>>; // contact_id → merge tag values
  scheduled_start?: string; // ISO timestamp to delay start
}
```

**Output:**
```typescript
{
  success: true,
  enrolled: number, // Count of successfully enrolled contacts
  skipped: number, // Count of already-enrolled contacts
  failed: number, // Count of failed enrollments
  enrollments: CampaignEnrollment[],
  errors: Array<{
    contact_id: string;
    error: string;
  }>
}
```

**Business Rules:**
- Cannot enroll contacts in 'draft' or 'archived' campaigns
- Cannot re-enroll contacts already in the campaign (unless skip_if_already_enrolled = false)
- Contacts must exist in the same workspace
- Contacts with status 'unsubscribed' cannot be enrolled
- next_email_scheduled_at calculated based on first step's day_delay + start time
- Enrollment triggers audit log entry

**SQL Example:**
```sql
-- Validate campaign status
SELECT status FROM drip_campaigns WHERE id = $1 AND workspace_id = $2;

-- Check for existing enrollments
SELECT contact_id FROM campaign_enrollments
WHERE campaign_id = $1 AND contact_id = ANY($2) AND status != 'completed';

-- Bulk insert enrollments
INSERT INTO campaign_enrollments (
  campaign_id, contact_id, contact_email, contact_name,
  current_step, status, started_at, next_email_scheduled_at,
  personalization_data
)
SELECT
  $1, c.id, c.email, c.name, 0, 'active',
  COALESCE($3, NOW()), -- started_at
  COALESCE($3, NOW()) + INTERVAL '1 day' * (SELECT day_delay FROM campaign_steps WHERE campaign_id = $1 AND step_number = 1),
  $4::jsonb -- personalization_data
FROM contacts c
WHERE c.id = ANY($2) AND c.workspace_id = $5
RETURNING *;
```

**Error Codes:**
- `CAMPAIGN_009` - Campaign not active
- `CAMPAIGN_010` - Contact already enrolled
- `CAMPAIGN_011` - Contact not found in workspace
- `CAMPAIGN_012` - Contact is unsubscribed
- `CAMPAIGN_013` - Bulk enrollment exceeds limit (10,000 per batch)

---

### 4. Execute Campaign Step

**Function:** `executeStep(enrollment_id: string, step_id: string): Promise<ExecutionResult>`

**Purpose:** Execute a specific campaign step for an enrolled contact

**Input:**
```typescript
{
  enrollment_id: string; // UUID
  step_id: string; // UUID
  force?: boolean; // Skip schedule check (default: false)
}
```

**Output:**
```typescript
{
  success: true,
  action: 'email_sent' | 'step_skipped' | 'campaign_completed',
  email_id?: string; // References sent_emails.id
  next_step_scheduled_at?: string; // ISO timestamp
  execution_log_id: string; // References campaign_execution_logs.id
}
```

**Execution Logic:**

1. **Validate Enrollment:**
   - Enrollment must be 'active'
   - next_email_scheduled_at ≤ NOW() (unless force = true)

2. **Load Step Details:**
   - Get step content, subject, CTA
   - Apply personalization (merge tags)
   - Select A/B variant if applicable

3. **Check Conditional Logic:**
   - If step has conditional_logic, evaluate condition
   - Redirect to true_path or false_path step number
   - Skip current step if condition routes elsewhere

4. **Send Email via Email Agent:**
   - Call Email Agent's `sendCampaignEmail()` function
   - Pass: contact_email, subject, body, tracking params
   - Retry up to 3 times with exponential backoff

5. **Update Enrollment:**
   - Increment current_step
   - Update last_email_sent_at
   - Calculate next_email_scheduled_at (current time + next step's day_delay)
   - Add interaction to interaction_history
   - If last step → status = 'completed', completed_at = NOW()

6. **Log Execution:**
   - Insert row into campaign_execution_logs
   - action = 'email_sent', status = 'success'
   - metadata = { email_id, variant_id, retry_count }

7. **Update Campaign Metrics:**
   - Increment drip_campaigns.metrics.sent
   - Increment campaign_steps.metrics.sent

**SQL Example:**
```sql
-- Validate enrollment
SELECT e.*, c.email, c.name, s.*
FROM campaign_enrollments e
JOIN campaign_steps s ON s.campaign_id = e.campaign_id AND s.step_number = e.current_step + 1
JOIN contacts c ON c.id = e.contact_id
WHERE e.id = $1 AND e.status = 'active'
  AND (e.next_email_scheduled_at <= NOW() OR $2 = true);

-- Update enrollment after successful send
UPDATE campaign_enrollments
SET
  current_step = current_step + 1,
  last_email_sent_at = NOW(),
  next_email_scheduled_at = NOW() + INTERVAL '1 day' * (
    SELECT day_delay FROM campaign_steps
    WHERE campaign_id = $1 AND step_number = $2 + 1
  ),
  status = CASE
    WHEN $2 >= (SELECT total_steps FROM drip_campaigns WHERE id = $1)
    THEN 'completed'
    ELSE 'active'
  END,
  completed_at = CASE
    WHEN $2 >= (SELECT total_steps FROM drip_campaigns WHERE id = $1)
    THEN NOW()
    ELSE completed_at
  END,
  interaction_history = interaction_history || jsonb_build_array(
    jsonb_build_object(
      'step_number', $2,
      'action', 'sent',
      'timestamp', NOW(),
      'email_id', $3
    )
  ),
  updated_at = NOW()
WHERE id = $4;
```

**Error Codes:**
- `CAMPAIGN_014` - Enrollment not found or inactive
- `CAMPAIGN_015` - Step execution not scheduled yet
- `CAMPAIGN_016` - Email send failed after 3 retries
- `CAMPAIGN_017` - Invalid personalization data (missing required merge tags)

---

### 5. Track Campaign Metrics

**Function:** `trackMetrics(campaign_id: string): Promise<CampaignMetrics>`

**Purpose:** Calculate and return comprehensive campaign performance metrics

**Input:**
```typescript
{
  campaign_id: string;
  workspace_id: string; // For RLS validation
}
```

**Output:**
```typescript
{
  success: true,
  metrics: CampaignMetrics,
  generated_at: string // ISO timestamp
}
```

**Metrics Calculated:**

1. **Enrollment Metrics:**
   - Total enrollments (all time)
   - Active enrollments (status = 'active')
   - Completed enrollments (status = 'completed')
   - Unsubscribed count

2. **Email Metrics:**
   - Total sent (from execution logs)
   - Total delivered (sent - bounced)
   - Total opened (from email_opens table)
   - Total clicked (from email_clicks table)
   - Total replied (from email_replies table)

3. **Conversion Metrics:**
   - Open rate = (opened / delivered) * 100
   - Click rate = (clicked / delivered) * 100
   - Reply rate = (replied / delivered) * 100
   - Conversion rate = (completed / enrolled) * 100

4. **Step Performance:**
   - Per-step sent/opened/clicked counts
   - Per-step open/click rates
   - Step drop-off analysis (where contacts stop engaging)

5. **Time Metrics:**
   - Average time to complete campaign (hours)
   - Average time between steps (hours)
   - Fastest/slowest completion times

**SQL Example:**
```sql
-- Enrollment metrics
SELECT
  COUNT(*) AS total_enrollments,
  COUNT(*) FILTER (WHERE status = 'active') AS active,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'unsubscribed') AS unsubscribed
FROM campaign_enrollments WHERE campaign_id = $1;

-- Email metrics (join execution logs)
SELECT
  COUNT(*) FILTER (WHERE action = 'email_sent' AND status = 'success') AS total_sent,
  COUNT(*) FILTER (WHERE action = 'email_bounced') AS bounced,
  COUNT(*) FILTER (WHERE action = 'email_opened') AS opened,
  COUNT(*) FILTER (WHERE action = 'email_clicked') AS clicked,
  COUNT(*) FILTER (WHERE action = 'email_replied') AS replied
FROM campaign_execution_logs WHERE campaign_id = $1;

-- Step performance
SELECT
  s.step_number, s.step_name,
  COUNT(*) FILTER (WHERE el.action = 'email_sent') AS sent,
  COUNT(*) FILTER (WHERE el.action = 'email_opened') AS opened,
  COUNT(*) FILTER (WHERE el.action = 'email_clicked') AS clicked,
  ROUND((COUNT(*) FILTER (WHERE el.action = 'email_opened')::numeric /
         NULLIF(COUNT(*) FILTER (WHERE el.action = 'email_sent'), 0)) * 100, 2) AS open_rate,
  ROUND((COUNT(*) FILTER (WHERE el.action = 'email_clicked')::numeric /
         NULLIF(COUNT(*) FILTER (WHERE el.action = 'email_sent'), 0)) * 100, 2) AS click_rate
FROM campaign_steps s
LEFT JOIN campaign_execution_logs el ON el.step_id = s.id
WHERE s.campaign_id = $1
GROUP BY s.step_number, s.step_name
ORDER BY s.step_number;

-- Time metrics
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600) AS avg_hours_to_complete
FROM campaign_enrollments
WHERE campaign_id = $1 AND status = 'completed';
```

**Error Codes:**
- `CAMPAIGN_018` - Campaign not found
- `CAMPAIGN_019` - Insufficient data for metrics (no enrollments)

---

### 6. Process Scheduled Steps (Background Job)

**Function:** `processScheduledSteps(workspace_id?: string): Promise<ProcessingResult>`

**Purpose:** Background job to execute all due campaign steps (cron job, runs every 15 minutes)

**Input:**
```typescript
{
  workspace_id?: string; // Optional: process only one workspace
  limit?: number; // Max steps to process per run (default: 1000)
}
```

**Output:**
```typescript
{
  success: true,
  processed: number, // Steps successfully executed
  failed: number, // Steps that failed
  skipped: number, // Steps skipped (e.g., inactive enrollments)
  execution_time_ms: number,
  errors: Array<{
    enrollment_id: string;
    step_id: string;
    error: string;
  }>
}
```

**Processing Logic:**

1. **Query Due Steps:**
   ```sql
   SELECT e.*, s.*, c.email AS contact_email
   FROM campaign_enrollments e
   JOIN campaign_steps s ON s.campaign_id = e.campaign_id
     AND s.step_number = e.current_step + 1
   JOIN contacts c ON c.id = e.contact_id
   WHERE e.status = 'active'
     AND e.next_email_scheduled_at <= NOW()
     AND ($1::uuid IS NULL OR e.campaign_id IN (
       SELECT id FROM drip_campaigns WHERE workspace_id = $1
     ))
   ORDER BY e.next_email_scheduled_at ASC
   LIMIT $2;
   ```

2. **Process in Batches:**
   - Batch size: 100 steps at a time
   - Parallel execution: Up to 10 concurrent sends
   - Retry failed steps: 3 attempts with exponential backoff

3. **Circuit Breaker:**
   - If failure rate > 20% in batch → pause processing
   - Alert monitoring system
   - Log critical error

4. **Update Metrics:**
   - Increment campaign and step metrics
   - Update drip_campaigns.metrics JSONB

**Error Codes:**
- `CAMPAIGN_020` - Circuit breaker triggered (high failure rate)
- `CAMPAIGN_021` - Database connection timeout
- `CAMPAIGN_022` - Email service unavailable

---

### 7. Handle Email Events (Webhook Handler)

**Function:** `handleEmailEvent(event: EmailEvent): Promise<void>`

**Purpose:** Process incoming email events (opens, clicks, replies) from email service webhooks

**Input:**
```typescript
interface EmailEvent {
  event_type: 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
  email_id: string; // References sent_emails.id
  contact_email: string;
  timestamp: string; // ISO timestamp
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    link_url?: string; // For clicks
    reply_content?: string; // For replies
    bounce_reason?: string; // For bounces
  };
}
```

**Output:**
```typescript
{
  success: true,
  enrollment_updated: boolean,
  log_created: boolean
}
```

**Event Handling Logic:**

1. **Find Enrollment:**
   ```sql
   SELECT e.* FROM campaign_enrollments e
   JOIN campaign_execution_logs el ON el.enrollment_id = e.id
   WHERE el.metadata->>'email_id' = $1;
   ```

2. **Update Enrollment History:**
   ```sql
   UPDATE campaign_enrollments
   SET interaction_history = interaction_history || jsonb_build_array(
     jsonb_build_object(
       'step_number', current_step,
       'action', $1, -- event_type
       'timestamp', $2,
       'metadata', $3
     )
   )
   WHERE id = $4;
   ```

3. **Create Execution Log:**
   ```sql
   INSERT INTO campaign_execution_logs (
     campaign_id, enrollment_id, step_id, contact_id,
     action, status, metadata
   ) VALUES ($1, $2, $3, $4, $5, 'success', $6);
   ```

4. **Update Metrics:**
   - Increment drip_campaigns.metrics.opened/clicked/replied
   - Increment campaign_steps.metrics.opened/clicked

5. **Special Handling:**
   - **Unsubscribed:** Update enrollment.status = 'unsubscribed', stop future emails
   - **Bounced:** Update enrollment.status = 'bounced', investigate if high rate
   - **Replied:** Trigger notification to sales team (future enhancement)

**Error Codes:**
- `CAMPAIGN_023` - Event email_id not found
- `CAMPAIGN_024` - Duplicate event (already processed)

---

## API Endpoints

### 1. Create Drip Campaign

**Endpoint:** `POST /api/campaigns/drip`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "workspaceId": "uuid",
  "name": "Welcome Onboarding Sequence",
  "description": "5-email onboarding for new trial users",
  "sequence_type": "onboarding",
  "goal": "Activate 50% of trial users",
  "tags": ["onboarding", "trial", "automated"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "campaign": {
    "id": "uuid",
    "workspace_id": "uuid",
    "name": "Welcome Onboarding Sequence",
    "status": "draft",
    "total_steps": 0,
    "created_at": "2025-11-18T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "CAMPAIGN_002",
  "message": "Campaign name already exists in workspace",
  "field": "name"
}
```

---

### 2. Add Campaign Step

**Endpoint:** `POST /api/campaigns/drip/:campaign_id/steps`

**Request Body:**
```json
{
  "step_name": "Welcome Email - Day 1",
  "day_delay": 0,
  "subject_line": "Welcome to Unite-Hub, {{first_name}}! 🎉",
  "preheader_text": "Let's get you started with your first campaign",
  "email_body": "Hi {{first_name}},\n\nWelcome to Unite-Hub! ...\n\n{{unsubscribe_url}}",
  "email_body_html": "<html>...</html>",
  "cta": {
    "text": "Get Started",
    "url": "https://app.unite-hub.com/onboarding",
    "type": "button"
  },
  "personalization_tags": ["{{first_name}}", "{{company}}"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "step": {
    "id": "uuid",
    "campaign_id": "uuid",
    "step_number": 1,
    "step_name": "Welcome Email - Day 1",
    "subject_line": "Welcome to Unite-Hub, {{first_name}}! 🎉",
    "created_at": "2025-11-18T10:35:00Z"
  }
}
```

---

### 3. Enroll Contacts

**Endpoint:** `POST /api/campaigns/drip/:campaign_id/enroll`

**Request Body:**
```json
{
  "contact_ids": ["uuid1", "uuid2", "uuid3"],
  "start_immediately": false,
  "scheduled_start": "2025-11-20T09:00:00+10:00",
  "personalization_data": {
    "uuid1": {
      "first_name": "John",
      "company": "Acme Corp"
    },
    "uuid2": {
      "first_name": "Jane",
      "company": "Beta Ltd"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "enrolled": 2,
  "skipped": 1,
  "failed": 0,
  "enrollments": [
    {
      "id": "uuid",
      "contact_id": "uuid1",
      "contact_email": "john@acme.com",
      "status": "active",
      "next_email_scheduled_at": "2025-11-20T09:00:00+10:00"
    }
  ],
  "errors": []
}
```

---

### 4. Get Campaign Metrics

**Endpoint:** `GET /api/campaigns/drip/:campaign_id/metrics`

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
    "campaign_name": "Welcome Onboarding Sequence",
    "total_enrollments": 150,
    "active_enrollments": 45,
    "completed_enrollments": 98,
    "total_sent": 520,
    "total_delivered": 515,
    "total_opened": 412,
    "total_clicked": 187,
    "total_replied": 34,
    "open_rate": 80.0,
    "click_rate": 36.3,
    "reply_rate": 6.6,
    "conversion_rate": 65.3,
    "avg_time_to_complete": 120.5,
    "step_performance": [
      {
        "step_number": 1,
        "step_name": "Welcome Email - Day 1",
        "sent": 150,
        "opened": 135,
        "clicked": 67,
        "open_rate": 90.0,
        "click_rate": 44.7
      }
    ]
  },
  "generated_at": "2025-11-18T10:45:00Z"
}
```

---

### 5. Pause/Resume Campaign

**Endpoint:** `PATCH /api/campaigns/drip/:campaign_id/status`

**Request Body:**
```json
{
  "status": "paused", // or "active"
  "workspaceId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "campaign": {
    "id": "uuid",
    "status": "paused",
    "updated_at": "2025-11-18T11:00:00Z"
  },
  "message": "Campaign paused successfully. Active enrollments will not receive scheduled emails."
}
```

---

### 6. Process Scheduled Steps (Internal/Cron)

**Endpoint:** `POST /api/campaigns/drip/process-scheduled`

**Headers:**
```
X-Cron-Secret: {secret} // Internal authentication
```

**Request Body:**
```json
{
  "workspace_id": "uuid", // Optional
  "limit": 1000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "processed": 247,
  "failed": 3,
  "skipped": 12,
  "execution_time_ms": 4523,
  "errors": [
    {
      "enrollment_id": "uuid",
      "step_id": "uuid",
      "error": "Email service timeout"
    }
  ]
}
```

---

### 7. Handle Email Event (Webhook)

**Endpoint:** `POST /api/campaigns/drip/webhook/email-event`

**Headers:**
```
X-Webhook-Signature: {signature} // Verify sender authenticity
```

**Request Body:**
```json
{
  "event_type": "opened",
  "email_id": "uuid",
  "contact_email": "john@acme.com",
  "timestamp": "2025-11-18T12:15:30Z",
  "metadata": {
    "ip_address": "203.123.45.67",
    "user_agent": "Mozilla/5.0 ..."
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "enrollment_updated": true,
  "log_created": true
}
```

---

## Integration Points

### Inputs (What Triggers This Agent)

1. **User Actions (Dashboard UI):**
   - Create new drip campaign
   - Add/edit campaign steps
   - Enroll contacts manually
   - Start/pause/archive campaign
   - View campaign analytics

2. **Automated Triggers:**
   - Cron job (every 15 minutes) → `processScheduledSteps()`
   - Contact tagged → Auto-enroll in campaign
   - Contact score threshold reached → Auto-enroll
   - Form submission → Auto-enroll in nurture sequence

3. **Webhook Events:**
   - Email service webhooks → `handleEmailEvent()`
   - Email opened → Update metrics, log interaction
   - Email clicked → Update metrics, trigger conditional logic
   - Email replied → Update metrics, notify sales team
   - Email bounced → Mark enrollment as bounced
   - Unsubscribed → Stop campaign, update contact

### Outputs (What This Agent Provides)

1. **To Email Agent:**
   - Send campaign email requests
   - Input: { contact_email, subject, body, tracking_params }
   - Output: { email_id, status, sent_at }

2. **To Contact Agent:**
   - Update contact scores based on engagement
   - Add tags when campaign milestones reached
   - Update last_interaction timestamp

3. **To Analytics Agent:**
   - Campaign performance data
   - Conversion funnel metrics
   - A/B test results

4. **To Workflow Agent:**
   - Campaign completion events
   - Goal achievement notifications
   - High-engagement alerts (e.g., "Contact opened all 5 emails")

5. **To Audit Logs:**
   - All campaign CRUD operations
   - Enrollment changes
   - Step executions
   - Metric updates

---

## Business Rules

### 1. Campaign Lifecycle Rules

**Draft → Active Transition:**
- Campaign must have at least 1 step
- All steps must have valid email content
- All steps must include `{{unsubscribe_url}}` placeholder
- Cannot activate if workspace has no active email integration

**Active Campaign Modifications:**
- Cannot delete steps from active campaigns (only pause)
- Cannot change step order in active campaigns
- Can add new steps to end of sequence
- Can edit step content (applies to future sends only)

**Pause vs. Archive:**
- **Pause:** Temporary stop, can resume, enrollments remain active
- **Archive:** Permanent stop, cannot resume, enrollments marked completed

---

### 2. Enrollment Rules

**Re-enrollment:**
- Default: Contacts cannot re-enroll in same campaign
- Override: Set `allow_re_enrollment: true` on campaign
- Wait period: Minimum 30 days between enrollments (configurable)

**Enrollment Caps:**
- Per campaign: 100,000 max enrollments
- Per contact: 5 active campaigns max (prevent spam)
- Per workspace: 1,000,000 total enrollments (database limit)

**Automatic Unenrollment:**
- Contact marked as 'unsubscribed' → All active enrollments paused
- Contact deleted → All enrollments cascade deleted
- Contact email changed → Enrollment continues with new email

---

### 3. Email Sending Rules (Australian Compliance)

**Spam Act 2003 Compliance:**
- All emails MUST include unsubscribe link (placeholder: `{{unsubscribe_url}}`)
- Unsubscribe must be processed within 5 business days
- Sender identity must be clear (from name + from email)
- No misleading subject lines

**Send Time Optimization:**
- Respect Australian business hours (9 AM - 5 PM AEST/AEDT)
- Default: Send emails at 9 AM recipient's timezone
- User override: Can schedule specific send times
- Weekend sending: Disabled by default (can enable per campaign)

**Rate Limiting:**
- Max 100 emails per minute per workspace (prevent IP reputation damage)
- Max 10,000 emails per day per workspace (free plan)
- Upgrade plans: 50,000/day (Pro), unlimited (Enterprise)

---

### 4. Conditional Logic Rules

**Supported Conditions:**
- `opened` - Contact opened previous email
- `clicked` - Contact clicked link in previous email
- `replied` - Contact replied to previous email
- `score_above` - Contact AI score > threshold (e.g., 75)
- `tag_has` - Contact has specific tag

**Branching Behavior:**
- If condition true → Jump to true_path step number
- If condition false → Jump to false_path step number
- Cannot create circular loops (validation check)
- Max branch depth: 5 levels (prevent infinite loops)

---

### 5. A/B Testing Rules

**Variant Requirements:**
- Minimum 2 variants, maximum 5 variants per step
- Total weight must equal 100%
- Each variant must have unique subject line
- Email body can be same or different

**Statistical Significance:**
- Minimum sample size: 100 sends per variant
- Test duration: Minimum 24 hours
- Auto-select winner: Variant with highest open rate after 7 days
- Winner applies to all future sends

**Metrics Tracked:**
- Per-variant open rates
- Per-variant click rates
- Per-variant reply rates
- Statistical confidence level

---

### 6. Performance & Scalability Rules

**Database Indexes (Already Applied):**
```sql
-- High-priority indexes for query performance
idx_campaign_enrollments_next_scheduled -- For processScheduledSteps()
idx_campaign_execution_logs_created_at -- For metrics calculation
idx_drip_campaigns_workspace_id -- For workspace filtering
idx_campaign_steps_campaign_id -- For step loading
```

**Batch Processing:**
- Query limit: 1,000 rows per batch
- Parallel processing: 10 concurrent step executions
- Retry strategy: 3 attempts with exponential backoff (1s, 2s, 4s)

**Cache Strategy:**
- Campaign metadata: Cache for 5 minutes (Redis)
- Step content: Cache for 10 minutes (Redis)
- Metrics: Cache for 1 minute (Redis)
- Invalidate on update

---

## Performance Requirements

### Response Time Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Create campaign | < 200ms | 500ms |
| Add step | < 150ms | 400ms |
| Enroll contacts (bulk) | < 1s per 100 contacts | 3s per 100 |
| Execute single step | < 2s | 5s |
| Calculate metrics | < 500ms | 1s |
| Process scheduled steps | < 5s per 1000 steps | 10s per 1000 |

### Throughput Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent campaigns | 1,000+ per workspace | No degradation |
| Active enrollments | 100,000+ per campaign | Sub-second queries |
| Steps per minute | 1,000+ | Background job |
| Webhook events | 500/second | Burst capacity |

### Database Optimization

**Critical Indexes:**
```sql
-- For scheduler (most frequent query)
CREATE INDEX idx_enrollment_scheduler
ON campaign_enrollments(status, next_email_scheduled_at)
WHERE status = 'active';

-- For metrics aggregation
CREATE INDEX idx_execution_logs_metrics
ON campaign_execution_logs(campaign_id, action, created_at DESC);

-- For enrollment lookups
CREATE INDEX idx_enrollment_contact_campaign
ON campaign_enrollments(campaign_id, contact_id, status);
```

**Partitioning Strategy (Future):**
- Partition `campaign_execution_logs` by created_at (monthly partitions)
- Archive logs older than 12 months to cold storage
- Estimated reduction: 60-70% in active table size after 1 year

---

## Testing Strategy

### 1. Unit Tests

**File:** `tests/agents/campaign-agent.test.ts`

```typescript
describe('Campaign Agent - Core Functions', () => {
  describe('createDripCampaign', () => {
    test('should create campaign with valid data', async () => {
      const input = {
        workspace_id: testWorkspaceId,
        name: 'Test Campaign',
        sequence_type: 'onboarding'
      };
      const result = await createDripCampaign(input);
      expect(result.success).toBe(true);
      expect(result.campaign.status).toBe('draft');
      expect(result.campaign.total_steps).toBe(0);
    });

    test('should reject duplicate campaign name', async () => {
      // Create first campaign
      await createDripCampaign({ workspace_id: testWorkspaceId, name: 'Duplicate Test' });

      // Try to create duplicate
      await expect(createDripCampaign({
        workspace_id: testWorkspaceId,
        name: 'Duplicate Test'
      })).rejects.toThrow('CAMPAIGN_002');
    });
  });

  describe('addCampaignStep', () => {
    test('should auto-assign step numbers sequentially', async () => {
      const campaign = await createDripCampaign({ workspace_id: testWorkspaceId, name: 'Step Test' });

      const step1 = await addCampaignStep(campaign.id, { step_name: 'Step 1', day_delay: 0, ... });
      const step2 = await addCampaignStep(campaign.id, { step_name: 'Step 2', day_delay: 1, ... });

      expect(step1.step_number).toBe(1);
      expect(step2.step_number).toBe(2);
    });

    test('should reject steps without unsubscribe link', async () => {
      const campaign = await createDripCampaign({ workspace_id: testWorkspaceId, name: 'Validation Test' });

      await expect(addCampaignStep(campaign.id, {
        step_name: 'Invalid',
        email_body: 'No unsubscribe link here'
      })).rejects.toThrow('CAMPAIGN_007');
    });
  });

  describe('enrollContacts', () => {
    test('should enroll multiple contacts in bulk', async () => {
      const campaign = await createActiveCampaign();
      const contacts = await createTestContacts(5);

      const result = await enrollContacts(campaign.id, contacts.map(c => c.id));

      expect(result.enrolled).toBe(5);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
    });

    test('should skip already-enrolled contacts', async () => {
      const campaign = await createActiveCampaign();
      const contacts = await createTestContacts(3);

      // First enrollment
      await enrollContacts(campaign.id, contacts.map(c => c.id));

      // Second enrollment (should skip)
      const result = await enrollContacts(campaign.id, contacts.map(c => c.id));

      expect(result.enrolled).toBe(0);
      expect(result.skipped).toBe(3);
    });
  });

  describe('executeStep', () => {
    test('should send email and update enrollment', async () => {
      const { campaign, enrollment } = await createEnrollmentWithSteps();
      const step = await getFirstStep(campaign.id);

      const result = await executeStep(enrollment.id, step.id);

      expect(result.success).toBe(true);
      expect(result.action).toBe('email_sent');
      expect(result.email_id).toBeDefined();

      // Verify enrollment updated
      const updated = await getEnrollment(enrollment.id);
      expect(updated.current_step).toBe(1);
      expect(updated.last_email_sent_at).toBeDefined();
    });

    test('should handle conditional logic branching', async () => {
      const campaign = await createCampaignWithConditionalStep();
      const enrollment = await enrollContact(campaign.id, testContactId);

      // Mock: Contact opened email
      await mockEmailOpened(enrollment.id);

      const result = await executeStep(enrollment.id, step.id);

      // Should jump to true_path (step 3, not step 2)
      const updated = await getEnrollment(enrollment.id);
      expect(updated.next_step_scheduled).toBe(step3.id);
    });
  });

  describe('trackMetrics', () => {
    test('should calculate accurate open rates', async () => {
      const campaign = await createCampaignWithExecutionData();

      const metrics = await trackMetrics(campaign.id);

      expect(metrics.open_rate).toBeCloseTo(75.0, 1); // 75% open rate
      expect(metrics.click_rate).toBeCloseTo(30.0, 1); // 30% click rate
    });

    test('should aggregate step-level performance', async () => {
      const campaign = await createCampaignWithMultipleSteps();

      const metrics = await trackMetrics(campaign.id);

      expect(metrics.step_performance).toHaveLength(5);
      expect(metrics.step_performance[0].open_rate).toBeGreaterThan(
        metrics.step_performance[4].open_rate
      ); // Drop-off over time
    });
  });
});
```

---

### 2. Integration Tests

**File:** `tests/integration/campaign-workflow.test.ts`

```typescript
describe('Campaign Agent - End-to-End Workflows', () => {
  test('should execute complete onboarding campaign', async () => {
    // 1. Create campaign
    const campaign = await createDripCampaign({
      workspace_id: testWorkspaceId,
      name: 'E2E Onboarding',
      sequence_type: 'onboarding'
    });

    // 2. Add 5 steps
    await addCampaignStep(campaign.id, { step_name: 'Welcome', day_delay: 0, ... });
    await addCampaignStep(campaign.id, { step_name: 'Getting Started', day_delay: 2, ... });
    await addCampaignStep(campaign.id, { step_name: 'Tips & Tricks', day_delay: 5, ... });
    await addCampaignStep(campaign.id, { step_name: 'Case Study', day_delay: 7, ... });
    await addCampaignStep(campaign.id, { step_name: 'Final CTA', day_delay: 10, ... });

    // 3. Activate campaign
    await updateCampaignStatus(campaign.id, 'active');

    // 4. Enroll 10 contacts
    const contacts = await createTestContacts(10);
    const enrollments = await enrollContacts(campaign.id, contacts.map(c => c.id));

    // 5. Execute all steps (fast-forward time)
    for (const enrollment of enrollments.enrollments) {
      for (let stepNum = 1; stepNum <= 5; stepNum++) {
        const step = await getStepByNumber(campaign.id, stepNum);
        await executeStep(enrollment.id, step.id, { force: true });
      }
    }

    // 6. Verify metrics
    const metrics = await trackMetrics(campaign.id);
    expect(metrics.total_sent).toBe(50); // 10 contacts × 5 steps
    expect(metrics.completed_enrollments).toBe(10);
  });

  test('should handle webhook events correctly', async () => {
    const { campaign, enrollment, step } = await createEnrollmentWithSentEmail();

    // Simulate email opened webhook
    await handleEmailEvent({
      event_type: 'opened',
      email_id: sentEmail.id,
      contact_email: enrollment.contact_email,
      timestamp: new Date().toISOString(),
      metadata: { ip_address: '203.123.45.67' }
    });

    // Verify enrollment updated
    const updated = await getEnrollment(enrollment.id);
    expect(updated.interaction_history).toContainEqual(
      expect.objectContaining({ action: 'opened' })
    );

    // Verify metrics incremented
    const metrics = await trackMetrics(campaign.id);
    expect(metrics.total_opened).toBe(1);
  });
});
```

---

### 3. Load Tests

**File:** `tests/load/campaign-scalability.test.ts`

```typescript
describe('Campaign Agent - Scalability Tests', () => {
  test('should handle 10,000 enrollments per campaign', async () => {
    const campaign = await createActiveCampaign();
    const contacts = await createTestContacts(10000);

    const startTime = Date.now();

    // Enroll in batches of 1000
    for (let i = 0; i < 10; i++) {
      const batch = contacts.slice(i * 1000, (i + 1) * 1000);
      await enrollContacts(campaign.id, batch.map(c => c.id));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(30000); // < 30 seconds for 10k enrollments
  });

  test('should process 1000 scheduled steps in < 10 seconds', async () => {
    // Pre-populate 1000 due enrollments
    await createDueEnrollments(1000);

    const startTime = Date.now();
    const result = await processScheduledSteps({ limit: 1000 });
    const endTime = Date.now();

    expect(result.processed + result.failed).toBe(1000);
    expect(endTime - startTime).toBeLessThan(10000);
  });
});
```

---

## Error Codes

| Code | Error | HTTP Status | Resolution |
|------|-------|-------------|------------|
| `CAMPAIGN_001` | Invalid workspace_id | 400 | Verify workspace exists and user has access |
| `CAMPAIGN_002` | Duplicate campaign name | 400 | Choose unique name within workspace |
| `CAMPAIGN_003` | Invalid sequence_type | 400 | Use: cold_outreach, lead_nurture, onboarding, re_engagement, custom |
| `CAMPAIGN_004` | Campaign not found | 404 | Check campaign_id, ensure not deleted |
| `CAMPAIGN_005` | Campaign not in draft status | 409 | Cannot modify active campaigns (pause first) |
| `CAMPAIGN_006` | Invalid day_delay | 400 | Must be 0-365 days |
| `CAMPAIGN_007` | Missing unsubscribe link | 400 | Include {{unsubscribe_url}} in email body |
| `CAMPAIGN_008` | A/B test weights invalid | 400 | Weights must sum to 100 |
| `CAMPAIGN_009` | Campaign not active | 409 | Cannot enroll in draft/paused/archived campaigns |
| `CAMPAIGN_010` | Contact already enrolled | 409 | Set skip_if_already_enrolled=false to override |
| `CAMPAIGN_011` | Contact not in workspace | 404 | Contact must belong to same workspace |
| `CAMPAIGN_012` | Contact is unsubscribed | 403 | Cannot enroll unsubscribed contacts |
| `CAMPAIGN_013` | Bulk enrollment limit exceeded | 413 | Max 10,000 per batch |
| `CAMPAIGN_014` | Enrollment not active | 409 | Enrollment paused or completed |
| `CAMPAIGN_015` | Step not scheduled yet | 409 | Wait for next_email_scheduled_at or use force=true |
| `CAMPAIGN_016` | Email send failed | 500 | Check Email Agent logs, verify email service |
| `CAMPAIGN_017` | Invalid personalization data | 400 | Missing required merge tag values |
| `CAMPAIGN_018` | Campaign not found | 404 | Campaign deleted or wrong workspace |
| `CAMPAIGN_019` | Insufficient data for metrics | 400 | Campaign has no enrollments yet |
| `CAMPAIGN_020` | Circuit breaker triggered | 503 | High failure rate, retry later |
| `CAMPAIGN_021` | Database connection timeout | 504 | Retry request, check DB health |
| `CAMPAIGN_022` | Email service unavailable | 503 | External service down, retry later |
| `CAMPAIGN_023` | Event email_id not found | 404 | Webhook references unknown email |
| `CAMPAIGN_024` | Duplicate event | 409 | Event already processed (idempotent) |

---

## Australian Compliance

### 1. Spam Act 2003 Requirements

**Mandatory Elements:**
```typescript
// Every campaign email MUST include:
const requiredElements = {
  unsubscribe_mechanism: '{{unsubscribe_url}}', // Placeholder replaced at send
  sender_identity: {
    from_name: 'Unite-Hub Team', // Clear sender
    from_email: 'campaigns@unite-hub.com', // Functional email
    physical_address: '123 Marketing St, Sydney NSW 2000' // Australian address
  },
  accurate_subject: true // No misleading subjects
};
```

**Validation:**
```typescript
function validateSpamCompliance(step: CampaignStep): ValidationResult {
  const errors: string[] = [];

  // Check for unsubscribe link
  if (!step.email_body.includes('{{unsubscribe_url}}')) {
    errors.push('CAMPAIGN_007: Missing unsubscribe link');
  }

  // Check subject line length (Australian best practice: < 50 chars)
  if (step.subject_line.length > 100) {
    errors.push('Subject line exceeds 100 characters (recommended: < 50)');
  }

  // Check for deceptive content indicators
  const spamKeywords = ['FREE!!!', 'URGENT!!!', 'ACT NOW!!!'];
  if (spamKeywords.some(keyword => step.subject_line.includes(keyword))) {
    errors.push('Subject line contains potential spam indicators');
  }

  return { valid: errors.length === 0, errors };
}
```

---

### 2. Time Zone Handling (AEST/AEDT)

**Send Time Optimization:**
```typescript
function calculateSendTime(contact: Contact, step: CampaignStep): Date {
  // Default: 9 AM Sydney time (AEST/AEDT)
  const sydneyTz = 'Australia/Sydney';
  const preferredHour = step.preferred_send_hour || 9;

  const scheduledDate = addDays(new Date(), step.day_delay);
  const sendTime = setHours(scheduledDate, preferredHour);

  // Convert to UTC for storage
  return zonedTimeToUtc(sendTime, sydneyTz);
}

// Business hours check
function isAustralianBusinessHours(date: Date): boolean {
  const sydneyTime = utcToZonedTime(date, 'Australia/Sydney');
  const hour = getHours(sydneyTime);
  const day = getDay(sydneyTime);

  // Monday-Friday, 9 AM - 5 PM
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
```

---

### 3. Phone Number Formatting

**Australian Mobile Format:**
```typescript
function formatAustralianPhone(phone: string): string {
  // Input: 0412345678, +61412345678, 61412345678
  // Output: +61 412 345 678

  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits

  if (cleaned.startsWith('0')) {
    // Local format → International
    return `+61 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.startsWith('61')) {
    // Already international
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  return phone; // Return as-is if format unknown
}
```

---

### 4. Business Name Compliance (ASIC)

**Sender Identity Validation:**
```typescript
function validateSenderIdentity(campaign: DripCampaign): ValidationResult {
  // Australian business must use registered business name
  const validFromNames = [
    'Unite-Hub Pty Ltd',
    'Unite-Hub Team',
    'Unite Group Australia'
  ];

  if (!validFromNames.includes(campaign.from_name)) {
    return {
      valid: false,
      error: 'From name must match registered business name (ASIC requirement)'
    };
  }

  return { valid: true };
}
```

---

## Security

### 1. Row Level Security (RLS) Policies

**Drip Campaigns Table:**
```sql
-- Users can only view campaigns in their workspaces
CREATE POLICY "Users can view own workspace campaigns" ON drip_campaigns
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Users can create campaigns in their workspaces
CREATE POLICY "Users can create campaigns in own workspace" ON drip_campaigns
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Service role can do anything (for agent operations)
CREATE POLICY "Service role full access" ON drip_campaigns
  FOR ALL
  USING (auth.role() = 'service_role');
```

**Campaign Enrollments Table:**
```sql
CREATE POLICY "Users can view enrollments in own workspace" ON campaign_enrollments
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT dc.id FROM drip_campaigns dc
      WHERE dc.workspace_id IN (
        SELECT w.id FROM workspaces w
        JOIN user_organizations uo ON uo.org_id = w.org_id
        WHERE uo.user_id = auth.uid()
      )
    )
  );
```

---

### 2. API Authentication & Authorization

**Middleware Pattern:**
```typescript
import { validateUserAndWorkspace } from '@/lib/workspace-validation';

export async function POST(req: NextRequest) {
  const { workspaceId, ...body } = await req.json();

  // Validates:
  // 1. User is authenticated (JWT token)
  // 2. User belongs to organization that owns workspace
  // 3. User has required permissions
  const user = await validateUserAndWorkspace(req, workspaceId);

  // Proceed with campaign operation
  const result = await createDripCampaign({ workspace_id: workspaceId, ...body });

  return NextResponse.json(result);
}
```

---

### 3. Data Sanitization

**Email Content Sanitization:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeEmailContent(htmlContent: string): string {
  // Remove dangerous HTML/JS
  const clean = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'style'],
    ALLOW_DATA_ATTR: false
  });

  return clean;
}
```

**SQL Injection Prevention:**
```typescript
// ✅ CORRECT - Parameterized queries
const { data } = await supabase
  .from('campaign_steps')
  .select('*')
  .eq('campaign_id', campaignId); // Safe

// ❌ WRONG - String concatenation
const query = `SELECT * FROM campaign_steps WHERE campaign_id = '${campaignId}'`; // SQL injection risk
```

---

### 4. Rate Limiting

**Per-Workspace Limits:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 emails per minute
  analytics: true,
});

async function checkRateLimit(workspaceId: string): Promise<boolean> {
  const { success, limit, remaining } = await ratelimit.limit(
    `campaign:${workspaceId}`
  );

  if (!success) {
    throw new Error(`Rate limit exceeded. ${remaining} requests remaining.`);
  }

  return true;
}
```

---

## Monitoring & Metrics

### 1. Key Performance Indicators (KPIs)

**Campaign Health Metrics:**
```typescript
interface CampaignHealthMetrics {
  // Execution health
  execution_success_rate: number; // % (target: > 95%)
  avg_execution_latency_ms: number; // (target: < 2000ms)
  failed_step_count_24h: number; // (alert if > 100)

  // Engagement health
  avg_open_rate: number; // % (benchmark: 20-30%)
  avg_click_rate: number; // % (benchmark: 2-5%)
  avg_reply_rate: number; // % (benchmark: 1-3%)

  // Deliverability health
  bounce_rate: number; // % (alert if > 2%)
  unsubscribe_rate: number; // % (alert if > 0.5%)
  spam_complaint_rate: number; // % (alert if > 0.1%)

  // System health
  active_enrollments: number;
  pending_steps_count: number; // Steps due to execute
  circuit_breaker_status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}
```

---

### 2. Logging & Observability

**Structured Logging:**
```typescript
import { logger } from '@/lib/logger';

async function executeStep(enrollment_id: string, step_id: string) {
  const startTime = Date.now();

  logger.info('campaign.step.execute.start', {
    enrollment_id,
    step_id,
    timestamp: new Date().toISOString()
  });

  try {
    const result = await sendEmail(/* ... */);

    logger.info('campaign.step.execute.success', {
      enrollment_id,
      step_id,
      email_id: result.email_id,
      duration_ms: Date.now() - startTime
    });

    return result;
  } catch (error) {
    logger.error('campaign.step.execute.failed', {
      enrollment_id,
      step_id,
      error: error.message,
      stack: error.stack,
      duration_ms: Date.now() - startTime
    });

    throw error;
  }
}
```

---

### 3. Alerts & Notifications

**Alert Configuration:**
```typescript
interface CampaignAlert {
  name: string;
  condition: () => Promise<boolean>;
  severity: 'critical' | 'warning' | 'info';
  notification_channels: ('email' | 'slack' | 'pagerduty')[];
}

const campaignAlerts: CampaignAlert[] = [
  {
    name: 'High Bounce Rate',
    condition: async () => {
      const metrics = await getCampaignMetrics();
      return metrics.bounce_rate > 2.0; // > 2%
    },
    severity: 'critical',
    notification_channels: ['email', 'slack']
  },
  {
    name: 'Circuit Breaker Open',
    condition: async () => {
      const status = await getCircuitBreakerStatus();
      return status === 'OPEN';
    },
    severity: 'critical',
    notification_channels: ['slack', 'pagerduty']
  },
  {
    name: 'Low Open Rate',
    condition: async () => {
      const metrics = await getCampaignMetrics();
      return metrics.avg_open_rate < 15.0; // < 15%
    },
    severity: 'warning',
    notification_channels: ['email']
  }
];
```

---

### 4. Dashboard Metrics

**Grafana Dashboard Queries:**
```sql
-- Execution success rate (last 1 hour)
SELECT
  COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*) * 100 AS success_rate
FROM campaign_execution_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND action = 'email_sent';

-- Average execution latency
SELECT
  AVG(EXTRACT(EPOCH FROM (created_at - scheduled_at)) * 1000) AS avg_latency_ms
FROM campaign_execution_logs
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Pending steps count
SELECT COUNT(*) AS pending_steps
FROM campaign_enrollments
WHERE status = 'active'
  AND next_email_scheduled_at <= NOW();
```

---

## Future Enhancements

### Phase 2 (Q2 2026)

1. **Advanced A/B Testing:**
   - Multi-variate testing (subject + body + CTA)
   - Auto-optimization (machine learning picks winners)
   - Holdout groups (control vs. test)

2. **Dynamic Content Personalization:**
   - AI-powered content generation per contact
   - Industry-specific templates
   - Sentiment-based tone adjustment

3. **Predictive Analytics:**
   - Predict optimal send times per contact
   - Predict best content type per contact
   - Churn prediction (likelihood to unsubscribe)

4. **Enhanced Conditional Logic:**
   - Wait-until conditions (wait until contact visits website)
   - External data conditions (wait until CRM deal stage changes)
   - Multi-step branching (AND/OR logic)

---

### Phase 3 (Q3-Q4 2026)

1. **Multi-Channel Campaigns:**
   - SMS steps (via Twilio integration)
   - WhatsApp steps (via WhatsApp Business API)
   - LinkedIn InMail steps (via LinkedIn API)
   - Retargeting ads (via Facebook/Google Ads API)

2. **Campaign Templates Marketplace:**
   - Pre-built industry templates (SaaS, E-commerce, B2B)
   - Community-shared templates
   - Template versioning and updates

3. **Advanced Analytics:**
   - Revenue attribution (track $ generated per campaign)
   - Cohort analysis (compare campaign performance over time)
   - Funnel visualization (Sankey diagrams)
   - Heatmaps (email click heatmaps)

4. **Collaboration Features:**
   - Campaign approval workflows (manager approval required)
   - Comment threads on campaign steps
   - Version history with rollback
   - Team performance leaderboards

---

**Status:** ✅ Specification Complete
**Next Steps:** Implement core functions → Build API endpoints → Integration testing
**Estimated Implementation:** 3-4 weeks (1 developer)
**Dependencies:** Email Agent (P0), Contact Agent (P0), Email Service (P0)

---

**Agent Specification Version:** 1.0.0
**Last Updated:** 2025-11-18
**Author:** Claude (Sonnet 4.5) via Unite-Hub Orchestrator
