# Orchestrator Dashboard - Quick Reference Card

**For Developers** | **Version 1.0.0** | **Updated: 2025-12-02**

---

## Quick Start

```bash
# Navigate to dashboard
http://localhost:3008/dashboard/orchestrator

# Run E2E tests
npm run test -- tests/e2e/orchestrator-dashboard.spec.ts
```

---

## File Locations

```
src/
├── app/api/orchestrator/dashboard/
│   ├── tasks/route.ts                      # GET task list
│   └── tasks/[id]/
│       ├── route.ts                        # GET task detail
│       ├── steps/route.ts                  # GET task steps
│       ├── evidence/route.ts               # GET evidence package
│       ├── failures/route.ts               # GET failure analysis
│       └── retry/route.ts                  # POST retry task
│
├── lib/orchestrator/
│   └── dashboard-service.ts                # Data formatting & helpers
│
├── components/orchestrator/
│   ├── TaskListView.tsx                    # Task list with filters
│   ├── TaskDetailView.tsx                  # Task detail with tabs
│   ├── ExecutionTimeline.tsx               # Visual timeline
│   ├── VerificationStatusPanel.tsx         # Verification table
│   ├── EvidencePackageViewer.tsx           # Evidence display
│   └── FailureAnalysisPanel.tsx            # Failure analysis
│
├── hooks/
│   └── useOrchestratorDashboard.ts         # Custom hooks
│
└── app/dashboard/orchestrator/
    └── page.tsx                            # Main dashboard page

docs/
├── ORCHESTRATOR_DASHBOARD_GUIDE.md         # Complete user guide
└── ORCHESTRATOR_DASHBOARD_IMPLEMENTATION_SUMMARY.md  # Technical docs

tests/e2e/
└── orchestrator-dashboard.spec.ts          # E2E test suite
```

---

## API Quick Reference

### GET /api/orchestrator/dashboard/tasks
**Fetch task list**
```typescript
// Query params: workspaceId (required), status, limit, sortBy, order
GET /api/orchestrator/dashboard/tasks?workspaceId=ws-123&status=failed&sortBy=created_at&order=desc

// Response
{
  tasks: Array<OrchestratorTask>,
  count: number,
  filters: { status, limit, sortBy, order }
}
```

### GET /api/orchestrator/dashboard/tasks/{id}
**Fetch task detail**
```typescript
GET /api/orchestrator/dashboard/tasks/task-123?workspaceId=ws-123

// Response
{
  task: { id, objective, status, agentChain, riskScore, ... },
  steps: Array<ExecutionStep>,
  timeline: Array<TimelineItem>,
  verificationResults: Array<Evidence>
}
```

### GET /api/orchestrator/dashboard/tasks/{id}/evidence
**Fetch evidence package**
```typescript
GET /api/orchestrator/dashboard/tasks/task-123/evidence?workspaceId=ws-123

// Response
{
  taskId: string,
  evidence: { executionLog, stateSnapshots, verificationEvidence },
  proof: { checksums, hmac, merkleRoot, merkleTree },
  metadata: { verificationStatus, verifierId }
}
```

### GET /api/orchestrator/dashboard/tasks/{id}/failures
**Fetch failure analysis**
```typescript
GET /api/orchestrator/dashboard/tasks/task-123/failures?workspaceId=ws-123

// Response
{
  taskId: string,
  status: string,
  analysis: {
    rootCause: string,
    failureType: string,
    failedSteps: Array<FailedStep>,
    impactedSteps: Array<ImpactedStep>,
    recoverySuggestions: Array<Suggestion>
  }
}
```

### POST /api/orchestrator/dashboard/tasks/{id}/retry
**Retry failed task**
```typescript
POST /api/orchestrator/dashboard/tasks/task-123/retry?workspaceId=ws-123

// Response
{
  message: "Task retry initiated",
  originalTaskId: string,
  retryTaskId: string,
  retryAttempt: number,
  failedStepsRetrying: number
}
```

---

## Custom Hooks Usage

### useTaskList
```typescript
import { useTaskList } from '@/hooks/useOrchestratorDashboard';

const { tasks, loading, error, count, refresh } = useTaskList(
  {
    status: 'failed',      // Filter by status
    sortBy: 'created_at',  // Sort field
    order: 'desc',         // Sort order
    limit: 50,             // Max results
  },
  true  // Auto-refresh every 30s
);
```

### useTaskDetail
```typescript
import { useTaskDetail } from '@/hooks/useOrchestratorDashboard';

const { task, steps, timeline, verificationResults, loading, error, refresh } =
  useTaskDetail('task-123', true);  // Auto-refresh every 10s if running
```

