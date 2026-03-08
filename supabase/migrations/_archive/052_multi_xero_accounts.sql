-- Migration 052: Multi-Xero Account Support
-- Allow users to connect multiple Xero organizations
-- Created: 2025-11-19
--
-- This migration extends the Xero integration to support multiple accounts
-- per organization (e.g., one Xero account per business/subsidiary)

-- ============================================================================
-- 1. UPDATE XERO_TOKENS TABLE SCHEMA
-- ============================================================================

-- Add label, tenant_name, and is_primary columns to xero_tokens
ALTER TABLE xero_tokens
  ADD COLUMN IF NOT EXISTS account_label TEXT,
  ADD COLUMN IF NOT EXISTS tenant_name TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Drop old UNIQUE constraint on organization_id (from migration 050)
-- This allows multiple Xero accounts per organization
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'xero_tokens_organization_id_key'
  ) THEN
    ALTER TABLE xero_tokens DROP CONSTRAINT xero_tokens_organization_id_key;
  END IF;
END $$;

-- Add new unique constraint on (organization_id, tenant_id)
-- This prevents duplicate connections to the same Xero organization
-- but allows multiple different Xero orgs per Unite-Hub organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'xero_tokens_org_tenant_unique'
  ) THEN
    ALTER TABLE xero_tokens
      ADD CONSTRAINT xero_tokens_org_tenant_unique
      UNIQUE (organization_id, tenant_id);
  END IF;
END $$;

-- Add index for faster queries by organization
CREATE INDEX IF NOT EXISTS idx_xero_tokens_org_id
  ON xero_tokens(organization_id);

-- ============================================================================
-- 2. UPDATE OPERATIONAL_EXPENSES TABLE
-- ============================================================================

-- Add xero_tenant_id column to track which Xero account each expense belongs to
-- This allows proper expense allocation when multiple Xero accounts exist
ALTER TABLE operational_expenses
  ADD COLUMN IF NOT EXISTS xero_tenant_id TEXT;

-- Add foreign key constraint (optional - helps with data integrity)
-- Note: This is a soft FK since tenant_id is not the PK of xero_tokens
CREATE INDEX IF NOT EXISTS idx_operational_expenses_tenant_id
  ON operational_expenses(xero_tenant_id);

-- ============================================================================
-- 3. UPDATE CLIENT_INVOICES TABLE
-- ============================================================================

-- Add xero_tenant_id to track which Xero account the invoice belongs to
ALTER TABLE client_invoices
  ADD COLUMN IF NOT EXISTS xero_tenant_id TEXT;

CREATE INDEX IF NOT EXISTS idx_client_invoices_tenant_id
  ON client_invoices(xero_tenant_id);

-- ============================================================================
-- 4. CREATE HELPER VIEW FOR MULTI-ACCOUNT SUMMARY
-- ============================================================================

-- View: xero_accounts_summary
-- Shows all connected Xero accounts with their expense totals
CREATE OR REPLACE VIEW xero_accounts_summary AS
SELECT
  xt.organization_id,
  xt.tenant_id,
  xt.account_label,
  xt.is_primary,
  xt.tenant_name AS xero_org_name,
  xt.created_at,
  xt.updated_at,
  xt.expires_at,
  COUNT(DISTINCT oe.id) AS total_expenses,
  COALESCE(SUM(oe.amount), 0) AS total_cost,
  COUNT(DISTINCT ci.id) AS total_invoices,
  COALESCE(SUM(ci.amount), 0) AS total_revenue
FROM xero_tokens xt
LEFT JOIN operational_expenses oe
  ON xt.organization_id = oe.organization_id
  AND xt.tenant_id = oe.xero_tenant_id
LEFT JOIN client_invoices ci
  ON xt.organization_id = ci.organization_id
  AND xt.tenant_id = ci.xero_tenant_id
GROUP BY
  xt.organization_id,
  xt.tenant_id,
  xt.account_label,
  xt.is_primary,
  xt.tenant_name,
  xt.created_at,
  xt.updated_at,
  xt.expires_at;

-- Grant access to authenticated users
GRANT SELECT ON xero_accounts_summary TO authenticated;
GRANT SELECT ON xero_accounts_summary TO service_role;

-- ============================================================================
-- 5. UPDATE RLS POLICIES
-- ============================================================================

-- Note: Existing RLS policies on xero_tokens already filter by organization_id
-- No changes needed - policies automatically work with multiple accounts

-- ============================================================================
-- 6. DATA MIGRATION (if needed)
-- ============================================================================

-- Set is_primary = true for existing single accounts
UPDATE xero_tokens
SET is_primary = true
WHERE organization_id IN (
  SELECT organization_id
  FROM xero_tokens
  GROUP BY organization_id
  HAVING COUNT(*) = 1
)
AND is_primary IS NULL;

-- Set default account labels for existing accounts (if null)
UPDATE xero_tokens
SET account_label = tenant_name
WHERE account_label IS NULL;

-- ============================================================================
-- 7. VERIFY MIGRATION
-- ============================================================================

-- Test query: View all Xero accounts for an organization
-- SELECT * FROM xero_accounts_summary WHERE organization_id = 'your-org-id';

-- Test query: Check primary account
-- SELECT * FROM xero_tokens WHERE organization_id = 'your-org-id' AND is_primary = true;

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. Each organization can now connect multiple Xero accounts
-- 2. One account should be marked as "primary" (default for new expenses)
-- 3. account_label helps users identify different businesses (e.g., "Main Business", "Subsidiary A")
-- 4. xero_tenant_id in expenses/invoices tracks which account they belong to
-- 5. When creating expenses, specify xero_tenant_id to allocate to specific account
-- 6. If xero_tenant_id is null, expense goes to primary account (backward compatible)
--
-- Example use cases:
-- - Company with multiple subsidiaries (each with own Xero account)
-- - Holding company tracking costs across portfolio companies
-- - Franchisee managing multiple franchise locations
-- - Agency tracking costs per client's Xero account
--
-- ============================================================================
-- END MIGRATION 052
-- ============================================================================;
