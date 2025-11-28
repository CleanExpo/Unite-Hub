# Migration Quick Checklist ✅

Use this checklist while executing the database migration fix.

## Pre-Flight Check
- [ ] Supabase Dashboard open
- [ ] SQL Editor ready
- [ ] Terminal ready for post-migration commands

---

## Step 1: Run Fix Script
- [ ] Copy `supabase/migrations/FIX_CONTENT_OPTIMIZATION_SCHEMA.sql`
- [ ] Paste into Supabase SQL Editor
- [ ] Click **Run**
- [ ] Verify success messages appear
- [ ] No errors displayed

**Expected Output:**
```
✓ Added search_intent column
✓ Added readability_score column
✓ Added keyword_density column
✓ Added recommendations column
✓ Added eeat_scores column
✓ Added navboost_friendly_patterns column
✓ Added content_analysis_job_id column
Schema fix completed successfully!
```

---

## Step 2: Run Migrations 299-305
- [ ] Copy contents of `supabase/migrations/299_fix_existing_tables.sql`
- [ ] Paste into SQL Editor
- [ ] Click **Run**
- [ ] Wait for completion
- [ ] Check for success (no red errors)

Then run 300-305 (if they exist):
- [ ] `300_*.sql` (if exists)
- [ ] `301_seo_leak_engine_core.sql`
- [ ] `302_*.sql` (if exists)
- [ ] `303_*.sql` (if exists)
- [ ] `304_*.sql` (if exists)
- [ ] `305_*.sql` (if exists)

---

## Step 3: Verify Schema
Run this verification query in SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'content_optimization_results'
ORDER BY ordinal_position;
```

- [ ] Query runs successfully
- [ ] All required columns present:
  - [ ] id
  - [ ] content_analysis_job_id
  - [ ] readability_score
  - [ ] keyword_density
  - [ ] search_intent
  - [ ] recommendations
  - [ ] eeat_scores
  - [ ] navboost_friendly_patterns
  - [ ] created_at

---

## Step 4: Run System Checks

Open terminal in project directory (`d:/Unite-Hub`):

```bash
node scripts/run-integrity-check.mjs
```
- [ ] Integrity check passes
- [ ] No critical errors

```bash
npm test
```
- [ ] Tests pass (or check specific failures)

```bash
npm run dev
```
- [ ] Dev server starts successfully
- [ ] No compilation errors
- [ ] Server running on expected port

---

## Step 5: Access Dashboard
- [ ] Browser open to `http://localhost:3000/founder`
- [ ] Dashboard loads without errors
- [ ] Advisory mode notice visible
- [ ] No console errors in browser DevTools

---

## Completion Status

### ✅ Success Criteria
- All migrations completed without errors
- Schema verification shows all columns
- Integrity check passes
- Dev server runs
- Founder dashboard accessible

### 📝 Notes
Record any issues or observations here:
- 
- 
- 

---

## If Something Goes Wrong

### Issue: Fix script fails
→ See "Troubleshooting" section in `DATABASE_MIGRATION_FIX_INSTRUCTIONS.md`

### Issue: Migration 301 still fails
→ Check that fix script ran successfully first
→ Look for specific error message
→ Verify column exists: `SELECT * FROM information_schema.columns WHERE table_name = 'content_optimization_results' AND column_name = 'search_intent';`

### Issue: System checks fail
→ Check terminal output for specific errors
→ Review error logs
→ Ensure all migrations completed

---

**Status:** ⏳ Ready to execute  
**Last Updated:** 2025-11-28
