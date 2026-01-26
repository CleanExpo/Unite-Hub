# Social Drip Campaign Data Model

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.3.1 (Campaign Data Model & Schema)

---

## Overview

Enhanced campaign system for Unite-Hub with:
- **Visual campaign builder** (ReactFlow-based canvas with nodes/edges)
- **A/B testing framework** (variant creation, traffic splitting, statistical significance)
- **Multi-channel support** (email, social media, SMS, webhooks)
- **Advanced workflow logic** (branching, conditions, wait states)
- **Real-time execution tracking** (workflow states, event log)
- **Version control** (campaign snapshots, rollback support)

---

## Database Schema

### Core Tables

#### 1. `drip_campaigns` (Enhanced)

Base campaign entity with visual builder and A/B testing.

**New Columns**:
```sql
campaign_type TEXT CHECK (campaign_type IN ('linear', 'branching', 'ab_test')) DEFAULT 'linear'
canvas_data JSONB DEFAULT '{"nodes": [], "edges": [], "viewport": {}}'
ab_test_config JSONB -- {enabled: boolean, variants: [], winner_metric: '...'}
ab_test_winner_id UUID REFERENCES campaign_steps(id)
ab_test_completed_at TIMESTAMPTZ
goal_metric TEXT CHECK (goal_metric IN ('open_rate', 'click_rate', 'reply_rate', 'conversion_rate', 'engagement_score'))
goal_target DECIMAL(5,2) -- Target percentage (e.g., 25.00 for 25%)
version INTEGER DEFAULT 1
parent_campaign_id UUID REFERENCES drip_campaigns(id)
```

**Campaign Types**:
- `linear`: Simple sequential flow (A → B → C)
- `branching`: Conditional logic with multiple paths
- `ab_test`: A/B test with variant splits

**Canvas Data Structure**:
```json
{
  "nodes": [
    {
      "id": "node_abc123",
      "type": "email",
      "position": {"x": 100, "y": 100},
      "data": {"label": "Welcome Email", "stepId": "step-uuid"}
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_abc123",
      "target": "node_def456",
      "type": "default"
    }
  ],
  "viewport": {"x": 0, "y": 0, "zoom": 1}
}
```

#### 2. `campaign_steps` (Enhanced)

Workflow steps with visual builder integration.

**New Columns**:
```sql
node_id TEXT -- Visual builder node ID
node_type TEXT CHECK (node_type IN ('trigger', 'email', 'wait', 'condition', 'split', 'action', 'exit'))
node_position JSONB DEFAULT '{"x": 0, "y": 0}'
channel_id UUID REFERENCES campaign_channels(id)
channel_config JSONB -- Channel-specific configuration
variant_group TEXT -- 'variant_a', 'variant_b', etc.
variant_percentage INTEGER CHECK (variant_percentage >= 0 AND variant_percentage <= 100)
parent_split_id UUID REFERENCES campaign_steps(id)
conditional_branches JSONB -- [{condition: {}, target_step_id: ''}, ...]
wait_config JSONB -- {type: 'duration'|'until_event', value: 24, unit: 'hours'}
action_config JSONB -- {type: 'tag'|'score'|'webhook', config: {}}
```

**Node Types**:
- `trigger`: Campaign entry point (manual, tag, score, webhook, scheduled)
- `email`: Send email action
- `wait`: Delay execution (duration or event-based)
- `condition`: Conditional branching (if/else logic)
- `split`: A/B test split or random split
- `action`: Execute action (tag, score update, webhook, etc.)
- `exit`: Campaign exit point

**Channel Config Example** (Social Media):
```json
{
  "social": {
    "platform": "instagram",
    "post_type": "reel",
    "content": "Check out our latest product!",
    "media_urls": ["https://..."],
    "hashtags": ["#product", "#innovation"],
    "schedule_time": "2026-01-28T15:00:00Z"
  }
}
```

#### 3. `campaign_workflow_states` (New)

Real-time execution state for each contact enrollment.

