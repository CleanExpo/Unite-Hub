# Expected Migration Success Output

This document shows the expected console output when running the migration scripts successfully.

---

## 1. Applying Migration (`apply-onboarding-migration.sql`)

### Success Output

```
NOTICE:  Creating user_onboarding table...
NOTICE:  ✅ user_onboarding table created successfully
NOTICE:  ✅ VERIFICATION PASSED: user_onboarding table exists
NOTICE:  Run this query to see the table structure:
NOTICE:  SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'user_onboarding';

Query executed successfully
Time: 2.3s
```

### Already Exists Output (Safe)

```
NOTICE:  ⚠️  user_onboarding table already exists - skipping creation
NOTICE:  ✅ VERIFICATION PASSED: user_onboarding table exists
NOTICE:  Run this query to see the table structure:
NOTICE:  SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'user_onboarding';

Query executed successfully
Time: 0.8s
```

---

## 2. Verification Script (`verify-onboarding-migration.sql`)

### Success Output

```
NOTICE:  ========================================
NOTICE:  User Onboarding Migration Verification
NOTICE:  ========================================
NOTICE:
NOTICE:  ✅ CHECK 1/5: Table exists
NOTICE:  ✅ CHECK 2/5: All 13 columns exist
NOTICE:  ✅ CHECK 3/5: All 2 indexes exist
NOTICE:  ✅ CHECK 4/5: All 3 RLS policies exist
NOTICE:  ✅ CHECK 5/5: Trigger exists
NOTICE:
NOTICE:  ========================================
NOTICE:  ✅ ALL CRITICAL CHECKS PASSED
NOTICE:  Migration successfully applied!
NOTICE:  ========================================

Query executed successfully
Time: 1.1s

Results:
┌────────────────────┬──────────────────────────┬──────────────────────────┬─────────────┐
│ column_name        │ data_type                │ column_default           │ is_nullable │
├────────────────────┼──────────────────────────┼──────────────────────────┼─────────────┤
│ id                 │ uuid                     │ uuid_generate_v4()       │ NO          │
│ user_id            │ uuid                     │                          │ NO          │
│ step_1_complete    │ boolean                  │ false                    │ YES         │
│ step_2_complete    │ boolean                  │ false                    │ YES         │
│ step_3_complete    │ boolean                  │ false                    │ YES         │
│ step_4_complete    │ boolean                  │ false                    │ YES         │
│ step_5_complete    │ boolean                  │ false                    │ YES         │
│ completed_at       │ timestamp with time zone │                          │ YES         │
│ skipped            │ boolean                  │ false                    │ YES         │
│ current_step       │ integer                  │ 1                        │ YES         │
│ onboarding_data    │ jsonb                    │ '{}'::jsonb              │ YES         │
│ created_at         │ timestamp with time zone │ now()                    │ YES         │
│ updated_at         │ timestamp with time zone │ now()                    │ YES         │
└────────────────────┴──────────────────────────┴──────────────────────────┴─────────────┘

13 rows returned
```

### Failure Output (Migration Not Applied)

```
NOTICE:  ========================================
NOTICE:  User Onboarding Migration Verification
NOTICE:  ========================================
NOTICE:
ERROR:  ❌ CHECK 1/5 FAILED: Table does not exist
NOTICE:  ========================================
NOTICE:  ❌ VERIFICATION FAILED
NOTICE:  Error: ❌ CHECK 1/5 FAILED: Table does not exist
NOTICE:  ========================================

Query failed
Time: 0.2s

Action Required: Run apply-onboarding-migration.sql first
```

---

## 3. Supabase Table Editor Verification

After successful migration, you should see in **Table Editor**:

### Tables List
```
✅ user_onboarding (13 columns, 0 rows)
```

### Table Structure View
When you click on `user_onboarding` table:

**Columns Tab:**
```
id                UUID        Primary Key, Default: uuid_generate_v4()
user_id           UUID        Foreign Key → auth.users(id), NOT NULL, UNIQUE
step_1_complete   boolean     Default: false
step_2_complete   boolean     Default: false
step_3_complete   boolean     Default: false
step_4_complete   boolean     Default: false
step_5_complete   boolean     Default: false
completed_at      timestamptz
skipped           boolean     Default: false
current_step      integer     Default: 1, Check: 1-5
onboarding_data   jsonb       Default: {}
created_at        timestamptz Default: now()
updated_at        timestamptz Default: now()
```

**Indexes Tab:**
```
idx_user_onboarding_user_id       on user_id
idx_user_onboarding_completed     on completed_at (partial: WHERE completed_at IS NOT NULL)
```

**Policies Tab:**
```
Users can view own onboarding     SELECT    auth.uid() = user_id
Users can insert own onboarding   INSERT    auth.uid() = user_id
Users can update own onboarding   UPDATE    auth.uid() = user_id
```

---

## 4. Application Verification

### Before Migration (Error)

**Browser Console:**
```javascript
Error fetching onboarding status: {
  code: 'PGRST205',
  message: "Could not find the table 'public.user_onboarding' in the schema cache"
}

GET /api/onboarding/status 404 Not Found
```

