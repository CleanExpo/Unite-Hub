/**
 * Migration 482: API Key Management (Phase E2)
 *
 * Secure API key management system:
 * - SHA-256 hashed keys (never store raw keys)
 * - Key prefix: uh_ (Unite-Hub)
 * - Scopes array for permissions
 * - Last used tracking
 * - Revocation support
 *
 * Related to: E-Series Security & Governance Foundation
 */

-- ============================================================================
-- API Keys Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Key Details
  name text NOT NULL, -- Human-readable name (e.g. "Production API", "Mobile App")
  key_prefix text NOT NULL, -- First 8 chars of key (e.g. "uh_12345678...")
  key_hash text NOT NULL UNIQUE, -- SHA-256 hash of full key

  -- Permissions
  scopes text[] DEFAULT ARRAY[]::text[], -- e.g. ['read', 'write', 'admin']

  -- Usage Tracking
  last_used_at timestamptz,
  last_used_ip inet,
  usage_count integer DEFAULT 0,

  -- Status
  is_active boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

COMMENT ON TABLE api_keys IS 'API keys for programmatic access with SHA-256 hashing';
COMMENT ON COLUMN api_keys.key_prefix IS 'Visible prefix for key identification (uh_xxxxx...)';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of full API key - never store raw keys';
COMMENT ON COLUMN api_keys.scopes IS 'Permission scopes for this key';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant's API keys
DROP POLICY IF EXISTS "Users can view their tenant API keys" ON api_keys;
CREATE POLICY "Users can view their tenant API keys"
  ON api_keys FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create API keys for their tenant
DROP POLICY IF EXISTS "Users can create API keys" ON api_keys;
CREATE POLICY "Users can create API keys"
  ON api_keys FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can revoke/update their tenant's API keys
DROP POLICY IF EXISTS "Users can update their tenant API keys" ON api_keys;
CREATE POLICY "Users can update their tenant API keys"
  ON api_keys FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;

CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();