**Purpose**: Track where each contact is in the workflow and manage execution.

**Columns**:
```sql
id UUID PRIMARY KEY
enrollment_id UUID REFERENCES campaign_enrollments(id) -- One-to-one with enrollment
campaign_id UUID REFERENCES drip_campaigns(id)
contact_id UUID REFERENCES contacts(id)
current_node_id TEXT -- Current position in workflow
current_step_id UUID REFERENCES campaign_steps(id)
workflow_status TEXT -- 'running', 'waiting', 'paused', 'completed', 'failed', 'exited'
execution_path JSONB -- Array of node IDs visited: ["node_1", "node_2", "node_3"]
workflow_variables JSONB -- Runtime variables: {"email_opened": true, "last_click_time": "..."}
wait_until TIMESTAMPTZ -- For duration-based waits
wait_for_event TEXT -- For event-based waits ('email_open', 'reply', etc.)
retry_count INTEGER DEFAULT 0
max_retries INTEGER DEFAULT 3
assigned_variant TEXT -- A/B test variant assignment
variant_assigned_at TIMESTAMPTZ
started_at TIMESTAMPTZ
last_executed_at TIMESTAMPTZ
next_execution_at TIMESTAMPTZ -- For scheduling next execution
completed_at TIMESTAMPTZ
```

**Workflow States**:
- `running`: Currently executing
- `waiting`: Paused for wait node (duration or event)
- `paused`: Manually paused
- `completed`: Successfully completed entire workflow
- `failed`: Execution failed (after max retries)
- `exited`: Exited via exit node or condition

**Usage Pattern**:
1. Contact enrolls → workflow state created with first node
2. Workflow engine queries for states with `next_execution_at <= NOW()`
3. Executes current step
4. Updates `current_node_id`, `execution_path`, and `next_execution_at`
5. Repeats until `workflow_status = 'completed'`

#### 4. `campaign_ab_test_results` (New)

Aggregated A/B test metrics and statistical analysis.

**Columns**:
```sql
id UUID PRIMARY KEY
campaign_id UUID REFERENCES drip_campaigns(id)
variant_group TEXT -- 'variant_a', 'variant_b', etc.
variant_step_id UUID REFERENCES campaign_steps(id)

-- Raw metrics
total_sent INTEGER
total_delivered INTEGER
total_opened INTEGER
total_clicked INTEGER
total_replied INTEGER
total_converted INTEGER
total_unsubscribed INTEGER
total_bounced INTEGER

-- Calculated rates (%)
delivery_rate DECIMAL(5,2)
open_rate DECIMAL(5,2)
click_rate DECIMAL(5,2)
reply_rate DECIMAL(5,2)
conversion_rate DECIMAL(5,2)
engagement_score DECIMAL(5,2) -- Composite: (open * 0.3 + click * 0.4 + reply * 0.3)

-- Statistical significance
confidence_level DECIMAL(5,2) -- 0-100% confidence
p_value DECIMAL(10,8) -- Statistical p-value
is_statistically_significant BOOLEAN
is_winner BOOLEAN

-- Timestamps
test_started_at TIMESTAMPTZ
test_ended_at TIMESTAMPTZ
winner_declared_at TIMESTAMPTZ
```

**Statistical Significance**:
- Calculated using chi-square test or t-test
- `confidence_level >= 95.0` typically required
- `p_value < 0.05` indicates statistical significance
- `is_winner = TRUE` when variant outperforms others with sufficient confidence

**Example**:
```json
{
  "variant_group": "variant_a",
  "total_sent": 500,
  "total_opened": 250,
  "open_rate": 50.00,
  "confidence_level": 98.50,
  "p_value": 0.0023,
  "is_statistically_significant": true,
  "is_winner": true
}
```

#### 5. `campaign_events` (New)

Comprehensive event log for all campaign interactions.

