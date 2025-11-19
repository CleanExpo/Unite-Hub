-- Verification Script for Migration 052: Multi-Xero Account Support
-- Run this AFTER executing migration 052 to verify everything works
-- Created: 2025-11-19

-- ============================================================================
-- STEP 1: Force Schema Cache Refresh (per CLAUDE.md)
-- ============================================================================

SELECT * FROM xero_tokens LIMIT 1;
SELECT * FROM operational_expenses LIMIT 1;
SELECT * FROM client_invoices LIMIT 1;

-- ============================================================================
-- STEP 2: Verify New Columns Exist
-- ============================================================================

-- Check xero_tokens columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'xero_tokens'
  AND column_name IN ('account_label', 'tenant_name', 'is_primary')
ORDER BY column_name;

-- Expected output:
-- account_label | text    | YES
-- is_primary    | boolean | YES
-- tenant_name   | text    | YES

-- Check operational_expenses columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'operational_expenses'
  AND column_name = 'xero_tenant_id';

-- Expected output:
-- xero_tenant_id | text | YES

-- Check client_invoices columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'client_invoices'
  AND column_name = 'xero_tenant_id';

-- Expected output:
-- xero_tenant_id | text | YES

-- ============================================================================
-- STEP 3: Verify Constraints and Indexes
-- ============================================================================

-- Check unique constraint
SELECT
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conname = 'xero_tokens_org_tenant_unique';

-- Expected output:
-- xero_tokens_org_tenant_unique | u

-- Check indexes
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_xero_tokens_org_id',
  'idx_operational_expenses_tenant_id',
  'idx_client_invoices_tenant_id'
)
ORDER BY indexname;

-- Expected output:
-- idx_client_invoices_tenant_id      | client_invoices
-- idx_operational_expenses_tenant_id | operational_expenses
-- idx_xero_tokens_org_id             | xero_tokens

-- ============================================================================
-- STEP 4: Verify View Exists
-- ============================================================================

-- Check if xero_accounts_summary view exists
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'xero_accounts_summary';

-- Expected output:
-- xero_accounts_summary | VIEW

-- Test the view (should not error even if no data)
SELECT COUNT(*) AS total_accounts
FROM xero_accounts_summary;

-- Expected output:
-- total_accounts
-- 0 (or number of existing accounts)

-- ============================================================================
-- STEP 5: Verify Data Migration (if you had existing data)
-- ============================================================================

-- Check if existing accounts were marked as primary
SELECT
  organization_id,
  tenant_id,
  account_label,
  tenant_name,
  is_primary,
  connected_at
FROM xero_tokens
ORDER BY organization_id, is_primary DESC, connected_at ASC;

-- Expected behavior:
-- - If you had 1 account per org: is_primary should be true
-- - account_label should be set (either custom or = tenant_name)

-- ============================================================================
-- STEP 6: Test View Query
-- ============================================================================

-- This should work without errors
SELECT
  organization_id,
  tenant_id,
  account_label,
  xero_org_name,
  is_primary,
  total_expenses,
  total_cost,
  total_invoices,
  total_revenue
FROM xero_accounts_summary
ORDER BY organization_id, is_primary DESC;

-- ============================================================================
-- STEP 7: Verify RLS Permissions
-- ============================================================================

-- Check view grants
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'xero_accounts_summary'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- Expected output:
-- authenticated  | SELECT
-- service_role   | SELECT

-- ============================================================================
-- SUCCESS INDICATORS
-- ============================================================================

-- ✅ All columns exist in xero_tokens, operational_expenses, client_invoices
-- ✅ Unique constraint exists on (organization_id, tenant_id)
-- ✅ All indexes created successfully
-- ✅ xero_accounts_summary view exists and is queryable
-- ✅ Existing data migrated (is_primary set for single accounts)
-- ✅ View grants exist for authenticated and service_role

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If columns don't exist:
-- 1. Re-run migration 052
-- 2. Wait 5 minutes for schema cache refresh
-- 3. Run: SELECT * FROM xero_tokens LIMIT 1;
-- 4. Re-check columns

-- If view doesn't exist:
-- 1. Check for SQL errors in Supabase logs
-- 2. Ensure tenant_name column exists before view creation
-- 3. Re-run view creation part of migration

-- If constraint doesn't exist:
-- 1. Check if constraint with different name exists
-- 2. Re-run constraint creation part of migration

-- ============================================================================
-- END VERIFICATION
-- ============================================================================

-- Final status message
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xero_tokens' AND column_name = 'tenant_name')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'xero_accounts_summary')
      AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'xero_tokens_org_tenant_unique')
    THEN '✅ Migration 052 verified successfully - Multi-Xero account support is ready!'
    ELSE '❌ Migration 052 incomplete - check errors above'
  END AS migration_status;
