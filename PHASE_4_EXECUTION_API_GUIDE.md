# Phase 4 - Execution API Reference Guide

**Complete API documentation for autonomous strategy execution**

---

## Overview

The Execution API provides RESTful endpoints for managing autonomous strategy execution. All endpoints require authentication and workspace authorization.

---

## Authentication

All requests require Bearer token in Authorization header:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://your-app.com/api/executions/start \
  -X POST \
  -H "Content-Type: application/json"
```

---

## Endpoints

### 1. Start Execution

**Endpoint**: `POST /api/executions/start`
**Purpose**: Initialize and start autonomous execution of a strategy

**Request**:
```typescript
{
  strategyId: string;      // Required: UUID of strategy
  workspaceId: string;     // Required: UUID of workspace
}
```

**Success Response** (200):
```json
{
  "success": true,
  "executionId": "exec_1732608000000_abc123",
  "message": "Strategy execution started",
  "execution": {
    "id": "exec_1732608000000_abc123",
    "status": "pending",
    "strategyId": "strat_456",
    "startedAt": "2025-11-26T20:00:00Z",
    "totalTasks": 25
  }
}
```

**Error Response** (400, 401, 403, 500):
```json
{
  "error": "Error description"
}
```

**Example**:
```bash
curl -X POST http://localhost:3008/api/executions/start \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "strategyId": "strat_123",
    "workspaceId": "ws_456"
  }'
```

---

### 2. Get Execution Status

**Endpoint**: `GET /api/executions/[id]/status`
**Purpose**: Get current execution status, tasks, and metrics

**URL Parameters**:
- `id` (string, required): Execution ID

**Success Response** (200):
```json
{
  "execution": {
    "id": "exec_1732608000000_abc123",
    "status": "running",
    "strategyId": "strat_456",
    "startedAt": "2025-11-26T20:00:00Z",
    "completedAt": null,
    "totalTasks": 25,
    "completedTasks": 8,
    "failedTasks": 0
  },
  "health": {
    "score": 95,
    "completionRate": 0.32,
    "errorRate": 0.0,
    "lastChecked": "2025-11-26T20:05:00Z"
  },
  "tasks": [
    {
      "id": "task_001",
      "l4_item_id": "l4_123",
      "agent_type": "email",
      "status": "in_progress",
      "priority": "high",
      "description": "Send outreach email",
      "assigned_at": "2025-11-26T20:01:00Z",
      "completed_at": null
    },
    {
      "id": "task_002",
      "status": "completed",
      "agent_type": "content",
      "completed_at": "2025-11-26T20:03:00Z"
    }
  ],
  "metrics": {
    "totalDuration": 300000,
    "averageTaskDuration": 15000
  }
}
```

**Example**:
```bash
curl http://localhost:3008/api/executions/exec_123/status \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response Fields**:
- `status`: "pending" | "running" | "paused" | "completed" | "failed" | "cancelled"
- `completedTasks`: Number of successfully completed tasks
- `failedTasks`: Number of failed tasks (attempted all retries)
- `health.score`: 0-100 health score
- `health.completionRate`: % of tasks completed
- `health.errorRate`: % of tasks that failed

---

### 3. Pause Execution

**Endpoint**: `POST /api/executions/[id]/pause`
**Purpose**: Pause an ongoing execution (can be resumed)

**URL Parameters**:
- `id` (string, required): Execution ID

**Request Body**: None (or empty object)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Execution paused",
  "execution": {
    "id": "exec_1732608000000_abc123",
    "status": "paused"
  }
}
```

**Effect**:
- Current task in-progress continues to completion
- New tasks are not started
- Execution can be resumed with `/resume` endpoint

**Example**:
```bash
curl -X POST http://localhost:3008/api/executions/exec_123/pause \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### 4. Resume Execution

**Endpoint**: `POST /api/executions/[id]/resume`
**Purpose**: Resume a paused execution

**URL Parameters**:
- `id` (string, required): Execution ID

**Request Body**: None (or empty object)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Execution resumed",
  "execution": {
    "id": "exec_1732608000000_abc123",
    "status": "running"
  }
}
```

**Effect**:
- Execution status changes to "running"
- Task queue processing resumes
- Pending tasks are picked up and executed

**Example**:
```bash
curl -X POST http://localhost:3008/api/executions/exec_123/resume \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### 5. Cancel Execution

**Endpoint**: `POST /api/executions/[id]/cancel`
**Purpose**: Cancel execution completely (cannot be resumed)

**URL Parameters**:
- `id` (string, required): Execution ID

