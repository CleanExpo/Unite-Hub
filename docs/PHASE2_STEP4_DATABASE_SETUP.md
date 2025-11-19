# Phase 2 Step 4: Database Setup & Migration Guide

**Created**: 2025-11-19
**For**: Staff Pages Functional Implementation
**Prerequisites**: Migration 048 must be applied first

---

## Overview

This guide walks you through setting up the database for Phase 2 Step 4 staff pages. It includes:
- SQL migration application
- Data verification
- API compatibility fixes
- Sample data insertion (optional)

---

## Step 1: Verify Prerequisites

### Check Migration 048 Status

**In Supabase SQL Editor**, run:

```sql
-- Check if migration 048 tables exist
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'staff_users'
) as staff_users_exists,
EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'projects'
) as projects_exists,
EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'tasks'
) as tasks_exists,
EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'staff_activity_logs'
) as activity_logs_exists;
```

**Expected Result**:
```
staff_users_exists | projects_exists | tasks_exists | activity_logs_exists
-------------------+-----------------+--------------+---------------------
true               | true            | true         | true
```

**If any are `false`**: Run migration 048 first:
```bash
# Copy contents of supabase/migrations/048_phase1_core_tables.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

---

## Step 2: Apply Migration 049 (API Compatibility)

### What This Migration Does

1. **Adds Missing Fields**:
   - `projects.name` - Project display name
   - `projects.description` - Project description
   - `projects.deadline` - Project deadline date
   - `projects.team_size` - Number of team members
   - `projects.client_name` - Denormalized client name for quick access
   - `tasks.priority` - Task priority (low, medium, high)
   - `tasks.deadline` - Task deadline timestamp

2. **Creates Performance Indexes**:
   - Projects: status+progress, deadline, created_at
   - Tasks: status, priority, due_date, deadline
   - Activity logs: action, metadata (GIN)

3. **Creates Helper Views**:
   - `staff_tasks_full` - Tasks with project and client details
   - `staff_projects_full` - Projects with client and task statistics

4. **Creates Utility Functions**:
   - `calculate_project_progress(uuid)` - Auto-calculate completion percentage
   - `get_staff_task_stats(uuid)` - Get staff member's task statistics
   - `get_activity_counts(uuid, timestamptz)` - Get activity counts with time filtering

### Apply the Migration

**Method 1: Supabase Dashboard (Recommended)**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase/migrations/049_phase2_step4_api_compatibility.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **Run**

**Method 2: Command Line (If using Supabase CLI)**

```bash
supabase db push
```

### Verify Migration Success

Run this verification query:

```sql
-- Verify new fields exist
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
  AND column_name IN ('name', 'description', 'deadline', 'team_size', 'client_name')
ORDER BY column_name;
```

**Expected Result**: 5 rows showing the new columns

```sql
-- Verify views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'staff_%'
ORDER BY table_name;
```

**Expected Result**:
```
table_name
------------------
staff_projects_full
staff_tasks_full
```

---

## Step 3: Insert Sample Data (Optional - For Testing)

### Option A: Manual Sample Data

Copy this SQL and run in Supabase SQL Editor:

```sql
-- Step 1: Insert a client user
INSERT INTO client_users (name, email, subscription_tier)
VALUES ('Test Client Corp', 'test@client.com', 'professional')
RETURNING id;

-- Copy the returned UUID for next steps
-- Example: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6

-- Step 2: Insert a project (replace CLIENT_UUID with UUID from step 1)
INSERT INTO projects (
  client_id,
  name,
  description,
  status,
  progress,
  deadline,
  team_size,
  client_name
)
VALUES (
  'CLIENT_UUID'::uuid, -- Replace with actual UUID
  'Website Redesign Project',
  'Complete redesign of company website with modern UI/UX',
  'active',
  65,
  CURRENT_DATE + interval '30 days',
  3,
  'Test Client Corp'
)
RETURNING id;

-- Copy the returned UUID for tasks
-- Example: b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7

-- Step 3: Get your staff user ID
SELECT id, email, name, role
FROM staff_users
WHERE active = true
LIMIT 1;

-- Copy your staff user ID
-- Example: c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8

-- Step 4: Insert tasks (replace PROJECT_UUID and STAFF_UUID)
INSERT INTO tasks (
  project_id,
  assigned_to,
  title,
  description,
  status,
  priority,
  due_date
)
VALUES
(
  'PROJECT_UUID'::uuid, -- Replace
  'STAFF_UUID'::uuid,   -- Replace
  'Complete homepage redesign',
  'Design and implement new homepage layout with responsive design',
  'in_progress',
  'high',
  CURRENT_DATE + interval '7 days'
),
(
  'PROJECT_UUID'::uuid, -- Replace
  'STAFF_UUID'::uuid,   -- Replace
  'Update navigation menu',
  'Implement new navigation structure',
  'pending',
  'medium',
  CURRENT_DATE + interval '10 days'
),
(
  'PROJECT_UUID'::uuid, -- Replace
  'STAFF_UUID'::uuid,   -- Replace
  'Optimize images',
  'Compress and optimize all website images',
  'completed',
  'low',
  CURRENT_DATE - interval '2 days'
);

