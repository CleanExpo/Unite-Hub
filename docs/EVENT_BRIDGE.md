# Supabase Realtime Event Bridge

Complete implementation of real-time communication between Next.js frontend and FastAPI backend using Supabase Realtime.

## Overview

This event bridge enables:
- ✅ Real-time agent status updates without polling
- ✅ Bidirectional communication between frontend and backend
- ✅ Scalable to multiple users simultaneously
- ✅ Automatic reconnection on network issues
- ✅ Uses existing Supabase infrastructure

## Architecture

```
┌─────────────────┐      HTTP POST       ┌─────────────────┐
│                 │ ──────────────────▶  │                 │
│   Next.js       │                      │   FastAPI       │
│   Frontend      │                      │   Backend       │
│                 │                      │                 │
└────────┬────────┘                      └────────┬────────┘
         │                                        │
         │                                        │
         │ Subscribe                              │ Publish
         │ (Realtime)                             │ (INSERT/UPDATE)
         │                                        │
         ▼                                        ▼
    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │         Supabase PostgreSQL + Realtime          │
    │                                                 │
    │  ┌────────────────────────────────────────┐    │
    │  │          agent_runs table              │    │
    │  │  - Real-time updates enabled           │    │
    │  │  - Row Level Security (RLS)            │    │
    │  │  - Indexes for performance             │    │
    │  └────────────────────────────────────────┘    │
    │                                                 │
    └─────────────────────────────────────────────────┘
```

## Database Schema

### `agent_runs` Table

```sql
CREATE TABLE public.agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  agent_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending',
  current_step TEXT,
  progress_percent FLOAT DEFAULT 0.0,

  result JSONB,
  error TEXT,
  metadata JSONB DEFAULT '{}',

  verification_attempts INT DEFAULT 0,
  verification_evidence JSONB DEFAULT '[]',

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs;
```

## Backend Usage (FastAPI/Python)

### 1. Publishing Events

```python
from src.state.events import AgentEventPublisher

# Initialize publisher
publisher = AgentEventPublisher()

# Start a new agent run
run_id = await publisher.start_run(
    task_id="task_123",
    user_id="user_456",
    agent_name="orchestrator",
    metadata={"context": "additional data"},
)

# Update progress
await publisher.update_progress(
    run_id=run_id,
    step="Analyzing code structure",
    progress=25.0,
)

# Update status
await publisher.update_status(
    run_id=run_id,
    status="awaiting_verification",
    step="Waiting for verification",
)

# Complete the run
await publisher.complete_run(
    run_id=run_id,
    result={"output": "Task completed successfully"},
)

# Or fail the run
await publisher.fail_run(
    run_id=run_id,
    error="Database connection failed",
)
```

### 2. API Endpoint

```python
from fastapi import APIRouter, BackgroundTasks
from src.state.events import AgentEventPublisher

router = APIRouter()

@router.post("/agents/run")
async def trigger_agent_run(
    request: TriggerAgentRequest,
    background_tasks: BackgroundTasks,
):
    publisher = AgentEventPublisher()

    # Create agent run
    run_id = await publisher.start_run(
        task_id=request.task_id,
        user_id=request.user_id,
        agent_name="orchestrator",
    )

    # Execute in background
    background_tasks.add_task(execute_agent, run_id)

    return {"run_id": run_id}
```

## Frontend Usage (Next.js/React)

### 1. Subscribe to All Agent Runs

```tsx
import { useAgentRuns } from "@/hooks/use-agent-runs";

function AgentMonitor() {
  const { runs, loading, error } = useAgentRuns();

  return (
    <div>
      {runs.map(run => (
        <div key={run.id}>
          {run.agent_name}: {run.status} - {run.progress_percent}%
        </div>
      ))}
    </div>
  );
}
```

### 2. Subscribe to Single Agent Run

```tsx
import { useAgentRun } from "@/hooks/use-agent-runs";

function AgentRunDetail({ runId }: { runId: string }) {
  const { run, loading } = useAgentRun(runId);

  if (loading) return <div>Loading...</div>;
  if (!run) return <div>Run not found</div>;

  return (
    <div>
      <h2>{run.agent_name}</h2>
      <progress value={run.progress_percent} max={100} />
      <p>{run.current_step}</p>
    </div>
  );
}
```

### 3. Get Only Active Runs

```tsx
import { useActiveAgentRuns } from "@/hooks/use-agent-runs";

function ActiveAgentsWidget() {
  const { activeRuns } = useActiveAgentRuns();

  return (
    <div>
      <h3>Active Agents ({activeRuns.length})</h3>
      {activeRuns.map(run => (
        <AgentRunCard key={run.id} run={run} />
      ))}
    </div>
  );
}
```

### 4. Trigger Agent from UI