**Columns**:
```sql
id UUID PRIMARY KEY
campaign_id UUID REFERENCES drip_campaigns(id)
enrollment_id UUID REFERENCES campaign_enrollments(id)
contact_id UUID REFERENCES contacts(id)
event_type TEXT -- 'email_sent', 'email_opened', 'webhook_triggered', etc.
event_source TEXT -- 'system', 'email_provider', 'webhook', 'manual'
step_id UUID REFERENCES campaign_steps(id)
node_id TEXT
event_data JSONB -- Flexible event-specific data
user_agent TEXT
ip_address INET
device_type TEXT
location_data JSONB -- {city, country, timezone}
created_at TIMESTAMPTZ
```

**Event Types**:
- **Email**: `email_sent`, `email_delivered`, `email_opened`, `email_clicked`, `email_replied`, `email_bounced`
- **SMS**: `sms_sent`, `sms_delivered`, `sms_replied`
- **Social**: `social_posted`, `social_engaged`
- **Webhook**: `webhook_triggered`, `webhook_succeeded`, `webhook_failed`
- **Actions**: `tag_added`, `tag_removed`, `score_updated`
- **Workflow**: `condition_evaluated`, `wait_started`, `wait_completed`
- **A/B Test**: `variant_assigned`
- **Lifecycle**: `enrollment_started`, `enrollment_completed`, `enrollment_exited`

**Usage**: Event sourcing for analytics, debugging, and conditional logic.

#### 6. `campaign_versions` (New)

Version history for campaigns with rollback support.

**Columns**:
```sql
id UUID PRIMARY KEY
campaign_id UUID REFERENCES drip_campaigns(id)
version INTEGER
campaign_snapshot JSONB -- Full campaign state
steps_snapshot JSONB -- All steps at this version
canvas_snapshot JSONB -- Visual builder state
change_description TEXT
change_type TEXT -- 'draft', 'published', 'archived', 'ab_test_started', 'ab_test_completed'
created_by UUID REFERENCES auth.users(id)
created_at TIMESTAMPTZ
```

**Use Cases**:
- Audit trail (who changed what, when)
- Rollback to previous version
- Compare versions
- Track A/B test lifecycle

---

## TypeScript Types

### Visual Builder Types

```typescript
interface CanvasData {
  nodes: VisualNode[];
  edges: VisualEdge[];
  viewport: { x: number; y: number; zoom: number };
}

interface VisualNode {
  id: string;
  type: 'trigger' | 'email' | 'wait' | 'condition' | 'split' | 'action' | 'exit';
  position: { x: number; y: number };
  data: {
    label: string;
    stepId?: string;
    config?: any;
  };
}

interface VisualEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'conditional-true' | 'conditional-false' | 'variant-a' | 'variant-b';
}
```

### A/B Testing Types

```typescript
interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
  winner_metric: 'open_rate' | 'click_rate' | 'conversion_rate' | 'engagement_score';
  minimum_sample_size: number;
  confidence_threshold: number; // e.g., 95.0 for 95%
  auto_select_winner: boolean;
}

interface ABTestVariant {
  id: string;
  name: string;
  percentage: number; // 0-100
  step_ids: string[];
}

interface ABTestResult {
  variant_group: string;
  total_sent: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  engagement_score: number;
  confidence_level: number;
  is_statistically_significant: boolean;
  is_winner: boolean;
}
```

### Workflow Types

```typescript
interface WorkflowState {
  id: string;
  enrollment_id: string;
  campaign_id: string;
  contact_id: string;
  current_node_id: string;
  current_step_id?: string;
  workflow_status: 'running' | 'waiting' | 'paused' | 'completed' | 'failed' | 'exited';
  execution_path: string[]; // Array of node IDs
  workflow_variables: Record<string, any>;
  wait_until?: Date;
  wait_for_event?: string;
  assigned_variant?: string;
  next_execution_at?: Date;
}

interface ExecutionContext {
  enrollment: CampaignEnrollment;
  workflow_state: WorkflowState;
  contact: any;
  campaign: SocialDripCampaign;
  current_step: SocialCampaignStep;
  variables: Record<string, any>;
}
```

