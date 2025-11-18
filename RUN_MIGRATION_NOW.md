# 🚀 Run Migration 100 - Manual Steps

**Status**: ⚠️ Automated execution blocked by Supabase security (expected)

**Action Required**: Copy & paste SQL in Supabase Dashboard (60 seconds)

---

## 📋 Steps (60 seconds)

### Step 1: Open Supabase SQL Editor (10 seconds)

Click this link:
👉 **https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/editor/sql**

### Step 2: Create New Query (5 seconds)

Click the **"New query"** button

### Step 3: Copy Migration SQL (15 seconds)

**Option A: Open file in VS Code**
- File location: `d:\Unite-Hub\supabase\migrations\100_multi_agent_system.sql`
- Press `Ctrl+A` to select all
- Press `Ctrl+C` to copy

**Option B: Use Windows command**
```bash
type supabase\migrations\100_multi_agent_system.sql | clip
```
(This copies to clipboard automatically)

### Step 4: Paste & Run (30 seconds)

1. Paste into Supabase SQL editor (`Ctrl+V`)
2. Click **"Run"** button (▶️)
3. Wait for "Success" message

---

## ✅ What Gets Created

### Tables (4)
- ✅ `agent_tasks` - Task queue with priority, retry logic
- ✅ `agent_executions` - Execution history with metrics
- ✅ `agent_health` - Agent health monitoring
- ✅ `agent_metrics` - Aggregated analytics

### Functions (3)
- ✅ `get_pending_tasks_for_agent()` - Fetch tasks for specific agent
- ✅ `update_task_status()` - Update task progress
- ✅ `record_agent_heartbeat()` - Record health status

### Indexes (15+)
- ✅ Workspace filtering
- ✅ Priority sorting
- ✅ Status lookups
- ✅ Date range queries

### RLS Policies (8)
- ✅ Workspace isolation
- ✅ Service role access
- ✅ User permissions

### Updated Columns (2)
- ✅ `client_emails.intelligence_analyzed` (BOOLEAN)
- ✅ `media_files.intelligence_analyzed` (BOOLEAN)

---

## 🔍 Verify Migration Succeeded

After running, execute this query in the same SQL editor:

```sql
-- Check tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname='public'
AND tablename LIKE 'agent_%'
ORDER BY tablename;
```

**Expected result** (4 rows):
```
agent_executions
agent_health
agent_metrics
agent_tasks
```

---

## 🆘 If You Get Errors

### Error: "relation already exists"
✅ **Good!** Tables already created. Skip to verification step.

### Error: "function does not exist"
⚠️ **Check**: Make sure you copied the ENTIRE file including function definitions

### Error: "permission denied"
⚠️ **Check**: Make sure you're logged in as the project owner

### Error: "syntax error"
⚠️ **Check**: Make sure you copied the complete SQL (should be ~450 lines)

---

## ✅ After Migration Succeeds

Run this test query to confirm:

```sql
-- Insert test task
INSERT INTO agent_tasks (
  workspace_id,
  task_type,
  payload,
  priority,
  status
) VALUES (
  'test-workspace',
  'email_intelligence',
  '{"test": true}'::jsonb,
  5,
  'pending'
) RETURNING id, task_type, status, created_at;

-- View the task
SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 1;

-- Clean up test
DELETE FROM agent_tasks WHERE workspace_id = 'test-workspace';
```

If this works, migration is ✅ **SUCCESSFUL!**

---

## 🚀 Next Steps After Migration

1. ✅ Migration complete
2. 🧪 Test email agent locally:
   ```bash
   node docker/agents/entrypoints/email-agent.mjs
   ```
3. 📊 Check RabbitMQ UI: http://localhost:15672
4. 🎯 Send test task and watch it process

---

## 📸 Quick Reference

**SQL Editor URL**:
```
https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/editor/sql
```

**Migration File**:
```
d:\Unite-Hub\supabase\migrations\100_multi_agent_system.sql
```

**Copy to Clipboard (Windows)**:
```bash
type supabase\migrations\100_multi_agent_system.sql | clip
```

---

**Status**: ⏳ Awaiting manual execution
**Time Required**: ~60 seconds
**Difficulty**: ⭐ Very Easy (copy & paste)

---

**Ready?** Open the SQL editor and paste the migration! 🚀
