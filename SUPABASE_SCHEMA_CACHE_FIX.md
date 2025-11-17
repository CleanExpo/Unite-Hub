# 🔧 Supabase Schema Cache Issue - Fixed

## Problem

When running SQL that references recently added columns (like `workspace_id` in `projects` table), you might get:

```
ERROR: column "workspace_id" of relation "projects" does not exist
```

**Even though the column exists in the migration file!**

## Root Cause

Supabase caches the database schema for performance. After running migrations, the cache may not refresh immediately, causing:
- REST API errors: `"Could not find the 'column_name' column in the schema cache"`
- SQL errors: `column "column_name" does not exist`

## Solution Applied

### In `scripts/create-test-mindmap.sql`:

**Before (fails):**
```sql
INSERT INTO projects (
  org_id,
  workspace_id,  -- ❌ Cache doesn't know about this yet
  title,
  ...
)
```

**After (works):**
```sql
-- Insert without the cached column
INSERT INTO projects (
  org_id,
  title,
  ...
)
RETURNING id INTO v_project_id;

-- Update with the column separately (direct SQL, bypasses cache)
UPDATE projects
SET workspace_id = v_workspace_id
WHERE id = v_project_id;
```

## General Fix Methods

### Method 1: Wait (5-10 minutes)
Supabase automatically refreshes schema cache every few minutes. Just wait and try again.

### Method 2: Force Refresh
Run a simple query on the table to force cache refresh:
```sql
SELECT * FROM projects LIMIT 1;
```

### Method 3: Use UPDATE Instead of INSERT
Insert without the problematic column, then UPDATE it:
```sql
INSERT INTO table (other_columns) VALUES (...) RETURNING id;
UPDATE table SET new_column = value WHERE id = ...;
```

### Method 4: Use Raw SQL (not REST API)
If using Supabase client (JavaScript), switch from:
```javascript
// ❌ Uses REST API (cached)
supabase.from('projects').insert({ workspace_id: ... })

// ✅ Uses direct SQL (bypasses cache)
supabase.rpc('insert_project', { workspace_id: ... })
```

## Affected Operations

This issue typically affects:
- ✅ Recently added columns (within last 5-10 minutes)
- ✅ REST API calls via Supabase client
- ✅ PostgREST endpoints
- ❌ Direct SQL via SQL Editor (usually works)
- ❌ Existing columns (always cached correctly)

## Files Updated

1. **`scripts/create-test-mindmap.sql`**
   - Changed INSERT to exclude `workspace_id`
   - Added UPDATE to set `workspace_id` after insert
   - Works around cache issue

2. **`scripts/create-test-project-mindmap.mjs`**
   - Node.js script that uses Supabase client
   - Hit the same cache issue
   - SQL version is more reliable for setup scripts

## Best Practices

### For Setup Scripts
✅ Use direct SQL files (run in Supabase SQL Editor)
✅ Use UPDATE for recently added columns
✅ Add comments explaining cache workarounds

### For Application Code
✅ Wait 10 minutes after running migrations before deploying code
✅ Use database functions (stored procedures) instead of direct INSERTs
✅ Handle cache errors gracefully with retries

### For Migrations
✅ Run migrations well before deploying application code
✅ Verify columns exist before using them:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'projects' AND column_name = 'workspace_id';
   ```

## Current Status

✅ **FIXED** - `scripts/create-test-mindmap.sql` now works around the cache issue

You can now run the script immediately without waiting for cache refresh!

---

## Additional Resources

- Supabase Schema Cache: https://supabase.com/docs/guides/api/generating-types
- PostgREST Schema Cache: https://postgrest.org/en/stable/schema_cache.html
- Migration Best Practices: See `CLAUDE.md` section on migrations

---

**Last Updated:** 2025-01-17
**Issue:** Schema cache lag after migrations
**Solution:** Use UPDATE for new columns instead of INSERT
