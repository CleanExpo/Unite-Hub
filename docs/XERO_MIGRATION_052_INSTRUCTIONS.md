# Migration 052: Multi-Xero Account Support - Instructions

**Created**: 2025-11-19
**Status**: Ready to Execute
**Following**: CLAUDE.md migration patterns

---

## Quick Start (Following CLAUDE.md)

### Step 1: Run Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: **SQL Editor**

2. **Execute Migration 052**
   ```sql
   -- Copy entire contents of: supabase/migrations/052_multi_xero_accounts.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```

3. **Wait for Schema Cache Refresh** (per CLAUDE.md)
   - Option A: Wait 1-5 minutes for auto-refresh
   - Option B: Force refresh immediately:
     ```sql
     SELECT * FROM xero_tokens LIMIT 1;
     SELECT * FROM operational_expenses LIMIT 1;
     SELECT * FROM client_invoices LIMIT 1;
     ```

### Step 2: Verify Migration

1. **Run Verification Script**
   ```sql
   -- Copy entire contents of: scripts/verify-xero-multi-account-migration.sql
   -- Paste into SQL Editor
   -- Click "Run"
   ```

2. **Check Final Status**
   - Last query should show: `✅ Migration 052 verified successfully`
   - If shows error, review output and troubleshoot

---

## What This Migration Does

### Database Changes

**1. Adds Columns to `xero_tokens`**:
```sql
account_label TEXT          -- Custom label (e.g., "Main Business")
tenant_name TEXT            -- Xero org name (auto-fetched)
is_primary BOOLEAN          -- Default account for expenses
```

**2. Adds Columns to `operational_expenses`**:
```sql
xero_tenant_id TEXT         -- Which Xero account this expense belongs to
```

**3. Adds Columns to `client_invoices`**:
```sql
xero_tenant_id TEXT         -- Which Xero account the invoice belongs to
```

**4. Creates View `xero_accounts_summary`**:
- Shows all connected Xero accounts
- Aggregates expense totals per account
- Aggregates invoice totals per account

**5. Adds Constraints**:
- Unique constraint: (organization_id, tenant_id)
- Prevents duplicate connections to same Xero org

**6. Creates Indexes**:
- `idx_xero_tokens_org_id` - Fast org lookups
- `idx_operational_expenses_tenant_id` - Fast expense filtering
- `idx_client_invoices_tenant_id` - Fast invoice filtering

**7. Migrates Existing Data**:
- Sets `is_primary = true` for existing single accounts
- Sets `account_label` to tenant name if null

---

## Backward Compatibility

### ✅ Existing Setups Keep Working

**No Breaking Changes**:
- Existing Xero connections remain valid
- All existing expenses preserved
- API endpoints backward compatible
- Single-account setups work unchanged

**Auto-Migration**:
- Your existing account becomes "primary" automatically
- Label set to Xero organization name
- All expenses stay linked to your account

---

## Testing After Migration

### Test 1: Verify Schema

```sql
-- Check columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'xero_tokens'
  AND column_name IN ('account_label', 'tenant_name', 'is_primary');
```

**Expected**: 3 rows returned

### Test 2: Check View

```sql
-- Query the summary view
SELECT * FROM xero_accounts_summary LIMIT 5;
```

**Expected**: No errors (may return 0 rows if no accounts connected)

### Test 3: Verify API (if you have Xero connected)

```bash
# In your terminal
curl http://localhost:3008/api/integrations/xero/status \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Expected Response**:
```json
{
  "connected": true,
  "accounts": [
    {
      "tenantId": "...",
      "accountLabel": "Your Xero Org",
      "isPrimary": true,
      "totalExpenses": 0,
      "totalCost": 0
    }
  ],
  "accountCount": 1
}
```

---

## Troubleshooting

### Issue: "column does not exist: tenant_name"

**Cause**: Migration ran before schema cache refreshed

**Solution**:
```sql
-- Force cache refresh
SELECT * FROM xero_tokens LIMIT 1;