### useTaskRetry
```typescript
import { useTaskRetry } from '@/hooks/useOrchestratorDashboard';

const { retryTask, retrying, error } = useTaskRetry();

// Later:
const retryTaskId = await retryTask('task-123');
if (retryTaskId) {
  console.log('New task ID:', retryTaskId);
}
```

---

## Data Service Functions

```typescript
import {
  formatTaskForUI,
  getExecutionTimeline,
  formatDuration,
  formatRelativeTime,
  formatAbsoluteTime,
} from '@/lib/orchestrator/dashboard-service';

// Format raw task for UI
const uiTask = formatTaskForUI(rawTask);
// Returns: { statusColor, statusIcon, durationFormatted, progressPercent, ... }

// Extract timeline from task
const timeline = getExecutionTimeline(task);
// Returns: Array<{ stepIndex, assignedAgent, duration, statusColor, ... }>

// Format durations
formatDuration(5000);      // "5s"
formatDuration(65000);     // "1m 5s"
formatDuration(3665000);   // "1h 1m"

// Format timestamps
formatRelativeTime('2025-12-02T10:00:00Z');  // "2 hours ago"
formatAbsoluteTime('2025-12-02T10:00:00Z');  // "Dec 2, 2025, 10:00 AM UTC"
```

---

## Component Props

### TaskListView
```typescript
<TaskListView
  tasks={TaskForUI[]}
  loading={boolean}
  onTaskSelect={(taskId: string) => void}
  selectedTaskId={string}
  onFilterChange={(filters) => void}
/>
```

### TaskDetailView
```typescript
<TaskDetailView
  task={any}
  steps={any[]}
  timeline={any[]}
  verificationResults={any[]}
  loading={boolean}
  onBack={() => void}
  onRetry={() => void}
  onViewEvidence={() => void}
/>
```

### ExecutionTimeline
```typescript
<ExecutionTimeline
  timeline={Array<TimelineItem>}
/>
```

### VerificationStatusPanel
```typescript
<VerificationStatusPanel
  steps={Array<ExecutionStep>}
/>
```

### EvidencePackageViewer
```typescript
<EvidencePackageViewer
  taskId={string}
/>
```

### FailureAnalysisPanel
```typescript
<FailureAnalysisPanel
  taskId={string}
/>
```

---

## TypeScript Types

```typescript
// Task for UI display
interface TaskForUI {
  id: string;
  objective: string;
  status: string;
  statusColor: string;       // 'green' | 'red' | 'blue' | 'yellow'
  statusIcon: string;        // '✅' | '❌' | '🔄' | '⏳'
  createdAt: string;
  createdAtRelative: string;  // "2 hours ago"
  duration: number | null;
  durationFormatted: string;  // "5m 23s"
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;    // 0-100
  agentChain: string[];
  riskScore: number;          // 0-1
  confidenceScore: number;    // 0-1
}

// Execution timeline item
interface ExecutionTimelineItem {
  stepIndex: number;
  assignedAgent: string;
  status: string;
  statusColor: string;
  verified: boolean;
  verificationAttempts: number;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  durationFormatted: string;
  outputSummary?: string;
}

// Failure analysis
interface FailureAnalysis {
  rootCause: string;
  failureType: string;
  failedSteps: Array<{
    stepIndex: number;
    assignedAgent: string;
    error: string;
    verificationAttempts: number;
  }>;
  impactedSteps: Array<{
    stepIndex: number;
    assignedAgent: string;
    status: string;
  }>;
  recoverySuggestions: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}
```

---

## Common Patterns

### Fetching Task List with Filters
```typescript
const [filters, setFilters] = useState({ status: 'failed' });
const { tasks, loading } = useTaskList(filters, true);

// Update filters
const handleFilterChange = (newFilters) => {
  setFilters((prev) => ({ ...prev, ...newFilters }));
};
```

### Displaying Task Detail
```typescript
const [selectedTaskId, setSelectedTaskId] = useState(null);
const { task, steps, timeline } = useTaskDetail(selectedTaskId, true);

// Select task
const handleTaskSelect = (taskId) => {
  setSelectedTaskId(taskId);
};

// Back to list
const handleBack = () => {
  setSelectedTaskId(null);
};
```

### Retrying Failed Task
```typescript
const { retryTask, retrying, error } = useTaskRetry();

const handleRetry = async (taskId) => {
  const retryTaskId = await retryTask(taskId);
  if (retryTaskId) {
    alert(`Task retry initiated! New task ID: ${retryTaskId}`);
    // Optionally navigate to new task
    setSelectedTaskId(retryTaskId);
  }
};
```

