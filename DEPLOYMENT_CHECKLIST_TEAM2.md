# DEPLOYMENT CHECKLIST - TEAM 2 SECURITY FIXES

**Date**: 2025-11-17
**Mission**: Data Integrity & API Security
**Files**: 2 migrations + 2 code changes

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Verify Files Exist

- [x] `supabase/migrations/021_create_interactions_table.sql` (132 lines)
- [x] `supabase/migrations/022_add_performance_indexes.sql` (227 lines)
- [x] `src/app/api/profile/route.ts` (modified)
- [x] `src/lib/db.ts` (modified)

### 2. Review Changes

- [x] Interactions table schema reviewed
- [x] RLS policies reviewed
- [x] Performance indexes reviewed
- [x] Profile endpoint security fix reviewed
- [x] No breaking changes confirmed

### 3. Backup Current State

```bash
# Backup current database schema
pg_dump -h YOUR_HOST -U postgres -s YOUR_DB > backup_schema_$(date +%Y%m%d).sql

# Or via Supabase Dashboard → Database → Backups → Create Backup
```

---

## DEPLOYMENT STEPS

### STEP 1: Apply Migration 021 (Interactions Table)

1. Open Supabase Dashboard
2. Navigate to: SQL Editor
3. Open file: `supabase/migrations/021_create_interactions_table.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run" button
7. Wait for success message

**Expected Output**:
```
Success. No rows returned
```

**Verify**:
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'interactions';

-- Expected: 1 row with 'interactions'

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'interactions';

-- Expected: 6 rows (idx_interactions_contact, idx_interactions_workspace, etc.)

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'interactions';

-- Expected: rowsecurity = true
```

### STEP 2: Apply Migration 022 (Performance Indexes)

1. Still in SQL Editor
2. Open file: `supabase/migrations/022_add_performance_indexes.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run" button
6. Wait for success message (may take 30-60 seconds on large tables)

**Expected Output**:
```
Success. No rows returned
```

**Verify**:
```sql
-- Check contacts indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'contacts'
ORDER BY indexname;

-- Expected: 7+ new indexes (idx_contacts_status, idx_contacts_workspace_score, etc.)

-- Check index usage (wait a few hours for real data)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename IN ('contacts', 'emails', 'campaigns')
ORDER BY idx_scan DESC;

-- Expected: Indexes should show usage (idx_scan > 0) after dashboard visits
```

### STEP 3: Deploy Code Changes

**Option A: Manual Deployment (Vercel/Production)**
```bash
git add src/app/api/profile/route.ts
git add src/lib/db.ts
git commit -m "fix: secure profile endpoint and add interactions table support"
git push origin main
```

**Option B: Local Testing First**
```bash
# Start local dev server
npm run dev

# Test profile endpoint
curl -X GET "http://localhost:3008/api/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return your profile (200 OK)

# Test cross-user access (should fail)
curl -X GET "http://localhost:3008/api/profile?userId=DIFFERENT_USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return 403 Forbidden
```

### STEP 4: Verify Deployment

**Check 1: Interactions Table Working**
```bash
# Via API (if endpoint exists)
curl -X POST "http://localhost:3008/api/agents/contact-intelligence" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "VALID_CONTACT_ID",
    "workspaceId": "YOUR_WORKSPACE_ID"
  }'

# Should not crash with "table interactions does not exist"
```

**Check 2: Profile Security Working**
```bash
# Test 1: Own profile (should work)
curl -X GET "http://localhost:3008/api/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 200 OK with your profile data

# Test 2: Other user's profile (should fail)
curl -X GET "http://localhost:3008/api/profile?userId=OTHER_USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: 403 Forbidden
```

**Check 3: Performance Improved**
```sql
-- Run query and check execution plan
EXPLAIN ANALYZE
SELECT * FROM contacts
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND ai_score > 70
ORDER BY ai_score DESC
LIMIT 10;

-- Expected: "Index Scan using idx_contacts_workspace_score"
-- Execution time: < 50ms (was 200ms+)
```

---

## POST-DEPLOYMENT VERIFICATION

### Monitor Error Logs (First 24 Hours)

**Supabase Logs**:
1. Go to Supabase Dashboard → Logs
2. Filter by: Error level
3. Look for:
   - "table interactions does not exist" (should NOT appear)
   - "index ... already exists" (OK, means idempotent migration worked)

**Application Logs**:
```bash
# If using Vercel
vercel logs YOUR_PROJECT --since 1h

# Look for:
# - "[API Security] User X attempted to access profile Y" (security logging working)
# - No errors from AI agents about missing interactions table
```

### Performance Monitoring

**Dashboard Load Time**:
1. Open browser DevTools → Network tab
2. Navigate to /dashboard/overview
3. Check total load time
4. Compare to baseline (should be 40-60% faster)

**Database Query Performance**:
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%contacts%'
  OR query LIKE '%emails%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Expected: Mean execution time should decrease over next 24 hours
```

---

## ROLLBACK PROCEDURE (IF NEEDED)

### If Migration 021 Causes Issues

```sql
-- Drop interactions table
DROP TABLE IF EXISTS interactions CASCADE;

-- Revert db.ts
git checkout HEAD~1 -- src/lib/db.ts
git add src/lib/db.ts
git commit -m "revert: rollback interactions table changes"
git push origin main
```

### If Migration 022 Causes Issues

```sql
-- Drop all new indexes (see migration file for complete list)
DROP INDEX IF EXISTS idx_contacts_status;
DROP INDEX IF EXISTS idx_contacts_last_interaction;
DROP INDEX IF EXISTS idx_contacts_ai_score;
DROP INDEX IF EXISTS idx_contacts_workspace_status;
DROP INDEX IF EXISTS idx_contacts_workspace_score;
-- ... (repeat for all 50+ indexes)
```

### If Profile Endpoint Causes Issues

```bash
# Revert profile endpoint
git checkout HEAD~1 -- src/app/api/profile/route.ts
git add src/app/api/profile/route.ts
git commit -m "revert: rollback profile endpoint security fix"
git push origin main
```

---

## SUCCESS METRICS

### Immediate (Day 1)

- [ ] No errors in Supabase logs about missing interactions table
- [ ] No 500 errors from profile endpoint
- [ ] AI agents running without crashes
- [ ] Security logging showing in console (if cross-user access attempted)

### Short-Term (Week 1)

- [ ] Dashboard load time reduced by 40-60%
- [ ] No database performance degradation
- [ ] Index usage statistics showing high idx_scan counts
- [ ] No unauthorized profile access incidents

### Long-Term (Month 1)

- [ ] Interactions table populated with real data
- [ ] AI agents using interaction history for better scoring
- [ ] Query performance maintained under load
- [ ] Zero security incidents related to profile endpoint

---

## CONTACT FOR ISSUES

**Database Issues**:
- Check: Supabase Dashboard → Database → Query Performance
- Rollback: See "Rollback Procedure" above

**API Issues**:
- Check: Application logs (Vercel logs or console)
- Rollback: Revert code changes via git

**Performance Issues**:
- Check: pg_stat_user_indexes for index usage
- Optimize: Run ANALYZE on affected tables

---

## COMPLETION CHECKLIST

After deployment, mark as complete:

- [ ] Migration 021 applied successfully
- [ ] Migration 022 applied successfully
- [ ] Code changes deployed to production
- [ ] Verification tests passed
- [ ] Error logs monitored (24 hours)
- [ ] Performance metrics collected
- [ ] Documentation updated (CLAUDE.md)
- [ ] Team notified of changes

---

**Deployed By**: _________________
**Date**: _________________
**Time**: _________________
**Verified By**: _________________

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