-- Step 5: Insert activity logs
INSERT INTO staff_activity_logs (staff_id, action, metadata)
VALUES
(
  'STAFF_UUID'::uuid, -- Replace
  'staff_login',
  jsonb_build_object(
    'email', 'your@email.com',
    'timestamp', NOW()
  )
),
(
  'STAFF_UUID'::uuid, -- Replace
  'task_completed',
  jsonb_build_object(
    'task_title', 'Optimize images',
    'task_id', 't1',
    'project_name', 'Website Redesign Project'
  )
),
(
  'STAFF_UUID'::uuid, -- Replace
  'project_updated',
  jsonb_build_object(
    'project_id', 'PROJECT_UUID', -- Replace
    'field', 'progress',
    'old_value', 60,
    'new_value', 65
  )
);
```

### Option B: Automated Sample Data (Commented Out in Migration)

The migration file includes commented-out sample data. To use it:

1. Open `supabase/migrations/049_phase2_step4_api_compatibility.sql`
2. Find the section: `-- SEED SAMPLE DATA (FOR TESTING - REMOVE IN PRODUCTION)`
3. Uncomment the INSERT statements (remove `/*` and `*/`)
4. Replace placeholder UUIDs with actual UUIDs from your database
5. Run the modified migration

---

## Step 4: Verify Data & Test API Endpoints

### Verify Sample Data

```sql
-- Check client users
SELECT id, name, email, subscription_tier
FROM client_users
ORDER BY created_at DESC
LIMIT 5;

-- Check projects with client info
SELECT
  p.id,
  p.name,
  p.client_name,
  p.status,
  p.progress,
  p.team_size,
  p.deadline
FROM projects p
ORDER BY p.created_at DESC
LIMIT 5;

-- Check tasks with project info
SELECT
  t.id,
  t.title,
  t.status,
  t.priority,
  t.due_date,
  p.name as project_name
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Check activity logs
SELECT
  sal.id,
  sal.action,
  sal.metadata,
  sal.timestamp,
  su.name as staff_name
FROM staff_activity_logs sal
LEFT JOIN staff_users su ON sal.staff_id = su.id
ORDER BY sal.timestamp DESC
LIMIT 10;
```

### Test API Endpoints (Using Browser or curl)

**1. Test Tasks API**:
```bash
# Using curl
curl http://localhost:3008/api/staff/tasks

# Expected response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Complete homepage redesign",
      "status": "in_progress",
      "priority": "high",
      ...
    }
  ]
}
```

**2. Test Projects API**:
```bash
curl http://localhost:3008/api/staff/projects

# Expected response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Website Redesign Project",
      "status": "active",
      "progress": 65,
      ...
    }
  ]
}
```

**3. Test Activity API**:
```bash
curl http://localhost:3008/api/staff/activity

# Expected response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "staff_login",
      "timestamp": "2025-11-19T...",
      ...
    }
  ]
}
```

---

## Step 5: API Response Format Fix (CRITICAL)

### Problem

The current API endpoints return:
```json
{ "success": true, "tasks": [...] }
```

But the frontend expects:
```json
{ "success": true, "data": [...] }
```

### Fix Required in API Files

You need to update these API route files:

**File**: `next/app/api/staff/tasks/route.ts`

Change:
```typescript
return NextResponse.json({
  success: true,
  tasks: tasks || [],
});
```

To:
```typescript
return NextResponse.json({
  success: true,
  data: tasks || [],
});
```

**File**: `next/app/api/staff/projects/route.ts`

Change:
```typescript
return NextResponse.json({
  success: true,
  projects: projects || [],
});
```

To:
```typescript
return NextResponse.json({
  success: true,
  data: projects || [],
});
```

**File**: `next/app/api/staff/activity/route.ts`

Change:
```typescript
return NextResponse.json({
  success: true,
  logs: logs || [],
});
```

To:
```typescript
return NextResponse.json({
  success: true,
  data: logs || [],
});
```

### Quick Fix Script

Create `scripts/fix-api-response-format.mjs`:

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const apiFiles = [
  'next/app/api/staff/tasks/route.ts',
  'next/app/api/staff/projects/route.ts',
  'next/app/api/staff/activity/route.ts'
];

const replacements = {
  'tasks:': 'data:',
  'projects:': 'data:',
  'logs:': 'data:'
};

apiFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  Object.entries(replacements).forEach(([oldKey, newKey]) => {
    if (content.includes(oldKey)) {
      content = content.replace(
        new RegExp(`${oldKey} (\\w+)`, 'g'),
        `${newKey} $1`
      );
    }
  });

  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n✨ All API response formats updated!');
```

Run:
```bash
node scripts/fix-api-response-format.mjs
```

---

## Step 6: Database Cache Refresh