**Request Body**: None (or empty object)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Execution cancelled",
  "execution": {
    "id": "exec_1732608000000_abc123",
    "status": "cancelled"
  }
}
```

**Effect**:
- Execution status changes to "cancelled"
- Current task completes, no new tasks are started
- Pending tasks are marked as "skipped"
- Cannot be resumed (must start new execution)

**Example**:
```bash
curl -X POST http://localhost:3008/api/executions/exec_123/cancel \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Status Code Reference

| Code | Meaning | Typical Response |
|------|---------|------------------|
| 200 | Success | `{ "success": true, ... }` |
| 400 | Bad Request | `{ "error": "Missing fields" }` |
| 401 | Unauthorized | `{ "error": "Unauthorized" }` |
| 403 | Access Denied | `{ "error": "Access denied" }` |
| 404 | Not Found | `{ "error": "Execution not found" }` |
| 500 | Server Error | `{ "error": "Internal server error" }` |

---

## Real-Time Updates via Bridge

The ExecutionBridge provides real-time updates via WebSocket/SSE.

### WebSocket Connection

```typescript
import { executionBridge } from '@/lib/strategy/execution-bridge';

// Connect
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/api/executions/${executionId}/stream`;
await executionBridge.connectWebSocket(executionId, wsUrl);

// Subscribe to updates
const unsubscribe = executionBridge.subscribe(executionId, (state) => {
  console.log('Execution state:', state);
});

// Pause execution
await executionBridge.pauseExecution(executionId);

// Resume execution
await executionBridge.resumeExecution(executionId);

// Cancel execution
await executionBridge.cancelExecution(executionId);

// Disconnect
executionBridge.disconnect(executionId);
```

### Event Types

```typescript
type BridgeEventType =
  | 'execution-started'      // Execution began
  | 'task-assigned'          // Task assigned to agent
  | 'task-progress'          // Task in progress
  | 'task-completed'         // Task completed successfully
  | 'task-failed'            // Task failed (may retry)
  | 'health-update'          // Health metrics updated
  | 'metrics-update'         // Execution metrics updated
  | 'execution-paused'       // Execution paused
  | 'execution-resumed'      // Execution resumed
  | 'execution-completed'    // Execution finished
  | 'execution-cancelled'    // Execution cancelled
  | 'error';                 // Error occurred
```

### React Component Usage

```typescript
import ExecutionDashboard from '@/components/ExecutionDashboard';

export default function Page() {
  return (
    <ExecutionDashboard
      executionId="exec_123"
      strategyId="strat_456"
      workspaceId="ws_789"
      onClose={() => router.back()}
    />
  );
}
```

---

## Error Handling

### Common Error Scenarios

**1. Strategy Not Found**
```json
{
  "error": "Strategy not found: strat_999"
}
```

**2. Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**3. Access Denied**
```json
{
  "error": "Access denied"
}
```

**4. Execution Not Found**
```json
{
  "error": "Execution not found"
}
```

### Retry Strategy

```typescript
async function executeWithRetry(
  fn: () => Promise<Response>,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      if (response.ok) return response;

      // Don't retry on client errors
      if (response.status < 500) throw new Error(await response.text());
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * Math.pow(2, i))
      );
    }
  }
}

// Usage
const response = await executeWithRetry(
  () => fetch(`/api/executions/start`, { method: 'POST', ... })
);
```

---

## Execution Lifecycle

```
START
  ↓
POST /api/executions/start
  ↓
status: pending → running
  ↓
GET /api/executions/[id]/status (polling)
  ↓
Tasks Process (in queue order)
  ├─ Task 1: in_progress → completed
  ├─ Task 2: in_progress → completed
  └─ Task N: in_progress → completed
  ↓
POST /api/executions/[id]/pause (optional)
  ↓
status: paused
  ↓
POST /api/executions/[id]/resume (or cancel)
  ↓
status: running
  ↓
All tasks complete
  ↓
status: completed
  ↓
END

