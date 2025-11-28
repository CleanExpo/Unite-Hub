# Database Migration Fix Instructions

## Problem Summary

**Error:** `SQL301: Error: Failed to run sql query: ERROR: 42703: column "search_intent" of relation "content_optimization_results" does not exist`

**Root Cause:** The `content_optimization_results` table was created by migration 276 with an older schema, but migration 301 expects additional columns that don't exist yet.

## Solution

Run the fix script **BEFORE** running migrations 299-305.

---

## Step-by-Step Instructions

### Step 1: Run the Fix Script First

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/FIX_CONTENT_OPTIMIZATION_SCHEMA.sql`
4. Paste and **Run** the script
5. Verify you see success messages like:
   ```
   ✓ Added search_intent column
   ✓ Added readability_score column
   ✓ Added keyword_density column
   ✓ Added recommendations column
   ✓ Added eeat_scores column
   ✓ Added navboost_friendly_patterns column
   ✓ Added content_analysis_job_id column
   ```

### Step 2: Run Migrations in Order

After the fix script succeeds, run these migrations **in order**:

#### Option A: Run All at Once (Recommended)
Copy and paste the contents of these files **in one SQL Editor session**:

1. `supabase/migrations/299_fix_existing_tables.sql`
2. `supabase/migrations/300_*.sql` (if exists)
3. `supabase/migrations/301_seo_leak_engine_core.sql`
4. `supabase/migrations/302_*.sql` (if exists)
5. `supabase/migrations/303_*.sql` (if exists)
6. `supabase/migrations/304_*.sql` (if exists)
7. `supabase/migrations/305_*.sql` (if exists)

#### Option B: Run One at a Time
Run each migration file individually in the SQL Editor:
- Wait for each to complete successfully before proceeding to the next
- Check for any error messages after each migration

### Step 3: Verify Migration Success

After all migrations complete, run this query to verify the schema:

```sql
-- Check that all required columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'content_optimization_results'
ORDER BY ordinal_position;
```

You should see these columns:
- `id`
- `content_analysis_job_id`
- `readability_score`
- `keyword_density`
- `search_intent`
- `recommendations`
- `eeat_scores`
- `navboost_friendly_patterns`
- `created_at`

### Step 4: Run System Checks

After migrations are complete, run these commands from your terminal:

```bash
# 1. Run integrity check
node scripts/run-integrity-check.mjs

# 2. Run tests
npm test

# 3. Start dev server
npm run dev
```

### Step 5: Access Founder Dashboard

Once the dev server is running, navigate to:
```
http://localhost:3000/founder
```

---

## What This Fix Does

The fix script:
1. ✅ Checks if the table exists
2. ✅ Adds all missing columns safely (skips if already exist)
3. ✅ Migrates data from old column names to new ones
4. ✅ Adds appropriate constraints
5. ✅ Provides clear feedback messages
6. ✅ Is idempotent (safe to run multiple times)

---

## Troubleshooting

### If the fix script fails:
1. Check the error message in the SQL Editor
2. Verify you have proper database permissions
3. Check if the table exists: `SELECT * FROM information_schema.tables WHERE table_name = 'content_optimization_results';`

### If migrations 299-305 still fail:
1. Check which specific migration is failing
2. Look for the exact error message
3. Verify the fix script ran successfully first
4. Check for any conflicting constraints or foreign keys

### If you need to start over:
You may need to drop and recreate the table (⚠️ **CAUTION: This deletes all data**):
```sql
-- DANGER: Only use if you have no important data
DROP TABLE IF EXISTS content_optimization_results CASCADE;
```
Then re-run migration 301 from scratch.

---

## Summary of Migration Order

✅ **Correct Order:**
1. `FIX_CONTENT_OPTIMIZATION_SCHEMA.sql` ← **START HERE**
2. `299_fix_existing_tables.sql`
3. `300-305_*.sql` (in numerical order)
4. Run integrity checks
5. Run tests
6. Start dev server

❌ **Wrong Order (causes the error):**
- Running 301 before the fix script
- Running migrations in wrong sequence
- Skipping migration 299

---

## Next Steps After Success

Once all migrations complete successfully:

1. ✅ Database schema is up to date
2. ✅ All SEO tables are properly configured
3. ✅ Advisory mode agents are ready
4. ✅ Founder OS dashboard is accessible at `/founder`
5. ✅ System is ready for testing

---

## Support

If you encounter any issues not covered here:
1. Check the migration file comments for specific requirements
2. Review the error logs carefully
3. Ensure your Supabase project is on a recent version
4. Verify your database user has sufficient privileges

---

**Created:** 2025-11-28  
**Purpose:** Fix content_optimization_results schema mismatch  
**Status:** Ready to apply
