# AUTONOMOUS TASK ORCHESTRATOR AGENT SPECIFICATION

**Agent Name**: Autonomous Task Orchestrator Agent
**Agent Type**: Tier 4 - Autonomous Execution Agent
**Priority**: P1 - Critical
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `autonomous_tasks` - Task queue and execution tracking (read/write)
- `marketing_strategies` - Source strategies to execute (read-only)
- `audit_logs` - Execution audit trail (write-only)

### Agent Purpose
Converts marketing strategies into executable tasks, manages task queue with priority and dependencies, orchestrates specialist agents (Content Generator, Calendar Creator), handles failures with retry logic, and provides real-time execution status.

---

## 2. PURPOSE & SCOPE

### What This Agent Does
1. **Strategy Decomposition**: Break marketing strategies into atomic, executable tasks
2. **Task Prioritization**: Assign priority scores based on urgency, dependencies, business impact
3. **Dependency Management**: Track task dependencies (Task B waits for Task A)
4. **Agent Orchestration**: Route tasks to appropriate specialist agents
5. **Retry Logic**: Handle failures with exponential backoff
6. **Status Tracking**: Real-time task progress monitoring

### What This Agent Does NOT Do
- Does NOT generate content (delegates to AI Content Generation Agent)
- Does NOT create calendar posts (delegates to Content Calendar Agent)
- Does NOT send emails (delegates to Email Agent)
- Does NOT analyze sentiment (delegates to AI Intelligence Extraction Agent)

---

## 3. DATABASE SCHEMA MAPPING

### autonomous_tasks Table (EXISTING)
```sql
CREATE TABLE autonomous_tasks (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  contact_id UUID REFERENCES contacts(id),

  task_description TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN (
    'content', 'design', 'campaign', 'analysis', 'email',
    'social_media', 'research', 'strategy', 'other'
  )),
  assigned_agent TEXT NOT NULL, -- 'content-generator', 'calendar-agent', 'email-agent'

  priority INTEGER CHECK (priority BETWEEN 1 AND 10), -- 1=low, 10=urgent
  status TEXT CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  depends_on UUID[], -- Array of task IDs that must complete first

  input_data JSONB,
  output_data JSONB,
  error_message TEXT,

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**TypeScript Interface**:
```typescript
interface AutonomousTask {
  id: string;
  workspace_id: string;
  contact_id: string;

  task_description: string;
  task_type: 'content' | 'design' | 'campaign' | 'analysis' | 'email' | 'social_media' | 'research' | 'strategy' | 'other';
  assigned_agent: string;

  priority: number; // 1-10
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  depends_on: string[];

  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;

  started_at?: Date;
  completed_at?: Date;
  retry_count: number;
  max_retries: number;

  created_at: Date;
  updated_at: Date;
}
```

---

## 4. CORE FUNCTIONS

### 4.1 decomposeStrategy()
**Purpose**: Break marketing strategy into executable tasks.

**Input**:
```typescript
interface DecomposeStrategyRequest {
  strategy_id: string;
  workspace_id: string;
  auto_execute?: boolean; // Default: false
}
```

**Output**:
```typescript
interface DecomposeStrategyResult {
  success: boolean;
  tasks_created: number;
  tasks: AutonomousTask[];
  execution_plan: ExecutionPlan;
}

interface ExecutionPlan {
  total_tasks: number;
  phases: Phase[];
  estimated_duration_days: number;
}