Alternative Paths:
- pause → cancel: Skip remaining tasks
- running → cancel: Stop immediately, mark remaining as skipped
- running → error: Task failure + retries exhausted, status: failed
```

---

## Task Structure

Each task in the response has:

```typescript
interface AgentTask {
  id: string;                    // Unique task ID
  l4_item_id: string;           // Source L4 item
  execution_id: string;         // Parent execution
  agent_type: string;           // 'email' | 'content' | 'research' | 'scheduling' | 'analysis' | 'coordination'
  status: string;               // 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  priority: string;             // 'high' | 'medium' | 'low'
  description: string;          // Human-readable task
  dependencies: string[];       // Task IDs this depends on
  assigned_at?: string;         // ISO timestamp when assigned
  completed_at?: string;        // ISO timestamp when completed
  result?: unknown;             // Agent execution result
  error?: string;               // Error message if failed
  retry_count: number;          // Number of retry attempts
  max_retries: number;          // Maximum allowed retries
}
```

---

## Health Metrics

```typescript
interface HealthMetrics {
  score: number;                // 0-100 health score
  lastChecked: string;          // ISO timestamp
  issues: string[];             // List of issues detected
  taskCompletionRate?: number;  // 0-1 percentage
  errorRate?: number;           // 0-1 percentage
  averageTaskDuration?: number; // milliseconds
  agentStatus?: {               // Per-agent breakdown
    [agentType]: {
      tasksCompleted: number;
      tasksFailed: number;
      avgDuration: number;
    }
  }
}
```

---

## Rate Limiting

**Per-workspace limits** (to be implemented in Phase 5):
- Start execution: 5 per minute
- Status checks: 30 per minute
- Control operations: 10 per minute

**Current Implementation**: No rate limits (add in production)

---

## Monitoring & Observability

### Metrics to Monitor

1. **Execution Duration**: Total time from start to completion
2. **Task Processing Speed**: Average time per task
3. **Success Rate**: % of tasks completed successfully
4. **Health Score Trends**: Track over multiple executions
5. **Agent Performance**: Tasks per agent, errors per agent
6. **Queue Depth**: Number of pending tasks
7. **Error Patterns**: Recurring failure types

### Recommended Monitoring

```typescript
// Track execution metrics
const metrics = await fetch(`/api/executions/${id}/status`)
  .then(r => r.json())
  .then(data => ({
    completionRate: data.execution.completedTasks / data.execution.totalTasks,
    healthScore: data.health.score,
    duration: Date.now() - new Date(data.execution.startedAt).getTime(),
  }));

// Log for analysis
console.log('Execution Metrics:', metrics);
```

---

## Integration Examples

### Example 1: Simple Execution Flow

```typescript
// Start execution
const startResponse = await fetch('/api/executions/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    strategyId: 'strat_123',
    workspaceId: 'ws_456',
  }),
});

const { executionId } = await startResponse.json();

// Poll for status
const pollStatus = async () => {
  const response = await fetch(`/api/executions/${executionId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};

// Check every 5 seconds
const interval = setInterval(async () => {
  const data = await pollStatus();
  console.log(`Progress: ${data.execution.completedTasks}/${data.execution.totalTasks}`);

  if (data.execution.status === 'completed') {
    clearInterval(interval);
    console.log('Execution complete!');
  }
}, 5000);
```

### Example 2: Real-Time Bridge Integration

```typescript
import { executionBridge } from '@/lib/strategy/execution-bridge';

// Start execution
const startResponse = await fetch('/api/executions/start', {...});
const { executionId } = await startResponse.json();

// Connect to real-time updates
await executionBridge.connectWebSocket(
  executionId,
  `wss://${window.location.host}/api/executions/${executionId}/stream`
);

// Subscribe to updates
executionBridge.subscribe(executionId, (state) => {
  console.log('Execution state:', state.execution.status);
  console.log('Progress:', state.execution.completedTasks, '/', state.execution.totalTasks);
  console.log('Health:', state.health.score);
});

// Listen to specific events
executionBridge.on('task-completed', (event) => {
  console.log('Task completed:', event.data.taskId);
}, executionId);

executionBridge.on('task-failed', (event) => {
  console.log('Task failed:', event.data.error);
}, executionId);

executionBridge.on('execution-completed', () => {
  console.log('Execution finished!');
}, executionId);
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid or expired token | Re-authenticate and get new token |
| 403 Access Denied | No access to workspace | Verify workspace_id and user permissions |
| 404 Not Found | Execution ID doesn't exist | Check execution ID format and spelling |
| WebSocket fails | Browser doesn't support WS | System automatically falls back to SSE |
| Updates lag | Network connectivity | Check browser console for reconnection attempts |
| High health score drops | Many task failures | Check agent logs and task error messages |

---

## Best Practices

1. **Always authenticate**: All requests require valid Bearer token
2. **Verify workspace access**: Ensure user can access workspace_id
3. **Handle errors gracefully**: Implement proper error handling and retries
4. **Monitor health**: Check health score regularly, alert if < 60
5. **Use real-time bridge**: Prefer WebSocket for live updates over polling
6. **Implement timeouts**: Set reasonable timeouts for network requests
7. **Log execution IDs**: Track execution IDs for debugging and monitoring
8. **Clean up resources**: Disconnect bridge when component unmounts

---

## Version History

- **v1.0** (2025-11-26): Initial API design
- Future versions will maintain backward compatibility

---

**Last Updated**: 2025-11-26
**Status**: Production Ready