### Programmatic Task Status Check
```typescript
async function checkTaskStatus(taskId, workspaceId) {
  const response = await fetch(
    `/api/orchestrator/dashboard/tasks/${taskId}?workspaceId=${workspaceId}`
  );
  const { task } = await response.json();
  return task.status; // 'completed' | 'failed' | 'running' | 'pending' | 'halted'
}
```

---

## Testing Commands

```bash
# Run all E2E tests
npm run test -- tests/e2e/orchestrator-dashboard.spec.ts

# Run specific test
npm run test -- tests/e2e/orchestrator-dashboard.spec.ts -g "should render task list"

# Run tests in headed mode (see browser)
npm run test -- tests/e2e/orchestrator-dashboard.spec.ts --headed

# Generate test report
npm run test -- tests/e2e/orchestrator-dashboard.spec.ts --reporter=html
```

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for dev)
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3008
```

---

## Debugging Tips

### Enable Detailed Logging
```typescript
// In dashboard-service.ts
import { createApiLogger } from '@/lib/logger';
const logger = createApiLogger({ context: 'DashboardService' });

logger.info('Fetching tasks', { filters, workspaceId });
logger.error('Failed to fetch', { error: err.message });
```

### Check API Response
```typescript
// In browser console
const response = await fetch('/api/orchestrator/dashboard/tasks?workspaceId=ws-123');
const data = await response.json();
console.log(data);
```

### Verify Workspace ID
```typescript
// In component
const { currentOrganization } = useAuth();
console.log('Workspace ID:', currentOrganization?.org_id);
```

### Check Task Trace Structure
```typescript
// In API route
console.log('Task trace:', JSON.stringify(task.trace, null, 2));
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Task List Load | <100ms | 50 tasks |
| Task Detail Load | <150ms | Includes timeline computation |
| Evidence Load | <200ms | Includes file system reads |
| Failure Analysis | <100ms | Computation only |
| Retry Task | <500ms | Creates new task |
| Auto-Refresh | 30s | Task list |
| Auto-Refresh | 10s | Task detail (running only) |
| Bundle Size | ~15KB | Gzipped |

---

## Common Errors & Solutions

### "No workspace selected"
**Solution:** Verify workspace is set in AuthContext
```typescript
const { currentOrganization } = useAuth();
if (!currentOrganization?.org_id) {
  // User needs to select workspace
}
```

### "Task not found"
**Solution:** Check task exists and belongs to workspace
```sql
SELECT * FROM orchestrator_tasks
WHERE id = 'TASK_ID' AND workspace_id = 'WORKSPACE_ID';
```

### "Evidence package not available"
**Solution:** Verify evidence was collected during task execution
```typescript
// Check evidence_package column
const { data } = await supabase
  .from('orchestrator_tasks')
  .select('evidence_package')
  .eq('id', taskId)
  .single();

console.log('Evidence:', data.evidence_package);
```

### Auto-refresh not working
**Solution:** Check hook is called with autoRefresh=true
```typescript
const { tasks } = useTaskList(filters, true);  // true = auto-refresh enabled
```

---

## Status Colors & Icons

```typescript
// Status colors (for badges, progress bars)
const statusColors = {
  completed: 'green',
  failed: 'red',
  halted: 'red',
  running: 'blue',
  pending: 'yellow',
  paused: 'orange',
};

// Status icons (for visual indicators)
const statusIcons = {
  completed: '✅',
  failed: '❌',
  halted: '❌',
  running: '🔄',
  pending: '⏳',
  paused: '⏸️',
};

// Usage in component
<Badge className={`bg-${statusColors[task.status]}-500`}>
  {statusIcons[task.status]} {task.status}
</Badge>
```

---

## Responsive Breakpoints

```css
/* Mobile first */
.container {
  width: 100%;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }

  /* Task list + detail side-by-side */
  .grid {
    grid-template-columns: 5fr 7fr;
  }
}

/* Large desktop (1280px+) */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

---

## Useful Links

- **User Guide:** `docs/ORCHESTRATOR_DASHBOARD_GUIDE.md`
- **Implementation Summary:** `docs/ORCHESTRATOR_DASHBOARD_IMPLEMENTATION_SUMMARY.md`
- **E2E Tests:** `tests/e2e/orchestrator-dashboard.spec.ts`
- **API Routes:** `src/app/api/orchestrator/dashboard/`
- **Components:** `src/components/orchestrator/`

---

**Quick Reference v1.0.0** | **Last Updated: 2025-12-02**