interface Phase {
  phase_name: string;
  tasks: string[]; // Task IDs
  dependencies: string[]; // Task IDs from previous phases
  estimated_days: number;
}
```

**Business Logic**:
1. **Fetch strategy**:
   ```typescript
   const { data: strategy, error } = await supabase
     .from('marketing_strategies')
     .select('*')
     .eq('id', strategy_id)
     .eq('workspace_id', workspace_id)
     .single();
   ```

2. **Extract tasks from strategy**:
   ```typescript
   const tasks: AutonomousTask[] = [];

   // From campaign calendar
   strategy.campaign_calendar.phases.forEach((phase, phaseIndex) => {
     phase.key_activities.forEach(activity => {
       tasks.push({
         task_description: activity,
         task_type: classifyActivityType(activity), // 'content', 'campaign', etc.
         assigned_agent: determineAgent(activity),
         priority: calculatePriority(phase, activity),
         depends_on: getPhaseOne if phaseIndex === 0 ? [] : [previousPhaseTaskIds],
         input_data: {
           phase_name: phase.phase_name,
           activity,
           content_focus: phase.content_focus,
           strategy_id,
         },
       });
     });
   });

   // From content pillars
   strategy.content_pillars.forEach(pillar => {
     tasks.push({
       task_description: `Create content for ${pillar.name} pillar`,
       task_type: 'content',
       assigned_agent: 'content-generator',
       priority: Math.ceil(pillar.percentage_allocation / 10), // Higher % = higher priority
       input_data: {
         pillar,
         strategy_id,
       },
     });
   });

   // From KPIs (setup tracking)
   strategy.kpis.forEach(kpi => {
     tasks.push({
       task_description: `Setup tracking for ${kpi.metric_name}`,
       task_type: 'analysis',
       assigned_agent: 'analytics-agent',
       priority: 7, // High priority for measurement
       input_data: {
         kpi,
         strategy_id,
       },
     });
   });
   ```

3. **Calculate priorities**:
   ```typescript
   function calculatePriority(phase: CampaignPhase, activity: string): number {
     let priority = 5; // Base

     // Urgency: earlier phases = higher priority
     if (phase.phase_name.includes('Phase 1')) priority += 3;
     else if (phase.phase_name.includes('Phase 2')) priority += 2;
     else if (phase.phase_name.includes('Phase 3')) priority += 1;

     // Urgency: time-sensitive activities
     if (activity.includes('launch') || activity.includes('deadline')) priority += 2;

     // Impact: high-impact activities
     if (activity.includes('webinar') || activity.includes('campaign')) priority += 1;

     return Math.min(priority, 10);
   }
   ```

4. **Determine assigned agent**:
   ```typescript
   function determineAgent(activity: string): string {
     if (activity.includes('blog') || activity.includes('content') || activity.includes('copy')) {
       return 'content-generator';
     }
     if (activity.includes('calendar') || activity.includes('schedule')) {
       return 'calendar-agent';
     }
     if (activity.includes('email') || activity.includes('drip')) {
       return 'email-agent';
     }
     if (activity.includes('ad') || activity.includes('campaign')) {
       return 'campaign-manager';
     }
     if (activity.includes('analytics') || activity.includes('tracking')) {
       return 'analytics-agent';
     }
     return 'general-executor';
   }
   ```

5. **Insert tasks into database**:
   ```typescript
   const { data: insertedTasks, error } = await supabase
     .from('autonomous_tasks')
     .insert(tasks.map(t => ({
       ...t,
       workspace_id,
       contact_id: strategy.contact_id,
       status: 'queued',
       retry_count: 0,
       max_retries: 3,
     })))
     .select();
   ```

6. **Build execution plan**:
   ```typescript
   const plan = {
     total_tasks: tasks.length,
     phases: groupTasksByPhase(tasks),
     estimated_duration_days: calculateDuration(tasks),
   };
   ```

7. **Auto-execute if requested**:
   ```typescript
   if (auto_execute) {
     await executeQueue(workspace_id);
   }
   ```

**Performance**: < 5 seconds for 50-100 tasks

---

### 4.2 executeQueue()
**Purpose**: Execute queued tasks in priority order, respecting dependencies.

**Input**:
```typescript
interface ExecuteQueueRequest {
  workspace_id: string;
  max_concurrent?: number; // Default: 5
  filter?: {
    priority_min?: number;
    task_type?: string;
    assigned_agent?: string;
  };
}
```

**Output**:
```typescript
interface ExecuteQueueResult {
  success: boolean;
  tasks_executed: number;
  tasks_failed: number;
  tasks_remaining: number;
  execution_log: ExecutionLogEntry[];
}

