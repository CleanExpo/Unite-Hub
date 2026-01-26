# Campaign Workflow Engine

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.3.3 (Campaign Workflow Engine)

---

## Overview

Runtime execution engine for social drip campaigns. Interprets visual workflow canvas data and executes nodes with retry logic, state management, and event tracking.

**Architecture**:
- **WorkflowEngine**: Core orchestrator that interprets workflows
- **Node Executors**: Type-specific handlers (7 executors for 7 node types)
- **StateManager**: Persistence and state tracking (campaign_workflow_states)
- **EventLogger**: Campaign event tracking (campaign_events)
- **WorkflowScheduler**: Background worker for processing waiting workflows

---

## Core Components

### 1. WorkflowEngine

Main execution engine that orchestrates workflow execution.

```typescript
import { WorkflowEngine } from '@/lib/workflows';

const engine = new WorkflowEngine({
  maxRetries: 3,
  retryDelayMs: 1000,
  maxExecutionTime: 300000, // 5 minutes
  enableParallelExecution: false,
});

// Start workflow
const workflowState = await engine.startWorkflow(campaign, enrollmentId, contactId);

// Resume waiting workflow
await engine.resumeWorkflow(workflowStateId);
```

**Features**:
- Node execution with retry logic (exponential backoff)
- Wait state management (duration, event-based, time-based)
- Branching logic (conditions, splits)
- Error handling and recovery
- Execution timeout protection

### 2. Node Executors

Type-specific executors for each node type:

#### TriggerExecutor
- Entry point for campaigns
- Logs trigger type and configuration
- No actual execution (handled by enrollment)

#### EmailExecutor
- Sends emails via multi-provider system
- AI personalization (if enabled)
- Template variable replacement
- Tracks email events

#### WaitExecutor
- **Duration wait**: Wait for specified time (minutes, hours, days, weeks)
- **Event wait**: Wait for event (email_open, email_click, reply, etc.)
- **Time wait**: Wait until specific date/time or day-of-week

#### ConditionExecutor
- Evaluates conditional branches
- Supports 6 condition types:
  - `field`: Contact field comparison
  - `score`: Contact score comparison
  - `tag`: Tag membership check
  - `event`: Event occurrence check
  - `time`: Time-based conditions
  - `composite`: AND/OR logic with sub-conditions
- Operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `not_contains`, `exists`, `not_exists`, `in`, `not_in`

#### SplitExecutor
- A/B test variant assignment
- Deterministic distribution (based on contact ID hash)
- Weighted random distribution
- Consistent assignment (contact always gets same variant)

#### ActionExecutor
- **Tag**: Add/remove contact tags
- **Score**: Update contact score (+/- value)
- **Field Update**: Update contact fields (set, append, increment)
- **Webhook**: HTTP POST/PUT to external URL
- **Segment**: Add/remove from segments
- **Notification**: Send notifications (email, Slack, Teams)

#### ExitExecutor
- Terminates workflow
- Logs exit reason
- Updates workflow state to 'exited'

---

## State Management

### Workflow States

Tracked in `campaign_workflow_states` table:

```typescript
interface WorkflowState {
  id: string;
  enrollment_id: string;
  campaign_id: string;
  contact_id: string;
  current_node_id: string;
  workflow_status: 'running' | 'waiting' | 'paused' | 'completed' | 'failed' | 'exited';
  execution_path: string[]; // History of nodes executed
  workflow_variables: Record<string, any>; // Runtime variables
  wait_until?: Date; // For duration/time waits
  wait_for_event?: string; // For event waits
  retry_count: number;
  max_retries: number;
  assigned_variant?: string; // A/B test variant
  started_at: Date;
  last_executed_at?: Date;
  next_execution_at?: Date; // Scheduled execution time
  completed_at?: Date;
}
```

### State Manager API