### Conditional Logic Types

```typescript
interface ConditionalBranch {
  id: string;
  condition: Condition;
  target_node_id: string;
  label?: string;
}

interface Condition {
  type: 'field' | 'score' | 'tag' | 'event' | 'time' | 'composite';
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  field?: string;
  value?: any;
  event_type?: string;
  time_window?: number; // hours
  sub_conditions?: Condition[];
  logic?: 'AND' | 'OR';
}
```

---

## Database Functions

### 1. `calculate_ab_test_metrics(campaign_id)`

Calculates A/B test metrics for all variants.

**Returns**:
```sql
variant_group TEXT
open_rate DECIMAL
click_rate DECIMAL
conversion_rate DECIMAL
engagement_score DECIMAL
sample_size INTEGER
```

**Usage**:
```sql
SELECT * FROM calculate_ab_test_metrics('campaign-uuid');
```

### 2. `get_next_workflow_executions(batch_size)`

Gets next batch of workflows ready for execution.

**Returns**: Workflows with `next_execution_at <= NOW()` and `status = 'waiting'`

**Features**:
- `FOR UPDATE SKIP LOCKED`: Prevents race conditions in distributed execution
- Orders by `next_execution_at ASC`
- Batch size limit

**Usage**:
```sql
SELECT * FROM get_next_workflow_executions(100);
```

### 3. `create_campaign_version_snapshot(campaign_id, description, type)`

Creates version snapshot of campaign state.

**Actions**:
1. Gets next version number
2. Snapshots campaign data
3. Snapshots all steps
4. Snapshots canvas state
5. Inserts into `campaign_versions`
6. Updates campaign version number

**Usage**:
```sql
SELECT create_campaign_version_snapshot(
  'campaign-uuid',
  'Published version 2.0',
  'published'
);
```

---

## Workflow Execution Flow

### 1. Enrollment

```
Contact enrolled → Trigger: create_workflow_state_on_enrollment
  ↓
Creates workflow_state with:
  - current_node_id = first step's node_id
  - workflow_status = 'running'
  - next_execution_at = NOW()
```

### 2. Execution Loop

```sql
-- Workflow engine queries for ready executions
SELECT * FROM get_next_workflow_executions(100);

-- For each workflow state:
FOR EACH state IN batch:
  1. Get current step from campaign_steps WHERE node_id = state.current_node_id
  2. Execute step based on node_type
  3. Evaluate conditional logic (if condition/split node)
  4. Determine next node based on edges and conditions
  5. Update workflow_state:
     - current_node_id = next_node
     - execution_path = array_append(execution_path, current_node)
     - next_execution_at = calculated based on next node
     - workflow_status = 'waiting' | 'completed' | 'exited'
  6. Log event to campaign_events
  7. Update metrics if applicable
END FOR
```

### 3. Node Execution

**Email Node**:
```
1. Get channel_config for email
2. Personalize content with contact data
3. Send via email provider
4. Log 'email_sent' event
5. Set next_execution_at = NOW() + next_edge_delay
```

**Wait Node**:
```
1. Get wait_config
2. If type = 'duration':
   - Set wait_until = NOW() + duration
   - Set next_execution_at = wait_until
3. If type = 'until_event':
   - Set wait_for_event = event_type
   - Set next_execution_at = NOW() + max_wait_duration
4. Set workflow_status = 'waiting'
```

**Condition Node**:
```
1. Get conditional_branches
2. Evaluate conditions against:
   - Contact fields
   - Workflow variables
   - Recent events
3. Select matching branch
4. Set current_node_id = branch.target_node_id
5. Log 'condition_evaluated' event
```

**Split Node (A/B Test)**:
```
1. If not assigned_variant:
   - Select variant based on percentage distribution
   - Set assigned_variant = selected_variant
   - Log 'variant_assigned' event
2. Get variant's first step
3. Set current_node_id = variant_first_node_id
```

