# 🚀 Run Migration 043 - Autonomous Tasks Table

**Migration**: `043_autonomous_tasks_table.sql`
**Purpose**: Task logging for autonomous agents and cron jobs
**Status**: ✅ **READY TO EXECUTE** - Both SQL errors fixed
**Priority**: P0 (CRITICAL)
**Fixes Applied**: Generated column → Trigger approach, INTERVAL syntax fixed

---

## ✅ What This Migration Does

### Creates `autonomous_tasks` Table

Centralized task execution log for:
- **Continuous Intelligence Agent** (every 30 minutes)
- Daily analytics rollups
- Weekly report generation
- Email synchronization
- Contact enrichment batches
- Lead scoring batches
- Campaign optimization
- Content calendar sync
- Social media posting
- Data cleanup tasks
- System health checks

### Key Features

**Task Tracking**:
- Task type (12 predefined types)
- Execution status (6 states)
- Input/output data (JSONB)
- Duration (auto-calculated)
- Cost estimates

**Performance**:
- 8 indexes for fast queries
- RLS policies for workspace isolation
- Helper function for summaries
- Auto-updating `updated_at` timestamp

**Security**:
- Row Level Security enabled
- Workspace isolation
- Service role access
- System insert capability (for cron jobs)

---

## 🎯 Quick Execution (60 Seconds)

### Step 1: Open Supabase SQL Editor

```
https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/editor/sql
```

### Step 2: Click "New query"

### Step 3: Copy/paste entire file

```
d:\Unite-Hub\supabase\migrations\043_autonomous_tasks_table.sql
```

### Step 4: Click "Run" ▶️

### Step 5: Verify Success

**Expected Output**:
```
✅ Migration 043 Complete!
📊 autonomous_tasks table: CREATED
📊 Indexes created: 8
📊 RLS policies created: 3
📊 Helper function: CREATED

✨ SUCCESS: Autonomous tasks infrastructure ready!
```

---

## 📊 Table Schema

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Workspace FK (CASCADE) |
| `task_type` | TEXT | 12 task types (CHECK constraint) |
| `status` | TEXT | 6 statuses (CHECK constraint) |
| `input_data` | JSONB | Task parameters |
| `output_data` | JSONB | Execution results |
| `error_message` | TEXT | Error details (if failed) |
| `executed_at` | TIMESTAMPTZ | Start time |
| `completed_at` | TIMESTAMPTZ | End time |
| `duration_ms` | INTEGER | Auto-calculated duration |
| `triggered_by` | TEXT | cron/user/api/system |
| `agent_name` | TEXT | Executing agent name |
| `cost_estimate_usd` | NUMERIC | AI model costs |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

### Task Types

1. `continuous_intelligence_update` - Email intelligence extraction
2. `daily_analytics_rollup` - Daily metric aggregation
3. `weekly_report_generation` - Weekly summary reports
4. `monthly_summary` - Monthly analytics
5. `email_sync` - Gmail synchronization
6. `contact_enrichment` - Contact data enrichment
7. `lead_scoring_batch` - Batch lead scoring
8. `campaign_optimization` - Campaign performance optimization
9. `content_calendar_sync` - Calendar synchronization
10. `social_media_posting` - Auto-posting to social platforms
11. `data_cleanup` - Database maintenance
12. `system_health_check` - Health monitoring

### Task Statuses

1. `pending` - Queued for execution
2. `running` - Currently executing
3. `completed` - Successfully completed
4. `failed` - Execution failed
5. `partial_failure` - Some tasks failed
6. `cancelled` - Manually cancelled

---

## 🔍 Verification Queries

### Check Table Exists

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'autonomous_tasks';

-- Expected: 1 row
```

### Check Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'autonomous_tasks'
ORDER BY indexname;

-- Expected: 8 rows
```

### Check RLS Policies

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'autonomous_tasks'
ORDER BY policyname;

-- Expected: 3 rows
```

### Check Helper Function

```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'get_autonomous_task_summary';

-- Expected: 1 row (3 arguments)
```

### Test Insert

```sql
-- Insert test task
INSERT INTO autonomous_tasks (
  workspace_id,
  task_type,
  status,
  input_data,
  executed_at,
  triggered_by
) VALUES (
  'kh72b1cng9h88691sx4x7krt2h7v7deh',
  'system_health_check',
  'completed',
  '{"check_type": "database"}'::jsonb,
  NOW(),
  'system'
)
RETURNING id, task_type, status, duration_ms;

-- Expected: 1 row inserted
```

### Test Helper Function

```sql
-- Get task summary for last 24 hours
SELECT *
FROM get_autonomous_task_summary(
  'kh72b1cng9h88691sx4x7krt2h7v7deh'::uuid,
  NULL,
  24
);

-- Expected: Summary of task executions
```

---

## 🧪 Test Continuous Intelligence Integration

After migration, test the continuous intelligence endpoint:

```bash
# Set environment
export CRON_SECRET="1a615009c6371e7d017c7e92bf3e3a4860d9f99aa1738288931954f41d625c5e"