-- Wait 2 minutes, then re-run migration
```

### Issue: "view already exists"

**Cause**: Re-running migration

**Solution**: Already handled! Migration uses `CREATE OR REPLACE VIEW`

### Issue: "constraint already exists"

**Cause**: Re-running migration

**Solution**: Already handled! Migration checks constraint exists before creating

### Issue: Migration shows errors

**Action**:
1. Copy full error message
2. Check which line failed
3. Run only the failed section manually
4. Contact support with error details

---

## Files Modified/Created

### Migration
- ✅ `supabase/migrations/052_multi_xero_accounts.sql` - Main migration

### Verification
- ✅ `scripts/verify-xero-multi-account-migration.sql` - Verification script

### Documentation
- ✅ `docs/XERO_MULTI_ACCOUNT_GUIDE.md` - Complete feature guide
- ✅ `docs/XERO_MIGRATION_052_INSTRUCTIONS.md` - This file

### Backend (Already Complete)
- ✅ `src/lib/accounting/xero-client.ts` - Multi-account support
- ✅ `src/app/api/integrations/xero/status/route.ts` - Returns all accounts
- ✅ `src/app/api/integrations/xero/disconnect/route.ts` - Disconnect per account
- ✅ `src/app/api/integrations/xero/set-primary/route.ts` - Set primary account
- ✅ `src/app/api/integrations/xero/update-label/route.ts` - Update account label

---

## After Migration Success

### Immediate Actions

1. ✅ **Test Current Connection** (if you have one):
   - Visit: http://localhost:3008/dashboard/settings/integrations
   - Verify your Xero account still shows as connected
   - Check no errors appear

2. ✅ **Connect Second Account** (optional):
   - Click "Connect Xero" again
   - Authorize a different Xero organization
   - Verify both accounts appear in API response

3. ✅ **Test Cost Tracking**:
   ```typescript
   // Track expense (goes to primary account)
   await CostTracker.trackExpense({
     organizationId,
     workspaceId,
     expenseType: 'openrouter',
     amount: 0.01
   });

   // Verify in database
   // SELECT * FROM operational_expenses ORDER BY created_at DESC LIMIT 1;
   ```

### Next Steps

**Phase 2.5: Update UI** (Optional):
- Update settings page to show multiple accounts
- Add "Set Primary" button
- Add "Edit Label" functionality
- Add per-account disconnect

**Phase 3: Automated Invoicing** (Future):
- Create invoices in specific Xero accounts
- Sync expenses to correct accounts
- Multi-account invoice workflows

---

## Success Criteria

**You'll know the migration worked when**:

✅ Verification script shows: "Migration 052 verified successfully"
✅ No errors in Supabase SQL Editor
✅ Existing Xero connection (if any) still works
✅ API status endpoint returns `accounts` array
✅ Can track expenses with `xero_tenant_id`
✅ View `xero_accounts_summary` is queryable

---

## Support

**If you encounter issues**:

1. **Check Supabase Logs**:
   - Dashboard → Logs → SQL Logs
   - Look for migration errors

2. **Run Verification**:
   ```bash
   # In Supabase SQL Editor
   # Run: scripts/verify-xero-multi-account-migration.sql
   ```

3. **Review Documentation**:
   - See: `docs/XERO_MULTI_ACCOUNT_GUIDE.md`
   - See: `CLAUDE.md` (Section 6: Database Schema Migrations)

4. **Common Errors Reference**:
   - `column does not exist` → Force cache refresh
   - `view already exists` → Normal, migration handles it
   - `constraint already exists` → Normal, migration handles it

---

## Summary

**Migration 052** enables multi-Xero account support, allowing you to:
- Connect unlimited Xero organizations
- Track expenses per business/subsidiary
- Manage multiple accounts from one interface
- View consolidated or per-account financials

**Backward Compatible**: Existing setups keep working with zero changes required.

**Next**: Run migration → Verify → Start connecting multiple Xero accounts! 🚀

---

**Last Updated**: 2025-11-19
**Status**: ✅ Ready to Execute
**Following**: CLAUDE.md migration patterns