**Action Node**:
```
1. Get action_config
2. Execute action based on type:
   - tag: Add/remove tag from contact
   - score: Update contact AI score
   - webhook: Call external webhook
   - field_update: Update contact field
3. Log appropriate event
4. Continue to next node
```

**Exit Node**:
```
1. Set workflow_status = 'completed' | 'exited'
2. Set completed_at = NOW()
3. Log 'enrollment_completed' or 'enrollment_exited' event
4. Stop execution
```

---

## A/B Testing Workflow

### 1. Setup

```typescript
const campaign: SocialDripCampaign = {
  campaign_type: 'ab_test',
  ab_test_config: {
    enabled: true,
    variants: [
      { id: 'variant_a', name: 'Short Subject', percentage: 50, step_ids: ['step-a'] },
      { id: 'variant_b', name: 'Long Subject', percentage: 50, step_ids: ['step-b'] }
    ],
    winner_metric: 'open_rate',
    minimum_sample_size: 100,
    confidence_threshold: 95.0,
    auto_select_winner: true
  }
};
```

### 2. Variant Assignment

```
Contact enrolls → Split node reached
  ↓
1. Check if already assigned (workflow_state.assigned_variant)
2. If not assigned:
   - Random assignment based on percentage distribution
   - Update workflow_state.assigned_variant = 'variant_a' | 'variant_b'
   - Log 'variant_assigned' event
3. Route to variant's first step
```

### 3. Metric Collection

```
Events logged to campaign_events:
  - email_sent (both variants)
  - email_opened (tracks which variant)
  - email_clicked (tracks which variant)
  - email_replied (tracks which variant)

Aggregated into campaign_ab_test_results:
  - total_sent per variant
  - total_opened per variant
  - open_rate = (total_opened / total_sent) * 100
```

### 4. Statistical Analysis

```sql
-- Chi-square test for statistical significance
WITH variant_stats AS (
  SELECT
    variant_group,
    total_sent,
    total_opened,
    open_rate
  FROM campaign_ab_test_results
  WHERE campaign_id = 'campaign-uuid'
)
-- Calculate p-value and confidence level
-- If confidence_level >= 95.0 AND sample_size >= minimum:
--   UPDATE SET is_statistically_significant = TRUE
--   If auto_select_winner = TRUE:
--     UPDATE SET is_winner = TRUE WHERE open_rate = MAX(open_rate)
```

### 5. Winner Selection

```
Automated (if auto_select_winner = TRUE):
  1. Check sample_size >= minimum_sample_size
  2. Calculate statistical significance
  3. If significant AND confidence >= threshold:
     - Declare winner
     - Update campaign.ab_test_winner_id
     - Update campaign.ab_test_completed_at
     - Create version snapshot (type: 'ab_test_completed')
     - Route all new enrollments to winning variant

Manual:
  1. Review metrics dashboard
  2. Select winning variant
  3. Call API to declare winner
  4. System updates as above
```

---

## Multi-Channel Integration

### Email Channel

```typescript
const emailStep: SocialCampaignStep = {
  node_type: 'email',
  channel_id: 'email-channel-uuid',
  channel_config: {
    email: {
      subject: 'Welcome to {{company_name}}!',
      preheader: 'Get started with your account',
      body: 'Hi {{first_name}}, ...',
      body_html: '<html>...</html>',
      personalization_enabled: true
    }
  }
};
```

### Social Media Channel

```typescript
const socialStep: SocialCampaignStep = {
  node_type: 'action',
  channel_id: 'instagram-channel-uuid',
  channel_config: {
    social: {
      platform: 'instagram',
      post_type: 'reel',
      content: 'Check out our latest product! #innovation #tech',
      media_urls: ['https://cdn.example.com/video.mp4'],
      hashtags: ['#innovation', '#tech', '#product'],
      schedule_time: new Date('2026-01-28T15:00:00Z')
    }
  }
};
```

### Webhook Channel