```typescript
import { StateManager } from '@/lib/workflows';

const stateManager = new StateManager();

// Create workflow state
const state = await stateManager.createWorkflowState({
  enrollmentId,
  campaignId,
  contactId,
  currentNodeId: triggerNode.id,
  workflowStatus: 'running',
  executionPath: [triggerNode.id],
  workflowVariables: {},
  retryCount: 0,
  maxRetries: 3,
});

// Update state
await stateManager.updateWorkflowState(stateId, {
  current_node_id: nextNodeId,
  execution_path: [...state.execution_path, nextNodeId],
});

// Get ready workflows (for scheduler)
const readyWorkflows = await stateManager.getReadyWorkflows(100);

// Pause/resume
await stateManager.pauseWorkflow(stateId);
await stateManager.resumePausedWorkflow(stateId);
```

---

## Event Tracking

All workflow events are logged to `campaign_events` table:

### Event Types

```typescript
type CampaignEventType =
  | 'enrollment_started' | 'enrollment_completed' | 'enrollment_exited'
  | 'email_sent' | 'email_delivered' | 'email_opened' | 'email_clicked' | 'email_replied'
  | 'sms_sent' | 'sms_delivered' | 'sms_replied'
  | 'social_posted' | 'social_engaged'
  | 'webhook_triggered' | 'webhook_succeeded' | 'webhook_failed'
  | 'tag_added' | 'tag_removed'
  | 'score_updated'
  | 'condition_evaluated'
  | 'wait_started' | 'wait_completed'
  | 'variant_assigned';
```

### Event Logger API

```typescript
import { EventLogger } from '@/lib/workflows';

const eventLogger = new EventLogger();

// Log event
await eventLogger.logEvent({
  campaignId,
  enrollmentId,
  contactId,
  eventType: 'email_sent',
  eventSource: 'system',
  nodeId: node.id,
  stepId: step.id,
  eventData: {
    email_id: messageId,
    subject: emailSubject,
  },
});

// Get enrollment events
const events = await eventLogger.getEnrollmentEvents(enrollmentId);

// Get campaign events
const campaignEvents = await eventLogger.getCampaignEvents(campaignId, {
  eventType: 'email_opened',
  startDate: new Date('2026-01-01'),
  limit: 100,
});

// Get event counts
const counts = await eventLogger.getEventCounts(campaignId, [
  'email_sent',
  'email_opened',
  'email_clicked',
]);
```

---

## Workflow Scheduler

Background worker that processes waiting workflows.

### Usage

```typescript
import { WorkflowScheduler } from '@/lib/workflows/WorkflowScheduler';

const scheduler = new WorkflowScheduler({
  batchSize: 100,
  pollingInterval: 60000, // 1 minute
  maxConcurrency: 10,
  enableAutoRetry: true,
});

// Start continuous polling
await scheduler.start();

// Or process once
await scheduler.processWaitingWorkflows();

// Stop gracefully
await scheduler.stop();
```

### Run as Background Process

```bash
# Node.js worker
node dist/lib/workflows/WorkflowScheduler.js

# Or via npm script
npm run workflow-scheduler
```

**Recommended**: Run as systemd service, PM2 process, or cron job (every minute).

---

## API Endpoints

### Start Workflow

```http
POST /api/campaigns/{campaignId}/workflow
Content-Type: application/json

{
  "contact_id": "uuid-here"
}
```

**Response**:
```json
{
  "success": true,
  "workflow_state": {
    "id": "workflow-state-id",
    "enrollment_id": "enrollment-id",
    "status": "running",
    "current_node_id": "node_trigger_1"
  }
}
```

### Get Active Workflows

```http
GET /api/campaigns/{campaignId}/workflow
```

