# Apply Migrations - 5 Minute Guide

## 1. Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql**

Click **"+ New Query"**

## 2. Apply Migration 1 (Main Tables)

**File**: `supabase/migrations/20251226120000_ai_authority_substrate.sql`

1. Open file in editor
2. Select All (Ctrl+A), Copy (Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click **"Run"**

✅ Should see: CREATE EXTENSION, CREATE TABLE, CREATE INDEX (15x), CREATE VIEW

## 3. Apply Migration 2 (Supporting Tables)

**File**: `supabase/migrations/20251226120100_authority_supporting_tables.sql`

1. Click **"+ New Query"**
2. Copy entire file contents
3. Paste into SQL Editor
4. Click **"Run"**

✅ Should see: CREATE TABLE (4x), CREATE INDEX (20+x), CREATE POLICY (16x)

## 4. Create Storage Bucket

1. Click **"Storage"** in sidebar
2. Click **"New Bucket"**
3. Name: `visual-audits`
4. Public: ✅ Yes
5. Create

## 5. Verify

Run in SQL Editor:

```sql
SELECT * FROM client_jobs LIMIT 1;
SELECT * FROM suburb_authority_substrate LIMIT 1;
```

Both should return (no errors, possibly 0 rows).

## 6. Test

```bash
node scripts/test-ai-authority-phase1.mjs
```

Should output: ✅ All tests passed

---

**Done!** System ready for testing.