```typescript
const webhookStep: SocialCampaignStep = {
  node_type: 'action',
  action_config: {
    type: 'webhook',
    webhook: {
      url: 'https://api.example.com/leads',
      method: 'POST',
      payload: {
        contact_email: '{{email}}',
        campaign_id: '{{campaign_id}}',
        lead_score: '{{ai_score}}'
      }
    }
  }
};
```

---

## Version Control

### Create Snapshot

```typescript
import { createCampaignVersionSnapshot } from '@/lib/services/campaign-version';

await createCampaignVersionSnapshot(
  campaignId,
  'Published version 2.0 with A/B test',
  'published'
);
```

### Rollback to Version

```typescript
import { rollbackCampaignVersion } from '@/lib/services/campaign-version';

await rollbackCampaignVersion(campaignId, targetVersion);
// Restores campaign, steps, and canvas from version snapshot
```

### Compare Versions

```typescript
const v1 = await getCampaignVersion(campaignId, 1);
const v2 = await getCampaignVersion(campaignId, 2);

const diff = compareCampaignVersions(v1, v2);
// Returns differences in steps, canvas, config
```

---

## Performance Optimization

### 1. Indexes

All critical query paths are indexed:
- `idx_workflow_states_next_execution` - For batch execution queries
- `idx_campaign_events_created` - For event log queries
- `idx_ab_test_results_campaign` - For metrics aggregation
- `idx_campaign_steps_node_id` - For visual builder queries

### 2. Batch Processing

```typescript
// Process workflows in batches
const BATCH_SIZE = 100;
const workflows = await getNextWorkflowExecutions(BATCH_SIZE);

// Process in parallel
await Promise.all(
  workflows.map(workflow => executeWorkflowStep(workflow))
);
```

### 3. Event Sourcing

Events are logged asynchronously to avoid blocking workflow execution:

```typescript
// Non-blocking event log
await logCampaignEvent(event).catch(err => {
  console.error('Event log failed (non-critical):', err);
});

// Continue workflow execution without waiting
```

### 4. Caching

Cache frequently accessed data:
- Campaign definitions (Redis, 1 hour TTL)
- Channel configurations (Redis, 1 hour TTL)
- Contact data (In-memory LRU cache, 5 min TTL)

---

## Migration Guide

### Apply Migration

```bash
# In Supabase Dashboard → SQL Editor
# Run: supabase/migrations/200_social_drip_campaigns.sql
```

### Backward Compatibility

The migration extends existing tables without breaking changes:
- Adds new columns with defaults
- Existing campaigns continue to work
- New features opt-in via `campaign_type` field

### Data Migration

```sql
-- Migrate existing linear campaigns
UPDATE drip_campaigns
SET campaign_type = 'linear',
    canvas_data = jsonb_build_object(
      'nodes', (SELECT jsonb_agg(
        jsonb_build_object(
          'id', 'node_' || cs.id::text,
          'type', 'email',
          'position', jsonb_build_object('x', (cs.step_number * 200), 'y', 100),
          'data', jsonb_build_object('label', cs.step_name, 'stepId', cs.id::text)
        )
      ) FROM campaign_steps cs WHERE cs.campaign_id = drip_campaigns.id),
      'edges', '[]',
      'viewport', jsonb_build_object('x', 0, 'y', 0, 'zoom', 1)
    )
WHERE campaign_type IS NULL;
```

---

## Next Steps

1. ✅ Data model & schema complete
2. ⏭️  Visual campaign builder UI (React components)
3. ⏭️  Campaign workflow engine (execution logic)
4. ⏭️  Multi-channel integration (API connectors)
5. ⏭️  A/B testing framework (statistical analysis)

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.3.1
**Next**: Unite-Hub-ove.3.2 (Visual Campaign Builder UI)

**Tables Created**: 4 new tables, 2 enhanced tables
**Functions Created**: 3 helper functions
**Total Columns Added**: 50+ new columns
**Complete TypeScript Types**: 20+ interfaces