```tsx
import { triggerAgentRun } from "@/hooks/use-agent-runs";

async function handleRunAgent() {
  const runId = await triggerAgentRun("Build a new feature");
  console.log("Started agent run:", runId);
}
```

## Agent Status Flow

```
pending
   ↓
in_progress
   ↓
awaiting_verification
   ↓
verification_in_progress
   ↓
verification_passed  OR  verification_failed
   ↓                        ↓
completed            (retry or escalate)
                            ↓
                     escalated_to_human
```

## Example: Complete Integration

### Backend Agent Integration

```python
# In your agent's execute method
from src.state.events import AgentEventPublisher

class MyCustomAgent(BaseAgent):
    async def execute(self, task_description: str, context: dict):
        publisher = AgentEventPublisher()

        # Start run
        run_id = await publisher.start_run(
            task_id=context.get("task_id"),
            user_id=context.get("user_id"),
            agent_name=self.name,
        )

        try:
            # Step 1
            await publisher.update_progress(
                run_id=run_id,
                step="Analyzing requirements",
                progress=20.0,
            )
            # ... do work ...

            # Step 2
            await publisher.update_progress(
                run_id=run_id,
                step="Generating code",
                progress=60.0,
            )
            # ... do work ...

            # Complete
            await publisher.complete_run(
                run_id=run_id,
                result={"files_created": 3},
            )

        except Exception as e:
            await publisher.fail_run(run_id=run_id, error=str(e))
            raise
```

### Frontend Dashboard

```tsx
"use client";

import { useAgentRuns } from "@/hooks/use-agent-runs";
import { AgentRunMonitor } from "@/components/agent-run-monitor";

export default function Dashboard() {
  const { runs } = useAgentRuns();

  return (
    <div>
      <h1>Agent Dashboard</h1>
      <div className="grid gap-4">
        {runs.map(run => (
          <AgentRunMonitor key={run.id} runId={run.id} />
        ))}
      </div>
    </div>
  );
}
```

## Setup Instructions

### 1. Apply Database Migration

```bash
# Navigate to project root
cd /path/to/project

# Apply migrations
supabase db push
```

### 2. Start Backend

```bash
cd apps/backend
uv run uvicorn src.api.main:app --reload
```

### 3. Start Frontend

```bash
cd apps/web
pnpm dev
```

### 4. Test the Integration

1. Open browser to `http://localhost:3000/agents`
2. Enter a task description
3. Click "Start Agent Run"
4. Watch real-time updates appear automatically

## Monitoring & Debugging

### View Agent Runs in Supabase

```sql
-- All agent runs
SELECT * FROM agent_runs ORDER BY started_at DESC;

-- Active runs only
SELECT * FROM agent_runs
WHERE status IN ('pending', 'in_progress', 'awaiting_verification')
ORDER BY started_at DESC;

-- Success rate by agent
SELECT
  agent_name,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM agent_runs
GROUP BY agent_name;
```

### Check Realtime Connection

```tsx
// In your component
const { channel } = useAgentRuns();

useEffect(() => {
  console.log("Realtime channel state:", channel?.state);
}, [channel]);
```

## Performance Considerations

1. **Indexes**: The migration includes indexes on frequently queried columns
2. **RLS Policies**: Row Level Security ensures users only see their own runs
3. **Connection Pooling**: Supabase handles connection pooling automatically
4. **Pagination**: For large datasets, implement pagination in your queries

## Troubleshooting

### Issue: Not Receiving Real-time Updates

1. Check Supabase Realtime is enabled:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

2. Verify RLS policies allow your user to SELECT:
   ```sql
   SELECT * FROM agent_runs WHERE user_id = auth.uid();
   ```

3. Check browser console for WebSocket errors

### Issue: High Latency

1. Reduce number of concurrent subscriptions
2. Add filters to Realtime subscriptions
3. Consider geographic location of Supabase instance

## Next Steps

- [ ] Add notification system for completed/failed runs
- [ ] Implement agent run history export
- [ ] Add charts for success rates over time
- [ ] Create alerts for stuck agents
- [ ] Build admin dashboard for all users' runs

## Related Files

- **Migration**: `supabase/migrations/00000000000006_agent_runs_realtime.sql`
- **Backend Publisher**: `apps/backend/src/state/events.py`
- **Backend State Store**: `apps/backend/src/state/supabase.py`
- **Frontend Hooks**: `apps/web/hooks/use-agent-runs.ts`
- **Components**: `apps/web/components/agent-run-monitor.tsx`
- **API Routes**: `apps/backend/src/api/routes/agents.py`
- **Example Page**: `apps/web/app/agents/page.tsx`
- **Dashboard**: `apps/web/app/dashboard/agent-runs/page.tsx`
