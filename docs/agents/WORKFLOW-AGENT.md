# WORKFLOW/AUTOMATION AGENT SPECIFICATION

**Agent Name**: Workflow/Automation Agent
**Agent Type**: Infrastructure Agent
**Priority**: P1 (Week 4)
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `webhook_events` - External webhook event tracking (Stripe, third-party integrations)
- `audit_logs` - System event audit trail (all agent actions)
- `approvals` - Approval workflow tracking
- `campaign_execution_logs` - Campaign step execution history (read-only)
- `interactions` - Contact interaction history (read-only)

### Agent Purpose
The Workflow/Automation Agent is the **central nervous system** of Unite-Hub's automation infrastructure. It orchestrates trigger-based workflows, manages webhook integrations, coordinates approval processes, and maintains comprehensive audit trails. This agent enables Zapier-style if/then automation, event routing between agents, and workflow coordination across the platform.

### Agent Responsibilities
1. **Trigger-Based Automation**: Execute workflows based on system events (email sent, contact scored, campaign step completed)
2. **Webhook Management**: Process incoming webhooks from external services (Stripe, Gmail, third-party CRMs)
3. **Event Routing**: Route events to appropriate specialist agents (Campaign, Email, Contact, Content)
4. **Approval Workflows**: Manage multi-step approval processes (content review, design approval, budget approval)
5. **Audit Logging**: Record all system actions with detailed context for compliance and debugging
6. **Workflow Builder**: Create/manage if/then workflow rules with conditional logic
7. **Idempotency Protection**: Prevent duplicate webhook processing using event deduplication

---

## 2. PURPOSE & SCOPE

### Core Responsibilities

#### IN SCOPE ✅
- Trigger-based workflow automation (if contact score > 80, then enroll in campaign)
- Webhook event processing (Stripe payments, Gmail notifications, CRM syncs)
- Approval workflow coordination (content approval, design review, budget sign-off)
- System-wide audit logging (all agent actions, user actions, system events)
- Event deduplication and idempotency
- Multi-step workflow execution with conditional branching
- Workflow template library (common automation patterns)
- Event retry logic with exponential backoff
- Cross-agent event routing

#### OUT OF SCOPE ❌
- Email sending (handled by Email Agent)
- Contact scoring (handled by Contact Agent)
- Content generation (handled by Content Agent)
- Campaign step execution (handled by Campaign Agent)
- Real-time collaboration features (Phase 3)
- Advanced workflow versioning (Phase 3)
- Workflow marketplace (Phase 3)

### Integration Touchpoints
- **Campaign Agent**: Trigger workflows on campaign events (step completed, contact enrolled, campaign finished)
- **Email Agent**: Trigger workflows on email events (sent, opened, clicked, bounced)
- **Contact Agent**: Trigger workflows on contact events (score changed, status updated, tag added)
- **Content Agent**: Trigger workflows on content events (draft created, content approved, content sent)
- **Analytics Agent**: Provide workflow execution metrics (success rate, average duration, failure rate)
- **Orchestrator Agent**: Receive workflow execution requests and report results

---

## 3. DATABASE SCHEMA MAPPING

### webhook_events Table
```typescript
interface WebhookEvent {
  id: number; // BIGSERIAL - Auto-incrementing ID
  stripe_event_id: string; // TEXT UNIQUE - Unique event identifier (for Stripe webhooks)
  event_type: string; // TEXT - Event type (e.g., 'payment_intent.succeeded', 'customer.subscription.created')
  status: 'processed' | 'failed' | 'pending'; // TEXT - Processing status
  error_message?: string | null; // TEXT - Error details if processing failed
  raw_event?: Record<string, any> | null; // JSONB - Full webhook payload for debugging
  processed_at?: Date | null; // TIMESTAMPTZ - When event was successfully processed
  created_at: Date; // TIMESTAMPTZ - When event was received
}

// Indexes:
// - idx_webhook_stripe_event ON webhook_events(stripe_event_id)
// - idx_webhook_status ON webhook_events(status)
// - idx_webhook_type ON webhook_events(event_type)
// - idx_webhook_created ON webhook_events(created_at DESC)
```

### audit_logs Table
```typescript
interface AuditLog {
  id: string; // UUID
  org_id: string; // UUID - References organizations.id
  action: string; // TEXT - Action performed (e.g., 'contact.created', 'email.sent', 'campaign.started')
  resource: string; // TEXT - Resource type (e.g., 'contact', 'email', 'campaign')
  resource_id?: string | null; // TEXT - ID of the resource affected
  agent: string; // TEXT - Agent that performed the action (e.g., 'email-agent', 'campaign-agent', 'user')
  status: 'success' | 'error' | 'warning'; // TEXT - Action status
  error_message?: string | null; // TEXT - Error details if status = 'error'
  details: Record<string, any>; // JSONB - Additional context (request params, response data, etc.)
  created_at: Date; // TIMESTAMPTZ - When action occurred
}

// Indexes:
// - idx_audit_logs_org_id ON audit_logs(org_id)
// - idx_audit_logs_created_at ON audit_logs(created_at DESC)
```

### approvals Table
```typescript
interface Approval {
  id: string; // UUID
  org_id: string; // UUID - References organizations.id
  project_id?: string | null; // UUID - References projects.id (optional)
  title: string; // TEXT - Approval title (e.g., "Q4 Campaign Email Design")
  description?: string | null; // TEXT - Approval description
  client_name?: string | null; // TEXT - Client name (if applicable)
  type: 'design' | 'content' | 'video' | 'document'; // TEXT - Approval type
  priority: 'high' | 'medium' | 'low'; // TEXT - Approval priority
  status: 'pending' | 'approved' | 'declined'; // TEXT - Approval status
  asset_url?: string | null; // TEXT - URL to asset being approved
  submitted_by_id?: string | null; // UUID - References team_members.id
  submitted_by_name: string; // TEXT - Submitter name
  reviewed_by_id?: string | null; // UUID - References team_members.id
  reviewed_at?: Date | null; // TIMESTAMPTZ - When approval was reviewed
  decline_reason?: string | null; // TEXT - Reason for decline (if declined)
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
}

// Indexes:
// - idx_approvals_org_id ON approvals(org_id)
// - idx_approvals_project_id ON approvals(project_id)
// - idx_approvals_status ON approvals(status)
// - idx_approvals_priority ON approvals(priority)
// - idx_approvals_created_at ON approvals(created_at DESC)
```

### Workflow Rule Schema (Virtual - Stored in audit_logs.details)
```typescript
interface WorkflowRule {
  id: string; // UUID - Workflow rule ID
  org_id: string; // UUID
  workspace_id: string; // UUID
  name: string; // Workflow name (e.g., "Auto-enroll hot leads in nurture campaign")
  description?: string; // Workflow description
  trigger: WorkflowTrigger; // When to execute workflow
  conditions: WorkflowCondition[]; // If conditions (all must match)
  actions: WorkflowAction[]; // Then actions (execute in order)
  is_active: boolean; // Whether workflow is enabled
  execution_count: number; // Number of times workflow has run
  last_executed_at?: Date | null; // Last execution timestamp
  created_at: Date;
  updated_at: Date;
}

interface WorkflowTrigger {
  event_type:
    | 'contact.score_changed'
    | 'contact.status_changed'
    | 'contact.tag_added'
    | 'email.sent'
    | 'email.opened'
    | 'email.clicked'
    | 'campaign.step_completed'
    | 'campaign.enrollment_completed'
    | 'content.draft_created'
    | 'approval.submitted'
    | 'approval.approved'
    | 'approval.declined'
    | 'webhook.received';
  resource: string; // Resource type (e.g., 'contact', 'email', 'campaign')
}

interface WorkflowCondition {
  field: string; // Field to check (e.g., 'ai_score', 'status', 'tags')
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal'
    | 'less_than_or_equal'
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in';
  value: any; // Value to compare against
}

interface WorkflowAction {
  action_type:
    | 'enroll_in_campaign'
    | 'send_email'
    | 'update_contact_status'
    | 'add_contact_tag'
    | 'remove_contact_tag'
    | 'update_contact_score'
    | 'create_approval'
    | 'send_webhook'
    | 'notify_team'
    | 'wait_delay';
  params: Record<string, any>; // Action-specific parameters
}
```

