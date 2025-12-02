# Orchestrator Dashboard System - Complete Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-02
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Guide](#user-guide)
4. [API Reference](#api-reference)
5. [Component Reference](#component-reference)
6. [Developer Guide](#developer-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Orchestrator Dashboard System provides a comprehensive web interface for monitoring, analyzing, and managing multi-agent task execution. It integrates with the Independent Verifier system to provide cryptographically verified evidence of task completion.

### Key Features

- **Task Execution Monitoring** - Real-time view of task status with auto-refresh
- **Verification Tracking** - Per-step verification status with all-or-nothing enforcement
- **Evidence Packages** - Cryptographic proof with checksums, HMAC, and Merkle trees
- **Failure Analysis** - Root cause analysis with recovery suggestions
- **Retry Functionality** - Automatic retry of failed steps with evidence tracking
- **Responsive Design** - Mobile-friendly interface with dark theme support

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Orchestrator Dashboard                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐      │
│  │ Task List   │  │ Task Detail  │  │ Evidence      │      │
│  │ View        │→ │ View         │→ │ Package       │      │
│  └─────────────┘  └──────────────┘  └───────────────┘      │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐      │
│  │ Execution   │  │ Verification │  │ Failure       │      │
│  │ Timeline    │  │ Status       │  │ Analysis      │      │
│  └─────────────┘  └──────────────┘  └───────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Dashboard    │   │ Independent  │   │ Evidence     │
│ API Routes   │   │ Verifier     │   │ Storage      │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Architecture

### Data Flow

```
User Action (Dashboard)
    │
    ├─→ Filter/Sort Tasks
    │   └─→ GET /api/orchestrator/dashboard/tasks?status=failed&sortBy=created_at
    │       └─→ Returns: { tasks: [...], count: N }
    │
    ├─→ Select Task
    │   └─→ GET /api/orchestrator/dashboard/tasks/{id}
    │       └─→ Returns: { task, steps, timeline, verificationResults }
    │
    ├─→ View Evidence
    │   └─→ GET /api/orchestrator/dashboard/tasks/{id}/evidence
    │       └─→ Returns: { evidence, proof: { hmac, merkleRoot }, metadata }
    │
    ├─→ Analyze Failure
    │   └─→ GET /api/orchestrator/dashboard/tasks/{id}/failures
    │       └─→ Returns: { analysis: { rootCause, failedSteps, recoverySuggestions } }
    │
    └─→ Retry Task
        └─→ POST /api/orchestrator/dashboard/tasks/{id}/retry
            └─→ Returns: { retryTaskId, retryAttempt }
```

### Tech Stack

- **Frontend:** React 19 + Next.js 16 (App Router)
- **UI Components:** shadcn/ui + Tailwind CSS
- **State Management:** React Hooks (useState, useEffect, useCallback)
- **Data Fetching:** Custom hooks with auto-refresh
- **API:** Next.js API Routes
- **Authentication:** Supabase Auth (PKCE flow)
- **Database:** Supabase PostgreSQL
- **Testing:** Playwright E2E tests

---

## User Guide

### Accessing the Dashboard

1. Navigate to `/dashboard/orchestrator` in your Unite-Hub instance
2. Ensure you have a valid workspace selected
3. The dashboard will auto-load all tasks for your workspace

### Task List View

The task list displays all orchestrator tasks with the following information:

- **Status Icon** - Visual indicator (✅ completed, ❌ failed, 🔄 running, ⏳ pending)
- **Objective** - Task description
- **Task ID** - Unique identifier
- **Created Date** - Relative time (e.g., "2 hours ago")
- **Duration** - Total execution time
- **Progress** - Completed steps / total steps with percentage bar
- **Agent Chain** - List of agents involved in execution
- **Risk Score** - 0-100% (red = high risk, yellow = medium, green = low)
- **Confidence Score** - 0-100% (green = high confidence, yellow = medium, red = low)

#### Filtering Tasks

Use the filter controls to narrow down tasks:

1. **Search** - Filter by task ID or objective keywords
2. **Status Filter** - Show only completed, failed, running, pending, or halted tasks
3. **Sort By** - Sort by created date, duration, or status
4. **Sort Order** - Ascending or descending

#### Auto-Refresh

The task list automatically refreshes every 30 seconds to show the latest status.

### Task Detail View

Click on any task to view detailed execution information:

#### Header Section

- **Task Information** - Objective, ID, status badge
- **Timestamps** - Creation time, completion time (if completed)
- **Duration** - Total execution time
- **Metrics** - Risk score, confidence score, uncertainty score, agent chain count

#### Tabs

**1. Timeline Tab**

Visual timeline showing step-by-step execution:

- **Step Cards** - Each step with status icon, agent name, duration
- **Expandable Details** - Click to see start/end times, output summary, verification status
- **Visual Timeline** - Horizontal progress bar showing all steps at a glance

**2. Verification Tab**

Independent verification results:

- **Summary Metrics** - Verified steps, failed steps, verification rate
- **All-or-Nothing Indicator** - Shows if task is blocked by a failed step
- **Verification Table** - Per-step verification status with evidence links
- **Retry History** - Timestamps and reasons for each retry attempt

**3. Evidence Tab**

Cryptographic proof of execution:

- **Evidence Package Overview** - Collection time, storage path, verifier ID
- **Cryptographic Proof** - HMAC, Merkle root, file checksums
- **Execution Log** - Complete step-by-step execution trace
- **State Snapshots** - Before/after state captures
- **Verification Evidence** - Individual criterion checks with pass/fail results
- **Export** - Download complete evidence package as JSON

**4. Analysis Tab** (for failed tasks)

Root cause analysis and recovery guidance:

- **Root Cause** - What failed and why
- **Failure Type** - Categorized failure (timeout, verification, authorization, etc.)
- **Failed Steps** - Detailed error messages and verification attempts
- **Downstream Impact** - Steps blocked by the failure
- **Evidence from Failure** - Verification evidence showing what went wrong
- **Recovery Suggestions** - Prioritized actions to resolve the issue

### Retry Functionality

For failed tasks:

1. Click **Retry Task** button in task detail header
2. System creates new task starting from failed step
3. Original task preserved as audit trail
4. Success message shows new task ID
5. Task list refreshes to include retry task

---

## API Reference

### GET /api/orchestrator/dashboard/tasks

Fetch task list with filters.

**Query Parameters:**
- `workspaceId` (required) - Workspace UUID
- `status` (optional) - Filter by status: `completed`, `failed`, `running`, `pending`, `halted`
- `limit` (optional, default: 50) - Max results to return
- `sortBy` (optional, default: `created_at`) - Sort field: `created_at`, `duration`, `status`
- `order` (optional, default: `desc`) - Sort order: `asc`, `desc`

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "workspace_id": "ws-456",
      "objective": "Process user data",
      "status": "completed",
      "created_at": "2025-12-02T10:00:00Z",
      "completed_at": "2025-12-02T10:05:00Z",
      "total_time_ms": 300000,
      "trace": { /* OrchestratorTrace object */ }
    }
  ],
  "count": 1,
  "filters": { "status": "completed", "limit": 50, "sortBy": "created_at", "order": "desc" }
}
```

### GET /api/orchestrator/dashboard/tasks/{id}

Fetch detailed task execution trace.

**Query Parameters:**
- `workspaceId` (required) - Workspace UUID

**Response:**
```json
{
  "task": {
    "id": "task-123",
    "objective": "Process user data",
    "status": "completed",
    "agentChain": ["agent-1", "agent-2"],
    "riskScore": 0.3,
    "uncertaintyScore": 0.2,
    "confidenceScore": 0.8,
    "createdAt": "2025-12-02T10:00:00Z",
    "completedAt": "2025-12-02T10:05:00Z",
    "totalDuration": 300000,
    "finalOutput": { /* task result */ }
  },
  "steps": [ /* ExecutionStep[] */ ],
  "timeline": [ /* ExecutionTimelineItem[] */ ],
  "verificationResults": [ /* VerificationEvidence[] */ ]
}
```

### GET /api/orchestrator/dashboard/tasks/{id}/steps

Fetch task steps with verification status.

**Query Parameters:**
- `workspaceId` (required) - Workspace UUID

**Response:**
```json
{
  "taskId": "task-123",
  "steps": [
    {
      "stepIndex": 0,
      "assignedAgent": "agent-1",
      "status": "completed",
      "verified": true,
      "verificationAttempts": 1,
      "verificationEvidence": [
        {
          "criterion": "file_exists: output.json",
          "result": "pass",
          "proof": "File: /path/output.json, Size: 1024 bytes",
          "checked_at": "2025-12-02T10:05:00Z"
        }
      ]
    }
  ],
  "totalSteps": 1,
  "verifiedSteps": 1,
  "failedSteps": 0
}
```

### GET /api/orchestrator/dashboard/tasks/{id}/evidence

Fetch evidence package with cryptographic proof.

**Query Parameters:**
- `workspaceId` (required) - Workspace UUID

**Response:**
```json
{
  "taskId": "task-123",
  "evidence": {
    "collectionTime": "2025-12-02T10:05:00Z",
    "storagePath": "/audit-reports/evidence/task-123",
    "executionLog": { /* execution details */ },
    "stateSnapshots": [ /* before/after snapshots */ ],
    "verificationEvidence": [ /* verification checks */ ]
  },
  "proof": {
    "checksums": {
      "execution-log.json": "abc123...",
      "state-snapshot-before.json": "def456..."
    },
    "hmac": "hmac-signature-value",
    "merkleRoot": "merkle-tree-root-hash",
    "merkleTree": [ /* tree structure */ ]
  },
  "metadata": {
    "verificationStatus": true,
    "verifierId": "independent-verifier-1",
    "collectedBy": "orchestrator-engine"
  }
}
```

### GET /api/orchestrator/dashboard/tasks/{id}/failures

Fetch failure analysis for failed tasks.

**Query Parameters:**
- `workspaceId` (required) - Workspace UUID

**Response:**
```json
{
  "taskId": "task-123",
  "status": "failed",
  "analysis": {
    "rootCause": "Step 0 failed verification after 3 attempts",
    "failureType": "verification_failure",
    "failedSteps": [
      {
        "stepIndex": 0,
        "assignedAgent": "agent-1",
        "error": "Verification failed: file_exists check failed",
        "verificationAttempts": 3,
        "lastVerificationError": "File not found: /expected/output.json"
      }
    ],
    "impactedSteps": [
      {
        "stepIndex": 1,
        "assignedAgent": "agent-2",
        "status": "skipped"
      }
    ],
    "recoverySuggestions": [
      {
        "action": "Retry failed steps",
        "description": "Retry the 1 failed step(s) with automatic recovery.",
        "priority": "high"
      },
      {
        "action": "Review verification criteria",
        "description": "Check if verification criteria are too strict or misconfigured.",
        "priority": "high"
      }
    ]
  },
  "taskMetadata": {
    "objective": "Process user data",
    "agentChain": ["agent-1", "agent-2"],
    "totalSteps": 2,
    "completedSteps": 0
  }
}
```

### POST /api/orchestrator/dashboard/tasks/{id}/retry

Retry failed task.

**Query Parameters:**
- `workspaceId` (required) - Workspace UUID

**Response:**
```json
{
  "message": "Task retry initiated",
  "originalTaskId": "task-123",
  "retryTaskId": "task-123-retry-1",
  "retryAttempt": 1,
  "failedStepsRetrying": 1
}
```

---

## Component Reference

### TaskListView

Displays filterable task list with search and sort controls.

**Props:**
```typescript
interface TaskListViewProps {
  tasks: TaskForUI[];               // Formatted task list
  loading: boolean;                 // Loading state
  onTaskSelect: (taskId: string) => void;  // Task click handler
  selectedTaskId?: string;          // Currently selected task
  onFilterChange: (filters: {      // Filter change handler
    status?: string;
    sortBy?: string;
    order?: string;
    search?: string;
  }) => void;
}
```

### TaskDetailView

Shows detailed task execution with tabs for timeline, verification, evidence, and analysis.

**Props:**
```typescript
interface TaskDetailViewProps {
  task: any;                        // Task object
  steps: any[];                     // Execution steps
  timeline: any[];                  // Timeline items
  verificationResults: any[];       // Verification evidence
  loading: boolean;                 // Loading state
  onBack: () => void;               // Back button handler
  onRetry: () => void;              // Retry button handler
  onViewEvidence: () => void;       // Evidence button handler
}
```

### ExecutionTimeline

Visual timeline with expandable step details.

**Props:**
```typescript
interface ExecutionTimelineProps {
  timeline: any[];                  // Timeline items
}
```

### VerificationStatusPanel

Per-step verification status with all-or-nothing indicator.

**Props:**
```typescript
interface VerificationStatusPanelProps {
  steps: any[];                     // Steps with verification data
}
```

### EvidencePackageViewer

Evidence package display with cryptographic proof and export functionality.

**Props:**
```typescript
interface EvidencePackageViewerProps {
  taskId: string;                   // Task ID to fetch evidence for
}
```

### FailureAnalysisPanel

Root cause analysis with recovery suggestions.

**Props:**
```typescript
interface FailureAnalysisPanelProps {
  taskId: string;                   // Task ID to analyze
}
```

---

## Developer Guide

### Adding the Dashboard to Navigation

Add to your dashboard navigation:

```typescript
// In your dashboard layout or sidebar
import Link from 'next/link';

<Link href="/dashboard/orchestrator">
  <a className="nav-link">Orchestrator</a>
</Link>
```

### Custom Hooks

#### useTaskList

Fetch task list with auto-refresh.

```typescript
import { useTaskList } from '@/hooks/useOrchestratorDashboard';

const { tasks, loading, error, count, refresh } = useTaskList(
  {
    status: 'failed',
    sortBy: 'created_at',
    order: 'desc',
  },
  true  // auto-refresh enabled
);
```

#### useTaskDetail

Fetch task detail with auto-refresh for running tasks.

```typescript
import { useTaskDetail } from '@/hooks/useOrchestratorDashboard';

const { task, steps, timeline, verificationResults, loading, error, refresh } =
  useTaskDetail('task-123', true);
```

#### useTaskRetry

Retry failed tasks.

```typescript
import { useTaskRetry } from '@/hooks/useOrchestratorDashboard';

const { retryTask, retrying, error } = useTaskRetry();

// Later:
const retryTaskId = await retryTask('task-123');
```

### Data Service Functions

#### formatTaskForUI

Format raw task for UI display.

```typescript
import { formatTaskForUI } from '@/lib/orchestrator/dashboard-service';

const formattedTask = formatTaskForUI(rawTask);
// Returns: TaskForUI with computed fields (statusColor, durationFormatted, etc.)
```

#### getExecutionTimeline

Extract timeline from task.

```typescript
import { getExecutionTimeline } from '@/lib/orchestrator/dashboard-service';

const timeline = getExecutionTimeline(task);
// Returns: ExecutionTimelineItem[] with formatted durations
```

#### formatDuration

Format milliseconds to human-readable duration.

```typescript
import { formatDuration } from '@/lib/orchestrator/dashboard-service';

formatDuration(5000);      // "5s"
formatDuration(65000);     // "1m 5s"
formatDuration(3665000);   // "1h 1m"
```

#### formatRelativeTime

Format timestamp as relative time.

```typescript
import { formatRelativeTime } from '@/lib/orchestrator/dashboard-service';

formatRelativeTime('2025-12-02T10:00:00Z');  // "2 hours ago"
```

---

## Troubleshooting

### Task List Not Loading

**Symptoms:**
- Empty task list despite having tasks
- Loading spinner stuck
- Error message: "No workspace selected"

**Solutions:**

1. **Check workspace selection:**
   ```typescript
   // Verify workspace is set in AuthContext
   const { currentOrganization } = useAuth();
   console.log('Workspace ID:', currentOrganization?.org_id);
   ```

2. **Check API route:**
   ```bash
   # Test API directly
   curl -X GET "http://localhost:3008/api/orchestrator/dashboard/tasks?workspaceId=YOUR_WORKSPACE_ID" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Check database:**
   ```sql
   -- Verify tasks exist
   SELECT * FROM orchestrator_tasks WHERE workspace_id = 'YOUR_WORKSPACE_ID';
   ```

### Task Detail Not Displaying

**Symptoms:**
- Task detail shows "Task not found"
- Detail view stuck loading

**Solutions:**

1. **Verify task ID is valid:**
   ```typescript
   // Check selectedTaskId state
   console.log('Selected Task ID:', selectedTaskId);
   ```

2. **Check task exists in workspace:**
   ```sql
   SELECT * FROM orchestrator_tasks
   WHERE id = 'TASK_ID' AND workspace_id = 'WORKSPACE_ID';
   ```

3. **Check trace JSON structure:**
   ```typescript
   // Ensure trace has required fields
   const trace = task.trace;
   console.log('Trace:', {
     hasSteps: Array.isArray(trace?.steps),
     hasAgentChain: Array.isArray(trace?.agentChain),
   });
   ```

### Evidence Package Not Loading

**Symptoms:**
- Evidence tab shows "No evidence package available"
- Missing cryptographic proof

**Solutions:**

1. **Check if evidence was collected:**
   ```sql
   SELECT evidence_package FROM orchestrator_tasks WHERE id = 'TASK_ID';
   ```

2. **Check file system storage:**
   ```bash
   # Verify evidence files exist
   ls -la audit-reports/evidence/TASK_ID/
   ```

3. **Re-run task with evidence collection enabled:**
   ```typescript
   // Ensure OrchestratorEngine collects evidence
   const orchestrator = new OrchestratorEngine();
   const result = await orchestrator.executeWorkflow({
     workspaceId,
     objective: 'Task objective',
     // Evidence collection is automatic
   });
   ```

### Verification Status Not Updating

**Symptoms:**
- Steps show "Not Verified" despite completion
- Verification attempts stuck at 0

**Solutions:**

1. **Check Independent Verifier integration:**
   ```typescript
   import { independentVerifier } from '@/lib/agents/independent-verifier';

   // Manually verify step
   const result = await independentVerifier.verify({
     task_id: 'task-123',
     claimed_outputs: ['output.json'],
     completion_criteria: ['file_exists: output.json'],
     requesting_agent_id: 'agent-1',
   });
   console.log('Verification:', result);
   ```

2. **Check verification criteria format:**
   ```typescript
   // Criteria must start with supported prefix
   const validCriteria = [
     'file_exists: /path/to/file.json',
     'no_placeholders: /path/to/file.ts',
     'typescript_compiles: /path/to/file.ts',
     'lint_passes: /path/to/file.ts',
     'tests_pass: /tests/file.test.ts',
     'endpoint_responds: /api/health|GET',
   ];
   ```

### Auto-Refresh Not Working

**Symptoms:**
- Task status not updating
- Need to manually refresh page

**Solutions:**

1. **Check auto-refresh is enabled:**
   ```typescript
   // In useTaskList hook
   const { tasks } = useTaskList(filters, true);  // true = auto-refresh
   ```

2. **Check refresh interval:**
   ```typescript
   // Task list: 30s, Task detail: 10s, Status: 5s
   // Adjust in hook implementation if needed
   ```

3. **Check for errors in console:**
   ```javascript
   // Open browser console (F12) and look for fetch errors
   ```

---

## Screenshots

### Task List View

```
┌─────────────────────────────────────────────────────────────┐
│ Task Execution History                                       │
│ View and manage orchestrator task execution history         │
├─────────────────────────────────────────────────────────────┤
│ 🔍 Search by task ID or objective...                        │
│ [Filter: All Statuses ▼] [Sort: Created Date ▼] [↕]       │
├─────────────────────────────────────────────────────────────┤
│ ✅ Process user data import                                 │
│    ID: task-123 • 2 hours ago • Duration: 5m 23s           │
│    [completed] Progress: 5/5 steps • 100%                   │
│    ███████████████████████████████████████████ 100%         │
│    agent-1 agent-2 agent-3                                  │
│    Risk: 30% | Confidence: 80%                              │
├─────────────────────────────────────────────────────────────┤
│ ❌ Generate marketing content                               │
│    ID: task-456 • 1 hour ago • Duration: 2m 14s            │
│    [failed] Progress: 2/4 steps • 50%                       │
│    ████████████████████___________________ 50%               │
│    agent-1 agent-2 +2 more                                  │
│    Risk: 70% | Confidence: 40%                              │
└─────────────────────────────────────────────────────────────┘
```

### Task Detail View

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back to List]              [Retry Task] [View Evidence]  │
├─────────────────────────────────────────────────────────────┤
│ ✅ Process user data import                                 │
│    Task ID: task-123                                         │
│    [completed] Created: 2025-12-02 10:00 UTC                │
│    Duration: 5m 23s                                          │
│                                                               │
│    Risk: 30%  Confidence: 80%  Uncertainty: 20%  Chain: 3   │
│                                                               │
│    Agent Chain: 1. agent-1  2. agent-2  3. agent-3          │
├─────────────────────────────────────────────────────────────┤
│ [Timeline] [Verification] [Evidence] [Analysis]             │
├─────────────────────────────────────────────────────────────┤
│ Execution Timeline                                           │
│                                                               │
│ ► ✅ Step 1: agent-1                 5s                     │
│   [completed] [✓ Verified]                                  │
│                                                               │
│ ▼ ✅ Step 2: agent-2                 12s                    │
│   [completed] [✓ Verified]                                  │
│   │ Started: 10:00:05                                       │
│   │ Completed: 10:00:17                                     │
│   │ Output: { "result": "success" }                         │
│   │ Verification Attempts: 1 / 3                            │
│                                                               │
│ ● ● ● ● ● ━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│   (Timeline visualization)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Examples