**Response**:
```json
{
  "success": true,
  "workflows": [
    {
      "id": "workflow-id",
      "enrollment_id": "enrollment-id",
      "contact_id": "contact-id",
      "status": "waiting",
      "current_node_id": "node_wait_1",
      "wait_until": "2026-01-28T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Workflow State

```http
GET /api/campaigns/{campaignId}/workflow/{workflowId}
```

**Response**:
```json
{
  "success": true,
  "workflow": {
    "id": "workflow-id",
    "status": "running",
    "current_node_id": "node_email_1",
    "execution_path": ["node_trigger_1", "node_email_1"],
    "variables": {},
    "retry_count": 0,
    "started_at": "2026-01-27T15:30:00Z",
    "last_executed_at": "2026-01-27T15:30:05Z"
  }
}
```

### Pause Workflow

```http
PATCH /api/campaigns/{campaignId}/workflow/{workflowId}
Content-Type: application/json

{
  "action": "pause"
}
```

### Resume Workflow

```http
PATCH /api/campaigns/{campaignId}/workflow/{workflowId}
Content-Type: application/json

{
  "action": "resume"
}
```

---

## Execution Flow

### Standard Flow

1. **Start**: `WorkflowEngine.startWorkflow()` called with campaign + contact
2. **Create State**: StateManager creates workflow_state record
3. **Find Trigger**: Locate trigger node in canvas_data
4. **Execute Node**: Call appropriate executor for node type
5. **Log Event**: EventLogger records execution event
6. **Get Next Node**: Use edges to find next node(s)
7. **Continue or Wait**:
   - **Continue**: Update state, execute next node (step 4)
   - **Wait**: Set wait_until/wait_for_event, status = 'waiting'
   - **Exit**: Set status = 'exited' or 'completed'

### Wait Flow

1. **Wait Node**: WaitExecutor returns `{ wait: true, wait_until: Date }`
2. **Update State**: StateManager sets workflow_status = 'waiting', wait_until = Date
3. **Scheduler**: WorkflowScheduler polls for ready workflows (wait_until <= now)
4. **Resume**: Engine calls `resumeWorkflow(workflowStateId)`
5. **Continue**: Execute next node

### Branching Flow

1. **Condition Node**: ConditionExecutor evaluates branches
2. **Match Found**: Returns `{ branchId: 'branch_true' }`
3. **Get Next Node**: Find edge with sourceHandle = branchId
4. **Continue**: Execute matched branch target

### Split Flow

1. **Split Node**: SplitExecutor assigns variant deterministically
2. **Assign Variant**: Hash contact ID, assign based on percentage
3. **Store Variant**: Update workflow_state.assigned_variant
4. **Return**: Returns `{ variantId: 'variant_a' }`
5. **Get Next Node**: Find edge with sourceHandle = variantId
6. **Continue**: Execute variant target

---

## Retry Logic

### Exponential Backoff

```typescript
// Retry attempts: 3 (configurable)
// Base delay: 1000ms (configurable)

Attempt 1: Delay = 1000ms * 2^0 = 1 second
Attempt 2: Delay = 1000ms * 2^1 = 2 seconds
Attempt 3: Delay = 1000ms * 2^2 = 4 seconds
```

### Failure Handling

- **Transient errors**: Retry with exponential backoff
- **Max retries exceeded**: Set workflow_status = 'failed'
- **Permanent errors**: Immediately fail, no retry
- **All errors**: Logged to workflow_variables.last_error

---

## Variable Replacement

### Email Templates

```typescript
// Available variables
{{first_name}}      // Contact first name
{{last_name}}       // Contact last name
{{email}}           // Contact email
{{company_name}}    // Contact company

// Custom variables (from workflow_variables)
{{custom_field}}    // Any key in workflow_variables
```

**Example**:
```html
Subject: Welcome to {{company_name}}, {{first_name}}!

Hi {{first_name}},

