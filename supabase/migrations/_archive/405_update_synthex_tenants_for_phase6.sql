-- Migration 405: Update synthex_tenants table for Phase 6 Multi-Tenant Management
-- This migration adds fields required by Phase 6 while maintaining backward compatibility

-- Rename entity_name to name for clarity
ALTER TABLE synthex_tenants RENAME COLUMN entity_name TO name;

-- Add new columns to synthex_tenants table
ALTER TABLE synthex_tenants
  ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('shopify', 'google-merchant', 'mixed')),
  ADD COLUMN IF NOT EXISTS market TEXT CHECK (market IN ('ANZ_SMB', 'ANZ_ENTERPRISE', 'US_SMB', 'UK_SMB')),
  ADD COLUMN IF NOT EXISTS region TEXT CHECK (region IN ('AU-SE1', 'NZ-NR1', 'US-EA1', 'EU-WE1')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data to new structure
-- Set default type based on existing shopify_shop and google_merchant_id
UPDATE synthex_tenants
SET type = CASE
  WHEN shopify_shop IS NOT NULL AND google_merchant_id IS NOT NULL THEN 'mixed'
  WHEN shopify_shop IS NOT NULL THEN 'shopify'
  WHEN google_merchant_id IS NOT NULL THEN 'google-merchant'
  ELSE 'shopify' -- Default to shopify for tenants with no integrations yet
END
WHERE type IS NULL;

-- Set default market based on country
UPDATE synthex_tenants
SET market = CASE
  WHEN country IN ('AU', 'NZ') THEN 'ANZ_SMB'
  WHEN country = 'US' THEN 'US_SMB'
  WHEN country = 'UK' THEN 'UK_SMB'
  ELSE 'ANZ_SMB' -- Default
END
WHERE market IS NULL;

-- Set default region based on country
UPDATE synthex_tenants
SET region = CASE
  WHEN country = 'AU' THEN 'AU-SE1'
  WHEN country = 'NZ' THEN 'NZ-NR1'
  WHEN country = 'US' THEN 'US-EA1'
  WHEN country = 'UK' THEN 'EU-WE1'
  ELSE 'AU-SE1' -- Default
END
WHERE region IS NULL;

-- Migrate settings to metadata
UPDATE synthex_tenants
SET metadata = jsonb_build_object(
  'shopifyShop', shopify_shop,
  'gmcMerchantId', google_merchant_id,
  'country', country,
  'businessId', business_id
) || COALESCE(settings, '{}'::jsonb)
WHERE metadata = '{}'::jsonb;

-- Make type, market, region NOT NULL after migration
ALTER TABLE synthex_tenants
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN market SET NOT NULL,
  ALTER COLUMN region SET NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_type ON synthex_tenants(type);
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_market ON synthex_tenants(market);
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_region ON synthex_tenants(region);
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_status ON synthex_tenants(status);

-- Add trigger to automatically update metadata when shopify_shop or google_merchant_id changes
CREATE OR REPLACE FUNCTION update_synthex_tenant_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update metadata with shopify_shop if changed
  IF NEW.shopify_shop IS DISTINCT FROM OLD.shopify_shop THEN
    NEW.metadata = jsonb_set(
      NEW.metadata,
      '{shopifyShop}',
      to_jsonb(NEW.shopify_shop),
      true
    );
  END IF;

  -- Update metadata with google_merchant_id if changed
  IF NEW.google_merchant_id IS DISTINCT FROM OLD.google_merchant_id THEN
    NEW.metadata = jsonb_set(
      NEW.metadata,
      '{gmcMerchantId}',
      to_jsonb(NEW.google_merchant_id),
      true
    );
  END IF;

  -- Auto-update type based on integrations
  NEW.type = CASE
    WHEN NEW.shopify_shop IS NOT NULL AND NEW.google_merchant_id IS NOT NULL THEN 'mixed'
    WHEN NEW.shopify_shop IS NOT NULL THEN 'shopify'
    WHEN NEW.google_merchant_id IS NOT NULL THEN 'google-merchant'
    ELSE OLD.type -- Maintain existing type if no integrations
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_synthex_tenant_metadata ON synthex_tenants;
CREATE TRIGGER trigger_update_synthex_tenant_metadata
  BEFORE UPDATE ON synthex_tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_tenant_metadata();

-- Add comment for documentation
COMMENT ON COLUMN synthex_tenants.type IS 'Tenant type: shopify, google-merchant, or mixed (both)';
COMMENT ON COLUMN synthex_tenants.market IS 'Target market: ANZ_SMB, ANZ_ENTERPRISE, US_SMB, UK_SMB';
COMMENT ON COLUMN synthex_tenants.region IS 'Cloud region: AU-SE1 (Sydney), NZ-NR1 (Auckland), US-EA1 (Virginia), EU-WE1 (Ireland)';
COMMENT ON COLUMN synthex_tenants.status IS 'Tenant status: active, inactive, or suspended';
COMMENT ON COLUMN synthex_tenants.metadata IS 'Additional tenant metadata (shopifyShop, gmcMerchantId, industry, website, contact info, etc.)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON synthex_tenants TO authenticated;
