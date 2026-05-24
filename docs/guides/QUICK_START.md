# Quick Start: Event Bridge & Observability

Get the new event-driven architecture running in 5 minutes.

## Prerequisites

- Supabase running locally or remotely
- Backend and frontend dev servers can start
- Environment variables configured

## Step 1: Apply Database Migration (30 seconds)

```bash
# From project root
supabase db push
```

**Expected output:**

```
Applying migration 00000000000006_agent_runs_realtime.sql...
✓ Migration applied successfully
```

**This creates:**

- `agent_runs` table with Realtime enabled
- RLS policies for security
- Helper functions
- Indexes for performance

## Step 2: Set Environment Variables (1 minute)

### Backend (`.env` or environment)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
CRON_SECRET=generate_random_string_with_openssl_rand_base64_32
```

**Generate CRON_SECRET:**

```bash
openssl rand -base64 32
```

## Step 3: Start Services (1 minute)

### Terminal 1: Backend

```bash
cd apps/backend
uv run uvicorn src.api.main:app --reload
```

**Expected output:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Terminal 2: Frontend

```bash
cd apps/web
pnpm dev
```

**Expected output:**

```
▲ Next.js 15.1.0
- Local:        http://localhost:3000
✓ Ready in 2.3s
```

## Step 4: Test Event Bridge (2 minutes)

### Option A: Use the Demo Page

1. Open browser: http://localhost:3000/agents

2. Enter a task description:

   ```
   Create a new login page
   ```

3. Click **"Start Agent Run"**

4. Watch the **"Active Agents"** widget update in real-time! 🎉

### Option B: Use the Dashboard

1. Open: http://localhost:3000/dashboard/agent-runs

2. See real-time statistics and all agent runs

3. Click any row to view detailed information

### Option C: Test via API

```bash
# Trigger agent run
curl -X POST http://localhost:8000/api/agents/run \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Test the event bridge",
    "user_id": "test_user"
  }'

# Response:
# {
#   "run_id": "abc-123",
#   "task_id": "task_456",
#   "status": "pending",
#   "message": "Agent run started successfully..."
# }

# Get run status
curl http://localhost:8000/api/agents/run/{run_id}
```

## Step 5: Verify Real-time Updates (1 minute)

### In Your Browser Console:

```javascript
// Open DevTools > Console
// Navigate to http://localhost:3000/agents

// You should see WebSocket messages like:
// "Realtime channel state: joined"
// "Realtime: UPDATE event received"
```

### In Supabase Dashboard:

```sql
-- Go to Supabase Dashboard > SQL Editor
-- Run this query:
SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT 10;

-- You should see your test run with status updates
```

## ✅ Success Checklist

- [ ] Migration applied without errors
- [ ] Backend starts on port 8000
- [ ] Frontend starts on port 3000
- [ ] Demo page loads at /agents
- [ ] Can trigger agent run from UI
- [ ] Active agents widget updates in real-time
- [ ] Dashboard shows statistics
- [ ] Can click run to see details

## 🎉 You're Done!

The event bridge is now live. Here's what you have:

**Real-time Features:**

- Agent status updates without polling
- Progress tracking with percentage
- Verification status visibility
- Error reporting
- Auto-refresh on all pages

**Observability:**

- Full dashboard with metrics
- Searchable run history
- Status filtering
- Detailed run inspection
- Success rate tracking

**Automation:**

- Cleanup old runs (daily 2 AM)
- Health monitoring (every 5 min)
- Daily reports (9 AM)

## Next Actions

### For Development

```bash
# Watch backend logs
cd apps/backend
uv run uvicorn src.api.main:app --reload --log-level debug

# Watch frontend logs
cd apps/web
pnpm dev
```

### For Production

```bash
# Deploy to Vercel (auto-enables cron jobs)
vercel --prod

# Or deploy backend to your platform
# (Railway, Fly.io, AWS, etc.)
```

## Common Issues

### "Table does not exist"

**Solution**: Run migration again

```bash
supabase db push
```

### "Unauthorized" errors

**Solution**: Check environment variables

```bash
# Backend needs SERVICE_ROLE_KEY (not anon key)
echo $SUPABASE_SERVICE_ROLE_KEY

# Frontend needs ANON_KEY
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Real-time not working

**Solution**: Verify Realtime is enabled

```sql
-- In Supabase SQL Editor
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'agent_runs';
```

### Can't connect to backend

**Solution**: Check CORS settings in `apps/backend/src/api/main.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Documentation

- **Full Guide**: `IMPLEMENTATION_SUMMARY.md`
- **Event Bridge Details**: `docs/EVENT_BRIDGE.md`
- **Cron Jobs**: `docs/CRON_JOBS.md`

## Example Code

### Integrate with Your Agent

```python
# In your agent's execute() method
from src.state.events import AgentEventPublisher

publisher = AgentEventPublisher()

run_id = await publisher.start_run(
    task_id="task_123",
    user_id="user_456",
    agent_name="my_agent",
)

await publisher.update_progress(run_id, "Working...", 50.0)
await publisher.complete_run(run_id, result={"success": True})
```

### Use in Frontend Component

```tsx
import { useAgentRuns } from '@/hooks/use-agent-runs';

function MyComponent() {
  const { runs } = useAgentRuns();

  return (
    <div>
      {runs.map((run) => (
        <div key={run.id}>
          {run.agent_name}: {run.progress_percent}%
        </div>
      ))}
    </div>
  );
}
```

---

**Need help?** Check the full implementation details in `IMPLEMENTATION_SUMMARY.md` or review example code in `apps/web/app/agents/page.tsx` and `apps/backend/src/api/routes/agents.py`.