Thanks for joining {{company_name}}!
```

---

## Performance Optimization

### Batch Processing

```typescript
// Scheduler processes in batches
const scheduler = new WorkflowScheduler({
  batchSize: 100,      // Process 100 workflows per batch
  maxConcurrency: 10,  // Max 10 concurrent executions
});
```

### Polling Interval

```typescript
// Adjust based on load
pollingInterval: 60000  // 1 minute (low latency)
pollingInterval: 300000 // 5 minutes (reduced load)
```

### Database Optimization

- Index on `campaign_workflow_states.wait_until`
- Index on `campaign_workflow_states.workflow_status`
- Index on `campaign_events.campaign_id`
- Index on `campaign_events.enrollment_id`

---

## Error Scenarios

### Node Execution Failure

**Scenario**: Email send fails (provider error)

**Handling**:
1. Executor throws error
2. Engine catches, increments retry_count
3. Waits with exponential backoff
4. Retries up to max_retries
5. If all retries fail, sets status = 'failed'

### Timeout

**Scenario**: Node execution exceeds maxExecutionTime

**Handling**:
1. Engine checks elapsed time before each node
2. If exceeded, throws timeout error
3. Workflow marked as 'failed'

### Invalid Configuration

**Scenario**: Condition node has no branches

**Handling**:
1. Executor validates configuration
2. Throws error if invalid
3. Workflow marked as 'failed'
4. Error logged to workflow_variables

---

## Testing

### Unit Tests

```typescript
import { WorkflowEngine } from '@/lib/workflows';
import { mockCampaign, mockContact } from '@/tests/fixtures';

describe('WorkflowEngine', () => {
  it('should execute trigger node', async () => {
    const engine = new WorkflowEngine();
    const state = await engine.startWorkflow(mockCampaign, enrollmentId, contactId);

    expect(state.workflow_status).toBe('running');
    expect(state.current_node_id).toBe('node_trigger_1');
  });

  it('should handle wait nodes', async () => {
    // ... test wait logic
  });
});
```

### Integration Tests

Test complete workflows end-to-end with real database.

### Load Tests

Use WorkflowScheduler to process large batches of waiting workflows.

---

## Monitoring

### Key Metrics

- **Active workflows**: Count of workflows in 'running' or 'waiting' state
- **Completion rate**: % of workflows reaching 'completed' state
- **Failure rate**: % of workflows reaching 'failed' state
- **Average execution time**: Time from start to completion
- **Wait time**: Time spent in 'waiting' state
- **Retry rate**: % of nodes requiring retries

### Queries

```sql
-- Active workflows
SELECT COUNT(*) FROM campaign_workflow_states
WHERE workflow_status IN ('running', 'waiting');

-- Completion rate (last 24 hours)
SELECT
  COUNT(CASE WHEN workflow_status = 'completed' THEN 1 END) * 100.0 / COUNT(*) AS completion_rate
FROM campaign_workflow_states
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Average execution time
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_seconds
FROM campaign_workflow_states
WHERE completed_at IS NOT NULL;
```

---

## Production Deployment

### Requirements

1. **Database**: Supabase PostgreSQL with schema from migration 200
2. **Background Worker**: WorkflowScheduler running as systemd service or PM2 process
3. **Environment**: `ANTHROPIC_API_KEY`, `SENDGRID_API_KEY` (or email provider)
4. **Monitoring**: CloudWatch/Datadog alerts on failure rate

### Deployment Steps

1. Run migration `200_social_drip_campaigns.sql`
2. Deploy workflow engine code
3. Start WorkflowScheduler as background service
4. Monitor logs and metrics
5. Scale scheduler based on load (multiple workers)

### Scaling

- **Horizontal**: Run multiple WorkflowScheduler instances
- **Vertical**: Increase batchSize and maxConcurrency
- **Database**: Read replicas for state queries

---

## Next Steps

1. ✅ Workflow engine complete
2. ⏭️  Multi-channel integration (Unite-Hub-ove.3.4)
3. ⏭️  A/B testing statistical analysis (Unite-Hub-ove.3.5)
4. ⏭️  Event-based wait triggers (webhook integration)
5. ⏭️  Real-time workflow monitoring UI

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.3.3
**Next**: Unite-Hub-ove.3.4 (Multi-Channel Integration)

**Components Created**: 14 TypeScript modules (1 engine, 7 executors, 2 managers, 1 scheduler, 3 API routes)
**Lines of Code**: 2,200+ lines
**Dependencies**: Supabase, Anthropic API, Email Service