**Dashboard:**
```
⚠️ Onboarding widget not displayed
⚠️ Profile page may show loading errors
```

### After Migration (Success)

**Browser Console:**
```javascript
✅ Onboarding status fetched successfully
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "123e4567-e89b-12d3-a456-426614174000",
  step_1_complete: false,
  step_2_complete: false,
  step_3_complete: false,
  step_4_complete: false,
  step_5_complete: false,
  current_step: 1,
  created_at: "2025-11-15T10:30:00Z"
}

GET /api/onboarding/status 200 OK
```

**Dashboard:**
```
✅ Onboarding wizard appears for new users
✅ Profile page loads without errors
✅ Progress indicators show correct step
```

---

## 5. API Testing

### Test Endpoint: GET `/api/onboarding/status`

**Before Migration:**
```bash
curl http://localhost:3008/api/onboarding/status

Response: 500 Internal Server Error
{
  "error": "Database error",
  "code": "PGRST205",
  "details": "Could not find the table 'public.user_onboarding'"
}
```

**After Migration:**
```bash
curl http://localhost:3008/api/onboarding/status

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "current_step": 1,
  "step_1_complete": false,
  "step_2_complete": false,
  "step_3_complete": false,
  "step_4_complete": false,
  "step_5_complete": false,
  "completed_at": null,
  "skipped": false,
  "created_at": "2025-11-15T10:30:00.000Z",
  "updated_at": "2025-11-15T10:30:00.000Z"
}
```

### Test Endpoint: POST `/api/onboarding/update`

**Request:**
```bash
curl -X POST http://localhost:3008/api/onboarding/update \
  -H "Content-Type: application/json" \
  -d '{
    "step_1_complete": true,
    "current_step": 2
  }'
```

**Success Response:**
```json
{
  "success": true,
  "updated": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "step_1_complete": true,
    "current_step": 2,
    "updated_at": "2025-11-15T10:35:00.000Z"
  }
}
```

---

## 6. Database Query Testing

### Direct Query Success

```sql
-- Query user's onboarding status
SELECT * FROM user_onboarding
WHERE user_id = auth.uid();

Results:
id                                  | 550e8400-e29b-41d4-a716-446655440000
user_id                             | 123e4567-e89b-12d3-a456-426614174000
step_1_complete                     | false
step_2_complete                     | false
step_3_complete                     | false
step_4_complete                     | false
step_5_complete                     | false
completed_at                        | null
skipped                             | false
current_step                        | 1
onboarding_data                     | {}
created_at                          | 2025-11-15 10:30:00+00
updated_at                          | 2025-11-15 10:30:00+00

1 row returned
Time: 0.05s
```

### RLS Policy Test (Security)

```sql
-- Attempt to view another user's onboarding (should fail)
SELECT * FROM user_onboarding
WHERE user_id = '00000000-0000-0000-0000-000000000000';

Results: 0 rows
(RLS policy blocked access to other users' data)
```

---

## Common Warnings (Safe to Ignore)

### 1. Function Already Exists
```
NOTICE:  function "update_user_onboarding_updated_at" already exists, skipping
```
**Meaning:** Trigger function was created on a previous run. This is safe.

### 2. Index Already Exists
```
NOTICE:  relation "idx_user_onboarding_user_id" already exists, skipping
```
**Meaning:** Index was created on a previous run. This is safe.

### 3. Policy Already Exists
```
NOTICE:  policy "Users can view own onboarding" for table "user_onboarding" already exists, skipping
```
**Meaning:** RLS policy was created on a previous run. This is safe.

---

## Troubleshooting Different Outputs

### Output: "permission denied"
**Cause:** Insufficient database permissions
**Fix:** Ensure you're logged in as project owner in Supabase dashboard

### Output: "syntax error near..."
**Cause:** SQL parsing error
**Fix:**
1. Verify you copied the entire script
2. Check for copy/paste corruption
3. Re-copy from original file

### Output: "relation does not exist"
**Cause:** Dependent table missing
**Fix:** Ensure `auth.users` table exists (it should in all Supabase projects)

### Output: Timeout
**Cause:** Supabase project under heavy load
**Fix:** Wait 30 seconds and retry

---

## Success Indicators Checklist

After running migration, verify these indicators:

- [ ] Migration script shows "✅ table created successfully"
- [ ] Verification script shows "✅ ALL CRITICAL CHECKS PASSED"
- [ ] Table visible in Supabase Table Editor
- [ ] Table has 13 columns
- [ ] Table has 2 indexes
- [ ] Table has 3 RLS policies
- [ ] Application loads without "table not found" errors
- [ ] Onboarding API endpoints return 200 OK
- [ ] Can insert/update onboarding records
- [ ] Cannot access other users' onboarding data (RLS test)

---

**If all indicators pass:** ✅ Migration successful!

**If any fail:** See [docs/APPLY_MIGRATIONS.md](APPLY_MIGRATIONS.md) troubleshooting section.