---

## 4. CORE FUNCTIONS

### 4.1 createWorkflow()
**Purpose**: Create a new automation workflow with trigger, conditions, and actions.

**Input**:
```typescript
interface CreateWorkflowRequest {
  org_id: string; // UUID
  workspace_id: string; // UUID
  name: string; // Workflow name
  description?: string; // Workflow description
  trigger: WorkflowTrigger; // When to execute
  conditions: WorkflowCondition[]; // If conditions
  actions: WorkflowAction[]; // Then actions
  is_active: boolean; // Whether to activate immediately
}
```

**Output**:
```typescript
interface CreateWorkflowResult {
  success: boolean;
  workflow_id: string; // UUID
  validation_errors?: string[]; // Array of validation errors (if any)
  audit_log_id: string; // UUID - Reference to audit log entry
}
```

**Business Logic**:
1. **Validate trigger**: Ensure event_type is supported and resource is valid
2. **Validate conditions**: Check field names, operators, and value types are compatible
3. **Validate actions**: Ensure action types are supported and params are valid
4. **Store workflow rule**: Save in audit_logs table with action='workflow.created' and rule in details JSON
5. **Audit log**: Record workflow creation in audit_logs
6. **Return workflow ID**: Return UUID for reference

**Error Codes**:
- `WORKFLOW_001`: Invalid trigger event type
- `WORKFLOW_002`: Invalid condition field or operator
- `WORKFLOW_003`: Invalid action type or parameters
- `WORKFLOW_004`: Workflow name already exists in workspace

---

### 4.2 executeWorkflow()
**Purpose**: Execute a workflow when triggered by a system event.

**Input**:
```typescript
interface ExecuteWorkflowRequest {
  workflow_id: string; // UUID
  event_context: {
    event_type: string; // Triggering event (e.g., 'contact.score_changed')
    resource_id: string; // Resource ID (e.g., contact UUID)
    resource_data: Record<string, any>; // Current resource state
    org_id: string; // UUID
    workspace_id: string; // UUID
    triggered_by?: string; // User/agent that triggered event
  };
}
```

**Output**:
```typescript
interface ExecuteWorkflowResult {
  success: boolean;
  execution_id: string; // UUID - Unique execution ID
  conditions_met: boolean; // Whether all conditions matched
  actions_executed: {
    action_type: string;
    success: boolean;
    result?: any;
    error?: string;
  }[];
  execution_duration_ms: number; // Total execution time
  audit_log_id: string; // UUID
}
```

**Business Logic**:
1. **Fetch workflow rule**: Get workflow from audit_logs where action='workflow.created' and details.id = workflow_id
2. **Check if active**: Skip if workflow.is_active = false
3. **Evaluate conditions**: Check all conditions against event_context.resource_data
   - If ANY condition fails, set conditions_met = false and skip actions
4. **Execute actions sequentially**: For each action in workflow.actions array:
   - **enroll_in_campaign**: Call Campaign Agent's enrollContacts()
   - **send_email**: Call Email Agent's sendEmail()
   - **update_contact_status**: Call Contact Agent's updateContact()
   - **add_contact_tag**: Call Contact Agent's addTag()
   - **create_approval**: Insert into approvals table
   - **send_webhook**: POST to external URL with event data
   - **wait_delay**: Add delay to workflow execution queue (background job)
5. **Audit log**: Record workflow execution in audit_logs with full execution trace
6. **Return execution result**: Return success status and action results

**Performance Requirements**:
- Workflow evaluation: < 100ms
- Total execution: < 5 seconds (excluding wait_delay actions)
- Concurrent workflows: Support 50+ simultaneous executions

**Error Codes**:
- `WORKFLOW_005`: Workflow not found
- `WORKFLOW_006`: Workflow evaluation error (invalid condition)
- `WORKFLOW_007`: Action execution failed (partial failure)
- `WORKFLOW_008`: Workflow execution timeout (> 30 seconds)

---

### 4.3 processWebhook()
**Purpose**: Process incoming webhook from external service with idempotency protection.

**Input**:
```typescript
interface ProcessWebhookRequest {
  provider: 'stripe' | 'gmail' | 'hubspot' | 'salesforce' | 'zapier' | 'custom'; // Webhook provider
  event_id: string; // Unique event ID (for idempotency)
  event_type: string; // Event type (e.g., 'payment_intent.succeeded')
  raw_payload: Record<string, any>; // Full webhook payload
  signature?: string; // Webhook signature for verification (optional)
}
```

**Output**:
```typescript
interface ProcessWebhookResult {
  success: boolean;
  webhook_event_id: number; // BIGSERIAL - Database record ID
  already_processed: boolean; // True if webhook was duplicate (idempotency check)
  workflows_triggered: number; // Number of workflows executed
  error?: string; // Error message if processing failed
}
```

**Business Logic**:
1. **Idempotency check**: Check if event_id exists in webhook_events table
   - If exists with status='processed', return already_processed=true and skip processing
   - If exists with status='pending' or 'failed', retry processing
2. **Insert webhook event**: Create record in webhook_events with status='pending'
3. **Verify signature**: If signature provided, verify using provider's secret key
4. **Parse event data**: Extract relevant fields from raw_payload
5. **Find matching workflows**: Query audit_logs for workflows with trigger.event_type = 'webhook.received' and conditions matching event data
6. **Execute workflows**: Call executeWorkflow() for each matching workflow
7. **Update webhook status**: Set status='processed' and processed_at=NOW()
8. **Audit log**: Record webhook processing in audit_logs
9. **Return result**: Return webhook_event_id and workflows_triggered count

**Idempotency Strategy**:
- Use unique event_id (Stripe event ID, Gmail message ID, etc.)
- Create database record BEFORE processing
- Mark as 'processed' only after successful completion
- Retry 'failed' events with exponential backoff

**Performance Requirements**:
- Idempotency check: < 10ms (indexed lookup)
- Signature verification: < 50ms
- Total processing: < 2 seconds (excluding workflow execution)

**Error Codes**:
- `WORKFLOW_009`: Invalid webhook signature
- `WORKFLOW_010`: Webhook parsing error (invalid JSON)
- `WORKFLOW_011`: Webhook processing timeout
- `WORKFLOW_012`: Duplicate webhook event (idempotency violation)

---

### 4.4 createApproval()
**Purpose**: Create a new approval request for content, design, or documents.

**Input**:
```typescript
interface CreateApprovalRequest {
  org_id: string; // UUID
  project_id?: string; // UUID - Optional project link
  title: string; // Approval title
  description?: string; // Approval description
  client_name?: string; // Client name (if applicable)
  type: 'design' | 'content' | 'video' | 'document'; // Approval type
  priority: 'high' | 'medium' | 'low'; // Approval priority
  asset_url?: string; // URL to asset being approved
  submitted_by_id?: string; // UUID - Team member ID
  submitted_by_name: string; // Submitter name
  auto_approve_after_hours?: number; // Auto-approve if no response after N hours (optional)
}
```

**Output**:
```typescript
interface CreateApprovalResult {
  success: boolean;
  approval_id: string; // UUID
  approval_url: string; // URL for approval page (e.g., /dashboard/approvals/{id})
  audit_log_id: string; // UUID
}
```

**Business Logic**:
1. **Validate input**: Ensure required fields are present and valid
2. **Create approval**: Insert into approvals table with status='pending'
3. **Trigger workflows**: Execute workflows with trigger='approval.submitted'
4. **Send notification**: Notify team members with approval permission
5. **Schedule auto-approve**: If auto_approve_after_hours specified, create background job
6. **Audit log**: Record approval creation in audit_logs
7. **Return approval ID and URL**: Return UUID and dashboard URL