### Integrating with Existing Workflows

```typescript
// In your orchestrator execution code
import { OrchestratorEngine } from '@/lib/orchestrator/orchestratorEngine';

const orchestrator = new OrchestratorEngine();

// Execute task (evidence collection automatic)
const result = await orchestrator.executeWorkflow({
  workspaceId: 'ws-123',
  objective: 'Process user data',
  description: 'Import and validate user data from CSV',
  initialContext: { csvPath: '/uploads/users.csv' },
});

// Task is now visible in dashboard at /dashboard/orchestrator
console.log('Task ID:', result.taskId);
console.log('View in dashboard:', `/dashboard/orchestrator?task=${result.taskId}`);
```

### Programmatic Task Retry

```typescript
// Retry task from code (not just UI)
async function retryFailedTask(taskId: string, workspaceId: string) {
  const response = await fetch(
    `/api/orchestrator/dashboard/tasks/${taskId}/retry?workspaceId=${workspaceId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Retry failed');
  }

  const result = await response.json();
  console.log('Retry task ID:', result.retryTaskId);
  return result.retryTaskId;
}
```

### Monitoring Task Status Programmatically

```typescript
// Poll task status until completion
async function waitForTaskCompletion(taskId: string, workspaceId: string) {
  const pollInterval = 5000; // 5 seconds
  const maxWaitTime = 300000; // 5 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const response = await fetch(
      `/api/orchestrator/dashboard/tasks/${taskId}?workspaceId=${workspaceId}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch task status');
    }

    const { task } = await response.json();

    if (task.status === 'completed') {
      console.log('Task completed successfully');
      return { success: true, task };
    }

    if (task.status === 'failed' || task.status === 'halted') {
      console.log('Task failed');
      return { success: false, task };
    }

    // Still running, wait and check again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Task timed out');
}
```

---

## Performance Optimization

### Caching Strategy

The dashboard implements client-side caching to minimize API calls:

- **Task List:** Cached for 30 seconds, auto-refresh in background
- **Task Detail:** Cached for 10 seconds, auto-refresh for running tasks
- **Evidence Packages:** Cached until tab close (large payloads)

### Lazy Loading

- Step details load on expand (not all at once)
- Evidence package loads on tab click (not on page load)
- Failure analysis loads only for failed tasks

### Pagination

For workspaces with many tasks:

```typescript
// Implement pagination in task list
const { tasks } = useTaskList({
  limit: 50,  // Adjust as needed
  offset: 0,  // For next page: offset += limit
});
```

---

## Security Considerations

### Authentication

All API routes require valid authentication:

```typescript
// Server-side auth check in API route
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Authorization

Tasks are scoped to workspace:

```typescript
// All queries filter by workspaceId
const { data: task } = await supabase
  .from('orchestrator_tasks')
  .select('*')
  .eq('id', taskId)
  .eq('workspace_id', workspaceId)  // CRITICAL: Prevents cross-workspace access
  .single();
```

### Evidence Integrity

Cryptographic verification ensures tamper-proof evidence:

- **Checksums (SHA-256):** Each file hashed individually
- **HMAC:** Message authentication code for entire package
- **Merkle Tree:** Hierarchical hash tree for efficient verification

---

## Changelog

### Version 1.0.0 (2025-12-02)

**Initial Release:**

- Task list view with filtering and sorting
- Task detail view with execution timeline
- Verification status panel with all-or-nothing enforcement
- Evidence package viewer with cryptographic proof
- Failure analysis panel with recovery suggestions
- Retry functionality
- Auto-refresh for real-time updates
- Responsive design with dark theme support
- Comprehensive E2E test suite
- Complete API documentation

---

## Support

For issues, questions, or feature requests:

1. Check this documentation first
2. Review [Troubleshooting](#troubleshooting) section
3. Check the E2E test suite for usage examples
4. Contact your system administrator

---

**END OF GUIDE**