interface ExecutionLogEntry {
  task_id: string;
  status: 'completed' | 'failed';
  duration_ms: number;
  error?: string;
}
```

**Business Logic**:
1. **Fetch queued tasks** (priority order, dependency-aware):
   ```typescript
   const { data: queuedTasks } = await supabase
     .from('autonomous_tasks')
     .select('*')
     .eq('workspace_id', workspace_id)
     .eq('status', 'queued')
     .order('priority', { ascending: false })
     .order('created_at', { ascending: true });

   // Filter out tasks with unmet dependencies
   const readyTasks = queuedTasks.filter(task => {
     if (!task.depends_on || task.depends_on.length === 0) return true;

     // Check if all dependencies are completed
     return task.depends_on.every(depId => {
       const dep = queuedTasks.find(t => t.id === depId);
       return dep?.status === 'completed';
     });
   });
   ```

2. **Execute tasks concurrently** (up to max_concurrent):
   ```typescript
   const executions: Promise<ExecutionLogEntry>[] = [];

   for (let i = 0; i < Math.min(readyTasks.length, max_concurrent); i++) {
     const task = readyTasks[i];
     executions.push(executeTask(task));
   }

   const results = await Promise.allSettled(executions);
   ```

3. **Execute single task**:
   ```typescript
   async function executeTask(task: AutonomousTask): Promise<ExecutionLogEntry> {
     const startTime = Date.now();

     try {
       // Mark as in_progress
       await supabase
         .from('autonomous_tasks')
         .update({ status: 'in_progress', started_at: new Date() })
         .eq('id', task.id);

       // Route to assigned agent
       const result = await routeToAgent(task);

       // Mark as completed
       await supabase
         .from('autonomous_tasks')
         .update({
           status: 'completed',
           completed_at: new Date(),
           output_data: result,
         })
         .eq('id', task.id);

       return {
         task_id: task.id,
         status: 'completed',
         duration_ms: Date.now() - startTime,
       };
     } catch (error) {
       // Handle failure
       return await handleTaskFailure(task, error, startTime);
     }
   }
   ```

4. **Route to agent**:
   ```typescript
   async function routeToAgent(task: AutonomousTask): Promise<any> {
     switch (task.assigned_agent) {
       case 'content-generator':
         return await fetch('/api/agents/content-generator', {
           method: 'POST',
           body: JSON.stringify({
             task_id: task.id,
             description: task.task_description,
             input: task.input_data,
           }),
         }).then(r => r.json());

       case 'calendar-agent':
         return await fetch('/api/agents/calendar', {
           method: 'POST',
           body: JSON.stringify({
             task_id: task.id,
             description: task.task_description,
             input: task.input_data,
           }),
         }).then(r => r.json());

       case 'email-agent':
         return await fetch('/api/agents/email', {
           method: 'POST',
           body: JSON.stringify({
             task_id: task.id,
             description: task.task_description,
             input: task.input_data,
           }),
         }).then(r => r.json());

       default:
         throw new Error(`Unknown agent: ${task.assigned_agent}`);
     }
   }
   ```

5. **Handle failures**:
   ```typescript
   async function handleTaskFailure(
     task: AutonomousTask,
     error: Error,
     startTime: number
   ): Promise<ExecutionLogEntry> {
     const newRetryCount = task.retry_count + 1;

     if (newRetryCount < task.max_retries) {
       // Retry with exponential backoff
       const backoffMs = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s

       await supabase
         .from('autonomous_tasks')
         .update({
           status: 'queued',
           retry_count: newRetryCount,
           error_message: error.message,
         })
         .eq('id', task.id);

       // Schedule retry
       setTimeout(() => executeTask(task), backoffMs);

       return {
         task_id: task.id,
         status: 'failed',
         duration_ms: Date.now() - startTime,
         error: `Retry ${newRetryCount}/${task.max_retries}: ${error.message}`,
       };
     } else {
       // Max retries exceeded, mark as failed
       await supabase
         .from('autonomous_tasks')
         .update({
           status: 'failed',
           error_message: `Max retries exceeded: ${error.message}`,
         })
         .eq('id', task.id);

       return {
         task_id: task.id,
         status: 'failed',
         duration_ms: Date.now() - startTime,
         error: `Failed after ${task.max_retries} retries: ${error.message}`,
       };
     }
   }
   ```

**Performance**:
- Single task execution: 5-30 seconds (depends on agent)
- Concurrent execution: 5 tasks at once
- Queue processing: Continuous (runs every 5 minutes via cron)

---

### 4.3 getTaskStatus()
**Purpose**: Get real-time status of task execution.

**Input**:
```typescript
interface GetTaskStatusRequest {
  task_id?: string;
  workspace_id: string;
  filters?: {
    status?: string;
    assigned_agent?: string;
  };
}
```

**Output**:
```typescript
interface TaskStatusResult {
  success: boolean;
  tasks: TaskStatus[];
  summary: {
    total: number;
    queued: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
}

interface TaskStatus {
  id: string;
  description: string;
  status: string;
  priority: number;
  assigned_agent: string;
  progress_percentage: number;
  eta_seconds?: number;
  error_message?: string;
  dependencies_met: boolean;
}
```

**Business Logic**:
1. **Fetch tasks**:
   ```typescript
   let query = supabase
     .from('autonomous_tasks')
     .select('*')
     .eq('workspace_id', workspace_id);