**Performance Requirements**:
- Approval creation: < 200ms
- Notification send: < 1 second

**Error Codes**:
- `WORKFLOW_013`: Invalid approval type
- `WORKFLOW_014`: Asset URL not accessible
- `WORKFLOW_015`: Submitted by user not found

---

### 4.5 updateApprovalStatus()
**Purpose**: Approve or decline an approval request.

**Input**:
```typescript
interface UpdateApprovalStatusRequest {
  approval_id: string; // UUID
  org_id: string; // UUID
  status: 'approved' | 'declined'; // New status
  reviewed_by_id?: string; // UUID - Team member ID
  decline_reason?: string; // Required if status='declined'
}
```

**Output**:
```typescript
interface UpdateApprovalStatusResult {
  success: boolean;
  approval: Approval; // Updated approval record
  workflows_triggered: number; // Number of workflows executed
  audit_log_id: string; // UUID
}
```

**Business Logic**:
1. **Fetch approval**: Get approval record from database
2. **Validate status**: Ensure approval is still 'pending' (can't update approved/declined approvals)
3. **Validate decline reason**: If status='declined', ensure decline_reason is provided
4. **Update approval**: Set status, reviewed_by_id, reviewed_at, decline_reason
5. **Trigger workflows**: Execute workflows with trigger='approval.approved' or 'approval.declined'
6. **Send notification**: Notify submitter of approval decision
7. **Audit log**: Record approval update in audit_logs
8. **Return updated approval**: Return full approval record

**Performance Requirements**:
- Status update: < 200ms
- Notification send: < 1 second

**Error Codes**:
- `WORKFLOW_016`: Approval not found
- `WORKFLOW_017`: Approval already reviewed
- `WORKFLOW_018`: Decline reason required
- `WORKFLOW_019`: Unauthorized to approve (wrong org_id)

---

### 4.6 logAuditEvent()
**Purpose**: Record a system action in the audit log for compliance and debugging.

**Input**:
```typescript
interface LogAuditEventRequest {
  org_id: string; // UUID
  action: string; // Action performed (e.g., 'contact.created', 'email.sent')
  resource: string; // Resource type (e.g., 'contact', 'email')
  resource_id?: string; // Resource ID
  agent: string; // Agent name (e.g., 'email-agent', 'user')
  status: 'success' | 'error' | 'warning'; // Action status
  error_message?: string; // Error details (if status='error')
  details?: Record<string, any>; // Additional context (request/response data)
}
```

**Output**:
```typescript
interface LogAuditEventResult {
  success: boolean;
  audit_log_id: string; // UUID
}
```

**Business Logic**:
1. **Validate input**: Ensure required fields are present
2. **Sanitize details**: Remove sensitive data (passwords, API keys, tokens)
3. **Insert audit log**: Create record in audit_logs table
4. **Return audit log ID**: Return UUID for reference

**Performance Requirements**:
- Audit log insert: < 50ms (non-blocking, can be async)
- Batch inserts: Support 1000+ logs per second

**Error Codes**:
- `WORKFLOW_020`: Invalid org_id
- `WORKFLOW_021`: Audit log insert failed (database error)

---

### 4.7 getWorkflowExecutions()
**Purpose**: Retrieve workflow execution history with filtering and pagination.

**Input**:
```typescript
interface GetWorkflowExecutionsRequest {
  org_id: string; // UUID
  workspace_id?: string; // UUID - Filter by workspace (optional)
  workflow_id?: string; // UUID - Filter by workflow (optional)
  status?: 'success' | 'error' | 'warning'; // Filter by status (optional)
  start_date?: Date; // Filter by date range (optional)
  end_date?: Date; // Filter by date range (optional)
  page: number; // Page number (1-indexed)
  page_size: number; // Results per page (max 100)
}
```

**Output**:
```typescript
interface GetWorkflowExecutionsResult {
  success: boolean;
  executions: {
    execution_id: string; // UUID
    workflow_id: string; // UUID
    workflow_name: string; // Workflow name
    event_type: string; // Triggering event
    conditions_met: boolean; // Whether conditions matched
    actions_executed: number; // Number of actions executed
    status: 'success' | 'error' | 'warning'; // Execution status
    execution_duration_ms: number; // Execution time
    created_at: Date; // Execution timestamp
  }[];
  total_count: number; // Total matching executions
  page: number; // Current page
  page_size: number; // Results per page
  total_pages: number; // Total pages
}
```

**Business Logic**:
1. **Validate pagination**: Ensure page >= 1 and page_size <= 100
2. **Build query**: Filter audit_logs where action='workflow.executed' and org_id matches
3. **Apply filters**: Add WHERE clauses for workspace_id, workflow_id, status, date range
4. **Fetch executions**: Query with LIMIT/OFFSET for pagination
5. **Count total**: Get total count for pagination metadata
6. **Parse execution data**: Extract workflow execution details from audit_logs.details JSON
7. **Return results**: Return executions array with pagination metadata

**Performance Requirements**:
- Query execution: < 300ms (with indexes)
- Pagination: Support 10,000+ total executions

**Error Codes**:
- `WORKFLOW_022`: Invalid pagination parameters
- `WORKFLOW_023`: Query execution timeout

---

### 4.8 retryFailedWebhook()
**Purpose**: Retry processing a failed webhook event with exponential backoff.

**Input**:
```typescript
interface RetryFailedWebhookRequest {
  webhook_event_id: number; // BIGSERIAL - Database record ID
  retry_attempt: number; // Current retry attempt (1-indexed)
}
```

**Output**:
```typescript
interface RetryFailedWebhookResult {
  success: boolean;
  status: 'processed' | 'failed' | 'pending'; // New status
  workflows_triggered: number; // Number of workflows executed
  next_retry_at?: Date; // Next retry timestamp (if still failing)
  error?: string; // Error message if retry failed
}
```

**Business Logic**:
1. **Fetch webhook event**: Get webhook_events record by ID
2. **Check retry limit**: Max 5 retries (exponential backoff: 1min, 5min, 15min, 1hr, 6hr)
3. **Calculate next retry**: If retry_attempt < 5, calculate next retry timestamp
4. **Reprocess webhook**: Call processWebhook() with raw_event payload
5. **Update status**: Set status='processed' if successful, or 'failed' if still failing
6. **Schedule next retry**: If still failing and retry_attempt < 5, create background job
7. **Audit log**: Record retry attempt in audit_logs
8. **Return result**: Return success status and next retry timestamp

**Retry Schedule (Exponential Backoff)**:
- Retry 1: 1 minute after failure
- Retry 2: 5 minutes after failure
- Retry 3: 15 minutes after failure
- Retry 4: 1 hour after failure
- Retry 5: 6 hours after failure
- After 5 failures: Mark as permanently failed, send alert to admin

**Performance Requirements**:
- Retry processing: Same as initial webhook processing

**Error Codes**:
- `WORKFLOW_024`: Webhook event not found
- `WORKFLOW_025`: Retry limit exceeded (> 5 attempts)
- `WORKFLOW_026`: Webhook retry timeout

---

## 5. API ENDPOINTS

### POST /api/workflows/create
**Description**: Create a new automation workflow.

**Request**:
```json
{
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "Auto-enroll hot leads in nurture campaign",
  "description": "When a contact's AI score reaches 80 or above, automatically enroll them in the Q4 nurture campaign",
  "trigger": {
    "event_type": "contact.score_changed",
    "resource": "contact"
  },
  "conditions": [
    {
      "field": "ai_score",
      "operator": "greater_than_or_equal",
      "value": 0.80
    },
    {
      "field": "status",
      "operator": "equals",
      "value": "lead"
    }
  ],
  "actions": [
    {
      "action_type": "enroll_in_campaign",
      "params": {
        "campaign_id": "770e8400-e29b-41d4-a716-446655440000"
      }
    },
    {
      "action_type": "add_contact_tag",
      "params": {
        "tag": "auto-enrolled-q4-nurture"
      }
    }
  ],
  "is_active": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "workflow_id": "880e8400-e29b-41d4-a716-446655440000",
  "validation_errors": null,
  "audit_log_id": "990e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "WORKFLOW_002",
  "message": "Invalid condition field: 'unknown_field' not found in contact schema",
  "validation_errors": [
    "Condition field 'unknown_field' is not valid for resource 'contact'"
  ]
}
```

---

### POST /api/workflows/execute
**Description**: Execute a workflow (triggered by system event).

**Request**:
```json
{
  "workflow_id": "880e8400-e29b-41d4-a716-446655440000",
  "event_context": {
    "event_type": "contact.score_changed",
    "resource_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "resource_data": {
      "id": "aa0e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Johnson",
      "email": "sarah.johnson@techcorp.com.au",
      "ai_score": 0.85,
      "status": "lead",
      "previous_score": 0.72
    },
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "workspace_id": "660e8400-e29b-41d4-a716-446655440000",
    "triggered_by": "contact-agent"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "execution_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "conditions_met": true,
  "actions_executed": [
    {
      "action_type": "enroll_in_campaign",
      "success": true,
      "result": {
        "enrollment_id": "cc0e8400-e29b-41d4-a716-446655440000"
      }
    },
    {
      "action_type": "add_contact_tag",
      "success": true,
      "result": {
        "tags": ["hot-lead", "auto-enrolled-q4-nurture"]
      }
    }
  ],
  "execution_duration_ms": 342,
  "audit_log_id": "dd0e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": "WORKFLOW_007",
  "message": "Action execution failed: Campaign enrollment failed due to contact already enrolled",
  "execution_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "conditions_met": true,
  "actions_executed": [
    {
      "action_type": "enroll_in_campaign",
      "success": false,
      "error": "CAMPAIGN_008: Contact already enrolled in campaign"
    }
  ],
  "execution_duration_ms": 245
}
```

---

### POST /api/webhooks/process
**Description**: Process incoming webhook from external service.

**Request**:
```json
{
  "provider": "stripe",
  "event_id": "evt_1PqR2s3T4u5V6w7X8y9Z",
  "event_type": "payment_intent.succeeded",
  "raw_payload": {
    "id": "evt_1PqR2s3T4u5V6w7X8y9Z",
    "object": "event",
    "data": {
      "object": {
        "id": "pi_1PqR2s3T4u5V6w7X8y9Z",
        "amount": 29900,
        "currency": "aud",
        "customer": "cus_ABC123",
        "metadata": {
          "org_id": "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }
  },
  "signature": "t=1234567890,v1=abc123def456..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "webhook_event_id": 12345,
  "already_processed": false,
  "workflows_triggered": 2
}
```

**Idempotency Response** (200 OK):
```json
{
  "success": true,
  "webhook_event_id": 12345,
  "already_processed": true,
  "workflows_triggered": 0
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "WORKFLOW_009",
  "message": "Invalid webhook signature: Signature verification failed"
}
```

---

### POST /api/approvals/create
**Description**: Create a new approval request.

**Request**:
```json
{
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "title": "Q4 Email Campaign Design",
  "description": "Design for Q4 nurture campaign email series (3 emails)",
  "client_name": "TechCorp Australia",
  "type": "design",
  "priority": "high",
  "asset_url": "https://unite-hub.s3.amazonaws.com/designs/q4-campaign-v2.pdf",
  "submitted_by_id": "ff0e8400-e29b-41d4-a716-446655440000",
  "submitted_by_name": "Emily Chen",
  "auto_approve_after_hours": 48
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "approval_id": "gg0e8400-e29b-41d4-a716-446655440000",
  "approval_url": "/dashboard/approvals/gg0e8400-e29b-41d4-a716-446655440000",
  "audit_log_id": "hh0e8400-e29b-41d4-a716-446655440000"
}
```

---

### PATCH /api/approvals/:approval_id/status
**Description**: Approve or decline an approval request.

**Request**:
```json
{
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "approved",
  "reviewed_by_id": "ii0e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "approval": {
    "id": "gg0e8400-e29b-41d4-a716-446655440000",
    "org_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "ee0e8400-e29b-41d4-a716-446655440000",
    "title": "Q4 Email Campaign Design",
    "type": "design",
    "status": "approved",
    "reviewed_by_id": "ii0e8400-e29b-41d4-a716-446655440000",
    "reviewed_at": "2025-11-18T14:30:00.000Z",
    "created_at": "2025-11-18T10:15:00.000Z",
    "updated_at": "2025-11-18T14:30:00.000Z"
  },
  "workflows_triggered": 1,
  "audit_log_id": "jj0e8400-e29b-41d4-a716-446655440000"
}
```

**Decline Request**:
```json
{
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "declined",
  "reviewed_by_id": "ii0e8400-e29b-41d4-a716-446655440000",
  "decline_reason": "Email design doesn't match brand guidelines - logo placement incorrect, color scheme too dark"
}
```

---

### GET /api/workflows/executions
**Description**: Retrieve workflow execution history with filtering.

**Request Query Parameters**:
```
GET /api/workflows/executions?org_id=550e8400-e29b-41d4-a716-446655440000&workspace_id=660e8400-e29b-41d4-a716-446655440000&status=error&page=1&page_size=20
```

**Response** (200 OK):
```json
{
  "success": true,
  "executions": [
    {
      "execution_id": "kk0e8400-e29b-41d4-a716-446655440000",
      "workflow_id": "880e8400-e29b-41d4-a716-446655440000",
      "workflow_name": "Auto-enroll hot leads in nurture campaign",
      "event_type": "contact.score_changed",
      "conditions_met": true,
      "actions_executed": 1,
      "status": "error",
      "execution_duration_ms": 245,
      "created_at": "2025-11-18T13:45:00.000Z"
    }
  ],
  "total_count": 87,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

---

### POST /api/audit-logs/create
**Description**: Create a new audit log entry (called by other agents).

**Request**:
```json
{
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "email.sent",
  "resource": "email",
  "resource_id": "ll0e8400-e29b-41d4-a716-446655440000",
  "agent": "email-agent",
  "status": "success",
  "details": {
    "to": "sarah.johnson@techcorp.com.au",
    "subject": "Q4 Product Update",
    "provider": "sendgrid",
    "message_id": "msg_abc123"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "audit_log_id": "mm0e8400-e29b-41d4-a716-446655440000"
}
```

---

## 6. INTEGRATION POINTS

### Inputs (What This Agent Receives)

1. **From Campaign Agent**:
   - Campaign step completed events (trigger workflows)
   - Campaign enrollment events (trigger workflows)
   - Campaign status change events (trigger workflows)

2. **From Email Agent**:
   - Email sent events (trigger workflows)
   - Email opened events (trigger workflows)
   - Email clicked events (trigger workflows)
   - Email bounced events (trigger workflows)

3. **From Contact Agent**:
   - Contact score changed events (trigger workflows)
   - Contact status changed events (trigger workflows)
   - Contact tag added events (trigger workflows)
   - Contact created events (trigger workflows)

4. **From Content Agent**:
   - Content draft created events (trigger workflows)
   - Content approved events (trigger workflows)

5. **From External Services**:
   - Stripe webhooks (payment events, subscription events)
   - Gmail webhooks (new email notifications)
   - HubSpot webhooks (CRM sync events)
   - Salesforce webhooks (CRM sync events)

6. **From Orchestrator Agent**:
   - Workflow creation requests
   - Workflow execution requests
   - Approval creation requests
   - Audit log queries

### Outputs (What This Agent Provides)

1. **To Campaign Agent**:
   - Enroll contact in campaign (via executeWorkflow action)
   - Update campaign status (via executeWorkflow action)

2. **To Email Agent**:
   - Send email (via executeWorkflow action)
   - Update email tracking (via executeWorkflow action)

3. **To Contact Agent**:
   - Update contact status (via executeWorkflow action)
   - Add/remove contact tags (via executeWorkflow action)
   - Update contact score (via executeWorkflow action)

4. **To Content Agent**:
   - Generate content (via executeWorkflow action)
   - Approve content (via executeWorkflow action)

5. **To Analytics Agent**:
   - Workflow execution metrics (success rate, duration, failure rate)
   - Audit log data (all system events for reporting)
   - Approval metrics (approval time, approval rate)

6. **To All Agents**:
   - Audit logging service (logAuditEvent function)
   - Workflow execution coordination (executeWorkflow function)
   - Approval workflow management (createApproval, updateApprovalStatus)

### Event-Driven Triggers

**Workflow Triggers** (event → action):
- `contact.score_changed` → Enroll in campaign if score >= 80
- `email.opened` → Add tag "engaged" and increase score by 5
- `campaign.step_completed` → Check if contact clicked, if yes enroll in hot leads campaign
- `approval.submitted` → Send Slack notification to approvers
- `approval.approved` → Send email to submitter with approval confirmation
- `webhook.received` (Stripe payment) → Update organization plan status

**Webhook Events**:
- Stripe: `payment_intent.succeeded`, `customer.subscription.created`, `invoice.paid`
- Gmail: `message.received`, `message.sent`
- HubSpot: `contact.created`, `deal.updated`
- Salesforce: `lead.created`, `opportunity.updated`

---

## 7. BUSINESS RULES

### Workflow Execution Rules

1. **Condition Evaluation**:
   - ALL conditions must match for actions to execute (AND logic)
   - If any condition fails, skip all actions and log as "conditions_not_met"
   - Support nested conditions in Phase 2 (OR logic, grouped conditions)

2. **Action Execution Order**:
   - Execute actions sequentially in array order
   - If action fails, continue to next action (partial failure allowed)
   - If critical action fails (marked with `is_critical: true`), abort remaining actions

3. **Workflow State**:
   - Workflows can be active or inactive (is_active flag)
   - Inactive workflows are not evaluated (skip immediately)
   - Workflow changes take effect immediately (no delay)

4. **Retry Logic**:
   - Failed actions are NOT automatically retried (workflow-level retry only)
   - Failed webhooks are retried with exponential backoff (5 attempts max)
   - Permanent failures (after 5 retries) trigger admin alert

### Webhook Processing Rules

1. **Idempotency Protection**:
   - ALWAYS check event_id before processing
   - If event_id exists with status='processed', return 200 OK with already_processed=true
   - If event_id exists with status='pending', wait for processing to complete (poll or retry)

2. **Signature Verification**:
   - ALWAYS verify webhook signature if signature is provided
   - Use provider-specific secret key (Stripe webhook secret, etc.)
   - Reject webhooks with invalid signature (return 400 Bad Request)

3. **Webhook Retention**:
   - Keep webhook_events records for 90 days
   - Auto-delete records older than 90 days (daily cleanup job)
   - Archive critical webhooks (payments, subscriptions) before deletion

### Approval Workflow Rules

1. **Approval Status Transitions**:
   - `pending` → `approved` ✅ (valid)
   - `pending` → `declined` ✅ (valid)
   - `approved` → `declined` ❌ (invalid - cannot change approved decision)
   - `declined` → `approved` ❌ (invalid - cannot change declined decision)

2. **Approval Permissions**:
   - Only team members with `approver` role can approve/decline
   - Submitters CANNOT approve their own submissions
   - Admin role can override any approval decision

3. **Auto-Approval**:
   - If no response after `auto_approve_after_hours`, automatically approve
   - Send notification 6 hours before auto-approval deadline
   - Auto-approval only applies to `low` and `medium` priority approvals (NOT `high`)

4. **Decline Reasons**:
   - REQUIRED for all declined approvals
   - Minimum 10 characters
   - Stored in `decline_reason` field for audit trail

### Audit Logging Rules

1. **What to Log**:
   - ALL write operations (create, update, delete)
   - Authentication events (login, logout, failed login)
   - Permission changes (role updates, access grants)
   - Workflow executions (with full execution trace)
   - Webhook events (with full payload)
   - API errors (with error details)

2. **What NOT to Log**:
   - Read operations (SELECT queries) - too verbose
   - Health check pings - creates noise
   - Static file requests - not relevant

3. **Sensitive Data Sanitization**:
   - NEVER log passwords, API keys, tokens, or secrets
   - Mask email addresses in non-production environments (test@***.com)
   - Redact credit card numbers (show last 4 digits only)

4. **Log Retention**:
   - Keep audit_logs indefinitely (compliance requirement)
   - Archive logs older than 2 years to cold storage
   - Support full-text search on logs for 1 year

---

## 8. PERFORMANCE REQUIREMENTS

### Response Time Targets

| Function | Target | Maximum | Notes |
|----------|--------|---------|-------|
| createWorkflow() | < 200ms | 500ms | Database insert + validation |
| executeWorkflow() | < 2s | 5s | Excludes wait_delay actions |
| processWebhook() | < 500ms | 2s | Idempotency check + parsing |
| createApproval() | < 200ms | 500ms | Database insert + notification |
| updateApprovalStatus() | < 200ms | 500ms | Database update + workflow trigger |
| logAuditEvent() | < 50ms | 200ms | Async, non-blocking |
| getWorkflowExecutions() | < 300ms | 1s | Paginated query with indexes |
| retryFailedWebhook() | Same as processWebhook() | 2s | Reprocess webhook payload |

### Scalability Targets

1. **Concurrent Workflow Executions**:
   - Support 100 simultaneous workflows
   - Queue overflow workflows for background processing
   - Max queue depth: 10,000 workflows

2. **Webhook Processing Throughput**:
   - Handle 500 webhooks per minute
   - Idempotency check: < 10ms (indexed lookup)
   - Batch webhook processing in production (10 webhooks per batch)

3. **Audit Log Throughput**:
   - Insert 1,000+ audit logs per second
   - Use batch inserts for high-volume operations
   - Async logging (non-blocking for API responses)

4. **Approval Workflow Load**:
   - Support 500 active approvals per organization
   - Auto-approval checks every 15 minutes (scheduled job)

### Database Indexes (Required for Performance)

**webhook_events**:
- `idx_webhook_stripe_event` ON `stripe_event_id` (unique idempotency check)
- `idx_webhook_status` ON `status` (find pending/failed webhooks)
- `idx_webhook_type` ON `event_type` (filter by event type)
- `idx_webhook_created` ON `created_at DESC` (recent webhooks)

**audit_logs**:
- `idx_audit_logs_org_id` ON `org_id` (workspace isolation)
- `idx_audit_logs_created_at` ON `created_at DESC` (recent logs)
- `idx_audit_logs_action` ON `action` (filter by action type) - **MISSING, ADD IN MIGRATION**
- `idx_audit_logs_resource` ON `resource` (filter by resource) - **MISSING, ADD IN MIGRATION**
- `idx_audit_logs_status` ON `status` (find errors) - **MISSING, ADD IN MIGRATION**

**approvals**:
- `idx_approvals_org_id` ON `org_id` (workspace isolation)
- `idx_approvals_status` ON `status` (find pending approvals)
- `idx_approvals_priority` ON `priority` (high priority approvals)
- `idx_approvals_created_at` ON `created_at DESC` (recent approvals)

### Caching Strategy

**Workflow Rules** (5 minute cache):
- Cache workflow rules by org_id and workspace_id
- Invalidate cache on workflow create/update/delete
- Reduces audit_logs query load for frequently triggered workflows

**Webhook Idempotency** (24 hour cache):
- Cache processed event_ids in Redis
- Check Redis before database lookup (10ms → 1ms)
- TTL: 24 hours (webhooks older than 24h are unlikely to be duplicates)

---

## 9. TESTING STRATEGY

### Unit Tests

**Test File**: `tests/agents/workflow-automation.test.ts`

```typescript
describe('Workflow/Automation Agent', () => {
  describe('createWorkflow()', () => {
    it('should create workflow with valid trigger and conditions', async () => {
      const result = await createWorkflow({
        org_id: TEST_ORG_ID,
        workspace_id: TEST_WORKSPACE_ID,
        name: 'Test Workflow',
        trigger: { event_type: 'contact.score_changed', resource: 'contact' },
        conditions: [{ field: 'ai_score', operator: 'greater_than', value: 0.8 }],
        actions: [{ action_type: 'enroll_in_campaign', params: { campaign_id: 'test-id' } }],
        is_active: true,
      });

      expect(result.success).toBe(true);
      expect(result.workflow_id).toBeDefined();
    });

    it('should reject workflow with invalid trigger event type', async () => {
      const result = await createWorkflow({
        ...validWorkflow,
        trigger: { event_type: 'invalid.event', resource: 'contact' },
      });

      expect(result.success).toBe(false);
      expect(result.validation_errors).toContain('Invalid trigger event type');
    });

    it('should reject workflow with invalid condition operator', async () => {
      const result = await createWorkflow({
        ...validWorkflow,
        conditions: [{ field: 'ai_score', operator: 'invalid_op', value: 0.8 }],
      });

      expect(result.success).toBe(false);
      expect(result.validation_errors).toContain('Invalid condition operator');
    });
  });

  describe('executeWorkflow()', () => {
    it('should execute workflow when all conditions match', async () => {
      const workflow = await createWorkflow(testWorkflow);

      const result = await executeWorkflow({
        workflow_id: workflow.workflow_id,
        event_context: {
          event_type: 'contact.score_changed',
          resource_id: 'contact-123',
          resource_data: { ai_score: 0.85, status: 'lead' },
          org_id: TEST_ORG_ID,
          workspace_id: TEST_WORKSPACE_ID,
        },
      });

      expect(result.success).toBe(true);
      expect(result.conditions_met).toBe(true);
      expect(result.actions_executed).toHaveLength(2);
      expect(result.actions_executed[0].success).toBe(true);
    });

    it('should skip actions when conditions do not match', async () => {
      const result = await executeWorkflow({
        workflow_id: workflow.workflow_id,
        event_context: {
          ...validContext,
          resource_data: { ai_score: 0.60, status: 'lead' }, // Score too low
        },
      });

      expect(result.success).toBe(true);
      expect(result.conditions_met).toBe(false);
      expect(result.actions_executed).toHaveLength(0);
    });

    it('should continue to next action if one action fails', async () => {
      // Mock campaign enrollment to fail
      jest.spyOn(campaignAgent, 'enrollContacts').mockRejectedValue(new Error('Already enrolled'));

      const result = await executeWorkflow({ ...validExecution });

      expect(result.success).toBe(false);
      expect(result.actions_executed[0].success).toBe(false);
      expect(result.actions_executed[1].success).toBe(true); // Second action still executed
    });
  });

  describe('processWebhook()', () => {
    it('should process new webhook and trigger workflows', async () => {
      const result = await processWebhook({
        provider: 'stripe',
        event_id: 'evt_test_123',
        event_type: 'payment_intent.succeeded',
        raw_payload: { id: 'pi_123', amount: 29900 },
      });

      expect(result.success).toBe(true);
      expect(result.already_processed).toBe(false);
      expect(result.webhook_event_id).toBeDefined();
    });

    it('should detect duplicate webhook and skip processing', async () => {
      await processWebhook(testWebhook); // Process once

      const result = await processWebhook(testWebhook); // Process again (duplicate)

      expect(result.success).toBe(true);
      expect(result.already_processed).toBe(true);
      expect(result.workflows_triggered).toBe(0);
    });

    it('should reject webhook with invalid signature', async () => {
      const result = await processWebhook({
        ...testWebhook,
        signature: 'invalid_signature',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('WORKFLOW_009');
    });
  });

  describe('createApproval()', () => {
    it('should create approval and trigger workflows', async () => {
      const result = await createApproval({
        org_id: TEST_ORG_ID,
        title: 'Test Approval',
        type: 'design',
        priority: 'high',
        submitted_by_name: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.approval_id).toBeDefined();
      expect(result.approval_url).toContain('/dashboard/approvals/');
    });
  });

  describe('updateApprovalStatus()', () => {
    it('should approve approval and trigger workflows', async () => {
      const approval = await createApproval(testApproval);

      const result = await updateApprovalStatus({
        approval_id: approval.approval_id,
        org_id: TEST_ORG_ID,
        status: 'approved',
      });

      expect(result.success).toBe(true);
      expect(result.approval.status).toBe('approved');
      expect(result.workflows_triggered).toBeGreaterThan(0);
    });

    it('should require decline reason when declining', async () => {
      const result = await updateApprovalStatus({
        approval_id: approval.approval_id,
        org_id: TEST_ORG_ID,
        status: 'declined',
        // Missing decline_reason
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('WORKFLOW_018');
    });

    it('should prevent updating already reviewed approval', async () => {
      await updateApprovalStatus({ ...approveRequest, status: 'approved' });

      const result = await updateApprovalStatus({ ...approveRequest, status: 'declined' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('WORKFLOW_017');
    });
  });

  describe('logAuditEvent()', () => {
    it('should create audit log entry', async () => {
      const result = await logAuditEvent({
        org_id: TEST_ORG_ID,
        action: 'email.sent',
        resource: 'email',
        resource_id: 'email-123',
        agent: 'email-agent',
        status: 'success',
        details: { to: 'test@example.com' },
      });

      expect(result.success).toBe(true);
      expect(result.audit_log_id).toBeDefined();
    });

    it('should sanitize sensitive data from details', async () => {
      const result = await logAuditEvent({
        ...validLog,
        details: { password: 'secret123', api_key: 'sk-abc123', email: 'test@example.com' },
      });

      const auditLog = await getAuditLog(result.audit_log_id);
      expect(auditLog.details.password).toBeUndefined();
      expect(auditLog.details.api_key).toBeUndefined();
      expect(auditLog.details.email).toBe('test@example.com'); // Email is OK
    });
  });

  describe('retryFailedWebhook()', () => {
    it('should retry failed webhook with exponential backoff', async () => {
      const webhook = await processWebhook({ ...testWebhook });
      // Simulate failure
      await updateWebhookStatus(webhook.webhook_event_id, 'failed');

      const result = await retryFailedWebhook({
        webhook_event_id: webhook.webhook_event_id,
        retry_attempt: 1,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
    });

    it('should stop retrying after 5 attempts', async () => {
      const result = await retryFailedWebhook({
        webhook_event_id: webhook.webhook_event_id,
        retry_attempt: 6, // 6th attempt (exceeds limit)
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('WORKFLOW_025');
    });
  });
});
```

### Integration Tests

**Test File**: `tests/integration/workflow-campaign.test.ts`

```typescript
describe('Workflow + Campaign Integration', () => {
  it('should auto-enroll contact when score changes', async () => {
    // Create workflow: If contact score >= 0.8, enroll in campaign
    const workflow = await createWorkflow({
      trigger: { event_type: 'contact.score_changed', resource: 'contact' },
      conditions: [{ field: 'ai_score', operator: 'greater_than_or_equal', value: 0.8 }],
      actions: [{ action_type: 'enroll_in_campaign', params: { campaign_id: testCampaign.id } }],
      is_active: true,
    });

    // Update contact score to 0.85
    await contactAgent.updateScore({
      contact_id: testContact.id,
      new_score: 0.85,
    });

    // Verify workflow executed
    await waitFor(async () => {
      const enrollments = await getCampaignEnrollments(testCampaign.id);
      expect(enrollments).toContainObject({ contact_id: testContact.id });
    });
  });
});
```

**Test File**: `tests/integration/workflow-email.test.ts`

```typescript
describe('Workflow + Email Integration', () => {
  it('should add tag when email is opened', async () => {
    const workflow = await createWorkflow({
      trigger: { event_type: 'email.opened', resource: 'email' },
      actions: [{ action_type: 'add_contact_tag', params: { tag: 'engaged' } }],
      is_active: true,
    });

    // Send email
    const email = await emailAgent.sendEmail({ to: testContact.email, subject: 'Test' });

    // Simulate email open
    await emailAgent.trackEmailOpen({ email_id: email.id });

    // Verify tag added
    await waitFor(async () => {
      const contact = await getContact(testContact.id);
      expect(contact.tags).toContain('engaged');
    });
  });
});
```

### End-to-End Tests

**Test File**: `tests/e2e/approval-workflow.spec.ts`

```playwright
describe('Approval Workflow E2E', () => {
  test('should create approval, notify team, and approve', async ({ page }) => {
    // 1. Login as content creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@unite-hub.com.au');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. Navigate to approvals and create new
    await page.goto('/dashboard/approvals');
    await page.click('text=New Approval');
    await page.fill('[name="title"]', 'E2E Test Approval');
    await page.selectOption('[name="type"]', 'design');
    await page.selectOption('[name="priority"]', 'high');
    await page.fill('[name="asset_url"]', 'https://example.com/design.pdf');
    await page.click('button:has-text("Submit for Approval")');

    // 3. Verify approval created
    await expect(page.locator('text=Approval submitted successfully')).toBeVisible();
    const approvalId = await page.locator('[data-approval-id]').getAttribute('data-approval-id');

    // 4. Logout and login as approver
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    await page.fill('[name="email"]', 'approver@unite-hub.com.au');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 5. Navigate to approvals and approve
    await page.goto(`/dashboard/approvals/${approvalId}`);
    await page.click('button:has-text("Approve")');

    // 6. Verify approval approved
    await expect(page.locator('text=Approval approved')).toBeVisible();
    await expect(page.locator('[data-status]')).toHaveAttribute('data-status', 'approved');
  });
});
```

---

## 10. ERROR CODES

| Error Code | Description | HTTP Status | Retry? |
|-----------|-------------|-------------|--------|
| WORKFLOW_001 | Invalid trigger event type | 400 | No |
| WORKFLOW_002 | Invalid condition field or operator | 400 | No |
| WORKFLOW_003 | Invalid action type or parameters | 400 | No |
| WORKFLOW_004 | Workflow name already exists in workspace | 409 | No |
| WORKFLOW_005 | Workflow not found | 404 | No |
| WORKFLOW_006 | Workflow evaluation error (invalid condition) | 500 | Yes |
| WORKFLOW_007 | Action execution failed (partial failure) | 500 | Yes |
| WORKFLOW_008 | Workflow execution timeout (> 30s) | 504 | Yes |
| WORKFLOW_009 | Invalid webhook signature | 400 | No |
| WORKFLOW_010 | Webhook parsing error (invalid JSON) | 400 | No |
| WORKFLOW_011 | Webhook processing timeout | 504 | Yes |
| WORKFLOW_012 | Duplicate webhook event (idempotency violation) | 200 | No |
| WORKFLOW_013 | Invalid approval type | 400 | No |
| WORKFLOW_014 | Asset URL not accessible | 400 | No |
| WORKFLOW_015 | Submitted by user not found | 404 | No |
| WORKFLOW_016 | Approval not found | 404 | No |
| WORKFLOW_017 | Approval already reviewed | 409 | No |
| WORKFLOW_018 | Decline reason required | 400 | No |
| WORKFLOW_019 | Unauthorized to approve (wrong org_id) | 403 | No |
| WORKFLOW_020 | Invalid org_id | 400 | No |
| WORKFLOW_021 | Audit log insert failed (database error) | 500 | Yes |
| WORKFLOW_022 | Invalid pagination parameters | 400 | No |
| WORKFLOW_023 | Query execution timeout | 504 | Yes |
| WORKFLOW_024 | Webhook event not found | 404 | No |
| WORKFLOW_025 | Retry limit exceeded (> 5 attempts) | 429 | No |
| WORKFLOW_026 | Webhook retry timeout | 504 | Yes |

---

## 11. AUSTRALIAN COMPLIANCE

### Spam Act 2003 Compliance (Workflow Automation)

1. **Automated Email Workflows**:
   - ALL automated email workflows MUST include unsubscribe link in email content
   - Workflow action `send_email` MUST validate that email template contains unsubscribe URL
   - If unsubscribe link missing, abort action with error WORKFLOW_027

2. **Consent Verification**:
   - Before executing `enroll_in_campaign` action, verify contact has email_consent = true
   - If consent missing or expired, skip action and log warning

3. **Business Identity**:
   - All automated emails MUST include sender's business name and physical address
   - Validate email templates contain {{business_name}} and {{business_address}} merge tags

### Timezone Handling (AEST/AEDT)

1. **Workflow Scheduling**:
   - All workflow executions use AEST/AEDT timezone (Sydney, Australia)
   - Convert all timestamps to 'Australia/Sydney' timezone for audit logs
   - Display execution times in AEST/AEDT in dashboard

2. **Auto-Approval Timing**:
   - `auto_approve_after_hours` calculated in AEST/AEDT
   - Send reminder notification 6 hours before deadline (AEST/AEDT)
   - Auto-approve at exact deadline time (AEST/AEDT)

3. **Webhook Timestamp Conversion**:
   - Stripe webhook timestamps are in UTC, convert to AEST/AEDT for storage
   - Display webhook received time in AEST/AEDT in admin dashboard

### Phone Number Formatting

1. **Audit Log Phone Numbers**:
   - If logging phone numbers in audit_logs.details, format as +61 format
   - Example: +61 2 9123 4567 (Sydney landline)
   - Example: +61 400 123 456 (mobile)

2. **Webhook Contact Data**:
   - If webhook payload contains phone number, validate and format as +61
   - Reject webhooks with invalid Australian phone format

### Business Name Formatting

1. **Organization Names**:
   - Support common Australian business suffixes: Pty Ltd, Pty Limited, Limited, Ltd
   - Store business name in audit_logs.details for compliance tracking
   - Example: "TechCorp Australia Pty Ltd"

---

## 12. SECURITY

### Row Level Security (RLS) Policies

**webhook_events** (No RLS - System-level table):
```sql
-- No RLS policies - webhooks are system-level events
-- Access controlled via service role key only
GRANT ALL ON webhook_events TO service_role;
GRANT SELECT ON webhook_events TO authenticated; -- Read-only for admins
```

**audit_logs** (RLS Enabled):
```sql
-- Users can view audit logs in their organization
CREATE POLICY "Users can view audit logs in their org"
  ON audit_logs
  FOR SELECT
  USING (
    org_id IN (
      SELECT uo.org_id
      FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

-- Service role can manage all audit logs
CREATE POLICY "Service role can manage audit logs"
  ON audit_logs
  FOR ALL
  USING (true);
```

**approvals** (RLS Enabled):
```sql
-- Users can view approvals in their organization
CREATE POLICY "Users can view approvals in their org"
  ON approvals
  FOR SELECT
  USING (
    org_id IN (
      SELECT uo.org_id
      FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

-- Service role can manage all approvals
CREATE POLICY "Service role can manage approvals"
  ON approvals
  FOR ALL
  USING (true);
```

### Webhook Signature Verification

**Stripe Webhooks**:
```typescript
import Stripe from 'stripe';

function verifyStripeSignature(payload: string, signature: string): boolean {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return true;
  } catch (error) {
    console.error('Stripe signature verification failed:', error.message);
    return false;
  }
}
```

**Gmail Webhooks** (HMAC SHA-256):
```typescript
import crypto from 'crypto';

function verifyGmailSignature(payload: string, signature: string): boolean {
  const secret = process.env.GMAIL_WEBHOOK_SECRET;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Access Control

1. **Workflow Management**:
   - Only `admin` and `workflow_manager` roles can create/update/delete workflows
   - All users can view workflows in their workspace
   - Workflow execution is automated (no user permission required)

2. **Approval Management**:
   - Any user can submit approval requests
   - Only users with `approver` role can approve/decline
   - Submitters CANNOT approve their own submissions
   - Admin role can override any approval decision

3. **Audit Log Access**:
   - All users can view audit logs for their organization
   - Only admin role can export audit logs
   - Service role (backend agents) can write audit logs

### Sensitive Data Handling

**Redact from Audit Logs**:
- Passwords (replace with '***')
- API keys (replace with 'sk-***' + last 4 chars)
- Tokens (replace with 'tok_***' + last 4 chars)
- Credit card numbers (show last 4 digits: '****1234')
- Social security numbers (redact completely)

**Example Sanitization**:
```typescript
function sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details };
  const sensitiveKeys = ['password', 'api_key', 'token', 'credit_card', 'ssn', 'secret'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      if (key.toLowerCase().includes('credit_card')) {
        sanitized[key] = '****' + sanitized[key].slice(-4);
      } else {
        sanitized[key] = '***REDACTED***';
      }
    }
  }

  return sanitized;
}
```

---

## 13. MONITORING & METRICS

### Key Performance Indicators (KPIs)

1. **Workflow Execution Metrics**:
   - Total workflows executed (daily, weekly, monthly)
   - Workflow success rate (successful executions / total executions)
   - Average workflow execution time (ms)
   - Workflow failure rate by workflow_id
   - Most frequently triggered workflows (top 10)

2. **Webhook Processing Metrics**:
   - Total webhooks received (by provider)
   - Webhook processing success rate
   - Average webhook processing time (ms)
   - Duplicate webhook rate (idempotency violations detected)
   - Webhook retry rate (failed → retried → succeeded)

3. **Approval Workflow Metrics**:
   - Total approvals created (daily, weekly, monthly)
   - Average time to approval (from created_at to reviewed_at)
   - Approval rate (approved / total reviewed)
   - Decline rate (declined / total reviewed)
   - Auto-approval rate (auto-approved / total approved)

4. **Audit Log Metrics**:
   - Total audit logs created (daily, weekly, monthly)
   - Audit logs by agent (email-agent, campaign-agent, etc.)
   - Audit logs by status (success, error, warning)
   - Error rate by agent (errors / total logs per agent)

### Prometheus Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Workflow execution counter
const workflowExecutions = new Counter({
  name: 'workflow_executions_total',
  help: 'Total number of workflow executions',
  labelNames: ['workflow_id', 'status'], // status: success, error, conditions_not_met
});

// Workflow execution duration histogram
const workflowDuration = new Histogram({
  name: 'workflow_execution_duration_ms',
  help: 'Workflow execution duration in milliseconds',
  labelNames: ['workflow_id'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

// Webhook processing counter
const webhookProcessed = new Counter({
  name: 'webhooks_processed_total',
  help: 'Total number of webhooks processed',
  labelNames: ['provider', 'event_type', 'status'], // status: processed, failed, duplicate
});

// Webhook processing duration histogram
const webhookDuration = new Histogram({
  name: 'webhook_processing_duration_ms',
  help: 'Webhook processing duration in milliseconds',
  labelNames: ['provider'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000],
});

// Active approvals gauge
const activeApprovals = new Gauge({
  name: 'active_approvals',
  help: 'Number of pending approvals',
  labelNames: ['org_id', 'priority'],
});

// Audit log counter
const auditLogs = new Counter({
  name: 'audit_logs_total',
  help: 'Total number of audit logs created',
  labelNames: ['org_id', 'agent', 'status'],
});
```

### CloudWatch/Datadog Dashboard

**Workflow Dashboard**:
- Total workflows executed (last 24h)
- Workflow success rate (last 7 days)
- Top 10 most triggered workflows
- Workflow error rate by workflow_id
- Average workflow execution time (trend chart)

**Webhook Dashboard**:
- Total webhooks received (by provider)
- Webhook processing success rate
- Duplicate webhook detections (idempotency protection)
- Failed webhooks pending retry
- Webhook processing time (percentiles: p50, p95, p99)

**Approval Dashboard**:
- Pending approvals by priority (high, medium, low)
- Average time to approval (last 30 days)
- Approval rate vs decline rate
- Approvals approaching auto-approve deadline (next 6 hours)

### Alerts

1. **Workflow Failures**:
   - Trigger: Workflow failure rate > 10% over 15 minutes
   - Action: Send Slack alert to #engineering-alerts
   - Severity: Warning

2. **Webhook Processing Failures**:
   - Trigger: Webhook failure rate > 5% over 5 minutes
   - Action: Send PagerDuty alert to on-call engineer
   - Severity: Critical

3. **Approval SLA Breach**:
   - Trigger: High-priority approval pending > 4 hours
   - Action: Send email to approval team + Slack alert
   - Severity: Warning

4. **Audit Log Insert Failures**:
   - Trigger: Audit log insert failure rate > 1% over 10 minutes
   - Action: Send PagerDuty alert (audit logs critical for compliance)
   - Severity: Critical

---

## 14. FUTURE ENHANCEMENTS

### Phase 2 (Q2 2026)

1. **Advanced Workflow Features**:
   - **Nested conditions**: Support OR logic, grouped conditions ((A AND B) OR (C AND D))
   - **Multi-step workflows**: Chain multiple workflows together (workflow output → next workflow input)
   - **Conditional delays**: Wait until condition is true (e.g., wait until contact opens email OR 7 days pass)
   - **Workflow variables**: Store intermediate values during execution (e.g., calculate score delta, store result, use in next action)

2. **Workflow Templates Library**:
   - Pre-built workflow templates for common use cases
   - Templates: "Auto-nurture hot leads", "Re-engage cold contacts", "Approval reminder escalation"
   - Template marketplace (share workflows across organizations)

3. **Enhanced Webhook Integrations**:
   - **Zapier integration**: Send/receive webhooks from Zapier workflows
   - **HubSpot sync**: Bi-directional contact sync via webhooks
   - **Salesforce sync**: Bi-directional lead/opportunity sync via webhooks
   - **Custom webhook builder**: Define custom webhook schemas in UI

4. **Approval Workflow Enhancements**:
   - **Multi-step approvals**: Require approval from multiple reviewers (e.g., designer → manager → client)
   - **Approval routing**: Route approvals based on type/priority/value (e.g., approvals > $10k require CFO approval)
   - **Version control**: Track approval versions (v1, v2, v3) with diff view

### Phase 3 (Q3-Q4 2026)

1. **Real-time Collaboration**:
   - **Live workflow editor**: Multiple users edit workflow simultaneously (like Figma)
   - **Workflow comments**: Add comments/questions to workflow steps
   - **Activity feed**: Real-time feed of workflow executions, approvals, webhooks

2. **Advanced Analytics**:
   - **Workflow performance reports**: Identify slowest workflows, highest failure rate workflows
   - **ROI tracking**: Calculate revenue attributed to automated workflows
   - **A/B testing**: Split traffic between two workflow variants, measure conversion rate

3. **AI-Powered Workflow Builder**:
   - **Natural language workflow creation**: "When a contact scores above 80, enroll them in nurture campaign" → auto-generate workflow
   - **Workflow optimization suggestions**: AI suggests improvements (e.g., "Add delay before second email for 15% higher open rate")
   - **Anomaly detection**: AI detects unusual workflow behavior (e.g., sudden spike in failures)

4. **Enterprise Features**:
   - **Workflow versioning**: Track workflow changes over time, rollback to previous version
   - **Workflow permissions**: Granular permissions (create, edit, delete, execute)
   - **Audit compliance reports**: Export audit logs in compliance formats (SOC 2, ISO 27001)
   - **Workflow SLA monitoring**: Define SLAs for workflow execution time, alert on violations

---

## AGENT METADATA

**Created**: 2025-11-18
**Last Updated**: 2025-11-18
**Version**: 1.0.0
**Status**: Active Development
**Owner**: Infrastructure Team
**Dependencies**: Campaign Agent, Email Agent, Contact Agent, Content Agent
**Related Docs**:
- `supabase/migrations/015_webhook_events.sql` - Webhook events table schema
- `supabase/migrations/001_initial_schema.sql` - Audit logs table schema
- `supabase/migrations/002_team_projects_approvals.sql` - Approvals table schema

---

**END OF WORKFLOW/AUTOMATION AGENT SPECIFICATION**
