# Database Migrations Guide - Unite-Hub

## Overview

This guide covers running migrations 040 and 041 to fix critical database schema issues.

## Migrations to Run

### Migration 040: Fix ai_score Column Type
**File**: `supabase/migrations/040_fix_ai_score_type.sql`
**Purpose**: Change ai_score from DECIMAL(3,2) to INTEGER (0-100)
**Impact**: Updates existing contact records
**Time**: < 1 minute

### Migration 041: Create client_emails Table
**File**: `supabase/migrations/041_create_client_emails_table.sql`
**Purpose**: Create missing client_emails table for email sync
**Impact**: New table, no data loss
**Time**: < 1 minute

## Prerequisites

- [ ] Access to Supabase Dashboard
- [ ] Project: Unite-Hub
- [ ] Backup recent data (recommended)

## Running Migrations

### Step 1: Connect to Supabase

1. Go to: https://supabase.com/dashboard
2. Select your Unite-Hub project
3. Click **SQL Editor** in left sidebar

### Step 2: Run Migration 040 (ai_score fix)

1. Click **New query**
2. Open `supabase/migrations/040_fix_ai_score_type.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. Wait for "Success" message

**Verification**:
```sql
-- Check data type changed
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'ai_score';
-- Expected: data_type = integer

-- Check values scaled correctly
SELECT id, name, ai_score FROM contacts LIMIT 10;
-- Expected: scores between 0-100
```

### Step 3: Run Migration 041 (client_emails table)

1. Click **New query**
2. Open `supabase/migrations/041_create_client_emails_table.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. Wait for "Success" message

**Verification**:
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'client_emails';
-- Expected: client_emails

-- Check columns
\d client_emails;
-- Expected: 14 columns

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'client_emails';
-- Expected: rowsecurity = true
```

## Post-Migration Checklist

### Immediate Verification

- [ ] Migration 040 completed successfully
- [ ] Migration 041 completed successfully
- [ ] No error messages in SQL Editor
- [ ] All verification queries return expected results

### Application Testing

- [ ] Dashboard loads without errors
- [ ] Contacts page displays correctly
- [ ] Contact AI scores show as integers (0-100)
- [ ] Send Email modal works
- [ ] No console errors related to database

### Schema Validation

Run this query to confirm both changes:

```sql
-- Verify ai_score type
SELECT
  column_name,
  data_type,
  CASE
    WHEN column_name = 'ai_score' AND data_type = 'integer' THEN '✅ Fixed'
    ELSE '❌ Not Fixed'
  END as status
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'ai_score';

-- Verify client_emails exists
SELECT
  COUNT(*) as column_count,
  CASE
    WHEN COUNT(*) = 14 THEN '✅ Table Created'
    ELSE '❌ Incomplete'
  END as status
FROM information_schema.columns
WHERE table_name = 'client_emails';
```

## Rollback (If Needed)

### Rollback Migration 040
```sql
-- WARNING: This will lose precision for existing scores
ALTER TABLE contacts ADD COLUMN ai_score_old DECIMAL(3,2) DEFAULT 0.0;
UPDATE contacts SET ai_score_old = (ai_score::DECIMAL / 100.0);
ALTER TABLE contacts DROP COLUMN ai_score;
ALTER TABLE contacts RENAME COLUMN ai_score_old TO ai_score;
ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 1);
```

### Rollback Migration 041
```sql
-- WARNING: This will delete all synced email data
DROP TABLE IF EXISTS client_emails CASCADE;
```

## Troubleshooting

### Error: "column ai_score_new already exists"
**Cause**: Migration 040 partially ran before
**Solution**:
```sql
-- Check current state
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name LIKE 'ai_score%';

-- If ai_score_new exists but ai_score is still DECIMAL, continue migration:
DROP COLUMN ai_score;
ALTER TABLE contacts RENAME COLUMN ai_score_new TO ai_score;
ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 100);
```

### Error: "table client_emails already exists"
**Cause**: Migration 041 already ran
**Solution**: Migration is complete, no action needed

### Error: "function update_updated_at_column does not exist"
**Cause**: Missing helper function from earlier migration
**Solution**:
```sql
-- Create missing function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Next Steps After Migrations

### Update Application Code

No code changes needed! The application already expects:
- `ai_score` as INTEGER (0-100)
- `client_emails` table to exist

### Test Features

1. **Contact AI Scoring**
   - Go to `/dashboard/contacts`
   - Check AI Score badges display correctly
   - Verify scores are integers (not decimals)

2. **Email Integration**
   - Go to `/dashboard/settings` → Integrations
   - Connect Gmail (if available)
   - Verify emails sync to `client_emails` table

3. **Contact Management**
   - Create new contact
   - Edit contact
   - Delete contact
   - Send email to contact

## Migration History

| Migration | Description | Status | Date |
|-----------|-------------|--------|------|
| 001 | Initial schema | ✅ Applied | - |
| 002-039 | Various features | ✅ Applied | - |
| **040** | **Fix ai_score type** | 🔄 **Pending** | 2025-01-18 |
| **041** | **Create client_emails** | 🔄 **Pending** | 2025-01-18 |

## Support

**Issues?** Check:
- Supabase Dashboard → Database → Logs
- Application console for errors
- RUN_MIGRATION_040.md for detailed ai_score guide
- RUN_MIGRATION_041.md for detailed client_emails guide

**Questions?**
- Review migration SQL files
- Check Supabase documentation
- Contact development team

---

**Status**: Ready to run
**Priority**: P0 (Critical)
**Estimated Time**: 5 minutes total
**Risk**: Low (idempotent migrations with rollback)