# Test endpoint
curl -X POST http://localhost:3008/api/agents/continuous-intelligence \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"batchSizePerWorkspace": 5, "maxWorkspaces": 10}'
```

**Expected Response**:
```json
{
  "success": true,
  "workspaces_processed": 0,
  "total_emails_processed": 0,
  "total_emails_failed": 0,
  "results": [],
  "timestamp": "2025-11-18T..."
}
```

**Check Database**:
```sql
-- Verify task was logged
SELECT
  task_type,
  status,
  output_data,
  executed_at
FROM autonomous_tasks
WHERE task_type = 'continuous_intelligence_update'
ORDER BY executed_at DESC
LIMIT 1;
```

---

## 📊 Usage Examples

### Log Task Execution

```typescript
// In API route or agent
const { error } = await supabase
  .from('autonomous_tasks')
  .insert({
    workspace_id: workspaceId,
    task_type: 'continuous_intelligence_update',
    status: 'completed',
    input_data: {
      workspaces_count: 5,
      batch_size: 10
    },
    output_data: {
      total_processed: 25,
      total_failed: 0,
      results: [...]
    },
    executed_at: startTime,
    completed_at: endTime,
    triggered_by: 'cron',
    agent_name: 'continuous-intelligence',
    cost_estimate_usd: 0.15
  });
```

### Query Recent Tasks

```sql
-- Recent executions
SELECT
  task_type,
  status,
  duration_ms,
  cost_estimate_usd,
  executed_at
FROM autonomous_tasks
WHERE workspace_id = 'your-workspace-id'
ORDER BY executed_at DESC
LIMIT 10;
```

### Get Task Statistics

```sql
-- Use helper function
SELECT *
FROM get_autonomous_task_summary(
  'your-workspace-id'::uuid,
  'continuous_intelligence_update',
  168  -- Last 7 days
);
```

### Monitor Failures

```sql
-- Failed tasks in last 24 hours
SELECT
  task_type,
  error_message,
  output_data,
  executed_at
FROM autonomous_tasks
WHERE
  workspace_id = 'your-workspace-id'
  AND status IN ('failed', 'partial_failure')
  AND executed_at > NOW() - INTERVAL '24 hours'
ORDER BY executed_at DESC;
```

### Calculate Costs

```sql
-- Total cost by task type (last 30 days)
SELECT
  task_type,
  COUNT(*) as executions,
  ROUND(SUM(cost_estimate_usd), 2) as total_cost,
  ROUND(AVG(cost_estimate_usd), 4) as avg_cost
FROM autonomous_tasks
WHERE
  workspace_id = 'your-workspace-id'
  AND executed_at > NOW() - INTERVAL '30 days'
  AND cost_estimate_usd IS NOT NULL
GROUP BY task_type
ORDER BY total_cost DESC;
```

---

## 🚨 Rollback (If Needed)

If migration fails or needs to be reverted:

```sql
-- 1. Drop trigger
DROP TRIGGER IF EXISTS trigger_autonomous_tasks_updated_at ON autonomous_tasks;

-- 2. Drop function
DROP FUNCTION IF EXISTS get_autonomous_task_summary;
DROP FUNCTION IF EXISTS update_autonomous_tasks_updated_at;

-- 3. Drop table (CASCADE removes all constraints and indexes)
DROP TABLE IF EXISTS autonomous_tasks CASCADE;
```

---

## 📈 Expected Performance

**Migration Execution**: ~3-5 seconds

**Table Operations**:
- Insert: <5ms
- Select (indexed): <10ms
- Aggregate queries: <50ms (depends on data volume)

**Storage**:
- ~500 bytes per task record
- 1000 tasks ≈ 500KB
- 10000 tasks ≈ 5MB

---

## ✅ Post-Migration Checklist

After successful migration:

- [ ] Verify table created
- [ ] Verify 8 indexes created
- [ ] Verify 3 RLS policies created
- [ ] Verify helper function exists
- [ ] Test insert task record
- [ ] Test helper function
- [ ] Test continuous intelligence endpoint
- [ ] Verify task logged in database
- [ ] Wait 30 minutes for first cron execution
- [ ] Check cron job logs in Vercel

---

## 🔗 Related Documentation

- **Continuous Intelligence Agent**: `src/app/api/agents/continuous-intelligence/route.ts`
- **Vercel Cron Configuration**: `vercel.json`
- **Environment Variables**: `.env.local` (CRON_SECRET added)
- **Multi-Agent System**: `MULTI_AGENT_SYSTEM_GUIDE.md`

---

## 🎯 Next Steps

After migration:

1. ✅ Deploy to Vercel (cron will automatically start)
2. ✅ Monitor first cron execution (30 minutes)
3. ✅ Check task logs in database
4. ✅ Verify continuous intelligence working
5. ✅ Add monitoring dashboard for task execution

---

**Status**: ⏳ Awaiting Execution
**Priority**: P0 (Critical)
**Estimated Time**: 60 seconds
**Risk Level**: Low (additive only)

---

**Ready to execute!** Open Supabase SQL Editor and run the migration.

After execution, reply "**migration 043 done**" to proceed with testing!
