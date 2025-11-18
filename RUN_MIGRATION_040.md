# How to Run Migration 040 - Fix ai_score Type

## Problem

The `ai_score` column in the `contacts` table is currently defined as `DECIMAL(3,2)` with values ranging from 0.0 to 1.0. However, the application code and UI display scores as integers from 0-100.

**Current Schema**:
```sql
ai_score DECIMAL(3,2) DEFAULT 0.0 CHECK (ai_score >= 0 AND ai_score <= 1)
```

**Desired Schema**:
```sql
ai_score INTEGER DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100)
```

## Impact

- **Breaking Change**: Yes - changes data type from DECIMAL to INTEGER
- **Data Loss**: No - existing scores are scaled from 0.0-1.0 to 0-100
- **Downtime Required**: No - migration runs in seconds
- **Affects**: All contacts in database

## Migration Steps

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: Unite-Hub

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy/Paste Migration SQL**
   - Open: `supabase/migrations/040_fix_ai_score_type.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Run Migration**
   - Click "Run" button
   - Wait for success message

5. **Verify Results**
   ```sql
   -- Check data type changed
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'contacts' AND column_name = 'ai_score';
   -- Expected: ai_score | integer

   -- Check values scaled correctly
   SELECT id, name, ai_score FROM contacts LIMIT 10;
   -- Expected: scores between 0-100
   ```

### Option 2: Supabase CLI

```bash
# Navigate to project directory
cd Unite-Hub

# Run migration
supabase db push

# Verify
supabase db diff
```

## What This Migration Does

1. **Adds temporary column** `ai_score_new` as INTEGER
2. **Migrates data** by multiplying decimal scores by 100 and rounding
   - Example: 0.85 → 85
   - Example: 0.00 → 0
   - Example: 1.00 → 100
3. **Drops old column** `ai_score`
4. **Renames** `ai_score_new` to `ai_score`
5. **Adds constraint** CHECK (ai_score >= 0 AND ai_score <= 100)
6. **Sets default** to 0

## Example Data Transformation

**Before**:
| id | name | ai_score |
|----|------|----------|
| 1 | John | 0.85 |
| 2 | Jane | 0.62 |
| 3 | Bob | 0.00 |

**After**:
| id | name | ai_score |
|----|------|----------|
| 1 | John | 85 |
| 2 | Jane | 62 |
| 3 | Bob | 0 |

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- WARNING: This will lose precision for existing scores
ALTER TABLE contacts ADD COLUMN ai_score_old DECIMAL(3,2) DEFAULT 0.0;
UPDATE contacts SET ai_score_old = (ai_score::DECIMAL / 100.0);
ALTER TABLE contacts DROP COLUMN ai_score;
ALTER TABLE contacts RENAME COLUMN ai_score_old TO ai_score;
ALTER TABLE contacts ADD CONSTRAINT ai_score_range CHECK (ai_score >= 0 AND ai_score <= 1);
```

## Post-Migration Testing

1. **Check Contacts Page**
   - Navigate to `/dashboard/contacts`
   - Verify AI Score badges display correctly (0-100 range)
   - Green badge for scores ≥ 80
   - Blue badge for scores 70-79
   - Amber badge for scores < 70

2. **Test Add Contact**
   - Create new contact
   - Verify ai_score defaults to 0

3. **Test AI Scoring**
   - Run contact intelligence agent
   - Verify scores are calculated as integers (0-100)

## Files Modified

- `supabase/migrations/040_fix_ai_score_type.sql` (NEW)

## Related Issues

- P0-5: Fix database schema - ai_score type
- Production Readiness Audit Issue #5

---

**Created**: 2025-01-18
**Status**: Ready to run
**Estimated Time**: < 1 minute