   if (task_id) {
     query = query.eq('id', task_id);
   }

   if (filters?.status) {
     query = query.eq('status', filters.status);
   }

   if (filters?.assigned_agent) {
     query = query.eq('assigned_agent', filters.assigned_agent);
   }

   const { data: tasks } = await query;
   ```

2. **Calculate progress**:
   ```typescript
   const taskStatuses = tasks.map(task => {
     let progress = 0;
     if (task.status === 'queued') progress = 0;
     if (task.status === 'in_progress') progress = 50;
     if (task.status === 'completed') progress = 100;
     if (task.status === 'failed') progress = 0;

     // Check dependencies
     const dependenciesMet = !task.depends_on || task.depends_on.every(depId => {
       const dep = tasks.find(t => t.id === depId);
       return dep?.status === 'completed';
     });

     return {
       id: task.id,
       description: task.task_description,
       status: task.status,
       priority: task.priority,
       assigned_agent: task.assigned_agent,
       progress_percentage: progress,
       dependencies_met: dependenciesMet,
       error_message: task.error_message,
     };
   });
   ```

3. **Build summary**:
   ```typescript
   const summary = {
     total: tasks.length,
     queued: tasks.filter(t => t.status === 'queued').length,
     in_progress: tasks.filter(t => t.status === 'in_progress').length,
     completed: tasks.filter(t => t.status === 'completed').length,
     failed: tasks.filter(t => t.status === 'failed').length,
     cancelled: tasks.filter(t => t.status === 'cancelled').length,
   };
   ```

---

### 4.4 cancelTask()
**Purpose**: Cancel a queued or in-progress task.

**Input**:
```typescript
interface CancelTaskRequest {
  task_id: string;
  reason?: string;
}
```

**Output**:
```typescript
interface CancelTaskResult {
  success: boolean;
  task_id: string;
  previous_status: string;
}
```

**Business Logic**:
```typescript
const { data: task, error } = await supabase
  .from('autonomous_tasks')
  .select('*')
  .eq('id', task_id)
  .single();

if (task.status === 'completed') {
  throw new Error('Cannot cancel completed task');
}

await supabase
  .from('autonomous_tasks')
  .update({
    status: 'cancelled',
    error_message: reason || 'Cancelled by user',
  })
  .eq('id', task_id);
```

---

### 4.5 retryFailedTask()
**Purpose**: Manually retry a failed task.

**Input**:
```typescript
interface RetryTaskRequest {
  task_id: string;
  reset_retry_count?: boolean; // Default: false
}
```

**Output**:
```typescript
interface RetryTaskResult {
  success: boolean;
  task_id: string;
  new_status: string;
}
```

**Business Logic**:
```typescript
const updates: any = {
  status: 'queued',
  error_message: null,
};

if (reset_retry_count) {
  updates.retry_count = 0;
}

await supabase
  .from('autonomous_tasks')
  .update(updates)
  .eq('id', task_id);

// Trigger immediate execution
await executeTask(task);
```

---

## 5. API ENDPOINTS

### POST /api/tasks/decompose
**Request**:
```json
{
  "strategy_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "auto_execute": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "tasks_created": 45,
  "tasks": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "task_description": "Launch LinkedIn ad campaign",
      "task_type": "campaign",
      "assigned_agent": "campaign-manager",
      "priority": 8,
      "status": "queued",
      "depends_on": [],
      "input_data": {
        "phase_name": "Phase 1: Awareness",
        "activity": "Launch LinkedIn ad campaign",
        "strategy_id": "ee0e8400-e29b-41d4-a716-446655440000"
      }
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440001",
      "task_description": "Publish 12 blog posts",
      "task_type": "content",
      "assigned_agent": "content-generator",
      "priority": 7,
      "status": "queued",
      "depends_on": [],
      "input_data": {
        "post_count": 12,
        "content_pillar": "AI Education",
        "strategy_id": "ee0e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "execution_plan": {
    "total_tasks": 45,
    "phases": [
      {
        "phase_name": "Phase 1: Awareness",
        "tasks": ["ff0e8400", "aa0e8400", "..."],
        "dependencies": [],
        "estimated_days": 30
      },
      {
        "phase_name": "Phase 2: Engagement",
        "tasks": ["bb0e8400", "cc0e8400", "..."],
        "dependencies": ["ff0e8400", "aa0e8400"],
        "estimated_days": 30
      }
    ],
    "estimated_duration_days": 90
  }
}
```

### POST /api/tasks/execute
**Request**:
```json
{
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "max_concurrent": 5,
  "filter": {
    "priority_min": 7,
    "task_type": "content"
  }
}
```

**Response**:
```json
{
  "success": true,
  "tasks_executed": 12,
  "tasks_failed": 1,
  "tasks_remaining": 32,
  "execution_log": [
    {
      "task_id": "ff0e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "duration_ms": 15200
    },
    {
      "task_id": "aa0e8400-e29b-41d4-a716-446655440001",
      "status": "failed",
      "duration_ms": 8000,
      "error": "Retry 1/3: Claude API timeout"
    }
  ]
}
```

### GET /api/tasks/status
**Query Params**: `?workspace_id=770e8400&status=in_progress`

**Response**:
```json
{
  "success": true,
  "tasks": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "description": "Launch LinkedIn ad campaign",
      "status": "in_progress",
      "priority": 8,
      "assigned_agent": "campaign-manager",
      "progress_percentage": 50,
      "dependencies_met": true
    }
  ],
  "summary": {
    "total": 45,
    "queued": 32,
    "in_progress": 5,
    "completed": 7,
    "failed": 1,
    "cancelled": 0
  }
}
```

### POST /api/tasks/:task_id/cancel
**Response**:
```json
{
  "success": true,
  "task_id": "ff0e8400-e29b-41d4-a716-446655440000",
  "previous_status": "queued"
}
```

### POST /api/tasks/:task_id/retry
**Request**:
```json
{
  "reset_retry_count": true
}
```

**Response**:
```json
{
  "success": true,
  "task_id": "ff0e8400-e29b-41d4-a716-446655440000",
  "new_status": "queued"
}
```

---

## 6. BUSINESS RULES

### Task Priority Rules
- **Priority 9-10 (Urgent)**: Time-sensitive launches, deadlines within 48 hours
- **Priority 7-8 (High)**: Phase 1 activities, high-impact campaigns
- **Priority 5-6 (Medium)**: Phase 2 activities, content creation
- **Priority 3-4 (Low)**: Phase 3 activities, analytics setup
- **Priority 1-2 (Backlog)**: Nice-to-have, future planning

### Dependency Rules
1. **Phase dependencies**: Phase 2 tasks depend on Phase 1 completion
2. **Content dependencies**: Calendar posts depend on content generation
3. **Campaign dependencies**: Email campaigns depend on content approval
4. **Parallel execution**: Tasks with no dependencies can run concurrently

### Retry Rules
1. **Max retries**: 3 attempts by default
2. **Backoff strategy**: Exponential (2s, 4s, 8s)
3. **Retry conditions**: Transient errors (API timeout, rate limit)
4. **No retry conditions**: Invalid input, missing data, business logic errors

### Execution Rules
1. **Max concurrent tasks**: 5 by default (configurable)
2. **Queue check frequency**: Every 5 minutes (cron job)
3. **Task timeout**: 5 minutes per task
4. **Agent availability**: If agent unavailable, requeue task

---

## 7. INTEGRATION POINTS

### 7.1 Marketing Strategy Generator Agent
**Dependency**: Consumes strategies to decompose
**Data Flow**: Marketing Strategy → Task Queue
**Integration**:
```typescript
const strategy = await fetch('/api/strategies/generate', { method: 'POST', body: {...} });
await fetch('/api/tasks/decompose', {
  method: 'POST',
  body: JSON.stringify({ strategy_id: strategy.strategy_id }),
});
```

### 7.2 AI Content Generation Agent (Downstream)
**Dependency**: Orchestrator routes 'content' tasks to this agent
**Data Flow**: Task Queue → Content Generator
**Integration**:
```typescript
if (task.assigned_agent === 'content-generator') {
  const result = await fetch('/api/agents/content-generator', {
    method: 'POST',
    body: JSON.stringify({ task_id: task.id, input: task.input_data }),
  });
}
```

### 7.3 Content Calendar Agent (Downstream)
**Dependency**: Orchestrator routes 'calendar' tasks to this agent
**Data Flow**: Task Queue → Calendar Agent
**Integration**:
```typescript
if (task.assigned_agent === 'calendar-agent') {
  const result = await fetch('/api/agents/calendar', {
    method: 'POST',
    body: JSON.stringify({ task_id: task.id, input: task.input_data }),
  });
}
```

---

## 8. PERFORMANCE REQUIREMENTS

### Response Times
- **Decompose Strategy**: < 5 seconds (50-100 tasks)
- **Execute Single Task**: 5-30 seconds (depends on agent)
- **Get Task Status**: < 500ms
- **Cancel Task**: < 200ms
- **Retry Task**: < 1 second

### Throughput
- **Concurrent Task Execution**: 5 tasks at once
- **Queue Processing**: 100 tasks per hour
- **Tasks per Strategy**: 50-200 tasks

### Resource Limits
- **Database Connections**: Use connection pooling
- **API Rate Limits**: Respect agent rate limits (backoff)
- **Memory**: < 100MB per queue execution

---

## 9. TESTING STRATEGY

### Unit Tests
```typescript
describe('Autonomous Task Orchestrator Agent', () => {
  describe('decomposeStrategy()', () => {
    it('should create tasks from strategy', async () => {
      const result = await decomposeStrategy({ strategy_id, workspace_id });
      expect(result.tasks_created).toBeGreaterThan(0);
      expect(result.tasks).toBeInstanceOf(Array);
    });

    it('should assign correct priorities', async () => {
      const result = await decomposeStrategy({ strategy_id, workspace_id });
      const phase1Tasks = result.tasks.filter(t => t.input_data.phase_name.includes('Phase 1'));
      expect(phase1Tasks.every(t => t.priority >= 7)).toBe(true);
    });
  });

  describe('executeQueue()', () => {
    it('should execute tasks in priority order', async () => {
      await decomposeStrategy({ strategy_id, workspace_id });
      const result = await executeQueue({ workspace_id, max_concurrent: 1 });
      expect(result.tasks_executed).toBeGreaterThan(0);
    });

    it('should respect dependencies', async () => {
      const task1 = await createTask({ priority: 5 });
      const task2 = await createTask({ priority: 10, depends_on: [task1.id] });

      await executeQueue({ workspace_id });

      const task2Status = await getTaskStatus({ task_id: task2.id });
      expect(task2Status.status).toBe('queued'); // Wait for task1
    });
  });
});
```

---

## 10. ERROR CODES

| Code | Description |
|------|-------------|
| TASK_001 | Strategy not found |
| TASK_002 | Task decomposition failed |
| TASK_003 | Task not found |
| TASK_004 | Agent not available |
| TASK_005 | Max retries exceeded |
| TASK_006 | Dependency not met |
| TASK_007 | Invalid task type |
| TASK_008 | Execution timeout |

---

## 11. AUSTRALIAN COMPLIANCE

### Timezones
- **Task Scheduling**: All timestamps in AEST/AEDT (Australia/Sydney)
- **Cron Jobs**: Execute at 9am AEST (optimal business hours)
- **Email Tasks**: Schedule for 9am-12pm AEST (best open rates)

### Working Hours
- **Task Execution**: Pause overnight (10pm-6am AEST) for non-urgent tasks
- **Retry Logic**: Respect business hours (retry during 9am-5pm AEST)

---

## 12. SECURITY

### Task Isolation
- **RLS Policies**: All tasks scoped to workspace_id
- **User Permissions**: Only workspace members can view/cancel tasks
- **Agent Authentication**: Tasks include signed JWT for agent verification

### Audit Trail
```typescript
await supabase.from('audit_logs').insert({
  org_id,
  action: 'task.executed',
  resource: 'autonomous_tasks',
  resource_id: task_id,
  agent: 'task-orchestrator',
  status: task.status,
  details: {
    assigned_agent: task.assigned_agent,
    duration_ms,
    retry_count: task.retry_count,
  },
});
```

---

## 13. MONITORING & METRICS

### Performance Metrics
```typescript
interface OrchestratorMetrics {
  tasks_created_today: number;
  tasks_executed_today: number;
  tasks_failed_today: number;
  average_execution_time_ms: number;
  queue_depth: number; // Tasks waiting
  agents_utilization: Record<string, number>; // { 'content-generator': 0.8 }
}
```

### Logging
```typescript
logger.info('Task executed', {
  task_id,
  assigned_agent,
  status: 'completed',
  duration_ms: 15200,
  retry_count: 0,
});
```

### Alerts
- **Queue Depth > 100**: Alert ops team (backlog building)
- **Failed Tasks > 10%**: Alert dev team (agent issues)
- **Execution Time > 60s**: Alert ops team (performance degradation)

---

## 14. FUTURE ENHANCEMENTS

### Phase 2
1. **Intelligent Scheduling**: Use AI to predict optimal task execution times
2. **Resource Optimization**: Batch similar tasks to reduce API costs
3. **Agent Health Monitoring**: Auto-disable unhealthy agents, reroute tasks
4. **Task Templates**: Pre-defined task decompositions for common strategies

### Phase 3
1. **Multi-Workspace Orchestration**: Execute tasks across multiple workspaces
2. **Human-in-the-Loop**: Require approval for high-risk tasks (e.g., sending emails)
3. **Task Collaboration**: Multiple agents work on single complex task
4. **Predictive Failure Detection**: Use ML to predict task failures before execution

---

**END OF AUTONOMOUS TASK ORCHESTRATOR AGENT SPECIFICATION**
