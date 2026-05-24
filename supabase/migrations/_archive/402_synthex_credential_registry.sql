/**
 * Synthex Credential Registry Migration
 *
 * Creates tables for tracking OAuth credentials stored in Google Secret Manager
 *
 * Tables:
 * - credential_registry: Tracks all service credentials
 * - synthex_tenants: Multi-tenant client configuration
 * - business_validations: Cached business ID validations
 */

-- ============================================================================
-- 1. CREDENTIAL REGISTRY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS credential_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('shopify', 'google-merchant', 'facebook-ads', 'tiktok-ads')),
  secret_name TEXT NOT NULL, -- Google Secret Manager path
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, service)
);

-- Indexes for credential_registry
CREATE INDEX IF NOT EXISTS idx_credential_registry_workspace ON credential_registry(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credential_registry_service ON credential_registry(service);
CREATE INDEX IF NOT EXISTS idx_credential_registry_expires ON credential_registry(expires_at);
CREATE INDEX IF NOT EXISTS idx_credential_registry_tenant ON credential_registry(tenant_id);

-- RLS policies for credential_registry
ALTER TABLE credential_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credentials in their workspace"
  ON credential_registry FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert credentials in their workspace"
  ON credential_registry FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update credentials in their workspace"
  ON credential_registry FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete credentials in their workspace"
  ON credential_registry FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- 2. SYNTHEX TENANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL UNIQUE,
  entity_name TEXT NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('AU', 'NZ', 'US', 'UK')),
  business_id TEXT, -- ABN, NZBN, EIN, etc.
  shopify_shop TEXT, -- myshopify.com domain
  google_merchant_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for synthex_tenants
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_workspace ON synthex_tenants(workspace_id);
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_country ON synthex_tenants(country);
CREATE INDEX IF NOT EXISTS idx_synthex_tenants_tenant_id ON synthex_tenants(tenant_id);

-- RLS policies for synthex_tenants
ALTER TABLE synthex_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenants in their workspace"
  ON synthex_tenants FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert tenants in their workspace"
  ON synthex_tenants FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update tenants in their workspace"
  ON synthex_tenants FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tenants in their workspace"
  ON synthex_tenants FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id
    FROM user_workspaces
    WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- 3. BUSINESS VALIDATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL CHECK (country IN ('AU', 'NZ')),
  business_id TEXT NOT NULL,
  entity_name TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'cancelled')),
  gst_registered BOOLEAN,
  registered_date DATE,
  validation_source TEXT CHECK (validation_source IN ('ABR', 'NZBN', 'manual')),
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country, business_id)
);

-- Indexes for business_validations
CREATE INDEX IF NOT EXISTS idx_business_validations_lookup ON business_validations(country, business_id);
CREATE INDEX IF NOT EXISTS idx_business_validations_expires ON business_validations(expires_at);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on credential_registry
CREATE OR REPLACE FUNCTION update_credential_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_credential_registry_updated_at
  BEFORE UPDATE ON credential_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_credential_registry_updated_at();

-- Update updated_at timestamp on synthex_tenants
CREATE OR REPLACE FUNCTION update_synthex_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_synthex_tenants_updated_at
  BEFORE UPDATE ON synthex_tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_tenants_updated_at();

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Get credential by tenant and service
CREATE OR REPLACE FUNCTION get_credential(
  p_tenant_id TEXT,
  p_service TEXT
)
RETURNS TABLE (
  id UUID,
  secret_name TEXT,
  scopes TEXT[],
  expires_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.secret_name,
    cr.scopes,
    cr.expires_at,
    (cr.expires_at IS NOT NULL AND cr.expires_at < NOW()) AS is_expired
  FROM credential_registry cr
  WHERE cr.tenant_id = p_tenant_id
    AND cr.service = p_service
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List all tenants with their credentials
CREATE OR REPLACE FUNCTION list_tenant_credentials(
  p_workspace_id UUID
)
RETURNS TABLE (
  tenant_id TEXT,
  entity_name TEXT,
  country TEXT,
  shopify_authenticated BOOLEAN,
  google_merchant_authenticated BOOLEAN,
  shopify_expires_at TIMESTAMPTZ,
  google_expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.tenant_id,
    st.entity_name,
    st.country,
    EXISTS(SELECT 1 FROM credential_registry WHERE tenant_id = st.tenant_id AND service = 'shopify') AS shopify_authenticated,
    EXISTS(SELECT 1 FROM credential_registry WHERE tenant_id = st.tenant_id AND service = 'google-merchant') AS google_merchant_authenticated,
    (SELECT expires_at FROM credential_registry WHERE tenant_id = st.tenant_id AND service = 'shopify' LIMIT 1) AS shopify_expires_at,
    (SELECT expires_at FROM credential_registry WHERE tenant_id = st.tenant_id AND service = 'google-merchant' LIMIT 1) AS google_expires_at
  FROM synthex_tenants st
  WHERE st.workspace_id = p_workspace_id
  ORDER BY st.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE credential_registry IS 'Tracks OAuth credentials stored in Google Secret Manager';
COMMENT ON COLUMN credential_registry.secret_name IS 'Full path to secret in Google Secret Manager';
COMMENT ON COLUMN credential_registry.tenant_id IS 'Client tenant identifier (unique per client)';
COMMENT ON COLUMN credential_registry.service IS 'Service type: shopify, google-merchant, facebook-ads, tiktok-ads';

COMMENT ON TABLE synthex_tenants IS 'Multi-tenant client configuration for Synthex';
COMMENT ON COLUMN synthex_tenants.tenant_id IS 'Unique tenant identifier (e.g., SMB_CLIENT_001)';
COMMENT ON COLUMN synthex_tenants.business_id IS 'ABN (AU), NZBN (NZ), EIN (US), or Company Number (UK)';

COMMENT ON TABLE business_validations IS 'Cached business ID validation results (24h TTL)';
COMMENT ON COLUMN business_validations.validation_source IS 'ABR (Australian Business Register) or NZBN (NZ Business Number)';