**IMPORTANT**: After applying migrations, Supabase caches the schema for 1-5 minutes.

### Force Cache Refresh

**Option 1: Wait** (1-5 minutes for auto-refresh)

**Option 2: Force Refresh with Query**:
```sql
-- Run this query to force schema cache refresh
SELECT * FROM projects LIMIT 1;
SELECT * FROM tasks LIMIT 1;
SELECT * FROM staff_activity_logs LIMIT 1;
```

**Option 3: Restart Dev Server**:
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

---

## Step 7: Test Full Flow End-to-End

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Navigate to Staff Pages

Visit in browser:
- `http://localhost:3008/staff/dashboard`
- `http://localhost:3008/staff/tasks`
- `http://localhost:3008/staff/projects`
- `http://localhost:3008/staff/activity`

### 3. Verify Data Display

**Dashboard Should Show**:
- ✅ Active projects count
- ✅ Tasks assigned count
- ✅ Average progress ring
- ✅ AI daily briefing

**Tasks Page Should Show**:
- ✅ Task statistics (pending, in progress, completed)
- ✅ Task list with TaskCard components
- ✅ Empty state if no tasks

**Projects Page Should Show**:
- ✅ Project statistics (active, completed, avg progress)
- ✅ Project cards with progress bars
- ✅ Client information
- ✅ Deadline and team size

**Activity Page Should Show**:
- ✅ Activity statistics (today, week, tasks, projects)
- ✅ Timeline with activity events
- ✅ Action badges
- ✅ Metadata display

---

## Troubleshooting

### Issue 1: "No data showing in pages"

**Cause**: API returning empty arrays

**Fix**:
1. Check database has sample data (Step 3)
2. Verify API response format (Step 5)
3. Check browser console for errors
4. Verify API endpoints return 200 status

### Issue 2: "Column does not exist" error

**Cause**: Migration 049 not applied or cache not refreshed

**Fix**:
1. Re-run migration 049 in Supabase SQL Editor
2. Force cache refresh (Step 6)
3. Restart dev server

### Issue 3: "RLS policy blocks access"

**Cause**: User not in staff_users table

**Fix**:
```sql
-- Check if your auth user is in staff_users
SELECT id, email, role, active
FROM staff_users
WHERE id = auth.uid();

-- If empty, insert yourself
INSERT INTO staff_users (id, email, name, role, active)
VALUES (
  auth.uid(),
  'your@email.com',
  'Your Name',
  'founder',
  true
);
```

### Issue 4: "API returns 500 error"

**Cause**: Supabase client not configured or missing env vars

**Fix**:
1. Check `.env.local` has Supabase credentials
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check API route has correct Supabase client import

---

## Rollback Plan (If Needed)

### Rollback Migration 049

```sql
-- Drop added columns
ALTER TABLE projects DROP COLUMN IF EXISTS name;
ALTER TABLE projects DROP COLUMN IF EXISTS description;
ALTER TABLE projects DROP COLUMN IF EXISTS deadline;
ALTER TABLE projects DROP COLUMN IF EXISTS team_size;
ALTER TABLE projects DROP COLUMN IF EXISTS client_name;

ALTER TABLE tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE tasks DROP COLUMN IF EXISTS deadline;

-- Drop views
DROP VIEW IF EXISTS staff_tasks_full;
DROP VIEW IF EXISTS staff_projects_full;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_project_progress(uuid);
DROP FUNCTION IF EXISTS get_staff_task_stats(uuid);
DROP FUNCTION IF EXISTS get_activity_counts(uuid, timestamptz);

-- Drop indexes
DROP INDEX IF EXISTS idx_projects_status_progress;
DROP INDEX IF EXISTS idx_projects_deadline;
DROP INDEX IF EXISTS idx_projects_created_at;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_deadline;
DROP INDEX IF EXISTS idx_staff_activity_logs_action;
DROP INDEX IF EXISTS idx_staff_activity_logs_metadata;
```

---

## Summary Checklist

- [ ] Migration 048 verified and applied
- [ ] Migration 049 applied successfully
- [ ] New fields verified in database
- [ ] Views and functions created
- [ ] Sample data inserted (optional)
- [ ] API response format fixed (tasks → data, projects → data, logs → data)
- [ ] Database cache refreshed
- [ ] Dev server restarted
- [ ] All 4 staff pages tested
- [ ] Data displaying correctly
- [ ] No console errors

---

## Next Steps

After completing this setup:

1. **Test with Real Data**: Replace sample data with actual projects and tasks
2. **Configure Staff Auth**: Ensure staff users can authenticate
3. **Implement Client Pages**: Move to Phase 2 Step 5 (Client Pages)
4. **UI Polish**: Enhance styling and user experience
5. **Production Deployment**: Deploy to Vercel with Supabase production database

---

**Last Updated**: 2025-11-19
**Status**: Complete & Ready for Use
**Support**: See `docs/PHASE2_STEP4_STAFF_FUNCTIONAL.md` for implementation details
